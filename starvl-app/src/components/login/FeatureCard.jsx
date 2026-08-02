import React from 'react';

export default function FeatureCard({ label, Icon }) {
  return (
    <div className="feature-card">
      <div className="feature-card-icon"><Icon size={18} strokeWidth={1.8} /></div>
      <span className="feature-card-label">{label}</span>
    </div>
  );
}
