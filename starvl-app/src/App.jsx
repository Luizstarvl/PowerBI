import React, { useState, useEffect } from 'react';
import logoStarvl from './logo-starvl.png';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LabelList } from 'recharts';
import { Home, FileText, Users as UsersIcon, Sliders, Package, LogOut, Eye, Search, Plus, Edit2, Trash2, X, Calendar, TrendingUp, Droplet, DollarSign, Calculator, Bell, ChevronDown, Activity, Settings, Building2, Phone, Mail, MapPin, Hash, Clock, BarChart2, Layers, CircleDollarSign, UserCheck, UserPlus, AlertCircle, Globe, Camera, Building, Tag, RefreshCw, Database, ChevronRight, Filter, Printer } from 'lucide-react';
import './App.css';

// Mock data
const hourlyData = [
  { hour: '00h', value: 150 },
  { hour: '04h', value: 200 },
  { hour: '08h', value: 300 },
  { hour: '12h', value: 350 },
  { hour: '16h', value: 250 },
  { hour: '20h', value: 450 },
  { hour: '24h', value: 300 },
];

const weeklyData = [
  { day: 'Seg', value: 800 },
  { day: 'Ter', value: 900 },
  { day: 'Qua', value: 1100 },
  { day: 'Qui', value: 1300 },
  { day: 'Sex', value: 1200 },
  { day: 'Sáb', value: 950 },
  { day: 'Dom', value: 700 },
];

const monthlyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 2000 + Math.random() * 1500
}));

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function periodToApi(period) {
  return period.replace('/', ''); // "05/2026" → "052026"
}

const initialClients = [
  { id: 7432, nome: 'POSTO LD', banco: 'ret_meavenida', codigoEmpresa: 7432 },
];

const initialAdminUsers = [
  { id: 1, usuario: 'admin', senha: '123456', perfil: 'admin' },
];

function generatePeriods() {
  const periods = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear + 1; year >= currentYear - 8; year--) {
    for (let month = 12; month >= 1; month--) {
      periods.push(`${String(month).padStart(2, '0')}/${year}`);
    }
  }

  return periods;
}

function getCurrentPeriod() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function periodToMonthInput(period) {
  const [month, year] = String(period || '').split('/');
  if (!month || !year) return '';
  return `${year}-${month}`;
}

function monthInputToPeriod(value) {
  const [year, month] = String(value || '').split('-');
  if (!month || !year) return getCurrentPeriod();
  return `${month}/${year}`;
}

const PERIODS = generatePeriods();
const PERIOD_YEARS = [...new Set(PERIODS.map(period => period.split('/')[1]))];
const MONTH_OPTIONS = [
  { value: '01', label: 'JANEIRO' },
  { value: '02', label: 'FEVEREIRO' },
  { value: '03', label: 'MARCO' },
  { value: '04', label: 'ABRIL' },
  { value: '05', label: 'MAIO' },
  { value: '06', label: 'JUNHO' },
  { value: '07', label: 'JULHO' },
  { value: '08', label: 'AGOSTO' },
  { value: '09', label: 'SETEMBRO' },
  { value: '10', label: 'OUTUBRO' },
  { value: '11', label: 'NOVEMBRO' },
  { value: '12', label: 'DEZEMBRO' },
];

// Login Component
const Login = ({ onLogin, adminUsers }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = adminUsers || [];
    const matched = users.find(
      u => u.usuario.trim().toLowerCase() === username.trim().toLowerCase() &&
           (u.senha || '') === password
    );
    if (!matched) {
      setError('Usuário ou senha inválidos.');
      return;
    }
    setError('');
    onLogin(matched);
  };

  return (
    <div className="login-page">
      <div className="card">
        <video
          className="login-bg-video"
          src="/bg-login.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="login-bg-overlay" />
        <div className="red-gradient" />
        <div className="white-glow" />
        <div className="arc1" />
        <div className="arc2" />

        {/* Lado esquerdo */}
        <div className="left">
          <div className="brand">
            <img src={logoStarvl} alt="STARVL" className="logo-login" />
            <p className="tagline">MOVIMENTO QUE <span>CONECTA.</span></p>
          </div>
        </div>

        {/* Lado direito */}
        <div className="right">
          <div className="box">
            <h1 className="login-h1"><em>Bem-vindo</em> de volta!</h1>
            <p className="sub">Faça login para acessar sua conta.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="login-label">Usuário</label>
                <div className="wrap">
                  <span className="ic">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="login-label">Senha</label>
                <div className="wrap">
                  <span className="ic">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="forgot"><button type="button" className="forgot-btn">Esqueceu a senha?</button></div>
              </div>

              <button type="submit" className="btn-submit">Entrar</button>
              {error && <div className="login-error">{error}</div>}
            </form>
          </div>

          <div className="login-footer-card">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Segurança, desempenho e confiança.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage, onLogout }) => {
  const menuItems = [
    { icon: Home,      label: 'DASHBOARD',      page: 'dashboard' },
    { icon: FileText,  label: 'RELATÓRIOS',      page: 'reports'   },
    { icon: UsersIcon, label: 'USUÁRIOS',        page: 'users'     },
    { icon: Sliders,   label: 'CONTROLE',        page: 'control'   },
    { icon: Package,   label: 'POSIÇÃO ESTOQUE', page: 'stock'     },
    { icon: Settings,  label: 'PARÂMETROS',      page: 'params'    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={logoStarvl} alt="STARVL" className="sidebar-logo" />
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.page)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="nav-item logout-btn" onClick={onLogout}>
        <LogOut size={20} />
        <span>SAIR</span>
      </button>
    </div>
  );
};

// TopBar Component
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  reports: 'Relatórios',
  control: 'Controle de Movimentação',
  stock: 'Posição de Estoque',
  users: 'Gerenciamento de Usuários',
  params: 'Parâmetros',
};

