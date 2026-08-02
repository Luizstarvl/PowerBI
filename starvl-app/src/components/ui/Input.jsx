import React from 'react';

export default function Input({ label, error, className = '', id, ...props }) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} {...props} />
      {error && <p className="form-erro">{error}</p>}
    </div>
  );
}
