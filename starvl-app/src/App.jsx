import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import logoStarvl from './logo-starvl.png';
import logoStarvlBlack from './logo-starvl-black.png';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LabelList, ComposedChart, ReferenceLine, PieChart, Pie } from 'recharts';
import { Home, FileText, Users as UsersIcon, BookOpen, Package, LogOut, Eye, Search, Plus, Edit2, Trash2, X, Calendar, TrendingUp, Droplet, DollarSign, Calculator, Bell, ChevronDown, Activity, Settings, Building2, Phone, Mail, MapPin, Hash, Clock, BarChart2, Layers, CircleDollarSign, UserCheck, UserPlus, AlertCircle, Globe, Camera, Building, Tag, RefreshCw, Database, ChevronRight, ChevronLeft, Filter, Printer, Moon, Sun, Trophy, Lock, Unlock, Wallet, Download, CreditCard, AlertTriangle, Save, PiggyBank, Target, CheckCircle, TrendingDown, Flag } from 'lucide-react';
import './App.css';
import './cr-styles.css';
import './cp-styles.css';
import './pm-styles.css';

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

// ─── Global formatters ─────────────────────────────────────────────────────
const fmtBRL  = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = s => { if (!s) return '—'; const [y, m, d] = String(s).substring(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fmtNum  = (v, dec = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmt2    = n => fmtNum(n, 2);

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

// ─── Toast system ──────────────────────────────────────────────────────────
let _toastEmit = null;
function toast(msg, type = 'info') {
  if (_toastEmit) _toastEmit(msg, type);
}
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastEmit = (msg, type) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
    };
    return () => { _toastEmit = null; };
  }, []);
  if (!toasts.length) return null;
  const colors = { error: '#ef4444', success: '#22c55e', warn: '#f59e0b', info: '#60a5fa' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: '#1a1a1a', color: '#f8fafc', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, maxWidth: 380, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', borderLeft: `4px solid ${colors[t.type] || colors.info}`, lineHeight: 1.4 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
};

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
        <div className="white-glow" />

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
const Sidebar = ({ currentPage, setCurrentPage, onLogout, themeMode, collapsed, onToggleCollapse }) => {
  const menuItems = [
    { icon: Home,      label: 'HOME',                        page: 'dashboard' },
    { icon: Package,   label: 'ESTOQUE',                     page: 'stock'     },
    { icon: BookOpen,  label: 'LIVROS',                      page: 'control'   },
    { icon: Target,    label: 'INDICADORES PATRIMONIAIS',    page: 'goals'     },
    { icon: PiggyBank, label: 'FINANCEIRO',                  page: 'receber'   },
    { icon: FileText,  label: 'RELATÓRIOS',                  page: 'reports'   },
    { icon: Settings,  label: 'CONFIGURAÇÕES',               page: 'params'    },
  ];

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-inner">
          {!collapsed && (
            <img
              src={themeMode === 'light' ? logoStarvlBlack : logoStarvl}
              alt="STARVL"
              className="sidebar-logo"
            />
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.page}
            className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.page)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        className="nav-item logout-btn"
        onClick={onLogout}
        title={collapsed ? 'SAIR' : undefined}
      >
        <LogOut size={20} />
        <span>SAIR</span>
      </button>
    </div>
  );
};

// TopBar Component
const PAGE_TITLES = {
  dashboard: 'Home',
  reports: 'Relatórios',
  control: 'Livros',
  stock: 'Estoque',
  receber: 'Financeiro',
  goals: 'Indicadores Patrimoniais',
  users: 'Gerenciamento de Usuários',
  params: 'Configurações',
};

// Navegação rápida por atalho de página
const QuickNav = ({ setCurrentPage, themeMode }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const NAV_PAGES = [
    { icon: Home,      label: 'Home',                       page: 'dashboard' },
    { icon: Package,   label: 'Estoque',                    page: 'stock'     },
    { icon: BookOpen,  label: 'Livros',                     page: 'control'   },
    { icon: Target,    label: 'Indicadores Patrimoniais',   page: 'goals'     },
    { icon: PiggyBank, label: 'Financeiro',                 page: 'receber'   },
    { icon: FileText,  label: 'Relatórios',                 page: 'reports'   },
    { icon: Settings,  label: 'Configurações',              page: 'params'    },
  ];

  const filtered = query.trim()
    ? NAV_PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_PAGES;

  const handleSelect = useCallback((page) => {
    setCurrentPage(page);
    setQuery('');
    setOpen(false);
  }, [setCurrentPage]);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="quicknav" ref={ref}>
      <div className="quicknav-wrap">
        <Search size={14} className="quicknav-icon" />
        <input
          className="quicknav-input"
          placeholder="Ir para..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].page);
          }}
        />
        {query && (
          <button className="quicknav-clear" onClick={() => { setQuery(''); setOpen(false); }}>
            <X size={12} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className={`quicknav-dropdown${themeMode === 'light' ? ' light' : ''}`}>
          {filtered.map(p => (
            <button key={p.page} className="quicknav-item" onMouseDown={() => handleSelect(p.page)}>
              <p.icon size={14} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TopBar = ({ currentPage, setCurrentPage, isConnected, apiError, clients, selectedClient, setSelectedClient, onLogout, loggedUser, themeMode, setThemeMode }) => {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const connectionLabel = isConnected ? 'Conectado' : (apiError ? 'Servidor offline' : 'Desconectado');

  useEffect(() => {
    if (loggedUser?.id) {
      userImgLoadOne(loggedUser.id).then(img => setProfileImg(img || null)).catch(() => {});
    }
  }, [loggedUser?.id]);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-title">{PAGE_TITLES[currentPage] || 'Dashboard'}</span>
      </div>

      <div className="top-bar-center">
        <QuickNav setCurrentPage={setCurrentPage} themeMode={themeMode} />

        <select
          className="topbar-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>

        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
          <span>{connectionLabel}</span>
        </div>
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
          {profileImg
            ? <img src={profileImg} alt="avatar" className="user-avatar-sm user-avatar-sm-img" />
            : <div className="user-avatar-sm">{(loggedUser?.usuario || 'U').charAt(0).toUpperCase()}</div>
          }
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

// ─── Shared chart styles (constant — defined once, reused everywhere) ──────
const TOOLTIP_STYLE = { background: DASHBOARD_COLORS.tooltipBg, border: `1px solid ${DASHBOARD_COLORS.sale}`, borderRadius: 8, color: DASHBOARD_COLORS.label };
const TOOLTIP_STYLE_PURCHASE = { ...TOOLTIP_STYLE, border: `1px solid ${DASHBOARD_COLORS.purchase110}` };
const CHART_LABEL_STYLE = { fill: DASHBOARD_COLORS.label, fontWeight: 700 };

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
 * Garante que `dia` vindo da API esteja no formato "YYYY-MM-DD".
 * O driver pg pode retornar datas como objeto Date JS (toString = "Wed May 20 2026...")
 * em vez de string ISO, o que corromperia os labels do gráfico.
 */
function vpNormalizeDia(dia) {
  const s = String(dia ?? '');
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);  // já é ISO
  const d = new Date(s);
  return isNaN(d.getTime()) ? s.substring(0, 10) : vpDateStr(d); // converte para ISO
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
  { nome: 'Gasolina Comum',     preco: 5.89, secao: 'Combustíveis', grupo: 'Gasolinas' },
  { nome: 'Gasolina Aditivada', preco: 6.29, secao: 'Combustíveis', grupo: 'Gasolinas' },
  { nome: 'Etanol Comum',       preco: 3.89, secao: 'Combustíveis', grupo: 'Etanol'    },
  { nome: 'Diesel S10',         preco: 6.19, secao: 'Combustíveis', grupo: 'Diesel'    },
  { nome: 'GNV',                preco: 4.20, secao: 'Combustíveis', grupo: 'GNV'       },
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
        rows.push({ dia, combustivel: fuel.nome, vendedor, litros, faturamento, secao: fuel.secao, grupo: fuel.grupo });
      });
    });
  }
  return rows;
}

// ── Mock Data: Conveniência / Loja (prodtipo = 2) ────────────────────────────
const _VP_MOCK_CONV_PRODS = [
  // ── Loja / Conveniência ──────────────────────────────────────────────────
  { nome: 'Refrigerante 350ml', preco:  5.50, rangeQtd:[20,80],  secao:'Loja', grupo:'Bebidas'    },
  { nome: 'Água 500ml',         preco:  2.80, rangeQtd:[25,90],  secao:'Loja', grupo:'Bebidas'    },
  { nome: 'Cerveja Lata 350ml', preco:  5.00, rangeQtd:[15,55],  secao:'Loja', grupo:'Bebidas'    },
  { nome: 'Energético 250ml',   preco:  9.90, rangeQtd:[ 6,25],  secao:'Loja', grupo:'Bebidas'    },
  { nome: 'Café Expresso',      preco:  4.50, rangeQtd:[12,50],  secao:'Loja', grupo:'Cafeteria'  },
  { nome: 'Cigarro Marlboro',   preco: 15.00, rangeQtd:[ 8,30],  secao:'Loja', grupo:'Fumo'       },
  { nome: 'Cigarro L&M',        preco: 13.00, rangeQtd:[ 6,25],  secao:'Loja', grupo:'Fumo'       },
  { nome: 'Salgadinho 40g',     preco:  4.00, rangeQtd:[10,40],  secao:'Loja', grupo:'Alimentos'  },
  { nome: 'Chocolate 40g',      preco:  3.50, rangeQtd:[ 8,30],  secao:'Loja', grupo:'Alimentos'  },
  { nome: 'Pão de Queijo',      preco:  3.00, rangeQtd:[10,45],  secao:'Loja', grupo:'Alimentos'  },
  // ── Lubrificantes / Pista ─────────────────────────────────────────────────
  { nome: 'Arla 32 20L',        preco: 89.90, rangeQtd:[ 2,10],  secao:'Lubrificantes', grupo:'Aditivos'    },
  { nome: 'Óleo Motor 5W30',    preco: 42.50, rangeQtd:[ 2, 8],  secao:'Lubrificantes', grupo:'Óleos Motor' },
  { nome: 'Óleo Motor 10W40',   preco: 38.90, rangeQtd:[ 3,10],  secao:'Lubrificantes', grupo:'Óleos Motor' },
  { nome: 'Fluido Freio DOT4',  preco: 18.50, rangeQtd:[ 1, 5],  secao:'Lubrificantes', grupo:'Fluidos'     },
  { nome: 'Aditivo Radiador',   preco: 22.90, rangeQtd:[ 1, 4],  secao:'Lubrificantes', grupo:'Aditivos'    },
  // ── Serviços ───────────────────────────────────────────────────────────────
  { nome: 'Lavagem Simples',    preco: 35.00, rangeQtd:[ 4,18],  secao:'Serviços', grupo:'Lavagem'        },
  { nome: 'Lavagem Completa',   preco: 65.00, rangeQtd:[ 2,10],  secao:'Serviços', grupo:'Lavagem'        },
  { nome: 'Calibragem',         preco:  8.00, rangeQtd:[ 8,35],  secao:'Serviços', grupo:'Serviços Pista' },
  // ── Filtros ───────────────────────────────────────────────────────────────
  { nome: 'Filtro de Óleo',     preco: 28.90, rangeQtd:[ 2, 7],  secao:'Filtros',  grupo:'Filtros Motor'  },
  { nome: 'Água Destilada',     preco:  6.50, rangeQtd:[ 5,20],  secao:'Filtros',  grupo:'Aditivos'       },
];

// Listas de spro/gpro derivadas do mock (fallback quando não há API)
function vpMockCatLists(prodtipo) {
  const prods = prodtipo === 1 ? _VP_MOCK_FUELS : _VP_MOCK_CONV_PRODS;
  const secoes = [...new Map(prods.map(p => [p.secao, { codigo: p.secao, nome: p.secao }])).values()]
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const grupos = [...new Map(prods.map(p => [p.grupo, { codigo: p.grupo, nome: p.grupo }])).values()]
    .sort((a, b) => a.nome.localeCompare(b.nome));
  return { secoes, grupos };
}

function vpMockConvRows(days = 35) {
  const today = new Date();
  const rows  = [];
  for (let ago = days - 1; ago >= 0; ago--) {
    const d   = new Date(today);
    d.setDate(d.getDate() - ago);
    const dia = vpDateStr(d);
    const wk  = (d.getDay() === 0 || d.getDay() === 6) ? 1.2 : 1.0;
    _VP_MOCK_CONV_PRODS.forEach(prod => {
      const [lo, hi] = prod.rangeQtd;
      const dayQtd   = Math.round((lo + Math.random() * (hi - lo)) * wk);
      _VP_MOCK_VEND.forEach((vendedor, vi) => {
        const qtd = Math.max(0, Math.round(dayQtd * _VP_MOCK_SHARES[vi] * (0.7 + Math.random() * 0.6)));
        if (qtd === 0) return;
        const faturamento = Math.round(qtd * prod.preco * (0.97 + Math.random() * 0.06) * 100) / 100;
        rows.push({ dia, combustivel: prod.nome, vendedor, litros: qtd, faturamento, secao: prod.secao, grupo: prod.grupo });
      });
    });
  }
  return rows;
}

// ── Componente ────────────────────────────────────────────────────────────────
const VendasPista = ({ clients, selectedClient, selectedPeriod, themeMode }) => {
  const [periodKey, setPeriodKey] = useState('diario');
  const [viewMode, setViewMode]   = useState('combustivel');
  const [secao, setSecao]         = useState('combustivel'); // 'combustivel' | 'conveniencia'
  const [catTipo, setCatTipo]     = useState('secao');       // 'secao' | 'grupo'
  const [catValor, setCatValor]   = useState(null);          // null = todos
  const [catLists, setCatLists]   = useState({ secoes: [], grupos: [] }); // spro/gpro do banco
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

  // Re-busca quando mudar empresa, intervalo de datas ou seção; cai no mock se não houver dados
  useEffect(() => {
    if (!empresa || !dataInicio || !dataFim) { setUsingMock(true); return; }
    setLoading(true); setError(null); setUsingMock(false);
    const prodtipo = secao === 'combustivel' ? 1 : 2;
    fetch(`${API_URL}/api/dashboard/vendas-pista?empresa=${empresa}&dataInicio=${dataInicio}&dataFim=${dataFim}&prodtipo=${prodtipo}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) { setUsingMock(true); return; }
        setRawData(arr);
      })
      .catch(err => { setError(err.message); setUsingMock(true); })
      .finally(() => setLoading(false));
  }, [empresa, dataInicio, dataFim, secao]);

  // Busca seções (spro) e grupos (gpro) direto do banco quando muda o tipo de produto
  useEffect(() => {
    const prodtipo = secao === 'combustivel' ? 1 : 2;
    if (!empresa) return; // sem empresa usa mock/derivado
    fetch(`${API_URL}/api/dashboard/prod-categorias?prodtipo=${prodtipo}`)
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.secoes) return; // cai no fallback derivado
        setCatLists({ secoes: data.secoes || [], grupos: data.grupos || [] });
      })
      .catch(() => {}); // falha silenciosa → usa catOptions derivado dos dados
  }, [empresa, secao]);

  // Mock data gerado uma vez como fallback (combustível ou conveniência)
  const mockRows     = useMemo(() => vpMockRows(35), []);
  const mockConvRows = useMemo(() => vpMockConvRows(35), []);
  const sourceMock   = secao === 'combustivel' ? mockRows : mockConvRows;
  const sourceData   = usingMock ? sourceMock : rawData;

  // Quando usa mock e catLists está vazio, popula a partir das constantes mock
  useEffect(() => {
    if (usingMock && catLists.secoes.length === 0) {
      const prodtipo = secao === 'combustivel' ? 1 : 2;
      setCatLists(vpMockCatLists(prodtipo));
    }
  }, [usingMock, secao, catLists.secoes.length]);

  const { chartData, groupKeys, totais, catOptions } = useMemo(() => {
    const empty = { chartData: [], groupKeys: [], totais: { faturamento: 0, litros: 0 }, catOptions: [] };
    if (!sourceData.length) return empty;

    const PT_MON = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const getDim  = row => viewMode === 'combustivel' ? row.combustivel : (row.vendedor || 'Sem Vendedor');
    const getCat  = row => catTipo === 'secao' ? (row.secao || 'Sem Seção') : (row.grupo || 'Sem Grupo');

    // Opções disponíveis para o filtro de categoria (sem duplicatas, ordenadas)
    const catOptions = [...new Set(sourceData.map(getCat))].sort();

    // Filtra por categoria selecionada (null = todos)
    const filtered = catValor ? sourceData.filter(r => getCat(r) === catValor) : sourceData;

    // Calcula total de faturamento por dimensão (para ordenar top-5)
    const dimTotals = {};
    filtered.forEach(row => {
      const d = getDim(row);
      dimTotals[d] = (dimTotals[d] || 0) + row.faturamento;
    });
    const sortedDims = Object.keys(dimTotals).sort((a, b) => dimTotals[b] - dimTotals[a]);
    const top5       = sortedDims.slice(0, 5);
    const hasOthers  = sortedDims.length > 5;
    const activeDims = hasOthers ? [...top5, 'Outros'] : top5;

    // Agrupamento por granularidade
    const bucket = {};
    filtered.forEach(row => {
      const d = vpNormalizeDia(row.dia);
      let key;
      if (periodKey === 'diario') {
        key = d;
      } else if (periodKey === 'semanal') {
        const dt  = new Date(d + 'T12:00:00');
        const dow = dt.getDay() === 0 ? 7 : dt.getDay();
        const mon = new Date(dt); mon.setDate(dt.getDate() - dow + 1);
        key = vpDateStr(mon);
      } else if (periodKey === 'mensal') {
        key = d.substring(0, 7);
      } else {
        key = d.substring(0, 4);
      }
      if (!bucket[key]) {
        bucket[key] = { key, totalFat: 0, litros: 0 };
        activeDims.forEach(dim => { bucket[key][`d_${dim}`] = 0; });
      }
      const dim    = getDim(row);
      const bDim   = top5.includes(dim) ? dim : (hasOthers ? 'Outros' : null);
      if (!bDim) return;
      bucket[key][`d_${bDim}`]  = (bucket[key][`d_${bDim}`] || 0) + row.faturamento;
      bucket[key].totalFat += row.faturamento;
      bucket[key].litros   += row.litros;
    });

    const sorted    = Object.keys(bucket).sort();
    const fatTotals = sorted.map(k => bucket[k].totalFat);
    const { maWin } = period;

    const allPoints = sorted.map((key, i) => {
      const slice = fatTotals.slice(Math.max(0, i - maWin + 1), i + 1);
      const ma7   = slice.reduce((s, v) => s + v, 0) / slice.length;
      const dt    = new Date(
        periodKey === 'anual' ? `${key}-01-01T12:00:00` : `${key.substring(0, 7)}-01T12:00:00`
      );
      let label;
      if (periodKey === 'diario' || periodKey === 'semanal') {
        const dtDay = new Date(key + 'T12:00:00');
        label = `${String(dtDay.getDate()).padStart(2,'0')}/${PT_MON[dtDay.getMonth()]}`;
      } else if (periodKey === 'mensal') {
        label = `${PT_MON[dt.getMonth()]}/${String(dt.getFullYear()).substring(2)}`;
      } else {
        label = key;
      }
      return { ...bucket[key], label, ma7 };
    });

    const last   = allPoints[allPoints.length - 1];
    const totais = { faturamento: last?.totalFat || 0, litros: last?.litros || 0 };
    const groupKeys = activeDims.map(d => ({ dim: d, key: `d_${d}` }));
    return { chartData: allPoints, groupKeys, totais, catOptions };
  }, [sourceData, periodKey, viewMode, period, catTipo, catValor]);

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
      {/* ── Zona 1: Título + toggle de Seção ──────────────────────────────── */}
      <div className="card-header" style={{ flexWrap:'wrap', gap:8 }}>
        <h3>
          DESEMPENHO E VOLUME DE {secao === 'combustivel' ? 'VENDAS PISTA' : 'CONVENIÊNCIA / LOJA'}
          {usingMock && (
            <span style={{ fontSize:'0.68em', color:'#64748b', fontWeight:400, marginLeft:10 }}>
              (demonstração)
            </span>
          )}
        </h3>
        <div className="vp-toggle-group">
          {[{k:'combustivel',l:'⛽ Combustível'},{k:'conveniencia',l:'🏪 Conveniência'}].map(v=>(
            <button key={v.k} type="button"
              className={`vp-period-btn vp-secao-btn${secao===v.k?' active':''}`}
              onClick={()=>{ setSecao(v.k); setViewMode('combustivel'); setRawData([]); setCatValor(null); setCatLists({ secoes:[], grupos:[] }); }}>{v.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zona 2: Dimensão + Período ────────────────────────────────────── */}
      <div className="vp-controls-bar">
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="vp-ctrl-label">Agrupar por</span>
          <div className="vp-toggle-group">
            {[
              {k:'combustivel', l: secao==='combustivel' ? 'Combustível' : 'Produto'},
              {k:'vendedor',    l:'Vendedor'},
            ].map(v=>(
              <button key={v.k} type="button"
                className={`vp-period-btn${viewMode===v.k?' active':''}`}
                onClick={()=>setViewMode(v.k)}>{v.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="vp-ctrl-label">Período</span>
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
            {secao === 'combustivel' ? 'Volume Vendido' : 'Qtd Vendida'}&nbsp;
            <span style={{opacity:.6,fontSize:'0.8em'}}>({kpiLabel})</span>
          </span>
          <span className="vp-kpi-value" style={{color:'#38bdf8'}}>
            {fmtL(totais.litros)}&nbsp;{secao === 'combustivel' ? 'L' : 'un'}
          </span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">{maLabel}</span>
          <span className="vp-kpi-value" style={{color:'#fff'}}>{fmtBig(lastMa)}</span>
        </div>
      </div>

      {/* ── Zona 3: Filtrar por Seção (spro) / Grupo (gpro) ─────────────── */}
      {(() => {
        // Usa listas do banco quando disponíveis; fallback = derivado dos dados
        const listaAtiva = catTipo === 'secao'
          ? (catLists.secoes.length ? catLists.secoes : catOptions.map(n => ({ codigo: n, nome: n })))
          : (catLists.grupos.length ? catLists.grupos : catOptions.map(n => ({ codigo: n, nome: n })));
        if (!listaAtiva.length) return null;
        return (
          <div className="vp-cat-row">
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="vp-ctrl-label">Filtrar por</span>
              <div className="vp-toggle-group">
                {[{k:'secao',l:'Seção'},{k:'grupo',l:'Grupo'}].map(v=>(
                  <button key={v.k} type="button"
                    className={`vp-period-btn vp-cat-tipo-btn${catTipo===v.k?' active':''}`}
                    onClick={()=>{ setCatTipo(v.k); setCatValor(null); }}>{v.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="vp-cat-chips">
              <button type="button"
                className={`vp-cat-chip${!catValor?' active':''}`}
                onClick={()=>setCatValor(null)}>Todos</button>
              {listaAtiva.map(item=>(
                <button key={item.codigo} type="button"
                  className={`vp-cat-chip${catValor===item.nome?' active':''}`}
                  onClick={()=>setCatValor(prev => prev===item.nome ? null : item.nome)}>{item.nome}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

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
            {/* Eixo direito — Volume L ou Qtd un */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#38bdf8"
              tick={{ fill:'#38bdf8', fontSize:10 }}
              tickFormatter={v => secao === 'combustivel'
                ? (v >= 1000 ? `${(v/1000).toFixed(0)}kL` : `${v}L`)
                : `${v}un`}
            />
            <Tooltip
              contentStyle={{ background:DASHBOARD_COLORS.tooltipBg, border:'1px solid #E31E24', borderRadius:8, color:'#f8fafc' }}
              formatter={(v, name) => {
                const volLabel = secao === 'combustivel' ? 'Litros (L)' : 'Qtd (un)';
                const volUnit  = secao === 'combustivel' ? 'L' : 'un';
                if (name === volLabel)
                  return [`${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})} ${volUnit}`, name];
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

            {/* GRUPO 2 — Volume em Litros (combustível) ou Qtd (conveniência) */}
            <Bar
              yAxisId="right"
              dataKey="litros"
              name={secao === 'combustivel' ? 'Litros (L)' : 'Qtd (un)'}
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
              stroke={themeMode === 'light' ? '#1e293b' : '#ffffff'}
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

// ── MetasRealizadoChart ──────────────────────────────────────────────────────
const _METAS_DAILY_L = [
  4500,3600,2200,4100,4400,4000,4200,  // semana 1
  4600,3800,2400,4000,4300,4100,4400,  // semana 2
  4700,3900,2300,4100,4400,4200,4500,  // semana 3
  4600,3700,2100,4200,4500,3900,       // semana 4 parcial (27 dias)
];
const _METAS_PRICE = 5.0; // R$/L (mock)

const MR_CSS = `
@keyframes mr-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes mr-count-bar { from{width:0} to{width:var(--tw)} }
@keyframes mr-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
`;

const MetasRealizadoChart = ({ themeMode = 'dark' }) => {
  const [metrica, setMetrica]   = useState('litros');
  const [periodo, setPeriodo]   = useState('mensal');
  const [animKey, setAnimKey]   = useState(0);
  const dark = themeMode !== 'light';

  useEffect(() => { setAnimKey(k => k + 1); }, [metrica, periodo]);

  const cfg = useMemo(() => {
    const mensal    = periodo === 'mensal';
    const totalDias = mensal ? 31 : 7;
    const raw       = mensal ? _METAS_DAILY_L : _METAS_DAILY_L.slice(-7);
    const metaL     = mensal ? 150000 : 35000;
    const meta      = metrica === 'litros' ? metaL : metaL * _METAS_PRICE;
    const semLabels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

    let acc = 0;
    const data = raw.map((l, i) => {
      const v = metrica === 'litros' ? l : Math.round(l * _METAS_PRICE);
      acc += v;
      return {
        label   : mensal ? String(i + 1) : semLabels[i],
        realizado: Math.round(acc),
        ritmo   : Math.round(meta * (i + 1) / totalDias),
      };
    });

    const realizado   = Math.round(acc);
    const pct         = Math.min(100, (realizado / meta) * 100);
    const faltante    = Math.max(0, meta - realizado);
    const diasRest    = totalDias - raw.length;
    const cor         = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
    const corBg       = pct >= 90 ? (dark ? '#14532d' : '#dcfce7') : pct >= 70 ? (dark ? '#78350f' : '#fef3c7') : (dark ? '#7f1d1d' : '#fee2e2');
    const corText     = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
    const status      = pct >= 90 ? 'No alvo ✓' : pct >= 70 ? 'Atenção' : 'Abaixo da meta';
    return { data, meta, realizado, pct, faltante, diasRest, totalDias, cor, corBg, corText, status };
  }, [metrica, periodo, dark]);

  const fmtV = v => metrica === 'litros'
    ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' L'
    : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const c = {
    card  : { background: dark ? '#1c1c1e' : '#ffffff', border: `1px solid ${dark ? '#2c2c2e' : '#e5e7eb'}`, borderRadius: 14, padding: '20px 22px', boxShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,.06)' },
    title : { margin: 0, fontSize: 12, fontWeight: 700, color: dark ? '#94a3b8' : '#6b7280', letterSpacing: 1, textTransform: 'uppercase' },
    sub   : { fontSize: 11, color: dark ? '#475569' : '#9ca3af', marginTop: 2 },
    tog   : (active) => ({ background: active ? '#E31E24' : (dark ? '#2c2c2e' : '#f3f4f6'), color: active ? '#fff' : (dark ? '#64748b' : '#6b7280'), border: 'none', borderRadius: 6, padding: '5px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }),
    kpiBox: (accent) => ({ flex: 1, background: dark ? '#141414' : '#f9fafb', border: `1px solid ${accent}33`, borderRadius: 10, padding: '14px 16px' }),
    kpiL  : { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: dark ? '#6b7280' : '#9ca3af', marginBottom: 4 },
    kpiV  : (col) => ({ fontSize: 22, fontWeight: 900, color: col || (dark ? '#f1f5f9' : '#111827'), lineHeight: 1.1 }),
    axis  : { fill: dark ? '#64748b' : '#9ca3af', fontSize: 10 },
    grid  : dark ? '#1e293b' : '#f1f5f9',
  };

  const gradId = `mr-grad-${animKey}`;

  return (
    <div style={c.card} key={animKey}>
      <style>{MR_CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ animation: 'mr-fade-up .35s ease-out both' }}>
          <h3 style={c.title}>Acompanhamento de Metas vs. Realizado</h3>
          <div style={c.sub}>Maio 2026 · Acumulado diário</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', animation: 'mr-fade-up .35s .05s ease-out both' }}>
          <div style={{ display: 'flex', gap: 3, background: dark ? '#141414' : '#f3f4f6', borderRadius: 7, padding: 3 }}>
            <button style={c.tog(metrica === 'litros')}  onClick={() => setMetrica('litros')}>Volume (L)</button>
            <button style={c.tog(metrica === 'reais')}   onClick={() => setMetrica('reais')}>Faturamento (R$)</button>
          </div>
          <div style={{ display: 'flex', gap: 3, background: dark ? '#141414' : '#f3f4f6', borderRadius: 7, padding: 3 }}>
            <button style={c.tog(periodo === 'mensal')}  onClick={() => setPeriodo('mensal')}>Mensal</button>
            <button style={c.tog(periodo === 'semanal')} onClick={() => setPeriodo('semanal')}>Semanal</button>
          </div>
        </div>
      </div>

      {/* Big % indicator + KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', animation: 'mr-fade-up .4s .08s ease-out both' }}>
        {/* % Badge */}
        <div style={{ background: cfg.corBg, borderRadius: 12, padding: '16px 24px', minWidth: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: cfg.corText, lineHeight: 1, animation: cfg.pct < 70 ? 'mr-pulse 2s infinite' : 'none' }}>
            {cfg.pct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.corText, marginTop: 4, opacity: .85 }}>{cfg.status}</div>
          <div style={{ fontSize: 10, color: cfg.corText, opacity: .65, marginTop: 2 }}>da meta atingida</div>
        </div>

        {/* Progress bar visual */}
        <div style={{ flex: 1, background: dark ? '#141414' : '#f9fafb', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, minWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: dark ? '#94a3b8' : '#6b7280' }}>
            <span style={{ color: cfg.cor }}>Realizado: {fmtV(cfg.realizado)}</span>
            <span>Meta: {fmtV(cfg.meta)}</span>
          </div>
          <div style={{ height: 20, background: dark ? '#2c2c2e' : '#e5e7eb', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${cfg.pct}%`, background: `linear-gradient(90deg, ${cfg.cor}cc, ${cfg.cor})`, borderRadius: 10, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }}/>
            {cfg.pct < 100 && (
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${cfg.pct + 1}%`, fontSize: 9, color: dark ? '#64748b' : '#9ca3af', fontWeight: 700, whiteSpace: 'nowrap' }}>
                falta {fmtV(cfg.faltante)}
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, color: dark ? '#475569' : '#9ca3af' }}>
            Pace ideal hoje: {fmtV(cfg.data[cfg.data.length - 1]?.ritmo || 0)} · {cfg.diasRest > 0 ? `${cfg.diasRest} dias restantes` : 'Período encerrado'}
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { l: 'Realizado', v: fmtV(cfg.realizado), col: cfg.cor },
            { l: 'Meta',      v: fmtV(cfg.meta),      col: dark ? '#94a3b8' : '#6b7280' },
            { l: 'Faltante',  v: fmtV(cfg.faltante),  col: cfg.faltante > 0 ? '#ef4444' : '#22c55e' },
            { l: 'Dias Rest.',v: cfg.diasRest > 0 ? `${cfg.diasRest} dias` : '—', col: dark ? '#94a3b8' : '#6b7280' },
          ].map(({ l, v, col }, i) => (
            <div key={l} style={{ ...c.kpiBox(col), animation: `mr-fade-up .4s ${.12 + i * .06}s ease-out both` }}>
              <div style={c.kpiL}>{l}</div>
              <div style={c.kpiV(col)}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ animation: 'mr-fade-up .5s .2s ease-out both' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
          {[['Realizado', cfg.cor, 'solid'], ['Ritmo ideal', dark ? '#64748b' : '#94a3b8', 'dashed'], ['Meta', '#ef4444', 'dashed']].map(([l, c2, d]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: dark ? '#64748b' : '#9ca3af' }}>
              <span style={{ width: 18, borderTop: `2px ${d} ${c2}`, display: 'inline-block' }}/>
              {l}
            </span>
          ))}
        </div>
        <ResponsiveContainer key={`mr-${animKey}`} width="100%" height={220}>
          <ComposedChart data={cfg.data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={cfg.cor} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={cfg.cor} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false}/>
            <XAxis dataKey="label" tick={c.axis} stroke="none" interval={periodo === 'mensal' ? 4 : 0}/>
            <YAxis tick={c.axis} stroke="none" width={52}
              tickFormatter={v => metrica === 'litros'
                ? v >= 1000 ? (v/1000).toFixed(0)+'k' : v
                : v >= 1000 ? 'R$'+(v/1000).toFixed(0)+'k' : 'R$'+v}/>
            <Tooltip
              contentStyle={{ background: dark ? '#0f172a' : '#fff', border: `1px solid ${dark ? '#334155' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: dark ? '#f8fafc' : '#111827', fontWeight: 700 }}
              formatter={(v, name) => [fmtV(v), name === 'realizado' ? 'Realizado' : name === 'ritmo' ? 'Ritmo ideal' : name]}
            />
            <ReferenceLine y={cfg.meta} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
              label={{ value: 'META', position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: 700 }}/>
            <Area dataKey="realizado" name="realizado" type="monotone"
              stroke={cfg.cor} strokeWidth={2.5} fill={`url(#${gradId})`}
              isAnimationActive animationDuration={1400} animationEasing="ease-out" dot={false} activeDot={{ r: 4, fill: cfg.cor }}/>
            <Line dataKey="ritmo" name="ritmo" type="monotone"
              stroke={dark ? '#64748b' : '#94a3b8'} strokeWidth={1.5} strokeDasharray="5 3"
              dot={false} isAnimationActive animationDuration={1000} animationBegin={200}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
// ── fim MetasRealizadoChart ──────────────────────────────────────────────────

// ── ProjecaoVendas — CSS de animações ───────────────────────────────────────
const PV_ANIM_CSS = `
@keyframes pv-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes pv-scale-in {
  from { opacity: 0; transform: scaleX(0); transform-origin: left; }
  to   { opacity: 1; transform: scaleX(1); transform-origin: left; }
}
@keyframes pv-glow-line {
  0%,100% { opacity: 0.85; }
  50%      { opacity: 1;    }
}
@keyframes pv-today-pulse {
  0%,100% { opacity: 0.5; }
  50%      { opacity: 1;   }
}
`;

// hook count-up (reutilizável)
const usePvCount = (target, duration = 1250) => {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const go = (now) => {
      const p  = Math.min((now - t0) / duration, 1);
      const ep = 1 - Math.pow(1 - p, 3);   // ease-out cubic
      setV(Math.round(ep * target));
      if (p < 1) raf.current = requestAnimationFrame(go);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
};

// ── ProjecaoVendas ──────────────────────────────────────────────────────────
const PV_TODAY_DIA  = 26;   // dia de hoje em maio/2026
const PV_TOTAL_DIAS = 31;   // dias em maio/2026
const PV_UNITS      = ['Combustível', 'Conveniência'];
const PV_DAY_TYPES  = ['Todos', 'Dias Úteis', 'Finais de Semana'];

// Metadados de cada dia de maio/2026: dia, dow (0=Dom, 6=Sáb), isFDS
const PV_DAYS_META = Array.from({ length: PV_TOTAL_DIAS }, (_, i) => {
  const dia = i + 1;
  const dow = new Date(2026, 4, dia).getDay();
  return { dia, dow, isFDS: dow === 0 || dow === 6 };
});

// Faturamento diário realizado (mai/2026, dias 1–26)
const PV_REALIZED = {
  Combustível: {
    1:14820, 2:21350, 3:19840, 4:13250, 5:14620, 6:15380, 7:12980, 8:16450,
    9:22180, 10:20640, 11:13760, 12:14980, 13:16230, 14:15410, 15:17890,
    16:23540, 17:21780, 18:14230, 19:15670, 20:16890, 21:13450, 22:17320,
    23:24160, 24:22340, 25:15890, 26:16540,
  },
  Conveniência: {
    1:3640, 2:6820, 3:6120, 4:2980, 5:3210, 6:3540, 7:2870, 8:3890,
    9:7340, 10:6980, 11:3120, 12:3450, 13:3780, 14:3320, 15:4120,
    16:7890, 17:7230, 18:3080, 19:3560, 20:3920, 21:2980, 22:4230,
    23:8120, 24:7680, 25:3640, 26:3820,
  },
};

const PvTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const pt   = payload[0]?.payload;
  const real = payload.find(p => p.dataKey === 'realizado');
  const proj = payload.find(p => p.dataKey === 'projetado');
  const fmtBRLInt = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return (
    <div className="pv-tooltip">
      <strong>Dia {pt?.dia}/mai</strong>
      {real?.value != null && <span style={{ color: '#38bdf8' }}>Realizado: {fmtBRLInt(real.value)}</span>}
      {proj?.value != null && pt?.isProjection && <span style={{ color: '#fb923c' }}>Projetado: {fmtBRLInt(proj.value)}</span>}
    </div>
  );
};

const ProjecaoVendas = () => {
  const [unit,    setUnit]    = useState('Combustível');
  const [dayType, setDayType] = useState('Todos');
  const [animKey, setAnimKey] = useState(0);   // forçar re-animação do gráfico
  const [progW,   setProgW]   = useState(0);   // largura animada da barra

  const { chartData, totalRealizado, mediaDiaria, projecaoTotal, diasRestantes, lastRealDia } = useMemo(() => {
    const realized = PV_REALIZED[unit] || {};

    const allFiltered = PV_DAYS_META.filter(d => {
      if (dayType === 'Dias Úteis')       return !d.isFDS;
      if (dayType === 'Finais de Semana') return  d.isFDS;
      return true;
    });

    const passedDays = allFiltered.filter(d => d.dia <= PV_TODAY_DIA);
    const futureDays = allFiltered.filter(d => d.dia >  PV_TODAY_DIA);

    const totalReal = passedDays.reduce((s, d) => s + (realized[d.dia] || 0), 0);
    const media     = passedDays.length > 0 ? totalReal / passedDays.length : 0;
    const projTotal = totalReal + media * futureDays.length;

    const lastDia = passedDays.length > 0 ? passedDays[passedDays.length - 1].dia : 0;
    const lastVal = realized[lastDia] || 0;

    const data = allFiltered.map(d => ({
      dia:          d.dia,
      label:        String(d.dia),
      isProjection: d.dia > lastDia,
      realizado:    d.dia <= PV_TODAY_DIA ? (realized[d.dia] ?? null) : null,
      // projetado: null para dias anteriores ao último real;
      //            no último dia real = mesmo valor (ponto de conexão);
      //            futuros = média diária
      projetado:    d.dia <  lastDia ? null
                  : d.dia === lastDia ? lastVal
                  : media,
    }));

    return { chartData: data, totalRealizado: totalReal, mediaDiaria: media,
             projecaoTotal: projTotal, diasRestantes: futureDays.length, lastRealDia: lastDia };
  }, [unit, dayType]);

  const pct  = projecaoTotal > 0 ? Math.min(100, Math.round((totalRealizado / projecaoTotal) * 100)) : 0;
  const fmtK = n => {
    const v = Number(n || 0);
    if (v >= 1_000_000) return `R$\xa0${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
    if (v >= 1_000)     return `R$\xa0${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
    return `R$\xa0${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };

  // ── Count-up para cada KPI ──
  const cReal = usePvCount(totalRealizado);
  const cProj = usePvCount(projecaoTotal);
  const cMed  = usePvCount(mediaDiaria);
  const cDias = usePvCount(diasRestantes);
  const cPct  = usePvCount(pct);

  // ── Re-animação ao trocar filtro ──
  useEffect(() => { setAnimKey(k => k + 1); }, [unit, dayType]);

  // ── Barra de progresso: reset → animar ──
  useEffect(() => {
    setProgW(0);
    const t = setTimeout(() => setProgW(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="chart-card pv-card">
      <style>{PV_ANIM_CSS}</style>

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="card-header pv-header" style={{ animation: 'pv-fade-up 0.4s ease-out both' }}>
        <div className="pv-title">
          <h3>PROJEÇÃO DE VENDAS — RUN RATE</h3>
          <span>Faturamento realizado + projeção sazonalizada · {unit.toLowerCase()} · mai/2026</span>
        </div>
        <div className="pv-controls">
          <div className="segmented-filter" aria-label="Unidade de negócio">
            {PV_UNITS.map(u => (
              <button key={u} type="button" className={unit === u ? 'active' : ''} onClick={() => setUnit(u)}>{u}</button>
            ))}
          </div>
          <div className="segmented-filter" aria-label="Tipo de dia">
            {PV_DAY_TYPES.map(t => (
              <button key={t} type="button" className={dayType === t ? 'active' : ''} onClick={() => setDayType(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs animados ──────────────────────────────────────────────── */}
      <div className="vp-kpi-row">
        {[
          { label: 'Realizado até hoje', val: fmtK(cReal), color: '#38bdf8' },
          { label: 'Projeção do mês',    val: fmtK(cProj), color: '#fb923c' },
          { label: 'Média diária',       val: fmtK(cMed),  color: null      },
          { label: 'Dias restantes',     val: String(cDias), color: null    },
        ].map((k, i) => (
          <div key={k.label} className="vp-kpi"
            style={{ animation: `pv-fade-up 0.45s ${i * 0.08}s ease-out both` }}>
            <span className="vp-kpi-label">{k.label}</span>
            <span className="vp-kpi-value" style={k.color ? { color: k.color } : {}}>{k.val}</span>
          </div>
        ))}
        <div className="vp-kpi pv-kpi-progress"
          style={{ animation: 'pv-fade-up 0.45s 0.32s ease-out both' }}>
          <span className="vp-kpi-label">Andamento do mês — {cPct}%</span>
          <div className="pv-progress-bar">
            <div className="pv-progress-fill"
              style={{ width: `${progW}%`, transition: 'width 1.5s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <span className="pv-progress-sub">{fmtK(cReal)} / {fmtK(cProj)}</span>
        </div>
      </div>

      {/* ── Gráfico animado ─────────────────────────────────────────────── */}
      <div style={{ animation: 'pv-fade-up 0.5s 0.2s ease-out both' }}>
        <ResponsiveContainer key={animKey} width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 24, right: 36, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="pvProjGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#fb923c" stopOpacity={0.30} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.03} />
              </linearGradient>
              <filter id="pvLineGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval={dayType === 'Todos' ? 2 : 0}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              width={60}
            />
            <Tooltip content={<PvTooltip />} />
            {/* Área sombreada — anima fade-in */}
            <Area dataKey="projetado" fill="url(#pvProjGrad)" stroke="none"
              connectNulls={false}
              isAnimationActive={true} animationDuration={1600} animationEasing="ease-out" />
            {/* Linha realizado — desenha da esquerda para direita */}
            <Line type="monotone" dataKey="realizado" name="Realizado"
              stroke="#38bdf8" strokeWidth={2.8} dot={false}
              style={{ filter: 'drop-shadow(0 0 4px #38bdf877)' }}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true} animationDuration={2200} animationEasing="ease-out" animationBegin={0} />
            {/* Linha projetado — tracejada, aparece depois */}
            <Line type="monotone" dataKey="projetado" name="Projeção"
              stroke="#fb923c" strokeWidth={2.2} strokeDasharray="8 4" dot={false}
              style={{ filter: 'drop-shadow(0 0 4px #fb923c66)' }}
              activeDot={{ r: 5, fill: '#fb923c', stroke: '#0f172a', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true} animationDuration={1400} animationEasing="ease-out" animationBegin={400} />
            {/* Marcador "Hoje" */}
            <ReferenceLine
              x={String(lastRealDia)}
              stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} strokeOpacity={0.7}
              label={{ value: 'Hoje', position: 'top', fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legenda ─────────────────────────────────────────────────────── */}
      <div className="pv-legend" style={{ animation: 'pv-fade-up 0.4s 0.5s ease-out both' }}>
        <span className="pv-legend-item">
          <span className="pv-legend-line pv-legend-real" />
          Faturamento realizado
        </span>
        <span className="pv-legend-item">
          <span className="pv-legend-line pv-legend-proj" />
          Projeção (run rate)
        </span>
        {dayType === 'Finais de Semana' && (
          <span className="pv-legend-note">⚠️ Projeção apenas para os {diasRestantes} FDS restantes</span>
        )}
        {dayType === 'Dias Úteis' && (
          <span className="pv-legend-note">📅 Projeção para os {diasRestantes} dias úteis restantes</span>
        )}
      </div>
    </div>
  );
};
// ── fim ProjecaoVendas ──────────────────────────────────────────────────────

const PRODUCT_MATRIX_UNITS = ['Pista', 'Conveniência', 'Combustível'];
const PRODUCT_MATRIX_PERIODS = [
  { value: 'Diário', factor: 0.08, marginShift: -0.6 },
  { value: 'Semanal', factor: 0.32, marginShift: 0.4 },
  { value: 'Mensal', factor: 1, marginShift: 0 },
  { value: 'Anual', factor: 12, marginShift: 1.2 },
];

const PRODUCT_MATRIX_MOCK = {
  // prodtipo = 2 — produtos de pista (não combustível)
  Pista: [
    { name: 'Arla 32', volume: 680, margin: 19 },
    { name: 'Lavagem Completa', volume: 640, margin: 45 },
    { name: 'Óleo Sintético 5W30', volume: 540, margin: 42 },
    { name: 'Lavagem Simples', volume: 620, margin: 30 },
    { name: 'Calibragem de Pneu', volume: 480, margin: 35 },
    { name: 'Óleo 2T', volume: 395, margin: 21 },
    { name: 'Filtro de Óleo', volume: 390, margin: 35 },
    { name: 'Aditivo Flex', volume: 320, margin: 37 },
    { name: 'Recarga TAG', volume: 300, margin: 12 },
    { name: 'Fluido Radiador', volume: 260, margin: 39 },
    { name: 'Óleo de Câmbio', volume: 220, margin: 36 },
    { name: 'Palheta Limpador', volume: 180, margin: 44 },
    { name: 'Fluido de Freio', volume: 175, margin: 38 },
    { name: 'Desengraxante Motor', volume: 170, margin: 14 },
    { name: 'Limpeza de Vidros', volume: 155, margin: 34 },
    { name: 'Cristalizador Para-brisa', volume: 140, margin: 41 },
    { name: 'Extintor Revisão', volume: 120, margin: 11 },
    { name: 'Graxa Lubrificante', volume: 110, margin: 28 },
    { name: 'Funil Abastecimento', volume: 90, margin: 16 },
    { name: 'Kit Revisão Básica', volume: 75, margin: 32 },
  ],
  Conveniência: [
    { name: 'Café Expresso', volume: 880, margin: 48 },
    { name: 'Pão de Queijo', volume: 790, margin: 39 },
    { name: 'Água Mineral 500ml', volume: 940, margin: 34 },
    { name: 'Energético Lata', volume: 710, margin: 41 },
    { name: 'Salgado Assado', volume: 680, margin: 36 },
    { name: 'Refrigerante 2L', volume: 870, margin: 19 },
    { name: 'Cerveja Long Neck', volume: 750, margin: 22 },
    { name: 'Chocolate Barra', volume: 640, margin: 18 },
    { name: 'Cigarro Carteira', volume: 920, margin: 12 },
    { name: 'Gelo 5kg', volume: 560, margin: 20 },
    { name: 'Vinho Seleção', volume: 170, margin: 45 },
    { name: 'Castanhas Premium', volume: 240, margin: 43 },
    { name: 'Suco Natural', volume: 310, margin: 38 },
    { name: 'Sanduíche Natural', volume: 360, margin: 35 },
    { name: 'Acessório Celular', volume: 130, margin: 46 },
    { name: 'Biscoito Recheado', volume: 310, margin: 16 },
    { name: 'Chiclete Unitário', volume: 210, margin: 14 },
    { name: 'Raspadinha', volume: 80, margin: 10 },
    { name: 'Isqueiro', volume: 190, margin: 18 },
    { name: 'Copo Descartável', volume: 110, margin: 13 },
  ],
  Combustível: [
    { name: 'Diesel S10', volume: 5240, margin: 18 },
    { name: 'Gasolina Comum', volume: 4820, margin: 17 },
    { name: 'Etanol Hidratado', volume: 3180, margin: 22 },
    { name: 'Diesel S500', volume: 2100, margin: 15 },
    { name: 'Gasolina Aditivada', volume: 1920, margin: 21 },
    { name: 'GNV Veicular', volume: 1380, margin: 25 },
    { name: 'Arla 32', volume: 680, margin: 19 },
    { name: 'Gasolina Premium', volume: 440, margin: 20 },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// ABC tier colors: A = top 20% by volume (green), B = next 30% (amber), C = bottom 50% (red)
const PM_ABC_COLORS = { A: '#22c55e', B: '#f59e0b', C: '#ef4444' };
const getPmAbcTier = (rank, total) => {
  const pct = rank / total;
  if (pct < 0.2) return 'A';
  if (pct < 0.5) return 'B';
  return 'C';
};

const ProductMatrixTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const tierLabels = { A: '⭐ A — Alto volume', B: '📦 B — Volume médio', C: '📉 C — Baixo volume' };
  return (
    <div className="product-matrix-tooltip">
      <strong>{item.name}</strong>
      <span>Volume: {Number(item.volume || 0).toLocaleString('pt-BR')} {item.unitLabel || 'vendas'}</span>
      <span>Margem: {Number(item.margin || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
      <span style={{ color: PM_ABC_COLORS[item.tier] || '#fff', fontWeight: 700 }}>{tierLabels[item.tier] || ''}</span>
    </div>
  );
};

// ── ContasReceber ─────────────────────────────────────────────────────────────

// Mock clientes
const CR_CLIENTES = [
  { codigo:  1, nome:'Mercado Brisa LTDA',          cnpj:'12.345.678/0001-90' },
  { codigo:  2, nome:'Comercial Alpha LTDA',         cnpj:'23.456.789/0001-01' },
  { codigo:  3, nome:'Distribuidora Nova Era',        cnpj:'34.567.890/0001-12' },
  { codigo:  4, nome:'Supermercado Ideal',            cnpj:'45.678.901/0001-23' },
  { codigo:  5, nome:'Restaurante Sabor & Cia',       cnpj:'56.789.012/0001-34' },
  { codigo:  6, nome:'Padaria Pão Quente',            cnpj:'67.890.123/0001-45' },
  { codigo:  7, nome:'Auto Peças São Paulo',          cnpj:'78.901.234/0001-56' },
  { codigo:  8, nome:'Transportes Rápido LTDA',       cnpj:'89.012.345/0001-67' },
  { codigo:  9, nome:'Farmácia Popular',              cnpj:'90.123.456/0001-78' },
  { codigo: 10, nome:'Construtora Horizonte',         cnpj:'01.234.567/0001-89' },
  { codigo: 11, nome:'Hotel Bela Vista',              cnpj:'12.345.678/0002-71' },
  { codigo: 12, nome:'Atacado Do Sul LTDA',           cnpj:'23.456.789/0002-82' },
  { codigo: 13, nome:'Escola Futuro',                 cnpj:'34.567.890/0002-93' },
  { codigo: 14, nome:'Metalúrgica Santos',            cnpj:'45.678.901/0002-04' },
  { codigo: 15, nome:'Clínica São José',              cnpj:'56.789.012/0002-15' },
];

function crMockContas() {
  const ref = new Date(2026, 4, 26); // hoje = 26/mai/2026
  const contas = [];
  // distribuição: ~16% atrasado, ~6% vence_hoje, ~40% a_vencer, ~38% recebido
  const dist = [
    ...Array(20).fill('atrasado'),
    ...Array( 7).fill('vence_hoje'),
    ...Array(50).fill('a_vencer'),
    ...Array(47).fill('recebido'),
  ];
  for (let i = 0; i < 124; i++) {
    const cli = CR_CLIENTES[i % CR_CLIENTES.length];
    const st  = dist[i % dist.length];
    const seed = (i * 7 + 13) % 100;

    let vencDays;
    if (st === 'atrasado')   vencDays = -(1 + (seed % 75));
    else if (st === 'vence_hoje') vencDays = 0;
    else if (st === 'a_vencer')   vencDays = 1 + (seed % 90);
    else                          vencDays = -(1 + (seed % 60));

    const venc = new Date(ref);
    venc.setDate(venc.getDate() + vencDays);
    const vencStr = venc.toISOString().split('T')[0];

    const valor    = 5000 + (seed * 1031 % 70000);
    const juros    = st === 'atrasado' ? Math.round(valor * 0.02 * (Math.abs(vencDays) / 30) * 100) / 100 : 0;
    const desconto = st === 'recebido' && seed > 70 ? Math.round(valor * 0.03 * 100) / 100 : 0;

    contas.push({
      id:              1250 + i + 1,
      cliente:         cli.nome,
      cnpj:            cli.cnpj,
      documento:       `Fatura ${String(1250 + i + 1).padStart(7, '0')}`,
      vencimento:      vencStr,
      valor,
      juros,
      desconto,
      valorAReceber:   valor + juros - desconto,
      status:          st,
      diasAtraso:      st === 'atrasado' ? Math.abs(vencDays) : 0,
      dataRecebimento: st === 'recebido' ? vencStr : null,
    });
  }
  return contas.sort((a, b) => {
    const ord = { atrasado:0, vence_hoje:1, a_vencer:2, recebido:3 };
    return (ord[a.status] - ord[b.status]) || a.vencimento.localeCompare(b.vencimento);
  });
}

const CR_ALL_MOCK = crMockContas();

function crMockResumo(contas) {
  const today = '2026-05-26';
  let totalAReceber = 0, aReceberHoje = 0, emAtraso = 0, recebidosMes = 0;
  contas.forEach(c => {
    if (c.status !== 'recebido') {
      totalAReceber += c.valorAReceber;
      if (c.status === 'vence_hoje') aReceberHoje += c.valorAReceber;
      if (c.status === 'atrasado')   emAtraso     += c.valorAReceber;
    } else {
      if (c.vencimento >= '2026-05-01' && c.vencimento <= today) recebidosMes += c.valor;
    }
  });
  return {
    totalAReceber, aReceberHoje, emAtraso,
    recebidosMes,
    inadimplencia: totalAReceber > 0 ? (emAtraso / totalAReceber) * 100 : 0,
  };
}

function crMockAnaliticos(contas) {
  let aVencer = 0, venceHoje = 0, atrasado = 0, recebido = 0;
  let f1 = 0, f2 = 0, f3 = 0, f4 = 0;
  const divPorCli = {};
  contas.forEach(c => {
    if (c.status === 'a_vencer')   aVencer   += c.valorAReceber;
    if (c.status === 'vence_hoje') venceHoje += c.valorAReceber;
    if (c.status === 'atrasado')   atrasado  += c.valorAReceber;
    if (c.status === 'recebido')   recebido  += c.valor;
    if (c.status === 'atrasado') {
      const d = c.diasAtraso;
      if (d <= 15)      f1 += c.valor;
      else if (d <= 30) f2 += c.valor;
      else if (d <= 60) f3 += c.valor;
      else              f4 += c.valor;
    }
    if (c.status !== 'recebido') {
      divPorCli[c.cliente] = (divPorCli[c.cliente] || 0) + c.valorAReceber;
    }
  });
  const totalAberto = aVencer + venceHoje + atrasado;
  const top5 = Object.entries(divPorCli).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cliente,divida])=>({cliente,divida}));
  const abertos = contas.filter(c => c.status !== 'recebido');
  const ticketMedio = abertos.length ? abertos.reduce((s,c)=>s+c.valor,0)/abertos.length : 0;
  return {
    porStatus: { aVencer, venceHoje, atrasado, recebido },
    faixaAtraso: { f1, f2, f3, f4, total: f1+f2+f3+f4 },
    top5,
    indices: {
      ticketMedio,
      prazoMedio: 32,
      inadimplencia: totalAberto > 0 ? (atrasado / totalAberto) * 100 : 0,
      recebimentoAntecip: 5.4,
    },
  };
}

// Status helpers
const CR_STATUS_LABEL = { a_vencer:'A Vencer', vence_hoje:'Vence Hoje', atrasado:'Atrasado', recebido:'Recebido' };
const CR_STATUS_CLS   = { a_vencer:'cr-badge-vencer', vence_hoje:'cr-badge-hoje', atrasado:'cr-badge-atraso', recebido:'cr-badge-recebido' };

// ── ContasPagar mock data ──────────────────────────────────────────────────────
const CP_FORNECEDORES = [
  { codigo:  1, nome:'Distribuidora ABC Combustíveis', cnpj:'11.222.333/0001-44' },
  { codigo:  2, nome:'Raízen Combustíveis S.A.',        cnpj:'22.333.444/0001-55' },
  { codigo:  3, nome:'Ipiranga Produtos de Petróleo',   cnpj:'33.444.555/0001-66' },
  { codigo:  4, nome:'Shell Brasil LTDA',               cnpj:'44.555.666/0001-77' },
  { codigo:  5, nome:'Vibra Energia S.A.',              cnpj:'55.666.777/0001-88' },
  { codigo:  6, nome:'Ale Combustíveis S.A.',           cnpj:'66.777.888/0001-99' },
  { codigo:  7, nome:'Eletrobras Comercializadora',     cnpj:'77.888.999/0001-00' },
  { codigo:  8, nome:'Comgas Distribuidora',            cnpj:'88.999.000/0001-11' },
  { codigo:  9, nome:'White Martins Gases',             cnpj:'99.000.111/0001-22' },
  { codigo: 10, nome:'Lubricantes Brasil LTDA',         cnpj:'00.111.222/0001-33' },
  { codigo: 11, nome:'Petrobras Distribuidora',         cnpj:'11.222.333/0002-25' },
  { codigo: 12, nome:'Ultrapar Participações',          cnpj:'22.333.444/0002-36' },
  { codigo: 13, nome:'Copersucar S.A.',                 cnpj:'33.444.555/0002-47' },
  { codigo: 14, nome:'Supergasbras Energia',            cnpj:'44.555.666/0002-58' },
  { codigo: 15, nome:'Tegma Gestão Logística',          cnpj:'55.666.777/0002-69' },
];

function cpMockContas() {
  const ref = new Date(2026, 4, 27);
  const contas = [];
  const dist = [
    ...Array(18).fill('atrasado'),
    ...Array( 6).fill('vence_hoje'),
    ...Array(48).fill('a_vencer'),
    ...Array(48).fill('pago'),
  ];
  for (let i = 0; i < 120; i++) {
    const forn = CP_FORNECEDORES[i % CP_FORNECEDORES.length];
    const st   = dist[i % dist.length];
    const seed = (i * 11 + 7) % 100;

    let vencDays;
    if (st === 'atrasado')   vencDays = -(1 + (seed % 60));
    else if (st === 'vence_hoje') vencDays = 0;
    else if (st === 'a_vencer')   vencDays = 1 + (seed % 90);
    else                          vencDays = -(1 + (seed % 45));

    const venc = new Date(ref);
    venc.setDate(venc.getDate() + vencDays);
    const vencStr = venc.toISOString().split('T')[0];

    const valor    = 8000 + (seed * 1237 % 120000);
    const juros    = st === 'atrasado' ? Math.round(valor * 0.025 * (Math.abs(vencDays) / 30) * 100) / 100 : 0;
    const desconto = st === 'pago' && seed > 65 ? Math.round(valor * 0.02 * 100) / 100 : 0;

    contas.push({
      id:            2000 + i + 1,
      fornecedor:    forn.nome,
      cnpj:          forn.cnpj,
      documento:     `NF ${String(5000 + i + 1).padStart(6, '0')}`,
      vencimento:    vencStr,
      valor,
      juros,
      desconto,
      valorAPagar:   valor + juros - desconto,
      status:        st,
      diasAtraso:    st === 'atrasado' ? Math.abs(vencDays) : 0,
      dataPagamento: st === 'pago' ? vencStr : null,
    });
  }
  return contas.sort((a, b) => {
    const ord = { atrasado:0, vence_hoje:1, a_vencer:2, pago:3 };
    return (ord[a.status] - ord[b.status]) || a.vencimento.localeCompare(b.vencimento);
  });
}

const CP_ALL_MOCK = cpMockContas();

function cpMockResumo(contas) {
  const today = '2026-05-27';
  let totalAPagar = 0, aPagarHoje = 0, emAtraso = 0, pagosMes = 0;
  contas.forEach(c => {
    if (c.status !== 'pago') {
      totalAPagar += c.valorAPagar;
      if (c.status === 'vence_hoje') aPagarHoje += c.valorAPagar;
      if (c.status === 'atrasado')   emAtraso   += c.valorAPagar;
    } else {
      if (c.vencimento >= '2026-05-01' && c.vencimento <= today) pagosMes += c.valor;
    }
  });
  return {
    totalAPagar, aPagarHoje, emAtraso,
    pagosMes,
    pctAtraso: totalAPagar > 0 ? (emAtraso / totalAPagar) * 100 : 0,
  };
}

function cpMockAnaliticos(contas) {
  let aVencer = 0, venceHoje = 0, atrasado = 0, pago = 0;
  let f1 = 0, f2 = 0, f3 = 0, f4 = 0;
  const divPorForn = {};
  contas.forEach(c => {
    if (c.status === 'a_vencer')   aVencer   += c.valorAPagar;
    if (c.status === 'vence_hoje') venceHoje += c.valorAPagar;
    if (c.status === 'atrasado')   atrasado  += c.valorAPagar;
    if (c.status === 'pago')       pago      += c.valor;
    if (c.status === 'atrasado') {
      const d = c.diasAtraso;
      if (d <= 15)      f1 += c.valor;
      else if (d <= 30) f2 += c.valor;
      else if (d <= 60) f3 += c.valor;
      else              f4 += c.valor;
    }
    if (c.status !== 'pago') {
      divPorForn[c.fornecedor] = (divPorForn[c.fornecedor] || 0) + c.valorAPagar;
    }
  });
  const totalAberto = aVencer + venceHoje + atrasado;
  const top5 = Object.entries(divPorForn).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([fornecedor,divida])=>({fornecedor,divida}));
  const abertos = contas.filter(c => c.status !== 'pago');
  const ticketMedio = abertos.length ? abertos.reduce((s,c)=>s+c.valor,0)/abertos.length : 0;
  return {
    porStatus: { aVencer, venceHoje, atrasado, pago },
    faixaAtraso: { f1, f2, f3, f4, total: f1+f2+f3+f4 },
    top5,
    indices: {
      ticketMedio,
      prazoMedio: 28,
      pctAtraso: totalAberto > 0 ? (atrasado / totalAberto) * 100 : 0,
      pagoAntecip: 3.2,
    },
  };
}

const CP_STATUS_LABEL = { a_vencer:'A Vencer', vence_hoje:'Vence Hoje', atrasado:'Atrasado', pago:'Pago' };
const CP_STATUS_CLS   = { a_vencer:'cp-badge-vencer', vence_hoje:'cp-badge-hoje', atrasado:'cp-badge-atraso', pago:'cp-badge-pago' };

// ── Impressão de Boleto ───────────────────────────────────────────────────────
function imprimirBoleto(conta, tipo) {
  const isCR       = tipo === 'receber';
  const benefNome  = isCR ? 'STARVL COMBUSTÍVEIS LTDA'      : conta.fornecedor;
  const benefCNPJ  = isCR ? '00.000.000/0001-00'             : conta.cnpj;
  const sacadoNome = isCR ? conta.cliente                    : 'STARVL COMBUSTÍVEIS LTDA';
  const sacadoCNPJ = isCR ? conta.cnpj                       : '00.000.000/0001-00';
  const valor      = isCR ? (conta.valorAReceber||conta.valor): (conta.valorAPagar||conta.valor);
  const juros      = conta.juros   || 0;
  const desconto   = conta.desconto|| 0;
  const doc        = conta.documento || String(conta.id);
  const venc       = conta.vencimento || '';
  const fmtD       = (s) => s ? s.substring(8,10)+'/'+s.substring(5,7)+'/'+s.substring(0,4) : '-';
  const fmtV       = (n) => 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const today      = new Date().toISOString().split('T')[0];

  // Linha digitável simulada
  const vencCode   = venc.replace(/-/g,'');
  const valorPad   = Math.round(valor*100).toString().padStart(10,'0');
  const seq        = String(conta.id).padStart(5,'0');
  const linha      = `${seq}1.23456 78901.234567 89012.345678 9 ${vencCode.substring(0,8)}${valorPad}`;

  // Barras do código de barras (simuladas)
  const barSeed = conta.id * 17 + 3;
  let bars = '';
  const widths = [1,1,2,1,2,1,1,2,1,1,1,2,1,2,2,1,1,1,2,1,1,2,1,2,1,1,2,1,2,1,1,1,2,1,2,1,2,1,1,2,1,1,2,2,1,1,1,2,1,2,1,1,2,1,2,2,1,1,2,1,1,1,2,1,2,1,1,2,1,2];
  widths.forEach((w, i) => {
    const color = i % 2 === 0 ? '#000' : '#fff';
    bars += `<div style="display:inline-block;width:${w*2}px;height:60px;background:${color};"></div>`;
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Boleto — ${doc}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:#fff;padding:20px;}
  .page{max-width:800px;margin:0 auto;}
  /* ── Cabeçalho banco ── */
  .bank-header{display:flex;align-items:center;border-bottom:3px solid #111;padding-bottom:8px;margin-bottom:0;}
  .bank-logo{font-size:22px;font-weight:900;letter-spacing:-1px;color:#E31E24;margin-right:16px;padding-right:16px;border-right:3px solid #111;}
  .bank-code{font-size:18px;font-weight:900;margin-right:auto;}
  .linha-dig{font-size:13px;font-weight:700;letter-spacing:1px;text-align:right;}
  /* ── Canhoto ── */
  .canhoto{border:1px solid #777;border-top:none;padding:8px 10px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;background:#fafafa;}
  .canhoto-main{flex:1;}
  .canhoto-venc{min-width:120px;text-align:right;}
  .label{font-size:9px;color:#555;margin-bottom:2px;text-transform:uppercase;font-weight:700;}
  .value{font-size:12px;font-weight:700;}
  .value-lg{font-size:16px;font-weight:900;}
  .cut{border-top:1px dashed #aaa;text-align:center;color:#aaa;font-size:10px;padding:5px 0;margin:10px 0;}
  /* ── Corpo principal ── */
  .body-wrap{border:1px solid #777;border-top:none;}
  .row{display:flex;border-bottom:1px solid #ccc;}
  .row:last-child{border-bottom:none;}
  .cell{padding:5px 8px;border-right:1px solid #ccc;flex:1;}
  .cell:last-child{border-right:none;}
  .cell-fixed{padding:5px 8px;border-right:1px solid #ccc;}
  .cell-wide{flex:2;}
  /* ── Status badge ── */
  .status-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;
    background:${conta.status==='pago'||conta.status==='recebido'?'#dcfce7':'#fee2e2'};
    color:${conta.status==='pago'||conta.status==='recebido'?'#15803d':'#b91c1c'};}
  /* ── Barcode ── */
  .barcode-wrap{padding:16px 0 8px;text-align:center;}
  .barcode-bars{display:inline-flex;align-items:center;height:60px;}
  /* ── Instruções ── */
  .instrucoes{border:1px solid #ccc;border-top:none;padding:10px;font-size:10px;color:#444;line-height:1.6;}
  .instrucoes h4{font-size:10px;font-weight:700;margin-bottom:4px;text-transform:uppercase;}
  /* ── Rodapé ── */
  .footer{margin-top:16px;font-size:9px;color:#aaa;text-align:center;}
  @media print {
    body{padding:0;}
    .no-print{display:none!important;}
    .page{max-width:100%;}
  }
</style>
</head>
<body>
<div class="page">

  <!-- Botão imprimir -->
  <div class="no-print" style="text-align:right;margin-bottom:12px;">
    <button onclick="window.print()" style="background:#E31E24;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="background:#eee;color:#333;border:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;margin-left:8px;">Fechar</button>
  </div>

  <!-- ── CANHOTO ─────────────────────────────────────── -->
  <div class="bank-header">
    <div class="bank-logo">STARVL</div>
    <div class="bank-code">341-7</div>
  </div>

  <div class="canhoto">
    <div class="canhoto-main">
      <div class="label">Beneficiário</div>
      <div class="value">${benefNome}</div>
      <div style="color:#555;font-size:10px;">CNPJ: ${benefCNPJ}</div>
      <div style="margin-top:8px;">
        <div class="label">Sacado</div>
        <div class="value">${sacadoNome}</div>
        <div style="color:#555;font-size:10px;">CNPJ/CPF: ${sacadoCNPJ}</div>
      </div>
    </div>
    <div class="canhoto-venc">
      <div class="label">Vencimento</div>
      <div class="value-lg">${fmtD(venc)}</div>
      <div style="margin-top:10px;">
        <div class="label">Valor do Documento</div>
        <div class="value-lg" style="color:#c00;">${fmtV(valor)}</div>
      </div>
      <div style="margin-top:10px;">
        <span class="status-badge">${conta.status==='pago'?'PAGO':conta.status==='recebido'?'RECEBIDO':'EM ABERTO'}</span>
      </div>
    </div>
  </div>

  <div class="cut">✂ ─────────────────────── Recibo do Pagador ───────────────────────</div>

  <!-- ── CORPO PRINCIPAL ─────────────────────────────── -->
  <div class="bank-header">
    <div class="bank-logo">STARVL</div>
    <div class="bank-code">341-7</div>
  </div>

  <div class="body-wrap">
    <div class="row">
      <div class="cell cell-wide">
        <div class="label">Beneficiário</div>
        <div class="value">${benefNome} — CNPJ: ${benefCNPJ}</div>
      </div>
      <div class="cell-fixed" style="min-width:160px;">
        <div class="label">Agência / Código do Beneficiário</div>
        <div class="value">0001 / ${seq}</div>
      </div>
    </div>
    <div class="row">
      <div class="cell">
        <div class="label">Nosso Número</div>
        <div class="value">${seq}-${(conta.id%9)+1}</div>
      </div>
      <div class="cell">
        <div class="label">Número do Documento</div>
        <div class="value">${doc}</div>
      </div>
      <div class="cell">
        <div class="label">Espécie</div>
        <div class="value">R$</div>
      </div>
      <div class="cell">
        <div class="label">Aceite</div>
        <div class="value">N</div>
      </div>
      <div class="cell">
        <div class="label">Data Emissão</div>
        <div class="value">${fmtD(today)}</div>
      </div>
    </div>
    <div class="row">
      <div class="cell cell-wide">
        <div class="label">Instruções (Texto de Responsabilidade do Beneficiário)</div>
        <div style="font-size:10px;color:#444;line-height:1.5;margin-top:2px;">
          Não receber após o vencimento.<br>
          ${juros>0?`Cobrar juros de mora de ${fmtV(juros)} após o vencimento.<br>`:''}
          ${desconto>0?`Desconto de ${fmtV(desconto)} até a data do vencimento.<br>`:''}
          Em caso de dúvidas, contate o emitente.
        </div>
      </div>
      <div class="cell-fixed" style="min-width:160px;">
        <div class="label">Vencimento</div>
        <div class="value-lg">${fmtD(venc)}</div>
      </div>
    </div>
    <div class="row">
      <div class="cell cell-wide" style="flex:3;">
        <div class="label">(-) Desconto / Abatimentos</div>
        <div class="value">${fmtV(desconto)}</div>
      </div>
      <div class="cell-fixed" style="min-width:160px;">
        <div class="label">Valor do Documento</div>
        <div class="value-lg" style="color:#c00;">${fmtV(valor)}</div>
      </div>
    </div>
    <div class="row">
      <div class="cell" style="flex:2;">
        <div class="label">(+) Mora / Multa / Juros</div>
        <div class="value">${fmtV(juros)}</div>
      </div>
      <div class="cell" style="flex:2;">
        <div class="label">(=) Valor Cobrado</div>
        <div class="value-lg">${fmtV(valor+juros-desconto)}</div>
      </div>
    </div>
    <div class="row">
      <div class="cell" style="flex:1;">
        <div class="label">Sacado</div>
        <div class="value">${sacadoNome}</div>
        <div style="font-size:10px;color:#555;">CNPJ/CPF: ${sacadoCNPJ}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Documento gerado em ${fmtD(today)} às ${new Date().toLocaleTimeString('pt-BR')} — STARVL Sistema de Gestão
  </div>

</div>
<script>setTimeout(()=>window.print(),400);</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Permita popups para abrir o boleto.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

const ContasReceber = ({ clients, selectedClient }) => {
  const [resumo,      setResumo]     = useState(null);
  const [contas,      setContas]     = useState([]);
  const [pagination,  setPagination] = useState({ page:1, totalPages:1, total:0, limit:10 });
  const [analiticos,  setAnaliticos] = useState(null);
  const [search,      setSearch]     = useState('');
  const [statusFiltro,setStatusFiltro] = useState('todos');
  const [dataInicio,  setDataInicio] = useState('');
  const [dataFim,     setDataFim]    = useState('');
  const [page,        setPage]       = useState(1);
  const [loading,     setLoading]    = useState(false);
  const [usingMock,   setUsingMock]  = useState(false);
  const [viewConta,   setViewConta]  = useState(null);
  const [regModal,    setRegModal]   = useState(null);
  const [regDate,     setRegDate]    = useState('');
  const [regValor,    setRegValor]   = useState('');

  const empresa = useMemo(() => {
    const c = (clients||[]).find(cl=>cl.nome===selectedClient)||(clients||[])[0];
    return c?.codigoEmpresa||null;
  }, [clients, selectedClient]);

  const handleExportRow = (c) => imprimirBoleto(c, 'receber');

  const openRegModal = (c) => {
    if (c.status === 'recebido') { toast('Esta conta já foi recebida.', 'info'); return; }
    setRegDate(new Date().toISOString().split('T')[0]);
    setRegValor(String((c.valorAReceber || c.valor).toFixed(2)));
    setRegModal(c);
  };

  const handleRegistrarRecebimento = () => {
    if (!regDate) { toast('Informe a data de recebimento.', 'error'); return; }
    setContas(prev => prev.map(c =>
      c.id === regModal.id
        ? { ...c, status: 'recebido', dataRecebimento: regDate, diasAtraso: 0 }
        : c
    ));
    toast(`✅ Recebimento de ${fmtBRL(parseFloat(regValor) || regModal.valorAReceber)} registrado com sucesso!`, 'success');
    setRegModal(null);
  };

  // Busca resumo + analíticos
  useEffect(() => {
    if (!empresa) {
      const mock = CR_ALL_MOCK;
      setResumo(crMockResumo(mock));
      setAnaliticos(crMockAnaliticos(mock));
      setUsingMock(true);
      return;
    }
    Promise.all([
      fetch(`${API_URL}/api/receber/resumo?empresa=${empresa}`).then(r=>r.json()),
      fetch(`${API_URL}/api/receber/analiticos?empresa=${empresa}`).then(r=>r.json()),
    ]).then(([res, ana]) => {
      if (res.error) throw new Error(res.error);
      setResumo(res);
      setAnaliticos(ana);
      setUsingMock(false);
    }).catch(() => {
      const mock = CR_ALL_MOCK;
      setResumo(crMockResumo(mock));
      setAnaliticos(crMockAnaliticos(mock));
      setUsingMock(true);
    });
  }, [empresa]);

  // Busca tabela paginada
  useEffect(() => {
    if (usingMock || !empresa) {
      // Filtro local no mock
      let filtered = CR_ALL_MOCK;
      if (search)       filtered = filtered.filter(c => c.cliente.toLowerCase().includes(search.toLowerCase()) || c.documento.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search));
      if (statusFiltro !== 'todos') filtered = filtered.filter(c => c.status === statusFiltro);
      if (dataInicio)   filtered = filtered.filter(c => c.vencimento >= dataInicio);
      if (dataFim)      filtered = filtered.filter(c => c.vencimento <= dataFim);
      const limit = 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const slice = filtered.slice((page-1)*limit, page*limit);
      setContas(slice);
      setPagination({ page, totalPages, total, limit });
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({ empresa, page, limit:10, search, status:statusFiltro, ...(dataInicio&&{dataInicio}), ...(dataFim&&{dataFim}) });
    fetch(`${API_URL}/api/receber/contas?${qs}`)
      .then(r=>r.json())
      .then(data => { setContas(data.data||[]); setPagination(data.pagination||{page,totalPages:1,total:0,limit:10}); })
      .catch(() => setUsingMock(true))
      .finally(() => setLoading(false));
  }, [empresa, usingMock, page, search, statusFiltro, dataInicio, dataFim]);

  const fmtPct = v => `${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;

  const totaisTabela = useMemo(() => {
    const t = { valor:0, juros:0, desconto:0, valorAReceber:0 };
    contas.forEach(c => { t.valor+=c.valor; t.juros+=c.juros; t.desconto+=c.desconto; t.valorAReceber+=c.valorAReceber; });
    return t;
  }, [contas]);

  // Paginação renderizada
  const renderPagination = () => {
    const { page:pg, totalPages:tp, total } = pagination;
    const pages = [];
    if (tp <= 7) { for(let i=1;i<=tp;i++) pages.push(i); }
    else {
      pages.push(1);
      if (pg > 3) pages.push('...');
      for(let i=Math.max(2,pg-1); i<=Math.min(tp-1,pg+1); i++) pages.push(i);
      if (pg < tp - 2) pages.push('...');
      pages.push(tp);
    }
    return (
      <div className="cr-pagination">
        <span className="cr-pag-info">Mostrando {(pg-1)*pagination.limit+1} a {Math.min(pg*pagination.limit,total)} de {total} contas</span>
        <div className="cr-pag-btns">
          <button className="cr-pag-btn" disabled={pg<=1} onClick={()=>setPage(1)}>«</button>
          <button className="cr-pag-btn" disabled={pg<=1} onClick={()=>setPage(pg-1)}><ChevronLeft size={14}/></button>
          {pages.map((p,i) => p==='...'
            ? <span key={`e${i}`} className="cr-pag-ellipsis">...</span>
            : <button key={p} className={`cr-pag-btn${pg===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
          )}
          <button className="cr-pag-btn" disabled={pg>=tp} onClick={()=>setPage(pg+1)}><ChevronRight size={14}/></button>
          <button className="cr-pag-btn" disabled={pg>=tp} onClick={()=>setPage(tp)}>»</button>
        </div>
      </div>
    );
  };

  // Dados do gráfico pizza
  const pizzaData = analiticos ? [
    { name:'A Vencer',   value: analiticos.porStatus.aVencer,   color:'#3b82f6' },
    { name:'Vence Hoje', value: analiticos.porStatus.venceHoje, color:'#f59e0b' },
    { name:'Atrasado',   value: analiticos.porStatus.atrasado,  color:'#ef4444' },
    { name:'Recebido',   value: analiticos.porStatus.recebido,  color:'#22c55e' },
  ].filter(d=>d.value>0) : [];
  const pizzaTotal = pizzaData.reduce((s,d)=>s+d.value,0);

  const handleExport = () => {
    const rows = contas.map(c => ({
      Cliente: c.cliente, CNPJ: c.cnpj, Documento: c.documento,
      Vencimento: fmtDate(c.vencimento), 'Dias Atraso': c.diasAtraso,
      Valor: c.valor, Juros: c.juros, Desconto: c.desconto,
      'Valor a Receber': c.valorAReceber, Status: CR_STATUS_LABEL[c.status],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');
    XLSX.writeFile(wb, 'contas-a-receber.xlsx');
  };

  return (
    <div className="cr-page">
      {/* ── Topo ─────────────────────────────────────────────────────────── */}
      <div className="cr-header">
        <div className="cr-header-title">
          <CreditCard size={28} color="#E31E24" />
          <h2>GERENCIAMENTO DE CONTAS A RECEBER</h2>
          {usingMock && <span className="cr-demo-badge">demonstração</span>}
        </div>
        <div className="cr-header-actions">
          <button className="cr-btn-export" onClick={handleExport}>
            <Download size={15}/> Exportar Excel
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="cr-kpi-row">
        {[
          { label:'Total a Receber',   value: fmtBRL(resumo?.totalAReceber),  icon: DollarSign,    color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
          { label:'A Receber Hoje',    value: fmtBRL(resumo?.aReceberHoje),   icon: Calendar,      color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
          { label:'Em Atraso',         value: fmtBRL(resumo?.emAtraso),       icon: AlertTriangle, color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
          { label:'Recebidos (mês)',   value: fmtBRL(resumo?.recebidosMes),   icon: TrendingUp,    color:'#3b82f6', bg:'rgba(59,130,246,0.12)' },
          { label:'Inadimplência',     value: fmtPct(resumo?.inadimplencia),  icon: BarChart2,     color:'#a855f7', bg:'rgba(168,85,247,0.12)', pct: true },
        ].map(kpi => (
          <div key={kpi.label} className="cr-kpi">
            <div className="cr-kpi-icon" style={{ background: kpi.bg }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div className="cr-kpi-body">
              <span className="cr-kpi-label">{kpi.label}</span>
              <span className="cr-kpi-value" style={{ color: kpi.color }}>{resumo ? kpi.value : '...'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="cr-filters">
        <div className="cr-search-wrap">
          <Search size={15} className="cr-search-icon"/>
          <input className="cr-search" placeholder="Buscar cliente, descrição, nº documento..."
            value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="cr-select" value={statusFiltro} onChange={e=>{ setStatusFiltro(e.target.value); setPage(1); }}>
          <option value="todos">Todos os Status</option>
          <option value="a_vencer">A Vencer</option>
          <option value="vence_hoje">Vence Hoje</option>
          <option value="atrasado">Atrasado</option>
          <option value="recebido">Recebido</option>
        </select>
        <div className="cr-date-range">
          <span className="cr-date-label">Vencimento de</span>
          <input type="date" className="cr-date-input" value={dataInicio} onChange={e=>{ setDataInicio(e.target.value); setPage(1); }} />
          <span className="cr-date-label">até</span>
          <input type="date" className="cr-date-input" value={dataFim}    onChange={e=>{ setDataFim(e.target.value);    setPage(1); }} />
          {(dataInicio||dataFim) && <button className="cr-clear-btn" onClick={()=>{ setDataInicio(''); setDataFim(''); setPage(1); }}><X size={13}/></button>}
        </div>
      </div>

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <div className="cr-table-wrap">
        {loading && <div className="cr-loading">Carregando...</div>}
        <table className="cr-table">
          <thead>
            <tr>
              <th>CLIENTE</th>
              <th>CNPJ</th>
              <th>TOTAL POR CLIENTE</th>
              <th>VENCIMENTO</th>
              <th>DIAS DE ATRASO</th>
              <th>VALOR CONSUMIDO</th>
              <th>JUROS</th>
              <th>DESCONTOS</th>
              <th>VALOR A RECEBER</th>
              <th>STATUS</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {contas.map(c => (
              <tr key={c.id} className="cr-row">
                <td>
                  <div className="cr-cli-cell">
                    <span className="cr-cli-nome">{c.cliente}</span>
                    <span className="cr-cli-doc">{c.documento}</span>
                  </div>
                </td>
                <td className="cr-mono">{c.cnpj}</td>
                <td className="cr-mono cr-right">{fmtBRL(c.valor)}</td>
                <td className="cr-mono">{fmtDate(c.vencimento)}</td>
                <td className={`cr-mono cr-right ${c.diasAtraso > 0 ? 'cr-red' : c.diasAtraso === 0 && c.status !== 'recebido' ? 'cr-amber' : ''}`}>
                  {c.status === 'recebido' ? '-' : c.diasAtraso > 0 ? c.diasAtraso : c.status === 'vence_hoje' ? '0' : `-${Math.ceil((new Date(c.vencimento)-new Date('2026-05-26'))/(86400000))}`}
                </td>
                <td className="cr-mono cr-right">{fmtBRL(c.valor)}</td>
                <td className="cr-mono cr-right cr-green">{fmtBRL(c.juros)}</td>
                <td className="cr-mono cr-right cr-amber">{fmtBRL(c.desconto)}</td>
                <td className="cr-mono cr-right cr-bold">{fmtBRL(c.valorAReceber)}</td>
                <td><span className={`cr-badge ${CR_STATUS_CLS[c.status]}`}>{CR_STATUS_LABEL[c.status]}</span></td>
                <td>
                  <div className="cr-actions">
                    <button className="cr-action-btn" title="Visualizar" onClick={()=>setViewConta(c)}><Eye size={15}/></button>
                    <button className="cr-action-btn" title="Exportar linha" onClick={()=>handleExportRow(c)}><FileText size={15}/></button>
                    <button className="cr-action-btn cr-action-down" title="Registrar Recebimento" onClick={()=>openRegModal(c)} disabled={c.status==='recebido'}><Download size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {contas.length > 0 && (
            <tfoot>
              <tr className="cr-totals">
                <td colSpan={2}><strong>TOTAIS</strong></td>
                <td className="cr-mono cr-right"><strong>{fmtBRL(totaisTabela.valor)}</strong></td>
                <td>-</td>
                <td>-</td>
                <td className="cr-mono cr-right"><strong>{fmtBRL(totaisTabela.valor)}</strong></td>
                <td className="cr-mono cr-right cr-green"><strong>{fmtBRL(totaisTabela.juros)}</strong></td>
                <td className="cr-mono cr-right cr-amber"><strong>{fmtBRL(totaisTabela.desconto)}</strong></td>
                <td className="cr-mono cr-right cr-bold"><strong>{fmtBRL(totaisTabela.valorAReceber)}</strong></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
        {contas.length === 0 && !loading && (
          <div className="cr-empty">Nenhuma conta encontrada para os filtros aplicados.</div>
        )}
      </div>

      {renderPagination()}

      {/* ── Painéis Analíticos ─────────────────────────────────────────── */}
      {analiticos && (
        <div className="cr-analytics">

          {/* Pizza por status */}
          <div className="cr-panel">
            <h4 className="cr-panel-title">RESUMO POR STATUS</h4>
            <div className="cr-pizza-wrap">
              <div className="cr-pizza-chart">
                {pizzaData.map((seg, i, arr) => {
                  const filled = arr.slice(0, i).reduce((s, d) => s + d.value, 0);
                  const pct    = pizzaTotal > 0 ? (filled / pizzaTotal) * 100 : 0;
                  return null; // SVG handled via CSS conic-gradient
                })}
                <div className="cr-donut" style={{
                  background: pizzaTotal > 0
                    ? `conic-gradient(${pizzaData.map((seg, i) => {
                        const prev = pizzaData.slice(0, i).reduce((s, d) => s + d.value, 0) / pizzaTotal * 360;
                        const cur  = seg.value / pizzaTotal * 360;
                        return `${seg.color} ${prev.toFixed(1)}deg ${(prev+cur).toFixed(1)}deg`;
                      }).join(', ')})`
                    : '#334155',
                }}><span className="cr-donut-center">{fmtPct(resumo?.inadimplencia)}<small>Inadimp.</small></span></div>
              </div>
              <div className="cr-pizza-legend">
                {[
                  { label:'A Vencer',   v: analiticos.porStatus.aVencer,   color:'#3b82f6' },
                  { label:'Vence Hoje', v: analiticos.porStatus.venceHoje, color:'#f59e0b' },
                  { label:'Atrasado',   v: analiticos.porStatus.atrasado,  color:'#ef4444' },
                  { label:'Recebido',   v: analiticos.porStatus.recebido,  color:'#22c55e' },
                ].map(l => (
                  <div key={l.label} className="cr-legend-item">
                    <span className="cr-legend-dot" style={{background:l.color}}></span>
                    <span className="cr-legend-label">{l.label}</span>
                    <span className="cr-legend-val">{fmtBRL(l.v)}</span>
                    <span className="cr-legend-pct">{pizzaTotal>0?fmtPct(l.v/pizzaTotal*100):'0,00%'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Faixa de atraso */}
          <div className="cr-panel">
            <h4 className="cr-panel-title">FAIXA DE ATRASO</h4>
            {[
              { label:'1 a 15 dias',  v: analiticos.faixaAtraso.f1 },
              { label:'16 a 30 dias', v: analiticos.faixaAtraso.f2 },
              { label:'31 a 60 dias', v: analiticos.faixaAtraso.f3 },
              { label:'+ 60 dias',    v: analiticos.faixaAtraso.f4 },
            ].map(f => {
              const tot = analiticos.faixaAtraso.total;
              const pct = tot > 0 ? f.v / tot * 100 : 0;
              return (
                <div key={f.label} className="cr-faixa-row">
                  <span className="cr-faixa-label">{f.label}</span>
                  <div className="cr-faixa-bar-wrap">
                    <div className="cr-faixa-bar" style={{width:`${Math.min(pct,100).toFixed(1)}%`}}></div>
                  </div>
                  <span className="cr-faixa-val">{fmtBRL(f.v)}</span>
                  <span className="cr-faixa-pct">{fmtPct(pct)}</span>
                </div>
              );
            })}
          </div>

          {/* Top 5 clientes */}
          <div className="cr-panel">
            <h4 className="cr-panel-title">TOP 5 CLIENTES (MAIOR DÍVIDA)</h4>
            {analiticos.top5.map((t, i) => (
              <div key={t.cliente} className="cr-top-row">
                <span className="cr-top-rank">{i+1}.</span>
                <span className="cr-top-nome">{t.cliente}</span>
                <span className="cr-top-val">{fmtBRL(t.divida)}</span>
              </div>
            ))}
          </div>

          {/* Índices financeiros */}
          <div className="cr-panel">
            <h4 className="cr-panel-title">ÍNDICES FINANCEIROS</h4>
            {[
              { label:'Ticket Médio',           value: fmtBRL(analiticos.indices.ticketMedio) },
              { label:'Prazo Médio (dias)',      value: analiticos.indices.prazoMedio },
              { label:'Índice de Inadimplência', value: fmtPct(analiticos.indices.inadimplencia), red: true },
              { label:'Recebimento Antecipado',  value: fmtPct(analiticos.indices.recebimentoAntecip) },
            ].map(idx => (
              <div key={idx.label} className="cr-idx-row">
                <span className="cr-idx-label">{idx.label}</span>
                <span className={`cr-idx-val ${idx.red ? 'cr-red' : ''}`}>{idx.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de Visualização ─────────────────────────────────────────── */}
      {viewConta && (
        <div className="cr-modal-overlay" onClick={()=>setViewConta(null)}>
          <div className="cr-modal" onClick={e=>e.stopPropagation()}>
            <div className="cr-modal-header">
              <h3>Detalhes da Conta</h3>
              <button className="cr-modal-close" onClick={()=>setViewConta(null)}><X size={18}/></button>
            </div>
            <div className="cr-modal-body">
              {[
                ['Cliente',         viewConta.cliente],
                ['CNPJ',            viewConta.cnpj],
                ['Documento',       viewConta.documento],
                ['Vencimento',      fmtDate(viewConta.vencimento)],
                ['Status',          CR_STATUS_LABEL[viewConta.status]],
                ['Dias de Atraso',  viewConta.diasAtraso > 0 ? `${viewConta.diasAtraso} dias` : '-'],
                ['Valor',           fmtBRL(viewConta.valor)],
                ['Juros',           fmtBRL(viewConta.juros)],
                ['Desconto',        fmtBRL(viewConta.desconto)],
                ['Valor a Receber', fmtBRL(viewConta.valorAReceber)],
                ...(viewConta.dataRecebimento ? [['Data Recebimento', fmtDate(viewConta.dataRecebimento)]] : []),
              ].map(([k,v]) => (
                <div key={k} className="cr-modal-row">
                  <span className="cr-modal-key">{k}</span>
                  <span className="cr-modal-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Registrar Recebimento ───────────────────────────────────── */}
      {regModal && (
        <div className="cr-modal-overlay" onClick={()=>setRegModal(null)}>
          <div className="cr-modal" style={{ maxWidth: 400 }} onClick={e=>e.stopPropagation()}>
            <div className="cr-modal-header">
              <h3>Registrar Recebimento</h3>
              <button className="cr-modal-close" onClick={()=>setRegModal(null)}><X size={18}/></button>
            </div>
            <div className="cr-modal-body">
              <div className="cr-modal-row">
                <span className="cr-modal-key">Cliente</span>
                <span className="cr-modal-val">{regModal.cliente}</span>
              </div>
              <div className="cr-modal-row">
                <span className="cr-modal-key">Documento</span>
                <span className="cr-modal-val">{regModal.documento}</span>
              </div>
              <div className="cr-modal-row">
                <span className="cr-modal-key">Valor a Receber</span>
                <span className="cr-modal-val" style={{color:'#22c55e'}}>{fmtBRL(regModal.valorAReceber)}</span>
              </div>
              <div className="cr-modal-row" style={{flexDirection:'column',gap:6,alignItems:'flex-start'}}>
                <span className="cr-modal-key">Data do Recebimento</span>
                <input type="date" className="cr-date-input" style={{width:'100%',boxSizing:'border-box'}}
                  value={regDate} onChange={e=>setRegDate(e.target.value)} />
              </div>
              <div className="cr-modal-row" style={{flexDirection:'column',gap:6,alignItems:'flex-start'}}>
                <span className="cr-modal-key">Valor Recebido (R$)</span>
                <input type="number" className="cr-date-input" style={{width:'100%',boxSizing:'border-box'}}
                  step="0.01" value={regValor} onChange={e=>setRegValor(e.target.value)} />
              </div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="cr-btn-export" style={{flex:1,justifyContent:'center'}} onClick={()=>setRegModal(null)}>Cancelar</button>
                <button onClick={handleRegistrarRecebimento}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 16px',background:'#22c55e',border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                  <Download size={15}/> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ── fim ContasReceber ─────────────────────────────────────────────────────────

// ── ContasPagar ───────────────────────────────────────────────────────────────
const ContasPagar = ({ clients, selectedClient }) => {
  const [resumo,       setResumo]      = useState(null);
  const [contas,       setContas]      = useState([]);
  const [pagination,   setPagination]  = useState({ page:1, totalPages:1, total:0, limit:10 });
  const [analiticos,   setAnaliticos]  = useState(null);
  const [search,       setSearch]      = useState('');
  const [statusFiltro, setStatusFiltro]= useState('todos');
  const [dataInicio,   setDataInicio]  = useState('');
  const [dataFim,      setDataFim]     = useState('');
  const [page,         setPage]        = useState(1);
  const [loading,      setLoading]     = useState(false);
  const [usingMock,    setUsingMock]   = useState(false);
  const [viewConta,    setViewConta]   = useState(null);
  const [regModal,     setRegModal]    = useState(null);
  const [regDate,      setRegDate]     = useState('');
  const [regValor,     setRegValor]    = useState('');

  const empresa = useMemo(() => {
    const c = (clients||[]).find(cl=>cl.nome===selectedClient)||(clients||[])[0];
    return c?.codigoEmpresa||null;
  }, [clients, selectedClient]);

  const handleExportRow = (c) => imprimirBoleto(c, 'pagar');

  const openRegModal = (c) => {
    if (c.status === 'pago') { toast('Esta conta já foi paga.', 'info'); return; }
    setRegDate(new Date().toISOString().split('T')[0]);
    setRegValor(String((c.valorAPagar || c.valor).toFixed(2)));
    setRegModal(c);
  };

  const handleRegistrarPagamento = () => {
    if (!regDate) { toast('Informe a data de pagamento.', 'error'); return; }
    setContas(prev => prev.map(c =>
      c.id === regModal.id
        ? { ...c, status: 'pago', dataPagamento: regDate, diasAtraso: 0 }
        : c
    ));
    toast(`✅ Pagamento de ${fmtBRL(parseFloat(regValor) || regModal.valorAPagar)} registrado com sucesso!`, 'success');
    setRegModal(null);
  };

  // Busca resumo + analíticos
  useEffect(() => {
    if (!empresa) {
      const mock = CP_ALL_MOCK;
      setResumo(cpMockResumo(mock));
      setAnaliticos(cpMockAnaliticos(mock));
      setUsingMock(true);
      return;
    }
    Promise.all([
      fetch(`${API_URL}/api/pagar/resumo?empresa=${empresa}`).then(r=>r.json()),
      fetch(`${API_URL}/api/pagar/analiticos?empresa=${empresa}`).then(r=>r.json()),
    ]).then(([res, ana]) => {
      if (res.error) throw new Error(res.error);
      setResumo(res);
      setAnaliticos(ana);
      setUsingMock(false);
    }).catch(() => {
      const mock = CP_ALL_MOCK;
      setResumo(cpMockResumo(mock));
      setAnaliticos(cpMockAnaliticos(mock));
      setUsingMock(true);
    });
  }, [empresa]);

  // Busca tabela paginada
  useEffect(() => {
    if (usingMock || !empresa) {
      let filtered = CP_ALL_MOCK;
      if (search)       filtered = filtered.filter(c => c.fornecedor.toLowerCase().includes(search.toLowerCase()) || c.documento.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search));
      if (statusFiltro !== 'todos') filtered = filtered.filter(c => c.status === statusFiltro);
      if (dataInicio)   filtered = filtered.filter(c => c.vencimento >= dataInicio);
      if (dataFim)      filtered = filtered.filter(c => c.vencimento <= dataFim);
      const limit = 10;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const slice = filtered.slice((page-1)*limit, page*limit);
      setContas(slice);
      setPagination({ page, totalPages, total, limit });
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({ empresa, page, limit:10, search, status:statusFiltro, ...(dataInicio&&{dataInicio}), ...(dataFim&&{dataFim}) });
    fetch(`${API_URL}/api/pagar/contas?${qs}`)
      .then(r=>r.json())
      .then(data => { setContas(data.data||[]); setPagination(data.pagination||{page,totalPages:1,total:0,limit:10}); })
      .catch(() => setUsingMock(true))
      .finally(() => setLoading(false));
  }, [empresa, usingMock, page, search, statusFiltro, dataInicio, dataFim]);

  const fmtPct = v => `${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;

  const totaisTabela = useMemo(() => {
    const t = { valor:0, juros:0, desconto:0, valorAPagar:0 };
    contas.forEach(c => { t.valor+=c.valor; t.juros+=c.juros; t.desconto+=c.desconto; t.valorAPagar+=c.valorAPagar; });
    return t;
  }, [contas]);

  const renderPagination = () => {
    const { page:pg, totalPages:tp, total } = pagination;
    const pages = [];
    if (tp <= 7) { for(let i=1;i<=tp;i++) pages.push(i); }
    else {
      pages.push(1);
      if (pg > 3) pages.push('...');
      for(let i=Math.max(2,pg-1); i<=Math.min(tp-1,pg+1); i++) pages.push(i);
      if (pg < tp - 2) pages.push('...');
      pages.push(tp);
    }
    return (
      <div className="cp-pagination">
        <span className="cp-pag-info">Mostrando {(pg-1)*pagination.limit+1} a {Math.min(pg*pagination.limit,total)} de {total} contas</span>
        <div className="cp-pag-btns">
          <button className="cp-pag-btn" disabled={pg<=1} onClick={()=>setPage(1)}>«</button>
          <button className="cp-pag-btn" disabled={pg<=1} onClick={()=>setPage(pg-1)}><ChevronLeft size={14}/></button>
          {pages.map((p,i) => p==='...'
            ? <span key={`e${i}`} className="cp-pag-ellipsis">...</span>
            : <button key={p} className={`cp-pag-btn${pg===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
          )}
          <button className="cp-pag-btn" disabled={pg>=tp} onClick={()=>setPage(pg+1)}><ChevronRight size={14}/></button>
          <button className="cp-pag-btn" disabled={pg>=tp} onClick={()=>setPage(tp)}>»</button>
        </div>
      </div>
    );
  };

  // Gráfico pizza por status
  const pizzaData = analiticos ? [
    { name:'A Vencer',   value: analiticos.porStatus.aVencer,   color:'#3b82f6' },
    { name:'Vence Hoje', value: analiticos.porStatus.venceHoje, color:'#f59e0b' },
    { name:'Atrasado',   value: analiticos.porStatus.atrasado,  color:'#ef4444' },
    { name:'Pago',       value: analiticos.porStatus.pago,      color:'#22c55e' },
  ].filter(d=>d.value>0) : [];
  const pizzaTotal = pizzaData.reduce((s,d)=>s+d.value,0);

  const handleExport = () => {
    const rows = contas.map(c => ({
      Fornecedor: c.fornecedor, CNPJ: c.cnpj, Documento: c.documento,
      Vencimento: fmtDate(c.vencimento), 'Dias Atraso': c.diasAtraso,
      Valor: c.valor, Juros: c.juros, Desconto: c.desconto,
      'Valor a Pagar': c.valorAPagar, Status: CP_STATUS_LABEL[c.status],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Pagar');
    XLSX.writeFile(wb, 'contas-a-pagar.xlsx');
  };

  return (
    <div className="cp-page">
      {/* ── Topo ─────────────────────────────────────────────────────────── */}
      <div className="cp-header">
        <div className="cp-header-title">
          <Wallet size={28} color="#E31E24" />
          <h2>GERENCIAMENTO DE CONTAS A PAGAR</h2>
          {usingMock && <span className="cp-demo-badge">demonstração</span>}
        </div>
        <div className="cp-header-actions">
          <button className="cp-btn-export" onClick={handleExport}>
            <Download size={15}/> Exportar Excel
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="cp-kpi-row">
        {[
          { label:'Total a Pagar',   value: fmtBRL(resumo?.totalAPagar),  icon: DollarSign,    color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
          { label:'Vence Hoje',      value: fmtBRL(resumo?.aPagarHoje),   icon: Calendar,      color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
          { label:'Em Atraso',       value: fmtBRL(resumo?.emAtraso),     icon: AlertTriangle, color:'#e11d48', bg:'rgba(225,29,72,0.12)' },
          { label:'Pagos (mês)',     value: fmtBRL(resumo?.pagosMes),     icon: TrendingUp,    color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
          { label:'% em Atraso',     value: fmtPct(resumo?.pctAtraso),    icon: BarChart2,     color:'#a855f7', bg:'rgba(168,85,247,0.12)', pct: true },
        ].map(kpi => (
          <div key={kpi.label} className="cp-kpi">
            <div className="cp-kpi-icon" style={{ background: kpi.bg }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div className="cp-kpi-body">
              <span className="cp-kpi-label">{kpi.label}</span>
              <span className="cp-kpi-value" style={{ color: kpi.color }}>{resumo ? kpi.value : '...'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="cp-filters">
        <div className="cp-search-wrap">
          <Search size={15} className="cp-search-icon"/>
          <input className="cp-search" placeholder="Buscar fornecedor, NF, CNPJ..."
            value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="cp-select" value={statusFiltro} onChange={e=>{ setStatusFiltro(e.target.value); setPage(1); }}>
          <option value="todos">Todos os Status</option>
          <option value="a_vencer">A Vencer</option>
          <option value="vence_hoje">Vence Hoje</option>
          <option value="atrasado">Atrasado</option>
          <option value="pago">Pago</option>
        </select>
        <div className="cp-date-range">
          <span className="cp-date-label">Vencimento de</span>
          <input type="date" className="cp-date-input" value={dataInicio} onChange={e=>{ setDataInicio(e.target.value); setPage(1); }} />
          <span className="cp-date-label">até</span>
          <input type="date" className="cp-date-input" value={dataFim}    onChange={e=>{ setDataFim(e.target.value);    setPage(1); }} />
          {(dataInicio||dataFim) && <button className="cp-clear-btn" onClick={()=>{ setDataInicio(''); setDataFim(''); setPage(1); }}><X size={13}/></button>}
        </div>
      </div>

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <div className="cp-table-wrap">
        {loading && <div className="cp-loading">Carregando...</div>}
        <table className="cp-table">
          <thead>
            <tr>
              <th>FORNECEDOR</th>
              <th>CNPJ</th>
              <th>DOCUMENTO</th>
              <th>VENCIMENTO</th>
              <th>DIAS ATRASO</th>
              <th>VALOR</th>
              <th>JUROS</th>
              <th>DESCONTO</th>
              <th>VALOR A PAGAR</th>
              <th>STATUS</th>
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {contas.map(c => (
              <tr key={c.id} className="cp-row">
                <td>
                  <div className="cp-forn-cell">
                    <span className="cp-forn-nome">{c.fornecedor}</span>
                    <span className="cp-forn-doc">{c.documento}</span>
                  </div>
                </td>
                <td className="cp-mono">{c.cnpj}</td>
                <td className="cp-mono">{c.documento}</td>
                <td className="cp-mono">{fmtDate(c.vencimento)}</td>
                <td className={`cp-mono cp-right ${c.diasAtraso > 0 ? 'cp-red' : c.status === 'vence_hoje' ? 'cp-amber' : ''}`}>
                  {c.status === 'pago' ? '-' : c.diasAtraso > 0 ? c.diasAtraso : c.status === 'vence_hoje' ? '0' : `-${Math.ceil((new Date(c.vencimento)-new Date('2026-05-27'))/(86400000))}`}
                </td>
                <td className="cp-mono cp-right">{fmtBRL(c.valor)}</td>
                <td className="cp-mono cp-right cp-red">{fmtBRL(c.juros)}</td>
                <td className="cp-mono cp-right cp-green">{fmtBRL(c.desconto)}</td>
                <td className="cp-mono cp-right cp-bold">{fmtBRL(c.valorAPagar)}</td>
                <td><span className={`cp-badge ${CP_STATUS_CLS[c.status]}`}>{CP_STATUS_LABEL[c.status]}</span></td>
                <td>
                  <div className="cp-actions">
                    <button className="cp-action-btn" title="Visualizar" onClick={()=>setViewConta(c)}><Eye size={15}/></button>
                    <button className="cp-action-btn" title="Exportar linha" onClick={()=>handleExportRow(c)}><FileText size={15}/></button>
                    <button className="cp-action-btn cp-action-pay" title="Registrar Pagamento" onClick={()=>openRegModal(c)} disabled={c.status==='pago'}><Save size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {contas.length > 0 && (
            <tfoot>
              <tr className="cp-totals">
                <td colSpan={2}><strong>TOTAIS</strong></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td className="cp-mono cp-right"><strong>{fmtBRL(totaisTabela.valor)}</strong></td>
                <td className="cp-mono cp-right cp-red"><strong>{fmtBRL(totaisTabela.juros)}</strong></td>
                <td className="cp-mono cp-right cp-green"><strong>{fmtBRL(totaisTabela.desconto)}</strong></td>
                <td className="cp-mono cp-right cp-bold"><strong>{fmtBRL(totaisTabela.valorAPagar)}</strong></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
        {contas.length === 0 && !loading && (
          <div className="cp-empty">Nenhuma conta encontrada para os filtros aplicados.</div>
        )}
      </div>

      {renderPagination()}

      {/* ── Painéis Analíticos ─────────────────────────────────────────── */}
      {analiticos && (
        <div className="cp-analytics">

          {/* Pizza por status */}
          <div className="cp-panel">
            <h4 className="cp-panel-title">RESUMO POR STATUS</h4>
            <div className="cp-pizza-wrap">
              <div className="cp-pizza-chart">
                <div className="cp-donut" style={{
                  background: pizzaTotal > 0
                    ? `conic-gradient(${pizzaData.map((seg, i) => {
                        const prev = pizzaData.slice(0, i).reduce((s, d) => s + d.value, 0) / pizzaTotal * 360;
                        const cur  = seg.value / pizzaTotal * 360;
                        return `${seg.color} ${prev.toFixed(1)}deg ${(prev+cur).toFixed(1)}deg`;
                      }).join(', ')})`
                    : '#334155',
                }}><span className="cp-donut-center">{fmtPct(resumo?.pctAtraso)}<small>% Atraso</small></span></div>
              </div>
              <div className="cp-pizza-legend">
                {[
                  { label:'A Vencer',   v: analiticos.porStatus.aVencer,   color:'#3b82f6' },
                  { label:'Vence Hoje', v: analiticos.porStatus.venceHoje, color:'#f59e0b' },
                  { label:'Atrasado',   v: analiticos.porStatus.atrasado,  color:'#ef4444' },
                  { label:'Pago',       v: analiticos.porStatus.pago,      color:'#22c55e' },
                ].map(l => (
                  <div key={l.label} className="cp-legend-item">
                    <span className="cp-legend-dot" style={{background:l.color}}></span>
                    <span className="cp-legend-label">{l.label}</span>
                    <span className="cp-legend-val">{fmtBRL(l.v)}</span>
                    <span className="cp-legend-pct">{pizzaTotal>0?fmtPct(l.v/pizzaTotal*100):'0,00%'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Faixa de atraso */}
          <div className="cp-panel">
            <h4 className="cp-panel-title">FAIXA DE ATRASO</h4>
            {[
              { label:'1 a 15 dias',  v: analiticos.faixaAtraso.f1 },
              { label:'16 a 30 dias', v: analiticos.faixaAtraso.f2 },
              { label:'31 a 60 dias', v: analiticos.faixaAtraso.f3 },
              { label:'+ 60 dias',    v: analiticos.faixaAtraso.f4 },
            ].map(f => {
              const tot = analiticos.faixaAtraso.total;
              const pct = tot > 0 ? f.v / tot * 100 : 0;
              return (
                <div key={f.label} className="cp-faixa-row">
                  <span className="cp-faixa-label">{f.label}</span>
                  <div className="cp-faixa-bar-wrap">
                    <div className="cp-faixa-bar" style={{width:`${Math.min(pct,100).toFixed(1)}%`}}></div>
                  </div>
                  <span className="cp-faixa-val">{fmtBRL(f.v)}</span>
                  <span className="cp-faixa-pct">{fmtPct(pct)}</span>
                </div>
              );
            })}
          </div>

          {/* Top 5 fornecedores */}
          <div className="cp-panel">
            <h4 className="cp-panel-title">TOP 5 FORNECEDORES (MAIOR DÉBITO)</h4>
            {analiticos.top5.map((t, i) => (
              <div key={t.fornecedor} className="cp-top-row">
                <span className="cp-top-rank">{i+1}.</span>
                <span className="cp-top-nome">{t.fornecedor}</span>
                <span className="cp-top-val">{fmtBRL(t.divida)}</span>
              </div>
            ))}
          </div>

          {/* Índices financeiros */}
          <div className="cp-panel">
            <h4 className="cp-panel-title">ÍNDICES FINANCEIROS</h4>
            {[
              { label:'Ticket Médio',          value: fmtBRL(analiticos.indices.ticketMedio) },
              { label:'Prazo Médio (dias)',     value: analiticos.indices.prazoMedio },
              { label:'% em Atraso',           value: fmtPct(analiticos.indices.pctAtraso), red: true },
              { label:'Pago Antecipado',       value: fmtPct(analiticos.indices.pagoAntecip) },
            ].map(idx => (
              <div key={idx.label} className="cp-idx-row">
                <span className="cp-idx-label">{idx.label}</span>
                <span className={`cp-idx-val ${idx.red ? 'cp-red' : ''}`}>{idx.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de Visualização ─────────────────────────────────────────── */}
      {viewConta && (
        <div className="cp-modal-overlay" onClick={()=>setViewConta(null)}>
          <div className="cp-modal" onClick={e=>e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3>Detalhes da Conta a Pagar</h3>
              <button className="cp-modal-close" onClick={()=>setViewConta(null)}><X size={18}/></button>
            </div>
            <div className="cp-modal-body">
              {[
                ['Fornecedor',     viewConta.fornecedor],
                ['CNPJ',           viewConta.cnpj],
                ['Documento',      viewConta.documento],
                ['Vencimento',     fmtDate(viewConta.vencimento)],
                ['Status',         CP_STATUS_LABEL[viewConta.status]],
                ['Dias de Atraso', viewConta.diasAtraso > 0 ? `${viewConta.diasAtraso} dias` : '-'],
                ['Valor',          fmtBRL(viewConta.valor)],
                ['Juros',          fmtBRL(viewConta.juros)],
                ['Desconto',       fmtBRL(viewConta.desconto)],
                ['Valor a Pagar',  fmtBRL(viewConta.valorAPagar)],
                ...(viewConta.dataPagamento ? [['Data Pagamento', fmtDate(viewConta.dataPagamento)]] : []),
              ].map(([k,v]) => (
                <div key={k} className="cp-modal-row">
                  <span className="cp-modal-key">{k}</span>
                  <span className="cp-modal-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Registrar Pagamento ─────────────────────────────────────── */}
      {regModal && (
        <div className="cp-modal-overlay" onClick={()=>setRegModal(null)}>
          <div className="cp-modal" style={{ maxWidth: 400 }} onClick={e=>e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3>Registrar Pagamento</h3>
              <button className="cp-modal-close" onClick={()=>setRegModal(null)}><X size={18}/></button>
            </div>
            <div className="cp-modal-body">
              <div className="cp-modal-row">
                <span className="cp-modal-key">Fornecedor</span>
                <span className="cp-modal-val">{regModal.fornecedor}</span>
              </div>
              <div className="cp-modal-row">
                <span className="cp-modal-key">Documento</span>
                <span className="cp-modal-val">{regModal.documento}</span>
              </div>
              <div className="cp-modal-row">
                <span className="cp-modal-key">Valor a Pagar</span>
                <span className="cp-modal-val" style={{color:'#f87171'}}>{fmtBRL(regModal.valorAPagar)}</span>
              </div>
              <div className="cp-modal-row" style={{flexDirection:'column',gap:6,alignItems:'flex-start'}}>
                <span className="cp-modal-key">Data do Pagamento</span>
                <input type="date" className="cp-date-input" style={{width:'100%',boxSizing:'border-box'}}
                  value={regDate} onChange={e=>setRegDate(e.target.value)} />
              </div>
              <div className="cp-modal-row" style={{flexDirection:'column',gap:6,alignItems:'flex-start'}}>
                <span className="cp-modal-key">Valor Pago (R$)</span>
                <input type="number" className="cp-date-input" style={{width:'100%',boxSizing:'border-box'}}
                  step="0.01" value={regValor} onChange={e=>setRegValor(e.target.value)} />
              </div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="cp-btn-export" style={{flex:1,justifyContent:'center'}} onClick={()=>setRegModal(null)}>Cancelar</button>
                <button onClick={handleRegistrarPagamento}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 16px',background:'#22c55e',border:'none',borderRadius:8,color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                  <Save size={15}/> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ── fim ContasPagar ───────────────────────────────────────────────────────────

// ── Financeiro (wrapper com abas Receber / Pagar) ────────────────────────────
const Financeiro = ({ clients, selectedClient }) => {
  const [tab, setTab] = useState('receber');
  return (
    <div>
      <div className="fin-tab-bar">
        <button
          className={`vp-period-btn vp-secao-btn${tab === 'receber' ? ' active' : ''}`}
          onClick={() => setTab('receber')}
        >
          💰 Contas a Receber
        </button>
        <button
          className={`vp-period-btn vp-secao-btn${tab === 'pagar' ? ' active' : ''}`}
          onClick={() => setTab('pagar')}
        >
          📤 Contas a Pagar
        </button>
      </div>
      {tab === 'receber'
        ? <ContasReceber clients={clients} selectedClient={selectedClient} />
        : <ContasPagar   clients={clients} selectedClient={selectedClient} />
      }
    </div>
  );
};

// ─── Tanque Horizontal 3D — tanque cilíndrico com efeito volumétrico ──────────
const HorizTank = ({ pct = 0, color = '#22c55e', liters = 0 }) => {
  const safe = Math.max(0, Math.min(100, pct));
  const W = 430, H = 200;
  const X1 = 62, X2 = 368, CY = 104, RX = 54, RY = 82;
  const BW = X2 - X1;
  const fillH = RY * 2 * safe / 100;
  const fillY = CY + RY - fillH;
  const fmtN  = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const uid   = 'ht';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: 430, margin: '0 auto' }}>
      <defs>
        {/* Corpo clip */}
        <clipPath id={`${uid}-body`}>
          <rect x={X1} y={CY-RY} width={BW} height={RY*2}/>
          <ellipse cx={X1} cy={CY} rx={RX} ry={RY}/>
          <ellipse cx={X2} cy={CY} rx={RX} ry={RY}/>
        </clipPath>
        <clipPath id={`${uid}-cap`}>
          <ellipse cx={X2} cy={CY} rx={RX} ry={RY}/>
        </clipPath>

        {/* Fundo do corpo (área vazia) */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f2f6f9"/>
          <stop offset="18%"  stopColor="#e4ecf2"/>
          <stop offset="82%"  stopColor="#ccd6de"/>
          <stop offset="100%" stopColor="#a8b8c4"/>
        </linearGradient>
        {/* Líquido */}
        <linearGradient id={`${uid}-liq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.72"/>
        </linearGradient>
        {/* Highlight superior cilíndrico (topo brilhante = 3D) */}
        <linearGradient id={`${uid}-hl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.62)"/>
          <stop offset="32%"  stopColor="rgba(255,255,255,0.14)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        {/* Sombra inferior cilíndrica */}
        <linearGradient id={`${uid}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
          <stop offset="65%"  stopColor="rgba(0,0,0,0.10)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.30)"/>
        </linearGradient>
        {/* Tampa frontal — gradiente radial para efeito esférico */}
        <radialGradient id={`${uid}-capR`} cx="36%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.60)"/>
          <stop offset="38%"  stopColor="rgba(255,255,255,0.14)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)"/>
        </radialGradient>
        {/* Suporte metálico */}
        <linearGradient id={`${uid}-mt`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7a8c9a"/>
          <stop offset="30%"  stopColor="#b0c2ce"/>
          <stop offset="55%"  stopColor="#d2e0e8"/>
          <stop offset="100%" stopColor="#7a8c9a"/>
        </linearGradient>
      </defs>

      {/* ── Suportes metálicos U-bracket (como na imagem de referência) ── */}
      {[{ cx: X1+42 }, { cx: X2-42 }].map(({ cx }, i) => (
        <g key={i}>
          <rect x={cx-18} y={CY+RY-6}  width={10} height={32} fill={`url(#${uid}-mt)`} rx={2}/>
          <rect x={cx+8}  y={CY+RY-6}  width={10} height={32} fill={`url(#${uid}-mt)`} rx={2}/>
          <rect x={cx-24} y={CY+RY+23} width={48} height={10} fill={`url(#${uid}-mt)`} rx={2}/>
          {/* Pino central */}
          <rect x={cx-3}  y={CY+RY+16} width={6}  height={10} fill="#90a0b0" rx={1}/>
          {/* Parafusos laterais */}
          <circle cx={cx-18} cy={CY+RY+28} r={3} fill="#8090a0"/>
          <circle cx={cx+18} cy={CY+RY+28} r={3} fill="#8090a0"/>
        </g>
      ))}

      {/* ── Tampa traseira (esquerda) ── */}
      <ellipse cx={X1} cy={CY} rx={RX} ry={RY} fill="#b0bec8" stroke="#8898a8" strokeWidth={2}/>
      <ellipse cx={X1} cy={CY} rx={RX*0.72} ry={RY*0.72} fill="rgba(0,0,0,0.05)"/>
      <ellipse cx={X1} cy={CY-RY*0.38} rx={RX*0.55} ry={RY*0.14} fill="rgba(255,255,255,0.22)"/>

      {/* ── Corpo principal ── */}
      <g clipPath={`url(#${uid}-body)`}>
        {/* Fundo */}
        <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-bg)`}/>

        {/* Líquido base */}
        {safe > 0 && <rect x={0} y={fillY} width={W} height={fillH} fill={`url(#${uid}-liq)`}/>}

        {/* ── Ondas animadas (mais dramáticas) ── */}
        {safe > 2 && safe < 98 && (
          <ellipse cx={W/2} cy={fillY} rx={BW*0.56} ry={14} fill={color} opacity={0.72}>
            <animate attributeName="cx"
              values={`${W/2-52};${W/2+52};${W/2-52}`}
              dur="2.4s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
            <animate attributeName="cy"
              values={`${fillY};${fillY-7};${fillY}`}
              dur="2.4s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
          </ellipse>
        )}
        {safe > 2 && safe < 98 && (
          <ellipse cx={W/2} cy={fillY-5} rx={BW*0.46} ry={9} fill="rgba(255,255,255,0.42)">
            <animate attributeName="cx"
              values={`${W/2+46};${W/2-46};${W/2+46}`}
              dur="1.9s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
            <animate attributeName="cy"
              values={`${fillY-5};${fillY+3};${fillY-5}`}
              dur="1.9s" repeatCount="indefinite"/>
          </ellipse>
        )}
        {safe > 6 && safe < 94 && (
          <ellipse cx={W/2-25} cy={fillY+8} rx={BW*0.3} ry={8} fill={color} opacity={0.42}>
            <animate attributeName="cx"
              values={`${W/2-68};${W/2+18};${W/2-68}`}
              dur="3.2s" repeatCount="indefinite"/>
          </ellipse>
        )}
        {safe > 10 && safe < 90 && (
          <ellipse cx={W/2+30} cy={fillY+5} rx={BW*0.22} ry={6} fill="rgba(255,255,255,0.30)">
            <animate attributeName="cx"
              values={`${W/2+60};${W/2-10};${W/2+60}`}
              dur="2.7s" repeatCount="indefinite"/>
          </ellipse>
        )}

        {/* ── Bolhas subindo ── */}
        {safe > 8 && [
          { bx: X1+52,  dur:'2.8s', del:'0s',   r:4   },
          { bx: X1+108, dur:'2.3s', del:'0.7s',  r:3   },
          { bx: X1+170, dur:'3.2s', del:'1.4s',  r:4.5 },
          { bx: X1+225, dur:'2.6s', del:'0.3s',  r:3   },
          { bx: X1+275, dur:'3.0s', del:'1.1s',  r:3.5 },
        ].map((b, bi) => (
          <circle key={bi} cx={b.bx} cy={CY+RY-8} r={b.r}
            fill={`${color}6a`} stroke={`${color}99`} strokeWidth={0.8}>
            <animate attributeName="cy"
              values={`${CY+RY-8};${fillY+b.r+1};${CY+RY-8}`}
              dur={b.dur} begin={b.del} repeatCount="indefinite"/>
            <animate attributeName="opacity"
              values="0;0.9;0.55;0" dur={b.dur} begin={b.del} repeatCount="indefinite"/>
          </circle>
        ))}

        {/* ── Shading 3D cilíndrico: topo brilhante ── */}
        <rect x={0} y={CY-RY} width={W} height={RY*0.48} fill={`url(#${uid}-hl)`}/>
        {/* ── Shading 3D cilíndrico: sombra inferior ── */}
        <rect x={0} y={CY+RY*0.55} width={W} height={RY*0.45} fill={`url(#${uid}-sh)`}/>

        {/* Reflexo metálico no topo */}
        <ellipse cx={X1+BW*0.50} cy={CY-RY*0.58} rx={BW*0.28} ry={RY*0.12}
          fill="rgba(255,255,255,0.36)"/>

        {/* Costuras de solda */}
        {[0.34, 0.67].map((f, fi) => (
          <line key={fi} x1={X1+BW*f} y1={CY-RY} x2={X1+BW*f} y2={CY+RY}
            stroke="rgba(0,0,0,0.07)" strokeWidth={1.5}/>
        ))}
      </g>

      {/* ── Contorno do corpo ── */}
      <line x1={X1} y1={CY-RY} x2={X2} y2={CY-RY} stroke="#8898a8" strokeWidth={1.8}/>
      <line x1={X1} y1={CY+RY} x2={X2} y2={CY+RY} stroke="#8898a8" strokeWidth={1.8}/>

      {/* ── Tubulação topo esquerdo (estilo da imagem) ── */}
      {/* Pipe horizontal base */}
      <rect x={X1+6}  y={CY-RY-10} width={48} height={9}  fill="#7c2d12" rx={2}/>
      {/* Pipe vertical riser */}
      <rect x={X1+38} y={CY-RY-38} width={10} height={30} fill="#7c2d12" rx={2}/>
      {/* Vent cap / chapéu */}
      <rect x={X1+30} y={CY-RY-44} width={26} height={8}  fill="#991b1b" rx={3}/>
      <ellipse cx={X1+43} cy={CY-RY-44} rx={14} ry={5.5} fill="#7c2d12"/>
      {/* Valve body */}
      <rect x={X1+4}  y={CY-RY-22} width={10} height={20} fill="#6b1e1e" rx={2}/>
      {/* Valve horizontal */}
      <rect x={X1+14} y={CY-RY-16} width={24} height={7}  fill="#991b1b" rx={2}/>
      {/* Valve handle */}
      <rect x={X1+24} y={CY-RY-30} width={5}  height={12} fill="#1e293b" rx={1.5}/>
      {/* Pressure gauge */}
      <rect   x={X1+72} y={CY-RY-4}   width={3}  height={5}  fill="#64748b"/>
      <circle cx={X1+74} cy={CY-RY-16} r={12} fill="#1e293b" stroke="#4b5563" strokeWidth={2}/>
      <circle cx={X1+74} cy={CY-RY-16} r={8.5} fill="#111827"/>
      <line   x1={X1+74} y1={CY-RY-16} x2={X1+80} y2={CY-RY-22}
        stroke="#f59e0b" strokeWidth={1.8} strokeLinecap="round"/>
      <circle cx={X1+74} cy={CY-RY-16} r={2.5} fill="#6b7280"/>

      {/* ── Boca de visita / manhole (topo centro — como na imagem) ── */}
      {/* Outer flange ring */}
      <ellipse cx={W/2+10} cy={CY-RY}    rx={28} ry={9.5} fill="#374151" stroke="#4b5563" strokeWidth={2}/>
      {/* Inner lid */}
      <ellipse cx={W/2+10} cy={CY-RY}    rx={22} ry={7}   fill="#4b5563" stroke="#6b7280" strokeWidth={1.5}/>
      {/* Center plate */}
      <ellipse cx={W/2+10} cy={CY-RY}    rx={8}  ry={3.2} fill="#64748b"/>
      {/* Flange bolts */}
      {[0,36,72,108,144,180,216,252,288,324].map((a, ai) => (
        <circle key={ai}
          cx={(W/2+10) + Math.cos(a*Math.PI/180)*24}
          cy={(CY-RY) + Math.sin(a*Math.PI/180)*8}
          r={2.8} fill="#6b7280"/>
      ))}

      {/* ── Tampa frontal (direita) com gradiente radial 3D ── */}
      <g clipPath={`url(#${uid}-cap)`}>
        <rect x={X2-RX-4} y={0}     width={RX*2+8} height={H}  fill={`url(#${uid}-bg)`}/>
        {safe > 0 && (
          <rect x={X2-RX-4} y={fillY} width={RX*2+8} height={fillH} fill={`url(#${uid}-liq)`} opacity={0.88}/>
        )}
        {/* Cap top highlight */}
        <rect x={X2-RX-4} y={0} width={RX*2+8} height={RY*0.42} fill={`url(#${uid}-hl)`}/>
        {safe > 2 && safe < 98 && (
          <ellipse cx={X2} cy={fillY} rx={RX*0.88} ry={7} fill={color} opacity={0.48}>
            <animate attributeName="cx"
              values={`${X2-22};${X2+22};${X2-22}`}
              dur="2.4s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
          </ellipse>
        )}
      </g>
      {/* Cap surface — radial gradient for 3D sphere look */}
      <ellipse cx={X2} cy={CY} rx={RX} ry={RY}
        fill={`url(#${uid}-capR)`} stroke="#8898a8" strokeWidth={2.5}/>
      {/* Cap rim detail */}
      <ellipse cx={X2} cy={CY} rx={RX-3} ry={RY-3}
        fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.2}/>

      {/* ── Sensor box (lateral direita) ── */}
      <rect x={X2+30} y={CY-20} width={24} height={22} fill="#991b1b" rx={3}/>
      <rect x={X2+32} y={CY-18} width={20} height={18} fill="#7c2d12" rx={2}/>
      <rect x={X2+22} y={CY-10} width={10} height={6}  fill="#7c2d12" rx={1}/>
      <rect x={X2+30} y={CY+24} width={16} height={8}  fill="#7c2d12" rx={2}/>
      <rect x={X2+12} y={CY+20} width={9}  height={18} fill="#6b1e1e" rx={2}/>

      {/* ── Etiqueta digital de nível ── */}
      <rect x={W/2-66} y={CY-33} width={132} height={66} rx={7}
        fill="rgba(0,0,0,0.76)" stroke={`${color}77`} strokeWidth={1.5}/>
      <text x={W/2} y={CY-14} textAnchor="middle"
        fill="#94a3b8" fontSize={10} fontFamily="monospace" fontWeight="700" letterSpacing="1">
        QTD COMBUSTÍVEL
      </text>
      <text x={W/2} y={CY+14} textAnchor="middle"
        fill={color} fontSize={22} fontFamily="monospace" fontWeight="900">
        {fmtN(liters)}
      </text>
      <text x={W/2} y={CY+30} textAnchor="middle"
        fill="#64748b" fontSize={10} fontFamily="monospace" fontWeight="600" letterSpacing="1">
        LITROS
      </text>
    </svg>
  );
};

// Dados mock dos top produtos de conveniência — id referencia PM_MOCK_PRODUCTS
const _CONV_DASH_BASE = [
  { id: 1,  name: 'Refrig. 350ml',   qty: 1842, emoji: '🥤' },
  { id: 3,  name: 'Água 500ml',      qty: 1725, emoji: '💧' },
  { id: 32, name: 'Café 3 Corações', qty:  930, emoji: '☕' },
  { id: 23, name: 'Marlboro',        qty:  760, emoji: '🚬' },
];

// ─── Tick customizado: imagem circular + nome (eixo X do gráfico conveniência) ──
const ConvProductTick = ({ x, y, payload, chartData, images }) => {
  const item   = (chartData || []).find(d => d.name === payload?.value);
  const imgSrc = item ? images[item.id] : null;
  const emoji  = item?.emoji || '📦';
  const label  = String(payload?.value || '');
  const SIZE   = 42;
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-SIZE / 2} y={4} width={SIZE} height={SIZE}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: SIZE, height: SIZE, borderRadius: '50%',
          overflow: 'hidden', background: '#1e293b',
          border: '2px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span>{emoji}</span>}
        </div>
      </foreignObject>
      <text x={0} y={56} textAnchor="middle" fill="#9ca3af" fontSize={10}>{label}</text>
    </g>
  );
};

// ─── Carrossel 3D de Conveniência ────────────────────────────────────────────
const CONV_MEDALS  = ['🥇', '🥈', '🥉', '4°'];
const CONV_RANKS   = ['1º LUGAR', '2º LUGAR', '3º LUGAR', '4º LUGAR'];
const CONV_GLOW    = ['#f59e0b', '#94a3b8', '#cd7c3a', '#64748b'];

const CONV_CAROUSEL_CSS = `
@keyframes cc-pulse-ring {
  0%   { transform: scale(0.85); opacity: 0.9; }
  100% { transform: scale(2.4);  opacity: 0;   }
}
@keyframes cc-star-float {
  0%,100% { transform: translateY(0px)  rotate(0deg);   opacity: 1;   }
  50%      { transform: translateY(-10px) rotate(180deg); opacity: 0.6; }
}
@keyframes cc-crown-bounce {
  0%,100% { transform: translateY(0)  scale(1);    }
  50%      { transform: translateY(-7px) scale(1.15); }
}
@keyframes cc-gold-shimmer {
  0%,100% { box-shadow: 0 0 22px #f59e0b55, 0 18px 52px #f59e0b44, inset 0 0 0 1px #f59e0b55; }
  50%      { box-shadow: 0 0 48px #f59e0bcc, 0 24px 72px #f59e0b77, inset 0 0 0 1px #f59e0b99; }
}
@keyframes cc-confetti {
  0%   { transform: translateY(-10px) rotate(0deg)   scale(1);    opacity: 1;   }
  80%  { opacity: 0.8; }
  100% { transform: translateY(72px)  rotate(520deg) scale(0.7);  opacity: 0;   }
}
@keyframes cc-spotlight {
  0%,100% { opacity: 0.55; }
  50%      { opacity: 0.85; }
}
`;

const FUEL_STATION_CSS = `
@keyframes fs-glow-pulse {
  0%,100% { opacity: 0.45; }
  50%      { opacity: 1; }
}
@keyframes fs-spotlight {
  0%,100% { opacity: 0.5; }
  50%      { opacity: 0.88; }
}
@keyframes fs-slide-right {
  from { transform: translateX(55%) rotateY(-38deg) scale(0.78); opacity: 0; filter: blur(2px); }
  to   { transform: translateX(0)   rotateY(0deg)   scale(1);    opacity: 1; filter: blur(0px); }
}
@keyframes fs-slide-left {
  from { transform: translateX(-55%) rotateY(38deg) scale(0.78); opacity: 0; filter: blur(2px); }
  to   { transform: translateX(0)    rotateY(0deg)  scale(1);    opacity: 1; filter: blur(0px); }
}
@keyframes fs-tank-appear {
  from { transform: scale(0.88) rotateY(12deg); opacity: 0; filter: blur(3px); }
  to   { transform: scale(1)    rotateY(0deg);  opacity: 1; filter: blur(0px); }
}
`;

const CONFETTI_COLORS = ['#f59e0b','#E31E24','#22c55e','#3b82f6','#f59e0b','#ec4899','#a78bfa'];
const STAR_POSITIONS  = [
  { top:'14%', left:'8%'  }, { top:'6%',  left:'40%' }, { top:'14%', right:'8%'  },
  { top:'55%', left:'4%'  }, { top:'55%', right:'4%'  }, { top:'80%', left:'28%' }, { top:'80%', right:'28%' },
];

const ConvCarousel = ({ data, images, themeMode }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n          = data.length;
  const dark       = themeMode !== 'light';
  const isChampion = active === 0;           // 1º lugar em destaque

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive(p => (p + 1) % n), 3200);
    return () => clearInterval(t);
  }, [n, paused]);

  const prev = () => { setPaused(true); setActive(p => (p - 1 + n) % n); };
  const next = () => { setPaused(true); setActive(p => (p + 1) % n); };

  return (
    <div style={{ position:'relative', padding:'6px 0 4px', userSelect:'none' }}>
      <style>{CONV_CAROUSEL_CSS}</style>

      {/* ── Showroom background ── */}
      <div style={{
        position:'absolute', inset:0, borderRadius:14, overflow:'hidden', pointerEvents:'none',
        background: dark
          ? 'radial-gradient(ellipse 80% 60% at 50% 20%, #2a0a0a 0%, #0a0000 100%)'
          : 'radial-gradient(ellipse 80% 60% at 50% 20%, #fde8e8 0%, #f5cece 100%)',
      }}>
        {/* Floor */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:'38%',
          background: dark
            ? 'linear-gradient(0deg, #100000 0%, transparent 100%)'
            : 'linear-gradient(0deg, #e8b8b8 0%, transparent 100%)',
        }}/>
        {/* Floor reflection */}
        <div style={{
          position:'absolute', bottom:'28%', left:'15%', right:'15%', height:1,
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        }}/>
        {/* Spotlight cone */}
        <div style={{
          position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:0, height:0,
          borderLeft:'80px solid transparent', borderRight:'80px solid transparent',
          borderTop: dark ? '260px solid rgba(255,220,80,.04)' : '260px solid rgba(255,200,40,.09)',
          animation:'cc-spotlight 3s ease-in-out infinite',
        }}/>
        {/* Inner spotlight glow */}
        <div style={{
          position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)',
          width:'44%', height:'65%',
          background: dark
            ? 'radial-gradient(ellipse at top, rgba(255,210,60,.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top, rgba(255,200,30,.18) 0%, transparent 70%)',
          animation:'cc-spotlight 3s ease-in-out infinite',
        }}/>
      </div>

      {/* ── Confetti (só quando campeão em destaque) ── */}
      {isChampion && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:24, borderRadius:14 }}>
          {CONFETTI_COLORS.map((c, k) => (
            <div key={k} style={{
              position:'absolute',
              top:`${-8 + (k % 3) * 4}px`,
              left:`${8 + k * 13}%`,
              width: k % 3 === 0 ? 9 : 6,
              height: k % 3 === 0 ? 9 : 12,
              borderRadius: k % 2 === 0 ? '50%' : 3,
              background: c,
              animation:`cc-confetti ${1.6 + k * 0.28}s ${k * 0.18}s ease-in infinite`,
            }}/>
          ))}
        </div>
      )}

      {/* ── Stage ── */}
      <div style={{ position:'relative', height:265, display:'flex', alignItems:'center', justifyContent:'center', perspective:'900px', zIndex:1 }}>

        {/* Arrow left */}
        <button onClick={prev} style={{ position:'absolute', left:4, zIndex:22, background: dark ? '#1e293b' : '#e2e6f0', border:`1px solid ${dark?'#334155':'#c8cdd8'}`, borderRadius:'50%', width:32, height:32, cursor:'pointer', color: dark ? '#94a3b8' : '#6b7280', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>

        {data.map((item, i) => {
          const raw      = (i - active + n) % n;
          const offset   = raw > n / 2 ? raw - n : raw;
          const isActive = offset === 0;
          const absOff   = Math.abs(offset);
          const isWinner = i === 0 && isActive;   // 1º lugar E em destaque

          const tx      = offset * 172;
          const scale   = isActive ? 1.2 : Math.max(0.60, 1 - absOff * 0.22);
          const rotY    = offset * -42;
          const opacity = absOff > 1 ? 0.35 : 1;
          const zIdx    = n - absOff;
          const glow    = CONV_GLOW[i] || '#64748b';

          // Card background
          const cardBg = isWinner
            ? (dark ? 'linear-gradient(155deg,#1c1a08,#0f0c00)' : 'linear-gradient(155deg,#fffaec,#fff8dc)')
            : isActive
              ? (dark ? 'linear-gradient(155deg,#1a2235,#0d1525)' : 'linear-gradient(155deg,#f0f2f8,#e4e8f2)')
              : (dark ? '#0d1420' : '#dde0ea');

          return (
            <div key={i} onClick={() => { setActive(i); setPaused(true); }}
              style={{
                position:'absolute',
                transform:`translateX(${tx}px) scale(${scale}) rotateY(${rotY}deg)`,
                zIndex: zIdx, opacity,
                transition:'all 0.55s cubic-bezier(.4,0,.2,1)',
                cursor:'pointer', transformStyle:'preserve-3d',
              }}>



              {/* Card */}
              <div style={{
                width:158, background: cardBg,
                border: isWinner ? '2px solid #f59e0b' : isActive ? `2px solid ${glow}` : `1px solid ${dark?'#1a2235':'#c8cdd8'}`,
                borderRadius:18, padding:'14px 14px 12px', textAlign:'center',
                animation: isWinner ? 'cc-gold-shimmer 2.2s ease-in-out infinite' : 'none',
                transition:'background .55s, border .55s',
                position:'relative', overflow:'visible',
              }}>

                {/* Crown — só no campeão */}
                {isWinner
                  ? <div style={{ fontSize:26, lineHeight:1, marginBottom:4, animation:'cc-crown-bounce 1.6s ease-in-out infinite' }}>👑</div>
                  : <div style={{ fontSize:17, fontWeight:900, lineHeight:1, marginBottom:6, color: CONV_GLOW[i] || '#64748b', fontFamily:'monospace', letterSpacing:1 }}>{i+1}°</div>
                }

                {/* Photo */}
                <div style={{
                  width:80, height:80, borderRadius:'50%', margin:'0 auto 10px',
                  overflow:'hidden', position:'relative',
                  border: isWinner ? '3px solid #f59e0b' : isActive ? `3px solid ${glow}` : `2px solid ${dark?'#1a2235':'#c8cdd8'}`,
                  background: dark ? '#1e293b' : '#dde0ea',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: isWinner ? '0 0 28px #f59e0baa' : isActive ? `0 0 18px ${glow}66` : 'none',
                  transition:'box-shadow .55s',
                }}>
                  {images[item.id]
                    ? <img src={images[item.id]} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <span style={{ fontSize:36 }}>{item.emoji}</span>
                  }
                </div>

                {/* Name */}
                <div style={{ color: dark ? '#f1f5f9' : '#1e293b', fontSize:12, fontWeight:700, marginBottom:5, lineHeight:1.3 }}>{item.name}</div>

                {/* Qty */}
                <div style={{
                  color: isWinner ? '#f59e0b' : isActive ? glow : (dark ? '#64748b' : '#94a3b8'),
                  fontSize:17, fontWeight:900, transition:'color .3s',
                  textShadow: isWinner ? '0 0 12px #f59e0b88' : 'none',
                }}>
                  {Number(item.qty).toLocaleString('pt-BR')} <span style={{ fontSize:11, fontWeight:600 }}>un.</span>
                </div>

                {/* Rank badge */}
                <div style={{ marginTop:8, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {isActive && (
                    <span style={{
                      background: isWinner ? 'linear-gradient(90deg,#d97706,#f59e0b,#fbbf24)' : glow,
                      color:'#fff', borderRadius:20, padding:'2px 14px',
                      fontSize:10, fontWeight:800, letterSpacing:1,
                      boxShadow: isWinner ? '0 2px 12px #f59e0b88' : 'none',
                    }}>
                      {CONV_RANKS[i]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Arrow right */}
        <button onClick={next} style={{ position:'absolute', right:4, zIndex:22, background: dark ? '#1e293b' : '#e2e6f0', border:`1px solid ${dark?'#334155':'#c8cdd8'}`, borderRadius:'50%', width:32, height:32, cursor:'pointer', color: dark ? '#94a3b8' : '#6b7280', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      </div>

      {/* Dot indicators */}
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:8, position:'relative', zIndex:2 }}>
        {data.map((_, i) => (
          <button key={i} onClick={() => { setActive(i); setPaused(true); }} style={{
            width: active===i ? 22 : 7, height:7, borderRadius:4,
            background: active===i ? (CONV_GLOW[active]||'#E31E24') : (dark?'#334155':'#c8cdd8'),
            border:'none', cursor:'pointer', padding:0,
            transition:'all .35s ease',
          }}/>
        ))}
      </div>
    </div>
  );
};

// ─── Carrossel de seleção de combustível ─────────────────────────────────────
const FuelTypeCarousel = ({ estoques, selected, onSelect, dark }) => {
  const n = estoques.length;
  const [viewOff, setViewOff] = useState(0);
  const visible = Math.min(n, 4);

  useEffect(() => {
    const idx = estoques.findIndex(e => e.produtoCodigo === selected);
    if (idx < 0) return;
    setViewOff(o => {
      const lo = Math.max(0, idx - Math.floor(visible / 2));
      const hi = Math.max(0, n - visible);
      return Math.min(lo, hi);
    });
  }, [selected, n, visible]);

  if (n === 0) return null;

  const canPrev = viewOff > 0;
  const canNext = viewOff + visible < n;

  const arrowStyle = (disabled) => ({
    background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? (dark ? '#1e293b' : '#d4d8e4') : (dark ? '#64748b' : '#94a3b8'),
    fontSize: 22, padding: '0 2px', lineHeight: 1,
    opacity: disabled ? 0.3 : 1, transition: 'color .2s',
    flexShrink: 0,
  });

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 16px 12px', position:'relative', zIndex:5 }}>
      {n > visible && (
        <button onClick={() => setViewOff(o => Math.max(0, o - 1))} style={arrowStyle(!canPrev)}>‹</button>
      )}
      <div style={{ display:'flex', gap:7, flex:1 }}>
        {estoques.slice(viewOff, viewOff + visible).map(e => {
          const color = getFuelColor(e.produtoNome, DASHBOARD_COLORS.stock);
          const isActive = e.produtoCodigo === selected;
          const pct = Math.min(100, e.percentualOcupacao || 0);
          const shortName = e.produtoNome.split(' ').slice(0, 3).join(' ');
          return (
            <button key={e.produtoCodigo} onClick={() => onSelect(e.produtoCodigo)} style={{
              flex: 1, textAlign: 'center', cursor: 'pointer', outline: 'none',
              padding: '8px 6px 7px', borderRadius: 10, transition: 'all .3s',
              background: isActive
                ? (dark ? `${color}1a` : `${color}12`)
                : (dark ? '#0f1624' : '#e2e6f0'),
              border: isActive
                ? `1.5px solid ${color}66`
                : `1.5px solid ${dark ? '#1a2235' : '#c8d0e0'}`,
              boxShadow: isActive ? `0 0 14px ${color}33, inset 0 0 8px ${color}0a` : 'none',
            }}>
              <div style={{
                color: isActive ? color : (dark ? '#64748b' : '#94a3b8'),
                fontSize: 9, fontWeight: 800, letterSpacing: 0.5, marginBottom: 5,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {shortName.toUpperCase()}
              </div>
              <div style={{ height: 4, borderRadius: 2, background: dark ? '#1e293b' : '#d0d5e4', marginBottom: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .6s ease' }}/>
              </div>
              <div style={{ color: isActive ? color : (dark ? '#475569' : '#9ca3af'), fontSize: 10, fontWeight: 700 }}>
                {pct.toFixed(0)}%
              </div>
            </button>
          );
        })}
      </div>
      {n > visible && (
        <button onClick={() => setViewOff(o => Math.min(o + 1, n - visible))} style={arrowStyle(!canNext)}>›</button>
      )}
    </div>
  );
};

// ─── Carrossel coverflow de seleção de combustível ────────────────────────────
const FuelCarouselSelector = ({ estoques, selected, onSelect, dark }) => {
  const n = estoques.length;
  const [active, setActive] = useState(() => {
    const idx = estoques.findIndex(e => e.produtoCodigo === selected);
    return idx >= 0 ? idx : 0;
  });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const idx = estoques.findIndex(e => e.produtoCodigo === selected);
    if (idx >= 0 && idx !== active) setActive(idx);
  }, [selected]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setActive(p => {
      const next = (p + 1) % n;
      onSelect(estoques[next].produtoCodigo);
      return next;
    }), 3800);
    return () => clearInterval(t);
  }, [n, paused, estoques, onSelect]);

  if (n === 0) return null;

  const handleClick = (i) => {
    setActive(i);
    onSelect(estoques[i].produtoCodigo);
    setPaused(true);
  };
  const prev = () => handleClick((active - 1 + n) % n);
  const next = () => handleClick((active + 1) % n);

  return (
    <div style={{ position: 'relative', padding: '4px 0 4px', userSelect: 'none' }}>
      <div style={{ position: 'relative', height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '700px', zIndex: 1, overflow: 'hidden' }}>
        {/* Arrow left */}
        <button onClick={prev} style={{ position:'absolute', left:6, zIndex:22, background: dark ? '#1e293b' : '#e2e6f0', border:`1px solid ${dark?'#334155':'#c4ccd8'}`, borderRadius:'50%', width:28, height:28, cursor:'pointer', color: dark ? '#ffffff' : '#111827', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>

        {estoques.map((e, i) => {
          const raw    = (i - active + n) % n;
          const offset = raw > n / 2 ? raw - n : raw;
          const isAct  = offset === 0;
          const absOff = Math.abs(offset);
          const fColor = getFuelColor(e.produtoNome, DASHBOARD_COLORS.stock);
          const pct    = Math.min(100, e.percentualOcupacao || 0);

          const tx    = offset * 148;
          const sc    = isAct ? 1.18 : Math.max(0.58, 1 - absOff * 0.26);
          const rotY  = offset * -46;
          const op    = absOff > 1 ? 0.3 : 1;
          const zIdx  = n - absOff;

          const cardBg = isAct
            ? (dark ? `${fColor}1e` : `${fColor}22`)
            : (dark ? '#0e1524' : '#dde2ee');

          return (
            <div key={i} onClick={() => handleClick(i)} style={{
              position: 'absolute',
              transform: `translateX(${tx}px) scale(${sc}) rotateY(${rotY}deg)`,
              zIndex: zIdx, opacity: op,
              transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
              cursor: 'pointer', transformStyle: 'preserve-3d',
            }}>
              <div style={{
                width: 136, padding: '9px 12px 8px', textAlign: 'center', borderRadius: 13,
                background: cardBg,
                border: isAct ? `1.5px solid ${fColor}66` : `1px solid ${dark?'#1a2235':'#c8d0e0'}`,
                boxShadow: isAct ? `0 0 20px ${fColor}33, inset 0 0 10px ${fColor}0a` : 'none',
                transition: 'all .5s',
              }}>
                <div style={{ color: isAct ? fColor : (dark?'#64748b':'#94a3b8'), fontSize:9, fontWeight:800, letterSpacing:0.5, marginBottom:6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {e.produtoNome.split(' ').slice(0,3).join(' ').toUpperCase()}
                </div>
                <div style={{ height:5, borderRadius:3, background: dark ? '#1e293b' : '#ccd4e0', marginBottom:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background: fColor, borderRadius:3, transition:'width .5s' }}/>
                </div>
                <div style={{ color: isAct ? fColor : (dark?'#475569':'#94a3b8'), fontSize:15, fontWeight:900 }}>{pct.toFixed(0)}%</div>
                {isAct && (
                  <div style={{ color: dark ? '#475569' : '#94a3b8', fontSize:9, marginTop:3 }}>
                    {Number(e.estoqueTotal||0).toLocaleString('pt-BR',{maximumFractionDigits:0})} L
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Arrow right */}
        <button onClick={next} style={{ position:'absolute', right:6, zIndex:22, background: dark ? '#1e293b' : '#e2e6f0', border:`1px solid ${dark?'#334155':'#c4ccd8'}`, borderRadius:'50%', width:28, height:28, cursor:'pointer', color: dark ? '#ffffff' : '#111827', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>›</button>
      </div>

      {/* Dot indicators */}
      <div style={{ display:'flex', justifyContent:'center', gap:5, zIndex:2, marginBottom:2 }}>
        {estoques.map((_, di) => (
          <button key={di} onClick={() => handleClick(di)} style={{
            width: active===di ? 20 : 6, height:6, borderRadius:3,
            background: active===di ? getFuelColor(estoques[active]?.produtoNome, DASHBOARD_COLORS.stock) : (dark?'#334155':'#c8cdd8'),
            border:'none', cursor:'pointer', padding:0, transition:'all .3s ease',
          }}/>
        ))}
      </div>
    </div>
  );
};

// ─── Card de Estoque de Combustível — Posto 3D com Carrossel ─────────────────
const FuelStationCard = ({ estoques = [], themeMode = 'dark' }) => {
  const dark = themeMode !== 'light';
  const list = estoques || [];
  const [selFuel, setSelFuel]     = useState(null);
  const [slideAnim, setSlideAnim] = useState('appear');
  const [animKey, setAnimKey]     = useState(0);

  const active    = list.find(e => e.produtoCodigo === selFuel) || list[0] || null;
  const fuelPct   = active ? Math.round(active.percentualOcupacao) : 0;
  const fuelColor = active ? getFuelColor(active.produtoNome, DASHBOARD_COLORS.stock) : DASHBOARD_COLORS.stock;
  const fmtN      = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  const handleSelect = (cod) => {
    const curId = selFuel || list[0]?.produtoCodigo;
    if (cod === curId) return;
    const oldIdx = list.findIndex(e => e.produtoCodigo === curId);
    const newIdx = list.findIndex(e => e.produtoCodigo === cod);
    setSlideAnim(newIdx > oldIdx ? 'right' : 'left');
    setAnimKey(k => k + 1);
    setSelFuel(cod);
  };

  const tankAnim = slideAnim === 'right' ? 'fs-slide-right 0.52s cubic-bezier(.4,0,.2,1)'
                 : slideAnim === 'left'  ? 'fs-slide-left  0.52s cubic-bezier(.4,0,.2,1)'
                 :                         'fs-tank-appear  0.55s cubic-bezier(.4,0,.2,1)';

  return (
    <div className="chart-card" style={{
      padding: 0, overflow: 'hidden', position: 'relative', minHeight: 295,
    }}>
      <style>{FUEL_STATION_CSS}</style>

      {/* ── Showroom background ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        background: dark
          ? `radial-gradient(ellipse 86% 68% at 50% 14%, ${fuelColor}20 0%, #050508 100%)`
          : `radial-gradient(ellipse 86% 68% at 50% 14%, ${fuelColor}30 0%, #fbd8d8 100%)`,
        transition: 'background 0.55s',
      }}>
        {/* Floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: dark ? 'linear-gradient(0deg, #020205 0%, transparent 100%)' : 'linear-gradient(0deg, #f0b8b8 0%, transparent 100%)',
        }}/>
        {/* Floor reflection line */}
        <div style={{
          position: 'absolute', bottom: '30%', left: '12%', right: '12%', height: 1,
          background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
        }}/>
        {/* Spotlight cone */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '110px solid transparent', borderRight: '110px solid transparent',
          borderTop: dark ? `260px solid ${fuelColor}07` : `260px solid ${fuelColor}0e`,
          animation: 'fs-spotlight 3.5s ease-in-out infinite',
          transition: 'border-top-color 0.55s',
        }}/>
        {/* Inner spotlight glow */}
        <div style={{
          position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
          width: '52%', height: '62%',
          background: dark
            ? `radial-gradient(ellipse at top, ${fuelColor}0d 0%, transparent 70%)`
            : `radial-gradient(ellipse at top, ${fuelColor}16 0%, transparent 70%)`,
          animation: 'fs-spotlight 3.5s ease-in-out infinite',
          transition: 'background 0.55s',
        }}/>
        {/* Canopy neon line */}
        <div style={{
          position: 'absolute', top: 44, left: '3%', right: '3%', height: 3,
          background: `linear-gradient(90deg, transparent, ${fuelColor}55 28%, ${fuelColor}99 50%, ${fuelColor}55 72%, transparent)`,
          filter: 'blur(1.5px)',
          animation: 'fs-glow-pulse 2.6s ease-in-out infinite',
          transition: 'background 0.55s',
        }}/>
        {/* Ground glow */}
        <div style={{
          position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '58%', height: 22,
          background: `radial-gradient(ellipse at center, ${fuelColor}2a 0%, transparent 70%)`,
          filter: 'blur(10px)',
          animation: 'fs-glow-pulse 3s ease-in-out infinite',
          transition: 'background 0.55s',
        }}/>
        {/* Shimmer sweep */}
        <div style={{
          position: 'absolute', top: '5%', left: '-12%', width: '20%', height: '80%',
          background: `linear-gradient(90deg, transparent, ${fuelColor}0d, transparent)`,
          animation: 'none',
        }}/>
      </div>

      {/* ── Header ── */}
      <div style={{ position: 'relative', zIndex: 10, padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, letterSpacing: 2, color: dark ? '#f1f5f9' : '#111827' }}>ESTOQUE DE COMBUSTÍVEL</h3>
        {active && (
          <span style={{ fontSize: 11, color: dark ? '#e2e8f0' : '#111827' }}>
            Cap: <strong style={{ color: fuelColor, transition: 'color 0.4s' }}>{fmtN(active.capacidadeTotal)} L</strong>
          </span>
        )}
      </div>

      {/* ── Carrossel coverflow de seleção de combustível ── */}
      <FuelCarouselSelector
        estoques={list}
        selected={selFuel || list[0]?.produtoCodigo}
        onSelect={handleSelect}
        dark={dark}
      />

      {/* ── Tanque com animação 3D coverflow ── */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 20px 20px', perspective: '760px', perspectiveOrigin: '50% 28%', overflow: 'hidden' }}>
        <div
          key={animKey}
          style={{
            animation: tankAnim,
            filter: `drop-shadow(0 6px 34px ${fuelColor}55) drop-shadow(0 2px 10px ${fuelColor}33)`,
            transition: 'filter 0.5s',
            transformOrigin: 'center center',
          }}
        >
          <HorizTank pct={fuelPct} color={fuelColor} liters={active?.estoqueTotal || 0} />
        </div>
        {/* Reflexo sombra no chão */}
        <div style={{
          position: 'absolute', bottom: 20, left: '18%', right: '18%', height: 14,
          background: `radial-gradient(ellipse at center, ${fuelColor}38 0%, transparent 70%)`,
          filter: 'blur(9px)',
          transition: 'background 0.5s',
          pointerEvents: 'none',
        }}/>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ kpis, combustiveis, vendasDiarias, vendasHorarias, lmcControle, estoques, loading, clients, selectedClient, selectedPeriod, setSelectedPeriod, onRefresh, themeMode }) => {
  const [selectedFuelDonut, setSelectedFuelDonut] = useState(null);
  const [isCompactDashboard, setIsCompactDashboard] = useState(false);
  const [salesFuelSection, setSalesFuelSection] = useState('conveniencia');
  const [productMatrixUnit, setProductMatrixUnit] = useState('Pista');
  const [productMatrixPeriod, setProductMatrixPeriod] = useState('Mensal');
  const [productMatrixAnimKey, setProductMatrixAnimKey] = useState(0);
  // Inicializa imagens do cache localStorage de forma SÍNCRONA (zero flash)
  // depois atualiza em background caso o cache esteja desatualizado
  const [convProductImages, setConvProductImages] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(IMG_LS_KEY) || 'null');
      if (cached) {
        const map = {};
        _CONV_DASH_BASE.forEach(item => { if (cached[item.id]) map[item.id] = cached[item.id]; });
        return map;
      }
    } catch {}
    return {};
  });

  // Background: busca da API e atualiza o estado se houver mudanças
  useEffect(() => {
    imgLoadAll().then(all => {
      setConvProductImages(prev => {
        const next = {};
        _CONV_DASH_BASE.forEach(item => { if (all[item.id]) next[item.id] = all[item.id]; });
        // Só re-renderiza se algo mudou
        const changed = _CONV_DASH_BASE.some(item => prev[item.id] !== next[item.id]);
        return changed ? next : prev;
      });
    }).catch(() => {});
  }, []);

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

  useEffect(() => { setProductMatrixAnimKey(k => k + 1); }, [productMatrixUnit, productMatrixPeriod]);

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

  // Mock top-4 conveniência mais vendida (demo) — produtos individuais
  const _CONV_DASH_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];
  const salesConvChartData = _CONV_DASH_BASE.map((r, i) => ({ ...r, color: _CONV_DASH_COLORS[i] }));

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
  const wideChartHeight = isCompactDashboard ? 240 : 300;
  const productMatrixHeight = isCompactDashboard ? 360 : 430;
  const purchaseChartHeight = isCompactDashboard ? 260 : 280;
  const smallChartHeight = isCompactDashboard ? 185 : 150;
  const xTickStyle = { fill: DASHBOARD_COLORS.axis, fontSize: isCompactDashboard ? 10 : 11 };
  const showDenseValueLabels = !isCompactDashboard;
  const selectedMatrixPeriod = PRODUCT_MATRIX_PERIODS.find(period => period.value === productMatrixPeriod) || PRODUCT_MATRIX_PERIODS[2];
  const pmUnitLabel = productMatrixUnit === 'Combustível' ? 'Litros (L)' : 'Qtd. Vendas';
  const productMatrixData = (PRODUCT_MATRIX_MOCK[productMatrixUnit] || PRODUCT_MATRIX_MOCK.Pista).map((item, index) => ({
    ...item,
    volume: Math.round(item.volume * selectedMatrixPeriod.factor + (index % 4) * selectedMatrixPeriod.factor * 6),
    margin: clamp(item.margin + selectedMatrixPeriod.marginShift + ((index % 3) - 1) * 0.7, 4, 50),
  }));
  // Sort descending and assign ABC tier
  const productMatrixSorted = [...productMatrixData]
    .sort((a, b) => b.volume - a.volume)
    .map((item, i, arr) => {
      const tier = getPmAbcTier(i, arr.length);
      return { ...item, tier, abcColor: PM_ABC_COLORS[tier], unitLabel: pmUnitLabel };
    });

  const dashboardKpis = kpis ? [
    { label: 'Total Vendas', value: 'R$ ' + fmt(kpis.vendas?.valor), icon: DollarSign, sub: `${(kpis.vendas?.total || 0).toLocaleString('pt-BR')} vendas` },
    { label: 'Litros Vendidos', value: fmt(kpis.combustivel?.litros) + ' L', icon: Droplet, sub: 'R$ ' + fmt(kpis.combustivel?.valor) },
    { label: 'Compras de Combustível', value: 'R$ ' + fmt(kpis.compras110?.valor), icon: FileText, sub: `${(kpis.compras110?.total || 0).toLocaleString('pt-BR')} compras` },
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
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h3>{salesFuelSection === 'combustivel' ? 'COMBUSTÍVEIS MAIS VENDIDOS' : 'RANKING PRODUTOS MAIS VENDIDOS'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className="vp-toggle-group">
              {[{ k: 'combustivel', l: '⛽ Combustível' }, { k: 'conveniencia', l: '🏪 Conveniência' }].map(v => (
                <button key={v.k} type="button"
                  className={`vp-period-btn${salesFuelSection === v.k ? ' active' : ''}`}
                  onClick={() => setSalesFuelSection(v.k)}>{v.l}</button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {salesFuelSection === 'combustivel' ? 'litros no período' : 'unidades no período'}
            </span>
          </div>
        </div>
        {salesFuelSection === 'combustivel' ? (
          <ResponsiveContainer width="100%" height={wideChartHeight}>
            <BarChart data={salesFuelChartData} margin={{ top: 28, right: 12, left: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
              <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={0} height={isCompactDashboard ? 46 : 30} angle={isCompactDashboard ? -18 : 0} textAnchor={isCompactDashboard ? 'end' : 'middle'} />
              <YAxis stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} width={isCompactDashboard ? 46 : 60} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtLitersLabel(v), 'Litros']} />
              <Bar dataKey="litros" name="Litros vendidos" fill={DASHBOARD_COLORS.sale} radius={[8, 8, 0, 0]}>
                {salesFuelChartData.map((entry, index) => (
                  <Cell key={`sales-fuel-${entry.name}-${index}`} fill={entry.color || DASHBOARD_COLORS.sale} />
                ))}
                <LabelList dataKey="litros" position="top" formatter={(v) => Number(v) > 0 ? fmtLitersLabel(v) : ''} {...CHART_LABEL_STYLE} fontSize={isCompactDashboard ? 10 : 12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ConvCarousel data={salesConvChartData} images={convProductImages} themeMode={themeMode} />
        )}
      </div>
    ),
    stock: (
      <FuelStationCard estoques={estoquesList} themeMode={themeMode} />
    ),
    purchases: (
      <div className="chart-card">
        <div className="card-header"><h3>COMPRAS 110 / 220 POR COMBUSTÍVEL</h3><span style={{ fontSize: '12px', color: '#666' }}>litros no período</span></div>
        <ResponsiveContainer width="100%" height={purchaseChartHeight}>
          <BarChart data={purchasesChartData} margin={{ top: 24, right: 12, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
            <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={0} height={isCompactDashboard ? 46 : 30} angle={isCompactDashboard ? -18 : 0} textAnchor={isCompactDashboard ? 'end' : 'middle'} />
            <YAxis stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} width={isCompactDashboard ? 46 : 60} />
            <Tooltip
              cursor={false}
              contentStyle={TOOLTIP_STYLE_PURCHASE}
              labelStyle={{ color: '#fff' }}
              formatter={(v) => [fmt(v) + ' L', 'Litros']}
            />
            <Legend />
            <Bar dataKey="compra110" name="Compra 110" fill={DASHBOARD_COLORS.purchase110} radius={[8, 8, 0, 0]}>
              <LabelList dataKey="compra110" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} {...CHART_LABEL_STYLE} fontSize={isCompactDashboard ? 9 : 11} />
            </Bar>
            <Bar dataKey="compra220" name="Compra 220" fill={DASHBOARD_COLORS.purchase220} radius={[8, 8, 0, 0]}>
              <LabelList dataKey="compra220" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} {...CHART_LABEL_STYLE} fontSize={isCompactDashboard ? 9 : 11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    productMatrix: (
      <div className="chart-card product-matrix-card">
        <style>{`
@keyframes abc-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes abc-badge-pop {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
`}</style>
        <div className="card-header product-matrix-header"
          style={{ animation: `abc-fade-up 0.4s ease-out both` }}>
          <div className="product-matrix-title">
            <h3>ANÁLISE ABC DE PRODUTOS</h3>
            <span>Classificação por volume de vendas e margem bruta</span>
          </div>
          <div className="product-matrix-controls">
            <div className="segmented-filter" aria-label="Unidade de Negócio">
              {PRODUCT_MATRIX_UNITS.map(unit => (
                <button
                  key={unit}
                  type="button"
                  className={productMatrixUnit === unit ? 'active' : ''}
                  onClick={() => setProductMatrixUnit(unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
            <div className="segmented-filter" aria-label="Período">
              {PRODUCT_MATRIX_PERIODS.map(period => (
                <button
                  key={period.value}
                  type="button"
                  className={productMatrixPeriod === period.value ? 'active' : ''}
                  onClick={() => setProductMatrixPeriod(period.value)}
                >
                  {period.value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ABC legend */}
        <div className="pm-abc-legend" style={{ animation: 'abc-fade-up 0.45s 0.15s ease-out both' }}>
          {[
            { cls: 'A', label: 'A — Alto volume (top 20%)' },
            { cls: 'B', label: 'B — Volume médio (30%)' },
            { cls: 'C', label: 'C — Baixo volume (50%)' },
          ].map(({ cls, label }, i) => (
            <span key={cls} style={{ animation: `abc-badge-pop 0.35s ${0.2 + i * 0.1}s ease-out both` }}>
              <span style={{ color: PM_ABC_COLORS[cls] }}>■</span> {label}
            </span>
          ))}
        </div>

        <ResponsiveContainer key={`abc-${productMatrixAnimKey}`} width="100%" height={productMatrixHeight}>
          <BarChart
            layout="vertical"
            data={productMatrixSorted}
            margin={{ top: 8, right: isCompactDashboard ? 56 : 72, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={DASHBOARD_COLORS.axis}
              tick={xTickStyle}
              tickFormatter={(v) => Number(v).toLocaleString('pt-BR')}
              label={{ value: pmUnitLabel, position: 'insideBottom', offset: -2, fill: DASHBOARD_COLORS.axis, fontSize: isCompactDashboard ? 10 : 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={isCompactDashboard ? 108 : 144}
              stroke={DASHBOARD_COLORS.axis}
              tick={{ fill: DASHBOARD_COLORS.axis, fontSize: isCompactDashboard ? 9 : 11 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              content={<ProductMatrixTooltip />}
            />
            <Bar
              dataKey="volume"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              animationBegin={120}
            >
              {productMatrixSorted.map((item) => (
                <Cell key={item.name} fill={item.abcColor} />
              ))}
              <LabelList
                dataKey="volume"
                position="right"
                formatter={(v) => Number(v).toLocaleString('pt-BR')}
                style={{ fill: DASHBOARD_COLORS.label, fontSize: isCompactDashboard ? 9 : 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    hourly: (
      <div className="chart-card">
        <div className="card-header"><h3>VENDAS P/HORA</h3></div>
        <div className="metric-display"><div className="metric-icon-box"><Clock size={20} /></div><div className="metric-info"><div className="metric-label">Valor de combustível vendido</div><div className="metric-value">{kpis ? fmtCompactCurrency(kpis.combustivel?.valor) : '—'}<span className="trend positive"><TrendingUp size={16} />no período</span></div><div className="metric-sublabel">quebra por hora</div></div></div>
        <ResponsiveContainer width="100%" height={smallChartHeight}>
          <BarChart data={hourlyChart} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} vertical={false} />
            <XAxis dataKey="hour" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={isCompactDashboard ? 5 : 3} />
            <YAxis hide />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
            <Bar dataKey="value" fill={DASHBOARD_COLORS.sale} radius={[6, 6, 0, 0]}>{showDenseValueLabels && <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...CHART_LABEL_STYLE} fontSize={9} />}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    weekly: (
      <div className="chart-card">
        <div className="card-header"><h3>VENDAS P/SEMANA</h3></div>
        <div className="metric-display"><div className="metric-icon-box"><Calendar size={20} /></div><div className="metric-info"><div className="metric-label">Valor de combustível vendido</div><div className="metric-value">{fmtCompactCurrency(monthlyTotal)}<span className="trend positive"><TrendingUp size={16} />no período</span></div><div className="metric-sublabel">Semana 1, 2, 3 e 4</div></div></div>
        <ResponsiveContainer width="100%" height={smallChartHeight}>
          <AreaChart data={weeklyChart} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={DASHBOARD_COLORS.sale} stopOpacity={0.8}/><stop offset="95%" stopColor={DASHBOARD_COLORS.sale} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} vertical={false} />
            <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} />
            <YAxis hide />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
            <Area type="monotone" dataKey="value" stroke={DASHBOARD_COLORS.sale} fillOpacity={1} fill="url(#colorWeekly)"><LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...CHART_LABEL_STYLE} fontSize={isCompactDashboard ? 9 : 10} /></Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
    monthly: (
      <div className="chart-card">
        <div className="card-header"><h3>VENDAS P/MÊS</h3></div>
        <div className="metric-display"><div className="metric-icon-box"><BarChart2 size={20} /></div><div className="metric-info"><div className="metric-label">Valor de combustível vendido</div><div className="metric-value">{fmtCompactCurrency(monthlyTotal)}<span className="trend positive"><TrendingUp size={16} />no período</span></div><div className="metric-sublabel">total mensal de combustível</div></div></div>
        <ResponsiveContainer width="100%" height={smallChartHeight}>
          <AreaChart data={monthlyChart} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={DASHBOARD_COLORS.sale} stopOpacity={0.8}/><stop offset="95%" stopColor={DASHBOARD_COLORS.sale} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} vertical={false} />
            <YAxis hide />
            <Area type="monotone" dataKey="value" stroke={DASHBOARD_COLORS.sale} fillOpacity={1} fill="url(#colorMonthly)">{showDenseValueLabels && <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...CHART_LABEL_STYLE} fontSize={9} />}</Area>
            <XAxis dataKey="day" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={isCompactDashboard ? 6 : 4} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
  };

  return (
    <div className="page-content">
      <div className="dashboard-controls">
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
      {loading && <LoadingState compact label="Atualizando dashboard..." />}
      {dashboardSections.kpis}
      <div className="dashboard-grid dashboard-static-grid">
        <div className="dashboard-static-full">{dashboardSections.salesFuel}</div>
        <div className="dashboard-static-full">{dashboardSections.stock}</div>
        <div className="dashboard-static-full">
          <ProjecaoVendas />
        </div>
        <div className="dashboard-static-full">
          <MetasRealizadoChart themeMode={themeMode} />
        </div>
        <div className="dashboard-static-full">
          <VendasPista clients={clients} selectedClient={selectedClient} selectedPeriod={selectedPeriod} themeMode={themeMode} />
        </div>
        <div className="dashboard-static-full">{dashboardSections.productMatrix}</div>
      </div>
    </div>
  );
};
// Reports Component

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
    toast('Nenhum registro encontrado para os filtros selecionados.', 'warn');
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
    toast('Permita pop-ups no navegador para gerar o PDF.', 'warn');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function getProductTypeLabel(tipoProd) {
  return String(tipoProd) === '1' ? 'Combustivel' : 'Produtos';
}

function getInitials(name) {
  const initials = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
  return initials || '--';
}

function getRankingBarColor(index) {
  return ['#22c55e', '#facc15', '#fb923c', '#ef4444', '#b91c1c'][index] || '#64748b';
}

function buildRankingSalesReportHtml({ report, filters, clientName, sellerLabel }) {
  const rows = Array.isArray(report?.ranking) ? report.ranking : [];
  if (!rows.length) {
    toast('Nenhuma venda encontrada para os filtros selecionados.', 'warn');
    return null;
  }

  const topRows = rows.slice(0, 5);
  const maxTotal = Math.max(...topRows.map(row => Number(row.totalVenda || 0)), 1);
  const periodLabel = `${formatFullDateBR(filters.dataInicial)} a ${formatFullDateBR(filters.dataFinal)}`;
  const typeLabel = getProductTypeLabel(filters.tipoProd);
  const generatedAt = new Date().toLocaleString('pt-BR');
  const totals = report.totais || rows.reduce((acc, row) => ({
    qtdVenda: acc.qtdVenda + Number(row.qtdVenda || 0),
    subtotalVenda: acc.subtotalVenda + Number(row.subtotalVenda || 0),
    totalVenda: acc.totalVenda + Number(row.totalVenda || 0),
  }), { qtdVenda: 0, subtotalVenda: 0, totalVenda: 0 });

  const chartRows = topRows.map((row, index) => {
    const width = Math.max(4, (Number(row.totalVenda || 0) / maxTotal) * 100);
    const color = getRankingBarColor(index);
    return `
      <div class="rank-row">
        <div class="rank-pos">${escapeHtml(row.posicaoVendedor || index + 1)}o</div>
        <div class="rank-person">
          <div class="avatar">${escapeHtml(getInitials(row.nomeVendedor))}</div>
          <div class="person-text">
            <strong>${escapeHtml(row.nomeVendedor)}</strong>
            <span>${escapeHtml(row.mesVenda || periodLabel)}</span>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%; background:${color};"></div>
        </div>
        <div class="bar-value">${escapeHtml(fmtBRL(row.totalVenda))}</div>
      </div>
    `;
  }).join('');

  const tableRows = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.posicaoVendedor)}</td>
      <td>${escapeHtml(row.mesVenda)}</td>
      <td>${escapeHtml(row.codVendedor)}</td>
      <td>${escapeHtml(row.nomeVendedor)}</td>
      <td class="num">${escapeHtml(fmtNum(row.qtdVenda, 3))}</td>
      <td class="num">${escapeHtml(fmtBRL(row.subtotalVenda))}</td>
      <td class="num">${escapeHtml(fmtBRL(row.totalVenda))}</td>
    </tr>
  `).join('');

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Relatorio Ranking de Vendas</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body, .report, .header, .panel, .summary-item, .mark, .bar-track, .bar-fill, table, th, td, tfoot td {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
    .report { min-height: 100vh; padding: 18px; background: #ffffff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 18px; border: 1px solid #e5e7eb; border-bottom: 3px solid #e31e24; border-radius: 8px; background: #ffffff; margin-bottom: 14px; }
    .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .mark { width: 44px; height: 44px; border-radius: 8px; background: #fff5f5; border: 1px solid #fecaca; display: grid; place-items: end center; padding: 8px; gap: 3px; grid-template-columns: repeat(3, 1fr); }
    .mark span { display: block; width: 7px; border-radius: 3px 3px 0 0; background: #e31e24; }
    .mark span:nth-child(1) { height: 14px; opacity: .75; }
    .mark span:nth-child(2) { height: 24px; }
    .mark span:nth-child(3) { height: 32px; opacity: .85; }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; line-height: 1.15; }
    .header-meta { color: #667085; font-size: 11px; line-height: 1.45; text-align: right; }
    .dashboard { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: 14px; align-items: stretch; }
    .panel { border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; padding: 18px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
    .panel-title { margin: 0; color: #111827; font-size: 14px; font-weight: 800; }
    .pill { border: 1px solid #d0d5dd; border-radius: 8px; color: #344054; padding: 8px 10px; font-size: 10px; font-weight: 800; white-space: nowrap; background: #f9fafb; }
    .rank-list { display: grid; gap: 16px; }
    .rank-row { display: grid; grid-template-columns: 46px minmax(180px, 230px) minmax(160px, 1fr) 118px; align-items: center; gap: 12px; min-height: 52px; }
    .rank-pos { color: #111827; font-size: 22px; font-weight: 900; }
    .rank-person { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; background: #475467; border: 2px solid #d1d5db; font-size: 12px; font-weight: 900; flex: 0 0 auto; }
    .person-text { min-width: 0; }
    .person-text strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #111827; }
    .person-text span { display: block; margin-top: 4px; color: #667085; font-size: 10px; font-weight: 700; }
    .bar-track { height: 38px; background: #e5e7eb; border-radius: 0; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 0; }
    .bar-value { color: #111827; font-size: 12px; font-weight: 900; text-align: right; white-space: nowrap; }
    .summary-grid { display: grid; gap: 12px; }
    .summary-item { border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; padding: 14px; }
    .summary-item span { display: block; color: #667085; font-size: 10px; font-weight: 800; margin-bottom: 8px; }
    .summary-item strong { display: block; color: #111827; font-size: 20px; line-height: 1.15; }
    .details { margin-top: 14px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
    th, td { border: 1px solid #d0d5dd; padding: 7px; word-break: break-word; }
    th { background: #e31e24; color: #ffffff; text-align: left; font-size: 9px; }
    td { color: #111827; background: #ffffff; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { color: #111827; background: #f3f4f6; font-weight: 900; }
    .footer { margin-top: 10px; color: #667085; font-size: 10px; text-align: right; }
    @media screen {
      body { background: #f3f4f6; padding: 18px; }
      .report { max-width: 1180px; min-height: auto; margin: 0 auto; box-shadow: 0 18px 50px rgba(15,23,42,.12); }
    }
    @media print {
      .panel, .header, tr { break-inside: avoid; page-break-inside: avoid; }
      body { background: #ffffff !important; }
      .report { background: #ffffff !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <main class="report">
    <section class="header">
      <div class="header-left">
        <div class="mark">🎯</div>
        <div>
          <h1>RELATORIO RANKING DE VENDAS</h1>
          <div class="header-meta" style="text-align:left;">${escapeHtml(clientName || 'Cliente')} | ${escapeHtml(periodLabel)}</div>
        </div>
      </div>
      <div class="header-meta">
        <div>Tipo de produto: ${escapeHtml(typeLabel)}</div>
        <div>Vendedores: ${escapeHtml(sellerLabel || 'Todos')}</div>
        <div>Gerado em ${escapeHtml(generatedAt)}</div>
      </div>
    </section>

    <section class="dashboard">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">RANKING TOP 5 - VENDAS</h2>
          <div class="pill">TIPO DE PRODUTO - ${escapeHtml(typeLabel.toUpperCase())}</div>
        </div>
        <div class="rank-list">${chartRows}</div>
      </div>

      <aside class="panel">
        <div class="panel-head">
          <h2 class="panel-title">RESUMO</h2>
        </div>
        <div class="summary-grid">
          <div class="summary-item"><span>VENDEDORES NO RANKING</span><strong>${escapeHtml(rows.length)}</strong></div>
          <div class="summary-item"><span>QTD. VENDIDA</span><strong>${escapeHtml(fmtNum(totals.qtdVenda, 3))}</strong></div>
          <div class="summary-item"><span>TOTAL VENDIDO</span><strong>${escapeHtml(fmtBRL(totals.totalVenda))}</strong></div>
        </div>
      </aside>
    </section>

    <section class="panel details">
      <div class="panel-head">
        <h2 class="panel-title">DETALHAMENTO</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:46px;">POS.</th>
            <th style="width:78px;">MES</th>
            <th style="width:74px;">COD.</th>
            <th>VENDEDOR</th>
            <th class="num">QTD.</th>
            <th class="num">SUBTOTAL</th>
            <th class="num">TOTAL</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="4">TOTAL DO PERIODO</td>
            <td class="num">${escapeHtml(fmtNum(totals.qtdVenda, 3))}</td>
            <td class="num">${escapeHtml(fmtBRL(totals.subtotalVenda))}</td>
            <td class="num">${escapeHtml(fmtBRL(totals.totalVenda))}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    <footer class="footer">STARVL | Relatorio Ranking de Vendas</footer>
  </main>
</body>
</html>`;

  return html;
}

function exportRankingSalesReport({ report, filters, clientName, sellerLabel }) {
  const html = buildRankingSalesReportHtml({ report, filters, clientName, sellerLabel });
  if (!html) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html.replace('</body>', `
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 500);
      });
    </script>
  </body>`));
  printWindow.document.close();
}

// ── Margem por Combustível e Produtos — dados + print ───────────────────────
const _MARGEM_BASE = [
  { cod: '101', desc: 'Gasolina Comum',        cat: 'Bomba', custBase:  5.20, frete: 0.05, st: 0.45, venda:  5.99, volMensal: 45000, unid: 'L'  },
  { cod: '102', desc: 'Gasolina Aditivada',    cat: 'Bomba', custBase:  5.40, frete: 0.05, st: 0.45, venda:  6.29, volMensal: 12000, unid: 'L'  },
  { cod: '103', desc: 'Etanol Hidratado',      cat: 'Bomba', custBase:  3.40, frete: 0.04, st: 0.18, venda:  3.99, volMensal: 18000, unid: 'L'  },
  { cod: '104', desc: 'Diesel S10',            cat: 'Bomba', custBase:  5.82, frete: 0.06, st: 0.55, venda:  6.49, volMensal: 32000, unid: 'L'  },
  { cod: '105', desc: 'Diesel S500',           cat: 'Bomba', custBase:  5.65, frete: 0.06, st: 0.50, venda:  6.29, volMensal:  8000, unid: 'L'  },
  { cod: '201', desc: 'Água Mineral 500ml',    cat: 'Loja',  custBase:  0.85, frete: 0.10, st: 0.05, venda:  3.50, volMensal:   420, unid: 'un' },
  { cod: '202', desc: 'Café Espresso (dose)',  cat: 'Loja',  custBase:  0.45, frete: 0.00, st: 0.00, venda:  3.00, volMensal:   850, unid: 'un' },
  { cod: '203', desc: 'Lubrificante 5W-30 1L', cat: 'Loja',  custBase: 18.50, frete: 0.50, st: 1.20, venda: 34.90, volMensal:    95, unid: 'un' },
];

function _computeMargemRows({ categoria, dataInicial, dataFinal, ordenacao }) {
  // Calcula fator de volume a partir do intervalo de datas
  let fator = 1;
  if (dataInicial && dataFinal) {
    const dias = Math.max(1, (new Date(dataFinal) - new Date(dataInicial)) / 86400000 + 1);
    fator = dias / 30;
  }
  const rows = _MARGEM_BASE
    .filter(p => categoria === 'Todos' || p.cat === categoria)
    .map(p => {
      const custTotal   = p.custBase + p.frete + p.st;
      const margemUnit  = p.venda - custTotal;
      const margemPct   = p.venda > 0 ? (margemUnit / p.venda) * 100 : 0;
      const volume      = Math.round(p.volMensal * fator);
      const margemTotal = margemUnit * volume;
      return { ...p, custTotal, margemUnit, margemPct, volume, margemTotal };
    });
  const sortKey = ordenacao === 'margemPct' ? 'margemPct' : ordenacao === 'volume' ? 'volume' : 'margemTotal';
  rows.sort((a, b) => b[sortKey] - a[sortKey]);
  return rows;
}

function buildMargemReportHtml({ filters, clientName }) {
  const rows = _computeMargemRows(filters);
  if (!rows.length) {
    toast('Nenhum produto encontrado para os filtros selecionados.', 'warn');
    return null;
  }

  const e = escapeHtml;
  const fmt2 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = v => Math.round(v).toLocaleString('pt-BR');
  const fmtR = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const margemCor = pct => pct < 10 ? '#ef4444' : pct < 20 ? '#f59e0b' : '#22c55e';

  const totMargemTotal  = rows.reduce((s, r) => s + r.margemTotal, 0);
  const totReceita      = rows.reduce((s, r) => s + r.venda * r.volume, 0);
  const margemPonderada = totReceita > 0 ? (totMargemTotal / totReceita) * 100 : 0;
  const catLabel        = filters.categoria === 'Todos' ? 'Todos os produtos' : `${filters.categoria} (${filters.categoria === 'Bomba' ? 'Pista' : 'Conveniência'})`;
  const periodLabel     = filters.dataInicial && filters.dataFinal
    ? `${formatFullDateBR(filters.dataInicial)} a ${formatFullDateBR(filters.dataFinal)}`
    : 'Período completo';
  const generatedAt = new Date().toLocaleString('pt-BR');

  // KPI cards
  const kpis = [
    { label: 'PRODUTOS',            value: e(rows.length) },
    { label: 'MARGEM MÉDIA POND.',  value: e(margemPonderada.toFixed(1) + '%') },
    { label: 'MARGEM TOTAL',        value: e(fmtR(totMargemTotal)) },
    { label: 'RECEITA TOTAL',       value: e(fmtR(totReceita)) },
  ];
  const kpiHtml = kpis.map(k => `
    <div class="summary-item"><span>${k.label}</span><strong>${k.value}</strong></div>
  `).join('');

  const tableRows = rows.map((row, i) => {
    const cor = margemCor(row.margemPct);
    const barW = Math.min(100, Math.max(0, row.margemPct));
    return `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="font-family:monospace;font-weight:700;font-size:10px">${e(row.cod)}</td>
      <td>${e(row.cat === 'Bomba' ? '🔵' : '🟡')} ${e(row.desc)}</td>
      <td class="num">R$ ${e(fmt2(row.custBase))}</td>
      <td class="num">R$ ${e(fmt2(row.frete))}</td>
      <td class="num" style="color:#dc2626">R$ ${e(fmt2(row.st))}</td>
      <td class="num" style="font-weight:700">R$ ${e(fmt2(row.custTotal))}</td>
      <td class="num">R$ ${e(fmt2(row.venda))}</td>
      <td class="num" style="font-weight:700;color:${row.margemUnit >= 0 ? '#059669' : '#ef4444'}">${row.margemUnit >= 0 ? '+' : ''}R$ ${e(fmt2(row.margemUnit))}</td>
      <td class="num">
        <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
          <div style="width:52px;height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden;flex-shrink:0">
            <div style="height:100%;width:${barW}%;background:${cor};border-radius:4px"></div>
          </div>
          <span style="font-weight:800;color:${cor};min-width:36px;text-align:right">${e(row.margemPct.toFixed(1))}%</span>
        </div>
      </td>
      <td class="num">${e(fmt0(row.volume))} ${e(row.unid)}</td>
      <td class="num" style="font-weight:900;color:${row.margemTotal >= 0 ? '#059669' : '#ef4444'}">${e(fmtR(row.margemTotal))}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="color-scheme" content="light"/>
  <title>Relatorio Margem por Combustivel e Produtos</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body, .report, .header, .panel, .summary-item, table, th, td, tfoot td {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    :root { color-scheme: light only; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
    .report { min-height: 100vh; padding: 18px; background: #ffffff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 18px; border: 1px solid #e5e7eb; border-bottom: 3px solid #e31e24; border-radius: 8px; background: #ffffff; margin-bottom: 14px; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .mark { width: 44px; height: 44px; border-radius: 8px; background: #fff5f5; border: 1px solid #fecaca; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
    h1 { margin: 0; font-size: 20px; line-height: 1.15; }
    .header-meta { color: #667085; font-size: 11px; line-height: 1.55; text-align: right; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
    .summary-item { border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; padding: 14px; }
    .summary-item span { display: block; color: #667085; font-size: 9px; font-weight: 800; margin-bottom: 6px; }
    .summary-item strong { display: block; color: #111827; font-size: 18px; line-height: 1.15; }
    .panel { border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; padding: 16px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .panel-title { margin: 0; color: #111827; font-size: 14px; font-weight: 800; }
    .pill { border: 1px solid #d0d5dd; border-radius: 8px; color: #344054; padding: 6px 10px; font-size: 10px; font-weight: 800; white-space: nowrap; background: #f9fafb; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th, td { border: 1px solid #d0d5dd; padding: 6px 8px; word-break: break-word; }
    th { background: #e31e24 !important; color: #ffffff; font-size: 9px; font-weight: 700; text-align: left; }
    td { color: #111827; background: inherit; }
    td.num, th.num { text-align: right; }
    tfoot td { color: #111827; background: #f3f4f6 !important; font-weight: 900; }
    .footer { margin-top: 10px; color: #667085; font-size: 10px; text-align: right; }
    @media screen { body { background: #f3f4f6; padding: 18px; } .report { max-width: 1200px; margin: 0 auto; box-shadow: 0 18px 50px rgba(15,23,42,.12); } }
    @media print {
      body, html, .report, .panel, .header, .summary-item { background: #ffffff !important; color-scheme: light !important; }
      th { background: #e31e24 !important; color: #ffffff !important; }
      tfoot td { background: #f3f4f6 !important; }
    }
  </style>
</head>
<body>
<main class="report">
  <section class="header">
    <div class="header-left">
      <div class="mark">📊</div>
      <div>
        <h1>MARGEM POR COMBUSTIVEL E PRODUTOS</h1>
        <div class="header-meta" style="text-align:left">${e(clientName || 'Cliente')} | ${e(periodLabel)}</div>
      </div>
    </div>
    <div class="header-meta">
      <div>Categoria: ${e(catLabel)}</div>
      <div>Fórmula: Custo Total = NF + Frete + ST</div>
      <div>Gerado em ${e(generatedAt)}</div>
    </div>
  </section>

  <div class="summary-grid">${kpiHtml}</div>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">DETALHAMENTO — MARGENS POR PRODUTO</h2>
      <div class="pill">${e(catLabel.toUpperCase())} · ${e(periodLabel)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:46px">COD.</th>
          <th style="min-width:140px">DESCRIÇÃO</th>
          <th class="num">CUSTO BASE (R$)</th>
          <th class="num">FRETE UNIT. (R$)</th>
          <th class="num">ST (R$)</th>
          <th class="num">CUSTO TOTAL (R$)</th>
          <th class="num">VENDA (R$)</th>
          <th class="num">MG. UNIT. (R$)</th>
          <th class="num" style="min-width:100px">MG. UNIT. (%)</th>
          <th class="num">VOLUME</th>
          <th class="num">MG. TOTAL (R$)</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="8">PORTFÓLIO — ${e(rows.length)} produto${rows.length !== 1 ? 's' : ''} · Margem média ponderada</td>
          <td class="num" style="font-weight:900;color:${margemCor(margemPonderada)}">${e(margemPonderada.toFixed(1))}%</td>
          <td></td>
          <td class="num" style="font-weight:900;color:${totMargemTotal >= 0 ? '#059669' : '#ef4444'}">${e(fmtR(totMargemTotal))}</td>
        </tr>
      </tfoot>
    </table>
  </section>

  <footer class="footer">STARVL | Relatório de Margem por Combustível e Produtos</footer>
</main>
</body>
</html>`;
}

function exportMargemReport({ filters, clientName }) {
  const html = buildMargemReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', `
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 500);
      });
    </script>
  </body>`));
  w.document.close();
}

const MargemFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const upd = field => e => setFilters(prev => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={ev => ev.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>FILTROS — MARGEM POR COMBUSTÍVEL E PRODUTOS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">

            {/* Período */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Calendar size={20} /><span>PERÍODO</span>
              </div>
              <div className="control-print-date-row">
                <label className="control-print-field">
                  <span>DATA INICIAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataInicial} onChange={upd('dataInicial')} />
                    <Calendar size={19} />
                  </div>
                </label>
                <label className="control-print-field">
                  <span>DATA FINAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataFinal} onChange={upd('dataFinal')} />
                    <Calendar size={19} />
                  </div>
                </label>
              </div>
            </section>

            {/* Categoria */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Package size={20} /><span>CATEGORIA</span>
              </div>
              {[['Todos','Combustíveis + Conveniência','Todos os produtos'], ['Bomba','Apenas combustíveis (pista)','Gasolina, Diesel, Etanol'], ['Loja','Apenas conveniência','Alimentos, lubrificantes']].map(([val, strong, sub]) => (
                <label key={val} className={`control-print-option ${filters.categoria === val ? 'selected' : ''}`}>
                  <TrendingUp size={26} />
                  <div><strong>{strong}</strong><span>{sub}</span></div>
                  <input type="radio" name="margemCat" value={val} checked={filters.categoria === val} onChange={upd('categoria')} />
                </label>
              ))}
            </section>

          </div>

          {/* Ordenação */}
          <section className="control-print-section">
            <div className="control-print-section-title">
              <BarChart2 size={20} /><span>ORDENAÇÃO DA TABELA</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {[['margemTotal','Margem Total (R$)'],['margemPct','Margem % (decrescente)'],['volume','Volume vendido']].map(([val, label]) => (
                <label key={val} className={`control-print-option ${filters.ordenacao === val ? 'selected' : ''}`} style={{ flex: '1 1 180px' }}>
                  <div><strong>{label}</strong></div>
                  <input type="radio" name="margemOrd" value={val} checked={filters.ordenacao === val} onChange={upd('ordenacao')} />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>
            <X size={20} /> CANCELAR
          </button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={20} /> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Margem por Combustível e Produtos ────────────────────────────────────

// ── Conciliação de Cartões e Taxas — dados + print ───────────────────────────
const _CONCIL_BASE = [
  { id:'C001', dataVenda:'2026-05-01', nsu:'123456789', adq:'Cielo',  band:'Visa',       mod:'Crédito', bruto:1250.00, txCont:2.5, txReal:2.5, dataDep:'2026-05-29', sitDep:'Depositado' },
  { id:'C002', dataVenda:'2026-05-02', nsu:'123456790', adq:'Cielo',  band:'Visa',       mod:'Débito',  bruto: 320.00, txCont:1.5, txReal:1.5, dataDep:'2026-05-04', sitDep:'Depositado' },
  { id:'C003', dataVenda:'2026-05-03', nsu:'123456791', adq:'Cielo',  band:'Mastercard', mod:'Crédito', bruto: 890.50, txCont:2.5, txReal:2.5, dataDep:'2026-05-31', sitDep:'A Receber'  },
  { id:'C004', dataVenda:'2026-05-05', nsu:'234567890', adq:'Stone',  band:'Mastercard', mod:'Crédito', bruto:2100.00, txCont:2.2, txReal:2.2, dataDep:'2026-05-20', sitDep:'Depositado' },
  { id:'C005', dataVenda:'2026-05-06', nsu:'234567891', adq:'Stone',  band:'Elo',        mod:'Débito',  bruto: 450.00, txCont:1.8, txReal:1.8, dataDep:'2026-05-08', sitDep:'Depositado' },
  { id:'C006', dataVenda:'2026-05-07', nsu:'234567892', adq:'Stone',  band:'Mastercard', mod:'Crédito', bruto: 750.00, txCont:2.2, txReal:2.2, dataDep:'2026-05-15', sitDep:'Atrasado'   },
  { id:'C007', dataVenda:'2026-05-08', nsu:'345678901', adq:'GetNet', band:'Visa',       mod:'Crédito', bruto:1800.00, txCont:2.3, txReal:2.3, dataDep:'2026-06-05', sitDep:'A Receber'  },
  { id:'C008', dataVenda:'2026-05-10', nsu:'345678902', adq:'GetNet', band:'Amex',       mod:'Crédito', bruto: 560.00, txCont:3.0, txReal:3.65,dataDep:'2026-06-08', sitDep:'A Receber'  }, // Divergência
  { id:'C009', dataVenda:'2026-05-12', nsu:'345678903', adq:'GetNet', band:'Visa',       mod:'Débito',  bruto: 230.00, txCont:1.6, txReal:1.6, dataDep:'2026-05-14', sitDep:'Depositado' },
  { id:'C010', dataVenda:'2026-05-13', nsu:'456789012', adq:'Rede',   band:'Elo',        mod:'Crédito', bruto:3200.00, txCont:2.4, txReal:2.4, dataDep:'2026-06-10', sitDep:'A Receber'  },
  { id:'C011', dataVenda:'2026-05-15', nsu:'456789013', adq:'Rede',   band:'Mastercard', mod:'Débito',  bruto: 180.00, txCont:1.7, txReal:1.7, dataDep:'2026-05-17', sitDep:'Atrasado'   },
  { id:'C012', dataVenda:'2026-05-16', nsu:'456789014', adq:'Rede',   band:'Elo',        mod:'Crédito', bruto: 980.00, txCont:2.4, txReal:2.95,dataDep:'2026-06-13', sitDep:'A Receber'  }, // Divergência
  { id:'C013', dataVenda:'2026-05-18', nsu:'567890123', adq:'Cielo',  band:'Amex',       mod:'Crédito', bruto:4500.00, txCont:3.2, txReal:3.2, dataDep:'2026-06-15', sitDep:'A Receber'  },
  { id:'C014', dataVenda:'2026-05-20', nsu:'567890124', adq:'Stone',  band:'Visa',       mod:'Crédito', bruto: 670.00, txCont:2.2, txReal:2.55,dataDep:'2026-05-15', sitDep:'Atrasado'   }, // Divergência + Atrasado
  { id:'C015', dataVenda:'2026-05-22', nsu:'678901234', adq:'Cielo',  band:'Mastercard', mod:'Débito',  bruto: 290.00, txCont:1.5, txReal:1.5, dataDep:'2026-05-24', sitDep:'Depositado' },
];

function _computeConcilRows({ adquirente, bandeira, modalidade, dataInicial, dataFinal }) {
  return _CONCIL_BASE.filter(r => {
    if (adquirente !== 'Todos' && r.adq !== adquirente) return false;
    if (bandeira   !== 'Todos' && r.band !== bandeira)  return false;
    if (modalidade !== 'Todos' && r.mod  !== modalidade) return false;
    if (dataInicial && r.dataDep < dataInicial) return false;
    if (dataFinal   && r.dataDep > dataFinal)   return false;
    return true;
  }).map(r => {
    const hasDiverg = Math.abs(r.txReal - r.txCont) > 0.01;
    const desconto  = parseFloat((r.bruto * r.txReal  / 100).toFixed(2));
    const liquido   = parseFloat((r.bruto - desconto).toFixed(2));
    let status = 'A Receber';
    if (hasDiverg && r.sitDep === 'Atrasado') status = 'Divergência de Taxa';
    else if (hasDiverg) status = 'Divergência de Taxa';
    else if (r.sitDep === 'Atrasado') status = 'Depósito Atrasado';
    else status = r.sitDep; // 'Depositado' | 'A Receber'
    return { ...r, desconto, liquido, status, hasDiverg };
  });
}

function buildConciliacaoReportHtml({ filters, clientName }) {
  const rows = _computeConcilRows(filters);
  if (!rows.length) {
    toast('Nenhuma transação encontrada para os filtros selecionados.', 'warn');
    return null;
  }

  const e = escapeHtml;
  const fmtR = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD = s => { if (!s) return '-'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const generatedAt = new Date().toLocaleString('pt-BR');

  const totBruto      = rows.reduce((s, r) => s + r.bruto, 0);
  const totDesconto   = rows.reduce((s, r) => s + r.desconto, 0);
  const totLiquido    = rows.reduce((s, r) => s + r.liquido, 0);
  const totDepositado = rows.filter(r => r.status === 'Depositado').reduce((s, r) => s + r.liquido, 0);
  const nDiverg  = rows.filter(r => r.status === 'Divergência de Taxa').length;
  const nAtrasado = rows.filter(r => r.status === 'Depósito Atrasado').length;

  const periodLabel = filters.dataInicial && filters.dataFinal
    ? `Depósito ${fmtD(filters.dataInicial)} a ${fmtD(filters.dataFinal)}`
    : 'Período completo';

  const STATUS_MAP = {
    'Depositado':          { icon: '✅', color: '#059669', bg: '#d1fae5' },
    'A Receber':           { icon: '🕐', color: '#2563eb', bg: '#dbeafe' },
    'Divergência de Taxa': { icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
    'Depósito Atrasado':   { icon: '🔴', color: '#dc2626', bg: '#fee2e2' },
  };

  const tableRows = rows.map((row, i) => {
    const sm = STATUS_MAP[row.status] || STATUS_MAP['A Receber'];
    const isDiverg = row.hasDiverg;
    const isAtrasado = row.status === 'Depósito Atrasado';
    const rowBg = isDiverg || isAtrasado ? 'rgba(239,68,68,.07)' : i % 2 === 0 ? '#fff' : '#f9fafb';
    const txColor = isDiverg ? '#dc2626' : '#111827';
    return `
    <tr style="background:${rowBg}">
      <td>${e(fmtD(row.dataVenda))}</td>
      <td style="font-family:monospace;font-size:9px">${e(row.nsu)}</td>
      <td><strong>${e(row.adq)}</strong></td>
      <td>${e(row.band)}</td>
      <td>${e(row.mod)}</td>
      <td class="num">${e(fmtR(row.bruto))}</td>
      <td class="num" style="color:${txColor};font-weight:${isDiverg?700:400}">${e(row.txCont.toFixed(2))}%${isDiverg ? ` ⚠️ (real: ${e(row.txReal.toFixed(2))}%)` : ''}</td>
      <td class="num" style="color:${isDiverg?'#dc2626':'#111827'};font-weight:${isDiverg?700:400}">${e(fmtR(row.desconto))}</td>
      <td class="num">${e(fmtR(row.liquido))}</td>
      <td style="color:${isAtrasado?'#dc2626':'#374151'};font-weight:${isAtrasado?700:400}">${e(fmtD(row.dataDep))}</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700;background:${sm.bg};color:${sm.color};white-space:nowrap">${sm.icon} ${e(row.status)}</span></td>
    </tr>`;
  }).join('');

  const kpis = [
    { label: 'TRANSAÇÕES',      value: e(rows.length) },
    { label: 'TOTAL BRUTO',     value: e(fmtR(totBruto)) },
    { label: 'TOTAL TAXAS',     value: e(fmtR(totDesconto)) },
    { label: 'TOTAL LÍQUIDO',   value: e(fmtR(totLiquido)) },
    { label: 'JÁ DEPOSITADO',   value: e(fmtR(totDepositado)) },
    { label: 'DIVERGÊNCIAS',    value: e(nDiverg),  alert: nDiverg > 0 },
    { label: 'EM ATRASO',       value: e(nAtrasado), alert: nAtrasado > 0 },
  ];
  const kpiHtml = kpis.map(k => `
    <div class="summary-item${k.alert ? ' summary-alert' : ''}">
      <span>${k.label}</span><strong>${k.value}</strong>
    </div>`).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="color-scheme" content="light"/>
  <title>Relatorio Conciliacao de Cartoes e Taxas</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body, .report, .header, .panel, .summary-item, table, th, td, tfoot td {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    :root { color-scheme: light only; }
    body { margin:0; font-family:Arial,Helvetica,sans-serif; color:#111827; background:#fff; }
    .report { min-height:100vh; padding:18px; background:#fff; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 18px; border:1px solid #e5e7eb; border-bottom:3px solid #e31e24; border-radius:8px; background:#fff; margin-bottom:14px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .mark { width:44px; height:44px; border-radius:8px; background:#fff5f5; border:1px solid #fecaca; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    h1 { margin:0; font-size:19px; line-height:1.15; }
    .header-meta { color:#667085; font-size:11px; line-height:1.55; text-align:right; }
    .summary-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:10px; margin-bottom:14px; }
    .summary-item { border:1px solid #e5e7eb; border-radius:8px; background:#f9fafb; padding:10px 12px; }
    .summary-item.summary-alert { border-color:#fca5a5; background:#fef2f2; }
    .summary-item span { display:block; color:#667085; font-size:8px; font-weight:800; margin-bottom:5px; }
    .summary-item strong { display:block; color:#111827; font-size:15px; font-weight:900; line-height:1.1; }
    .summary-alert strong { color:#dc2626; }
    .panel { border:1px solid #e5e7eb; border-radius:8px; background:#fff; padding:16px; }
    .panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .panel-title { margin:0; color:#111827; font-size:13px; font-weight:800; }
    .pill { border:1px solid #d0d5dd; border-radius:8px; color:#344054; padding:5px 9px; font-size:9px; font-weight:800; white-space:nowrap; background:#f9fafb; }
    table { width:100%; border-collapse:collapse; font-size:9px; }
    th, td { border:1px solid #d0d5dd; padding:5px 7px; word-break:break-word; }
    th { background:#e31e24 !important; color:#fff; font-size:8.5px; font-weight:700; text-align:left; }
    td { color:#111827; background:inherit; }
    td.num, th.num { text-align:right; }
    tfoot td { color:#111827; background:#f3f4f6 !important; font-weight:900; font-size:9px; }
    .footer { margin-top:10px; color:#667085; font-size:10px; text-align:right; }
    @media screen { body { background:#f3f4f6; padding:18px; } .report { max-width:1280px; margin:0 auto; box-shadow:0 18px 50px rgba(15,23,42,.12); } }
    @media print {
      body, html, .report, .panel, .header, .summary-item { background:#fff !important; color-scheme:light !important; }
      th { background:#e31e24 !important; color:#fff !important; }
      tfoot td { background:#f3f4f6 !important; }
      .summary-alert { background:#fef2f2 !important; border-color:#fca5a5 !important; }
    }
  </style>
</head>
<body>
<main class="report">
  <section class="header">
    <div class="header-left">
      <div class="mark">💳</div>
      <div>
        <h1>CONCILIAÇÃO DE CARTÕES E TAXAS</h1>
        <div class="header-meta" style="text-align:left">${e(clientName || 'Cliente')} | ${e(periodLabel)}</div>
      </div>
    </div>
    <div class="header-meta">
      <div>Adquirente: ${e(filters.adquirente)} · Bandeira: ${e(filters.bandeira)} · Modalidade: ${e(filters.modalidade)}</div>
      <div>Lógica: taxa contratada × taxa cobrada — divergências destacadas em vermelho</div>
      <div>Gerado em ${e(generatedAt)}</div>
    </div>
  </section>

  <div class="summary-grid">${kpiHtml}</div>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">DETALHAMENTO DAS TRANSAÇÕES</h2>
      <div class="pill">${e(rows.length)} transaç${rows.length !== 1 ? 'ões' : 'ão'} · ${e(periodLabel)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>DATA VENDA</th>
          <th>NSU</th>
          <th>ADQUIRENTE</th>
          <th>BANDEIRA</th>
          <th>MODALIDADE</th>
          <th class="num">VALOR BRUTO (R$)</th>
          <th class="num">TAXA CONT. (%)</th>
          <th class="num">DESCONTO (R$)</th>
          <th class="num">LÍQUIDO PREV. (R$)</th>
          <th>DATA DEPÓSITO</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5">TOTAIS — ${e(rows.length)} transaç${rows.length !== 1 ? 'ões' : 'ão'}</td>
          <td class="num">${e(fmtR(totBruto))}</td>
          <td></td>
          <td class="num">${e(fmtR(totDesconto))}</td>
          <td class="num">${e(fmtR(totLiquido))}</td>
          <td></td>
          <td>Depositado: ${e(fmtR(totDepositado))}</td>
        </tr>
      </tfoot>
    </table>
  </section>

  <footer class="footer">STARVL | Relatório de Conciliação de Cartões e Taxas</footer>
</main>
</body>
</html>`;
}

function exportConciliacaoReport({ filters, clientName }) {
  const html = buildConciliacaoReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', `
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 500);
      });
    </script>
  </body>`));
  w.document.close();
}

const ConciliacaoFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const upd = field => e => setFilters(prev => ({ ...prev, [field]: e.target.value }));
  const ADQ  = ['Todos','Cielo','Stone','GetNet','Rede'];
  const BAND = ['Todos','Visa','Mastercard','Elo','Amex'];
  const MOD  = ['Todos','Crédito','Débito'];

  const TogRow = ({ field, values, current }) => (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
      {values.map(v => (
        <label key={v} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
          background: current === v ? '#E31E24' : 'transparent',
          border: `1px solid ${current === v ? '#E31E24' : '#374151'}`,
          borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
          color: current === v ? '#fff' : '#d1d5db', transition:'all .15s' }}>
          <input type="radio" name={field} value={v} checked={current === v} onChange={upd(field)} style={{ display:'none' }} />
          {v}
        </label>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={ev => ev.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>FILTROS — CONCILIAÇÃO DE CARTÕES E TAXAS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">

            {/* Período */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Calendar size={20} /><span>DATA PREVISTA DE DEPÓSITO</span>
              </div>
              <div className="control-print-date-row">
                <label className="control-print-field">
                  <span>DATA INICIAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataInicial} onChange={upd('dataInicial')} />
                    <Calendar size={19} />
                  </div>
                </label>
                <label className="control-print-field">
                  <span>DATA FINAL</span>
                  <div className="control-print-input">
                    <input type="date" value={filters.dataFinal} onChange={upd('dataFinal')} />
                    <Calendar size={19} />
                  </div>
                </label>
              </div>
            </section>

            {/* Modalidade */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Package size={20} /><span>MODALIDADE</span>
              </div>
              <TogRow field="modalidade" values={MOD} current={filters.modalidade} />
            </section>

          </div>

          {/* Adquirente */}
          <section className="control-print-section" style={{ marginTop:16 }}>
            <div className="control-print-section-title">
              <BarChart2 size={20} /><span>ADQUIRENTE</span>
            </div>
            <TogRow field="adquirente" values={ADQ} current={filters.adquirente} />
          </section>

          {/* Bandeira */}
          <section className="control-print-section" style={{ marginTop:16 }}>
            <div className="control-print-section-title">
              <TrendingUp size={20} /><span>BANDEIRA</span>
            </div>
            <TogRow field="bandeira" values={BAND} current={filters.bandeira} />
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>
            <X size={20} /> CANCELAR
          </button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={20} /> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Conciliação de Cartões e Taxas ───────────────────────────────────────

// ── Vendas a Prazo e Controle CNPJ ───────────────────────────────────────────
const _CNPJ_BASE = [
  {
    id:'P001', razao:'Transportes ABC Ltda',     cnpj:'12.345.678/0001-90',
    limiteTotal:50000, limiteUsado:45000, nfs:12, saldoDevedor:38500, fatMensal:15000,
    aging:{ aVencer:5000,  v1a7:8500,  v8a15:12000, v16a30:8000, v30mais:5000 },
  },
  {
    id:'P002', razao:'Posto Estrela Azul ME',    cnpj:'23.456.789/0001-01',
    limiteTotal:20000, limiteUsado:8500,  nfs:5,  saldoDevedor:8500,  fatMensal:8500,
    aging:{ aVencer:8500,  v1a7:0,     v8a15:0,     v16a30:0,    v30mais:0    },
  },
  {
    id:'P003', razao:'Agropecuária Santa Cruz',  cnpj:'34.567.890/0001-12',
    limiteTotal:80000, limiteUsado:62000, nfs:18, saldoDevedor:55000, fatMensal:22000,
    aging:{ aVencer:30000, v1a7:12000, v8a15:8000,  v16a30:5000, v30mais:0    },
  },
  {
    id:'P004', razao:'Construtora Horizonte SA', cnpj:'45.678.901/0001-23',
    limiteTotal:35000, limiteUsado:31500, nfs:8,  saldoDevedor:28000, fatMensal:18000,
    aging:{ aVencer:8000,  v1a7:5000,  v8a15:8000,  v16a30:4000, v30mais:3000 },
  },
  {
    id:'P005', razao:'Mercado São João Ltda',    cnpj:'56.789.012/0001-34',
    limiteTotal:15000, limiteUsado:4200,  nfs:3,  saldoDevedor:4200,  fatMensal:4200,
    aging:{ aVencer:4200,  v1a7:0,     v8a15:0,     v16a30:0,    v30mais:0    },
  },
  {
    id:'P006', razao:'Distribuidora Vitória ME', cnpj:'67.890.123/0001-45',
    limiteTotal:60000, limiteUsado:48000, nfs:14, saldoDevedor:42000, fatMensal:19500,
    aging:{ aVencer:15000, v1a7:9000,  v8a15:10000, v16a30:8000, v30mais:0    },
  },
];

function _getClientRisk(r) {
  const pct = r.limiteUsado / r.limiteTotal;
  if (pct >= 0.85 || r.aging.v30mais > 0) return 'Bloqueio';
  const anyLate = r.aging.v1a7 + r.aging.v8a15 + r.aging.v16a30 + r.aging.v30mais;
  if (pct >= 0.70 || anyLate > 0) return 'Atenção';
  return 'Regular';
}

function _computeCnpjRows({ search, periodo }) {
  const q = (search || '').toLowerCase().trim();
  return _CNPJ_BASE
    .filter(r => !q || r.razao.toLowerCase().includes(q) || r.cnpj.includes(q))
    .map(r => {
      const faturamento  = periodo === 'Trimestral' ? r.fatMensal * 3 : r.fatMensal;
      const pct          = r.limiteUsado / r.limiteTotal;
      const status       = _getClientRisk(r);
      const totalVencido = r.aging.v1a7 + r.aging.v8a15 + r.aging.v16a30 + r.aging.v30mais;
      return { ...r, faturamento, pct, status, totalVencido };
    });
}

function buildCnpjReportHtml({ filters, clientName }) {
  const rows = _computeCnpjRows(filters);
  if (!rows.length) {
    toast('Nenhum cliente encontrado para os filtros selecionados.', 'warn');
    return null;
  }

  const e   = escapeHtml;
  const fmtR = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const pctFmt = v => (v * 100).toFixed(1) + '%';
  const generatedAt = new Date().toLocaleString('pt-BR');
  const periLabel = filters.periodo === 'Trimestral' ? 'Trimestral' : 'Mensal';

  const totFat     = rows.reduce((s,r) => s + r.faturamento, 0);
  const totLimite  = rows.reduce((s,r) => s + r.limiteTotal, 0);
  const totUsado   = rows.reduce((s,r) => s + r.limiteUsado, 0);
  const totSaldo   = rows.reduce((s,r) => s + r.saldoDevedor, 0);
  const nBloqueio  = rows.filter(r => r.status === 'Bloqueio').length;
  const nAtencao   = rows.filter(r => r.status === 'Atenção').length;
  const nComAtraso = rows.filter(r => r.totalVencido > 0).length;

  const RISK_MAP = {
    Regular:  { icon:'🟢', color:'#059669', bg:'#d1fae5' },
    Atenção:  { icon:'🟡', color:'#d97706', bg:'#fef3c7' },
    Bloqueio: { icon:'🔴', color:'#dc2626', bg:'#fee2e2' },
  };

  const AGING_CFG = [
    { key:'aVencer',  label:'A Vencer',       bg:'#d1fae5', color:'#059669' },
    { key:'v1a7',     label:'Venc. 1–7d',     bg:'#fef9c3', color:'#ca8a04' },
    { key:'v8a15',    label:'Venc. 8–15d',    bg:'#fef3c7', color:'#d97706' },
    { key:'v16a30',   label:'Venc. 16–30d',   bg:'#fed7aa', color:'#ea580c' },
    { key:'v30mais',  label:'Venc. > 30d',    bg:'#fee2e2', color:'#dc2626' },
  ];

  const kpis = [
    { label:'CLIENTES',       value:e(rows.length) },
    { label:'FAT. TOTAL',     value:e(fmtR(totFat)) },
    { label:'LIMITE TOTAL',   value:e(fmtR(totLimite)) },
    { label:'LIMITE USADO',   value:e(fmtR(totUsado)) },
    { label:'SALDO DEVEDOR',  value:e(fmtR(totSaldo)) },
    { label:'EM ATENÇÃO',     value:e(nAtencao),  alert: nAtencao > 0 },
    { label:'EM BLOQUEIO',    value:e(nBloqueio), alert: nBloqueio > 0, hard: true },
    { label:'C/ ATRASO',      value:e(nComAtraso),alert: nComAtraso > 0 },
  ];
  const kpiHtml = kpis.map(k => `
    <div class="summary-item${k.hard ? ' summary-hard' : k.alert ? ' summary-alert' : ''}">
      <span>${k.label}</span><strong>${k.value}</strong>
    </div>`).join('');

  const mainRows = rows.map((row, i) => {
    const rm   = RISK_MAP[row.status] || RISK_MAP.Regular;
    const pctW = Math.min(100, row.pct * 100).toFixed(0);
    const pctColor = row.pct >= 0.85 ? '#dc2626' : row.pct >= 0.70 ? '#d97706' : '#059669';
    const alertBanner = row.totalVencido > 0
      ? `<tr style="background:#fef2f2"><td colspan="9" style="padding:4px 10px;color:#dc2626;font-weight:800;font-size:9px;border:1px solid #fca5a5">⚠️ CLIENTE COM TÍTULOS VENCIDOS — VERIFICAR ANTES DE ABASTECER</td></tr>`
      : '';
    const agingRow = `
      <tr style="background:#f8fafc">
        <td colspan="9" style="padding:8px 10px;border:1px solid #e5e7eb">
          <div style="font-size:8.5px;font-weight:700;color:#374151;margin-bottom:5px">AGING LIST — ${e(row.razao)}</div>
          <table style="width:100%;border-collapse:collapse;font-size:8.5px">
            <thead><tr>
              ${AGING_CFG.map(a => `<th style="padding:4px 7px;background:${a.bg};color:${a.color};border:1px solid rgba(0,0,0,.08);text-align:right;font-weight:800">${a.label}</th>`).join('')}
              <th style="padding:4px 7px;background:#f1f5f9;color:#374151;border:1px solid rgba(0,0,0,.08);text-align:right;font-weight:800">Total</th>
            </tr></thead>
            <tbody><tr>
              ${AGING_CFG.map(a => `<td style="padding:4px 7px;background:${a.bg}33;color:${row.aging[a.key]>0?a.color:'#9ca3af'};border:1px solid rgba(0,0,0,.06);text-align:right;font-weight:${row.aging[a.key]>0?700:400}">${e(fmtR(row.aging[a.key]))}</td>`).join('')}
              <td style="padding:4px 7px;background:#f1f5f9;color:#111827;border:1px solid rgba(0,0,0,.08);text-align:right;font-weight:900">${e(fmtR(row.saldoDevedor))}</td>
            </tr></tbody>
          </table>
        </td>
      </tr>`;
    return `
    <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
      <td style="font-weight:700;color:#1f2937">${e(row.razao)}</td>
      <td style="font-family:monospace;font-size:9px">${e(row.cnpj)}</td>
      <td class="num">${e(fmtR(row.faturamento))}</td>
      <td class="num">${e(fmtR(row.limiteTotal))}</td>
      <td class="num" style="color:${pctColor};font-weight:700">${e(fmtR(row.limiteUsado))}</td>
      <td class="num">
        <div style="display:flex;align-items:center;gap:5px;justify-content:flex-end">
          <div style="width:48px;height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden;flex-shrink:0">
            <div style="height:100%;width:${pctW}%;background:${pctColor};border-radius:4px"></div>
          </div>
          <span style="font-weight:800;color:${pctColor};min-width:34px;text-align:right">${e(pctFmt(row.pct))}</span>
        </div>
      </td>
      <td class="num">${e(row.nfs)}</td>
      <td class="num" style="font-weight:700;color:${row.saldoDevedor>0?'#dc2626':'#059669'}">${e(fmtR(row.saldoDevedor))}</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700;background:${rm.bg};color:${rm.color};white-space:nowrap">${rm.icon} ${e(row.status)}</span></td>
    </tr>
    ${alertBanner}
    ${agingRow}`;
  }).join('');

  const footRow = `
    <tr>
      <td colspan="2" style="font-weight:800">TOTAL — ${e(rows.length)} clientes</td>
      <td class="num" style="font-weight:800">${e(fmtR(totFat))}</td>
      <td class="num" style="font-weight:800">${e(fmtR(totLimite))}</td>
      <td class="num" style="font-weight:800">${e(fmtR(totUsado))}</td>
      <td class="num">${e(pctFmt(totUsado/totLimite))}</td>
      <td class="num">${e(rows.reduce((s,r)=>s+r.nfs,0))}</td>
      <td class="num" style="font-weight:900;color:#dc2626">${e(fmtR(totSaldo))}</td>
      <td></td>
    </tr>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="color-scheme" content="light"/>
  <title>Relatorio Vendas a Prazo e Controle CNPJ</title>
  <style>
    @page { size:A4 landscape; margin:10mm; }
    * { box-sizing:border-box; }
    html,body,.report,.header,.panel,.summary-item,table,th,td,tfoot td {
      -webkit-print-color-adjust:exact!important;
      print-color-adjust:exact!important;
      color-adjust:exact!important;
    }
    :root { color-scheme:light only; }
    body { margin:0; font-family:Arial,Helvetica,sans-serif; color:#111827; background:#fff; }
    .report { min-height:100vh; padding:18px; background:#fff; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:16px 18px; border:1px solid #e5e7eb; border-bottom:3px solid #e31e24; border-radius:8px; background:#fff; margin-bottom:14px; }
    .header-left { display:flex; align-items:center; gap:14px; }
    .mark { width:44px; height:44px; border-radius:8px; background:#fff5f5; border:1px solid #fecaca; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    h1 { margin:0; font-size:19px; line-height:1.15; }
    .header-meta { color:#667085; font-size:11px; line-height:1.55; text-align:right; }
    .summary-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:9px; margin-bottom:14px; }
    .summary-item { border:1px solid #e5e7eb; border-radius:8px; background:#f9fafb; padding:9px 11px; }
    .summary-item.summary-alert { border-color:#fde68a; background:#fefce8; }
    .summary-item.summary-hard  { border-color:#fca5a5; background:#fef2f2; }
    .summary-alert strong { color:#d97706; }
    .summary-hard  strong { color:#dc2626; }
    .summary-item span { display:block; color:#667085; font-size:8px; font-weight:800; margin-bottom:4px; }
    .summary-item strong { display:block; color:#111827; font-size:14px; font-weight:900; line-height:1.1; }
    .panel { border:1px solid #e5e7eb; border-radius:8px; background:#fff; padding:14px; }
    .panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .panel-title { margin:0; color:#111827; font-size:13px; font-weight:800; }
    .pill { border:1px solid #d0d5dd; border-radius:8px; color:#344054; padding:4px 8px; font-size:9px; font-weight:800; white-space:nowrap; background:#f9fafb; }
    table { width:100%; border-collapse:collapse; font-size:9px; }
    th,td { border:1px solid #d0d5dd; padding:5px 7px; word-break:break-word; }
    th { background:#e31e24!important; color:#fff; font-size:8.5px; font-weight:700; text-align:left; }
    td { color:#111827; background:inherit; }
    td.num,th.num { text-align:right; }
    tfoot td { color:#111827; background:#f3f4f6!important; font-weight:900; font-size:9px; }
    .footer { margin-top:10px; color:#667085; font-size:10px; text-align:right; }
    @media screen { body { background:#f3f4f6; padding:18px; } .report { max-width:1280px; margin:0 auto; box-shadow:0 18px 50px rgba(15,23,42,.12); } }
    @media print {
      body,html,.report,.panel,.header,.summary-item { background:#fff!important; color-scheme:light!important; }
      th { background:#e31e24!important; color:#fff!important; }
      tfoot td { background:#f3f4f6!important; }
      .summary-alert { background:#fefce8!important; }
      .summary-hard  { background:#fef2f2!important; }
      tr { break-inside:avoid; }
    }
  </style>
</head>
<body>
<main class="report">
  <section class="header">
    <div class="header-left">
      <div class="mark">🏢</div>
      <div>
        <h1>VENDAS A PRAZO E CONTROLE CNPJ</h1>
        <div class="header-meta" style="text-align:left">${e(clientName||'Cliente')} | Período: ${e(periLabel)}</div>
      </div>
    </div>
    <div class="header-meta">
      <div>Aging List incluso · Status de Risco calculado automaticamente</div>
      <div>🔴 Bloqueio: utilização ≥ 85% ou títulos > 30 dias</div>
      <div>Gerado em ${e(generatedAt)}</div>
    </div>
  </section>

  <div class="summary-grid">${kpiHtml}</div>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">CONTROLE DE CRÉDITO — CNPJ + AGING LIST</h2>
      <div class="pill">${e(rows.length)} cliente${rows.length!==1?'s':''} · ${e(periLabel)}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="min-width:150px">RAZÃO SOCIAL</th>
          <th>CNPJ</th>
          <th class="num">FAT. PERÍODO (R$)</th>
          <th class="num">LIMITE TOTAL (R$)</th>
          <th class="num">LIMITE USADO (R$)</th>
          <th class="num" style="min-width:90px">% USADO</th>
          <th class="num">NFs</th>
          <th class="num">SALDO DEVEDOR (R$)</th>
          <th>STATUS RISCO</th>
        </tr>
      </thead>
      <tbody>${mainRows}</tbody>
      <tfoot>${footRow}</tfoot>
    </table>
  </section>

  <footer class="footer">STARVL | Relatório de Vendas a Prazo e Controle CNPJ</footer>
</main>
</body>
</html>`;
}

function exportCnpjReport({ filters, clientName }) {
  const html = buildCnpjReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', `
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 500);
      });
    </script>
  </body>`));
  w.document.close();
}

const CnpjFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const upd = field => e => setFilters(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={ev => ev.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>FILTROS — VENDAS A PRAZO E CONTROLE CNPJ</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">

            {/* Busca cliente */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <UsersIcon size={20} /><span>BUSCAR CLIENTE</span>
              </div>
              <label className="control-print-field" style={{ marginTop:8 }}>
                <span>RAZÃO SOCIAL OU CNPJ</span>
                <div className="control-print-input">
                  <input
                    type="text"
                    placeholder="Ex: Transportes ABC ou 12.345..."
                    value={filters.search}
                    onChange={upd('search')}
                    style={{ flex:1 }}
                  />
                </div>
              </label>
              {filters.search && (
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                  {_computeCnpjRows(filters).length} cliente(s) encontrado(s)
                </div>
              )}
            </section>

            {/* Período */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Calendar size={20} /><span>PERÍODO DE FATURAMENTO</span>
              </div>
              <label className={`control-print-option ${filters.periodo === 'Mensal' ? 'selected' : ''}`}>
                <BarChart2 size={26} />
                <div><strong>MENSAL</strong><span>Faturamento do mês corrente</span></div>
                <input type="radio" name="cnpjPeriodo" value="Mensal" checked={filters.periodo === 'Mensal'} onChange={upd('periodo')} />
              </label>
              <label className={`control-print-option ${filters.periodo === 'Trimestral' ? 'selected' : ''}`}>
                <TrendingUp size={26} />
                <div><strong>TRIMESTRAL</strong><span>Faturamento acumulado 3 meses</span></div>
                <input type="radio" name="cnpjPeriodo" value="Trimestral" checked={filters.periodo === 'Trimestral'} onChange={upd('periodo')} />
              </label>
            </section>

          </div>

          {/* Preview risco */}
          <section className="control-print-section" style={{ marginTop:16 }}>
            <div className="control-print-section-title">
              <AlertTriangle size={20} /><span>PRÉ-VISUALIZAÇÃO DO RISCO</span>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
              {['Regular','Atenção','Bloqueio'].map(st => {
                const n   = _computeCnpjRows(filters).filter(r => r.status === st).length;
                const cfg = { Regular:{c:'#059669',bg:'rgba(5,150,105,.12)',icon:'🟢'}, Atenção:{c:'#d97706',bg:'rgba(217,119,6,.12)',icon:'🟡'}, Bloqueio:{c:'#dc2626',bg:'rgba(220,38,38,.12)',icon:'🔴'} }[st];
                return (
                  <div key={st} style={{ flex:'1 1 100px', background:cfg.bg, border:`1px solid ${cfg.c}44`, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
                    <div style={{ fontSize:22 }}>{cfg.icon}</div>
                    <div style={{ fontSize:24, fontWeight:900, color:cfg.c, lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:10, color:cfg.c, fontWeight:700, marginTop:2 }}>{st}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>
            <X size={20} /> CANCELAR
          </button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={20} /> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Vendas a Prazo e Controle CNPJ ───────────────────────────────────────

const Reports = ({ selectedClient, selectedPeriod, setSelectedPeriod, clients }) => {
  const [activeTab, setActiveTab] = useState('descarregamentos');
  const [data, setData] = useState({ descarregamentos: null, vendas: null, historico: null, consolidado: null, controle: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [descSubTab, setDescSubTab] = useState('comNota');
  const [showControlPrintPanel, setShowControlPrintPanel] = useState(false);
  const [showRankingPrintPanel, setShowRankingPrintPanel] = useState(false);
  const [showMargemPanel,       setShowMargemPanel]       = useState(false);
  const [margemFilters, setMargemFilters] = useState({ categoria: 'Todos', dataInicial: '', dataFinal: '', ordenacao: 'margemTotal' });
  const [showConciliacaoPanel,  setShowConciliacaoPanel]  = useState(false);
  const [conciliacaoFilters, setConciliacaoFilters] = useState({ adquirente:'Todos', bandeira:'Todos', modalidade:'Todos', dataInicial:'', dataFinal:'' });
  const [showCnpjPanel,         setShowCnpjPanel]         = useState(false);
  const [cnpjFilters, setCnpjFilters] = useState({ search:'', periodo:'Mensal' });
  const [vendedores, setVendedores] = useState([]);
  const [rankingFilters, setRankingFilters] = useState({
    dataInicial: '',
    dataFinal: '',
    tipoProd: '1',
    vendedores: [],
  });
  const [controlPrintFilters, setControlPrintFilters] = useState({
    dataInicial: '',
    dataFinal: '',
    tipo: 'resumido',
    produto: 'all',
    formato: 'pdf',
  });

  const fetchTab = useCallback(async (tab) => {
    if (tab === 'outros') return;
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

  const fetchVendedores = useCallback(async () => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    if (!empresa) return;
    setLoading(prev => ({ ...prev, vendedores: true }));
    setError(prev => ({ ...prev, vendedores: null }));
    try {
      const r = await fetch(`${API_URL}/api/relatorios/vendedores?empresa=${empresa}`);
      const result = await r.json();
      if (result.error) throw new Error(result.error);
      const rows = Array.isArray(result.vendedores) ? result.vendedores : [];
      setVendedores(rows);
      setRankingFilters(prev => ({
        ...prev,
        vendedores: (() => {
          const validCodes = new Set(rows.map(v => String(v.codigo)));
          const selected = prev.vendedores.filter(codigo => validCodes.has(String(codigo)));
          return selected.length ? selected : rows.map(v => String(v.codigo));
        })(),
      }));
    } catch (err) {
      setError(prev => ({ ...prev, vendedores: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, vendedores: false }));
    }
  }, [clients, selectedClient]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const tabs = [
    { id: 'descarregamentos', label: 'Descarregamentos', icon: <Droplet size={15} /> },
    { id: 'vendas',           label: 'Vendas PDV',       icon: <BarChart2 size={15} /> },
    { id: 'outros',           label: 'Outros Relatorios', icon: <FileText size={15} /> },
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
      toast('A data inicial não pode ser maior que a data final.', 'warn');
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
      toast(`Erro ao gerar relatório: ${getFriendlyApiError(err)}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, controleExport: false }));
    }
  };

  const getRankingSellerLabel = (selectedCodes = rankingFilters.vendedores) => {
    if (!vendedores.length || !selectedCodes.length || selectedCodes.length === vendedores.length) return 'Todos';
    const selected = vendedores.filter(v => selectedCodes.includes(String(v.codigo))).map(v => v.nome);
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
  };

  const openRankingPrintPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setRankingFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal: prev.dataFinal || range.dataFinal,
      tipoProd: prev.tipoProd || '1',
    }));
    setShowRankingPrintPanel(true);
    fetchVendedores();
  };

  const handleGenerateRankingReport = async () => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    if (!empresa) return;

    const range = getPeriodDateRange(selectedPeriod);
    const filters = {
      ...rankingFilters,
      dataInicial: rankingFilters.dataInicial || range.dataInicial,
      dataFinal: rankingFilters.dataFinal || range.dataFinal,
      tipoProd: rankingFilters.tipoProd || '1',
    };

    if (filters.dataInicial > filters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }

    if (vendedores.length && !filters.vendedores.length) {
      toast('Selecione pelo menos um vendedor.', 'warn');
      return;
    }

    setLoading(prev => ({ ...prev, rankingExport: true }));
    try {
      const params = new URLSearchParams({
        empresa: String(empresa),
        dataInicial: filters.dataInicial,
        dataFinal: filters.dataFinal,
        tipoProd: String(filters.tipoProd),
      });
      if (vendedores.length && filters.vendedores.length < vendedores.length) {
        params.set('vendedores', filters.vendedores.join(','));
      }

      const r = await fetch(`${API_URL}/api/relatorios/ranking-vendas?${params.toString()}`);
      const result = await r.json();
      if (result.error) throw new Error(result.error);

      exportRankingSalesReport({
        report: result,
        filters,
        clientName: selectedClient,
        sellerLabel: getRankingSellerLabel(filters.vendedores),
      });
      setShowRankingPrintPanel(false);
    } catch (err) {
      toast(`Erro ao gerar relatório: ${getFriendlyApiError(err)}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, rankingExport: false }));
    }
  };

  const openMargemPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setMargemFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal:   prev.dataFinal   || range.dataFinal,
    }));
    setShowMargemPanel(true);
  };

  const handleGenerateMargemReport = () => {
    if (margemFilters.dataInicial && margemFilters.dataFinal && margemFilters.dataInicial > margemFilters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }
    exportMargemReport({ filters: margemFilters, clientName: selectedClient });
    setShowMargemPanel(false);
  };

  const openConciliacaoPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setConciliacaoFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal:   prev.dataFinal   || range.dataFinal,
    }));
    setShowConciliacaoPanel(true);
  };

  const handleGenerateConciliacaoReport = () => {
    if (conciliacaoFilters.dataInicial && conciliacaoFilters.dataFinal && conciliacaoFilters.dataInicial > conciliacaoFilters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }
    exportConciliacaoReport({ filters: conciliacaoFilters, clientName: selectedClient });
    setShowConciliacaoPanel(false);
  };

  const openCnpjPanel = () => setShowCnpjPanel(true);

  const handleGenerateCnpjReport = () => {
    exportCnpjReport({ filters: cnpjFilters, clientName: selectedClient });
    setShowCnpjPanel(false);
  };

  const renderOutrosRelatorios = () => (
    <div className="other-reports-panel">
      <div className="other-reports-list">
        <button type="button" className="other-report-row" onClick={openRankingPrintPanel}>
          <div className="other-report-index">REL 1</div>
          <div className="other-report-icon"><Trophy size={22} /></div>
          <div className="other-report-main">
            <strong>Ranking de venda</strong>
            <span>Ranking de vendedores por total vendido</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openMargemPanel}>
          <div className="other-report-index">REL 2</div>
          <div className="other-report-icon"><TrendingUp size={22} /></div>
          <div className="other-report-main">
            <strong>Margem por Combustível e Produtos</strong>
            <span>Análise de margem bruta unitária e total com ST, frete e custo real</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openConciliacaoPanel}>
          <div className="other-report-index">REL 3</div>
          <div className="other-report-icon"><CreditCard size={22} /></div>
          <div className="other-report-main">
            <strong>Conciliação de Cartões e Taxas</strong>
            <span>Cruzamento de vendas × extrato das maquininhas — divergências e depósitos atrasados</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openCnpjPanel}>
          <div className="other-report-index">REL 4</div>
          <div className="other-report-icon"><Building2 size={22} /></div>
          <div className="other-report-main">
            <strong>Vendas a Prazo e Controle CNPJ</strong>
            <span>Limite de crédito, saldo devedor e aging list por cliente CNPJ</span>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>

      {showRankingPrintPanel && (
        <RankingSalesFilterPanel
          vendedores={vendedores}
          filters={rankingFilters}
          setFilters={setRankingFilters}
          loading={!!loading.rankingExport}
          loadingVendedores={!!loading.vendedores}
          vendedoresError={error.vendedores}
          onClose={() => setShowRankingPrintPanel(false)}
          onGenerate={handleGenerateRankingReport}
        />
      )}

      {showMargemPanel && (
        <MargemFilterPanel
          filters={margemFilters}
          setFilters={setMargemFilters}
          onClose={() => setShowMargemPanel(false)}
          onGenerate={handleGenerateMargemReport}
        />
      )}

      {showConciliacaoPanel && (
        <ConciliacaoFilterPanel
          filters={conciliacaoFilters}
          setFilters={setConciliacaoFilters}
          onClose={() => setShowConciliacaoPanel(false)}
          onGenerate={handleGenerateConciliacaoReport}
        />
      )}

      {showCnpjPanel && (
        <CnpjFilterPanel
          filters={cnpjFilters}
          setFilters={setCnpjFilters}
          onClose={() => setShowCnpjPanel(false)}
          onGenerate={handleGenerateCnpjReport}
        />
      )}

    </div>
  );

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
    if (activeTab === 'outros') return renderOutrosRelatorios();
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

const RankingSalesFilterPanel = ({ vendedores, filters, setFilters, loading, loadingVendedores, vendedoresError, onClose, onGenerate }) => {
  const update = (field) => (e) => setFilters(prev => ({ ...prev, [field]: e.target.value }));
  const selectedCodes = (filters.vendedores || []).map(String);
  const allSelected = vendedores.length > 0 && selectedCodes.length === vendedores.length;

  const toggleAll = () => {
    setFilters(prev => ({
      ...prev,
      vendedores: allSelected ? [] : vendedores.map(v => String(v.codigo)),
    }));
  };

  const toggleSeller = (codigo) => {
    const code = String(codigo);
    setFilters(prev => {
      const current = (prev.vendedores || []).map(String);
      const exists = current.includes(code);
      return {
        ...prev,
        vendedores: exists ? current.filter(item => item !== code) : [...current, code],
      };
    });
  };

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>FILTROS DO RANKING DE VENDAS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar filtros">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">
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
            </section>

            <section className="control-print-section">
              <div className="control-print-section-title">
                <Package size={20} />
                <span>TIPO DE PRODUTO</span>
              </div>
              <label className={`control-print-option ${String(filters.tipoProd) === '1' ? 'selected' : ''}`}>
                <Droplet size={28} />
                <div>
                  <strong>COMBUSTIVEL</strong>
                  <span>prodtipo = 1</span>
                </div>
                <input type="radio" name="rankingTipoProduto" value="1" checked={String(filters.tipoProd) === '1'} onChange={update('tipoProd')} />
              </label>
              <label className={`control-print-option ${String(filters.tipoProd) === '2' ? 'selected' : ''}`}>
                <Package size={28} />
                <div>
                  <strong>PRODUTOS</strong>
                  <span>prodtipo = 2</span>
                </div>
                <input type="radio" name="rankingTipoProduto" value="2" checked={String(filters.tipoProd) === '2'} onChange={update('tipoProd')} />
              </label>
            </section>
          </div>

          <section className="control-print-section ranking-sellers-section">
            <div className="control-print-section-title">
              <UsersIcon size={20} />
              <span>VENDEDORES</span>
              {vendedores.length > 0 && <em>{selectedCodes.length}/{vendedores.length}</em>}
            </div>

            <label className={`ranking-seller-check ranking-seller-all ${allSelected ? 'selected' : ''}`}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>Todos os vendedores</span>
            </label>

            <div className="ranking-seller-list">
              {loadingVendedores && <div className="ranking-seller-state">Carregando vendedores...</div>}
              {vendedoresError && !loadingVendedores && (
                <div className="ranking-seller-state error">{getFriendlyApiError(vendedoresError)}</div>
              )}
              {!loadingVendedores && !vendedoresError && vendedores.length === 0 && (
                <div className="ranking-seller-state">Nenhum vendedor encontrado.</div>
              )}
              {!loadingVendedores && !vendedoresError && vendedores.map(vendedor => {
                const checked = selectedCodes.includes(String(vendedor.codigo));
                return (
                  <label key={vendedor.codigo} className={`ranking-seller-check ${checked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSeller(vendedor.codigo)}
                    />
                    <span>{vendedor.nome}</span>
                    <small>{vendedor.codigo}</small>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>
            <X size={20} />
            CANCELAR
          </button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate} disabled={loading || loadingVendedores}>
            <Printer size={20} />
            {loading ? 'GERANDO...' : 'GERAR IMPRESSAO'}
          </button>
        </div>
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
  // anchoredDays: { [aberturaKey]: true } — dias "ancorados" têm abertura editável
  const [anchoredDays, setAnchoredDays] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starvl:lmc-anchors') || '{}');
    } catch {
      return {};
    }
  });
  // selectedRowKey: qual linha está destacada no momento
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [savedEditKey, setSavedEditKey] = useState(null);

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
      toast('A data inicial não pode ser maior que a data final.', 'warn');
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
      toast(`Erro ao gerar relatório: ${getFriendlyApiError(err)}`, 'error');
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

  function toggleAnchor(aberturaKey) {
    setAnchoredDays(prev => {
      const next = { ...prev, [aberturaKey]: !prev[aberturaKey] };
      localStorage.setItem('starvl:lmc-anchors', JSON.stringify(next));
      return next;
    });
  }

  function handleRowClick(key) {
    setSelectedRowKey(prev => (prev === key ? null : key));
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
        <h2>MOVIMENTAÇÃO DE COMBUSTÍVEIS</h2>
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
                {tableRows.map((row) => {
                  const isAnchored = !!anchoredDays[row.aberturaKey];
                  const isSelected = selectedRowKey === row.key;
                  // buildControlReportRows já popula aberturaInput com o valor calculado
                  // quando não há edição do usuário — pode ser usado diretamente
                  const aberturaDisplayValue = row.aberturaInput;
                  return (
                    <tr
                      key={row.key}
                      className={`lmc-row${isSelected ? ' lmc-row-selected' : ''}${isAnchored ? ' lmc-row-anchored' : ''}`}
                      onClick={() => handleRowClick(row.key)}
                    >
                      <td>
                        <div className="lmc-day-cell">
                          <button
                            type="button"
                            className={`lmc-anchor-btn${isAnchored ? ' unlocked' : ''}`}
                            title={isAnchored ? 'Bloquear — clique para impedir edição da abertura' : 'Ancorar — clique para liberar edição da abertura'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAnchor(row.aberturaKey);
                              setSelectedRowKey(row.key);
                            }}
                          >
                            {isAnchored ? <Unlock size={13} /> : <Lock size={13} />}
                          </button>
                          <span>{row.dia}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          className={`lmc-fisico-input${savedEditKey === `abertura:${row.aberturaKey}` ? ' saved' : ''}${!isAnchored ? ' lmc-input-locked' : ''}`}
                          type="text"
                          inputMode="decimal"
                          value={aberturaDisplayValue}
                          readOnly={!isAnchored}
                          onChange={isAnchored ? (e) => persistAberturaEdit(row.aberturaKey, e.target.value) : undefined}
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
                          className={`lmc-fisico-input${savedEditKey === `fisico:${row.fisicoKey}` ? ' saved' : ''}`}
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
                  );
                })}
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
            <div className="lmc-anchor-legend">
              <Lock size={11} />
              <span>Bloqueado — clique no cadeado para liberar edição da abertura</span>
              <Unlock size={11} style={{ marginLeft: 8, color: '#22c55e' }} />
              <span style={{ color: '#22c55e' }}>Ancorado — abertura editável</span>
            </div>
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

// ─── LivrosManager — seções dentro da aba Livros ────────────────────────────
const LivrosManager = ({ lmcRegistros, lmcDiario, lmcControle, selectedPeriod, setSelectedPeriod, selectedClient, clients }) => {
  const [section, setSection] = useState('movimentacao');

  const sections = [
    { id: 'movimentacao', label: '⛽ Movimentação de Combustíveis' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Barra de seções */}
      <div className="estoque-tab-bar">
        <div className="vp-toggle-group">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              className={`vp-period-btn vp-secao-btn${section === s.id ? ' active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'movimentacao' && (
        <Control
          lmcRegistros={lmcRegistros}
          lmcDiario={lmcDiario}
          lmcControle={lmcControle}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedClient={selectedClient}
          clients={clients}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GERENCIAMENTO DE PRODUTOS - CONVENIÊNCIA
// ═══════════════════════════════════════════════════════════════════════════

function pmDateFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const PM_MOCK_PRODUCTS = [
  // Bebidas
  { id:1,  nome:'Coca-Cola Lata 350ml',           sub:'Refrigerante',      codigo:'7894900011517', cat:'Bebidas',            forn:'Ambev',          uni:'UN', estoque:120, preco:6.24, custo:4.12, venc:pmDateFromNow(13),   emoji:'🥤', cor:'#ef4444' },
  { id:2,  nome:'Guaraná Antarctica 350ml',        sub:'Refrigerante',      codigo:'7891991010832', cat:'Bebidas',            forn:'Ambev',          uni:'UN', estoque:80,  preco:5.99, custo:3.80, venc:pmDateFromNow(25),   emoji:'🥤', cor:'#22c55e' },
  { id:3,  nome:'Água Mineral 500ml',              sub:'Água',              codigo:'7896050600067', cat:'Bebidas',            forn:'Nestlé',         uni:'UN', estoque:200, preco:2.50, custo:1.20, venc:pmDateFromNow(180),  emoji:'💧', cor:'#38bdf8' },
  { id:4,  nome:'Suco Del Valle Laranja 290ml',    sub:'Suco de Fruta',     codigo:'7894900700046', cat:'Bebidas',            forn:'Coca-Cola',      uni:'UN', estoque:60,  preco:4.99, custo:3.10, venc:pmDateFromNow(45),   emoji:'🍹', cor:'#f97316' },
  { id:5,  nome:'Red Bull Energy 250ml',           sub:'Energético',        codigo:'90162072000014',cat:'Bebidas',            forn:'Red Bull',       uni:'UN', estoque:30,  preco:14.90,custo:9.50, venc:pmDateFromNow(90),   emoji:'⚡', cor:'#eab308' },
  // Bebidas Alcoólicas
  { id:6,  nome:'Cerveja Heineken 330ml',          sub:'Cerveja Long Neck', codigo:'7894900013218', cat:'Bebidas Alcoólicas', forn:'Heineken',       uni:'UN', estoque:15,  preco:7.99, custo:4.30, venc:pmDateFromNow(-5),   emoji:'🍺', cor:'#16a34a' },
  { id:7,  nome:'Cerveja Brahma Lata 350ml',       sub:'Cerveja Lata',      codigo:'7891991030045', cat:'Bebidas Alcoólicas', forn:'Ambev',          uni:'UN', estoque:48,  preco:5.49, custo:3.20, venc:pmDateFromNow(60),   emoji:'🍺', cor:'#92400e' },
  { id:8,  nome:'Vinho Seco Tinto 750ml',          sub:'Vinho',             codigo:'7896081900231', cat:'Bebidas Alcoólicas', forn:'Vinhos LTDA',    uni:'UN', estoque:6,   preco:39.90,custo:22.00,venc:pmDateFromNow(730),  emoji:'🍷', cor:'#7c3aed' },
  // Doces
  { id:9,  nome:'Chocolate Bis Lacta 126g',        sub:'Chocolate',         codigo:'7622210017863', cat:'Doces',              forn:'Mondelez',       uni:'UN', estoque:80,  preco:7.49, custo:3.65, venc:pmDateFromNow(10),   emoji:'🍫', cor:'#92400e' },
  { id:10, nome:'Bala Fini Morango 120g',          sub:'Bala',              codigo:'7896894851019', cat:'Doces',              forn:'Fini',           uni:'UN', estoque:25,  preco:5.90, custo:3.20, venc:pmDateFromNow(120),  emoji:'🍬', cor:'#ec4899' },
  { id:11, nome:'Biscoito Oreo Chocolate 90g',     sub:'Biscoito Doce',     codigo:'7622300489656', cat:'Doces',              forn:'Mondelez',       uni:'UN', estoque:40,  preco:6.99, custo:4.10, venc:pmDateFromNow(30),   emoji:'🍪', cor:'#1e3a8a' },
  { id:12, nome:'Kit Kat Miniatures 130g',         sub:'Chocolate',         codigo:'7891000063942', cat:'Doces',              forn:'Nestlé',         uni:'UN', estoque:18,  preco:14.90,custo:8.80, venc:pmDateFromNow(60),   emoji:'🍫', cor:'#d97706' },
  // Salgadinhos
  { id:13, nome:'Doritos Queijo Nacho 84g',        sub:'Salgadinho',        codigo:'7892840819576', cat:'Salgadinhos',        forn:'PepsiCo',        uni:'UN', estoque:45,  preco:6.99, custo:3.10, venc:pmDateFromNow(7),    emoji:'🌽', cor:'#f59e0b' },
  { id:14, nome:'Pringles Original 109g',          sub:'Salgadinho',        codigo:'38000845263001',cat:'Salgadinhos',        forn:'Kelloggs',       uni:'UN', estoque:20,  preco:19.90,custo:11.50,venc:pmDateFromNow(90),   emoji:'🥔', cor:'#dc2626' },
  { id:15, nome:'Cheetos Requeijão 45g',           sub:'Salgadinho',        codigo:'7892840016014', cat:'Salgadinhos',        forn:'PepsiCo',        uni:'UN', estoque:30,  preco:4.99, custo:2.50, venc:pmDateFromNow(15),   emoji:'🧀', cor:'#f97316' },
  { id:16, nome:'Ruffles Original 96g',            sub:'Salgadinho',        codigo:'7892840002185', cat:'Salgadinhos',        forn:'PepsiCo',        uni:'UN', estoque:22,  preco:8.99, custo:4.80, venc:pmDateFromNow(45),   emoji:'🥔', cor:'#b45309' },
  // Laticínios
  { id:17, nome:'Leite Longa Vida Integral 1L',    sub:'Leite UHT',         codigo:'7896223002187', cat:'Laticínios',         forn:'Piracanjuba',    uni:'UN', estoque:30,  preco:5.49, custo:3.20, venc:pmDateFromNow(2),    emoji:'🥛', cor:'#e2e8f0' },
  { id:18, nome:'Iogurte Grego Morango 100g',      sub:'Iogurte',           codigo:'7891025117892', cat:'Laticínios',         forn:'Nestlé',         uni:'UN', estoque:20,  preco:3.49, custo:2.10, venc:pmDateFromNow(-1),   emoji:'🍦', cor:'#fb7185' },
  { id:19, nome:'Queijo Minas Frescal 300g',       sub:'Queijo',            codigo:'7896187500018', cat:'Laticínios',         forn:'Laticínios MG',  uni:'UN', estoque:8,   preco:9.99, custo:6.80, venc:pmDateFromNow(5),    emoji:'🧀', cor:'#fde68a' },
  { id:20, nome:'Creme de Leite Piracanjuba 200g', sub:'Creme de Leite',    codigo:'7898215150010', cat:'Laticínios',         forn:'Piracanjuba',    uni:'UN', estoque:8,   preco:4.29, custo:2.45, venc:pmDateFromNow(-7),   emoji:'🥛', cor:'#fde68a' },
  { id:21, nome:'Manteiga com Sal Aviação 200g',   sub:'Manteiga',          codigo:'7896010806021', cat:'Laticínios',         forn:'Aviação',        uni:'UN', estoque:12,  preco:8.99, custo:5.90, venc:pmDateFromNow(45),   emoji:'🧈', cor:'#fbbf24' },
  { id:22, nome:'Requeijão Cremoso Catupiry 230g', sub:'Requeijão',         codigo:'7891118001029', cat:'Laticínios',         forn:'Catupiry',       uni:'UN', estoque:10,  preco:9.99, custo:6.50, venc:pmDateFromNow(20),   emoji:'🧀', cor:'#fde68a' },
  // Fumo
  { id:23, nome:'Cigarro Marlboro 20un',           sub:'Cigarro',           codigo:'7896186300011', cat:'Fumo',               forn:'Philip Morris',  uni:'UN', estoque:50,  preco:15.00,custo:9.80, venc:pmDateFromNow(365),  emoji:'🚬', cor:'#94a3b8' },
  { id:24, nome:'Cigarro L&M 20un',               sub:'Cigarro',            codigo:'7896186300022', cat:'Fumo',               forn:'Philip Morris',  uni:'UN', estoque:35,  preco:13.00,custo:8.50, venc:pmDateFromNow(365),  emoji:'🚬', cor:'#94a3b8' },
  { id:25, nome:'Cigarro Camel 20un',              sub:'Cigarro',           codigo:'7896186300033', cat:'Fumo',               forn:'Reynolds',       uni:'UN', estoque:20,  preco:13.50,custo:8.80, venc:pmDateFromNow(365),  emoji:'🚬', cor:'#94a3b8' },
  // Higiene
  { id:26, nome:'Sabonete Dove Hidratação 90g',    sub:'Sabonete',          codigo:'7891150060843', cat:'Higiene',            forn:'Unilever',       uni:'UN', estoque:18,  preco:3.99, custo:2.30, venc:pmDateFromNow(730),  emoji:'🧼', cor:'#60a5fa' },
  { id:27, nome:'Desodorante Rexona Men 150ml',    sub:'Desodorante',       codigo:'7891150044119', cat:'Higiene',            forn:'Unilever',       uni:'UN', estoque:10,  preco:12.90,custo:7.80, venc:pmDateFromNow(730),  emoji:'💨', cor:'#38bdf8' },
  { id:28, nome:'Shampoo Clear Anticaspa 200ml',   sub:'Shampoo',           codigo:'7891150072457', cat:'Higiene',            forn:'Unilever',       uni:'UN', estoque:8,   preco:14.90,custo:9.20, venc:pmDateFromNow(730),  emoji:'🧴', cor:'#818cf8' },
  // Automotivo
  { id:29, nome:'Óleo Motor 5W30 1L',              sub:'Lubrificante',      codigo:'7896021034108', cat:'Automotivo',         forn:'Castrol',        uni:'UN', estoque:5,   preco:42.50,custo:28.00,venc:pmDateFromNow(1095), emoji:'🛢️',cor:'#92400e' },
  { id:30, nome:'Aditivo Radiador 1L',             sub:'Aditivo',           codigo:'7896021034207', cat:'Automotivo',         forn:'Prestone',       uni:'UN', estoque:3,   preco:22.90,custo:14.50,venc:pmDateFromNow(1095), emoji:'💧', cor:'#0284c7' },
  { id:31, nome:'Fluido de Freio DOT4 500ml',      sub:'Fluido',            codigo:'7896021034308', cat:'Automotivo',         forn:'Mobil',          uni:'UN', estoque:4,   preco:28.90,custo:18.00,venc:pmDateFromNow(1095), emoji:'🔧', cor:'#64748b' },
  // Alimentos
  { id:32, nome:'Café 3 Corações Torrado 250g',    sub:'Café em Pó',        codigo:'7896045102059', cat:'Alimentos',          forn:'3 Corações',     uni:'UN', estoque:25,  preco:9.99, custo:6.50, venc:pmDateFromNow(180),  emoji:'☕', cor:'#78350f' },
  { id:33, nome:'Biscoito Cream Cracker 200g',     sub:'Biscoito Salgado',  codigo:'7896003701027', cat:'Alimentos',          forn:'Marilan',        uni:'UN', estoque:35,  preco:3.49, custo:1.90, venc:pmDateFromNow(60),   emoji:'🍞', cor:'#d97706' },
  { id:34, nome:'Açúcar União Cristal 1kg',        sub:'Açúcar',            codigo:'7896001006219', cat:'Alimentos',          forn:'União',          uni:'UN', estoque:20,  preco:5.99, custo:3.80, venc:pmDateFromNow(365),  emoji:'🫙', cor:'#f8fafc' },
  { id:35, nome:'Farinha de Trigo Dona Benta 1kg', sub:'Farinha',           codigo:'7896050601001', cat:'Alimentos',          forn:'Dona Benta',     uni:'UN', estoque:10,  preco:4.99, custo:2.90, venc:pmDateFromNow(180),  emoji:'🌾', cor:'#fbbf24' },
];

const PM_STATUS_LABEL = { ok:'OK', prox_vencer:'PRÓX. VENCER', vencendo_hoje:'VENCENDO HOJE', vencido:'VENCIDO' };
const PM_STATUS_CLS   = { ok:'pm-badge-ok', prox_vencer:'pm-badge-prox', vencendo_hoje:'pm-badge-hoje', vencido:'pm-badge-vencido' };
const PM_DIAS_CLS     = { ok:'pm-dias-ok', prox_vencer:'pm-dias-prox', vencendo_hoje:'pm-dias-hoje', vencido:'pm-dias-vencido' };

function pmBuildDonut(parts) {
  let cum = 0;
  const segs = parts.filter(p => p.pct > 0).map(p => {
    const from = cum; cum += p.pct;
    return `${p.color} ${from.toFixed(1)}% ${cum.toFixed(1)}%`;
  });
  return `conic-gradient(${segs.join(', ')})`;
}

// ─── Repositório de imagens — API compartilhada (PostgreSQL via starvl-api) ──
// Imagens ficam no servidor e carregam em qualquer máquina/navegador.

/**
 * Redimensiona e converte para JPEG antes de salvar.
 * Garante que a imagem fique bem abaixo do limite de 10 MB do servidor.
 * @param {string} dataUrl  DataURL original (pode ser PNG, JPEG, etc.)
 * @param {number} maxDim   Dimensão máxima (largura ou altura) em px. Default 900.
 * @param {number} quality  Qualidade JPEG 0‒1. Default 0.82.
 * @returns {Promise<string>} DataURL JPEG comprimido.
 */
function compressImage(dataUrl, maxDim = 900, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback: usa original
    img.src = dataUrl;
  });
}

// ── Cache de imagens de produto ────────────────────────────────────────────
// Estratégia: memória → localStorage → API (stale-while-revalidate)
const IMG_LS_KEY = 'starvl:img-v1';
let _imgMem      = null;   // singleton em memória (mesmo reload não refaz fetch)
let _imgFetching = null;   // dedup: evita dois fetches simultâneos

function _imgCacheRead() {
  try { return JSON.parse(localStorage.getItem(IMG_LS_KEY) || 'null'); }
  catch { return null; }
}
function _imgCacheWrite(data) {
  try { localStorage.setItem(IMG_LS_KEY, JSON.stringify(data)); }
  catch {} // quota exceeded — ignora silenciosamente
}
function _imgCacheSet(data) {
  _imgMem = data;
  _imgCacheWrite(data);
}

// Busca da API e atualiza cache (dedup por promise)
function _imgApiFetch() {
  if (_imgFetching) return _imgFetching;
  _imgFetching = fetch(`${API_URL}/api/imagens/produto`)
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}))
    .then(data => { _imgCacheSet(data); _imgFetching = null; return data; });
  return _imgFetching;
}

// Carrega imagens: memória → localStorage (instantâneo) → API (rede)
// Quando vem do localStorage, dispara refresh em background para manter atualizado
async function imgLoadAll() {
  if (_imgMem !== null) return _imgMem;           // ① in-memory: zero latência
  const cached = _imgCacheRead();
  if (cached) {
    _imgMem = cached;
    _imgApiFetch();                               // ② background refresh (sem await)
    return cached;                                //    retorna cache imediatamente
  }
  return _imgApiFetch();                          // ③ primeiro acesso: busca da API
}

async function imgSave(id, dataUrl) {
  const compressed = await compressImage(dataUrl);
  const res = await fetch(`${API_URL}/api/imagens/produto/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: compressed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  // Atualiza cache local imediatamente sem esperar novo fetch
  const next = { ...(_imgMem || {}), [String(id)]: compressed };
  _imgCacheSet(next);
  return compressed;
}
async function imgDelete(id) {
  const res = await fetch(`${API_URL}/api/imagens/produto/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Remove do cache local imediatamente
  if (_imgMem) {
    const next = { ..._imgMem };
    delete next[String(id)];
    _imgCacheSet(next);
  }
}

// ── Imagens de usuário ──────────────────────────────────────────────────────
// ── Cache de imagens de usuário ────────────────────────────────────────────
const USER_IMG_LS_KEY = 'starvl:uimg-v1';
let _uImgMem      = null;
let _uImgFetching = null;

function _uImgCacheRead() {
  try { return JSON.parse(localStorage.getItem(USER_IMG_LS_KEY) || 'null'); }
  catch { return null; }
}
function _uImgCacheWrite(data) {
  try { localStorage.setItem(USER_IMG_LS_KEY, JSON.stringify(data)); }
  catch {}
}
function _uImgCacheSet(data) { _uImgMem = data; _uImgCacheWrite(data); }

function _uImgApiFetch() {
  if (_uImgFetching) return _uImgFetching;
  _uImgFetching = fetch(`${API_URL}/api/imagens/usuario`)
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}))
    .then(data => { _uImgCacheSet(data); _uImgFetching = null; return data; });
  return _uImgFetching;
}

async function userImgLoadAll() {
  if (_uImgMem !== null) return _uImgMem;
  const cached = _uImgCacheRead();
  if (cached) { _uImgMem = cached; _uImgApiFetch(); return cached; }
  return _uImgApiFetch();
}
async function userImgLoadOne(id) {
  const all = await userImgLoadAll();
  return all[String(id)] || null;
}
async function userImgSave(id, dataUrl) {
  const compressed = await compressImage(dataUrl);
  const res = await fetch(`${API_URL}/api/imagens/usuario/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: compressed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const next = { ...(_uImgMem || {}), [String(id)]: compressed };
  _uImgCacheSet(next);
  return compressed;
}
async function userImgDelete(id) {
  const res = await fetch(`${API_URL}/api/imagens/usuario/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (_uImgMem) { const next = { ..._uImgMem }; delete next[String(id)]; _uImgCacheSet(next); }
}

function printProductCard({ prod, editForm, editImg }) {
  const custo  = parseFloat(editForm.custo)  || prod.custo;
  const preco  = parseFloat(editForm.preco)  || prod.preco;
  const estq   = parseInt(editForm.estoque)  || prod.estoque;
  const estMin = parseInt(editForm.estMin)   || 5;
  const margem = preco > 0 ? ((preco - custo) / preco * 100) : 0;
  const qtdMes = 20 + (prod.id % 60);
  const mColor = margem >= 20 ? '#16a34a' : margem >= 10 ? '#d97706' : '#dc2626';
  const statusLabel = { ok:'OK – Válido', prox_vencer:'Próx. do Vencimento', vencendo_hoje:'Vencendo Hoje', vencido:'VENCIDO' }[prod.status] || '';
  const statusColor = { ok:'#16a34a', prox_vencer:'#d97706', vencendo_hoje:'#ea580c', vencido:'#dc2626' }[prod.status] || '#111';
  const imgTag = editImg
    ? `<img src="${editImg}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />`
    : `<div style="font-size:72px;line-height:1;text-align:center;">${prod.emoji}</div>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ficha do Produto — ${prod.nome}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
    @media screen { body { background: #f3f4f6; padding: 20px; } .card { max-width: 800px; margin: 0 auto; background: #fff; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,.12); border-radius: 12px; } }
    .card {}
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #E31E24; padding-bottom: 10px; margin-bottom: 18px; }
    .header h1 { margin: 0; font-size: 15px; letter-spacing: .04em; text-transform: uppercase; color: #111; }
    .header .sub { font-size: 11px; color: #777; margin-top: 3px; }
    .logo { width: 110px; height: auto; }
    .body { display: grid; grid-template-columns: 180px 1fr; gap: 20px; }
    .img-box { width: 180px; height: 180px; border-radius: 10px; background: ${prod.cor}22; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .section-title { font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 14px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; }
    .value { font-size: 12px; color: #111; font-weight: 600; }
    .price-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .price-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center; }
    .price-big { font-size: 16px; font-weight: 800; color: #111; }
    .price-lbl { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
    .margin-val { font-size: 16px; font-weight: 800; color: ${mColor}; }
    .bar { height: 8px; border-radius: 4px; overflow: hidden; display: flex; margin: 4px 0 14px; }
    .bar-c { background: #16a34a; height: 100%; }
    .bar-l { background: #E31E24; flex: 1; height: 100%; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
    .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; }
    .stat .label { font-size: 9px; }
    .stat .value { font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #fff; background: ${statusColor}; letter-spacing: .04em; }
    .footer { margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
    .full { grid-column: 1 / -1; }
  </style>
</head>
<body>
<div class="card">
  <div class="header">
    <div>
      <h1>Ficha do Produto — Conveniência</h1>
      <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
    </div>
    <img class="logo" src="/logo-starvl.png" alt="STARVL" />
  </div>

  <div class="body">
    <div class="img-box">${imgTag}</div>
    <div>
      <div class="section-title">Identificação</div>
      <div class="info-grid">
        <div class="field full"><span class="label">Nome do Produto</span><span class="value" style="font-size:14px;">${prod.nome}</span></div>
        <div class="field"><span class="label">Código de Barras</span><span class="value" style="font-family:monospace;">${prod.codigo}</span></div>
        <div class="field"><span class="label">Categoria</span><span class="value">${prod.cat}</span></div>
        <div class="field"><span class="label">Unidade</span><span class="value">${prod.uni}</span></div>
        <div class="field"><span class="label">Marca</span><span class="value">${editForm.marca || prod.sub || '—'}</span></div>
        <div class="field"><span class="label">Fornecedor</span><span class="value">${editForm.forn || prod.forn}</span></div>
      </div>

      <div class="section-title">Preços e Margem</div>
      <div class="price-row">
        <div class="price-card"><div class="price-lbl">Custo Médio</div><div class="price-big">${fmtBRL(custo)}</div></div>
        <div class="price-card"><div class="price-lbl">Preço de Venda</div><div class="price-big">${fmtBRL(preco)}</div></div>
        <div class="price-card"><div class="price-lbl">Margem</div><div class="margin-val">${margem.toFixed(1)}%</div></div>
      </div>
      <div class="bar">
        <div class="bar-c" style="width:${Math.min(custo/preco*100,100).toFixed(1)}%"></div>
        <div class="bar-l"></div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:4px;">
    <div>
      <div class="section-title">Estoque</div>
      <div class="stats">
        <div class="stat"><div class="label">Estoque Atual</div><div class="value">${estq} un.</div></div>
        <div class="stat"><div class="label">Estoque Mínimo</div><div class="value">${estMin} un.</div></div>
        <div class="stat full"><div class="label">Localização</div><div class="value">${editForm.local || '—'}</div></div>
      </div>
    </div>
    <div>
      <div class="section-title">Vendas do Mês</div>
      <div class="stats">
        <div class="stat"><div class="label">Total Vendido</div><div class="value">${fmtBRL(qtdMes * preco)}</div></div>
        <div class="stat"><div class="label">Qtd. Vendida</div><div class="value">${qtdMes} un.</div></div>
      </div>
    </div>
    <div>
      <div class="section-title">Vencimento</div>
      <div class="stats">
        <div class="stat full"><div class="label">Data de Vencimento</div><div class="value">${fmtDate(prod.venc)}</div></div>
        <div class="stat full" style="border-color:${statusColor}22;background:${statusColor}0d;">
          <div class="label">Status</div>
          <div style="margin-top:4px;"><span class="status-badge">${statusLabel}</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>STARVL — Gerenciamento de Conveniência</span>
    <span>Situação: ATIVO | Controle de Vencimento: ${editForm.controlVenc ? 'Ativo' : 'Inativo'}</span>
  </div>
</div>
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 400);
  });
</script>
</body>
</html>`;

  const pw = window.open('', '_blank');
  if (!pw) { toast('Permita pop-ups no navegador para imprimir o produto.', 'warn'); return; }
  pw.document.open();
  pw.document.write(html);
  pw.document.close();
}

const ConvenienciaManager = ({ themeMode }) => {
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [fornecedor, setFornecedor] = useState('Todos');
  const [statusFilt, setStatusFilt] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim]       = useState('');
  const [viewProd, setViewProd]     = useState(null);
  const [editProd, setEditProd]     = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [editImg, setEditImg]         = useState(null);
  // Inicializa do cache localStorage de forma síncrona — sem flash ao abrir
  const [productImages, setProductImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(IMG_LS_KEY) || 'null') || {}; }
    catch { return {}; }
  });
  const [localEdits, setLocalEdits]   = useState(() => {
    try {
      const s = localStorage.getItem('pm_localEdits');
      if (!s) return {};
      // strip any legacy editImg blob/base64 stored in localStorage
      const parsed = JSON.parse(s);
      Object.values(parsed).forEach(v => { delete v.editImg; });
      return parsed;
    } catch { return {}; }
  });
  const imgInputRef = useRef(null);
  const LIMIT = 7;

  // Background: sincroniza com API (atualiza se houver mudança desde o cache)
  useEffect(() => {
    imgLoadAll().then(data => {
      setProductImages(prev => {
        const keys = new Set([...Object.keys(prev), ...Object.keys(data)]);
        const changed = [...keys].some(k => prev[k] !== data[k]);
        return changed ? data : prev;
      });
    }).catch(() => {});
  }, []);

  // Persist localEdits to localStorage (no images — those live in IndexedDB)
  useEffect(() => {
    try { localStorage.setItem('pm_localEdits', JSON.stringify(localEdits)); }
    catch { /* quota exceeded — ignore */ }
  }, [localEdits]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, categoria, fornecedor, statusFilt, dataInicio, dataFim]);

  // Compute status for all products (merge localEdits + images from IndexedDB)
  const allProds = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return PM_MOCK_PRODUCTS.map(p => {
      const edits = localEdits[p.id] || {};
      const merged = { ...p, ...edits };
      const vencDate = new Date(merged.venc + 'T00:00:00');
      const dias = Math.round((vencDate - today) / 86400000);
      const status = dias < 0 ? 'vencido' : dias === 0 ? 'vencendo_hoje' : dias <= 7 ? 'prox_vencer' : 'ok';
      return { ...merged, dias, status, valorEstoque: merged.custo * merged.estoque, editImg: productImages[p.id] || null };
    });
  }, [localEdits, productImages]);

  const openEdit = useCallback((p) => {
    const merged = { ...p, ...(localEdits[p.id] || {}) };
    setEditProd(merged);
    setEditImg(productImages[p.id] || null);
    setEditForm({
      custo:      String(merged.custo),
      preco:      String(merged.preco),
      estoque:    String(merged.estoque),
      estMin:     String(merged.estMin || 5),
      local:      merged.local || '',
      marca:      merged.marca || merged.sub || '',
      desc:       merged.desc  || '',
      forn:       merged.forn,
      controlVenc: merged.controlVenc !== undefined ? merged.controlVenc : true,
    });
  }, [localEdits, productImages]);

  const saveEdit = useCallback(() => {
    if (!editProd) return;
    // Salvar edições de texto/números no localStorage
    setLocalEdits(prev => ({
      ...prev,
      [editProd.id]: {
        custo:       parseFloat(editForm.custo)   || editProd.custo,
        preco:       parseFloat(editForm.preco)   || editProd.preco,
        estoque:     parseInt(editForm.estoque)   || editProd.estoque,
        estMin:      parseInt(editForm.estMin)    || 5,
        local:       editForm.local,
        marca:       editForm.marca,
        desc:        editForm.desc,
        forn:        editForm.forn,
        controlVenc: editForm.controlVenc,
        // editImg NÃO vai para localStorage — fica no IndexedDB
      },
    }));
    // Salvar/remover imagem na API (PostgreSQL)
    if (editImg) {
      imgSave(editProd.id, editImg)
        .then(compressed => {
          setProductImages(prev => ({ ...prev, [editProd.id]: compressed }));
          toast('Imagem salva!', 'success');
        })
        .catch(err => toast(`Erro ao salvar imagem: ${err.message}`, 'error'));
    } else if (productImages[editProd.id]) {
      imgDelete(editProd.id)
        .then(() => setProductImages(prev => { const next = { ...prev }; delete next[editProd.id]; return next; }))
        .catch(err => toast(`Erro ao remover imagem: ${err.message}`, 'error'));
    }
    setEditProd(null);
  }, [editProd, editForm, editImg, productImages]);

  // KPIs
  const kpis = useMemo(() => {
    const n = allProds.length;
    const valorTotal = allProds.reduce((s, p) => s + p.valorEstoque, 0);
    const proxVencer = allProds.filter(p => p.status === 'prox_vencer').length;
    const vencidos   = allProds.filter(p => p.status === 'vencido').length;
    const margem     = allProds.reduce((s, p) => s + (p.preco - p.custo) / p.preco * 100, 0) / n;
    return { n, valorTotal, proxVencer, vencidos, margem };
  }, [allProds]);

  // Filter
  const filtered = useMemo(() => {
    let list = allProds;
    if (search)              { const q = search.toLowerCase(); list = list.filter(p => p.nome.toLowerCase().includes(q) || p.codigo.includes(q)); }
    if (categoria !== 'Todas')  list = list.filter(p => p.cat  === categoria);
    if (fornecedor !== 'Todos') list = list.filter(p => p.forn === fornecedor);
    if (statusFilt !== 'Todos') list = list.filter(p => p.status === statusFilt);
    if (dataInicio)             list = list.filter(p => p.venc >= dataInicio);
    if (dataFim)                list = list.filter(p => p.venc <= dataFim);
    return list;
  }, [allProds, search, categoria, fornecedor, statusFilt, dataInicio, dataFim]);

  const totalPages = Math.ceil(filtered.length / LIMIT);
  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalValor = paginated.reduce((s, p) => s + p.valorEstoque, 0);

  // Analytics
  const analytics = useMemo(() => {
    const total = allProds.length;
    const sc = { ok:0, prox:0, hoje:0, vencido:0 };
    allProds.forEach(p => {
      if (p.status === 'ok') sc.ok++;
      else if (p.status === 'prox_vencer') sc.prox++;
      else if (p.status === 'vencendo_hoje') sc.hoje++;
      else sc.vencido++;
    });
    const notExp = allProds.filter(p => p.dias >= 0);
    const exp = {
      e7:    notExp.filter(p => p.dias <= 7).length,
      e8_15: notExp.filter(p => p.dias >= 8  && p.dias <= 15).length,
      e16_30:notExp.filter(p => p.dias >= 16 && p.dias <= 30).length,
      e30p:  notExp.filter(p => p.dias > 30).length,
    };
    const catMap = {};
    allProds.forEach(p => { catMap[p.cat] = (catMap[p.cat] || 0) + p.valorEstoque; });
    const cats = Object.entries(catMap).map(([nome, val]) => ({ nome, val })).sort((a,b) => b.val - a.val).slice(0, 4);
    return { sc, total, exp, cats };
  }, [allProds]);

  const { sc, total: aTotal, exp, cats: catList } = analytics;
  const donutParts = [
    { label:'OK (Válidos)',          count: sc.ok,      pct: sc.ok/aTotal*100,      color:'#22c55e' },
    { label:'Próx. Vencer (7 dias)', count: sc.prox,    pct: sc.prox/aTotal*100,    color:'#f59e0b' },
    { label:'Vencendo Hoje',         count: sc.hoje,    pct: sc.hoje/aTotal*100,    color:'#fb923c' },
    { label:'Vencidos',              count: sc.vencido, pct: sc.vencido/aTotal*100, color:'#ef4444' },
  ];
  const donutBg = pmBuildDonut(donutParts);

  const cats = ['Todas', ...new Set(PM_MOCK_PRODUCTS.map(p => p.cat))].sort((a,b) => a === 'Todas' ? -1 : a.localeCompare(b));
  const fors  = ['Todos', ...new Set(PM_MOCK_PRODUCTS.map(p => p.forn))].sort((a,b) => a === 'Todos' ? -1 : a.localeCompare(b));

  // Pagination helper
  const pagBtns = () => {
    const btns = []; const delta = 1;
    let prev = null;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        if (prev && i - prev > 1) btns.push('…');
        btns.push(i); prev = i;
      }
    }
    return btns;
  };

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <div className="pm-header-icon"><Package size={22} color="#E31E24" /></div>
          <h2 className="pm-title">GERENCIAMENTO DE PRODUTOS — CONVENIÊNCIA</h2>
        </div>
      </div>

      {/* KPIs */}
      <div className="pm-kpi-row">
        <div className="pm-kpi">
          <div className="pm-kpi-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Package size={22} color="#818cf8" /></div>
          <div className="pm-kpi-body">
            <div className="pm-kpi-label">Total de Produtos</div>
            <div className="pm-kpi-value" style={{ color:'#818cf8' }}>{kpis.n}</div>
            <div className="pm-kpi-sub">ativos cadastrados</div>
          </div>
        </div>
        <div className="pm-kpi">
          <div className="pm-kpi-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><Layers size={22} color="#22c55e" /></div>
          <div className="pm-kpi-body">
            <div className="pm-kpi-label">Valor Total em Estoque</div>
            <div className="pm-kpi-value" style={{ color:'#22c55e', fontSize:'1rem' }}>{fmtBRL(kpis.valorTotal)}</div>
            <div className="pm-kpi-sub">valor de custo</div>
          </div>
        </div>
        <div className="pm-kpi">
          <div className="pm-kpi-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><AlertTriangle size={22} color="#f59e0b" /></div>
          <div className="pm-kpi-body">
            <div className="pm-kpi-label">Próx. do Vencimento</div>
            <div className="pm-kpi-value" style={{ color:'#f59e0b' }}>{kpis.proxVencer}</div>
            <div className="pm-kpi-sub">vencem em até 7 dias</div>
          </div>
        </div>
        <div className="pm-kpi">
          <div className="pm-kpi-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertCircle size={22} color="#ef4444" /></div>
          <div className="pm-kpi-body">
            <div className="pm-kpi-label">Produtos Vencidos</div>
            <div className="pm-kpi-value" style={{ color:'#ef4444' }}>{kpis.vencidos}</div>
            <div className="pm-kpi-sub">em estoque</div>
          </div>
        </div>
        <div className="pm-kpi">
          <div className="pm-kpi-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><TrendingUp size={22} color="#60a5fa" /></div>
          <div className="pm-kpi-body">
            <div className="pm-kpi-label">Margem Média</div>
            <div className="pm-kpi-value" style={{ color:'#60a5fa' }}>{kpis.margem.toFixed(1)}%</div>
            <div className="pm-kpi-sub">margem estimada</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="pm-filters">
        <div className="pm-search-wrap">
          <Search size={14} className="pm-search-icon" />
          <input className="pm-search" placeholder="Buscar produto, código, marca..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="pm-filter-label">Categoria</span>
        <select className="pm-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="pm-filter-label">Fornecedor</span>
        <select className="pm-select" value={fornecedor} onChange={e => setFornecedor(e.target.value)}>
          {fors.map(f => <option key={f}>{f}</option>)}
        </select>
        <span className="pm-filter-label">Status</span>
        <select className="pm-select" value={statusFilt} onChange={e => setStatusFilt(e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="ok">OK</option>
          <option value="prox_vencer">Próx. Vencer</option>
          <option value="vencendo_hoje">Vencendo Hoje</option>
          <option value="vencido">Vencido</option>
        </select>
        <div className="pm-date-range">
          <span className="pm-filter-label">Vencimento de</span>
          <input type="date" className="pm-date-input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <span className="pm-filter-label">até</span>
          <input type="date" className="pm-date-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        {(search || categoria !== 'Todas' || fornecedor !== 'Todos' || statusFilt !== 'Todos' || dataInicio || dataFim) && (
          <button className="pm-clear-btn" onClick={() => { setSearch(''); setCategoria('Todas'); setFornecedor('Todos'); setStatusFilt('Todos'); setDataInicio(''); setDataFim(''); }}>LIMPAR</button>
        )}
      </div>

      {/* Table */}
      <div className="pm-table-wrap">
        {filtered.length === 0 ? (
          <div className="pm-empty">Nenhum produto encontrado.</div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>FOTO</th>
                <th>PRODUTO</th>
                <th>CÓDIGO</th>
                <th>CATEGORIA</th>
                <th className="num">ESTOQUE</th>
                <th className="num">PREÇO VENDA</th>
                <th className="num">CUSTO MÉDIO</th>
                <th className="num">VALOR ESTOQUE</th>
                <th>VENCIMENTO</th>
                <th className="num">DIAS</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.id} className={`pm-row${p.status === 'vencido' ? ' pm-row-vencido' : ''}`}>
                  <td>
                    {p.editImg
                      ? <div className="pm-foto-box" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
                          <img src={p.editImg} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                        </div>
                      : <div className="pm-foto-box" style={{ background: p.cor + '22' }}>{p.emoji}</div>
                    }
                  </td>
                  <td>
                    <div className="pm-prod-cell">
                      <span className="pm-prod-nome">{p.nome}</span>
                      <span className="pm-prod-sub">{p.sub}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:'11px', color:'#64748b' }}>{p.codigo}</td>
                  <td>{p.cat}</td>
                  <td className="pm-num">{p.estoque}</td>
                  <td className="pm-num">{fmtBRL(p.preco)}</td>
                  <td className="pm-num">{fmtBRL(p.custo)}</td>
                  <td className="pm-num" style={{ fontWeight:700, color:'#f8fafc' }}>{fmtBRL(p.valorEstoque)}</td>
                  <td>{fmtDate(p.venc)}</td>
                  <td className={`pm-dias ${PM_DIAS_CLS[p.status]}`}>
                    {p.dias < 0 ? p.dias : p.dias === 0 ? '0' : `+${p.dias}`}
                  </td>
                  <td><span className={`pm-badge ${PM_STATUS_CLS[p.status]}`}>{PM_STATUS_LABEL[p.status]}</span></td>
                  <td>
                    <div className="pm-actions">
                      <button className="pm-action-btn" title="Ver" onClick={() => setViewProd(p)}><Eye size={13} /></button>
                      <button className="pm-action-btn pm-action-edit" title="Editar" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="pm-totals">
                <td colSpan={7} style={{ color:'#64748b', fontSize:'12px' }}>Mostrando {(page-1)*LIMIT+1} a {Math.min(page*LIMIT, filtered.length)} de {filtered.length} produto{filtered.length !== 1 ? 's' : ''}</td>
                <td className="pm-num">{fmtBRL(filtered.reduce((s,p) => s+p.valorEstoque, 0))}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pm-pagination">
          <span className="pm-pag-info">Página {page} de {totalPages}</span>
          <div className="pm-pag-btns">
            <button className="pm-pag-btn" disabled={page===1} onClick={() => setPage(1)}>«</button>
            <button className="pm-pag-btn" disabled={page===1} onClick={() => setPage(p => p-1)}>‹</button>
            {pagBtns().map((b,i) => b === '…'
              ? <span key={`e${i}`} className="pm-pag-ellipsis">…</span>
              : <button key={b} className={`pm-pag-btn${page===b?' active':''}`} onClick={() => setPage(b)}>{b}</button>
            )}
            <button className="pm-pag-btn" disabled={page===totalPages} onClick={() => setPage(p => p+1)}>›</button>
            <button className="pm-pag-btn" disabled={page===totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="pm-analytics">
        {/* Donut status */}
        <div className="pm-panel">
          <div className="pm-panel-title">Distribuição por Status de Vencimento</div>
          <div className="pm-donut-wrap">
            <div className="pm-donut" style={{ background: donutBg }}>
              <div className="pm-donut-center">
                <span>{((sc.ok / aTotal)*100).toFixed(0)}%</span>
                <small>válidos</small>
              </div>
            </div>
            <div className="pm-legend">
              {donutParts.map(dp => (
                <div key={dp.label} className="pm-legend-item">
                  <div className="pm-legend-dot" style={{ background: dp.color }} />
                  <span className="pm-legend-label">{dp.label}</span>
                  <span className="pm-legend-val">{dp.count}</span>
                  <span className="pm-legend-pct">{dp.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiration by period */}
        <div className="pm-panel">
          <div className="pm-panel-title">▶ Expiração por Período</div>
          {[
            { label:'Até 7 dias',    count: exp.e7    },
            { label:'De 8 a 15 dias',count: exp.e8_15 },
            { label:'De 16 a 30 dias',count:exp.e16_30},
            { label:'Acima de 30 dias',count:exp.e30p },
          ].map(row => (
            <div key={row.label} className="pm-exp-row">
              <span className="pm-exp-label">{row.label}</span>
              <div className="pm-exp-right">
                <span className="pm-exp-count">{row.count}</span>
                <span className="pm-exp-pct">({((row.count/aTotal)*100).toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Categories by stock value */}
        <div className="pm-panel">
          <div className="pm-panel-title">▶ Categorias (Valor em Estoque)</div>
          {catList.map((c, i) => (
            <div key={c.nome} className="pm-cat-row">
              <span className="pm-cat-rank">{i+1}.</span>
              <span className="pm-cat-nome">{c.nome}</span>
              <span className="pm-cat-val">{fmtBRL(c.val)}</span>
            </div>
          ))}
        </div>

        {/* Vencimento CTA */}
        <div className="pm-panel">
          <div className="pm-panel-title">▶ Controle de Vencimento</div>
          <div className="pm-venc-icon"><Calendar size={20} color="#E31E24" /></div>
          <p className="pm-venc-desc">Mantenha o controle dos produtos próximos do vencimento para evitar perdas.</p>
          <button className="pm-venc-cta" onClick={() => { setStatusFilt('prox_vencer'); setPage(1); }}>
            VER PRODUTOS PRÓXIMOS DO VENCIMENTO
          </button>
        </div>
      </div>

      {/* ─── EDIT OVERLAY ─── */}
      {editProd && (
        <div className={`pm-edit-overlay${themeMode === 'light' ? ' theme-light' : ''}`} onClick={() => setEditProd(null)}>
          <div className="pm-edit-modal" onClick={e => e.stopPropagation()}>
          {/* Top bar */}
          <div className="pm-edit-topbar">
            <div className="pm-edit-topbar-title">
              <button className="pm-edit-back" onClick={() => setEditProd(null)}>
                <ChevronLeft size={14} /> VOLTAR
              </button>
              <span style={{ color: '#3a3a3a', margin: '0 4px' }}>|</span>
              <Package size={16} color="#E31E24" />
              EDIÇÃO DE PRODUTO — CONVENIÊNCIA
            </div>
            <div className="pm-edit-topbar-actions">
              <button className="pm-btn-outline" onClick={() => setEditProd(null)}>
                <X size={13} /> CANCELAR
              </button>
              <button className="pm-btn-primary" onClick={saveEdit}>
                <Save size={13} /> SALVAR ALTERAÇÕES
              </button>
              <button className="pm-btn-outline" onClick={() => printProductCard({ prod: editProd, editForm, editImg })}>
                <Printer size={13} /> IMPRIMIR PRODUTO
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="pm-edit-body">
            {/* 3-col grid */}
            <div className="pm-edit-grid">

              {/* LEFT: Image + Status */}
              <div className="pm-edit-col">
                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><Camera size={12} /> FOTO DO PRODUTO</div>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={imgInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => setEditImg(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                  <div className="pm-edit-img-box" style={{ background: editImg ? 'transparent' : editProd.cor + '22' }}>
                    {editImg
                      ? <img src={editImg} alt="produto" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      : editProd.emoji
                    }
                  </div>
                  <p className="pm-edit-img-hint">Formatos aceitos: JPG, PNG, WEBP<br />Tamanho máximo: 2 MB</p>
                  <div className="pm-edit-img-btns">
                    <button className="pm-edit-img-btn"
                      style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#94a3b8' }}
                      onClick={() => imgInputRef.current?.click()}>
                      <Camera size={11} /> ALTERAR
                    </button>
                    <button className="pm-edit-img-btn"
                      style={{ background: 'transparent', border: '1px solid #3a3a3a', color: '#ef4444' }}
                      onClick={() => setEditImg(null)}>
                      <Trash2 size={11} /> REMOVER
                    </button>
                  </div>
                </div>
                <div className="pm-edit-panel" style={{ textAlign: 'center' }}>
                  <div className="pm-edit-panel-title"><Tag size={12} /> STATUS DO PRODUTO</div>
                  <span className={`pm-badge ${PM_STATUS_CLS[editProd.status]}`} style={{ fontSize: '13px', padding: '6px 18px' }}>
                    {PM_STATUS_LABEL[editProd.status]}
                  </span>
                  <div style={{ marginTop: 10, fontSize: '11px', color: '#64748b' }}>
                    {editProd.dias < 0 ? `Vencido há ${Math.abs(editProd.dias)} dias` : editProd.dias === 0 ? 'Vence hoje' : `Vence em ${editProd.dias} dias`}
                  </div>
                  <div style={{ marginTop: 6, fontSize: '10px', color: '#505050' }}>
                    Vencimento: {fmtDate(editProd.venc)}
                  </div>
                </div>
              </div>

              {/* CENTER: Info + Prices */}
              <div className="pm-edit-col">
                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><Package size={12} /> INFORMAÇÕES BÁSICAS</div>
                  <div className="pm-edit-fg2">
                    <div className="pm-edit-field span2">
                      <label className="pm-edit-label">Nome do Produto</label>
                      <input className="pm-edit-input" readOnly value={editProd.nome} />
                      <span className="pm-edit-hint">Campo não editável</span>
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Código de Barras</label>
                      <input className="pm-edit-input" readOnly value={editProd.codigo} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Categoria</label>
                      <input className="pm-edit-input" readOnly value={editProd.cat} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Unidade de Medida</label>
                      <input className="pm-edit-input" readOnly value={editProd.uni} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Marca <span className="req">*</span></label>
                      <input className="pm-edit-input" value={editForm.marca}
                        onChange={e => setEditForm(f => ({ ...f, marca: e.target.value }))} />
                    </div>
                  </div>
                  <div className="pm-edit-field" style={{ marginTop: 12 }}>
                    <label className="pm-edit-label">Descrição</label>
                    <textarea className="pm-edit-textarea" value={editForm.desc}
                      onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))}
                      placeholder="Descrição do produto..." />
                  </div>
                </div>

                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><DollarSign size={12} /> PREÇOS E MARGEM</div>
                  <div className="pm-edit-fg2">
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Custo Médio (R$) <span className="req">*</span></label>
                      <input className="pm-edit-input" type="number" step="0.01" min="0" value={editForm.custo}
                        onChange={e => setEditForm(f => ({ ...f, custo: e.target.value }))} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Preço de Venda (R$) <span className="req">*</span></label>
                      <input className="pm-edit-input" type="number" step="0.01" min="0" value={editForm.preco}
                        onChange={e => setEditForm(f => ({ ...f, preco: e.target.value }))} />
                    </div>
                  </div>
                  {(() => {
                    const c = parseFloat(editForm.custo) || 0;
                    const v = parseFloat(editForm.preco) || 0.01;
                    const margem = ((v - c) / v * 100);
                    const cPct   = Math.min(c / v * 100, 100);
                    const mColor = margem >= 20 ? '#22c55e' : margem >= 10 ? '#f59e0b' : '#ef4444';
                    return (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Margem calculada</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: mColor }}>
                            {margem.toFixed(1)}%
                          </span>
                        </div>
                        <div className="pm-edit-margin-bar">
                          <div className="pm-edit-mc" style={{ width: cPct + '%' }}>
                            {cPct >= 20 ? `Custo ${cPct.toFixed(0)}%` : ''}
                          </div>
                          <div className="pm-edit-ml">
                            {(100 - cPct) >= 20 ? `Lucro ${(100 - cPct).toFixed(0)}%` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* RIGHT: Stock + Sales */}
              <div className="pm-edit-col">
                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><Database size={12} /> DADOS DE ESTOQUE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Estoque Atual</label>
                      <input className="pm-edit-input" type="number" min="0" value={editForm.estoque}
                        onChange={e => setEditForm(f => ({ ...f, estoque: e.target.value }))} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label">Estoque Mínimo</label>
                      <input className="pm-edit-input" type="number" min="0" value={editForm.estMin}
                        onChange={e => setEditForm(f => ({ ...f, estMin: e.target.value }))} />
                    </div>
                  </div>
                  <div className="pm-edit-field" style={{ marginTop: 12 }}>
                    <label className="pm-edit-label">Localização no Estoque</label>
                    <input className="pm-edit-input" value={editForm.local} placeholder="Ex: Prateleira A3"
                      onChange={e => setEditForm(f => ({ ...f, local: e.target.value }))} />
                  </div>
                  <div className="pm-toggle-wrap" style={{ marginTop: 14 }}>
                    <label className="pm-toggle">
                      <input type="checkbox" checked={!!editForm.controlVenc}
                        onChange={e => setEditForm(f => ({ ...f, controlVenc: e.target.checked }))} />
                      <span className="pm-toggle-slider" />
                    </label>
                    <span className="pm-toggle-lbl">Controle de Vencimento</span>
                  </div>
                </div>

                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><TrendingUp size={12} /> VENDAS DO MÊS</div>
                  {(() => {
                    const qtd    = 20 + (editProd.id % 60);
                    const preco  = parseFloat(editForm.preco) || editProd.preco;
                    const est    = parseInt(editForm.estoque) || 1;
                    return [
                      ['Total Vendido (mês)', fmtBRL(qtd * preco)],
                      ['Qtd. Vendida',        `${qtd} un.`],
                      ['Ticket Médio',        fmtBRL(preco)],
                      ['Giro de Estoque',     (qtd / est).toFixed(1) + 'x'],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="pm-edit-stat">
                        <span className="pm-edit-stat-lbl">{lbl}</span>
                        <span className="pm-edit-stat-val">{val}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>{/* end grid */}

            {/* Additional info bar */}
            <div className="pm-edit-addl">
              <div className="pm-edit-field">
                <label className="pm-edit-label">Fornecedor <span className="req">*</span></label>
                <input className="pm-edit-input" value={editForm.forn}
                  onChange={e => setEditForm(f => ({ ...f, forn: e.target.value }))} />
              </div>
              <div className="pm-edit-field">
                <label className="pm-edit-label">Data de Cadastro</label>
                <input className="pm-edit-input" readOnly value="15/01/2024" />
              </div>
              <div className="pm-edit-field">
                <label className="pm-edit-label">Última Alteração</label>
                <input className="pm-edit-input" readOnly value={new Date().toLocaleDateString('pt-BR')} />
              </div>
              <div className="pm-edit-field">
                <label className="pm-edit-label">Situação</label>
                <input className="pm-edit-input" readOnly value="ATIVO" />
              </div>
            </div>
          </div>{/* end body */}
          </div>{/* end pm-edit-modal */}
        </div>
      )}

      {/* Modal de detalhes */}
      {viewProd && (
        <div className="pm-modal-overlay" onClick={() => setViewProd(null)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3 className="pm-modal-title">Detalhes do Produto</h3>
              <button className="pm-modal-close" onClick={() => setViewProd(null)}><X size={18} /></button>
            </div>
            <div className="pm-modal-body">
              {viewProd.editImg
                ? <div className="pm-modal-foto" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
                    <img src={viewProd.editImg} alt={viewProd.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  </div>
                : <div className="pm-modal-foto" style={{ background: viewProd.cor + '22' }}>{viewProd.emoji}</div>
              }
              {[
                ['Produto',        viewProd.nome],
                ['Categoria',      viewProd.sub],
                ['Código',         viewProd.codigo],
                ['Categoria',      viewProd.cat],
                ['Fornecedor',     viewProd.forn],
                ['Unidade',        viewProd.uni],
                ['Estoque',        viewProd.estoque + ' un.'],
                ['Preço de Venda', fmtBRL(viewProd.preco)],
                ['Custo Médio',    fmtBRL(viewProd.custo)],
                ['Valor em Estoque', fmtBRL(viewProd.valorEstoque)],
                ['Vencimento',     fmtDate(viewProd.venc)],
                ['Dias p/ Vencer', viewProd.dias < 0 ? `${Math.abs(viewProd.dias)} dias vencido` : viewProd.dias === 0 ? 'Vence hoje' : `${viewProd.dias} dias`],
                ['Status',         PM_STATUS_LABEL[viewProd.status]],
              ].map(([k, v]) => (
                <div key={k} className="pm-modal-row">
                  <span className="pm-modal-key">{k}</span>
                  <span className="pm-modal-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── EstoqueManager — wraps Pista (StockPosition) + Conveniência ───────────
const EstoqueManager = ({ estoques, projecao, loading, selectedClient, clients, themeMode }) => {
  const [tab, setTab] = useState('conveniencia');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="estoque-tab-bar">
        <div className="vp-toggle-group">
          <button type="button" className={`vp-period-btn vp-secao-btn${tab === 'conveniencia' ? ' active' : ''}`} onClick={() => setTab('conveniencia')}>🏪 Conveniência</button>
          <button type="button" className={`vp-period-btn vp-secao-btn${tab === 'pista' ? ' active' : ''}`} onClick={() => setTab('pista')}>⛽ Combustíveis</button>
        </div>
      </div>
      {tab === 'pista'
        ? <StockPosition estoques={estoques} projecao={projecao} loading={loading} selectedClient={selectedClient} clients={clients} />
        : <ConvenienciaManager themeMode={themeMode} />
      }
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

  const fmtR = fmtBRL;

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
        <h2>GERENCIAMENTO DE PRODUTOS — COMBUSTÍVEIS</h2>
      </div>

      {loading && (
        <LoadingState compact label="Atualizando combustíveis..." />
      )}

      <div className="stock-grid">
        <div className="stock-left-col">
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

          <div style={{ padding: '12px 4px 4px', filter: `drop-shadow(0 0 20px ${stockFuelColor}55)` }}>
            <HorizTank
              pct={tankPct}
              color={stockFuelColor}
              liters={activeFuel?.estoqueTotal || 0}
            />
          </div>

          <div className="update-time">
            <Calendar size={18} />
            <span>CAPACIDADE TOTAL:</span>
            <strong>{activeFuel ? fmt2(activeFuel.capacidadeTotal) + ' L' : '—'}</strong>
          </div>
        </div>

        <div className="stock-values-card">
          <div className="card-header">
            <h3>VALORES ESTOQUE</h3>
          </div>
          <div className="value-items">
            <div className="value-item">
              <div className="value-icon"><Droplet size={22} /></div>
              <div className="value-content">
                <div className="value-label">PREÇO DE VENDA / L</div>
                <div className="value-amount">{fmtR(activeFuel?.precoVenda)}</div>
              </div>
            </div>
            <div className="value-item highlight">
              <div className="value-icon"><Layers size={22} /></div>
              <div className="value-content">
                <div className="value-label">VALOR TOTAL ESTOQUE</div>
                <div className="value-amount">{fmtR(activeFuel?.valorEstoque)}</div>
              </div>
            </div>
            <div className="value-item">
              <div className="value-icon"><CircleDollarSign size={22} /></div>
              <div className="value-content">
                <div className="value-label">CUSTO MÉDIO / L</div>
                <div className="value-amount">{fmtR(activeFuel?.custoMedio)}</div>
              </div>
            </div>
            <div className="value-item">
              <div className="value-icon"><Calculator size={22} /></div>
              <div className="value-content">
                <div className="value-label">MARGEM ESTIMADA</div>
                <div className="value-amount" style={{ color: (activeFuel?.margem || 0) > 0 ? '#22c55e' : '#f87171' }}>
                  {(activeFuel?.margem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>{/* end stock-left-col */}

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
  const [showModal, setShowModal]     = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode]     = useState('edit');
  const [searchTerm, setSearchTerm]   = useState('');
  const [userImages, setUserImages]   = useState({});

  useEffect(() => {
    userImgLoadAll().then(setUserImages).catch(() => {});
  }, []);

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
    toast(`${user.name} — ${user.role} — ${user.status}`, 'info');
  };

  const handleDelete = (userId) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return;

    const shouldDelete = window.confirm(`Deseja remover o usuário ${user.name}?`);
    if (shouldDelete) {
      setUsers(users.filter((item) => item.id !== userId));
    }
  };

  const handleSave = (formData, imgData) => {
    let savedId;
    if (modalMode === 'create') {
      savedId = Date.now();
      setUsers([...users, {
        ...formData,
        id: savedId,
        avatar: formData.name.trim().charAt(0).toUpperCase() || 'U',
        lastAccess: 'Nunca',
      }]);
    } else {
      savedId = selectedUser.id;
      setUsers(users.map(u => u.id === savedId ? { ...u, ...formData } : u));
    }
    if (imgData) {
      userImgSave(savedId, imgData)
        .then(compressed => {
          setUserImages(prev => ({ ...prev, [String(savedId)]: compressed }));
          toast('Foto salva!', 'success');
        })
        .catch(err => toast(`Erro ao salvar foto: ${err.message}`, 'error'));
    } else if (userImages[String(savedId)] && imgData === null) {
      userImgDelete(savedId)
        .then(() => setUserImages(prev => { const n = { ...prev }; delete n[String(savedId)]; return n; }))
        .catch(err => toast(`Erro ao remover foto: ${err.message}`, 'error'));
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
                  {userImages[String(user.id)]
                    ? <img src={userImages[String(user.id)]} alt={user.avatar} className="avatar avatar-img-circle" />
                    : <div className="avatar">{user.avatar}</div>
                  }
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
          existingImg={userImages[String(selectedUser?.id)] || null}
        />
      )}
    </div>
  );
};

// User Edit Modal
const UserEditModal = ({ user, mode, onClose, onSave, existingImg }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    role: user.role,
    status: user.status,
    senha: '',
    notifications: false,
    apiAccess: false,
  });
  const [editImg, setEditImg] = useState(existingImg || null);
  const imgInputRef = useRef(null);

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast('Imagem muito grande. Máximo 3MB.', 'warn'); return; }
    const reader = new FileReader();
    reader.onload = ev => setEditImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, editImg);
  };

  const initials = (formData.name || user.avatar || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <div
              className="user-avatar-upload"
              onClick={() => imgInputRef.current?.click()}
              title="Clique para alterar foto"
            >
              {editImg
                ? <img src={editImg} alt="avatar" className="user-avatar-img" />
                : <div className="avatar large">{initials}</div>
              }
              <div className="user-avatar-overlay">
                <Camera size={14} />
              </div>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImgChange}
              />
            </div>
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
    toast('Empresa salva com sucesso!', 'success');
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

// ─── GoalManager — Gestão de Metas ──────────────────────────────────────────

const GOAL_CAT_COLORS = {
  'Faturamento':      '#22c55e',
  'Redução de Custos':'#3b82f6',
  'Lucro Líquido':    '#8b5cf6',
  'Contas a Receber': '#f59e0b',
  'Outros':           '#ef4444',
};

const INITIAL_GOALS = [
  { id:1,  nome:'Faturamento Mensal',           desc:'Aumentar o faturamento mensal da empresa',       categoria:'Faturamento',       periodo:'Mensal',      meta:600000,  alcancado:428750, status:'Em andamento', vencimento:'2026-04-30' },
  { id:2,  nome:'Redução de Custos Operacionais',desc:'Reduzir custos operacionais em 15%',            categoria:'Redução de Custos', periodo:'Trimestral',  meta:300000,  alcancado:186400, status:'Em andamento', vencimento:'2026-06-30' },
  { id:3,  nome:'Lucro Líquido Trimestral',      desc:'Alcançar lucro líquido de 12%',                 categoria:'Lucro Líquido',     periodo:'Trimestral',  meta:280000,  alcancado:198350, status:'Em andamento', vencimento:'2026-06-30' },
  { id:4,  nome:'Recebimento de Clientes',       desc:'Reduzir inadimplência para menos de 5%',        categoria:'Contas a Receber',  periodo:'Mensal',      meta:200000,  alcancado:156800, status:'Em andamento', vencimento:'2026-04-30' },
  { id:5,  nome:'Expansão de Mercado',           desc:'Aumentar base de clientes em 20%',              categoria:'Outros',            periodo:'Semestral',   meta:150000,  alcancado:45180,  status:'Em andamento', vencimento:'2026-08-31' },
  { id:6,  nome:'Meta Vendas Q2',                desc:'Superar meta de vendas do segundo trimestre',   categoria:'Faturamento',       periodo:'Trimestral',  meta:900000,  alcancado:0,      status:'Em andamento', vencimento:'2026-09-30' },
  { id:7,  nome:'Margem Líquida',                desc:'Atingir margem de 15%',                         categoria:'Lucro Líquido',     periodo:'Trimestral',  meta:620000,  alcancado:182000, status:'Em atraso',    vencimento:'2026-03-31' },
  { id:8,  nome:'Estoque Mínimo',                desc:'Manter estoque de segurança por período',       categoria:'Outros',            periodo:'Mensal',      meta:100000,  alcancado:35000,  status:'Em atraso',    vencimento:'2026-03-31' },
  { id:9,  nome:'Eficiência Operacional',        desc:'Melhorar margem bruta em 8%',                   categoria:'Redução de Custos', periodo:'Anual',       meta:900000,  alcancado:900000, status:'Concluída',    vencimento:'2025-12-31' },
  { id:10, nome:'Volume de Combustíveis',        desc:'Aumentar volume de venda em 25%',               categoria:'Faturamento',       periodo:'Anual',       meta:1200000, alcancado:1200000,status:'Concluída',    vencimento:'2025-12-31' },
  { id:11, nome:'Captação Novos Clientes',       desc:'Fechar 50 novos contratos no ano',              categoria:'Outros',            periodo:'Anual',       meta:120000,  alcancado:120000, status:'Concluída',    vencimento:'2025-12-31' },
];

const GOAL_MONTHLY_CHART = [
  { mes:'Jan', meta:400000, alcancado:285000, previsto:310000 },
  { mes:'Fev', meta:600000, alcancado:421000, previsto:490000 },
  { mes:'Mar', mes_full:'Mar', meta:750000, alcancado:612000, previsto:670000 },
  { mes:'Abr', meta:950000, alcancado:793750, previsto:860000 },
  { mes:'Mai', meta:1100000, alcancado:0,     previsto:1000000 },
  { mes:'Jun', meta:1250000, alcancado:0,     previsto:1140000 },
  { mes:'Jul', meta:1380000, alcancado:0,     previsto:1260000 },
  { mes:'Ago', meta:1500000, alcancado:0,     previsto:1390000 },
  { mes:'Set', meta:1640000, alcancado:0,     previsto:1520000 },
  { mes:'Out', meta:1760000, alcancado:0,     previsto:1640000 },
  { mes:'Nov', meta:1890000, alcancado:0,     previsto:1760000 },
  { mes:'Dez', meta:2020000, alcancado:0,     previsto:1900000 },
];

const EMPTY_GOAL_FORM = { nome:'', desc:'', categoria:'Faturamento', periodo:'Mensal', meta:'', alcancado:'', vencimento:'', status:'Em andamento' };

const GoalManager = ({ themeMode = 'dark' }) => {
  const [activeTab, setActiveTab]   = useState('visao');
  const [goals, setGoals]           = useState(INITIAL_GOALS);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('Todas');
  const [statusFilter, setStatus]   = useState('Todos');
  const [orderBy, setOrderBy]       = useState('vencimento');
  const [page, setPage]             = useState(1);
  const [editGoal, setEditGoal]     = useState(null);
  const [form, setForm]             = useState(EMPTY_GOAL_FORM);
  const [nextId, setNextId]         = useState(12);
  const PAGE_SIZE = 5;

  const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
  const fmtPct = v => Number(v || 0).toFixed(1) + '%';
  const fmtK   = v => {
    const n = Number(v || 0);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace('.',',') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
    return n.toLocaleString('pt-BR');
  };
  const today = new Date().toISOString().split('T')[0];

  const kpis = useMemo(() => {
    const ativas   = goals.filter(g => g.status === 'Em andamento');
    const concl    = goals.filter(g => g.status === 'Concluída').length;
    const atrasadas= goals.filter(g => g.status === 'Em atraso').length;
    const progMed  = ativas.length ? ativas.reduce((s,g) => s + Math.min(100, g.meta > 0 ? g.alcancado/g.meta*100 : 0), 0) / ativas.length : 0;
    const totalAlc = goals.reduce((s,g) => s + g.alcancado, 0);
    const venceHoje= goals.filter(g => g.vencimento === today).length;
    return { ativas: ativas.length, concl, atrasadas, progMed, totalAlc, venceHoje };
  }, [goals, today]);

  const catDist = useMemo(() => {
    const map = {};
    goals.forEach(g => { map[g.categoria] = (map[g.categoria] || 0) + g.meta; });
    const total = Object.values(map).reduce((s,v) => s+v, 0);
    return Object.entries(map).map(([cat, val]) => ({
      name: cat, value: val, pct: total > 0 ? (val/total*100).toFixed(1) : '0',
      color: GOAL_CAT_COLORS[cat] || '#6b7280',
    }));
  }, [goals]);

  // Filtered + ordered list
  const filtered = useMemo(() => {
    let list = goals;
    if (search)              list = list.filter(g => g.nome.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'Todas')  list = list.filter(g => g.categoria === catFilter);
    if (statusFilter !== 'Todos') list = list.filter(g => g.status === statusFilter);
    list = [...list].sort((a,b) => {
      if (orderBy === 'vencimento') return a.vencimento.localeCompare(b.vencimento);
      if (orderBy === 'meta')       return b.meta - a.meta;
      if (orderBy === 'progresso')  return (b.meta>0 ? b.alcancado/b.meta : 0) - (a.meta>0 ? a.alcancado/a.meta : 0);
      return 0;
    });
    return list;
  }, [goals, search, catFilter, statusFilter, orderBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const statusBadge = (s) => {
    const map = { 'Em andamento': ['#1d4ed8','#dbeafe'], 'Concluída': ['#15803d','#dcfce7'], 'Em atraso': ['#b91c1c','#fee2e2'] };
    const [bg, fg] = map[s] || ['#374151','#f3f4f6'];
    return <span style={{ background:bg, color:fg, padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:700 }}>{s}</span>;
  };

  const diasRestantes = (venc) => {
    const diff = Math.round((new Date(venc+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000);
    if (diff < 0) return <span style={{ color:'#ef4444', fontSize:11 }}>{Math.abs(diff)} dias em atraso</span>;
    if (diff === 0) return <span style={{ color:'#f59e0b', fontSize:11, fontWeight:700 }}>Vence hoje</span>;
    return <span style={{ color: diff <= 7 ? '#f59e0b' : '#94a3b8', fontSize:11 }}>{diff} dias restantes</span>;
  };

  const handleDelete = (id) => {
    if (window.confirm('Remover esta meta?')) setGoals(prev => prev.filter(g => g.id !== id));
  };

  const openEdit = (g) => {
    setEditGoal(g);
    setForm({ nome:g.nome, desc:g.desc, categoria:g.categoria, periodo:g.periodo,
              meta:String(g.meta), alcancado:String(g.alcancado), vencimento:g.vencimento, status:g.status });
    setActiveTab('criar');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const parsed = { ...form, meta: parseFloat(form.meta)||0, alcancado: parseFloat(form.alcancado)||0 };
    if (editGoal) {
      setGoals(prev => prev.map(g => g.id === editGoal.id ? { ...g, ...parsed } : g));
      setEditGoal(null);
    } else {
      setGoals(prev => [...prev, { ...parsed, id: nextId }]);
      setNextId(n => n+1);
    }
    setForm(EMPTY_GOAL_FORM);
    setActiveTab('todas');
  };

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Impressão (mesmo tema do Ranking de Vendas) ─────────────────────────────
  const _REPORT_CSS = `
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box}
    /* Força tema claro — evita dark mode do SO contaminar a impressão */
    :root{color-scheme:light only}
    html{color-scheme:light}
    html,body,.report,.header,.panel,.summary-item,.mark,.bar-track,.bar-fill,table,th,td,tfoot td{
      -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111827;background:#ffffff!important}
    .report{min-height:100vh;padding:18px;background:#ffffff!important}
    .header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border:1px solid #e5e7eb;border-bottom:3px solid #e31e24;border-radius:8px;background:#ffffff;margin-bottom:14px}
    .header-left{display:flex;align-items:center;gap:14px;min-width:0}
    .mark{width:44px;height:44px;border-radius:8px;background:#fff5f5;border:1px solid #fecaca;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;line-height:1}
    h1{margin:0;font-size:20px;letter-spacing:0;line-height:1.15;font-weight:900}
    .header-sub{color:#667085;font-size:11px;margin-top:3px}
    .header-meta{color:#667085;font-size:11px;line-height:1.45;text-align:right}
    /* KPI strip */
    .kpi-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px}
    .kpi-card{border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;padding:12px 14px}
    .kpi-lbl{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#667085;margin-bottom:4px}
    .kpi-val{font-size:20px;font-weight:900;line-height:1.1;margin-bottom:2px}
    .kpi-sub{font-size:9px;color:#9ca3af}
    /* Dashboard grid */
    .dashboard{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:14px;align-items:stretch;margin-bottom:14px}
    .panel{border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;padding:18px}
    .panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
    .panel-title{margin:0;color:#111827;font-size:13px;font-weight:800}
    .pill{border:1px solid #d0d5dd;border-radius:8px;color:#344054;padding:7px 10px;font-size:9.5px;font-weight:800;white-space:nowrap;background:#f9fafb}
    /* Ranking bars */
    .rank-list{display:grid;gap:14px}
    .rank-row{display:grid;grid-template-columns:42px minmax(170px,220px) minmax(140px,1fr) 110px;align-items:center;gap:10px;min-height:48px}
    .rank-pos{color:#111827;font-size:20px;font-weight:900}
    .rank-person{display:flex;align-items:center;gap:9px;min-width:0}
    .avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:#475467;border:2px solid #d1d5db;font-size:11px;font-weight:900;flex:0 0 auto}
    .person-text strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#111827}
    .person-text span{display:block;margin-top:3px;color:#667085;font-size:10px;font-weight:700}
    .bar-track{height:36px;background:#e5e7eb;border-radius:0;overflow:hidden}
    .bar-fill{height:100%;border-radius:0}
    .bar-value{color:#111827;font-size:12px;font-weight:900;text-align:right;white-space:nowrap}
    /* Summary */
    .summary-grid{display:grid;gap:10px}
    .summary-item{border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;padding:14px}
    .summary-item span{display:block;color:#667085;font-size:9.5px;font-weight:800;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
    .summary-item strong{display:block;color:#111827;font-size:18px;line-height:1.15;font-weight:900}
    /* Details table */
    .details{margin-top:0}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}
    th,td{border:1px solid #d0d5dd;padding:7px;word-break:break-word}
    th{background:#e31e24;color:#fff;text-align:left;font-size:9px;font-weight:800}
    td{color:#111827;background:#fff}
    td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
    tfoot td{color:#111827;background:#f3f4f6;font-weight:900}
    /* Progress bar inline */
    .prog-wrap{display:flex;align-items:center;gap:5px}
    .prog-bg{flex:1;height:5px;border-radius:3px;background:#e5e7eb}
    .prog-fill-sm{height:5px;border-radius:3px}
    .prog-pct{font-size:9px;font-weight:700;white-space:nowrap}
    /* Badge */
    .badge{border-radius:10px;padding:2px 8px;font-size:9px;font-weight:700;display:inline-block;white-space:nowrap}
    .b-and{background:#dbeafe;color:#1d4ed8}
    .b-ok{background:#dcfce7;color:#15803d}
    .b-late{background:#fee2e2;color:#b91c1c}
    /* Cat list */
    .cat-it{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:11px}
    .cat-it:last-child{border-bottom:none}
    .dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0}
    /* Filters pill */
    .flt-tag{display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:5px;padding:2px 8px;font-size:9px;color:#374151;margin-right:5px}
    .footer{margin-top:10px;color:#667085;font-size:10px;text-align:right}
    @media screen{
      body{background:#f3f4f6;padding:18px}
      .report{max-width:1180px;min-height:auto;margin:0 auto;box-shadow:0 18px 50px rgba(15,23,42,.12)}
    }
    @media print{
      .panel,.header,tr{break-inside:avoid;page-break-inside:avoid}
      html,body,*:not(th):not(.bar-fill):not(.mark):not(.mark span):not(.badge){
        background-color:#ffffff!important;
        color-scheme:light!important;
      }
      body{color:#111827!important}
      .report{box-shadow:none!important}
      th{background:#e31e24!important;color:#fff!important}
      tfoot td{background:#f3f4f6!important;color:#111827!important}
    }
  `;

  const _badge = s => {
    const m = {'Em andamento':'b-and','Concluída':'b-ok','Em atraso':'b-late'};
    return `<span class="badge ${m[s]||'b-and'}">${s}</span>`;
  };
  const _progInline = (pct, col) =>
    `<div class="prog-wrap"><div class="prog-bg"><div class="prog-fill-sm" style="width:${pct}%;background:${col}"></div></div><span class="prog-pct" style="color:${col}">${pct.toFixed(1)}%</span></div>`;
  const _vencDays = venc => {
    const diff = Math.round((new Date(venc+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000);
    if (diff < 0) return `<span style="color:#dc2626;font-size:9px">${Math.abs(diff)} dias em atraso</span>`;
    if (diff === 0) return `<span style="color:#d97706;font-size:9px;font-weight:700">Vence hoje</span>`;
    return `<span style="color:${diff<=7?'#d97706':'#6b7280'};font-size:9px">${diff} dias restantes</span>`;
  };
  const _goalTR = g => {
    const pct = g.meta > 0 ? Math.min(100, g.alcancado / g.meta * 100) : 0;
    const col = GOAL_CAT_COLORS[g.categoria] || '#6b7280';
    return `<tr>
      <td><strong style="font-size:11px">${g.nome}</strong><br/><span style="color:#667085;font-size:9px">${g.desc}</span></td>
      <td><span style="color:${col};font-weight:700">${g.categoria}</span></td>
      <td style="color:#374151">${g.periodo}</td>
      <td class="num">${fmtBRL(g.meta)}</td>
      <td class="num">${fmtBRL(g.alcancado)}</td>
      <td>${_progInline(pct, col)}</td>
      <td>${_badge(g.status)}</td>
      <td>${g.vencimento}<br/>${_vencDays(g.vencimento)}</td>
    </tr>`;
  };

  const _openTab = html => {
    const w = window.open('', '_blank');
    if (!w) { alert('Permita pop-ups no navegador para abrir o relatório.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const printVisaoGeral = () => {
    const now      = new Date().toLocaleString('pt-BR');
    const ativas   = goals.filter(g => g.status === 'Em andamento');
    const atrasadas= goals.filter(g => g.status === 'Em atraso');
    const concl    = goals.filter(g => g.status === 'Concluída');
    const totalMeta= goals.reduce((s,g) => s+g.meta,0);
    const totalAlc = goals.reduce((s,g) => s+g.alcancado,0);
    // Ranking bars: top 5 por alcançado
    const top5 = [...goals].sort((a,b) => b.alcancado - a.alcancado).slice(0,5);
    const maxAlc = top5[0]?.alcancado || 1;
    const RANK_COLORS = ['#22c55e','#eab308','#f97316','#ef4444','#ef4444'];
    const initials = n => n.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
    const rankRows = top5.map((g,i) => {
      const w = Math.max(4, (g.alcancado/maxAlc)*100);
      const col = GOAL_CAT_COLORS[g.categoria] || RANK_COLORS[i];
      return `<div class="rank-row">
        <div class="rank-pos">${i+1}°</div>
        <div class="rank-person">
          <div class="avatar" style="background:${col}">${initials(g.nome)}</div>
          <div class="person-text">
            <strong>${g.nome}</strong>
            <span>${g.categoria} · ${g.periodo}</span>
          </div>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%;background:${col}"></div></div>
        <div class="bar-value">${fmtBRL(g.alcancado)}</div>
      </div>`;
    }).join('');

    _openTab(`<!doctype html><html><head><meta charset="utf-8">
      <meta name="color-scheme" content="light">
      <title>Relatório Gestão de Metas — Visão Geral</title>
      <style>${_REPORT_CSS}</style></head>
      <body><main class="report">
        <section class="header">
          <div class="header-left">
            <div class="mark">🎯</div>
            <div>
              <h1>RELATÓRIO GESTÃO DE METAS</h1>
              <div class="header-sub">Visão Geral — ${new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</div>
            </div>
          </div>
          <div class="header-meta">
            <div>Metas ativas: ${kpis.ativas} &nbsp;|&nbsp; Concluídas: ${kpis.concl} &nbsp;|&nbsp; Em atraso: ${kpis.atrasadas}</div>
            <div>Gerado em ${now}</div>
          </div>
        </section>

        <div class="kpi-strip">
          <div class="kpi-card"><div class="kpi-lbl">Metas Ativas</div><div class="kpi-val" style="color:#6366f1">${kpis.ativas}</div><div class="kpi-sub">Em andamento</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Concluídas</div><div class="kpi-val" style="color:#16a34a">${kpis.concl}</div><div class="kpi-sub">Este ano</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Progresso Médio</div><div class="kpi-val" style="color:#2563eb">${fmtPct(kpis.progMed)}</div><div class="kpi-sub">Das metas ativas</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Total Alcançado</div><div class="kpi-val" style="color:#d97706;font-size:15px">${fmtBRL(totalAlc)}</div><div class="kpi-sub">Valor acumulado</div></div>
          <div class="kpi-card"><div class="kpi-lbl">A Vencer Hoje</div><div class="kpi-val" style="color:#d97706">${kpis.venceHoje}</div><div class="kpi-sub">Próximas do vencimento</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Em Atraso</div><div class="kpi-val" style="color:#dc2626">${kpis.atrasadas}</div><div class="kpi-sub">Fora do prazo</div></div>
        </div>

        <section class="dashboard">
          <div class="panel">
            <div class="panel-head">
              <h2 class="panel-title">TOP 5 METAS — MAIOR ATINGIMENTO</h2>
              <div class="pill">R$ ALCANÇADO</div>
            </div>
            <div class="rank-list">${rankRows}</div>
          </div>
          <aside class="panel">
            <div class="panel-head"><h2 class="panel-title">RESUMO</h2></div>
            <div class="summary-grid">
              <div class="summary-item"><span>Total de Metas</span><strong>${goals.length}</strong></div>
              <div class="summary-item"><span>Meta Total (R$)</span><strong>${fmtBRL(totalMeta)}</strong></div>
              <div class="summary-item"><span>Total Alcançado</span><strong>${fmtBRL(totalAlc)}</strong></div>
            </div>
            <div style="margin-top:12px">
              ${catDist.map(c=>`
                <div class="cat-it">
                  <span><span class="dot" style="background:${c.color}"></span>${c.name}</span>
                  <span style="font-weight:700">${c.pct}%</span>
                </div>`).join('')}
            </div>
          </aside>
        </section>

        <section class="panel details">
          <div class="panel-head"><h2 class="panel-title">DETALHAMENTO — METAS ABERTAS (${ativas.length + atrasadas.length})</h2></div>
          <table>
            <thead><tr>
              <th style="width:22%">Meta</th><th style="width:13%">Categoria</th><th style="width:8%">Período</th>
              <th class="num" style="width:11%">Meta (R$)</th><th class="num" style="width:11%">Alcançado</th>
              <th style="width:13%">Progresso</th><th style="width:10%">Status</th><th style="width:12%">Vencimento</th>
            </tr></thead>
            <tbody>${[...ativas, ...atrasadas].map(_goalTR).join('')}</tbody>
            <tfoot><tr>
              <td colspan="3">TOTAL</td>
              <td class="num">${fmtBRL([...ativas,...atrasadas].reduce((s,g)=>s+g.meta,0))}</td>
              <td class="num">${fmtBRL([...ativas,...atrasadas].reduce((s,g)=>s+g.alcancado,0))}</td>
              <td colspan="3">${ativas.length} em andamento · ${atrasadas.length} em atraso</td>
            </tr></tfoot>
          </table>
        </section>

        <footer class="footer">STARVL | Relatório Gestão de Metas — Visão Geral</footer>
      </main>
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print();},500);})</script>
      </body></html>`);
  };

  const printTodasMetas = () => {
    const now      = new Date().toLocaleString('pt-BR');
    const totalMeta= filtered.reduce((s,g) => s+g.meta,0);
    const totalAlc = filtered.reduce((s,g) => s+g.alcancado,0);
    const totalPct = totalMeta > 0 ? Math.min(100,(totalAlc/totalMeta*100)) : 0;
    const filtersActive = [
      catFilter !== 'Todas'    ? `Categoria: ${catFilter}`   : null,
      statusFilter !== 'Todos' ? `Status: ${statusFilter}`   : null,
      search                   ? `Busca: "${search}"`        : null,
      `Ordenar por: ${orderBy === 'vencimento' ? 'Vencimento' : orderBy === 'meta' ? 'Meta' : 'Progresso'}`,
    ].filter(Boolean);

    _openTab(`<!doctype html><html><head><meta charset="utf-8">
      <meta name="color-scheme" content="light">
      <title>Relatório Gestão de Metas — Todas as Metas</title>
      <style>${_REPORT_CSS}</style></head>
      <body><main class="report">
        <section class="header">
          <div class="header-left">
            <div class="mark">🎯</div>
            <div>
              <h1>RELATÓRIO GESTÃO DE METAS</h1>
              <div class="header-sub">
                Filtros: ${filtersActive.map(f=>`<span class="flt-tag">${f}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="header-meta">
            <div>${filtered.length} meta${filtered.length!==1?'s':''} exibida${filtered.length!==1?'s':''}</div>
            <div>Gerado em ${now}</div>
          </div>
        </section>

        <section class="panel details">
          <div class="panel-head"><h2 class="panel-title">DETALHAMENTO (${filtered.length} metas)</h2></div>
          <table>
            <thead><tr>
              <th style="width:22%">Meta</th><th style="width:13%">Categoria</th><th style="width:8%">Período</th>
              <th class="num" style="width:11%">Meta (R$)</th><th class="num" style="width:11%">Alcançado</th>
              <th style="width:13%">Progresso</th><th style="width:10%">Status</th><th style="width:12%">Vencimento</th>
            </tr></thead>
            <tbody>${filtered.map(_goalTR).join('')}</tbody>
            <tfoot><tr>
              <td colspan="3">TOTAL DO PERÍODO (${filtered.length} metas)</td>
              <td class="num">${fmtBRL(totalMeta)}</td>
              <td class="num">${fmtBRL(totalAlc)}</td>
              <td>${_progInline(totalPct,'#6366f1')}</td>
              <td colspan="2">${kpis.ativas} ativas · ${kpis.concl} concluídas · ${kpis.atrasadas} em atraso</td>
            </tr></tfoot>
          </table>
        </section>

        <footer class="footer">STARVL | Relatório Gestão de Metas — Todas as Metas</footer>
      </main>
      <script>window.addEventListener('load',function(){setTimeout(function(){window.print();},500);})</script>
      </body></html>`);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const dark = themeMode !== 'light';
  const S = {
    page:    { padding:'24px', maxWidth:1200, margin:'0 auto' },
    header:  { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 },
    title:   { margin:0, fontSize:22, fontWeight:800, color: dark ? '#f8fafc' : '#111827', letterSpacing:1 },
    sub:     { margin:'4px 0 0', fontSize:13, color: dark ? '#94a3b8' : '#6b7280' },
    btnNew:  { display:'flex', alignItems:'center', gap:6, background:'#E31E24', color:'#fff', border:'none', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer' },
    tabs:    { display:'flex', gap:0, borderBottom:`2px solid ${dark ? '#2c2c2e' : '#e5e7eb'}`, marginBottom:24 },
    tab:     (active) => ({ background:'none', border:'none', cursor:'pointer', padding:'10px 22px', fontSize:13, fontWeight:600, color: active ? '#E31E24' : (dark ? '#64748b' : '#6b7280'), borderBottom: active ? '2px solid #E31E24' : '2px solid transparent', marginBottom:-2, transition:'color .15s' }),
    kpiRow:  { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:24 },
    kpiCard: (accent) => ({ background: dark ? '#1c1c1e' : '#ffffff', border:`1px solid ${accent}44`, borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:4, boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,.07)' }),
    kpiLbl:  { fontSize:10, fontWeight:700, color: dark ? '#6b7280' : '#9ca3af', letterSpacing:1, textTransform:'uppercase' },
    kpiVal:  (accent) => ({ fontSize:20, fontWeight:900, color: accent || (dark ? '#f8fafc' : '#111827'), margin:0 }),
    kpiSub:  { fontSize:11, color: dark ? '#4b5563' : '#9ca3af' },
    grid2:   { display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 },
    card:    { background: dark ? '#1c1c1e' : '#ffffff', border:`1px solid ${dark ? '#2c2c2e' : '#e5e7eb'}`, borderRadius:12, padding:'20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,.06)' },
    cardH:   { margin:'0 0 16px', fontSize:13, fontWeight:700, color: dark ? '#94a3b8' : '#6b7280', letterSpacing:1, textTransform:'uppercase' },
    tbl:     { width:'100%', borderCollapse:'collapse', fontSize:12 },
    th:      { color: dark ? '#6b7280' : '#9ca3af', fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', padding:'8px 10px', borderBottom:`1px solid ${dark ? '#2c2c2e' : '#e5e7eb'}`, textAlign:'left' },
    td:      { padding:'10px 10px', borderBottom:`1px solid ${dark ? '#1c1c1e' : '#f3f4f6'}`, verticalAlign:'middle', color: dark ? '#f1f5f9' : '#111827', fontSize:12 },
    bar:     (pct, col) => ({ height:6, borderRadius:3, background:`linear-gradient(90deg, ${col} ${pct}%, ${dark ? '#2c2c2e' : '#e5e7eb'} ${pct}%)`, minWidth:80 }),
    input:   { width:'100%', background: dark ? '#2c2c2e' : '#f9fafb', border:`1px solid ${dark ? '#3f3f46' : '#d1d5db'}`, borderRadius:6, padding:'9px 12px', color: dark ? '#f8fafc' : '#111827', fontSize:13, outline:'none' },
    label:   { fontSize:11, fontWeight:700, color: dark ? '#94a3b8' : '#6b7280', letterSpacing:.5, display:'block', marginBottom:5 },
    select:  { width:'100%', background: dark ? '#2c2c2e' : '#f9fafb', border:`1px solid ${dark ? '#3f3f46' : '#d1d5db'}`, borderRadius:6, padding:'9px 10px', color: dark ? '#f8fafc' : '#111827', fontSize:13, outline:'none', cursor:'pointer' },
    btnPrim: { background:'#E31E24', color:'#fff', border:'none', borderRadius:8, padding:'11px 28px', fontSize:13, fontWeight:700, cursor:'pointer' },
    btnSec:  { background: dark ? '#2c2c2e' : '#f3f4f6', color: dark ? '#94a3b8' : '#6b7280', border:`1px solid ${dark ? '#3f3f46' : '#d1d5db'}`, borderRadius:8, padding:'11px 20px', fontSize:13, fontWeight:600, cursor:'pointer' },
    filters: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' },
    filterIn:{ background: dark ? '#141414' : '#f3f4f6', border:`1px solid ${dark ? '#2c2c2e' : '#e5e7eb'}`, borderRadius:6, padding:'7px 12px', color: dark ? '#f8fafc' : '#111827', fontSize:12, outline:'none' },
    pagination:{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6, marginTop:12, fontSize:12 },
    pgBtn: (active) => ({ background: active ? '#E31E24' : (dark ? '#2c2c2e' : '#f3f4f6'), color: active ? '#fff' : (dark ? '#94a3b8' : '#6b7280'), border:`1px solid ${dark ? '#3f3f46' : '#d1d5db'}`, borderRadius:5, padding:'4px 10px', cursor:'pointer', fontWeight:600 }),
    dot: (col) => ({ width:10, height:10, borderRadius:'50%', background:col, flexShrink:0 }),
  };


  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>🎯 GESTÃO DE METAS</h2>
          <p style={S.sub}>Crie, acompanhe e gerencie as metas financeiras da sua empresa.</p>
        </div>
        <button style={S.btnNew} onClick={() => { setEditGoal(null); setForm(EMPTY_GOAL_FORM); setActiveTab('criar'); }}>
          <Plus size={15}/> Nova Meta
        </button>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['visao','Visão Geral'],['todas','Todas as Metas'],['criar', editGoal ? 'Editar Meta' : 'Criar Meta']].map(([id,label]) => (
          <button key={id} style={S.tab(activeTab===id)} onClick={() => { if(id!=='criar'){ setEditGoal(null); setForm(EMPTY_GOAL_FORM); } setActiveTab(id); }}>{label}</button>
        ))}
      </div>

      {/* ═══ VISÃO GERAL ═══ */}
      {activeTab === 'visao' && (<>
        {/* Barra de ação */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
          <button onClick={printVisaoGeral} style={{ display:'flex', alignItems:'center', gap:6, background:'#E31E24', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Printer size={14}/> Imprimir
          </button>
        </div>
        {/* KPIs */}
        <div style={S.kpiRow}>
          <div style={S.kpiCard('#6366f1')}>
            <span style={S.kpiLbl}>Metas Ativas</span>
            <span style={S.kpiVal('#6366f1')}>{kpis.ativas}</span>
            <span style={S.kpiSub}>Em andamento</span>
          </div>
          <div style={S.kpiCard('#22c55e')}>
            <span style={S.kpiLbl}>Concluídas</span>
            <span style={S.kpiVal('#22c55e')}>{kpis.concl}</span>
            <span style={S.kpiSub}>Este ano</span>
          </div>
          <div style={S.kpiCard('#3b82f6')}>
            <span style={S.kpiLbl}>Progresso Médio</span>
            <span style={S.kpiVal('#3b82f6')}>{fmtPct(kpis.progMed)}</span>
            <span style={S.kpiSub}>Das metas ativas</span>
          </div>
          <div style={S.kpiCard('#f59e0b')}>
            <span style={S.kpiLbl}>Atingimento Total</span>
            <span style={{ ...S.kpiVal('#f59e0b'), fontSize:14 }}>{fmtBRL(kpis.totalAlc)}</span>
            <span style={S.kpiSub}>Valor acumulado</span>
          </div>
          <div style={S.kpiCard('#f59e0b')}>
            <span style={S.kpiLbl}>A Vencer Hoje</span>
            <span style={S.kpiVal('#f59e0b')}>{kpis.venceHoje}</span>
            <span style={S.kpiSub}>Meta{kpis.venceHoje !== 1 ? 's' : ''} próxima{kpis.venceHoje !== 1 ? 's' : ''} do vencimento</span>
          </div>
          <div style={S.kpiCard('#ef4444')}>
            <span style={S.kpiLbl}>Em Atraso</span>
            <span style={S.kpiVal('#ef4444')}>{kpis.atrasadas}</span>
            <span style={S.kpiSub}>Fora do prazo</span>
          </div>
        </div>

        {/* Charts row */}
        <div style={S.grid2}>
          <div style={S.card}>
            <h4 style={S.cardH}>Progresso das Metas</h4>
            <div style={{ display:'flex', gap:16, marginBottom:10 }}>
              {[['Meta','#94a3b8','dashed'],['Alcançado','#22c55e','solid'],['Previsto','#3b82f6','solid']].map(([l,c,d])=>(
                <span key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#94a3b8' }}>
                  <span style={{ width:18, height:3, background:d==='dashed'?'none':'', borderTop:`2px ${d} ${c}`, display:'inline-block' }}/>
                  {l}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={GOAL_MONTHLY_CHART} margin={{ top:4, right:8, left:8, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="mes" tick={{ fill:'#64748b', fontSize:11 }} stroke="#1e293b"/>
                <YAxis tickFormatter={fmtK} tick={{ fill:'#64748b', fontSize:11 }} stroke="#1e293b" width={48}/>
                <Tooltip formatter={(v,n)=>[fmtBRL(v), n]} contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, fontSize:12 }} labelStyle={{ color:'#f8fafc' }}/>
                <Bar dataKey="alcancado" name="Alcançado" fill="#22c55e" radius={[3,3,0,0]} maxBarSize={24}/>
                <Bar dataKey="previsto"  name="Previsto"  fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={24}/>
                <Line dataKey="meta" name="Meta" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <h4 style={S.cardH}>Distribuição por Categoria</h4>
            <div style={{ position:'relative' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {catDist.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:26, fontWeight:900, color:'#f8fafc', lineHeight:1 }}>{goals.length}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Metas</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
              {catDist.map(c => (
                <div key={c.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={S.dot(c.color)}/><span style={{ color:'#cbd5e1' }}>{c.name}</span>
                  </span>
                  <span style={{ color:'#94a3b8' }}>{fmtBRL(c.value)} ({c.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metas em andamento */}
        <div style={S.card}>
          <h4 style={S.cardH}>Metas em Andamento</h4>
          <table style={S.tbl}>
            <thead>
              <tr>{['Meta','Categoria','Período','Meta (R$)','Alcançado','Progresso','Status','Vencimento','Ações'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {goals.filter(g=>g.status==='Em andamento').slice(0,5).map(g => {
                const pct = g.meta > 0 ? Math.min(100, g.alcancado/g.meta*100) : 0;
                const col = GOAL_CAT_COLORS[g.categoria] || '#6b7280';
                return (
                  <tr key={g.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight:700, color:'#f8fafc', fontSize:12 }}>{g.nome}</div>
                      <div style={{ color:'#475569', fontSize:11 }}>{g.desc}</div>
                    </td>
                    <td style={S.td}><span style={{ color:col, fontWeight:600 }}>{g.categoria}</span></td>
                    <td style={S.td}>{g.periodo}</td>
                    <td style={S.td}>{fmtBRL(g.meta)}</td>
                    <td style={S.td}>{fmtBRL(g.alcancado)}</td>
                    <td style={{ ...S.td, minWidth:100 }}>
                      <div style={{ marginBottom:3, fontSize:11, color:col, fontWeight:700 }}>{fmtPct(pct)}</div>
                      <div style={S.bar(pct, col)}/>
                    </td>
                    <td style={S.td}>{statusBadge(g.status)}</td>
                    <td style={S.td}>
                      <div style={{ color:'#cbd5e1' }}>{g.vencimento}</div>
                      {diasRestantes(g.vencimento)}
                    </td>
                    <td style={S.td}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>openEdit(g)} style={{ background:'#1e293b', border:'none', borderRadius:5, padding:'5px 8px', cursor:'pointer', color:'#94a3b8' }}><Edit2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══ TODAS AS METAS ═══ */}
      {activeTab === 'todas' && (
        <div style={S.card}>
          <div style={S.filters}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#64748b' }}/>
              <input style={{ ...S.filterIn, paddingLeft:30, width:'100%' }} placeholder="Buscar metas..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            </div>
            <select style={S.filterIn} value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(1);}}>
              <option value="Todas">Todas as categorias</option>
              {Object.keys(GOAL_CAT_COLORS).map(c=><option key={c}>{c}</option>)}
            </select>
            <select style={S.filterIn} value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
              <option value="Todos">Todos os status</option>
              {['Em andamento','Concluída','Em atraso'].map(s=><option key={s}>{s}</option>)}
            </select>
            <select style={S.filterIn} value={orderBy} onChange={e=>setOrderBy(e.target.value)}>
              <option value="vencimento">Ordenar por: Vencimento</option>
              <option value="meta">Ordenar por: Meta</option>
              <option value="progresso">Ordenar por: Progresso</option>
            </select>
            <button onClick={printTodasMetas} style={{ display:'flex', alignItems:'center', gap:6, background:'#E31E24', color:'#fff', border:'none', borderRadius:7, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              <Printer size={13}/> Imprimir
            </button>
          </div>
          <table style={S.tbl}>
            <thead>
              <tr>{['Meta','Categoria','Período','Meta (R$)','Alcançado','Progresso','Status','Vencimento','Ações'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {paginated.map(g => {
                const pct = g.meta > 0 ? Math.min(100, g.alcancado/g.meta*100) : 0;
                const col = GOAL_CAT_COLORS[g.categoria] || '#6b7280';
                return (
                  <tr key={g.id}>
                    <td style={S.td}>
                      <div style={{ fontWeight:700, color:'#f8fafc' }}>{g.nome}</div>
                      <div style={{ color:'#475569', fontSize:11 }}>{g.desc}</div>
                    </td>
                    <td style={S.td}><span style={{ color:col, fontWeight:600 }}>{g.categoria}</span></td>
                    <td style={S.td}>{g.periodo}</td>
                    <td style={S.td}>{fmtBRL(g.meta)}</td>
                    <td style={S.td}>{fmtBRL(g.alcancado)}</td>
                    <td style={{ ...S.td, minWidth:100 }}>
                      <div style={{ marginBottom:3, fontSize:11, color:col, fontWeight:700 }}>{fmtPct(pct)}</div>
                      <div style={S.bar(pct, col)}/>
                    </td>
                    <td style={S.td}>{statusBadge(g.status)}</td>
                    <td style={S.td}>
                      <div style={{ color:'#cbd5e1' }}>{g.vencimento}</div>
                      {diasRestantes(g.vencimento)}
                    </td>
                    <td style={S.td}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={()=>openEdit(g)} style={{ background:'#1e293b', border:'none', borderRadius:5, padding:'5px 8px', cursor:'pointer', color:'#94a3b8' }} title="Editar"><Edit2 size={13}/></button>
                        <button onClick={()=>handleDelete(g.id)} style={{ background:'#1e293b', border:'none', borderRadius:5, padding:'5px 8px', cursor:'pointer', color:'#ef4444' }} title="Excluir"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={9} style={{ ...S.td, textAlign:'center', color:'#475569', padding:'30px' }}>Nenhuma meta encontrada.</td></tr>
              )}
            </tbody>
          </table>
          <div style={S.pagination}>
            <span style={{ color:'#64748b' }}>Mostrando {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} de {filtered.length}</span>
            <button style={S.pgBtn(false)} disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} style={S.pgBtn(p===page)} onClick={()=>setPage(p)}>{p}</button>
            ))}
            <button style={S.pgBtn(false)} disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
          </div>
        </div>
      )}

      {/* ═══ CRIAR / EDITAR META ═══ */}
      {activeTab === 'criar' && (
        <div style={{ ...S.card, maxWidth:640 }}>
          <h4 style={{ ...S.cardH, marginBottom:20 }}>{editGoal ? '✏️ Editar Meta' : '➕ Nova Meta'}</h4>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Nome da Meta *</label>
                <input style={S.input} required value={form.nome} onChange={upd('nome')} placeholder="Ex: Faturamento Mensal"/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={S.label}>Descrição</label>
                <input style={S.input} value={form.desc} onChange={upd('desc')} placeholder="Descreva o objetivo desta meta"/>
              </div>
              <div>
                <label style={S.label}>Categoria</label>
                <select style={S.select} value={form.categoria} onChange={upd('categoria')}>
                  {Object.keys(GOAL_CAT_COLORS).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Período</label>
                <select style={S.select} value={form.periodo} onChange={upd('periodo')}>
                  {['Mensal','Trimestral','Semestral','Anual'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Valor da Meta (R$) *</label>
                <input style={S.input} type="number" required min="0" step="0.01" value={form.meta} onChange={upd('meta')} placeholder="0,00"/>
              </div>
              <div>
                <label style={S.label}>Valor Alcançado (R$)</label>
                <input style={S.input} type="number" min="0" step="0.01" value={form.alcancado} onChange={upd('alcancado')} placeholder="0,00"/>
              </div>
              <div>
                <label style={S.label}>Vencimento *</label>
                <input style={S.input} type="date" required value={form.vencimento} onChange={upd('vencimento')}/>
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.select} value={form.status} onChange={upd('status')}>
                  {['Em andamento','Concluída','Em atraso'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* Preview progresso */}
            {form.meta > 0 && (
              <div style={{ background:'#1e293b', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>Progresso atual</span>
                  <span style={{ fontSize:13, fontWeight:700, color: GOAL_CAT_COLORS[form.categoria]||'#22c55e' }}>
                    {fmtPct(Math.min(100, (parseFloat(form.alcancado)||0)/(parseFloat(form.meta)||1)*100))}
                  </span>
                </div>
                <div style={S.bar(Math.min(100,(parseFloat(form.alcancado)||0)/(parseFloat(form.meta)||1)*100), GOAL_CAT_COLORS[form.categoria]||'#22c55e')}/>
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" style={S.btnSec} onClick={()=>{ setEditGoal(null); setForm(EMPTY_GOAL_FORM); setActiveTab('todas'); }}>Cancelar</button>
              <button type="submit" style={S.btnPrim}>{editGoal ? 'Salvar Alterações' : 'Criar Meta'}</button>
            </div>
          </form>
        </div>
      )}
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mensagem de boas-vindas após login
  useEffect(() => {
    if (!isLoggedIn || !loggedUser) return;
    const t = setTimeout(() => {
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
      toast(`${saudacao}, ${loggedUser.usuario || 'usuário'}! 👋 Bem-vindo ao STARVL.`, 'success');
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogoutRequest = useCallback(() => setShowLogoutConfirm(true), []);
  const handleLogoutConfirm = useCallback(() => {
    setShowLogoutConfirm(false);
    setIsLoggedIn(false);
    setLoggedUser(null);
    setCurrentPage('dashboard');
    setSidebarCollapsed(false);
    // Tenta fechar a guia como bônus (bloqueado pelo browser se não foi aberta por script)
    try { window.close(); } catch { /* ignorar */ }
  }, []);
  const handleLogoutCancel = useCallback(() => setShowLogoutConfirm(false), []);

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
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} setSelectedPeriod={setDashboardPeriod} onRefresh={handleRefresh} themeMode={themeMode} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} selectedPeriod={reportsPeriod} setSelectedPeriod={setReportsPeriod} clients={clients} />;
      case 'control':
        return <LivrosManager lmcRegistros={apiData.lmcRegistros} lmcDiario={apiData.lmcDiario} lmcControle={apiData.lmcControle} selectedPeriod={controlPeriod} setSelectedPeriod={setControlPeriod} selectedClient={selectedClient} clients={clients} />;
      case 'stock':
        return <EstoqueManager estoques={apiData.estoques} projecao={apiData.projecao} loading={apiData.loading} selectedClient={selectedClient} clients={clients} themeMode={themeMode} />;
      case 'receber':
        return <Financeiro clients={clients} selectedClient={selectedClient} />;
      case 'goals':
        return <GoalManager themeMode={themeMode} />;
      case 'users':
        return <Users adminUsers={adminUsers} setAdminUsers={setAdminUsers} isAdmin={isAdmin} />;
      case 'params':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      case 'admin':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      default:
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} setSelectedPeriod={setDashboardPeriod} onRefresh={handleRefresh} themeMode={themeMode} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(user) => { setIsLoggedIn(true); setLoggedUser(user); setCurrentPage('dashboard'); setSidebarCollapsed(false); }} adminUsers={adminUsers} />;
  }

  return (
    <div className={`app theme-${themeMode}`}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogoutRequest}
        themeMode={themeMode}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />
      <main className={`main-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <TopBar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isConnected={isConnected}
          apiError={apiData.error}
          clients={clients}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          onLogout={handleLogoutRequest}
          loggedUser={loggedUser}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
        />
        {apiData.error && <ApiErrorNotice message={apiData.error} onRetry={handleRefresh} />}
        {renderPage()}
      </main>

      {/* Confirmação de saída */}
      {showLogoutConfirm && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={handleLogoutCancel}
        >
          <div
            style={{ background: themeMode === 'light' ? '#fff' : '#1a1a1a', border: `1px solid ${themeMode === 'light' ? '#e2e8f0' : '#2a2a2a'}`, borderRadius:16, padding:'32px 36px', minWidth:340, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(227,30,36,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <LogOut size={24} color="#E31E24" />
            </div>
            <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:800, color: themeMode === 'light' ? '#111827' : '#f8fafc', letterSpacing:'.02em' }}>
              Deseja realmente sair?
            </h3>
            <p style={{ margin:'0 0 24px', fontSize:13, color: themeMode === 'light' ? '#6b7280' : '#64748b', lineHeight:1.5 }}>
              Você será desconectado do sistema<br />e a guia será fechada.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button
                onClick={handleLogoutCancel}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:`1px solid ${themeMode === 'light' ? '#e2e8f0' : '#2a2a2a'}`, background:'transparent', color: themeMode === 'light' ? '#374151' : '#94a3b8', fontWeight:700, fontSize:13, cursor:'pointer' }}
              >
                NÃO
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none', background:'#E31E24', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}
              >
                SIM, SAIR
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
