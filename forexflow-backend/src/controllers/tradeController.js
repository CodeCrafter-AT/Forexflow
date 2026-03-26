const db = require('../config/db');
const UserModel = require('../models/userModel');
const TradeModel = require('../models/tradeModel');

// Dynamic sizing mapper for Crypto vs Fiat
const getContractSize = (pair) => {
    if (pair.startsWith('BTC')) return 1;
    if (pair.startsWith('XAU')) return 100;
    return 100000;
};

/**
 * STOP-OUT GUARD — Institutional margin call check.
 * If margin level drops to or below 50%, all positions should be force-closed.
 * @returns {{ marginLevel: number, isStopped: boolean }}
 */
const checkMarginCall = (balance, openTrades) => {
    const usedMargin  = openTrades.reduce((sum, t) => sum + (t.margin || 0), 0);
    // Equity = free cash + capital locked in open positions
    const equity      = balance + usedMargin;
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : Infinity;

    if (marginLevel <= 50) {
        console.warn(`[STOP-OUT] Margin level critical: ${marginLevel.toFixed(1)}% ≤ 50%. Force-close required.`);
        return { marginLevel, isStopped: true };
    }
    return { marginLevel, isStopped: false };
};

// ─────────────────────────────────────────────
// EXECUTE TRADE  →  POST /api/trades/portfolio/:username/trade
// ─────────────────────────────────────────────
exports.executeTrade = (req, res) => {
    const username = req.params.username;
    const { id, pair, type, entry, lots, margin, date, status, stopLoss, takeProfit } = req.body;

    // Validation middleware handles field checks; extra server-side guard
    if (margin <= 0) return res.status(400).json({ error: 'Margin must be greater than zero.' });

    UserModel.getUserByUsername(username, (err, user) => {
        if (err)   return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        if (user.balance < margin) {
            return res.status(400).json({
                error: `Insufficient margin. Required: $${margin.toFixed(2)}, Available: $${user.balance.toFixed(2)}`
            });
        }

        // Check for Stop-Out before accepting any new position
        TradeModel.getAllByUserId(user.id, (err, allTrades) => {
            if (err) return res.status(500).json({ error: err.message });

            const openTrades = allTrades.filter(t => t.status === 'OPEN');
            const { isStopped, marginLevel } = checkMarginCall(user.balance, openTrades);

            if (isStopped) {
                return res.status(400).json({
                    error: `STOP-OUT: Margin level at ${marginLevel.toFixed(1)}%. Close open positions before opening new ones.`,
                    marginLevel
                });
            }

            const newBalance = parseFloat((user.balance - margin).toFixed(2));

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                UserModel.updateUserBalance(user.id, newBalance, err => {
                    if (err) return db.run('ROLLBACK', () => res.status(500).json({ error: err.message }));

                    TradeModel.insertTrade(id, user.id, pair, type, entry, lots, margin, date, status, stopLoss || 0, takeProfit || 0, err => {
                        if (err) return db.run('ROLLBACK', () => res.status(500).json({ error: err.message }));

                        db.run('COMMIT', () => res.json({
                            success: true,
                            newBalance,
                            trade: { id, pair, type, entry, lots, margin, status: 'OPEN', stopLoss: stopLoss || 0, takeProfit: takeProfit || 0 }
                        }));
                    });
                });
            });
        });
    });
};

