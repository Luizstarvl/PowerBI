import React, { useState, useEffect, useCallback, useMemo } from 'react';
import logoStarvl from './logo-starvl.png';
import logoStarvlBlack from './logo-starvl-black.png';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LabelList, ComposedChart } from 'recharts';
import { Home, FileText, Users as UsersIcon, Truck, Package, LogOut, Eye, Search, Plus, Edit2, Trash2, X, Calendar, TrendingUp, Droplet, DollarSign, Calculator, Bell, ChevronDown, Activity, Settings, Building2, Phone, Mail, MapPin, Hash, Clock, BarChart2, Layers, CircleDollarSign, UserCheck, UserPlus, AlertCircle, Globe, Camera, Building, Tag, RefreshCw, Database, ChevronRight, Filter, Printer, Moon, Sun } from 'lucide-react';
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
const Sidebar = ({ currentPage, setCurrentPage, onLogout, themeMode }) => {
  const menuItems = [
    { icon: Home,      label: 'DASHBOARD',      page: 'dashboard' },
    { icon: Package,   label: 'POSIÇÃO ESTOQUE', page: 'stock'     },
    { icon: Truck,     label: 'LIVRO DE MOVIMENTAÇÃO', page: 'control'   },
    { icon: FileText,  label: 'RELATÓRIOS',      page: 'reports'   },
    { icon: Settings,  label: 'PARÂMETROS',      page: 'params'    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img
            src={themeMode === 'light' ? logoStarvlBlack : logoStarvl}
            alt="STARVL"
            className="sidebar-logo"
          />
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
  control: 'Livro de Movimentação',
  stock: 'Posição de Estoque',
  users: 'Gerenciamento de Usuários',
  params: 'Parâmetros',
};

const TopBar = ({ currentPage, setCurrentPage, isConnected, apiError, clients, selectedClient, setSelectedClient, selectedPeriod, setSelectedPeriod, onRefresh, onLogout, loggedUser, themeMode, setThemeMode }) => {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const connectionLabel = isConnected ? 'Conectado' : (apiError ? 'Servidor offline' : 'Desconectado');

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-title">{PAGE_TITLES[currentPage] || 'Dashboard'}</span>
        {currentPage === 'dashboard' && <span className="top-bar-date">{dateStr}</span>}
      </div>

      <div className="top-bar-center">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
          <span>{connectionLabel}</span>
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

        {currentPage === 'dashboard' && (
          <input
            className="topbar-select topbar-month"
            type="month"
            value={periodToMonthInput(selectedPeriod)}
            onChange={(e) => setSelectedPeriod(monthInputToPeriod(e.target.value))}
          />
        )}

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
        <div className="theme-toggle-group" aria-label="Tema">
          <button
            type="button"
            className={`theme-toggle-btn ${themeMode === 'dark' ? 'active' : ''}`}
            onClick={() => setThemeMode('dark')}
            title="Modo dark"
            aria-label="Modo dark"
          >
            <Moon size={17} />
          </button>
          <button
            type="button"
            className={`theme-toggle-btn ${themeMode === 'light' ? 'active' : ''}`}
            onClick={() => setThemeMode('light')}
            title="Modo white"
            aria-label="Modo white"
          >
            <Sun size={17} />
          </button>
        </div>
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

function getFriendlyApiError(error) {
  const message = String(error?.message || error || '').trim();
  if (!message || /failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Nao foi possivel conectar ao servidor. Verifique se a API esta online e tente atualizar novamente.';
  }
  return `Nao foi possivel carregar os dados. ${message}`;
}

const LoadingState = ({ label = 'Carregando dados...', compact = false }) => (
  <div className={`loading-state ${compact ? 'compact' : ''}`}>
    <RefreshCw size={compact ? 18 : 28} />
    <span>{label}</span>
  </div>
);

const ApiErrorNotice = ({ message, onRetry }) => (
  <div className="api-error-notice">
    <div className="api-error-icon"><AlertCircle size={20} /></div>
    <div className="api-error-text">
      <strong>Nao foi possivel conectar aos dados</strong>
      <span>{message || 'Tente atualizar novamente em alguns instantes.'}</span>
    </div>
    {onRetry && (
      <button type="button" className="api-error-action" onClick={onRetry}>
        <RefreshCw size={15} />
        Tentar novamente
      </button>
    )}
  </div>
);

const SkeletonCards = ({ count = 4 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div className="skeleton-card" key={index}>
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
        <div className="skeleton-line tiny" />
      </div>
    ))}
  </div>
);

const DASHBOARD_COLORS = {
  sale: '#E31E24',
  purchase110: '#4f8cff',
  purchase220: '#c7a65a',
  stock: '#22c55e',
  attention: '#facc15',
  neutral: '#2a2a2a',
  grid: '#262626',
  axis: '#7a7a7a',
  label: '#f8fafc',
  tooltipBg: '#151515',
};

const FUEL_COLORS = {
  ethanol: '#22c55e',
  gasoline: '#E31E24',
  diesel: '#f59e0b',
  gnv: '#2563eb',
};

const normalizeFuelName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

const getFuelColor = (name, fallback = DASHBOARD_COLORS.sale) => {
  const fuelName = normalizeFuelName(name);
  if (fuelName.includes('ETANOL')) return FUEL_COLORS.ethanol;
  if (fuelName.includes('GASOLINA')) return FUEL_COLORS.gasoline;
  if (fuelName.includes('DIESEL')) return FUEL_COLORS.diesel;
  if (fuelName.includes('GAS NATURAL') || fuelName.includes('GNV') || fuelName.includes('VEICULAR')) return FUEL_COLORS.gnv;
  return fallback;
};

// ── VendasPista ──────────────────────────────────────────────────────────────
const VP_PERIODS = [
  { key: 'diario',  label: 'Diário',  maWin: 7 },   // MA7 = 7 dias
  { key: 'semanal', label: 'Semanal', maWin: 4 },   // MA4 = 4 semanas
  { key: 'mensal',  label: 'Mensal',  maWin: 3 },   // MA3 = 3 meses
  { key: 'anual',   label: 'Anual',   maWin: 4 },   // MA4 = 4 anos
];

function vpDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Deriva dataInicio/dataFim com base no mês selecionado e na granularidade.
 * - diario/semanal → apenas o mês selecionado (totais coerentes entre si)
 * - mensal         → últimos 12 meses encerrados no mês selecionado
 * - anual          → últimos 24 meses encerrados no mês selecionado
 */
function vpDateRange(periodKey, selectedPeriod) {
  const parts = (selectedPeriod || getCurrentPeriod()).split('/');
  const mes = parseInt(parts[0]);
  const ano = parseInt(parts[1]);
  const lastDay = new Date(ano, mes, 0).getDate();
  const dataFim = `${ano}-${String(mes).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  if (periodKey === 'diario' || periodKey === 'semanal') {
    return { dataInicio: `${ano}-${String(mes).padStart(2,'0')}-01`, dataFim };
  }
  const monthsBack = periodKey === 'mensal' ? 12 : 24;
  const startDate  = new Date(ano, mes - monthsBack, 1); // JS normaliza meses negativos
  return { dataInicio: vpDateStr(startDate), dataFim };
}

// ── Mock Data: 35 dias realistas para posto de combustível ───────────────────
const _VP_MOCK_FUELS = [
  { nome: 'Gasolina Comum',     preco: 5.89 },
  { nome: 'Gasolina Aditivada', preco: 6.29 },
  { nome: 'Etanol Comum',       preco: 3.89 },
  { nome: 'Diesel S10',         preco: 6.19 },
  { nome: 'GNV',                preco: 4.20 },
];
const _VP_MOCK_VEND   = ['João', 'Maria', 'Carlos', 'Ana'];
const _VP_MOCK_SHARES = [0.30, 0.25, 0.25, 0.20];    // proporção de vendas por vendedor
const _VP_MOCK_RANGES = {                              // [litros/dia mín, máx]
  'Gasolina Comum':    [550, 950],
  'Gasolina Aditivada':[120, 320],
  'Etanol Comum':      [280, 560],
  'Diesel S10':        [900, 1550],
  'GNV':               [40,  130],
};

function vpMockRows(days = 35) {
  const today = new Date();
  const rows  = [];
  for (let ago = days - 1; ago >= 0; ago--) {
    const d   = new Date(today);
    d.setDate(d.getDate() - ago);
    const dia = vpDateStr(d);
    // Pico no fim de semana
    const wk  = (d.getDay() === 0 || d.getDay() === 6) ? 1.15 : 1.0;
    _VP_MOCK_FUELS.forEach(fuel => {
      const [lo, hi] = _VP_MOCK_RANGES[fuel.nome];
      const dayVol   = (lo + Math.random() * (hi - lo)) * wk;
      _VP_MOCK_VEND.forEach((vendedor, vi) => {
        const litros      = Math.round(dayVol * _VP_MOCK_SHARES[vi] * (0.88 + Math.random() * 0.24) * 100) / 100;
        const faturamento = Math.round(litros * fuel.preco * (0.97 + Math.random() * 0.06) * 100) / 100;
        rows.push({ dia, combustivel: fuel.nome, vendedor, litros, faturamento });
      });
    });
  }
  return rows;
}

// ── Componente ────────────────────────────────────────────────────────────────
const VendasPista = ({ clients, selectedClient, selectedPeriod }) => {
  const [periodKey, setPeriodKey] = useState('diario');
  const [viewMode, setViewMode]   = useState('combustivel');
  const [rawData, setRawData]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const period  = VP_PERIODS.find(p => p.key === periodKey);

  const empresa = useMemo(() => {
    const c = (clients || []).find(cl => cl.nome === selectedClient) || (clients || [])[0];
    return c?.codigoEmpresa || null;
  }, [clients, selectedClient]);

  const { dataInicio, dataFim } = useMemo(
    () => vpDateRange(periodKey, selectedPeriod),
    [periodKey, selectedPeriod]
  );

  // Re-busca quando mudar empresa ou intervalo de datas; cai no mock se não houver dados
  useEffect(() => {
    if (!empresa || !dataInicio || !dataFim) { setUsingMock(true); return; }
    setLoading(true); setError(null); setUsingMock(false);
    fetch(`${API_URL}/api/dashboard/vendas-pista?empresa=${empresa}&dataInicio=${dataInicio}&dataFim=${dataFim}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) { setUsingMock(true); return; }
        setRawData(arr);
      })
      .catch(err => { setError(err.message); setUsingMock(true); })
      .finally(() => setLoading(false));
  }, [empresa, dataInicio, dataFim]);

  // Mock data gerado uma vez como fallback
  const mockRows   = useMemo(() => vpMockRows(35), []);
  const sourceData = usingMock ? mockRows : rawData;

  const { chartData, groupKeys, totais } = useMemo(() => {
    if (!sourceData.length) return { chartData: [], groupKeys: [], totais: { faturamento: 0, litros: 0 } };

    const PT_MON = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const getDim  = row => viewMode === 'combustivel' ? row.combustivel : (row.vendedor || 'Sem Vendedor');
    const dims    = [...new Set(sourceData.map(getDim))].sort();

    // Agrupamento por granularidade
    const bucket = {};
    sourceData.forEach(row => {
      const d = String(row.dia).substring(0, 10);
      let key;
      if (periodKey === 'diario') {
        key = d;
      } else if (periodKey === 'semanal') {
        const dt  = new Date(d + 'T12:00:00');
        const dow = dt.getDay() === 0 ? 7 : dt.getDay();
        const mon = new Date(dt); mon.setDate(dt.getDate() - dow + 1);
        key = vpDateStr(mon);
      } else if (periodKey === 'mensal') {
        key = d.substring(0, 7);   // YYYY-MM
      } else {
        key = d.substring(0, 4);   // YYYY
      }
      if (!bucket[key]) {
        bucket[key] = { key, totalFat: 0, litros: 0 };
        dims.forEach(dim => { bucket[key][`d_${dim}`] = 0; });
      }
      const dim = getDim(row);
      bucket[key][`d_${dim}`] = (bucket[key][`d_${dim}`] || 0) + row.faturamento;
      bucket[key].totalFat += row.faturamento;
      bucket[key].litros   += row.litros;
    });

    const sorted     = Object.keys(bucket).sort();
    const fatTotals  = sorted.map(k => bucket[k].totalFat);
    const { maWin }  = period;

    const allPoints = sorted.map((key, i) => {
      // MA7: média_dia[i] = média( valor[i-(maWin-1)] … valor[i] )
      const slice = fatTotals.slice(Math.max(0, i - maWin + 1), i + 1);
      const ma7   = slice.reduce((s, v) => s + v, 0) / slice.length;
      let label;
      if (periodKey === 'diario' || periodKey === 'semanal') {
        const mIdx = parseInt(key.substring(5, 7)) - 1;
        label = `${key.substring(8, 10)}/${PT_MON[mIdx]}`;
      } else if (periodKey === 'mensal') {
        label = `${PT_MON[parseInt(key.substring(5, 7)) - 1]}/${key.substring(2, 4)}`;
      } else {
        label = key;
      }
      return { ...bucket[key], label, ma7 };
    });

    const last   = allPoints[allPoints.length - 1];
    const totais = { faturamento: last?.totalFat || 0, litros: last?.litros || 0 };
    const groupKeys = dims.map(d => ({ dim: d, key: `d_${d}` }));
    return { chartData: allPoints, groupKeys, totais };
  }, [sourceData, periodKey, viewMode, period]);

  const fmtBig  = v => {
    const n = Number(v || 0);
    if (n >= 1e6) return `R$ ${(n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})} mi`;
    if (n >= 1e3) return `R$ ${(n/1e3).toLocaleString('pt-BR',{maximumFractionDigits:1})} mil`;
    return `R$ ${n.toLocaleString('pt-BR',{maximumFractionDigits:0})}`;
  };
  const fmtL    = v => Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
  const maLabel = periodKey==='diario'?'MM 7 dias':periodKey==='semanal'?'MM 4 sem.':periodKey==='mensal'?'MM 3 meses':'MM anual';
  const lastMa  = chartData.length ? chartData[chartData.length-1].ma7 : 0;
  const kpiLabel = chartData.length ? chartData[chartData.length-1].label : (selectedPeriod || '');

  return (
    <div className="chart-card">
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="card-header" style={{ flexWrap:'wrap', gap:8 }}>
        <h3>
          DESEMPENHO E VOLUME DE VENDAS PISTA
          {usingMock && (
            <span style={{ fontSize:'0.68em', color:'#64748b', fontWeight:400, marginLeft:10 }}>
              (demonstração)
            </span>
          )}
        </h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* Dimensão: Combustível | Vendedor */}
          <div className="vp-toggle-group">
            {[{k:'combustivel',l:'Combustível'},{k:'vendedor',l:'Vendedor'}].map(v=>(
              <button key={v.k} type="button"
                className={`vp-period-btn${viewMode===v.k?' active':''}`}
                onClick={()=>setViewMode(v.k)}>{v.l}
              </button>
            ))}
          </div>
          {/* Granularidade: Diário | Semanal | Mensal | Anual */}
          <div className="vp-toggle-group">
            {VP_PERIODS.map(p=>(
              <button key={p.key} type="button"
                className={`vp-period-btn${periodKey===p.key?' active':''}`}
                onClick={()=>setPeriodKey(p.key)}>{p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="vp-kpi-row">
        <div className="vp-kpi">
          <span className="vp-kpi-label">
            Faturamento Bruto&nbsp;
            <span style={{opacity:.6,fontSize:'0.8em'}}>({kpiLabel})</span>
          </span>
          <span className="vp-kpi-value" style={{color:'#E31E24'}}>{fmtBig(totais.faturamento)}</span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">
            Volume Vendido&nbsp;
            <span style={{opacity:.6,fontSize:'0.8em'}}>({kpiLabel})</span>
          </span>
          <span className="vp-kpi-value" style={{color:'#38bdf8'}}>{fmtL(totais.litros)} L</span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">{maLabel}</span>
          <span className="vp-kpi-value" style={{color:'#fff'}}>{fmtBig(lastMa)}</span>
        </div>
      </div>

      {loading && <LoadingState compact label="Carregando vendas pista..." />}
      {error && !usingMock && <ApiErrorNotice message={error} />}

      {/* ── Gráfico: Colunas Agrupadas (Fat + Litros) + Linha de Tendência ─── */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top:28, right:64, left:6, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
            <XAxis
              dataKey="label"
              stroke={DASHBOARD_COLORS.axis}
              tick={{ fill:DASHBOARD_COLORS.axis, fontSize:11 }}
              interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
            />
            {/* Eixo esquerdo — Faturamento R$ */}
            <YAxis
              yAxisId="left"
              stroke={DASHBOARD_COLORS.axis}
              tick={{ fill:DASHBOARD_COLORS.axis, fontSize:11 }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            {/* Eixo direito — Volume L */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#38bdf8"
              tick={{ fill:'#38bdf8', fontSize:10 }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}kL` : `${v}L`}
            />
            <Tooltip
              contentStyle={{ background:DASHBOARD_COLORS.tooltipBg, border:'1px solid #E31E24', borderRadius:8, color:'#f8fafc' }}
              formatter={(v, name) => {
                if (name === 'Litros (L)')
                  return [`${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})} L`, name];
                return [`R$ ${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize:12, paddingTop:8 }} />

            {/* GRUPO 1 — Faturamento empilhado por dimensão (eixo esquerdo) */}
            {groupKeys.map((g, i) => (
              <Bar
                key={g.key}
                yAxisId="left"
                dataKey={g.key}
                name={g.dim}
                stackId="fat"
                fill={getFuelColor(g.dim, `hsl(${(i*73)%360},65%,55%)`)}
                radius={i === groupKeys.length - 1 ? [4,4,0,0] : undefined}
              />
            ))}

            {/* GRUPO 2 — Volume em Litros (eixo direito, agrupado ao lado) */}
            <Bar
              yAxisId="right"
              dataKey="litros"
              name="Litros (L)"
              fill="rgba(56,189,248,0.38)"
              stroke="#38bdf8"
              strokeWidth={1}
              radius={[4,4,0,0]}
            />

            {/* Linha de Média Móvel — faturamento */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ma7"
              name={maLabel}
              stroke="#ffffff"
              strokeWidth={2.5}
              dot={false}
              strokeDasharray="6 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {!loading && chartData.length === 0 && (
        <div style={{ textAlign:'center', color:'#777', padding:'48px 0', fontSize:14 }}>
          Sem dados para o período selecionado.
        </div>
      )}
    </div>
  );
};
// ── fim VendasPista ────────────────────────────────────────────────────────────

// Dashboard Component
const Dashboard = ({ kpis, combustiveis, vendasDiarias, vendasHorarias, lmcControle, estoques, loading, clients, selectedClient, selectedPeriod }) => {
  const [selectedFuelDonut, setSelectedFuelDonut] = useState(null);
  const [isCompactDashboard, setIsCompactDashboard] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const updateCompact = () => setIsCompactDashboard(media.matches);
    updateCompact();
    if (media.addEventListener) {
      media.addEventListener('change', updateCompact);
      return () => media.removeEventListener('change', updateCompact);
    }
    media.addListener(updateCompact);
    return () => media.removeListener(updateCompact);
  }, []);

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
  const fmtLitersLabel = (value) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros`;

  const estoquesList = estoques || [];
  const activeFuelEstoque = estoquesList.find(e => e.produtoCodigo === selectedFuelDonut) || estoquesList[0];
  const fuelPct = activeFuelEstoque ? Math.round(activeFuelEstoque.percentualOcupacao) : 0;
  const activeFuelColor = activeFuelEstoque ? getFuelColor(activeFuelEstoque.produtoNome, DASHBOARD_COLORS.stock) : DASHBOARD_COLORS.stock;

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
  const vendasCombustivelChart = (combustiveis || [])
    .map(row => {
      const fuelName = String(row.nome || 'Produto');
      return {
        name: fuelName.split(' ').slice(0, 2).join(' '),
        fullName: fuelName,
        litros: Number(row.litros || 0),
        color: getFuelColor(fuelName),
      };
    })
    .filter(row => row.litros > 0)
    .sort((a, b) => b.litros - a.litros)
    .slice(0, 6);

  const vendasCombustivelFallback = [{ name: 'Sem dados', litros: 0, color: DASHBOARD_COLORS.sale }];

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
  const salesFuelChartData = vendasCombustivelChart.length > 0 ? vendasCombustivelChart : vendasCombustivelFallback;
  const tooltipStyle = { background: DASHBOARD_COLORS.tooltipBg, border: `1px solid ${DASHBOARD_COLORS.sale}`, borderRadius: 8, color: DASHBOARD_COLORS.label };
  const purchaseTooltipStyle = { ...tooltipStyle, border: `1px solid ${DASHBOARD_COLORS.purchase110}` };
  const labelStyle = { fill: DASHBOARD_COLORS.label, fontWeight: 700 };
  const wideChartHeight = isCompactDashboard ? 240 : 300;
  const stockChartHeight = 200;
  const purchaseChartHeight = isCompactDashboard ? 260 : 280;
  const smallChartHeight = isCompactDashboard ? 185 : 150;
  const xTickStyle = { fill: DASHBOARD_COLORS.axis, fontSize: isCompactDashboard ? 10 : 11 };
  const showDenseValueLabels = !isCompactDashboard;

  const dashboardKpis = kpis ? [
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

  const dashboardSections = {
    kpis: loading && !kpis ? (
      <SkeletonCards count={4} />
    ) : (
      <div className="kpi-row">
        {dashboardKpis.map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div className={`kpi-icon ${kpi.label.includes('Compras') ? 'purchase' : kpi.label.includes('Afer') ? 'attention' : kpi.label.includes('Carregando') ? '' : 'sale'}`}><kpi.icon size={24} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              {kpi.sub && <div className="kpi-trend positive">{kpi.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    ),
    salesFuel: (
      <div className="chart-card">
        <div className="card-header">
          <h3>COMBUSTÍVEIS MAIS VENDIDOS</h3>
          <span style={{ fontSize: '12px', color: '#666' }}>litros no período</span>
        </div>
        <ResponsiveContainer width="100%" height={wideChartHeight}>
          <BarChart data={salesFuelChartData} margin={{ top: 28, right: 12, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
            <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={0} height={isCompactDashboard ? 46 : 30} angle={isCompactDashboard ? -18 : 0} textAnchor={isCompactDashboard ? 'end' : 'middle'} />
            <YAxis stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} width={isCompactDashboard ? 46 : 60} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtLitersLabel(v), 'Litros']} />
            <Bar dataKey="litros" name="Litros vendidos" fill={DASHBOARD_COLORS.sale} radius={[8, 8, 0, 0]}>
              {salesFuelChartData.map((entry, index) => (
                <Cell key={`sales-fuel-${entry.name}-${index}`} fill={entry.color || DASHBOARD_COLORS.sale} />
              ))}
              <LabelList dataKey="litros" position="top" formatter={(v) => Number(v) > 0 ? fmtLitersLabel(v) : ''} {...labelStyle} fontSize={isCompactDashboard ? 10 : 12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    stock: (
      <div className="chart-card">
        <div className="card-header"><h3>ESTOQUE COMB</h3></div>
        {estoquesList.length > 0 && (
          <div className="fuel-selector">
            <label>Combustível:</label>
            <select value={selectedFuelDonut || estoquesList[0]?.produtoCodigo || ''} onChange={(e) => setSelectedFuelDonut(parseInt(e.target.value))}>
              {estoquesList.map(e => (<option key={e.produtoCodigo} value={e.produtoCodigo}>{e.produtoNome}</option>))}
            </select>
          </div>
        )}
        <div className="tank-visual">
          <div className="fuel-tank-wrap" style={{ filter: `drop-shadow(0 0 24px ${activeFuelColor}88)` }}>
            <div className="tank-neck" />
            <div className="tank">
              <div className="tank-fill" style={{ height: `${fuelPct}%`, background: activeFuelColor }}>
                <div className="liquid-wave" />
              </div>
              <div className="tank-label">
                <div className="tank-title">QTD COMBUSTÍVEL</div>
                <div className="tank-value" style={{ color: activeFuelColor }}>{activeFuelEstoque ? fmt(activeFuelEstoque.estoqueTotal) : '—'}</div>
                <div className="tank-unit">LITROS</div>
              </div>
              <div className="tank-gloss" />
            </div>
          </div>
        </div>
        <div className="update-time">
          <Calendar size={18} />
          <span>CAPACIDADE TOTAL:</span>
          <strong style={{ color: activeFuelColor }}>{activeFuelEstoque ? fmt(activeFuelEstoque.capacidadeTotal, 0) + ' L' : '—'}</strong>
        </div>
      </div>
    ),
  };

  return (
    <div className="page-content">
      {loading && <LoadingState compact label="Atualizando dashboard..." />}
      {dashboardSections.kpis}
      <div className="dashboard-grid dashboard-static-grid">
        <div className="dashboard-static-wide">{dashboardSections.salesFuel}</div>
        <div>{dashboardSections.stock}</div>
        <div className="dashboard-static-full">
          <VendasPista clients={clients} selectedClient={selectedClient} selectedPeriod={selectedPeriod} />
        </div>
      </div>
    </div>
  );
};
// Reports Component
const fmtNum = (v, dec = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function getUTCDateKey(ts) {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatDayBR(ts) {
  const d = new Date(ts);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatFullDateBR(dateKey) {
  if (!dateKey) return '-';
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function parseControlNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatControlInputNumber(value) {
  return String(Number((value || 0).toFixed(2)));
}

function getPeriodDateRange(period) {
  const [monthRaw, yearRaw] = (period || '').split('/');
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!month || !year) return { dataInicial: '', dataFinal: '' };
  const lastDay = new Date(year, month, 0).getDate();
  return {
    dataInicial: `${year}-${String(month).padStart(2, '0')}-01`,
    dataFinal: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function getPeriodsBetweenDates(dataInicial, dataFinal) {
  if (!dataInicial || !dataFinal) return [];
  const [startYear, startMonth] = dataInicial.split('-').map(Number);
  const [endYear, endMonth] = dataFinal.split('-').map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth) return [];

  const periods = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push({
      api: `${String(month).padStart(2, '0')}${year}`,
      label: `${String(month).padStart(2, '0')}/${year}`,
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return periods;
}

async function fetchControlDataForDateRange(empresa, dataInicial, dataFinal) {
  const periods = getPeriodsBetweenDates(dataInicial, dataFinal);
  const batches = await Promise.all(periods.map(async period => {
    const [lmcResp, diarioResp, controleResp] = await Promise.all([
      fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${period.api}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${period.api}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${period.api}`).then(r => r.json()),
    ]);
    if (lmcResp.error) throw new Error(lmcResp.error);
    if (diarioResp.error) throw new Error(diarioResp.error);
    if (controleResp.error) throw new Error(controleResp.error);
    return {
      period,
      lmcRegistros: lmcResp.registros || [],
      lmcDiario: diarioResp || null,
      lmcControle: controleResp.registros || [],
    };
  }));

  const fisicoPeriodByDay = {};
  const lmcRegistros = [];
  const lmcControle = [];
  const lmcDiario = { comprasDiarias: [], vendasDiarias: [], afericoesDiarias: [] };

  batches.forEach(batch => {
    batch.lmcRegistros.forEach(row => {
      fisicoPeriodByDay[getUTCDateKey(row.data)] = batch.period.label;
      lmcRegistros.push(row);
    });
    batch.lmcControle.forEach(row => {
      fisicoPeriodByDay[getUTCDateKey(row.emissao)] = batch.period.label;
      lmcControle.push(row);
    });
    if (batch.lmcDiario) {
      lmcDiario.comprasDiarias.push(...(batch.lmcDiario.comprasDiarias || []));
      lmcDiario.vendasDiarias.push(...(batch.lmcDiario.vendasDiarias || []));
      lmcDiario.afericoesDiarias.push(...(batch.lmcDiario.afericoesDiarias || []));
    }
  });

  return { lmcRegistros, lmcControle, lmcDiario, fisicoPeriodByDay };
}

