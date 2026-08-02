import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import HeroSection from './HeroSection';
import FeatureCard from './FeatureCard';
import MetricCard from './MetricCard';
import FooterStatus from './FooterStatus';
import { FEATURE_CARDS, CHECKLIST_ITEMS, METRIC_CARDS } from '../../constants/login';

export default function LeftPanel() {
  return (
    <div className="login-left">
      <AnimatedBackground />

      <div className="login-left-content">
        <HeroSection />

        <div className="feature-grid reveal reveal-4">
          {FEATURE_CARDS.map(f => <FeatureCard key={f.key} label={f.label} Icon={f.Icon} />)}
        </div>

        <ul className="login-checklist reveal reveal-4">
          {CHECKLIST_ITEMS.map(item => (
            <li key={item}><CheckCircle2 size={16} />{item}</li>
          ))}
        </ul>

        {/* Espaço reservado: a ilustração do posto já vem na foto de fundo
            (AnimatedBackground); essa faixa só garante que ela fique visível
            entre o checklist e os indicadores. */}
        <div className="station-photo-window" aria-hidden="true" />

        <div className="login-metrics reveal reveal-6">
          <div className="login-metrics-title">Indicadores em tempo real</div>
          <div className="metric-grid">
            {METRIC_CARDS.map(m => (
              <MetricCard key={m.key} label={m.label} Icon={m.Icon} value={m.value} comparison={m.comparison} points={m.points} />
            ))}
          </div>
        </div>

        <FooterStatus />
      </div>
    </div>
  );
}
