import React from 'react';
import AnimatedBackground from './AnimatedBackground';
import HeroSection from './HeroSection';
import FeatureCard from './FeatureCard';
import FooterStatus from './FooterStatus';
import { FEATURE_CARDS } from '../../constants/login';

export default function LeftPanel() {
  return (
    <div className="login-left">
      <AnimatedBackground />

      <div className="login-left-content">
        <HeroSection />

        <div className="feature-grid reveal reveal-4">
          {FEATURE_CARDS.map(f => <FeatureCard key={f.key} label={f.label} Icon={f.Icon} />)}
        </div>

        <FooterStatus />
      </div>
    </div>
  );
}
