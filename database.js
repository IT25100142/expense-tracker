const sqlite3 = require('sqlite3').verbose();

// Connect to (or create) the database file
const db = new sqlite3.Database('./expenses.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("✅ Connected to the SQLite database.");

        // Create table with the new 'spent_with' column
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            amount REAL,
            currency TEXT,
            category TEXT,
            spent_with TEXT,
            date TEXT
        )`, (err) => {
            if (err) {
                console.log("Error creating table: " + err);
            }
        });
    }
});

module.exports = db;