const express = require('express');
const cors = require('cors');
const db = require("./database.js");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Show the website files

// --- ROUTES ---

// 1. GET all expenses
app.get("/api/expenses", (req, res) => {
    const sql = "SELECT * FROM expenses ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

// 2. POST a new expense (Updated for 'spent_with')
app.post("/api/expenses", (req, res) => {
    const { description, amount, currency, category, spent_with, date } = req.body;
    
    const sql = "INSERT INTO expenses (description, amount, currency, category, spent_with, date) VALUES (?,?,?,?,?,?)";
    const params = [description, amount, currency, category, spent_with, date];
    
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": this.lastID });
    });
});

// 3. DELETE an expense
app.delete("/api/expenses/:id", (req, res) => {
    const sql = "DELETE FROM expenses WHERE id = ?";
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});