const db = require('../config/db');

class UserModel {
    static getUserByUsername(username, callback) {
        db.get('SELECT * FROM users WHERE username = ?', [username], callback);
    }

    static getUserById(id, callback) {
        db.get('SELECT id, balance FROM users WHERE id = ?', [id], callback);
    }

    static updateActiveSymbol(username, base, target, callback) {
        db.run(
            'UPDATE users SET active_base = ?, active_target = ? WHERE username = ?', 
            [base, target, username], 
            callback
        );
    }

    static updateUserBalance(id, newBalance, callback) {
        db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, id], callback);
    }
}

module.exports = UserModel;
