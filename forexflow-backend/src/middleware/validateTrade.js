const validateTrade = (req, res, next) => {
    const { id, pair, type, entry, lots, margin, stopLoss, takeProfit } = req.body;


    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing trade id.' });
    }
    const allowedSymbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD'];

    if (!pair || typeof pair !== 'string' || !allowedSymbols.includes(pair)) {
        return res.status(400).json({ error: `Invalid or missing pair. Allowed: ${allowedSymbols.join(', ')}` });
    }
    if (!['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({ error: 'Trade type must be BUY or SELL.' });
    }
    if (typeof entry !== 'number' || entry <= 0) {
        return res.status(400).json({ error: 'Entry price must be a positive number.' });
    }
    if (typeof lots !== 'number' || lots <= 0) {
        return res.status(400).json({ error: 'Lot size must be a positive number.' });
    }
    if (typeof margin !== 'number' || margin <= 0) {
        return res.status(400).json({ error: 'Margin must be a positive number.' });
    }

    if (stopLoss !== undefined && typeof stopLoss !== 'number') {
        return res.status(400).json({ error: 'Stop Loss must be a number.' });
    }
    if (takeProfit !== undefined && typeof takeProfit !== 'number') {
        return res.status(400).json({ error: 'Take Profit must be a number.' });
    }

    next();
};

module.exports = validateTrade;
