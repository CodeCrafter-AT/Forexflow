import React, { useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarketData } from '../hooks/useMarketData';

const PairWatcher = ({ base, target }) => {
    const { prices } = useMarketData(base, target, 30); // Polls safely every 30s
    const { tradeHistory, closeOpenTrade } = usePortfolio();

    useEffect(() => {
        if (!prices || !prices.mid) return;

        const pairName = `${base}/${target}`;
        const openTrades = tradeHistory.filter(t => t.status === 'OPEN' && t.pair === pairName);

        openTrades.forEach(trade => {
            const currentPrice = trade.type === 'BUY' ? prices.bid : prices.ask;
            // Fallback to mid if spread calculation missing
            const executePrice = currentPrice || prices.mid;

            if (!executePrice) return;

            const isBuy = trade.type === 'BUY';

            // Check Stop Loss
            if (trade.stopLoss > 0) {
                if (isBuy && executePrice <= trade.stopLoss) {
                    console.warn(`[HEARTBEAT] Stop Loss triggered for ${trade.id} at ${executePrice}`);
                    closeOpenTrade(trade.id, executePrice);
                } else if (!isBuy && executePrice >= trade.stopLoss) {
                    console.warn(`[HEARTBEAT] Stop Loss triggered for ${trade.id} at ${executePrice}`);
                    closeOpenTrade(trade.id, executePrice);
                }
            }

            // Check Take Profit
            if (trade.takeProfit > 0) {
                if (isBuy && executePrice >= trade.takeProfit) {
                    console.log(`[HEARTBEAT] Take Profit triggered for ${trade.id} at ${executePrice}`);
                    closeOpenTrade(trade.id, executePrice);
                } else if (!isBuy && executePrice <= trade.takeProfit) {
                    console.log(`[HEARTBEAT] Take Profit triggered for ${trade.id} at ${executePrice}`);
                    closeOpenTrade(trade.id, executePrice);
                }
            }
        });
    }, [prices, tradeHistory, base, target, closeOpenTrade]);

    return null; // Invisible background watcher
};

const GlobalRiskWatcher = () => {
    const { tradeHistory, user, isLoaded } = usePortfolio();
    
    // Only mount watchers if user is fully loaded and logged in
    if (!user) return null;

    const openTrades = tradeHistory.filter(t => t.status === 'OPEN');
    // Get unique asset pairs that have active trades
    const uniquePairs = [...new Set(openTrades.map(t => t.pair))];

    return (
        <>
            {uniquePairs.map(pair => {
                const [base, target] = pair.split('/');
                return <PairWatcher key={pair} base={base} target={target} />
            })}
        </>
    );
};

export default GlobalRiskWatcher;
