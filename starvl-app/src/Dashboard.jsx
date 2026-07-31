import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function periodToApi(period) {
  // "2026-07" → "072026"
  const [y, m] = period.split('-');
  return `${m}${y}`;
}

const MEDAL = ['🥇', '🥈', '🥉'];

function RankingCard({ title, items, loading }) {
  const max = items[0]?.qty || 1;

  return (
    <div className="rank-card">
      <h3 className="rank-title">{title}</h3>
      {loading ? (
        <p className="rank-empty">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="rank-empty">Sem dados para o período</p>
      ) : (
        <ol className="rank-list">
          {items.map((item, i) => (
            <li key={item.id} className="rank-item">
              <span className="rank-pos">
                {i < 3 ? MEDAL[i] : <span className="rank-num">{i + 1}</span>}
              </span>
              <div className="rank-info">
                <span className="rank-name">{item.name}</span>
                <div className="rank-bar-wrap">
                  <div
                    className="rank-bar"
                    style={{ width: `${(item.qty / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="rank-qty">{Number(item.qty).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function Dashboard({ empresa, period }) {
  const [convenio, setConvenio] = useState([]);
  const [pista, setPista] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!empresa || !period) return;
    const p = periodToApi(period);
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/dashboard/top-convenio?empresa=${empresa}&periodo=${p}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/top-convenio?empresa=${empresa}&periodo=${p}&locz=pista`).then(r => r.json()),
    ])
      .then(([conv, pst]) => {
        setConvenio(Array.isArray(conv) ? conv : []);
        setPista(Array.isArray(pst) ? pst : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresa, period]);

  return (
    <main className="dashboard">
      <div className="rank-grid">
        <RankingCard title="Mais Vendidos — Conveniência" items={convenio} loading={loading} />
        <RankingCard title="Mais Vendidos — Pista" items={pista} loading={loading} />
      </div>
    </main>
  );
}
