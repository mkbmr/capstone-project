require('dotenv').config(); // ← MUST be first line
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const config = require('./config');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// ⚠️ Webhook MUST be BEFORE app.use(express.json())
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  const email         = session.customer_details?.email;
  const name          = session.customer_details?.name;
  const phone         = session.customer_details?.phone;

  // ← check shipping_details first, fall back to customer_details
  const shipping_name = session.shipping_details?.name 
                     ?? session.customer_details?.name;
  const address       = session.shipping_details?.address 
                     ?? session.customer_details?.address;

  const total = session.amount_total / 100;

  console.log('Session data:', JSON.stringify(session, null, 2)); // ← add this to debug

    try {
      const pool = await poolPromise;
      await pool.request()
        .input('email',   sql.NVarChar, email)
        .input('name',    sql.NVarChar, name)
        .input('phone',   sql.NVarChar, phone)           // ← added
        .input('sname',   sql.NVarChar, shipping_name)
        .input('line1',   sql.NVarChar, address?.line1)
        .input('line2',   sql.NVarChar, address?.line2)
        .input('city',    sql.NVarChar, address?.city)
        .input('state',   sql.NVarChar, address?.state)
        .input('postal',  sql.NVarChar, address?.postal_code)
        .input('country', sql.NVarChar, address?.country)
        .input('total',   sql.Decimal,  total)
        .input('session', sql.NVarChar, session.id)
        .query(`
          INSERT INTO Orders 
            (customer_email, customer_name, phone, shipping_name, shipping_line1, shipping_line2,
             shipping_city, shipping_state, shipping_postal, shipping_country, total_amount, stripe_session_id)
          VALUES
            (@email, @name, @phone, @sname, @line1, @line2, @city, @state, @postal, @country, @total, @session)
        `);
      console.log('Order saved for:', email);
    } catch (err) {
      console.error('Failed to save order:', err.message);
    }
  }

  res.json({ received: true });
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQL Connection Pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('Database Connection Failed! Bad Config: ', err));

// --- API ENDPOINTS ---

// Checkout
app.post('/api/checkout', async (req, res) => {
  const { cartItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      customer_creation: 'always',              // ← force email collection

      billing_address_collection: 'required',   // ← force billing address

      shipping_address_collection: {
        allowed_countries: ['SG', 'US', 'GB', 'AU', 'CA', 'FR', 'IT', 'JP'],
      },

      phone_number_collection: {
        enabled: true,                          // ← force phone number
      },

      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Complimentary White-Glove Delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
      ],

      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: `${item.color} / ${item.cut} / Size ${item.size}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),

      success_url: 'http://localhost:5173/?view=SUCCESS',
      cancel_url:  'http://localhost:5173/',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Products');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// 2. Registration
app.post('/api/register', async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;
    await pool.request()
      .input('name',  sql.VarChar, full_name)
      .input('email', sql.VarChar, email)
      .input('hash',  sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone)
      .query('INSERT INTO Customers (full_name, email, password_hash, phone) VALUES (@name, @email, @hash, @phone)');
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed." });
  }
});

// 3. Login
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