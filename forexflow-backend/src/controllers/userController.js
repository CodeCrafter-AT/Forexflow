const UserModel = require('../models/userModel');
const TradeModel = require('../models/tradeModel');

exports.getPortfolio = (req, res) => {
    const username = req.params.username;

    UserModel.getUserByUsername(username, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        TradeModel.getRecentTradesByUserId(user.id, 50, (err, trades) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                user: {
                    balance: user.balance,
                    activeSymbol: {
                        base: user.active_base,
                        target: user.active_target
                    }
                },
                trades: trades
            });
        });
    });
};

exports.updateSymbol = (req, res) => {
    const username = req.params.username;
    const { base, target } = req.body;

    UserModel.updateActiveSymbol(username, base, target, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};

exports.resetAccount = (req, res) => {
    const username = req.params.username;
    UserModel.getUserByUsername(username, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        UserModel.updateUserBalance(user.id, 100000, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, newBalance: 100000 });
        });
    });
};
