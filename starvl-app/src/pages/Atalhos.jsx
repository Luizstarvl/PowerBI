import React from 'react';

export default function Atalhos() {
  return (
    <main className="dashboard">
      <div className="gu-header">
        <div>
          <h2 className="gu-title">🔗 Atalhos</h2>
          <p className="gu-subtitle">Acesso rápido às áreas mais usadas do sistema.</p>
        </div>
      </div>

      <div className="param-group">
        <div className="param-group-header">
          <div>
            <div className="param-group-title">Cadastros</div>
          </div>
        </div>
        <div style={{ padding: '32px 22px' }}>
          <p className="rank-empty">Em breve.</p>
        </div>
      </div>
    </main>
  );
}
