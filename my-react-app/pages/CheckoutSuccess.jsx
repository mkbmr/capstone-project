const CheckoutSuccess = ({ handleViewChange }) => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h2 style={{ fontFamily: 'Cinzel, serif', letterSpacing: '4px' }}>ORDER CONFIRMED</h2>
    <p style={{ color: '#4f4f4f', marginTop: '16px' }}>
      Your atelier order has been received. A concierge will be in touch shortly.
    </p>
    <button className="return-shop-btn" style={{ marginTop: '32px' }} onClick={() => handleViewChange('SHOP', 'ALL')}>
      RETURN TO COLLECTIONS
    </button>
  </div>
);

export default CheckoutSuccess;