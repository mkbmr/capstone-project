import React from 'react';

function MaisonSpecsFemale() {
  return (
    <div className="specs-table-panel specs-table-panel-premium female-specs-panel">
      <div className="specs-panel-header">
        <span className="specs-panel-eyebrow">Women's Measurements</span>
        <h5 className="specs-panel-title">Femininity in Precision</h5>
      </div>
      <div className="specs-table-container">
        <table className="maison-specs-table">
          <thead>
            <tr>
              <th>Atelier Size</th>
              <th>Bust (cm)</th>
              <th>Waist (cm)</th>
              <th>Shoulder (cm)</th>
              <th>Required Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>34 (XS)</td>
              <td>80 - 83</td>
              <td>62 - 65</td>
              <td>37.5</td>
              <td>S</td>
            </tr>
            <tr>
              <td>36 (S)</td>
              <td>84 - 87</td>
              <td>66 - 69</td>
              <td>38.5</td>
              <td>S</td>
            </tr>
            <tr>
              <td>38 (M)</td>
              <td>88 - 91</td>
              <td>70 - 73</td>
              <td>39.5</td>
              <td>M</td>
            </tr>
            <tr>
              <td>40 (L)</td>
              <td>92 - 95</td>
              <td>74 - 77</td>
              <td>40.5</td>
              <td>L</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MaisonSpecsFemale;