const TopBar = ({ currentPage, setCurrentPage, isConnected, clients, selectedClient, setSelectedClient, selectedPeriod, setSelectedPeriod, onRefresh, onLogout, loggedUser }) => {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-title">{PAGE_TITLES[currentPage] || 'Dashboard'}</span>
        {currentPage === 'dashboard' && <span className="top-bar-date">{dateStr}</span>}
      </div>

      <div className="top-bar-center">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
          <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>

        <select
          className="topbar-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>

        <input
          className="topbar-select topbar-month"
          type="month"
          value={periodToMonthInput(selectedPeriod)}
          onChange={(e) => setSelectedPeriod(monthInputToPeriod(e.target.value))}
        />

        <button type="button" className="btn-refresh" onClick={onRefresh}>
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      <div className="top-bar-right">
        <button type="button" className="top-bar-icon-btn">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>
        <div className="top-bar-user" style={{ position: 'relative' }} onClick={() => setShowAdminMenu((v) => !v)}>
          <div className="user-avatar-sm">{(loggedUser?.usuario || 'U').charAt(0).toUpperCase()}</div>
          <span>{loggedUser?.usuario || 'Usuário'}</span>
          <ChevronDown size={14} />
          {showAdminMenu && (
            <div className="admin-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="admin-dropdown-item"
                onClick={() => { setCurrentPage('users'); setShowAdminMenu(false); }}
              >
                <UsersIcon size={15} />
                Gerenciar Usuários
              </button>
              <div className="admin-dropdown-divider" />
              <button
                type="button"
                className="admin-dropdown-item danger"
                onClick={() => { setShowAdminMenu(false); onLogout(); }}
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ kpis, vendasDiarias, vendasHorarias, lmcControle, estoques, loading }) => {
  const [selectedFuelDonut, setSelectedFuelDonut] = useState(null);

  const fmt = (n, d = 2) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtCompactCurrency = (value) => {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000000) return `R$ ${(n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
    if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
    return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };
  const fmtCompactLiters = (value) => {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil L`;
    return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L`;
  };

  const estoquesList = estoques || [];
  const activeFuelEstoque = estoquesList.find(e => e.produtoCodigo === selectedFuelDonut) || estoquesList[0];
  const fuelPct = activeFuelEstoque ? Math.round(activeFuelEstoque.percentualOcupacao) : 0;

  const comprasByFuel = {};
  (lmcControle || []).forEach(row => {
    const name = (row.descricaoProduto || 'Produto').split(' ').slice(0, 2).join(' ');
    if (!comprasByFuel[name]) comprasByFuel[name] = { name, compra110: 0, compra220: 0 };
    comprasByFuel[name].compra110 += Number(row.compra110 || 0);
    comprasByFuel[name].compra220 += Number(row.compra220 || 0);
  });

  const comprasChart = Object.values(comprasByFuel)
    .map(r => ({ ...r, total: r.compra110 + r.compra220 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const comprasFallback = [{ name: 'Sem dados', compra110: 0, compra220: 0, total: 0 }];

  const monthlyChart = vendasDiarias && vendasDiarias.length > 0
    ? vendasDiarias.map(r => ({ day: new Date(r.dia).getUTCDate(), value: r.valorTotal }))
    : monthlyData;

  const hourlyChart = vendasHorarias && vendasHorarias.length > 0
    ? vendasHorarias.map(r => ({ hour: r.label, value: Number(r.valorTotal || 0) }))
    : hourlyData;

  const weeklyMap = [
    { name: 'Semana 1', value: 0 },
    { name: 'Semana 2', value: 0 },
    { name: 'Semana 3', value: 0 },
    { name: 'Semana 4', value: 0 },
  ];
  monthlyChart.forEach(row => {
    const weekIndex = Math.min(3, Math.floor((Number(row.day || 1) - 1) / 7));
    weeklyMap[weekIndex].value += Number(row.value || 0);
  });
  const weeklyChart = weeklyMap.some(r => r.value > 0) ? weeklyMap : weeklyData.map((r, i) => ({ name: `Semana ${i + 1}`, value: r.value })).slice(0, 4);

  const monthlyTotal = monthlyChart.reduce((sum, row) => sum + Number(row.value || 0), 0);
  const purchasesChartData = comprasChart.length > 0 ? comprasChart : comprasFallback;

  const dynamicKpis = kpis ? [
    { label: 'Total Vendas', value: 'R$ ' + fmt(kpis.vendas?.valor), icon: DollarSign, sub: `${(kpis.vendas?.total || 0).toLocaleString('pt-BR')} vendas` },
    { label: 'Litros Vendidos', value: 'R$ ' + fmt(kpis.combustivel?.valor), icon: Droplet, sub: fmt(kpis.combustivel?.litros) + ' L' },
    { label: 'Compras c/ NF (110)', value: 'R$ ' + fmt(kpis.compras110?.valor), icon: FileText, sub: `${(kpis.compras110?.total || 0).toLocaleString('pt-BR')} NFs` },
    { label: 'Aferições', value: fmt(kpis.afericoes?.qtd) + ' L', icon: Activity, sub: `${(kpis.afericoes?.total || 0).toLocaleString('pt-BR')} aferições` },
  ] : [
    { label: 'Carregando...', value: '—', icon: DollarSign, sub: '' },
    { label: 'Carregando...', value: '—', icon: Droplet, sub: '' },
    { label: 'Carregando...', value: '—', icon: FileText, sub: '' },
    { label: 'Carregando...', value: '—', icon: Activity, sub: '' },
  ];

  return (
    <div className="page-content">
      {loading && (
        <div style={{ textAlign: 'center', padding: '8px 0 16px', color: '#E31E24', fontSize: '13px', letterSpacing: '1px' }}>
          Buscando dados do banco de dados...
        </div>
      )}
      <div className="kpi-row">
        {dynamicKpis.map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div className="kpi-icon"><kpi.icon size={24} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              {kpi.sub && <div className="kpi-trend positive">{kpi.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card large">
          <div className="card-header">
            <h3>COMPRAS 110 / 220 POR COMBUSTÍVEL</h3>
            <span style={{ fontSize: '12px', color: '#666' }}>litros no período</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purchasesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #E31E24' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [fmt(v) + ' L', 'Litros']}
              />
              <Legend />
              <Bar dataKey="compra110" name="Compra 110" fill="#E31E24" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="compra110" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} fill="#fff" fontSize={11} />
              </Bar>
              <Bar dataKey="compra220" name="Compra 220" fill="#f97316" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="compra220" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} fill="#fff" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>ESTOQUE COMB</h3>
          </div>
          {estoquesList.length > 0 && (
            <div className="fuel-selector">
              <label>Combustível:</label>
              <select
                value={selectedFuelDonut || estoquesList[0]?.produtoCodigo || ''}
                onChange={(e) => setSelectedFuelDonut(parseInt(e.target.value))}
              >
                {estoquesList.map(e => (
                  <option key={e.produtoCodigo} value={e.produtoCodigo}>{e.produtoNome}</option>
                ))}
              </select>
            </div>
          )}
          <div className="stock-visual">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Disponível', value: fuelPct || 1 },
                    { name: 'Capacidade restante', value: Math.max(0, 100 - fuelPct) }
                  ]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                >
                  <Cell fill="#E31E24" />
                  <Cell fill="#2a2a2a" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="stock-center">
              <div className="stock-total">Estoque</div>
              <div className="stock-number">{activeFuelEstoque ? fmt(activeFuelEstoque.estoqueTotal) : '—'}</div>
              <div className="stock-unit">litros</div>
            </div>
          </div>
          <div className="stock-legend">
            <div className="legend-item">
              <span className="dot available"></span>
              <span>Estoque</span>
              <span className="value">{activeFuelEstoque ? fmt(activeFuelEstoque.estoqueTotal) + ' (' + fuelPct + '%)' : '—'}</span>
            </div>
            <div className="legend-item">
              <span className="dot unavailable"></span>
              <span>Capacidade</span>
              <span className="value">{activeFuelEstoque ? fmt(activeFuelEstoque.capacidadeTotal, 0) + ' L' : '—'}</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>VENDAS P/HORA</h3>
          </div>
          <div className="metric-display">
            <div className="metric-icon-box"><Clock size={20} /></div>
            <div className="metric-info">
              <div className="metric-label">Valor de combustível vendido</div>
              <div className="metric-value">
                {kpis ? fmtCompactCurrency(kpis.combustivel?.valor) : '—'}
                <span className="trend positive"><TrendingUp size={16} />no período</span>
              </div>
              <div className="metric-sublabel">quebra por hora</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hourlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="hour" stroke="#666" fontSize={11} interval={3} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #E31E24' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [fmtCompactCurrency(v), 'Valor']}
              />
              <Bar dataKey="value" fill="#E31E24" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} fill="#fff" fontSize={9} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>VENDAS P/SEMANA</h3>
          </div>
          <div className="metric-display">
            <div className="metric-icon-box"><Calendar size={20} /></div>
            <div className="metric-info">
              <div className="metric-label">Valor de combustível vendido</div>
              <div className="metric-value">
                {fmtCompactCurrency(monthlyTotal)}
                <span className="trend positive"><TrendingUp size={16} />no período</span>
              </div>
              <div className="metric-sublabel">Semana 1, 2, 3 e 4</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={weeklyChart}>
              <defs>
                <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E31E24" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E31E24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={11} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #E31E24' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [fmtCompactCurrency(v), 'Valor']}
              />
              <Area type="monotone" dataKey="value" stroke="#E31E24" fillOpacity={1} fill="url(#colorWeekly)">
                <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} fill="#fff" fontSize={10} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>VENDAS P/MÊS</h3>
          </div>
          <div className="metric-display">
            <div className="metric-icon-box"><BarChart2 size={20} /></div>
            <div className="metric-info">
              <div className="metric-label">Valor de combustível vendido</div>
              <div className="metric-value">
                {fmtCompactCurrency(monthlyTotal)}
                <span className="trend positive"><TrendingUp size={16} />no período</span>
              </div>
              <div className="metric-sublabel">total mensal de combustível</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E31E24" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E31E24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <YAxis hide />
              <Area type="monotone" dataKey="value" stroke="#E31E24" fillOpacity={1} fill="url(#colorMonthly)">
                <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} fill="#fff" fontSize={9} />
              </Area>
              <XAxis dataKey="day" stroke="#666" fontSize={12} interval={4} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #E31E24' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [fmtCompactCurrency(v), 'Valor']}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Reports Component
const fmtNum = (v, dec = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const Reports = ({ selectedClient, selectedPeriod, clients }) => {
  const [activeTab, setActiveTab] = useState('descarregamentos');
  const [data, setData] = useState({ descarregamentos: null, vendas: null, historico: null, consolidado: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [descSubTab, setDescSubTab] = useState('comNota');

  const getEmpresa = () => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    return client ? client.codigoEmpresa : null;
  };

  const getPeriodoApi = () => selectedPeriod ? selectedPeriod.replace('/', '') : null;

  const fetchTab = async (tab) => {
    const empresa = getEmpresa();
    const periodo = getPeriodoApi();
    if (!empresa) return;
    setLoading(prev => ({ ...prev, [tab]: true }));
    setError(prev => ({ ...prev, [tab]: null }));
    try {
      let result;
      if (tab === 'descarregamentos') {
        const r = await fetch(`${API_URL}/api/relatorios/descarregamentos?empresa=${empresa}&periodo=${periodo}`);
        result = await r.json();
        if (result.error) throw new Error(result.error);
      } else if (tab === 'vendas') {
        const r = await fetch(`${API_URL}/api/relatorios/vendas?empresa=${empresa}&periodo=${periodo}`);
        result = await r.json();
        if (result.error) throw new Error(result.error);
      } else if (tab === 'historico') {
        const r = await fetch(`${API_URL}/api/relatorios/historico?empresa=${empresa}&meses=12`);
        result = await r.json();
        if (result.error) throw new Error(result.error);
      } else if (tab === 'consolidado') {
        const r = await fetch(`${API_URL}/api/relatorios/consolidado?empresa=${empresa}&periodo=${periodo}`);
        result = await r.json();
        if (result.error) throw new Error(result.error);
      }
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err) {
      setError(prev => ({ ...prev, [tab]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, selectedClient, selectedPeriod]);

  const tabs = [
    { id: 'descarregamentos', label: 'Descarregamentos', icon: <Droplet size={15} /> },
    { id: 'vendas',           label: 'Vendas PDV',       icon: <BarChart2 size={15} /> },
    { id: 'consolidado',      label: 'Consolidado',      icon: <Layers size={15} /> },
    { id: 'historico',        label: 'Histórico',        icon: <TrendingUp size={15} /> },
  ];

  const renderDescarregamentos = () => {
    const d = data.descarregamentos;
    if (!d) return null;
    const rows = descSubTab === 'comNota' ? d.comNota : d.semNota;
    const totalQtd = rows.reduce((s, r) => s + r.qtd, 0);
    const totalVal = rows.reduce((s, r) => s + r.total, 0);
    return (
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon red"><Droplet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Com Nota (110)</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.comNota.reduce((s, r) => s + r.qtd, 0), 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon orange"><Droplet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Sem Nota (220)</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.semNota.reduce((s, r) => s + r.qtd, 0), 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon green"><DollarSign size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Valor Total</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtBRL([...d.comNota, ...d.semNota].reduce((s, r) => s + r.total, 0))}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {['comNota', 'semNota'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setDescSubTab(t)}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: descSubTab === t ? '#E31E24' : '#222', color: descSubTab === t ? '#fff' : '#888',
              }}
            >
              {t === 'comNota' ? `Com Nota (110) — ${d.comNota.length}` : `Sem Nota (220) — ${d.semNota.length}`}
            </button>
          ))}
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATA</th>
                <th>FORNECEDOR</th>
                <th>COMBUSTÍVEL</th>
                <th style={{ textAlign: 'right' }}>LITROS</th>
                <th style={{ textAlign: 'right' }}>UNIT.</th>
                <th style={{ textAlign: 'right' }}>TOTAL</th>
                {descSubTab === 'comNota' ? <><th>NOTA</th><th>PLACA</th></> : <><th>PEDIDO</th><th>OBSERVAÇÃO</th></>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Nenhum registro encontrado.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmtDate(r.data)}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fornecedor}</td>
                  <td>{r.combustivel}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4CAF50', fontWeight: 600 }}>{fmtNum(r.qtd, 3)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>{fmtBRL(r.unitario)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtBRL(r.total)}</td>
                  {descSubTab === 'comNota'
                    ? <><td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>{r.nota || '—'}</td><td style={{ fontSize: '12px', color: '#888' }}>{r.placa || '—'}</td></>
                    : <><td style={{ fontSize: '12px', color: '#888' }}>#{r.pedido}</td><td style={{ fontSize: '11px', color: '#888', maxWidth: '200px' }}>{r.observacao || '—'}</td></>
                  }
                </tr>
              ))}
              {rows.length > 0 && (
                <tr style={{ background: '#1a1a1a', fontWeight: 700 }}>
                  <td colSpan={3} style={{ color: '#888' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4CAF50' }}>{fmtNum(totalQtd, 3)} L</td>
                  <td></td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtBRL(totalVal)}</td>
                  <td></td><td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVendas = () => {
    const d = data.vendas;
    if (!d) return null;
    const maxVal = d.produtos.length > 0 ? Math.max(...d.produtos.map(p => p.valorTotal)) : 1;
    return (
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon red"><BarChart2 size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Produtos vendidos</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{d.produtos.length}</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon green"><Droplet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Volume Total</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.totais.qtdTotal, 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon blue"><DollarSign size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Faturamento</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtBRL(d.totais.valorTotal)}</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon orange"><Calculator size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Comandas</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.totais.qtdVendas)}</div>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PRODUTO</th>
                <th>TIPO</th>
                <th style={{ textAlign: 'right' }}>QTD.</th>
                <th style={{ textAlign: 'right' }}>PREÇO MÉDIO</th>
                <th style={{ textAlign: 'right' }}>FATURAMENTO</th>
                <th style={{ textAlign: 'right' }}>COMANDAS</th>
                <th style={{ width: '120px' }}>PARTICIPAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {d.produtos.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Nenhuma venda encontrada.</td></tr>
              )}
              {d.produtos.map((p, i) => {
                const pct = maxVal > 0 ? (p.valorTotal / maxVal * 100) : 0;
                return (
                  <tr key={i}>
                    <td style={{ color: '#555', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.produto}</td>
                    <td><span className="category-badge">{p.tipoProd === 1 ? 'Combustível' : 'Produto'}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#E31E24' }}>{fmtNum(p.qtdTotal, 3)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>{fmtBRL(p.precoMedio)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtBRL(p.valorTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(p.qtdVendas)}</td>
                    <td>
                      <div style={{ background: '#111', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#E31E24', borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{fmtNum(pct, 1)}%</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConsolidado = () => {
    const d = data.consolidado;
    if (!d || !Array.isArray(d)) return null;
    return (
      <div>
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#888' }}>
          Comparativo entre volume registrado no LMC (encerrantes) e total vendido pelo PDV no período.
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>COMBUSTÍVEL</th>
                <th style={{ textAlign: 'right' }}>VOL. LMC</th>
                <th style={{ textAlign: 'right' }}>VOL. PDV</th>
                <th style={{ textAlign: 'right' }}>DIF. LMC-PDV</th>
                <th style={{ textAlign: 'right' }}>COMPRA 110</th>
                <th style={{ textAlign: 'right' }}>COMPRA 220</th>
                <th style={{ textAlign: 'right', color: '#4CAF50' }}>VENDA 110</th>
                <th style={{ textAlign: 'right', color: '#F59E0B' }}>VENDA 220</th>
                <th style={{ textAlign: 'right' }}>AFERIÇÕES</th>
                <th style={{ textAlign: 'right' }}>FAT. PDV</th>
              </tr>
            </thead>
            <tbody>
              {d.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Nenhum dado encontrado.</td></tr>
              )}
              {d.map((r, i) => {
                const difCls = r.difLmcPdv > 50 ? '#E31E24' : r.difLmcPdv < -50 ? '#F59E0B' : '#4CAF50';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.combustivel}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(r.volLmc, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(r.volPdv, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: difCls, fontWeight: 600 }}>
                      {r.difLmcPdv >= 0 ? '+' : ''}{fmtNum(r.difLmcPdv, 2)} L
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>{fmtNum(r.compra110Qtd, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#F59E0B' }}>{fmtNum(r.compra220Qtd, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4CAF50', fontSize: '12px' }}>{fmtNum(r.venda110Qtd, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B', fontSize: '12px' }}>{fmtNum(r.venda220Qtd, 1)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>{fmtNum(r.afericoes, 2)} L</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>{fmtBRL(r.valorPdv)}</td>
                  </tr>
                );
              })}
              {d.length > 0 && (
                <tr style={{ background: '#1a1a1a', fontWeight: 700 }}>
                  <td style={{ color: '#888' }}>TOTAL</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(d.reduce((s, r) => s + r.volLmc, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(d.reduce((s, r) => s + r.volPdv, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(d.reduce((s, r) => s + r.difLmcPdv, 0), 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(d.reduce((s, r) => s + r.compra110Qtd, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{fmtNum(d.reduce((s, r) => s + r.compra220Qtd, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4CAF50' }}>{fmtNum(d.reduce((s, r) => s + r.venda110Qtd, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{fmtNum(d.reduce((s, r) => s + r.venda220Qtd, 0), 1)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#888' }}>{fmtNum(d.reduce((s, r) => s + r.afericoes, 0), 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtBRL(d.reduce((s, r) => s + r.valorPdv, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHistorico = () => {
    const d = data.historico;
    if (!d || !Array.isArray(d)) return null;
    const periodos = [...new Set(d.map(r => r.periodo))];
    const combustiveis = [...new Set(d.map(r => r.combustivel))];
    return (
      <div>
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#888' }}>
          Histórico de volume vendido por combustível nos últimos 12 meses (fonte: LMC).
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                {combustiveis.map(c => (
                  <th key={c} style={{ textAlign: 'right' }}>{c.split(' ').slice(0, 2).join(' ')}</th>
                ))}
                <th style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {periodos.length === 0 && (
                <tr><td colSpan={combustiveis.length + 2} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Sem histórico disponível.</td></tr>
              )}
              {periodos.map((per, i) => {
                const linhas = d.filter(r => r.periodo === per);
                const total = linhas.reduce((s, r) => s + r.volumeVendido, 0);
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{per}</td>
                    {combustiveis.map(c => {
                      const row = linhas.find(r => r.combustivel === c);
                      return (
                        <td key={c} style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '13px' }}>
                          {row ? fmtNum(row.volumeVendido, 0) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#E31E24' }}>{fmtNum(total, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading[activeTab]) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <div>Carregando dados...</div>
        </div>
      );
    }
    if (error[activeTab]) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#E31E24' }}>
          <AlertCircle size={32} style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Erro ao carregar</div>
          <div style={{ fontSize: '13px', color: '#888' }}>{error[activeTab]}</div>
          <button type="button" className="btn-primary" onClick={() => fetchTab(activeTab)} style={{ marginTop: '16px', width: 'auto', padding: '8px 20px' }}>
            Tentar novamente
          </button>
        </div>
      );
    }
    if (!data[activeTab]) return null;
    if (activeTab === 'descarregamentos') return renderDescarregamentos();
    if (activeTab === 'vendas') return renderVendas();
    if (activeTab === 'consolidado') return renderConsolidado();
    if (activeTab === 'historico') return renderHistorico();
    return null;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>RELATÓRIOS</h2>
        <button type="button" className="btn-secondary" onClick={() => fetchTab(activeTab)} style={{ width: 'auto', display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px', fontSize: '13px' }}>
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              color: activeTab === tab.id ? '#E31E24' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #E31E24' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '200px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

// Control Component
const Control = ({ lmcRegistros, lmcDiario, lmcControle, selectedPeriod, setSelectedPeriod }) => {
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [showPrintPanel, setShowPrintPanel] = useState(false);
  const [printFilters, setPrintFilters] = useState({
    dataInicial: '',
    dataFinal: '',
    tipo: 'resumido',
    produto: 'all',
  });
  const [fisicoEdits, setFisicoEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-fisico') || '{}');
    } catch {
      return {};
    }
  });

  const fmt2 = (n) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fuels = [];
  const seenFuels = new Set();
  (lmcControle || []).forEach(r => {
    const codigo = Number(r.codProduto);
    if (!seenFuels.has(codigo)) {
      seenFuels.add(codigo);
      fuels.push({ codigo, nome: r.descricaoProduto });
    }
  });
  (lmcRegistros || []).forEach(r => {
    const codigo = Number(r.combustivelCodigo);
    if (!seenFuels.has(codigo)) {
      seenFuels.add(codigo);
      fuels.push({ codigo, nome: r.combustivelNome });
    }
  });

  const activeFuelId = fuels.some(f => f.codigo === selectedFuelId)
    ? selectedFuelId
    : (fuels[0]?.codigo ?? null);

  function getPeriodDateRange() {
    const [monthRaw, yearRaw] = (selectedPeriod || '').split('/');
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    if (!month || !year) return { dataInicial: '', dataFinal: '' };
    const lastDay = new Date(year, month, 0).getDate();
    return {
      dataInicial: `${year}-${String(month).padStart(2, '0')}-01`,
      dataFinal: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  function openPrintPanel() {
    const range = getPeriodDateRange();
    setPrintFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal: prev.dataFinal || range.dataFinal,
      produto: activeFuelId ? String(activeFuelId) : prev.produto,
    }));
    setShowPrintPanel(true);
  }

  function handleGeneratePrint() {
    const productName = printFilters.produto === 'all'
      ? 'Todos os produtos'
      : (fuels.find(f => String(f.codigo) === printFilters.produto)?.nome || 'Produto selecionado');
    window.alert(`Relatorio ${printFilters.tipo} pronto para impressao.\nProduto: ${productName}\nPeriodo: ${printFilters.dataInicial || '-'} ate ${printFilters.dataFinal || '-'}`);
    setShowPrintPanel(false);
  }

  function toUTCDateStr(ts) {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  function formatDayBR(ts) {
    const d = new Date(ts);
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  function parseInputNumber(value) {
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatInputNumber(value) {
    return String(Number((value || 0).toFixed(2)));
  }

  function persistFisicoEdit(key, value) {
    setFisicoEdits(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('starvl:lmc-fisico', JSON.stringify(next));
      return next;
    });
  }

  const lmcByKey = {};
  (lmcRegistros || []).forEach(r => {
    const produto = Number(r.combustivelCodigo);
    const dayKey = toUTCDateStr(r.data);
    lmcByKey[`${produto}|${dayKey}`] = r;
  });

  const controleByKey = {};
  (lmcControle || []).forEach(r => {
    const produto = Number(r.codProduto);
    const dayKey = toUTCDateStr(r.emissao);
    controleByKey[`${produto}|${dayKey}`] = r;
  });

  const fallbackCompras110Map = {};
  const fallbackCompras220Map = {};
  if ((!lmcControle || lmcControle.length === 0) && lmcDiario) {
    lmcDiario.comprasDiarias.filter(r => Number(r.produto) === activeFuelId).forEach(r => {
      const k = toUTCDateStr(r.dia);
      if (r.tipo === '110') fallbackCompras110Map[k] = (fallbackCompras110Map[k] || 0) + r.qtdComprada;
      else fallbackCompras220Map[k] = (fallbackCompras220Map[k] || 0) + r.qtdComprada;
    });
  }

  const dayKeys = new Set();
  (lmcRegistros || [])
    .filter(r => Number(r.combustivelCodigo) === activeFuelId)
    .forEach(r => dayKeys.add(toUTCDateStr(r.data)));
  (lmcControle || [])
    .filter(r => Number(r.codProduto) === activeFuelId)
    .forEach(r => dayKeys.add(toUTCDateStr(r.emissao)));

  const tableRows = Array.from(dayKeys)
    .sort()
    .map(dayKey => {
      const lmc = lmcByKey[`${activeFuelId}|${dayKey}`];
      const movimento = controleByKey[`${activeFuelId}|${dayKey}`];
      const fisicoKey = `${selectedPeriod}|${activeFuelId}|${dayKey}`;
      const fechamento = lmc?.fechamento || 0;
      const fisicoInput = fisicoEdits[fisicoKey] ?? formatInputNumber(fechamento);
      const fisico = parseInputNumber(fisicoInput);
      const perdas = fechamento - fisico;

      return {
        key: dayKey,
        fisicoKey,
        dia: formatDayBR(dayKey),
        abertura: lmc?.abertura || 0,
        compras110: movimento?.compra110 ?? fallbackCompras110Map[dayKey] ?? 0,
        compras220: movimento?.compra220 ?? fallbackCompras220Map[dayKey] ?? 0,
        afericoes: movimento?.afericao ?? lmc?.afericao ?? 0,
        vendas: movimento?.venda ?? lmc?.venda ?? 0,
        fechamento,
        fisicoInput,
        fisico,
        perdas,
      };
    });

  const totals = tableRows.reduce((acc, r) => ({
    compras110: acc.compras110 + r.compras110,
    compras220: acc.compras220 + r.compras220,
    afericoes: acc.afericoes + r.afericoes,
    vendas: acc.vendas + r.vendas,
    fisico: acc.fisico + r.fisico,
    perdas: acc.perdas + r.perdas,
  }), { compras110: 0, compras220: 0, afericoes: 0, vendas: 0, fisico: 0, perdas: 0 });

  const [periodoMes, periodoAno] = (selectedPeriod || '').split('/');
  function updatePeriod(nextMonth, nextYear) {
    const month = nextMonth || periodoMes || MONTH_OPTIONS[0].value;
    const year = nextYear || periodoAno || String(new Date().getFullYear());
    setSelectedPeriod(`${month}/${year}`);
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>CONTROLE MOVIMENTACAO COMBUSTIVEL</h2>
        <div className="header-actions">
          <div className="control-filter-group">
            <label className="control-filter-label">ANO</label>
            <div className="control-filter-select">
              <Calendar size={15} />
              <select value={periodoAno || ''} onChange={(e) => updatePeriod(periodoMes, e.target.value)}>
                {PERIOD_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="control-filter-group">
            <label className="control-filter-label">MÊS</label>
            <div className="control-filter-select">
              <Calendar size={15} />
              <select value={periodoMes || ''} onChange={(e) => updatePeriod(e.target.value, periodoAno)}>
                {MONTH_OPTIONS.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="control-filter-group">
            <label className="control-filter-label">COMBUSTÍVEL</label>
            <div className="control-filter-select">
              <Droplet size={15} style={{ color: '#E31E24' }} />
              <select value={activeFuelId || ''} onChange={(e) => setSelectedFuelId(parseInt(e.target.value))}>
                {fuels.map(f => <option key={f.codigo} value={f.codigo}>{f.nome}</option>)}
                {fuels.length === 0 && <option value="">—</option>}
              </select>
            </div>
          </div>
          <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-end' }} onClick={openPrintPanel}>
            <Printer size={18} />
            IMPRESSAO
          </button>
        </div>
      </div>

      {tableRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
          {!lmcRegistros && !lmcControle ? 'Carregando dados...' : 'Nenhum registro LMC encontrado para o período selecionado.'}
        </div>
      ) : (
        <>
          <div className="table-container lmc-table-container">
            <table className="data-table lmc-control-table">
              <thead>
                <tr>
                  <th>DIA</th>
                  <th>ESTOQUE ABERTURA</th>
                  <th>COMPRAS 110</th>
                  <th>COMPRAS 220</th>
                  <th>AFERIÇÕES</th>
                  <th>VENDAS</th>
                  <th>ESTOQUE FECHAMENTO</th>
                  <th>ESTOQUE FÍSICO</th>
                  <th>PERDAS / SOBRAS</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.dia}</td>
                    <td>{fmt2(row.abertura)}</td>
                    <td>{fmt2(row.compras110)}</td>
                    <td>{fmt2(row.compras220)}</td>
                    <td>{fmt2(row.afericoes)}</td>
                    <td>{fmt2(row.vendas)}</td>
                    <td>{fmt2(row.fechamento)}</td>
                    <td>
                      <input
                        className="lmc-fisico-input"
                        type="text"
                        inputMode="decimal"
                        value={row.fisicoInput}
                        onChange={(e) => persistFisicoEdit(row.fisicoKey, e.target.value)}
                        aria-label={`Estoque fisico ${row.dia}`}
                      />
                    </td>
                    <td style={{ color: row.perdas < -0.01 ? '#f87171' : row.perdas > 0.01 ? '#22c55e' : 'inherit' }}>
                      {fmt2(row.perdas)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAIS</strong></td>
                  <td>—</td>
                  <td><strong>{fmt2(totals.compras110)}</strong></td>
                  <td><strong>{fmt2(totals.compras220)}</strong></td>
                  <td><strong>{fmt2(totals.afericoes)}</strong></td>
                  <td><strong>{fmt2(totals.vendas)}</strong></td>
                  <td>—</td>
                  <td><strong>{fmt2(totals.fisico)}</strong></td>
                  <td style={{ color: totals.perdas < -0.01 ? '#f87171' : totals.perdas > 0.01 ? '#22c55e' : 'inherit' }}>
                    <strong>{fmt2(totals.perdas)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="table-footer">
            <div className="table-info">Exibindo {tableRows.length} dias — {fuels.find(f => f.codigo === activeFuelId)?.nome || ''}</div>
          </div>
        </>
      )}

      {showPrintPanel && (
        <ControlPrintPanel
          fuels={fuels}
          filters={printFilters}
          setFilters={setPrintFilters}
          onClose={() => setShowPrintPanel(false)}
          onGenerate={handleGeneratePrint}
        />
      )}
    </div>
  );
};

const ControlPrintPanel = ({ fuels, filters, setFilters, onClose, onGenerate }) => {
  const update = (field) => (e) => setFilters(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel" onClick={(e) => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>SELECIONE FILTROS PARA IMPRESSAO</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar filtros">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <p className="control-print-subtitle">Defina os filtros desejados para gerar a impressao do relatorio.</p>

          <div className="control-print-grid">
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Calendar size={20} />
                <span>PERIODO</span>
              </div>
              <div className="control-print-date-row">
                <label className="control-print-field">
                  <span>DATA INICIAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataInicial} onChange={update('dataInicial')} />
                    <Calendar size={19} />
                  </div>
                </label>
                <label className="control-print-field">
                  <span>DATA FINAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataFinal} onChange={update('dataFinal')} />
                    <Calendar size={19} />
                  </div>
                </label>
              </div>
              <div className="control-print-hint">
                <AlertCircle size={16} />
                <span>Selecione o periodo desejado para a impressao.</span>
              </div>
            </section>

            <section className="control-print-section">
              <div className="control-print-section-title">
                <FileText size={20} />
                <span>TIPO</span>
              </div>
              <label className={`control-print-option ${filters.tipo === 'resumido' ? 'selected' : ''}`}>
                <FileText size={28} />
                <div>
                  <strong>RESUMIDO</strong>
                  <span>Relatorio com informacoes resumidas.</span>
                </div>
                <input type="radio" name="tipoRelatorio" value="resumido" checked={filters.tipo === 'resumido'} onChange={update('tipo')} />
              </label>
              <label className={`control-print-option ${filters.tipo === 'detalhado' ? 'selected' : ''}`}>
                <Layers size={28} />
                <div>
                  <strong>DETALHADO</strong>
                  <span>Relatorio com informacoes detalhadas.</span>
                </div>
                <input type="radio" name="tipoRelatorio" value="detalhado" checked={filters.tipo === 'detalhado'} onChange={update('tipo')} />
              </label>
            </section>
          </div>

          <section className="control-print-section control-print-product">
            <div className="control-print-section-title">
              <Package size={20} />
              <span>PRODUTO</span>
            </div>
            <div className="control-print-select">
              <select value={filters.produto} onChange={update('produto')}>
                <option value="all">Todos os produtos</option>
                {fuels.map(f => <option key={f.codigo} value={String(f.codigo)}>{f.nome}</option>)}
              </select>
              <ChevronDown size={20} />
            </div>
            <div className="control-print-hint">
              <AlertCircle size={16} />
              <span>Selecione um produto para filtrar o relatorio.</span>
            </div>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>
            <X size={20} />
            CANCELAR
          </button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={20} />
            GERAR IMPRESSAO
          </button>
        </div>
      </div>
    </div>
  );
};

// Stock Position Component
const StockPosition = ({ estoques, projecao, loading }) => {
  const [selectedFuelId, setSelectedFuelId] = useState(null);

  const estoquesList = estoques || [];
  const activeFuel = estoquesList.find(e => e.produtoCodigo === selectedFuelId) || estoquesList[0];
  const activeProjecao = (projecao || []).find(p => p.produtoCodigo === activeFuel?.produtoCodigo) || null;

  const fmt2 = (n) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtR = (n) => 'R$ ' + fmt2(n);

  const tankPct = activeFuel ? Math.min(Math.max(activeFuel.percentualOcupacao, 0), 100) : 0;
  const mediaDiaria = activeProjecao?.mediaDiariaLitros || 0;

  const hoje = new Date();
  const projecaoChart = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const estoqueProjetado = Math.max(0, (activeFuel?.estoqueTotal || 0) - (mediaDiaria * i));
    return {
      date: label,
      estoque: estoqueProjetado,
      consumoAcumulado: mediaDiaria * i,
    };
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>POSIÇÃO ESTOQUE</h2>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '8px 0 16px', color: '#E31E24', fontSize: '13px' }}>
          Buscando dados do banco de dados...
        </div>
      )}

      <div className="stock-grid">
        <div className="stock-tank-card">
          <div className="card-header">
            <h3>COMBUSTÍVEL SELECIONADO</h3>
          </div>
          <select
            className="fuel-select-large"
            value={selectedFuelId || estoquesList[0]?.produtoCodigo || ''}
            onChange={(e) => setSelectedFuelId(parseInt(e.target.value))}
          >
            {estoquesList.map(e => (
              <option key={e.produtoCodigo} value={e.produtoCodigo}>{e.produtoNome}</option>
            ))}
            {estoquesList.length === 0 && <option value="">Carregando...</option>}
          </select>

          <div className="tank-visual">
            <div className="fuel-tank-wrap">
              <div className="tank-neck" />
              <div className="tank">
                <div className="tank-fill" style={{ height: `${tankPct}%` }}>
                  <div className="liquid-wave" />
                </div>
                <div className="tank-label">
                  <div className="tank-title">QTD COMBUSTÍVEL</div>
                  <div className="tank-value">{activeFuel ? fmt2(activeFuel.estoqueTotal) : '—'}</div>
                  <div className="tank-unit">LITROS</div>
                </div>
                <div className="tank-gloss" />
              </div>
            </div>
          </div>

          <div className="update-time">
            <Calendar size={18} />
            <span>CAPACIDADE TOTAL:</span>
            <strong>{activeFuel ? fmt2(activeFuel.capacidadeTotal) + ' L' : '—'}</strong>
          </div>
        </div>

        <div className="stock-projection-card">
          <div className="card-header">
            <h3>PROJEÇÃO DE CONSUMO</h3>
          </div>
          <div className="projection-subtitle">
            BASE: MÉDIA DOS ÚLTIMOS 7 DIAS
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projecaoChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" label={{ value: 'ESTOQUE (L)', angle: -90, position: 'insideLeft', fill: '#666' }} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #E31E24' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v, name) => [fmt2(v) + ' L', name === 'estoque' ? 'Estoque projetado' : 'Consumo acumulado']}
              />
              <Legend />
              <Line type="monotone" dataKey="estoque" stroke="#E31E24" strokeWidth={3} name="ESTOQUE PROJETADO" dot={{ fill: '#E31E24', r: 4 }}>
                <LabelList dataKey="estoque" position="top" formatter={(v) => fmt2(v) + ' L'} fill="#fff" fontSize={10} />
              </Line>
              <Line type="monotone" dataKey="consumoAcumulado" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="CONSUMO ACUMULADO" dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>

          <div className="projection-metrics">
            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-label">MÉDIA DIÁRIA (7 DIAS)</div>
                <div className="metric-number">{fmt2(mediaDiaria)}</div>
                <div className="metric-unit">LITROS</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">DIAS DE ESTOQUE</div>
                <div className="metric-number">{activeProjecao ? (activeProjecao.diasRestantes > 999 ? '∞' : activeProjecao.diasRestantes) : '—'}</div>
                <div className="metric-unit">DIAS</div>
              </div>
            </div>
            <div className="stock-days-alert" style={{ color: activeProjecao?.alertaAbastecimento ? '#f87171' : '#22c55e' }}>
              <span>STATUS:</span>
              <strong className="alert-value">
                {activeProjecao?.alertaAbastecimento ? '⚠ ABASTECER EM BREVE' : activeProjecao ? '✓ ESTOQUE ADEQUADO' : '—'}
              </strong>
            </div>
          </div>
        </div>

        <div className="stock-values-card">
          <div className="card-header">
            <h3>VALORES ESTOQUE</h3>
          </div>
          <div className="value-items">
            <div className="value-item">
              <div className="value-icon"><Droplet size={24} /></div>
              <div className="value-content">
                <div className="value-label">PREÇO DE VENDA / L</div>
                <div className="value-amount">{fmtR(activeFuel?.precoVenda)}</div>
              </div>
            </div>
            <div className="value-item highlight">
              <div className="value-icon"><Layers size={24} /></div>
              <div className="value-content">
                <div className="value-label">VALOR TOTAL ESTOQUE</div>
                <div className="value-amount">{fmtR(activeFuel?.valorEstoque)}</div>
              </div>
            </div>
            <div className="value-item">
              <div className="value-icon"><CircleDollarSign size={24} /></div>
              <div className="value-content">
                <div className="value-label">CUSTO MÉDIO / L</div>
                <div className="value-amount">{fmtR(activeFuel?.custoMedio)}</div>
              </div>
            </div>
            <div className="value-item">
              <div className="value-icon"><Calculator size={24} /></div>
              <div className="value-content">
                <div className="value-label">MARGEM ESTIMADA</div>
                <div className="value-amount" style={{ color: (activeFuel?.margem || 0) > 0 ? '#22c55e' : '#f87171' }}>
                  {(activeFuel?.margem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Component
const adminToUser = (u) => ({
  id: u.id,
  name: u.usuario,
  email: '',
  role: u.perfil === 'admin' ? 'Administrador' : 'Usuário',
  status: 'Ativo',
  lastAccess: 'N/A',
  avatar: (u.usuario || 'U').charAt(0).toUpperCase(),
});

const userToAdmin = (user, existing) => ({
  ...(existing || {}),
  id: existing ? existing.id : user.id,
  usuario: user.name,
  perfil: user.role === 'Administrador' ? 'admin' : 'user',
  senha: (user.senha && user.senha.trim()) ? user.senha : (existing ? existing.senha : ''),
});

const Users = ({ adminUsers, setAdminUsers, isAdmin }) => {
  const users = (adminUsers || []).map(adminToUser);
  const setUsers = (updater) => {
    const nextUsers = typeof updater === 'function' ? updater(users) : updater;
    setAdminUsers(nextUsers.map(u => {
      const existing = (adminUsers || []).find(a => a.id === u.id);
      return userToAdmin(u, existing);
    }));
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((user) => {
    const query = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.status.toLowerCase().includes(query)
    );
  });

  const activeUsers = users.filter((user) => user.status === 'Ativo').length;
  const pendingUsers = users.filter((user) => user.status === 'Pendente').length;

  const handleCreate = () => {
    setSelectedUser({
      id: null,
      name: '',
      email: '',
      role: 'Usuário',
      status: 'Ativo',
      lastAccess: 'Nunca',
      avatar: 'U',
    });
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (user) => {
    window.alert(`${user.name}\n${user.email}\nPerfil: ${user.role}\nStatus: ${user.status}`);
  };

  const handleDelete = (userId) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return;

    const shouldDelete = window.confirm(`Deseja remover o usuário ${user.name}?`);
    if (shouldDelete) {
      setUsers(users.filter((item) => item.id !== userId));
    }
  };

  const handleSave = (formData) => {
    if (modalMode === 'create') {
      const firstLetter = formData.name.trim().charAt(0).toUpperCase() || 'U';
      setUsers([
        ...users,
        {
          ...formData,
          id: Date.now(),
          avatar: firstLetter,
          lastAccess: 'Nunca',
        },
      ]);
    } else {
      setUsers(users.map((user) => (
        user.id === selectedUser.id
          ? { ...user, ...formData }
          : user
      )));
    }

    setShowModal(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>GERENCIAMENTO DE USUÁRIOS</h2>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button type="button" className="btn-primary" onClick={handleCreate}>
              <Plus size={18} />
              ADICIONAR USUÁRIO
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red">
            <UsersIcon size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total de Usuários</div>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Usuários Ativos</div>
            <div className="stat-value">{activeUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Novos Cadastros</div>
            <div className="stat-value">32</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value">{pendingUsers}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Usuários</button>
        <button className="tab">Permissões</button>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Nome Completo ↕</th>
              <th>E-mail</th>
              <th>Papel (Role) ↕</th>
              <th>Status ↕</th>
              <th>Último Acesso ↕</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="avatar">{user.avatar}</div>
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastAccess}</td>
                <td>
                  <div className="action-buttons">
                    {isAdmin && (
                      <button type="button" className="action-btn" onClick={() => handleEdit(user)} aria-label={`Editar ${user.name}`}>
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button type="button" className="action-btn" onClick={() => handleView(user)} aria-label={`Visualizar ${user.name}`}>
                      <Eye size={16} />
                    </button>
                    {isAdmin && (
                      <button type="button" className="action-btn delete" onClick={() => handleDelete(user.id)} aria-label={`Remover ${user.name}`}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="table-info"></div>
        <div className="pagination">
          <button className="page-btn">«</button>
          <button className="page-btn">‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">...</button>
          <button className="page-btn">›</button>
          <button className="page-btn">»</button>
        </div>
      </div>

      {showModal && (
        <UserEditModal
          user={selectedUser}
          mode={modalMode}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// User Edit Modal
const UserEditModal = ({ user, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    role: user.role,
    status: user.status,
    senha: '',
    notifications: false,
    apiAccess: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <div className="avatar large">{user.avatar}</div>
            <h3>{mode === 'create' ? 'NOVO USUÁRIO' : `EDITAR USUÁRIO: ${user.name.toUpperCase()}`}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label>Nome Completo <span className="required">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>
              Senha {mode === 'create' ? <span className="required">*</span> : <span style={{ color: '#666', fontWeight: 400 }}>(deixe em branco para manter)</span>}
            </label>
            <input
              type="password"
              placeholder={mode === 'create' ? 'Defina uma senha' : 'Nova senha (opcional)'}
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              required={mode === 'create'}
            />
          </div>

          <div className="form-group">
            <label>Papel (Role) <span className="required">*</span></label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              <option>Usuário</option>
              <option>Administrador</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status <span className="required">*</span></label>
            <div className="toggle-group">
              <button 
                type="button"
                className={`toggle-btn ${formData.status === 'Ativo' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'Ativo'})}
              >
                Ativo
              </button>
              <button 
                type="button"
                className={`toggle-btn ${formData.status === 'Inativo' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'Inativo'})}
              >
                Inativo
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Preferências</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.notifications}
                  onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                />
                Receber Notificações
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.apiAccess}
                  onChange={(e) => setFormData({...formData, apiAccess: e.target.checked})}
                />
                Acesso à API
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="submit" className="btn-primary">
            <FileText size={18} />
            SALVAR ALTERAÇÕES
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            CANCELAR
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

// Parameters Component
const Parameters = ({ clients, setClients, isAdmin }) => {
  const [form, setForm] = useState({
    codigo: '001',
    razaoSocial: 'STARVL SISTEMAS LTDA',
    apelido: 'STARVL',
    nro: '123',
    logradouro: 'RUA DAS FLORES',
    cep: '86020-000',
    cidade: 'LONDRINA',
    pais: 'BRASIL',
    telefone: '(43) 3371-0000',
    email: 'contato@starvl.com.br',
    obs: 'EMPRESA DO GRUPO STARVL SISTEMAS.\nDESENVOLVIMENTO DE SISTEMAS E SOLUÇÕES TECNOLÓGICAS.',
  });

  const handleSave = (e) => {
    e.preventDefault();
    window.alert('Empresa salva com sucesso!');
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>CADASTRO DE EMPRESAS</h2>
      </div>

      <form className="params-form" onSubmit={handleSave}>
        <div className="params-grid">
          <div className="form-group">
            <label>CÓDIGO EMPRESA <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Building2 size={16} />
              <input type="text" value={form.codigo} onChange={update('codigo')} required />
            </div>
          </div>

          <div className="form-group">
            <label>RAZÃO SOCIAL <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <FileText size={16} />
              <input type="text" value={form.razaoSocial} onChange={update('razaoSocial')} required />
            </div>
          </div>

          <div className="form-group">
            <label>APELIDO COMERCIAL <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Tag size={16} />
              <input type="text" value={form.apelido} onChange={update('apelido')} required />
            </div>
          </div>

          <div className="form-group">
            <label>NRO <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Hash size={16} />
              <input type="text" value={form.nro} onChange={update('nro')} required />
            </div>
          </div>

          <div className="form-group params-span2">
            <label>LOGRADOURO <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <MapPin size={16} />
              <input type="text" value={form.logradouro} onChange={update('logradouro')} required />
            </div>
          </div>

          <div className="form-group">
            <label>CEP <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Mail size={16} />
              <input type="text" value={form.cep} onChange={update('cep')} required />
            </div>
          </div>

          <div className="form-group">
            <label>CIDADE <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Building size={16} />
              <input type="text" value={form.cidade} onChange={update('cidade')} required />
            </div>
          </div>

          <div className="form-group">
            <label>PAÍS <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Globe size={16} />
              <select value={form.pais} onChange={update('pais')}>
                <option>BRASIL</option>
                <option>ESTADOS UNIDOS</option>
                <option>PORTUGAL</option>
              </select>
            </div>
          </div>

          <div className="form-group params-image-group">
            <label>IMAGEM DA EMPRESA</label>
            <div className="params-image-upload">
              <div className="params-image-preview">
                <Package size={40} style={{ color: '#555' }} />
              </div>
              <button type="button" className="btn-secondary" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                <Camera size={16} />
                ALTERAR IMAGEM
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>TELEFONE <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Phone size={16} />
              <input type="tel" value={form.telefone} onChange={update('telefone')} required />
            </div>
          </div>

          <div className="form-group params-span2">
            <label>E-MAIL <span className="required">*</span></label>
            <div className="params-input-wrapper">
              <Mail size={16} />
              <input type="email" value={form.email} onChange={update('email')} required />
            </div>
          </div>

          <div className="form-group params-span3">
            <label>OBS</label>
            <div className="params-input-wrapper params-textarea-wrapper">
              <FileText size={16} style={{ alignSelf: 'flex-start', marginTop: '3px' }} />
              <textarea value={form.obs} onChange={update('obs')} rows={3} />
            </div>
          </div>
        </div>

        <div className="params-actions">
          <button type="button" className="btn-secondary">CANCELAR</button>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 32px', fontSize: '14px', letterSpacing: '1px' }}>
            SALVAR EMPRESA
          </button>
        </div>
      </form>

      {isAdmin && (
        <div className="params-admin-section">
          <div className="page-header params-admin-header">
            <h2>CLIENTES / POSTOS</h2>
          </div>
          <AdminPanel clients={clients} setClients={setClients} />
        </div>
      )}
    </div>
  );
};

// Admin Panel Component
const AdminPanel = ({ clients, setClients }) => {
  const [newClient, setNewClient] = useState({ id: '', nome: '', banco: '', codigoEmpresa: '', host: '', dbUser: '', dbPass: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.nome.trim() || !newClient.banco.trim()) return;
    setClients([...clients, { ...newClient, id: newClient.id || Date.now() }]);
    setNewClient({ id: '', nome: '', banco: '', codigoEmpresa: '', host: '', dbUser: '', dbPass: '' });
    setShowAdvanced(false);
  };

  const handleRemoveClient = (id) => {
    setClients(clients.filter((c) => c.id !== id));
  };

  return (
    <div className="admin-panel-content">
      <div className="admin-grid">
        {/* CLIENTES / POSTOS */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Database size={18} />
              <span>CLIENTES / POSTOS</span>
            </div>
            <span className="admin-badge">{clients.length}</span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOME</th>
                  <th>BANCO</th>
                  <th>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.nome}</strong></td>
                    <td><span className="db-name">{c.banco}</span></td>
                    <td>
                      <button type="button" className="btn-remove" onClick={() => handleRemoveClient(c.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="admin-form" onSubmit={handleAddClient}>
            <div className="admin-form-title">NOVO CLIENTE</div>
            <input
              type="text"
              placeholder="ID (ex: 1234)"
              value={newClient.id}
              onChange={(e) => setNewClient({ ...newClient, id: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nome do posto"
              value={newClient.nome}
              onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Banco de dados (ex: ret_nomedoposto)"
              value={newClient.banco}
              onChange={(e) => setNewClient({ ...newClient, banco: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Código empresa (número)"
              value={newClient.codigoEmpresa}
              onChange={(e) => setNewClient({ ...newClient, codigoEmpresa: e.target.value })}
            />
            <button
              type="button"
              className="admin-advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <ChevronRight size={14} className={showAdvanced ? 'rotated' : ''} />
              Configurações avançadas (host/usuário/senha próprios)
            </button>
            {showAdvanced && (
              <div className="admin-advanced">
                <input
                  type="text"
                  placeholder="Host (ex: 192.168.1.10)"
                  value={newClient.host}
                  onChange={(e) => setNewClient({ ...newClient, host: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Usuário do banco"
                  value={newClient.dbUser}
                  onChange={(e) => setNewClient({ ...newClient, dbUser: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Senha do banco"
                  value={newClient.dbPass}
                  onChange={(e) => setNewClient({ ...newClient, dbPass: e.target.value })}
                />
              </div>
            )}
            <button type="submit" className="btn-success">Adicionar posto</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState(initialClients);
  const [selectedClient, setSelectedClient] = useState(initialClients[0].nome);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);

  const isAdmin = loggedUser?.perfil === 'admin';

  const [apiData, setApiData] = useState({
    kpis: null,
    combustiveis: [],
    vendasDiarias: [],
    vendasHorarias: [],
    lmcRegistros: null,
    lmcDiario: null,
    lmcControle: null,
    estoques: [],
    projecao: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const client = clients.find(c => c.nome === selectedClient) || clients[0];
    if (!client) return;
    const empresa = client.codigoEmpresa;
    const periodo = periodToApi(selectedPeriod);

    setApiData(prev => ({ ...prev, loading: true, error: null }));

    Promise.all([
      fetch(`${API_URL}/api/dashboard/kpis?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/combustiveis?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-horarias?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque?empresa=${empresa}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque/projecao?empresa=${empresa}&dias=7`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp]) => {
      setIsConnected(true);
      setApiData({
        kpis: kpis.error ? null : kpis,
        combustiveis: Array.isArray(combustiveis) ? combustiveis : [],
        vendasDiarias: Array.isArray(vendasDiarias) ? vendasDiarias : [],
        vendasHorarias: Array.isArray(vendasHorarias) ? vendasHorarias : [],
        lmcRegistros: lmcResp.registros || [],
        lmcDiario: lmcDiario || null,
        lmcControle: lmcControle.registros || [],
        estoques: estoqueResp.estoques || [],
        projecao: projecaoResp.projecoes || [],
        loading: false,
        error: null,
      });
    }).catch(err => {
      setIsConnected(false);
      setApiData(prev => ({ ...prev, loading: false, error: err.message }));
    });
  }, [selectedClient, selectedPeriod, clients]);

  const handleRefresh = () => {
    const client = clients.find(c => c.nome === selectedClient) || clients[0];
    if (!client) return;
    const empresa = client.codigoEmpresa;
    const periodo = periodToApi(selectedPeriod);

    setIsConnected(false);
    setApiData(prev => ({ ...prev, loading: true }));

    Promise.all([
      fetch(`${API_URL}/api/dashboard/kpis?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/combustiveis?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-horarias?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque?empresa=${empresa}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque/projecao?empresa=${empresa}&dias=7`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp]) => {
      setIsConnected(true);
      setApiData({
        kpis: kpis.error ? null : kpis,
        combustiveis: Array.isArray(combustiveis) ? combustiveis : [],
        vendasDiarias: Array.isArray(vendasDiarias) ? vendasDiarias : [],
        vendasHorarias: Array.isArray(vendasHorarias) ? vendasHorarias : [],
        lmcRegistros: lmcResp.registros || [],
        lmcDiario: lmcDiario || null,
        lmcControle: lmcControle.registros || [],
        estoques: estoqueResp.estoques || [],
        projecao: projecaoResp.projecoes || [],
        loading: false,
        error: null,
      });
    }).catch(err => {
      setIsConnected(false);
      setApiData(prev => ({ ...prev, loading: false, error: err.message }));
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard kpis={apiData.kpis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.lmcControle} estoques={apiData.estoques} loading={apiData.loading} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} selectedPeriod={selectedPeriod} clients={clients} />;
      case 'control':
        return <Control lmcRegistros={apiData.lmcRegistros} lmcDiario={apiData.lmcDiario} lmcControle={apiData.lmcControle} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />;
      case 'stock':
        return <StockPosition estoques={apiData.estoques} projecao={apiData.projecao} loading={apiData.loading} />;
      case 'users':
        return <Users adminUsers={adminUsers} setAdminUsers={setAdminUsers} isAdmin={isAdmin} />;
      case 'params':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      case 'admin':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      default:
        return <Dashboard kpis={apiData.kpis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.lmcControle} estoques={apiData.estoques} loading={apiData.loading} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(user) => { setIsLoggedIn(true); setLoggedUser(user); }} adminUsers={adminUsers} />;
  }

  return (
    <div className="app">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={() => { setIsLoggedIn(false); setLoggedUser(null); }}
      />
      <main className="main-content">
        <TopBar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isConnected={isConnected}
          clients={clients}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          onRefresh={handleRefresh}
          onLogout={() => { setIsLoggedIn(false); setLoggedUser(null); }}
          loggedUser={loggedUser}
        />
        {renderPage()}
      </main>
    </div>
  );
}
