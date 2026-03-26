const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ensure database sits where it will not throw an error if called from different cwd
const dbPath = path.resolve(__dirname, '../../forex.db'); 
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        db.serialize(() => {
            // Create user portfolio table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance REAL DEFAULT 1000000.0,
                leverage INTEGER DEFAULT 500,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                active_base TEXT DEFAULT 'EUR',
                active_target TEXT DEFAULT 'USD'
            )`, (err) => {
                if (err) console.error("Error creating users table", err);
                
                // Safely add columns to existing DBs (migration)
                db.run(`ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN leverage INTEGER DEFAULT 500`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, () => {});
                
                // Initialize default user if not exists
                db.get(`SELECT id FROM users WHERE username = 'trader1'`, (err, row) => {
                    if (!row) {
                        db.run(`INSERT INTO users (username, password, balance) VALUES ('trader1', 'dummy', 1000000.0)`);
                    }
                });
            });

            // Create trades history table
            db.run(`CREATE TABLE IF NOT EXISTS trades (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                pair TEXT,
                type TEXT,
                entry REAL,
                lots REAL,
                margin REAL,
                date TEXT,
                status TEXT DEFAULT 'OPEN',
                pnl REAL DEFAULT 0,
                closed_at TEXT,
                stop_loss REAL DEFAULT 0,
                take_profit REAL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (err) => {
                if (err) console.error("Error creating trades table", err);

                // Safely add pnl + closed_at columns to existing DBs (migration)
                db.run(`ALTER TABLE trades ADD COLUMN pnl REAL DEFAULT 0`, () => {});
                db.run(`ALTER TABLE trades ADD COLUMN closed_at TEXT`, () => {});
                
                db.run(`ALTER TABLE trades ADD COLUMN stop_loss REAL DEFAULT 0`, () => {});
                db.run(`ALTER TABLE trades ADD COLUMN take_profit REAL DEFAULT 0`, () => {});
            });
        });
    }
});

module.exports = db;
