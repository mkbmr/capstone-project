import React from 'react';

const MaisonAbout = ({ handleViewChange }) => {
  return (
    <section className="maison-about-section">
      <div className="about-brand-signature about-brand-signature-top">
        <span className="signature-date">ESTABLISHED 2026</span>
        <h4 className="signature-quote">Silhouettes of Absolute Intent.</h4>
      </div>

      <img className="about-hero-image" src="/images/About.jpg" alt="Maison Atelier" />

      <div className="about-editorial-content">
        <h3>Our Philosophy</h3>
        <div className="about-editorial-copy">
          <p>
            At Maison Aura, a suit is never merely stitched; it is engineered.
            In our private atelier, every silhouette is honed through tradition and modern precision.
            We marry Savile Row discipline with fluid structure, selecting only the rarest fabrics and the subtlest lines.
            This is couture built to endure — a quiet statement of purpose, elevated for a lifetime.
          </p>
        </div>

        <div className="about-action-wrap">
          <button className="return-shop-btn" onClick={() => handleViewChange("SHOP", "ALL")}>Return to the Collections</button>
        </div>
      </div>
    </section>
  );
};

export default MaisonAbout;
