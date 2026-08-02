import React from 'react';

const ITEMS = ['Versão 3.2.0', 'API Online', 'Banco conectado', 'Todos os serviços ativos'];

export default function FooterStatus() {
  return (
    <div className="login-footer-status">
      <div className="login-footer-status-items">
        {ITEMS.map(item => (
          <span key={item} className="status-dot-item">
            <span className="status-dot" />{item}
          </span>
        ))}
      </div>
      <span className="login-footer-copy">© {new Date().getFullYear()} Horse Technology</span>
    </div>
  );
}
