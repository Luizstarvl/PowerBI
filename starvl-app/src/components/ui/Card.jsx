import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`param-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
