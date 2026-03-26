const db = require('../config/db');

class TradeModel {
    static getRecentTradesByUserId(userId, limit, callback) {
        db.all(
            'SELECT * FROM trades WHERE user_id = ? ORDER BY rowid DESC LIMIT ?', 
            [userId, limit], 
            callback
        );
    }

    static insertTrade(id, userId, pair, type, entry, lots, margin, date, status, stopLoss, takeProfit, callback) {
        db.run(
            'INSERT INTO trades (id, user_id, pair, type, entry, lots, margin, date, status, stop_loss, take_profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [id, userId, pair, type, entry, lots, margin, date, status, stopLoss, takeProfit], 
            callback
        );
    }

    static getTradeById(tradeId, userId, callback) {
        db.get('SELECT * FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId], callback);
    }

    static updateTradeStatus(tradeId, status, pnl, callback) {
        const closedAt = new Date().toLocaleTimeString();
        db.run(
            'UPDATE trades SET status = ?, pnl = ?, closed_at = ? WHERE id = ?',
            [status, pnl, closedAt, tradeId],
            callback
        );
    }

    static getAllByUserId(userId, callback) {
        db.all('SELECT * FROM trades WHERE user_id = ?', [userId], callback);
    }
}

module.exports = TradeModel;
