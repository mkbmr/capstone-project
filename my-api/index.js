const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const config = require('./config'); // Importing your db settings

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add this to index.js
app.get('/', (req, res) => {
    res.send('Maison Aura API is running.');
});

// Registration Route
app.post('/api/register', async (req, res) => {
    // 1. Extract phone from the request
    const { full_name, email, password, phone } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        let pool = await sql.connect(config);
        console.log("Attempting SQL insert with:", { full_name, email, phone });

        // 2. Update the SQL query
        await pool.request()
            .input('name', sql.VarChar, full_name)
            .input('email', sql.VarChar, email)
            .input('hash', sql.VarChar, hashedPassword)
            .input('phone', sql.VarChar, phone) // New input
            .query('INSERT INTO Customers (full_name, email, password_hash, phone) VALUES (@name, @email, @hash, @phone)');
            
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Registration failed." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Customers WHERE email = @email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "User not found." });
        }

        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            res.json({ message: "Login successful", user: { name: user.full_name } });
        } else {
            res.status(401).json({ error: "Incorrect password." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Maison Aura API running on port ${PORT}`));