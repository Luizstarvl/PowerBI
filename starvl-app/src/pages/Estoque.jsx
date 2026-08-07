import React from 'react';
import { Package } from 'lucide-react';

export default function Estoque({ empresas }) {
  return (
    <main className="dashboard pv-main-page">
      <div className="pc-hub">
        <div className="pc-hub-header">
          <div className="pc-hub-eyebrow">
            <Package size={13} />
            ECLIPSE BI · ESTOQUE
          </div>
          <h1 className="pc-hub-title">Estoque</h1>
          <p className="pc-hub-sub">
            Gerencie o estoque de produtos, entradas, saídas e inventário do posto.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '60px 24px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          <Package size={56} strokeWidth={1.2} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 15, maxWidth: 340, lineHeight: 1.6, opacity: 0.7 }}>
            Módulo em desenvolvimento. Em breve você poderá controlar entradas,
            saídas e o inventário completo do seu posto aqui.
          </p>
        </div>
      </div>
    </main>
  );
}
