const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const config = require('./config'); // Ensure this has your SQL connection details

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQL Connection Pool once
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('Database Connection Failed! Bad Config: ', err));

// --- API ENDPOINTS ---

// 1. Get all products from SQL
app.get('/api/products', async (req, res) => {
  try {
    const pool = await poolPromise;
    // Assuming your table is named 'Products'
    const result = await pool.request().query('SELECT * FROM Products');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// 2. Registration Route
app.post('/api/register', async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;
    await pool.request()
      .input('name', sql.VarChar, full_name)
      .input('email', sql.VarChar, email)
      .input('hash', sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone)
      .query('INSERT INTO Customers (full_name, email, password_hash, phone) VALUES (@name, @email, @hash, @phone)');
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed." });
  }
});

// 3. Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
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

app.get('/', (req, res) => res.send('Maison Aura API is running.'));

const PORT = 5000;
app.listen(PORT, () => console.log(`Maison Aura API running on port ${PORT}`));