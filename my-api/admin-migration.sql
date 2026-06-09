-- Admin migration — run once against your Azure SQL database.
--
-- Table mapping (confirmed schema):
--   dbo.Products        — product catalogue (product_id, product_name, sku, ...)
--   dbo.ProductVariants — inventory stock   (variant_id, product_id, size, color, stock_quantity)
--   dbo.OrderItems      — order line items  (item_id, stripe_session_id, product_name, color, cut, size, quantity, unit_price)
--   dbo.Orders          — order headers     (order_id, customer_email, phone, shipping_*, total_amount, ...)
--   dbo.Customers       — registered users
--
-- SalesLineItems was created by a previous migration run and is now unused.
-- Drop it if you want to keep the schema clean:
--
--   DROP TABLE SalesLineItems;
--
-- ProductVariants must be populated with your inventory data for stock charts to work.
-- Example:
--   INSERT INTO ProductVariants (product_id, size, color, stock_quantity)
--   VALUES (1, '38', 'Midnight Noir', 50),
--          (1, '40', 'Midnight Noir', 45);

-- ─── Atelier Status table (run once) ─────────────────────────────────────────
-- Required for the Atelier tab in the admin portal.
-- Tracks contact/scheduling status for customers who selected "Private Atelier Fitting".
--
CREATE TABLE AtelierStatus (
  item_id    INT           PRIMARY KEY,
  status     NVARCHAR(50)  NOT NULL DEFAULT 'Pending',
  notes      NVARCHAR(1000) NULL,
  updated_at DATETIME      DEFAULT GETDATE()
);
