import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const API = '';

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <svg className="admin-login-logo" width="200" height="50" viewBox="0 0 200 50" fill="none">
          <text x="100" y="20" fontFamily="'Cinzel','Didot',serif" fontSize="14" fontWeight="400" fill="#111" letterSpacing="5" textAnchor="middle">MAISON AURA</text>
          <line x1="30" y1="28" x2="170" y2="28" stroke="#d4af37" strokeWidth="0.8"/>
          <text x="100" y="42" fontFamily="'Helvetica Neue',Arial,sans-serif" fontSize="7" fontWeight="300" fill="#d4af37" letterSpacing="3" textAnchor="middle">ADMIN PORTAL</text>
        </svg>
        <h2 className="admin-login-title">Restricted Access</h2>
        <p className="admin-login-sub">Admin credentials required to continue</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-form-label">Email</label>
          <input className="admin-form-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} required placeholder="admin@maisonaura.com" />
          <label className="admin-form-label">Password</label>
          <input className="admin-form-input" type="password" value={password}
            onChange={e => setPassword(e.target.value)} required placeholder="Password" />
          {error && <p className="admin-form-error">{error}</p>}
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stock badge helper ───────────────────────────────────────────────────────
function StockBadge({ qty }) {
  if (qty === 0)  return <span className="stock-badge out">Out of Stock</span>;
  if (qty <= 5)   return <span className="stock-badge low">{qty} left</span>;
  return               <span className="stock-badge ok">{qty}</span>;
}

// ─── Chart tooltip formatters ─────────────────────────────────────────────────
const revenueTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-val">${fmtMoney(payload[0]?.value)}</p>
    </div>
  );
};

const ordersTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-val">{payload[0]?.value} orders</p>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ token }) {
  const [summary,     setSummary]     = useState(null);
  const [trend,       setTrend]       = useState([]);
  const [topItems,    setTopItems]    = useState([]);
  const [stock,       setStock]       = useState([]);
  const [topSizes,    setTopSizes]    = useState([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockCat,    setStockCat]    = useState('');
  const [stockSort,   setStockSort]   = useState('stock_asc');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const headers = { 'x-admin-key': token };

  const fillDays = (rows) => {
    const map = {};
    rows.forEach(r => { map[r.sale_date] = r; });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({
        date:          label,
        daily_revenue: map[key] ? Number(map[key].daily_revenue) : 0,
        order_count:   map[key] ? Number(map[key].order_count)   : 0,
      });
    }
    return result;
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const [sumRes, trendRes, itemsRes, stockRes, sizesRes] = await Promise.all([
      fetch(`${API}/api/admin/sales/summary`,   { headers }),
      fetch(`${API}/api/admin/sales/trend`,     { headers }),
      fetch(`${API}/api/admin/sales/top-items`, { headers }),
      fetch(`${API}/api/admin/sales/stock`,     { headers }),
      fetch(`${API}/api/admin/sales/top-sizes`, { headers }),
    ]);
    if (sumRes.ok)   setSummary(await sumRes.json());
    if (trendRes.ok) setTrend(fillDays(await trendRes.json()));
    if (itemsRes.ok) setTopItems(await itemsRes.json());
    if (stockRes.ok) setStock(await stockRes.json());
    if (sizesRes.ok) setTopSizes(await sizesRes.json());
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const outOfStock = stock.filter(v => v.stock_quantity === 0).length;
  const lowStock   = stock.filter(v => v.stock_quantity > 0 && v.stock_quantity <= 5).length;

  const filteredStock = stock
    .filter(v => {
      if (stockCat && v.category !== stockCat) return false;
      if (stockSearch && !(v.sku || '').toLowerCase().includes(stockSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (stockSort) {
        case 'stock_asc':  return a.stock_quantity - b.stock_quantity;
        case 'stock_desc': return b.stock_quantity - a.stock_quantity;
        case 'sku':        return (a.sku || '').localeCompare(b.sku || '');
        case 'color':      return (a.color || '').localeCompare(b.color || '');
        case 'size':       return (a.size || '').localeCompare(b.size || '');
        case 'product':    return (a.product_name || '').localeCompare(b.product_name || '');
        default:           return 0;
      }
    });

  const menSizes    = topSizes.filter(v => v.category === 'Male');
  const womenSizes  = topSizes.filter(v => v.category === 'Female');

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Sales Overview</h2>
        <button className="admin-btn-refresh" onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Today's Revenue</span>
          <span className="stat-value">${fmtMoney(summary?.today_revenue)}</span>
          <span className="stat-sub">{summary?.today_orders || 0} orders today</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value">${fmtMoney(summary?.month_revenue)}</span>
          <span className="stat-sub">{summary?.month_orders || 0} orders this month</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">All-Time Revenue</span>
          <span className="stat-value">${fmtMoney(summary?.total_revenue)}</span>
          <span className="stat-sub">{summary?.total_orders || 0} total orders</span>
        </div>
      </div>

      {/* ── Revenue trend line ── */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Revenue — Last 30 Days</h3>
            <p className="chart-sub">Daily revenue trend</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ top: 10, right: 24, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#aaa' }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#aaa' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
            />
            <Tooltip content={revenueTip} />
            <Line
              type="monotone"
              dataKey="daily_revenue"
              stroke="#d4af37"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#d4af37' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Orders per day bar chart ── */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Orders — Last 30 Days</h3>
            <p className="chart-sub">
              {trend.reduce((s, d) => s + (d.order_count || 0), 0)} total orders in the last 30 days
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={trend} margin={{ top: 10, right: 24, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#aaa' }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#aaa' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={ordersTip} />
            <Bar dataKey="order_count" fill="#111111" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Stock Overview ── */}
      <h3 className="admin-section-subtitle">Stock Overview</h3>
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <span className="stat-label">Total Variants</span>
          <span className="stat-value">{stock.length}</span>
          <span className="stat-sub">across all products</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Out of Stock</span>
          <span className="stat-value" style={{ color: outOfStock > 0 ? '#c0392b' : '#111' }}>{outOfStock}</span>
          <span className="stat-sub">variants at 0</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Low Stock</span>
          <span className="stat-value" style={{ color: lowStock > 0 ? '#e67e22' : '#111' }}>{lowStock}</span>
          <span className="stat-sub">5 or fewer units</span>
        </div>
      </div>

      {stock.length === 0 ? (
        <p className="admin-empty-note" style={{ marginBottom: 32 }}>
          Stock data will appear here once your inventory variants are set up in ProductVariants.
        </p>
      ) : (
        <>
        <h3 className="admin-section-subtitle">Stock Checking</h3>
        <div className="chart-card" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 12, padding: '16px 16px 0', flexWrap: 'wrap' }}>
            <input
              className="admin-form-input"
              style={{ flex: 1, minWidth: 180 }}
              placeholder="Search by SKU..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
            />
            <select className="admin-form-input" style={{ width: 160 }} value={stockCat} onChange={e => setStockCat(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Male">Men</option>
              <option value="Female">Women</option>
            </select>
            <select className="admin-form-input" style={{ width: 180 }} value={stockSort} onChange={e => setStockSort(e.target.value)}>
              <option value="stock_asc">Stock: Low → High</option>
              <option value="stock_desc">Stock: High → Low</option>
              <option value="sku">Sort by SKU</option>
              <option value="color">Sort by Color</option>
              <option value="size">Sort by Size</option>
              <option value="product">Sort by Product</option>
            </select>
          </div>
          <div className="admin-table-wrap" style={{ marginTop: 16 }}>
            {filteredStock.length === 0 ? (
              <p className="admin-empty-note" style={{ padding: 16 }}>No variants match your filters.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Category</th><th>Color</th><th>Size</th><th>Stock</th></tr>
                </thead>
                <tbody>
                  {filteredStock.map(v => (
                    <tr key={v.variant_id}>
                      <td><strong>{v.product_name}</strong></td>
                      <td className="admin-td-muted">{v.sku || '—'}</td>
                      <td>
                        <span className={`admin-category-badge ${v.category === 'Female' ? 'female' : 'male'}`}>
                          {v.category === 'Female' ? 'Women' : 'Men'}
                        </span>
                      </td>
                      <td>{v.color || '—'}</td>
                      <td>{v.size  || '—'}</td>
                      <td><StockBadge qty={v.stock_quantity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </>
      )}

      {/* ── Top Selling Items ── */}
      <h3 className="admin-section-subtitle">Top Selling Items</h3>
      {topItems.length === 0 ? (
        <p className="admin-empty-note">
          No sales data yet. Items will appear here after orders are processed through the webhook.
        </p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Product</th><th>Color</th><th>Cut</th><th>Size</th><th>Units Sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td className="admin-td-rank">{i + 1}</td>
                    <td><strong>{item.product_name}</strong></td>
                    <td>{item.color || '—'}</td>
                    <td>{item.cut   || '—'}</td>
                    <td>{item.size  || '—'}</td>
                    <td className="admin-td-num">{item.total_quantity}</td>
                    <td className="admin-td-num">${fmtMoney(item.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Top Selling Sizes ── */}
      <h3 className="admin-section-subtitle" style={{ marginTop: 40 }}>Top Selling Sizes</h3>
      {topSizes.length === 0 ? (
        <p className="admin-empty-note">No size data yet. Sizes will appear here after orders are processed.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
          {[{ label: "Men's Sizes", rows: menSizes }, { label: "Women's Sizes", rows: womenSizes }].map(({ label, rows }) => (
            <div key={label} className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">{label}</h3>
              </div>
              {rows.length === 0 ? (
                <p className="admin-empty-note">No data.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Size</th><th>Units Sold</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.size}</strong></td>
                          <td className="admin-td-num">{r.total_sold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  product_name: '', display_name: '', item_type: '', sku: '', price: '',
  category: 'Male', tag: '', image_url: '', description: '',
};

function ProductsTab({ token }) {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState('');
  const [stockModal,    setStockModal]    = useState(null);
  const [variantEdits,  setVariantEdits]  = useState({});
  const [newVariants,   setNewVariants]   = useState([]);
  const [stockSaving,   setStockSaving]   = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadError,   setUploadError]   = useState('');
  const [pendingFile,   setPendingFile]   = useState(null);
  const [customFileName, setCustomFileName] = useState('');

  const authHeaders = { 'x-admin-key': token };
  const jsonHeaders = { 'Content-Type': 'application/json', 'x-admin-key': token };

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const res = await fetch(`${API}/api/admin/products`, { headers: authHeaders });
    if (res.ok) setProducts(await res.json());
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      product_name: p.product_name || '',
      display_name: p.display_name || '',
      item_type:    p.item_type    || '',
      sku:          p.sku          || '',
      price:        p.price        || '',
      category:     p.category     || 'Male',
      tag:          p.tag          || '',
      image_url:    p.image_url    || '',
      description:  p.description  || '',
    });
    setEditingId(p.product_id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const url    = editingId ? `${API}/api/admin/products/${editingId}` : `${API}/api/admin/products`;
      const method = editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: jsonHeaders,
        body:    JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setShowModal(false);
      await loadProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/api/admin/products/${id}`, { method: 'DELETE', headers: authHeaders });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Delete failed: ${data.error || res.statusText}`);
      return;
    }
    await loadProducts();
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    setPendingFile(file);
    setCustomFileName(base);
    setUploadError('');
    e.target.value = '';
  };

  const handleImageUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const ext  = pendingFile.name.split('.').pop().toLowerCase();
      const name = (customFileName.trim() || 'image').replace(/[^a-zA-Z0-9_-]/g, '-');
      const fd   = new FormData();
      fd.append('image', pendingFile);
      fd.append('filename', `${name}.${ext}`);
      const res  = await fetch(`${API}/api/admin/upload`, { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, image_url: data.url }));
      setPendingFile(null);
      setCustomFileName('');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openStockModal = async (product) => {
    const res = await fetch(`${API}/api/admin/products/${product.product_id}/variants`, { headers: authHeaders });
    const variants = res.ok ? await res.json() : [];
    setStockModal({ product_id: product.product_id, product_name: product.display_name || product.product_name, variants });
    const edits = {};
    variants.forEach(v => { edits[v.variant_id] = v.stock_quantity; });
    setVariantEdits(edits);
    setNewVariants([]);
  };

  const deleteVariant = async (variantId) => {
    await fetch(`${API}/api/admin/variants/${variantId}`, { method: 'DELETE', headers: authHeaders });
    setStockModal(prev => ({ ...prev, variants: prev.variants.filter(v => v.variant_id !== variantId) }));
    setVariantEdits(prev => { const e = { ...prev }; delete e[variantId]; return e; });
  };

  const addNewVariantRow = () => {
    setNewVariants(prev => [...prev, { size: '', color: '', stock_quantity: 0 }]);
  };

  const updateNewVariant = (idx, field, value) => {
    setNewVariants(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeNewVariant = (idx) => {
    setNewVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const saveStock = async () => {
    setStockSaving(true);
    try {
      await Promise.all([
        ...stockModal.variants.map(v =>
          fetch(`${API}/api/admin/variants/${v.variant_id}`, {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify({ stock_quantity: variantEdits[v.variant_id] ?? v.stock_quantity }),
          })
        ),
        ...newVariants.filter(r => r.size || r.color).map(r =>
          fetch(`${API}/api/admin/products/${stockModal.product_id}/variants`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(r),
          })
        ),
      ]);
      setStockModal(null);
      await loadProducts(true);
    } finally {
      setStockSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading products...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Products <span className="admin-count">({products.length})</span></h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn-refresh" onClick={() => loadProducts(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button className="admin-btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Type</th>
              <th>Price</th>
              <th>Tag</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.product_id}>
                <td>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.product_name} className="admin-product-thumb" />
                    : <div className="admin-product-thumb-empty" />}
                </td>
                <td>
                  <strong>{p.display_name || p.product_name}</strong>
                  {p.display_name && <div className="admin-td-muted">{p.product_name}</div>}
                </td>
                <td className="admin-td-muted">{p.sku || '—'}</td>
                <td>
                  <span className={`admin-category-badge ${p.category === 'Female' ? 'female' : 'male'}`}>
                    {p.category === 'Female' ? 'Women' : 'Men'}
                  </span>
                </td>
                <td>{p.item_type || '—'}</td>
                <td className="admin-td-num">${Number(p.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>{p.tag ? <span className="admin-tag-badge">{p.tag}</span> : '—'}</td>
                <td className="admin-td-num"><StockBadge qty={p.total_stock || 0} /></td>
                <td>
                  <div className="admin-row-actions" style={{ flexDirection: 'column', gap: 4 }}>
                    <button className="admin-btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="admin-btn-sm" onClick={() => openStockModal(p)}>Stock</button>
                    <button className="admin-btn-sm danger" onClick={() => handleDelete(p.product_id, p.product_name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Product Name *</label>
                  <input className="admin-form-input" value={form.product_name} onChange={setField('product_name')} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Display Name</label>
                  <input className="admin-form-input" value={form.display_name} onChange={setField('display_name')} placeholder="Shown on storefront" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">SKU</label>
                  <input className="admin-form-input" value={form.sku} onChange={setField('sku')} placeholder="e.g. MA-TUX-001" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Item Type</label>
                  <input className="admin-form-input" value={form.item_type} onChange={setField('item_type')} placeholder="e.g. Tuxedo, Blazer" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Price (USD) *</label>
                  <input className="admin-form-input" type="number" step="0.01" min="0" value={form.price} onChange={setField('price')} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Category *</label>
                  <select className="admin-form-input" value={form.category} onChange={setField('category')}>
                    <option value="Male">Male (MEN)</option>
                    <option value="Female">Female (WOMEN)</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tag</label>
                  <input className="admin-form-input" value={form.tag} onChange={setField('tag')} placeholder="e.g. NEW, LIMITED" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Product Image</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="admin-form-input"
                      style={{ flex: 1 }}
                      value={form.image_url}
                      onChange={setField('image_url')}
                      placeholder="Paste URL or upload a file →"
                    />
                    <label className="admin-btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0 }}>
                      Select File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {pendingFile && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <input
                        className="admin-form-input"
                        style={{ flex: 1 }}
                        value={customFileName}
                        onChange={e => setCustomFileName(e.target.value)}
                        placeholder="File name (without extension)"
                      />
                      <span style={{ color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                        .{pendingFile.name.split('.').pop().toLowerCase()}
                      </span>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={handleImageUpload}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        style={{ whiteSpace: 'nowrap', background: 'transparent', border: '1px solid #ccc', color: '#666' }}
                        onClick={() => { setPendingFile(null); setCustomFileName(''); setUploadError(''); }}
                        disabled={uploading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {uploadError && <p className="admin-form-error" style={{ marginTop: 4 }}>{uploadError}</p>}
                </div>
              </div>
              {form.image_url && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <img src={form.image_url} alt="preview" className="admin-image-preview" onError={e => e.target.style.display='none'} />
                </div>
              )}
              <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="admin-form-label">Description</label>
                <textarea className="admin-form-input admin-form-textarea" value={form.description}
                  onChange={setField('description')} rows={3} placeholder="Product description shown in the configurator" />
              </div>
              {formError && <p className="admin-form-error" style={{ gridColumn: '1 / -1' }}>{formError}</p>}
              <div className="admin-modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="admin-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="admin-modal-overlay" onClick={() => setStockModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Manage Stock — {stockModal.product_name}</h3>
              <button className="admin-modal-close" onClick={() => setStockModal(null)}>✕</button>
            </div>
            <div className="admin-table-wrap" style={{ padding: '0 24px' }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Size</th><th>Color</th><th>Stock Qty</th><th></th></tr>
                </thead>
                <tbody>
                  {stockModal.variants.map(v => (
                    <tr key={v.variant_id}>
                      <td>{v.size || '—'}</td>
                      <td>{v.color || '—'}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="admin-form-input"
                          style={{ width: 90, padding: '4px 8px' }}
                          value={variantEdits[v.variant_id] ?? v.stock_quantity}
                          onChange={e => setVariantEdits(prev => ({ ...prev, [v.variant_id]: parseInt(e.target.value) || 0 }))}
                        />
                      </td>
                      <td>
                        <button className="admin-btn-sm danger" onClick={() => deleteVariant(v.variant_id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {newVariants.map((row, idx) => (
                    <tr key={`new-${idx}`}>
                      <td>
                        <input
                          className="admin-form-input"
                          style={{ width: 80, padding: '4px 8px' }}
                          placeholder="e.g. 40"
                          value={row.size}
                          onChange={e => updateNewVariant(idx, 'size', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-form-input"
                          style={{ width: 140, padding: '4px 8px' }}
                          placeholder="e.g. Midnight Noir"
                          value={row.color}
                          onChange={e => updateNewVariant(idx, 'color', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="admin-form-input"
                          style={{ width: 90, padding: '4px 8px' }}
                          value={row.stock_quantity}
                          onChange={e => updateNewVariant(idx, 'stock_quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <button className="admin-btn-sm danger" onClick={() => removeNewVariant(idx)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 24px 0' }}>
              <button className="admin-btn-ghost" onClick={addNewVariantRow}>+ Add Variant</button>
            </div>
            <div className="admin-modal-actions" style={{ padding: 24 }}>
              <button className="admin-btn-ghost" onClick={() => setStockModal(null)}>Cancel</button>
              <button className="admin-btn-primary" onClick={saveStock} disabled={stockSaving || (stockModal.variants.length === 0 && newVariants.length === 0)}>
                {stockSaving ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Customers Tab ─────────────────────────────────────────────────────────────
function CustomerOrdersPanel({ orders }) {
  if (orders.length === 0) return <div className="admin-empty-note" style={{ padding: '16px 24px' }}>No orders found for this customer.</div>;

  return (
    <div className="admin-orders-panel">
      {orders.map((order, i) => (
        <div key={i} className="admin-order-card">
          <div className="admin-order-card-header">
            <div>
              <span className="admin-order-date">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Date unavailable'}
              </span>
              <span className="admin-order-id">#{order.order_id} · {order.stripe_session_id?.slice(-10)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="admin-order-total">${fmtMoney(order.total_amount)}</span>
              {order.status && <span className="admin-order-status">{order.status}</span>}
            </div>
          </div>
          <div className="admin-order-shipping">
            {[order.shipping_line1, order.shipping_state, order.shipping_country].filter(Boolean).join(', ') || 'No shipping info'}
          </div>
          {order.items && order.items.length > 0 && (
            <table className="admin-items-table">
              <thead>
                <tr><th>Product</th><th>Color</th><th>Cut</th><th>Size</th><th>Qty</th><th>Unit Price</th></tr>
              </thead>
              <tbody>
                {order.items.map((item, j) => (
                  <tr key={j}>
                    <td>{item.product_name}</td>
                    <td>{item.color || '—'}</td>
                    <td>{item.cut   || '—'}</td>
                    <td>{item.size  || '—'}</td>
                    <td>{item.quantity}</td>
                    <td>${fmtMoney(item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(!order.items || order.items.length === 0) && (
            <p className="admin-empty-note" style={{ padding: '8px 0 0', fontSize: '12px' }}>
              Item detail available for orders placed after the webhook was updated.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function CustomersTab({ token }) {
  const [customers,      setCustomers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [expandedEmail,  setExpandedEmail]  = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  const [ordersLoading,  setOrdersLoading]  = useState(false);
  const [search,         setSearch]         = useState('');

  const authHeaders = { 'x-admin-key': token };

  const loadCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const res = await fetch(`${API}/api/admin/customers`, { headers: authHeaders });
    if (res.ok) setCustomers(await res.json());
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [token]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const toggleCustomer = async (email) => {
    if (expandedEmail === email) { setExpandedEmail(null); return; }
    setExpandedEmail(email);
    if (customerOrders[email]) return;
    setOrdersLoading(true);
    const res = await fetch(`${API}/api/admin/customers/${encodeURIComponent(email)}/orders`, { headers: authHeaders });
    if (res.ok) {
      const data = await res.json();
      setCustomerOrders(prev => ({ ...prev, [email]: data }));
    }
    setOrdersLoading(false);
  };

  const filtered = customers.filter(c =>
    !search || c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading customers...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Customers <span className="admin-count">({customers.length})</span></h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn-refresh" onClick={() => loadCustomers(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <>
                <tr key={c.email} className={`admin-customer-row ${expandedEmail === c.email ? 'expanded' : ''}`}>
                  <td><strong>{c.full_name || '—'}</strong></td>
                  <td className="admin-td-muted">{c.email}</td>
                  <td className="admin-td-num">{c.order_count}</td>
                  <td className="admin-td-num">${fmtMoney(c.total_spent)}</td>
                  <td className="admin-td-muted">
                    {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="admin-btn-sm" onClick={() => toggleCustomer(c.email)}>
                      {expandedEmail === c.email ? 'Hide' : 'Orders'}
                    </button>
                  </td>
                </tr>
                {expandedEmail === c.email && (
                  <tr key={`${c.email}-orders`} className="admin-orders-row">
                    <td colSpan={6}>
                      {ordersLoading && !customerOrders[c.email]
                        ? <div className="admin-loading" style={{ padding: '20px' }}>Loading orders...</div>
                        : <CustomerOrdersPanel orders={customerOrders[c.email] || []} />}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Atelier Tab ──────────────────────────────────────────────────────────────
const ATELIER_STATUSES = ['Pending', 'Contacted', 'Scheduled', 'Completed'];

function atelierStatusStyle(status) {
  switch (status) {
    case 'Contacted':  return { background: '#e8f4fd', color: '#1a73e8' };
    case 'Scheduled':  return { background: '#fff4e5', color: '#e67e22' };
    case 'Completed':  return { background: '#eafaf1', color: '#27ae60' };
    default:           return { background: '#f4f4f4', color: '#888'    };
  }
}

function AtelierTab({ token }) {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState(null);
  const [edits,      setEdits]      = useState({});
  const [saving,     setSaving]     = useState(null);

  const headers     = { 'x-admin-key': token };
  const jsonHeaders = { 'Content-Type': 'application/json', 'x-admin-key': token };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const res = await fetch(`${API}/api/admin/atelier`, { headers });
    if (res.ok) {
      const data = await res.json();
      setRequests(data);
      const init = {};
      data.forEach(r => { init[r.item_id] = { status: r.status, notes: r.notes || '' }; });
      setEdits(init);
    }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveRequest = async (itemId) => {
    setSaving(itemId);
    const edit = edits[itemId] || {};
    const res = await fetch(`${API}/api/admin/atelier/${itemId}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ status: edit.status, notes: edit.notes }),
    });
    if (res.ok) {
      setRequests(prev => prev.map(r =>
        r.item_id === itemId ? { ...r, status: edit.status, notes: edit.notes } : r
      ));
      setExpanded(null);
    }
    setSaving(null);
  };

  const counts = ATELIER_STATUSES.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  if (loading) return <div className="admin-loading">Loading atelier requests...</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Private Atelier Fittings
          <span className="admin-count"> ({requests.length})</span>
        </h2>
        <button className="admin-btn-refresh" onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Status summary cards ── */}
      <div className="admin-stats-grid" style={{ marginBottom: 32 }}>
        {ATELIER_STATUSES.map(s => (
          <div key={s} className="admin-stat-card">
            <span className="stat-label">{s}</span>
            <span className="stat-value" style={atelierStatusStyle(s)}>{counts[s] || 0}</span>
            <span className="stat-sub">requests</span>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="admin-empty-note">
          No atelier fitting requests yet. They will appear here when customers select
          "Private Atelier Fitting" during checkout.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Product</th>
                <th>Cut / Color</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const isOpen = expanded === r.item_id;
                const edit   = edits[r.item_id] || { status: r.status, notes: r.notes || '' };
                return (
                  <>
                    <tr key={r.item_id} className={isOpen ? 'expanded' : ''}>
                      <td>
                        <strong>{r.customer_name || '—'}</strong>
                      </td>
                      <td>
                        <a href={`mailto:${r.customer_email}`} style={{ color: '#1a73e8', textDecoration: 'none' }}>
                          {r.customer_email}
                        </a>
                        {r.phone && <div className="admin-td-muted">{r.phone}</div>}
                      </td>
                      <td>{r.product_name}</td>
                      <td>
                        {r.cut || '—'}
                        {r.color && <div className="admin-td-muted">{r.color}</div>}
                      </td>
                      <td className="admin-td-muted">
                        {r.order_date
                          ? new Date(r.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span style={{ ...atelierStatusStyle(r.status), padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="admin-btn-sm"
                          onClick={() => setExpanded(isOpen ? null : r.item_id)}
                        >
                          {isOpen ? 'Close' : 'Manage'}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={`${r.item_id}-edit`}>
                        <td colSpan={7} style={{ padding: '16px 20px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div>
                              <label className="admin-form-label" style={{ display: 'block', marginBottom: 6 }}>Update Status</label>
                              <select
                                className="admin-form-input"
                                style={{ width: 180 }}
                                value={edit.status}
                                onChange={e => setEdits(prev => ({ ...prev, [r.item_id]: { ...edit, status: e.target.value } }))}
                              >
                                {ATELIER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 240 }}>
                              <label className="admin-form-label" style={{ display: 'block', marginBottom: 6 }}>Notes (internal)</label>
                              <textarea
                                className="admin-form-input admin-form-textarea"
                                rows={2}
                                style={{ width: '100%' }}
                                placeholder="e.g. Called customer, fitting scheduled for 15 June at HQ"
                                value={edit.notes}
                                onChange={e => setEdits(prev => ({ ...prev, [r.item_id]: { ...edit, notes: e.target.value } }))}
                              />
                            </div>
                            <div style={{ alignSelf: 'flex-end' }}>
                              <button
                                className="admin-btn-primary"
                                onClick={() => saveRequest(r.item_id)}
                                disabled={saving === r.item_id}
                              >
                                {saving === r.item_id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                          {r.notes && (
                            <p style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                              Last note: {r.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard({ adminToken, onAdminLogin, onAdminLogout, handleViewChange }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!adminToken) {
    return <AdminLogin onLogin={onAdminLogin} />;
  }

  const tabs = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'products',  label: 'Products'  },
    { id: 'customers', label: 'Customers' },
    { id: 'atelier',   label: 'Atelier'   },
  ];

  return (
    <div className="admin-portal">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <svg width="150" height="40" viewBox="0 0 150 40" fill="none">
            <text x="75" y="17" fontFamily="'Cinzel','Didot',serif" fontSize="11" fontWeight="400" fill="#ffffff" letterSpacing="4" textAnchor="middle">MAISON AURA</text>
            <line x1="15" y1="23" x2="135" y2="23" stroke="#d4af37" strokeWidth="0.6"/>
            <text x="75" y="34" fontFamily="'Helvetica Neue',Arial,sans-serif" fontSize="6" fontWeight="300" fill="#d4af37" letterSpacing="3" textAnchor="middle">ADMIN PORTAL</text>
          </svg>
        </div>

        <nav className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button className="admin-nav-btn back" onClick={() => handleViewChange('SHOP', 'ALL')}>
            ← Back to Store
          </button>
          <button className="admin-nav-btn signout" onClick={onAdminLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {activeTab === 'overview'  && <OverviewTab  token={adminToken} />}
        {activeTab === 'products'  && <ProductsTab  token={adminToken} />}
        {activeTab === 'customers' && <CustomersTab token={adminToken} />}
        {activeTab === 'atelier'   && <AtelierTab   token={adminToken} />}
      </main>
    </div>
  );
}
