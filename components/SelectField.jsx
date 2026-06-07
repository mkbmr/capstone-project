import React from "react";

export default function SelectField({ id, label, value, onChange, options }) {
  return (
    <div className="option-group">
      <label className="lux-label" htmlFor={id}>{label}</label>
      <div className="custom-select-wrapper">
        <select
          id={id}
          className="lux-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