// ─────────────────────────────────────────────
// CLOSE TRADE  →  PUT /api/trades/portfolio/:username/trade/close
// ─────────────────────────────────────────────
exports.closeTrade = (req, res) => {
    const username = req.params.username;
    const { tradeId, currentPrice } = req.body;

    if (!tradeId)      return res.status(400).json({ error: 'Missing tradeId.' });
    if (!currentPrice || typeof currentPrice !== 'number' || currentPrice <= 0) {
        return res.status(400).json({ error: 'currentPrice must be a positive number.' });
    }

    UserModel.getUserByUsername(username, (err, user) => {
        if (err)   return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        TradeModel.getTradeById(tradeId, user.id, (err, trade) => {
            if (err)    return res.status(500).json({ error: err.message });
            if (!trade) return res.status(404).json({ error: 'Trade not found.' });
            if (trade.status === 'CLOSED') {
                return res.status(400).json({ error: 'Trade is already closed.' });
            }

            // PnL Direction:
            //   BUY  → profit when currentPrice > entry (long position)
            //   SELL → profit when currentPrice < entry (short position)
            const priceDiff = trade.type === 'BUY'
                ? currentPrice - trade.entry
                : trade.entry  - currentPrice;

            // Raw PnL in base currency = price move × (lots × contract size)
            const contractSize = getContractSize(trade.pair);
            const rawPnl = parseFloat((priceDiff * (trade.lots * contractSize)).toFixed(2));

            // Unlock margin and apply PnL to wallet
            const newBalance = parseFloat((user.balance + trade.margin + rawPnl).toFixed(2));

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                UserModel.updateUserBalance(user.id, newBalance, (err) => {
                    if (err) return db.run('ROLLBACK', () => res.status(500).json({ error: err.message }));

                    TradeModel.updateTradeStatus(trade.id, 'CLOSED', rawPnl, (err) => {
                        if (err) return db.run('ROLLBACK', () => res.status(500).json({ error: err.message }));

                        db.run('COMMIT', () => res.json({
                            success: true,
                            newBalance,
                            pnl:    rawPnl,
                            result: rawPnl >= 0 ? 'WIN' : 'LOSS',
                            status: 'CLOSED'
                        }));
                    });
                });
            });
        });
    });
};

// ─────────────────────────────────────────────
// GET STATS  →  GET /api/trades/stats/:username
// ─────────────────────────────────────────────
exports.getStats = (req, res) => {
    const username = req.params.username;

    UserModel.getUserByUsername(username, (err, user) => {
        if (err)   return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        TradeModel.getAllByUserId(user.id, (err, trades) => {
            if (err) return res.status(500).json({ error: err.message });

            const openTrades   = trades.filter(t => t.status === 'OPEN');
            const closedTrades = trades.filter(t => t.status === 'CLOSED');

            // Net PnL — only valid now that pnl is stored in DB
            const netPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            // Real win rate — trades with pnl > 0 are wins
            const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
            const winRate = closedTrades.length > 0
                ? ((winningTrades / closedTrades.length) * 100).toFixed(1)
                : 0;

            // Capital currently locked in open positions
            const lockedMargin = openTrades.reduce((sum, t) => sum + (t.margin || 0), 0);

            // Best and worst single trades
            const bestTrade  = closedTrades.reduce((best, t)  => (!best || t.pnl > best.pnl) ? t : best,  null);
            const worstTrade = closedTrades.reduce((worst, t) => (!worst || t.pnl < worst.pnl) ? t : worst, null);

            // Most frequently traded pair
            const pairFreq = {};
            trades.forEach(t => { pairFreq[t.pair] = (pairFreq[t.pair] || 0) + 1; });
            const favouritePair = Object.keys(pairFreq)
                .sort((a, b) => pairFreq[b] - pairFreq[a])[0] || 'N/A';

            // Account Health = live balance + all locked margin
            const accountHealth = user.balance + lockedMargin;

            res.json({
                success: true,
                stats: {
                    balance:       parseFloat(user.balance.toFixed(2)),
                    accountHealth: parseFloat(accountHealth.toFixed(2)),
                    netPnl:        parseFloat(netPnl.toFixed(2)),
                    totalTrades:   trades.length,
                    openTrades:    openTrades.length,
                    closedTrades:  closedTrades.length,
                    winningTrades,
                    losingTrades:  closedTrades.length - winningTrades,
                    winRate:       `${winRate}%`,
                    lockedMargin:  parseFloat(lockedMargin.toFixed(2)),
                    favouritePair,
                    bestTrade:     bestTrade  ? { pair: bestTrade.pair,  pnl: bestTrade.pnl }  : null,
                    worstTrade:    worstTrade ? { pair: worstTrade.pair, pnl: worstTrade.pnl } : null,
                }
            });
        });
    });
};