function getControlFuels(lmcRegistros = [], lmcControle = []) {
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
  return fuels.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

function buildControlReportRows({
  lmcRegistros = [],
  lmcControle = [],
  lmcDiario = null,
  selectedPeriod = '',
  fisicoPeriodByDay = {},
  fisicoEdits = {},
  aberturaEdits = {},
  produto = 'all',
  dataInicial = '',
  dataFinal = '',
}) {
  const fuels = getControlFuels(lmcRegistros, lmcControle);
  const fuelNameById = {};
  fuels.forEach(f => { fuelNameById[f.codigo] = f.nome; });

  const lmcByKey = {};
  (lmcRegistros || []).forEach(r => {
    const produtoId = Number(r.combustivelCodigo);
    const dayKey = getUTCDateKey(r.data);
    lmcByKey[`${produtoId}|${dayKey}`] = r;
  });

  const controleByKey = {};
  (lmcControle || []).forEach(r => {
    const produtoId = Number(r.codProduto);
    const dayKey = getUTCDateKey(r.emissao);
    controleByKey[`${produtoId}|${dayKey}`] = r;
  });

  const fallbackCompras110Map = {};
  const fallbackCompras220Map = {};
  if ((!lmcControle || lmcControle.length === 0) && lmcDiario) {
    (lmcDiario.comprasDiarias || []).forEach(r => {
      const produtoId = Number(r.produto);
      const dayKey = getUTCDateKey(r.dia);
      const key = `${produtoId}|${dayKey}`;
      if (r.tipo === '110') fallbackCompras110Map[key] = (fallbackCompras110Map[key] || 0) + Number(r.qtdComprada || 0);
      else fallbackCompras220Map[key] = (fallbackCompras220Map[key] || 0) + Number(r.qtdComprada || 0);
    });
  }

  const selectedProduct = produto && produto !== 'all' ? Number(produto) : null;
  const rowKeys = new Set();
  (lmcRegistros || []).forEach(r => {
    const produtoId = Number(r.combustivelCodigo);
    if (selectedProduct && produtoId !== selectedProduct) return;
    rowKeys.add(`${produtoId}|${getUTCDateKey(r.data)}`);
  });
  (lmcControle || []).forEach(r => {
    const produtoId = Number(r.codProduto);
    if (selectedProduct && produtoId !== selectedProduct) return;
    rowKeys.add(`${produtoId}|${getUTCDateKey(r.emissao)}`);
  });

  const rowsBase = Array.from(rowKeys)
    .map(key => {
      const [produtoIdRaw, dayKey] = key.split('|');
      const produtoId = Number(produtoIdRaw);
      if (dataInicial && dayKey < dataInicial) return null;
      if (dataFinal && dayKey > dataFinal) return null;

      const lmc = lmcByKey[key];
      const movimento = controleByKey[key];
      const fisicoPeriod = fisicoPeriodByDay[dayKey] || selectedPeriod;
      const fisicoKey = `${fisicoPeriod}|${produtoId}|${dayKey}`;
      const aberturaKey = `${fisicoPeriod}|${produtoId}|${dayKey}`;
      const fisicoRaw = fisicoEdits[fisicoKey];
      const aberturaRaw = aberturaEdits[aberturaKey];
      const hasFisico = fisicoRaw !== undefined && String(fisicoRaw).trim() !== '';
      const hasAberturaEdit = aberturaRaw !== undefined && String(aberturaRaw).trim() !== '';

      return {
        key,
        dayKey,
        fisicoKey,
        aberturaKey,
        produtoId,
        produtoNome: fuelNameById[produtoId] || movimento?.descricaoProduto || lmc?.combustivelNome || 'Produto',
        dia: formatDayBR(dayKey),
        data: formatFullDateBR(dayKey),
        aberturaOriginal: lmc?.abertura || 0,
        aberturaInput: hasAberturaEdit ? aberturaRaw : '',
        hasAberturaEdit,
        compras110: movimento?.compra110 ?? fallbackCompras110Map[key] ?? 0,
        compras220: movimento?.compra220 ?? fallbackCompras220Map[key] ?? 0,
        afericoes: movimento?.afericao ?? lmc?.afericao ?? 0,
        vendas: movimento?.venda ?? lmc?.venda ?? 0,
        fisicoInput: hasFisico ? fisicoRaw : '',
        hasFisico,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.produtoNome.localeCompare(b.produtoNome, 'pt-BR'));

  const nextOpeningByProduct = {};
  return rowsBase.map(row => {
    const inheritedOpening = Object.prototype.hasOwnProperty.call(nextOpeningByProduct, row.produtoId)
      ? nextOpeningByProduct[row.produtoId]
      : row.aberturaOriginal;
    const abertura = row.hasAberturaEdit ? parseControlNumber(row.aberturaInput) : inheritedOpening;
    const fechamento = abertura + Number(row.compras110 || 0) + Number(row.compras220 || 0) + Number(row.afericoes || 0) - Number(row.vendas || 0);
    const fisico = row.hasFisico ? parseControlNumber(row.fisicoInput) : 0;
    const perdas = row.hasFisico ? fisico - fechamento : 0;
    nextOpeningByProduct[row.produtoId] = row.hasFisico ? fisico : fechamento;

    return {
      ...row,
      abertura,
      aberturaInput: row.hasAberturaEdit ? row.aberturaInput : formatControlInputNumber(abertura),
      fechamento,
      fisico,
      perdas,
    };
  });
}

function sumControlRows(rows) {
  return rows.reduce((acc, r) => ({
    compras110: acc.compras110 + Number(r.compras110 || 0),
    compras220: acc.compras220 + Number(r.compras220 || 0),
    compraTotal: acc.compraTotal + Number(r.compras110 || 0) + Number(r.compras220 || 0),
    afericoes: acc.afericoes + Number(r.afericoes || 0),
    vendas: acc.vendas + Number(r.vendas || 0),
    fisico: acc.fisico + Number(r.fisico || 0),
    perdas: acc.perdas + Number(r.perdas || 0),
  }), { compras110: 0, compras220: 0, compraTotal: 0, afericoes: 0, vendas: 0, fisico: 0, perdas: 0 });
}

function summarizeControlRows(rows) {
  const byDay = {};
  rows.forEach(r => {
    if (!byDay[r.dayKey]) {
      byDay[r.dayKey] = { dayKey: r.dayKey, data: r.data, compraTotal: 0, vendas: 0, perdas: 0 };
    }
    byDay[r.dayKey].compraTotal += Number(r.compras110 || 0) + Number(r.compras220 || 0);
    byDay[r.dayKey].vendas += Number(r.vendas || 0);
    byDay[r.dayKey].perdas += Number(r.perdas || 0);
  });
  return Object.values(byDay).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function safeFilePart(value) {
  return String(value || 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildControlExportPayload({ rows, filters, productName, clientName }) {
  const type = filters.tipo || 'resumido';
  const periodLabel = `${formatFullDateBR(filters.dataInicial)} a ${formatFullDateBR(filters.dataFinal)}`;

  if (type === 'resumido') {
    const summaryRows = summarizeControlRows(rows);
    const totals = summaryRows.reduce((acc, r) => ({
      compraTotal: acc.compraTotal + r.compraTotal,
      vendas: acc.vendas + r.vendas,
      perdas: acc.perdas + r.perdas,
    }), { compraTotal: 0, vendas: 0, perdas: 0 });
    return {
      title: 'Relatorio de Controle - Resumido',
      subtitle: `${clientName || 'Cliente'} | ${productName} | ${periodLabel}`,
      orientation: 'portrait',
      columns: [
        { key: 'data', label: 'DATA', align: 'left' },
        { key: 'compraTotal', label: 'TOTAL DE COMPRA', align: 'right', numeric: true },
        { key: 'vendas', label: 'TOTAL DE VENDA', align: 'right', numeric: true },
        { key: 'perdas', label: 'PERDAS / SOBRAS', align: 'right', numeric: true },
      ],
      rows: summaryRows,
      totals,
      totalLabel: 'TOTAL DO PERIODO',
      totalKeys: { compraTotal: true, vendas: true, perdas: true },
    };
  }

  const totals = sumControlRows(rows);
  return {
    title: 'Relatorio de Controle - Detalhado',
    subtitle: `${clientName || 'Cliente'} | ${productName} | ${periodLabel}`,
    orientation: 'landscape',
    columns: [
      { key: 'data', label: 'DATA', align: 'left' },
      { key: 'produtoNome', label: 'PRODUTO', align: 'left' },
      { key: 'abertura', label: 'ESTOQUE ABERTURA', align: 'right', numeric: true },
      { key: 'compras110', label: 'COMPRAS 110', align: 'right', numeric: true },
      { key: 'compras220', label: 'COMPRAS 220', align: 'right', numeric: true },
      { key: 'afericoes', label: 'AFERICOES', align: 'right', numeric: true },
      { key: 'vendas', label: 'VENDAS', align: 'right', numeric: true },
      { key: 'fechamento', label: 'ESTOQUE FECHAMENTO', align: 'right', numeric: true },
      { key: 'fisico', label: 'ESTOQUE FISICO', align: 'right', numeric: true },
      { key: 'perdas', label: 'PERDAS / SOBRAS', align: 'right', numeric: true },
    ],
    rows,
    totals,
    totalLabel: 'TOTAL DO PERIODO',
    totalKeys: { compras110: true, compras220: true, afericoes: true, vendas: true, fisico: true, perdas: true },
  };
}

function exportControlReport({ rows, filters, productName, clientName }) {
  if (!rows.length) {
    window.alert('Nenhum registro encontrado para os filtros selecionados.');
    return;
  }

  const payload = buildControlExportPayload({ rows, filters, productName, clientName });
  const fileBase = safeFilePart(`controle-${filters.tipo}-${productName}-${filters.dataInicial}-${filters.dataFinal}`);
  const generatedAt = new Date().toLocaleString('pt-BR');

  if (filters.formato === 'csv') {
    const csvRows = [
      [payload.title],
      [payload.subtitle],
      [],
      payload.columns.map(c => c.label),
      ...payload.rows.map(row => payload.columns.map(c => row[c.key] ?? '')),
      [],
      payload.columns.map((c, index) => {
        if (index === 0) return payload.totalLabel;
        return payload.totalKeys[c.key] ? payload.totals[c.key] : '';
      }),
    ];
    const csv = csvRows
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    downloadBlob(`\uFEFF${csv}`, `${fileBase}.csv`, 'text/csv;charset=utf-8');
    return;
  }

  if (filters.formato === 'xlsx') {
    const sheetRows = [
      [payload.title],
      [payload.subtitle],
      [],
      payload.columns.map(c => c.label),
      ...payload.rows.map(row => payload.columns.map(c => c.numeric ? Number(row[c.key] || 0) : (row[c.key] ?? ''))),
      [],
      payload.columns.map((c, index) => {
        if (index === 0) return payload.totalLabel;
        return payload.totalKeys[c.key] ? Number(payload.totals[c.key] || 0) : '';
      }),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet['!cols'] = payload.columns.map(c => ({ wch: c.key === 'produtoNome' ? 28 : 18 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle');
    XLSX.writeFile(workbook, `${fileBase}.xlsx`);
    return;
  }

  const bodyRows = payload.rows.map(row => `
    <tr>
      ${payload.columns.map(c => `<td class="${c.align === 'right' ? 'num' : ''}">${escapeHtml(c.numeric ? fmtNum(row[c.key], 2) : row[c.key])}</td>`).join('')}
    </tr>
  `).join('');
  const totalCells = payload.columns.map((c, index) => {
    if (index === 0) return `<td>${escapeHtml(payload.totalLabel)}</td>`;
    const value = payload.totalKeys[c.key] ? fmtNum(payload.totals[c.key], 2) : '';
    return `<td class="num">${escapeHtml(value)}</td>`;
  }).join('');
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(payload.title)}</title>
  <style>
    @page { size: A4 ${payload.orientation}; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
    .report { width: 100%; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 8px; border-bottom: 2px solid #e31e24; padding-bottom: 8px; }
    .header-text { min-width: 0; }
    .report-logo { width: 126px; max-width: 28%; height: auto; object-fit: contain; display: block; }
    h1 { margin: 0 0 5px; font-size: 20px; letter-spacing: 0; }
    .subtitle { color: #555; font-size: 12px; line-height: 1.4; }
    .report-meta { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 10px; color: #666; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${payload.orientation === 'landscape' ? '10px' : '11px'}; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th, td { border: 1px solid #d6d6d6; padding: 6px; vertical-align: top; word-break: break-word; }
    th { background: #151515; color: #fff; text-align: left; font-size: 9px; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 700; background: #f1f1f1; }
    .report-footer { margin-top: 8px; color: #777; font-size: 10px; text-align: right; }
    @media screen {
      body { background: #f3f4f6; padding: 20px; }
      .report { max-width: ${payload.orientation === 'landscape' ? '1120px' : '820px'}; margin: 0 auto; background: #fff; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.12); overflow-x: auto; }
    }
  </style>
</head>
<body>
  <main class="report">
    <section class="header">
      <div class="header-text">
        <h1>${escapeHtml(payload.title)}</h1>
        <div class="subtitle">${escapeHtml(payload.subtitle)}</div>
      </div>
      <img class="report-logo" src="/logo-starvl.png" alt="STARVL" />
    </section>
    <div class="report-meta">
      <span>Filtros: ${escapeHtml(productName)} | ${escapeHtml(formatFullDateBR(filters.dataInicial))} a ${escapeHtml(formatFullDateBR(filters.dataFinal))}</span>
      <span>Gerado em ${escapeHtml(generatedAt)}</span>
    </div>
    <table>
      <thead>
        <tr>${payload.columns.map(c => `<th class="${c.align === 'right' ? 'num' : ''}">${escapeHtml(c.label)}</th>`).join('')}</tr>
      </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot><tr>${totalCells}</tr></tfoot>
    </table>
    <footer class="report-footer">STARVL | ${escapeHtml(payload.title)}</footer>
  </main>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 500);
    });
  </script>
</body>
</html>`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Permita pop-ups para gerar o PDF do relatorio.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

const Reports = ({ selectedClient, selectedPeriod, setSelectedPeriod, clients }) => {
  const [activeTab, setActiveTab] = useState('descarregamentos');
  const [data, setData] = useState({ descarregamentos: null, vendas: null, historico: null, consolidado: null, controle: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [descSubTab, setDescSubTab] = useState('comNota');
  const [showControlPrintPanel, setShowControlPrintPanel] = useState(false);
  const [controlPrintFilters, setControlPrintFilters] = useState({
    dataInicial: '',
    dataFinal: '',
    tipo: 'resumido',
    produto: 'all',
    formato: 'pdf',
  });

  const fetchTab = useCallback(async (tab) => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    const periodo = selectedPeriod ? selectedPeriod.replace('/', '') : null;
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
      } else if (tab === 'controle') {
        const [lmcResp, diarioResp, controleResp] = await Promise.all([
          fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
          fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
          fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${periodo}`).then(r => r.json()),
        ]);
        if (lmcResp.error) throw new Error(lmcResp.error);
        if (diarioResp.error) throw new Error(diarioResp.error);
        if (controleResp.error) throw new Error(controleResp.error);
        result = {
          lmcRegistros: lmcResp.registros || [],
          lmcDiario: diarioResp || null,
          lmcControle: controleResp.registros || [],
        };
      }
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err) {
      setError(prev => ({ ...prev, [tab]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [clients, selectedClient, selectedPeriod]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const tabs = [
    { id: 'descarregamentos', label: 'Descarregamentos', icon: <Droplet size={15} /> },
    { id: 'vendas',           label: 'Vendas PDV',       icon: <BarChart2 size={15} /> },
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
              <div className="stat-label">Compras 110</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.comNota.reduce((s, r) => s + r.qtd, 0), 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-icon orange"><Droplet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Compras 220</div>
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
              {t === 'comNota' ? `Compras 110 - ${d.comNota.length}` : `Compras 220 - ${d.semNota.length}`}
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
                  <td style={{ color: getFuelColor(r.combustivel), fontWeight: 600 }}>{r.combustivel}</td>
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
              <div className="stat-label">Vendas PDV</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(d.totais.qtdVendasPdv ?? d.totais.qtdVendas)}</div>
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
                <th style={{ textAlign: 'right' }}>VENDAS PDV</th>
                <th style={{ width: '120px' }}>PARTICIPAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {d.produtos.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Nenhuma venda encontrada.</td></tr>
              )}
              {d.produtos.map((p, i) => {
                const pct = maxVal > 0 ? (p.valorTotal / maxVal * 100) : 0;
                const productColor = p.tipoProd === 1 ? getFuelColor(p.produto) : '#E31E24';
                return (
                  <tr key={i}>
                    <td style={{ color: '#555', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: p.tipoProd === 1 ? productColor : undefined }}>{p.produto}</td>
                    <td><span className="category-badge">{p.tipoProd === 1 ? 'Combustível' : 'Produto'}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: productColor }}>{fmtNum(p.qtdTotal, 3)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '12px' }}>{fmtBRL(p.precoMedio)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtBRL(p.valorTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(p.qtdVendas)}</td>
                    <td>
                      <div style={{ background: '#111', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: productColor, borderRadius: '4px', transition: 'width 0.5s' }} />
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
                const fuelColor = getFuelColor(r.combustivel);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: fuelColor }}>{r.combustivel}</td>
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

  const getSavedFisicoEdits = () => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-fisico') || '{}');
    } catch {
      return {};
    }
  };

  const getSavedAberturaEdits = () => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-abertura') || '{}');
    } catch {
      return {};
    }
  };

  const getControlProductName = (filters, fuels) => {
    if (filters.produto === 'all') return 'Todos os combustiveis';
    return fuels.find(f => String(f.codigo) === filters.produto)?.nome || 'Produto selecionado';
  };

  const openControlPrintPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setControlPrintFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal: prev.dataFinal || range.dataFinal,
    }));
    setShowControlPrintPanel(true);
  };

  const handleGenerateControlReport = async () => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    if (!empresa) return;
    const range = getPeriodDateRange(selectedPeriod);
    const filters = {
      ...controlPrintFilters,
      dataInicial: controlPrintFilters.dataInicial || range.dataInicial,
      dataFinal: controlPrintFilters.dataFinal || range.dataFinal,
    };
    if (filters.dataInicial > filters.dataFinal) {
      window.alert('A data inicial nao pode ser maior que a data final.');
      return;
    }
    setLoading(prev => ({ ...prev, controleExport: true }));
    try {
      const reportData = await fetchControlDataForDateRange(empresa, filters.dataInicial, filters.dataFinal);
      const fuels = getControlFuels(reportData.lmcRegistros, reportData.lmcControle);
    const rows = buildControlReportRows({
        lmcRegistros: reportData.lmcRegistros,
        lmcControle: reportData.lmcControle,
        lmcDiario: reportData.lmcDiario,
      selectedPeriod,
      fisicoPeriodByDay: reportData.fisicoPeriodByDay,
      fisicoEdits: getSavedFisicoEdits(),
      aberturaEdits: getSavedAberturaEdits(),
      produto: filters.produto,
      dataInicial: filters.dataInicial,
      dataFinal: filters.dataFinal,
    });
    exportControlReport({
      rows,
      filters,
      productName: getControlProductName(filters, fuels),
      clientName: selectedClient,
    });
    setShowControlPrintPanel(false);
    } catch (err) {
      window.alert(`Erro ao gerar relatorio: ${getFriendlyApiError(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, controleExport: false }));
    }
  };

  const renderControle = () => {
    const d = data.controle;
    if (!d) return null;
    const range = getPeriodDateRange(selectedPeriod);
    const previewFilters = {
      dataInicial: controlPrintFilters.dataInicial || range.dataInicial,
      dataFinal: controlPrintFilters.dataFinal || range.dataFinal,
      produto: controlPrintFilters.produto || 'all',
    };
    const rows = buildControlReportRows({
      lmcRegistros: d.lmcRegistros,
      lmcControle: d.lmcControle,
      lmcDiario: d.lmcDiario,
      selectedPeriod,
      fisicoEdits: getSavedFisicoEdits(),
      aberturaEdits: getSavedAberturaEdits(),
      produto: previewFilters.produto,
      dataInicial: previewFilters.dataInicial,
      dataFinal: previewFilters.dataFinal,
    });
    const summaryRows = summarizeControlRows(rows);
    const totals = sumControlRows(rows);
    const fuels = getControlFuels(d.lmcRegistros, d.lmcControle);

    return (
      <div>
        <div className="table-toolbar">
          <div style={{ color: '#888', fontSize: '13px' }}>
            Controle de movimentacao por periodo, produto e tipo de relatorio.
          </div>
          <button type="button" className="btn-primary" onClick={openControlPrintPanel} style={{ width: 'auto', padding: '10px 18px' }}>
            <Printer size={18} />
            Gerar relatorio
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: 1, minWidth: '180px' }}>
            <div className="stat-icon red"><Package size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Combustiveis</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fuels.length}</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: '180px' }}>
            <div className="stat-icon orange"><Droplet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Total de compra</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(totals.compraTotal, 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: '180px' }}>
            <div className="stat-icon green"><BarChart2 size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Total de venda</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(totals.vendas, 0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: '180px' }}>
            <div className="stat-icon blue"><Calculator size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Perdas / sobras</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{fmtNum(totals.perdas, 2)} L</div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATA</th>
                <th style={{ textAlign: 'right' }}>TOTAL DE COMPRA</th>
                <th style={{ textAlign: 'right' }}>TOTAL DE VENDA</th>
                <th style={{ textAlign: 'right' }}>PERDAS / SOBRAS</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '32px' }}>Nenhum registro encontrado.</td></tr>
              )}
              {summaryRows.map(row => (
                <tr key={row.dayKey}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{row.data}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(row.compraTotal, 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(row.vendas, 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: row.perdas < -0.01 ? '#f87171' : row.perdas > 0.01 ? '#22c55e' : 'inherit' }}>{fmtNum(row.perdas, 2)} L</td>
                </tr>
              ))}
              {summaryRows.length > 0 && (
                <tr style={{ background: '#1a1a1a', fontWeight: 700 }}>
                  <td style={{ color: '#888' }}>TOTAL DO PERIODO</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(totals.compraTotal, 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(totals.vendas, 2)} L</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(totals.perdas, 2)} L</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showControlPrintPanel && (
          <ControlPrintPanel
            fuels={fuels}
            filters={controlPrintFilters}
            setFilters={setControlPrintFilters}
            onClose={() => setShowControlPrintPanel(false)}
            onGenerate={handleGenerateControlReport}
          />
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading[activeTab]) {
      return (
        <LoadingState label="Carregando informacoes do relatorio..." />
      );
    }
    if (error[activeTab]) {
      return (
        <ApiErrorNotice message={getFriendlyApiError(error[activeTab])} onRetry={() => fetchTab(activeTab)} />
      );
    }
    if (!data[activeTab]) return null;
    if (activeTab === 'descarregamentos') return renderDescarregamentos();
    if (activeTab === 'vendas') return renderVendas();
    if (activeTab === 'controle') return renderControle();
    if (activeTab === 'consolidado') return renderConsolidado();
    if (activeTab === 'historico') return renderHistorico();
    return null;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>RELATÓRIOS</h2>
        <div className="header-actions">
          <div className="control-filter-group">
            <label className="control-filter-label">PERIODO</label>
            <div className="control-filter-select">
              <Calendar size={15} />
              <input
                type="month"
                value={periodToMonthInput(selectedPeriod)}
                onChange={(e) => setSelectedPeriod(monthInputToPeriod(e.target.value))}
              />
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={() => fetchTab(activeTab)} style={{ alignSelf: 'flex-end', width: 'auto', display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px', fontSize: '13px' }}>
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="reports-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '0' }}>
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
const Control = ({ lmcRegistros, lmcDiario, lmcControle, selectedPeriod, setSelectedPeriod, selectedClient, clients }) => {
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [showPrintPanel, setShowPrintPanel] = useState(false);
  const [printFilters, setPrintFilters] = useState({
    dataInicial: '',
    dataFinal: '',
    tipo: 'resumido',
    produto: 'all',
    formato: 'pdf',
  });
  const [fisicoEdits, setFisicoEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-fisico') || '{}');
    } catch {
      return {};
    }
  });
  const [aberturaEdits, setAberturaEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-abertura') || '{}');
    } catch {
      return {};
    }
  });
  const [savedEditKey, setSavedEditKey] = useState(null);

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

  async function handleGeneratePrint() {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    if (!empresa) return;
    const range = getPeriodDateRange();
    const filters = {
      ...printFilters,
      dataInicial: printFilters.dataInicial || range.dataInicial,
      dataFinal: printFilters.dataFinal || range.dataFinal,
    };
    if (filters.dataInicial > filters.dataFinal) {
      window.alert('A data inicial nao pode ser maior que a data final.');
      return;
    }
    try {
      const reportData = await fetchControlDataForDateRange(empresa, filters.dataInicial, filters.dataFinal);
      const reportFuels = getControlFuels(reportData.lmcRegistros, reportData.lmcControle);
      const productName = filters.produto === 'all'
        ? 'Todos os combustiveis'
        : (reportFuels.find(f => String(f.codigo) === filters.produto)?.nome || fuels.find(f => String(f.codigo) === filters.produto)?.nome || 'Produto selecionado');
      const rows = buildControlReportRows({
        lmcRegistros: reportData.lmcRegistros,
        lmcControle: reportData.lmcControle,
        lmcDiario: reportData.lmcDiario,
        selectedPeriod,
        fisicoPeriodByDay: reportData.fisicoPeriodByDay,
        fisicoEdits,
        aberturaEdits,
        produto: filters.produto,
        dataInicial: filters.dataInicial,
        dataFinal: filters.dataFinal,
      });
      exportControlReport({
        rows,
        filters,
        productName,
        clientName: selectedClient,
      });
      setShowPrintPanel(false);
    } catch (err) {
      window.alert(`Erro ao gerar relatorio: ${getFriendlyApiError(err)}`);
    }
  }

  function persistFisicoEdit(key, value) {
    setFisicoEdits(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('starvl:lmc-fisico', JSON.stringify(next));
      return next;
    });
    const savedKey = `fisico:${key}`;
    setSavedEditKey(savedKey);
    window.setTimeout(() => setSavedEditKey(current => current === savedKey ? null : current), 1200);
  }

  function persistAberturaEdit(key, value) {
    setAberturaEdits(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('starvl:lmc-abertura', JSON.stringify(next));
      return next;
    });
    const savedKey = `abertura:${key}`;
    setSavedEditKey(savedKey);
    window.setTimeout(() => setSavedEditKey(current => current === savedKey ? null : current), 1200);
  }

  const tableRows = buildControlReportRows({
    lmcRegistros,
    lmcControle,
    lmcDiario,
    selectedPeriod,
    fisicoEdits,
    aberturaEdits,
    produto: activeFuelId ? String(activeFuelId) : 'all',
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
        <h2>LIVRO DE MOVIMENTAÇÃO</h2>
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
                    <td>
                      <input
                        className={`lmc-fisico-input ${savedEditKey === `abertura:${row.aberturaKey}` ? 'saved' : ''}`}
                        type="text"
                        inputMode="decimal"
                        value={row.aberturaInput}
                        onChange={(e) => persistAberturaEdit(row.aberturaKey, e.target.value)}
                        aria-label={`Estoque abertura ${row.dia}`}
                      />
                    </td>
                    <td>{fmt2(row.compras110)}</td>
                    <td>{fmt2(row.compras220)}</td>
                    <td>{fmt2(row.afericoes)}</td>
                    <td>{fmt2(row.vendas)}</td>
                    <td>{fmt2(row.fechamento)}</td>
                    <td>
                      <input
                        className={`lmc-fisico-input ${savedEditKey === `fisico:${row.fisicoKey}` ? 'saved' : ''}`}
                        type="text"
                        inputMode="decimal"
                        value={row.fisicoInput}
                        placeholder="0,00"
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
            {savedEditKey && <div className="save-feedback">Alteracao salva</div>}
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
                <option value="all">Todos os combustiveis</option>
                {fuels.map(f => <option key={f.codigo} value={String(f.codigo)}>{f.nome}</option>)}
              </select>
              <ChevronDown size={20} />
            </div>
            <div className="control-print-hint">
              <AlertCircle size={16} />
              <span>Selecione um produto para filtrar o relatorio.</span>
            </div>
          </section>

          <section className="control-print-section control-print-format">
            <div className="control-print-section-title">
              <Database size={20} />
              <span>ARQUIVO</span>
            </div>
            <div className="control-print-format-row">
              {[
                { value: 'pdf', label: 'PDF' },
                { value: 'xlsx', label: 'XLSX' },
                { value: 'csv', label: 'CSV' },
              ].map(option => (
                <label key={option.value} className={`control-print-format-option ${(filters.formato || 'pdf') === option.value ? 'selected' : ''}`}>
                  <input type="radio" name="formatoRelatorio" value={option.value} checked={(filters.formato || 'pdf') === option.value} onChange={update('formato')} />
                  <span>{option.label}</span>
                </label>
              ))}
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
            GERAR ARQUIVO
          </button>
        </div>
      </div>
    </div>
  );
};

// Stock Position Component
const StockPosition = ({ estoques, projecao, loading, selectedClient, clients }) => {
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const getDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getDefaultProjectionRange = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { inicio: getDateInput(start), fim: getDateInput(end) };
  };
  const defaultProjectionRange = getDefaultProjectionRange();
  const [projectionStart, setProjectionStart] = useState(defaultProjectionRange.inicio);
  const [projectionEnd, setProjectionEnd] = useState(defaultProjectionRange.fim);
  const [projectionDays, setProjectionDays] = useState(7);
  const [projectionData, setProjectionData] = useState({ projecoes: projecao || [], diasBase: 7, diasProjecao: 7 });
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [projectionError, setProjectionError] = useState(null);

  const estoquesList = estoques || [];
  const activeFuel = estoquesList.find(e => e.produtoCodigo === selectedFuelId) || estoquesList[0];
  const projectionRows = projectionData.projecoes || projecao || [];
  const activeProjecao = projectionRows.find(p => p.produtoCodigo === activeFuel?.produtoCodigo) || null;

  const fmt2 = (n) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtR = (n) => 'R$ ' + fmt2(n);

  const tankPct = activeFuel ? Math.min(Math.max(activeFuel.percentualOcupacao, 0), 100) : 0;
  const stockFuelColor = activeFuel ? getFuelColor(activeFuel.produtoNome, DASHBOARD_COLORS.stock) : DASHBOARD_COLORS.stock;
  const mediaDiaria = activeProjecao?.mediaDiariaLitros || 0;
  const consumoProjetado = activeProjecao?.consumoProjetado ?? mediaDiaria * projectionDays;
  const compraProjetada = activeProjecao?.compraProjetada ?? consumoProjetado;
  const necessidadeCompra = activeProjecao?.necessidadeCompra ?? Math.max(consumoProjetado - (activeFuel?.estoqueTotal || 0), 0);
  const estoqueAtualProjetado = activeFuel?.estoqueTotal || activeProjecao?.estoqueAtual || 0;
  const estoqueFinalProjetado = Math.max(0, estoqueAtualProjetado - consumoProjetado);
  const autonomiaDias = mediaDiaria > 0 ? Math.floor(estoqueAtualProjetado / mediaDiaria) : null;

  useEffect(() => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    if (!client?.codigoEmpresa || !projectionStart || !projectionEnd) return;

    let cancelled = false;
    setProjectionLoading(true);
    setProjectionError(null);

    fetch(`${API_URL}/api/estoque/projecao?empresa=${client.codigoEmpresa}&dataInicio=${projectionStart}&dataFim=${projectionEnd}&diasProjecao=${projectionDays}`)
      .then(r => r.json())
      .then(result => {
        if (cancelled) return;
        if (result.error) throw new Error(result.error);
        setProjectionData(result);
      })
      .catch(err => {
        if (!cancelled) setProjectionError(err.message);
      })
      .finally(() => {
        if (!cancelled) setProjectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clients, selectedClient, projectionStart, projectionEnd, projectionDays]);

  const hoje = new Date();
  const projectionSteps = [...new Set([
    0,
    Math.max(1, Math.round(projectionDays / 2)),
    projectionDays,
  ])].sort((a, b) => a - b);
  const projecaoChart = projectionSteps.map((dayOffset) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + dayOffset);
    const label = dayOffset === 0
      ? 'Hoje'
      : `+${dayOffset} dias`;
    const estoqueProjetado = Math.max(0, estoqueAtualProjetado - (mediaDiaria * dayOffset));
    return {
      date: label,
      estoque: estoqueProjetado,
    };
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>POSIÇÃO ESTOQUE</h2>
      </div>

      {loading && (
        <LoadingState compact label="Atualizando posicao de estoque..." />
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
                <div className="tank-fill" style={{ height: `${tankPct}%`, background: stockFuelColor }}>
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
          <div className="projection-controls">
            <label>
              <span>BASE INICIAL</span>
              <input type="date" value={projectionStart} onChange={(e) => setProjectionStart(e.target.value)} />
            </label>
            <label>
              <span>BASE FINAL</span>
              <input type="date" value={projectionEnd} onChange={(e) => setProjectionEnd(e.target.value)} />
            </label>
            <label>
              <span>PROJETAR</span>
              <select value={projectionDays} onChange={(e) => setProjectionDays(Number(e.target.value))}>
                <option value={3}>3 dias</option>
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </label>
          </div>
          <div className="projection-subtitle">
            BASE: MEDIA DO PERIODO SELECIONADO {projectionLoading ? '...' : ''}
          </div>
          {projectionError && (
            <ApiErrorNotice message={getFriendlyApiError(projectionError)} />
          )}
          <div className="projection-subtitle old-projection-subtitle">
            BASE: MÉDIA DOS ÚLTIMOS 7 DIAS
          </div>
          <div className="projection-summary">
            <div>
              <span>ESTOQUE ATUAL</span>
              <strong>{fmt2(estoqueAtualProjetado)} L</strong>
            </div>
            <div>
              <span>APOS {projectionDays} DIAS</span>
              <strong>{fmt2(estoqueFinalProjetado)} L</strong>
            </div>
            <div>
              <span>COMPRA SUGERIDA</span>
              <strong>{fmt2(compraProjetada)} L</strong>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={projecaoChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" tick={{ fontSize: 11 }} width={52} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: `1px solid ${stockFuelColor}` }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [fmt2(v) + ' L', 'Estoque estimado']}
              />
              <Line type="monotone" dataKey="estoque" stroke={stockFuelColor} strokeWidth={3} name="ESTOQUE ESTIMADO" dot={{ fill: stockFuelColor, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>

          <div className="projection-metrics">
            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-label">MEDIA DIARIA DO PERIODO</div>
                <div className="metric-number">{fmt2(mediaDiaria)}</div>
                <div className="metric-unit">LITROS</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">AUTONOMIA DO ESTOQUE</div>
                <div className="metric-number">{autonomiaDias === null ? '—' : autonomiaDias}</div>
                <div className="metric-unit">DIAS</div>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-label">CONSUMO PROJETADO ({projectionDays} DIAS)</div>
                <div className="metric-number">{fmt2(consumoProjetado)}</div>
                <div className="metric-unit">LITROS</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">PROJECAO DE COMPRA</div>
                <div className="metric-number">{fmt2(compraProjetada)}</div>
                <div className="metric-unit">LITROS</div>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-item">
                <div className="metric-label">NECESSIDADE APOS ESTOQUE</div>
                <div className="metric-number">{fmt2(necessidadeCompra)}</div>
                <div className="metric-unit">LITROS</div>
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
  const [dashboardPeriod, setDashboardPeriod] = useState(getCurrentPeriod());
  const [reportsPeriod, setReportsPeriod] = useState(getCurrentPeriod());
  const [controlPeriod, setControlPeriod] = useState(getCurrentPeriod());
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('starvl-theme-mode') || 'dark');

  const isAdmin = loggedUser?.perfil === 'admin';

  const [apiData, setApiData] = useState({
    kpis: null,
    combustiveis: [],
    vendasDiarias: [],
    vendasHorarias: [],
    dashboardLmcControle: null,
    lmcRegistros: null,
    lmcDiario: null,
    lmcControle: null,
    estoques: [],
    projecao: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    localStorage.setItem('starvl-theme-mode', themeMode);
    document.body.classList.toggle('theme-light-body', themeMode === 'light');
  }, [themeMode]);

  useEffect(() => {
    const client = clients.find(c => c.nome === selectedClient) || clients[0];
    if (!client) return;
    const empresa = client.codigoEmpresa;
    const dashboardPeriodo = periodToApi(dashboardPeriod);
    const controlPeriodo = periodToApi(controlPeriod);

    setApiData(prev => ({ ...prev, loading: true, error: null }));

    Promise.all([
      fetch(`${API_URL}/api/dashboard/kpis?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/combustiveis?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-horarias?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque?empresa=${empresa}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque/projecao?empresa=${empresa}&dias=7`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, dashboardLmcControle, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp]) => {
      setIsConnected(true);
      setApiData({
        kpis: kpis.error ? null : kpis,
        combustiveis: Array.isArray(combustiveis) ? combustiveis : [],
        vendasDiarias: Array.isArray(vendasDiarias) ? vendasDiarias : [],
        vendasHorarias: Array.isArray(vendasHorarias) ? vendasHorarias : [],
        dashboardLmcControle: dashboardLmcControle.registros || [],
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
      setApiData(prev => ({ ...prev, loading: false, error: getFriendlyApiError(err) }));
    });
  }, [selectedClient, dashboardPeriod, controlPeriod, clients]);

  const handleRefresh = () => {
    const client = clients.find(c => c.nome === selectedClient) || clients[0];
    if (!client) return;
    const empresa = client.codigoEmpresa;
    const dashboardPeriodo = periodToApi(dashboardPeriod);
    const controlPeriodo = periodToApi(controlPeriod);

    setIsConnected(false);
    setApiData(prev => ({ ...prev, loading: true }));

    Promise.all([
      fetch(`${API_URL}/api/dashboard/kpis?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/combustiveis?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-horarias?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/diario?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/lmc/controle?empresa=${empresa}&periodo=${controlPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque?empresa=${empresa}`).then(r => r.json()),
      fetch(`${API_URL}/api/estoque/projecao?empresa=${empresa}&dias=7`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, dashboardLmcControle, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp]) => {
      setIsConnected(true);
      setApiData({
        kpis: kpis.error ? null : kpis,
        combustiveis: Array.isArray(combustiveis) ? combustiveis : [],
        vendasDiarias: Array.isArray(vendasDiarias) ? vendasDiarias : [],
        vendasHorarias: Array.isArray(vendasHorarias) ? vendasHorarias : [],
        dashboardLmcControle: dashboardLmcControle.registros || [],
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
      setApiData(prev => ({ ...prev, loading: false, error: getFriendlyApiError(err) }));
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} selectedPeriod={reportsPeriod} setSelectedPeriod={setReportsPeriod} clients={clients} />;
      case 'control':
        return <Control lmcRegistros={apiData.lmcRegistros} lmcDiario={apiData.lmcDiario} lmcControle={apiData.lmcControle} selectedPeriod={controlPeriod} setSelectedPeriod={setControlPeriod} selectedClient={selectedClient} clients={clients} />;
      case 'stock':
        return <StockPosition estoques={apiData.estoques} projecao={apiData.projecao} loading={apiData.loading} selectedClient={selectedClient} clients={clients} />;
      case 'users':
        return <Users adminUsers={adminUsers} setAdminUsers={setAdminUsers} isAdmin={isAdmin} />;
      case 'params':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      case 'admin':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      default:
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(user) => { setIsLoggedIn(true); setLoggedUser(user); }} adminUsers={adminUsers} />;
  }

  return (
    <div className={`app theme-${themeMode}`}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={() => { setIsLoggedIn(false); setLoggedUser(null); }}
        themeMode={themeMode}
      />
      <main className="main-content">
        <TopBar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isConnected={isConnected}
          apiError={apiData.error}
          clients={clients}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          selectedPeriod={dashboardPeriod}
          setSelectedPeriod={setDashboardPeriod}
          onRefresh={handleRefresh}
          onLogout={() => { setIsLoggedIn(false); setLoggedUser(null); }}
          loggedUser={loggedUser}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
        />
        {apiData.error && <ApiErrorNotice message={apiData.error} onRetry={handleRefresh} />}
        {renderPage()}
      </main>
    </div>
  );
}
