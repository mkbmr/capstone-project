require('dotenv').config(); // ← MUST be first line
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('./config');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
    const shipping_name = session.shipping_details?.name ?? session.customer_details?.name;
    const address       = session.shipping_details?.address ?? session.customer_details?.address;
    const total         = session.amount_total / 100;

    try {
      const pool = await poolPromise;

      await pool.request()
        .input('email',   sql.NVarChar, email)
        .input('name',    sql.NVarChar, name)
        .input('phone',   sql.NVarChar, phone)
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

      // Store line items for sales analytics (requires admin-migration.sql to have been run)
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
          expand: ['data.price.product'],
        });

        for (const item of lineItems.data) {
          const productName = item.description || '';
          const descStr     = item.price?.product?.description || '';
          const parts       = descStr.split(' / ');
          const color       = parts[0]?.trim() || '';
          const cut         = parts[1]?.trim() || '';
          const size        = (parts[2] || '').replace('Size ', '').trim();

          await pool.request()
            .input('sid',   sql.NVarChar,    session.id)
            .input('pname', sql.NVarChar,    productName)
            .input('color', sql.NVarChar,    color)
            .input('cut',   sql.NVarChar,    cut)
            .input('size',  sql.NVarChar,    size)
            .input('qty',   sql.Int,         item.quantity || 1)
            .input('price', sql.Decimal,     (item.price?.unit_amount || 0) / 100)
            .query(`
              INSERT INTO OrderItems (stripe_session_id, product_name, color, cut, size, quantity, unit_price)
              VALUES (@sid, @pname, @color, @cut, @size, @qty, @price)
            `);
        }
        console.log('Order items saved for session:', session.id);
      } catch (itemErr) {
        console.error('Failed to save order items:', itemErr.message);
      }

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

