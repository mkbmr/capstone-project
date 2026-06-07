import React from 'react';

function MaisonSpecsMale() {
  return (
    <div className="specs-table-panel specs-table-panel-premium male-specs-panel">
      <div className="specs-panel-header">
        <span className="specs-panel-eyebrow">Men's Measurements</span>
        <h5 className="specs-panel-title">Regal Structure</h5>
      </div>
      <div className="specs-table-container">
        <table className="maison-specs-table">
          <thead>
            <tr>
              <th>Atelier Size</th>
              <th>Chest (cm)</th>
              <th>Bust (cm)</th>
              <th>Waist (cm)</th>
              <th>Required Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>46 (S)</td>
              <td>94 - 97</td>
              <td>95 - 98</td>
              <td>80 - 83</td>
              <td>S</td>
            </tr>
            <tr>
              <td>48 (M)</td>
              <td>98 - 101</td>
              <td>99 - 102</td>
              <td>84 - 87</td>
              <td>M</td>
            </tr>
            <tr>
              <td>50 (L)</td>
              <td>102 - 105</td>
              <td>103 - 106</td>
              <td>88 - 91</td>
              <td>L</td>
            </tr>
            <tr>
              <td>52 (XL)</td>
              <td>106 - 109</td>
              <td>107 - 110</td>
              <td>92 - 95</td>
              <td>XL</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MaisonSpecsMale;
