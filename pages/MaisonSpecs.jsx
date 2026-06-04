import React from 'react';
import MaisonSpecsFemale from './MaisonSpecsFemale';
import MaisonSpecsMale from './MaisonSpecsMale';

function MaisonSpecs({ category }) {
  return (
    <div className="atelier-measurements-middle">
      <div className="specs-tables-grid">
        {category === 'WOMEN' && <MaisonSpecsFemale />}
        {category === 'MEN' && <MaisonSpecsMale />}
        {!category && (
          <>
            <MaisonSpecsFemale />
            <MaisonSpecsMale />
          </>
        )}
      </div>
      <p className="specs-disclaimer">
        *All models shown are wearing size S. These references are intended as atelier starting points for tailored adjustment.
      </p>
    </div>
  );
}

export default MaisonSpecs;