// ─── Admin middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Admin: Login ─────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    res.json({ token: process.env.ADMIN_SECRET });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ─── Admin: Image Upload → Azure Blob Storage ────────────────────────────────
app.post('/api/admin/upload', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return res.status(500).json({ error: 'Azure Storage is not configured — restart the server after setting AZURE_STORAGE_CONNECTION_STRING in .env' });
  }
  try {
    const blobService  = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const container    = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
    const ext          = req.file.originalname.split('.').pop().toLowerCase();
    const providedName = (req.body.filename || '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const blobName     = providedName || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blockBlob    = container.getBlockBlobClient(blobName);
    await blockBlob.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });
    res.json({ url: blockBlob.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Products CRUD ─────────────────────────────────────────────────────
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        p.product_id, p.product_name, p.display_name, p.item_type, p.sku,
        p.price, p.category, p.tag, p.image_url, p.description,
        ISNULL(SUM(pv.stock_quantity), 0) AS total_stock
      FROM Products p
      LEFT JOIN ProductVariants pv ON pv.product_id = p.product_id
      GROUP BY
        p.product_id, p.product_name, p.display_name, p.item_type, p.sku,
        p.price, p.category, p.tag, p.image_url, p.description
      ORDER BY p.product_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const { product_name, display_name, item_type, sku, price, category, tag, image_url, description } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('pname',    sql.NVarChar, product_name)
      .input('dname',    sql.NVarChar, display_name || null)
      .input('itype',    sql.NVarChar, item_type || null)
      .input('sku',      sql.NVarChar, sku || null)
      .input('price',    sql.Float,    parseFloat(price))
      .input('category', sql.NVarChar, category)
      .input('tag',      sql.NVarChar, tag || null)
      .input('image',    sql.NVarChar, image_url || null)
      .input('desc',     sql.NVarChar, description || null)
      .query(`
        INSERT INTO Products (product_name, display_name, item_type, sku, price, category, tag, image_url, description)
        VALUES (@pname, @dname, @itype, @sku, @price, @category, @tag, @image, @desc)
      `);
    res.status(201).json({ message: 'Product created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const { product_name, display_name, item_type, sku, price, category, tag, image_url, description } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id',       sql.Int,      parseInt(req.params.id))
      .input('pname',    sql.NVarChar, product_name)
      .input('dname',    sql.NVarChar, display_name || null)
      .input('itype',    sql.NVarChar, item_type || null)
      .input('sku',      sql.NVarChar, sku || null)
      .input('price',    sql.Float,    parseFloat(price))
      .input('category', sql.NVarChar, category)
      .input('tag',      sql.NVarChar, tag || null)
      .input('image',    sql.NVarChar, image_url || null)
      .input('desc',     sql.NVarChar, description || null)
      .query(`
        UPDATE Products SET
          product_name = @pname, display_name = @dname, item_type = @itype,
          sku = @sku, price = @price, category = @category, tag = @tag,
          image_url = @image, description = @desc
        WHERE product_id = @id
      `);
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const id = parseInt(req.params.id);

    const result = await pool.request().input('id', sql.Int, id)
      .query('SELECT image_url FROM Products WHERE product_id = @id');
    const imageUrl = result.recordset[0]?.image_url;

    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM ProductVariants WHERE product_id = @id');
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Products WHERE product_id = @id');

    if (imageUrl && process.env.AZURE_STORAGE_CONNECTION_STRING) {
      try {
        const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const container   = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
        const url         = new URL(imageUrl);
        const blobName    = url.pathname.replace(`/${process.env.AZURE_STORAGE_CONTAINER}/`, '');
        await container.getBlockBlobClient(blobName).deleteIfExists();
      } catch (_) {}
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/products/:id/variants', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM ProductVariants WHERE product_id = @id ORDER BY size, color');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products/:id/variants', requireAdmin, async (req, res) => {
  const { size, color, stock_quantity } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('pid',   sql.Int,      parseInt(req.params.id))
      .input('size',  sql.VarChar,  size  || null)
      .input('color', sql.VarChar,  color || null)
      .input('qty',   sql.Int,      Math.max(0, parseInt(stock_quantity) || 0))
      .query('INSERT INTO ProductVariants (product_id, size, color, stock_quantity) VALUES (@pid, @size, @color, @qty)');
    res.status(201).json({ message: 'Variant created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/variants/:variantId', requireAdmin, async (req, res) => {
  const { stock_quantity } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id',  sql.Int, parseInt(req.params.variantId))
      .input('qty', sql.Int, Math.max(0, parseInt(stock_quantity) || 0))
      .query('UPDATE ProductVariants SET stock_quantity = @qty WHERE variant_id = @id');
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Sales Summary ─────────────────────────────────────────────────────
app.get('/api/admin/sales/summary', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        ISNULL(SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
          THEN total_amount ELSE 0 END), 0) AS today_revenue,
        COUNT(CASE WHEN CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS today_orders,
        ISNULL(SUM(CASE WHEN YEAR(created_at) = YEAR(GETDATE()) AND MONTH(created_at) = MONTH(GETDATE())
          THEN total_amount ELSE 0 END), 0) AS month_revenue,
        COUNT(CASE WHEN YEAR(created_at) = YEAR(GETDATE()) AND MONTH(created_at) = MONTH(GETDATE()) THEN 1 END) AS month_orders,
        ISNULL(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders
      FROM Orders
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Sales Trend (last 30 days, daily) ────────────────────────────────
app.get('/api/admin/sales/trend', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        CONVERT(VARCHAR(10), created_at, 23) AS sale_date,
        SUM(total_amount)                    AS daily_revenue,
        COUNT(*)                             AS order_count
      FROM Orders
      WHERE created_at >= DATEADD(day, -29, CAST(GETDATE() AS DATE))
      GROUP BY CONVERT(VARCHAR(10), created_at, 23)
      ORDER BY sale_date ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Top Selling Items ─────────────────────────────────────────────────
app.get('/api/admin/sales/top-items', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        product_name,
        color,
        cut,
        size,
        SUM(quantity) AS total_quantity,
        SUM(quantity * unit_price) AS total_revenue
      FROM OrderItems
      GROUP BY product_name, color, cut, size
      ORDER BY total_quantity DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.json([]); // SalesLineItems may not exist yet; return empty instead of 500
  }
});

// ─── Admin: Stock Overview ────────────────────────────────────────────────────
app.get('/api/admin/sales/stock', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        p.product_id,
        p.product_name,
        p.sku,
        p.category,
        pv.variant_id,
        pv.size,
        pv.color,
        pv.stock_quantity
      FROM ProductVariants pv
      JOIN Products p ON pv.product_id = p.product_id
      ORDER BY p.category, pv.stock_quantity ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sales/top-sizes', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        ISNULL(p.category, 'Unknown') AS category,
        oi.size,
        SUM(oi.quantity) AS total_sold
      FROM OrderItems oi
      LEFT JOIN Products p ON oi.product_name = p.product_name
      WHERE oi.size IS NOT NULL AND LTRIM(RTRIM(oi.size)) != ''
      GROUP BY p.category, oi.size
      ORDER BY p.category, total_sold DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Customers ─────────────────────────────────────────────────────────
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        customer_email  AS email,
        MAX(customer_name) AS full_name,
        COUNT(*)        AS order_count,
        ISNULL(SUM(total_amount), 0) AS total_spent,
        MAX(created_at) AS last_order_date
      FROM Orders
      GROUP BY customer_email
      ORDER BY total_spent DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Customer Order History ────────────────────────────────────────────
app.get('/api/admin/customers/:email/orders', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const ordersResult = await pool.request()
      .input('email', sql.NVarChar, req.params.email)
      .query(`
        SELECT * FROM Orders
        WHERE customer_email = @email
        ORDER BY created_at DESC
      `);

    const orders = ordersResult.recordset;

    for (const order of orders) {
      const itemsResult = await pool.request()
        .input('sid', sql.NVarChar, order.stripe_session_id)
        .query('SELECT * FROM OrderItems WHERE stripe_session_id = @sid ORDER BY item_id');
      order.items = itemsResult.recordset;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Atelier Requests ──────────────────────────────────────────────────
app.get('/api/admin/atelier', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        oi.item_id,
        oi.stripe_session_id,
        oi.product_name,
        oi.color,
        oi.cut,
        o.customer_email,
        o.customer_name,
        o.phone,
        o.created_at        AS order_date,
        ISNULL(ast.status, 'Pending') AS status,
        ast.notes,
        ast.updated_at
      FROM OrderItems oi
      JOIN Orders o ON oi.stripe_session_id = o.stripe_session_id
      LEFT JOIN AtelierStatus ast ON ast.item_id = oi.item_id
      WHERE oi.size = 'Atelier Fitting'
      ORDER BY o.created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/atelier/:itemId', requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id',     sql.Int,      parseInt(req.params.itemId))
      .input('status', sql.NVarChar, status || 'Pending')
      .input('notes',  sql.NVarChar, notes  || null)
      .query(`
        IF EXISTS (SELECT 1 FROM AtelierStatus WHERE item_id = @id)
          UPDATE AtelierStatus SET status = @status, notes = @notes, updated_at = GETDATE() WHERE item_id = @id
        ELSE
          INSERT INTO AtelierStatus (item_id, status, notes) VALUES (@id, @status, @notes)
      `);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public API ───────────────────────────────────────────────────────────────

// Checkout
app.post('/api/checkout', async (req, res) => {
  const { cartItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      customer_creation: 'always',
      billing_address_collection: 'required',

      shipping_address_collection: {
        allowed_countries: ['SG', 'US', 'GB', 'AU', 'CA', 'FR', 'IT', 'JP'],
      },

      phone_number_collection: { enabled: true },

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

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Products');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Registration
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

// Login
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
