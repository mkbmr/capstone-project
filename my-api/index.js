require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your React frontend to connect
app.use(express.json()); // Allows the API to parse JSON bodies

// Database Configuration
// Replace with the credentials you created in SSMS
const dbConfig = {
    user: process.env.DB_USER || 'api_user', 
    password: process.env.DB_PASSWORD || 'your_password',
    server: 'localhost\\SQLEXPRESS', // Note the double backslash for escape char
    database: 'master', // Or the name of your specific database
    options: {
        encrypt: false, // For local dev
        trustServerCertificate: true // Trust self-signed certificate
    }
};

// Route: Test Database Connection
app.get('/api/test-db', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT @@VERSION AS version');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Basic Health Check Route
app.get('/', (req, res) => {
    res.send('API is running successfully!');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});