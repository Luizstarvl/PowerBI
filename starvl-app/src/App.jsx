import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import logoStarvl from './logo-starvl.png';
import logoStarvlBlack from './logo-starvl-black.png';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LabelList, ComposedChart, ReferenceLine, PieChart, Pie } from 'recharts';
import { Home, FileText, Users as UsersIcon, BookOpen, Package, LogOut, Eye, Search, Plus, Edit2, Trash2, X, Calendar, TrendingUp, TrendingDown, Droplet, DollarSign, Calculator, Bell, ChevronDown, ChevronUp, Activity, Settings, Building2, Phone, Mail, MapPin, Hash, Clock, BarChart2, Layers, CircleDollarSign, UserCheck, UserPlus, AlertCircle, Globe, Camera, Building, Tag, RefreshCw, Database, ChevronRight, ChevronLeft, Filter, Printer, Moon, Sun, Trophy, Lock, Unlock, Wallet, Download, CreditCard, AlertTriangle, Save, PiggyBank, Target, CheckCircle, Flag, Upload, Maximize2, Minimize2, ShieldCheck, FolderOpen, ImagePlus, Zap, History, ShoppingCart } from 'lucide-react';
import './App.css';
import './cr-styles.css';
import './cp-styles.css';
import './pm-styles.css';
import './ct-styles.css';
import './fc-pdv.css';
import './cc-styles.css';
import './auditoria.css';

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

// monthlyData: mock estático — não usar Math.random() para evitar re-render oscilante
const monthlyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 2000 + ((i * 137 + 42) % 1500), // sequência determinística
}));

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function periodToApi(period) {
  return period.replace('/', ''); // "05/2026" → "052026"
}

// ─── Global formatters ─────────────────────────────────────────────────────
const fmtBRL  = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = s => { if (!s) return '—'; const [y, m, d] = String(s).substring(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fmtCnpj = v => { if (!v) return null; const d = String(v).replace(/\D/g,''); if (d.length===14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'); if (d.length===11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'); return v; };

// ─── Repositório de Imagens — constantes globais ────────────────────────────
const DEFAULT_FOLDERS = [
  { id: 'alimentos',     label: 'Alimentos',     emoji: '🛒', order: 0 },
  { id: 'bebidas',       label: 'Bebidas',        emoji: '🥤', order: 1 },
  { id: 'combustiveis',  label: 'Combustíveis',   emoji: '⛽', order: 2 },
  { id: 'lubrificantes', label: 'Lubrificantes',  emoji: '🔧', order: 3 },
  { id: 'outros',        label: 'Outros',          emoji: '📦', order: 4 },
];
const FOLDER_EMOJIS = ['📦','🛒','🥤','⛽','🔧','🍕','☕','🍫','🧴','🔑','💊','🎮','👕','🛠','🌿','🥩','🍞','🧃','🫙','💡','🏪','🧹','🧊','🍎','🧆','🎁','🪴','🐾','🔩','📷'];
function slugify(str) {
  return str.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    .substring(0, 40);
}
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
const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Preencha o usuário e a senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/starvl-users/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username.trim(), senha: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Usuário ou senha inválidos.');
        return;
      }
      onLogin(data);
    } catch (err) { // eslint-disable-line no-unused-vars
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
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

              <button type="submit" className="btn-submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
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
    { icon: Home,         label: 'HOME',                     page: 'dashboard' },
    { icon: Package,      label: 'ESTOQUE',                  page: 'stock'     },
    { icon: ShoppingCart, label: 'COMPRAS',                  page: 'compras'   },
    { icon: BookOpen,     label: 'LIVROS',                   page: 'control'   },
    { icon: Target,       label: 'INDICADORES PATRIMONIAIS', page: 'goals'     },
    { icon: PiggyBank,    label: 'FINANCEIRO',               page: 'receber'   },
    { icon: FileText,     label: 'RELATÓRIOS',               page: 'reports'   },
    { icon: ShieldCheck,  label: 'AUDITORIA',                page: 'auditoria' },
    { icon: Settings,     label: 'CONFIGURAÇÕES',            page: 'params'    },
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
            title={item.label}
            aria-label={item.label}
            aria-current={currentPage === item.page ? 'page' : undefined}
          >
            <item.icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        className="nav-item logout-btn"
        onClick={onLogout}
        title="SAIR"
        aria-label="Sair do sistema"
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
  reports:   'Relatórios',
  control:   'Livros',
  stock:     'Estoque',
  compras:   'Compras',
  receber:   'Financeiro',
  goals:     'Indicadores Patrimoniais',
  users:     'Gerenciamento de Usuários',
  params:    'Configurações',
};

// Navegação rápida por atalho de página
const QuickNav = ({ setCurrentPage, themeMode }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const NAV_PAGES = [
    { icon: Home,         label: 'Home',                       page: 'dashboard' },
    { icon: Package,      label: 'Estoque',                    page: 'stock'     },
    { icon: ShoppingCart, label: 'Compras',                    page: 'compras'   },
    { icon: BookOpen,     label: 'Livros',                     page: 'control'   },
    { icon: Target,       label: 'Indicadores Patrimoniais',   page: 'goals'     },
    { icon: PiggyBank,    label: 'Financeiro',                 page: 'receber'   },
    { icon: FileText,     label: 'Relatórios',                 page: 'reports'   },
    { icon: Settings,     label: 'Configurações',              page: 'params'    },
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
        {/* Bell: sem funcionalidade ativa — dot removido para não confundir usuário */}
        <button type="button" className="top-bar-icon-btn" title="Notificações (em breve)" aria-label="Notificações">
          <Bell size={18} />
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

// ── 3D Bar helpers ────────────────────────────────────────────────────────────
function lightenHex(hex, amt = 0.38) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const h = n => Math.min(255, Math.round(n + (255-n)*amt)).toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function darkenHex(hex, amt = 0.44) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const h = n => Math.max(0, Math.round(n*(1-amt))).toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
const ThreeDBar = (props) => {
  const { x, y, width, height, fill, value } = props;
  if (!height || height <= 0 || !width || width <= 0) return null;
  const dx = Math.min(14, Math.max(6, width * 0.22));
  const dy = dx * 0.52;
  const front = `M ${x},${y} L ${x+width},${y} L ${x+width},${y+height} L ${x},${y+height} Z`;
  const top   = `M ${x},${y} L ${x+dx},${y-dy} L ${x+width+dx},${y-dy} L ${x+width},${y} Z`;
  const right = `M ${x+width},${y} L ${x+width+dx},${y-dy} L ${x+width+dx},${y+height-dy} L ${x+width},${y+height} Z`;
  const numVal = Number(value);
  const label  = numVal > 0
    ? new Intl.NumberFormat('pt-BR').format(Math.round(numVal)) + ' Litros'
    : '';
  return (
    <g>
      <path d={front} fill={fill} />
      <path d={top}   fill={lightenHex(fill)} />
      <path d={right} fill={darkenHex(fill)} />
      {label && (
        <text
          x={x + width / 2 + dx / 2}
          y={y - dy - 6}
          textAnchor="middle"
          fill="#f8fafc"
          fontWeight={700}
          fontSize={12}
          style={{ pointerEvents: 'none' }}
        >{label}</text>
      )}
    </g>
  );
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
const MR_CSS = `
@keyframes mr-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes mr-count-bar { from{width:0} to{width:var(--tw)} }
@keyframes mr-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
`;

const MetasRealizadoChart = ({ themeMode = 'dark', vendasDiariasCombusFull, selectedPeriod }) => {
  const [metrica, setMetrica]   = useState('litros');
  const [periodo, setPeriodo]   = useState('mensal');
  const [animKey, setAnimKey]   = useState(0);
  const dark = themeMode !== 'light';

  useEffect(() => { setAnimKey(k => k + 1); }, [metrica, periodo]);

  const cfg = useMemo(() => {
    const [mesStr, anoStr] = (selectedPeriod || '').split('/');
    const mes            = parseInt(mesStr) || (new Date().getMonth() + 1);
    const ano            = parseInt(anoStr)  || new Date().getFullYear();
    const totalDiasNoMes = new Date(ano, mes, 0).getDate();
    const mensal         = periodo === 'mensal';
    const semLabels      = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const allData = (vendasDiariasCombusFull || []).slice().sort((a, b) => new Date(a.dia) - new Date(b.dia));
    const src     = mensal ? allData : allData.slice(-7);
    const raw     = src.map(r => metrica === 'litros'
      ? parseFloat(r.litrosCombustivel || 0)
      : parseFloat(r.valorCombustivel  || 0));
    const labels  = mensal
      ? src.map(r => String(new Date(r.dia).getUTCDate()))
      : semLabels.slice(0, src.length);

    const totalDias = mensal ? totalDiasNoMes : 7;
    const avgDiario = raw.length > 0 ? raw.reduce((s, v) => s + v, 0) / raw.length : 0;
    const meta      = avgDiario * totalDias || 1; // projeção de fechamento ao ritmo atual

    let acc = 0;
    const data = raw.map((v, i) => {
      acc += v;
      return {
        label    : labels[i] || String(i + 1),
        realizado: Math.round(acc),
        ritmo    : Math.round(meta * (i + 1) / totalDias),
      };
    });

    const realizado = Math.round(acc);
    const pct       = meta > 0 ? Math.min(100, (realizado / meta) * 100) : 100;
    const faltante  = Math.max(0, meta - realizado);
    const diasRest  = Math.max(0, totalDias - raw.length);
    const cor       = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
    const corBg     = pct >= 90 ? (dark ? '#14532d' : '#dcfce7') : pct >= 70 ? (dark ? '#78350f' : '#fef3c7') : (dark ? '#7f1d1d' : '#fee2e2');
    const corText   = cor;
    const status    = pct >= 90 ? 'No alvo ✓' : pct >= 70 ? 'Atenção' : 'Abaixo da meta';
    return { data, meta, realizado, pct, faltante, diasRest, totalDias, cor, corBg, corText, status };
  }, [metrica, periodo, dark, vendasDiariasCombusFull, selectedPeriod]);

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
          <div style={c.sub}>{selectedPeriod || ''} · Acumulado diário de combustível</div>
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
const PV_UNITS     = ['Combustível', 'Conveniência'];
const PV_DAY_TYPES = ['Todos', 'Dias Úteis', 'Finais de Semana'];

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

const ProjecaoVendas = ({ vendasDiariasCombusFull, selectedPeriod }) => {
  const [unit,    setUnit]    = useState('Combustível');
  const [dayType, setDayType] = useState('Todos');
  const [animKey, setAnimKey] = useState(0);   // forçar re-animação do gráfico
  const [progW,   setProgW]   = useState(0);   // largura animada da barra

  const { chartData, totalRealizado, mediaDiaria, projecaoTotal, diasRestantes, lastRealDia } = useMemo(() => {
    const [mesStr, anoStr] = (selectedPeriod || '').split('/');
    const mes       = parseInt(mesStr) || (new Date().getMonth() + 1);
    const ano       = parseInt(anoStr)  || new Date().getFullYear();
    const totalDias = new Date(ano, mes, 0).getDate();

    const allDays = Array.from({ length: totalDias }, (_, i) => {
      const dia = i + 1;
      const dow = new Date(ano, mes - 1, dia).getDay();
      return { dia, isFDS: dow === 0 || dow === 6 };
    });

    const src = vendasDiariasCombusFull || [];
    const realized = {};
    src.forEach(r => {
      const d   = new Date(r.dia);
      const dia = d.getUTCDate();
      const val = unit === 'Combustível'
        ? parseFloat(r.valorCombustivel  || 0)
        : parseFloat(r.valorConveniencia || 0);
      realized[dia] = (realized[dia] || 0) + val;
    });

    const allFiltered = allDays.filter(d => {
      if (dayType === 'Dias Úteis')       return !d.isFDS;
      if (dayType === 'Finais de Semana') return  d.isFDS;
      return true;
    });

    const diasComDados = Object.keys(realized).map(Number).filter(d => (realized[d] || 0) > 0);
    const lastDia      = diasComDados.length > 0 ? Math.max(...diasComDados) : 0;
    const passedDays   = allFiltered.filter(d => d.dia <= lastDia);
    const futureDays   = allFiltered.filter(d => d.dia >  lastDia);
    const totalReal    = passedDays.reduce((s, d) => s + (realized[d.dia] || 0), 0);
    const media        = passedDays.length > 0 ? totalReal / passedDays.length : 0;
    const projTotal    = totalReal + media * futureDays.length;
    const lastVal      = realized[lastDia] || 0;

    const data = allFiltered.map(d => ({
      dia:          d.dia,
      label:        String(d.dia),
      isProjection: d.dia > lastDia,
      realizado:    d.dia <= lastDia ? (realized[d.dia] ?? null) : null,
      projetado:    d.dia <  lastDia ? null
                  : d.dia === lastDia ? lastVal
                  : media,
    }));

    return { chartData: data, totalRealizado: totalReal, mediaDiaria: media,
             projecaoTotal: projTotal, diasRestantes: futureDays.length, lastRealDia: lastDia };
  }, [unit, dayType, selectedPeriod, vendasDiariasCombusFull]);

  const pct  = projecaoTotal > 0 ? Math.min(100, Math.round((totalRealizado / projecaoTotal) * 100)) : 0;

  const pvPeriodLabel = useMemo(() => {
    if (!selectedPeriod) return '';
    const [mesStr, anoStr] = selectedPeriod.split('/');
    const mes = parseInt(mesStr);
    const nomes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${nomes[mes - 1] || mesStr}/${String(parseInt(anoStr)).slice(2)}`;
  }, [selectedPeriod]);

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
          <span>Faturamento realizado + projeção sazonalizada · {unit.toLowerCase()} · {pvPeriodLabel}</span>
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

// ── Controle de Cartões ───────────────────────────────────────────────────────
const CT_MAQUININHAS = [
  { id:1, nome:'Cielo Lio',       sn:'12345678901234', local:'Caixa 01', adquirente:'Cielo',      bandeira:'Crédito', taxa:2.49, vencDias:30, vencTipo:'Padrão', proxVenc:'2025-06-20', recebPrevisto:156897.00, recebAntecipado:85293.12, status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:2, nome:'Mastercard Pay',  sn:'98765432109876', local:'Caixa 02', adquirente:'Mastercard', bandeira:'Crédito', taxa:2.35, vencDias:28, vencTipo:'Padrão', proxVenc:'2025-06-18', recebPrevisto:201345.00, recebAntecipado:56412.71, status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:3, nome:'Rede Getnet',     sn:'56473829105647', local:'Caixa 03', adquirente:'Rede',       bandeira:'Débito',  taxa:1.95, vencDias:2,  vencTipo:'Padrão', proxVenc:'2025-05-22', recebPrevisto:85029.00,  recebAntecipado:32560.00, status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:4, nome:'PagSeguro Smart', sn:'11223344556677', local:'Caixa 04', adquirente:'PagSeguro',  bandeira:'Crédito', taxa:2.99, vencDias:14, vencTipo:'D+14',   proxVenc:'2025-06-03', recebPrevisto:64800.00,  recebAntecipado:0,        status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:5, nome:'Stone Ton Mini',  sn:'99887766554433', local:'Caixa 05', adquirente:'Stone',      bandeira:'Débito',  taxa:0.99, vencDias:1,  vencTipo:'D+1',    proxVenc:'2025-05-27', recebPrevisto:38200.00,  recebAntecipado:0,        status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:6, nome:'Cielo V3',        sn:'55443322110099', local:'Caixa 06', adquirente:'Cielo',      bandeira:'Crédito', taxa:2.49, vencDias:30, vencTipo:'Padrão', proxVenc:'2025-06-20', recebPrevisto:29400.00,  recebAntecipado:0,        status:'Ativa', imgMaquininha:null, imgBandeira:null },
  { id:7, nome:'GetNet Smart',    sn:'77665544332211', local:'Pátio',    adquirente:'GetNet',     bandeira:'Débito',  taxa:1.49, vencDias:3,  vencTipo:'D+3',    proxVenc:'2025-05-26', recebPrevisto:21000.00,  recebAntecipado:0,        status:'Ativa', imgMaquininha:null, imgBandeira:null },
];
const CT_FORM_EMPTY = { nome:'', sn:'', local:'', adquirente:'', bandeira:'Crédito', taxa:'', vencDias:'', vencTipo:'Padrão', proxVenc:'', recebPrevisto:'', recebAntecipado:'', status:'Ativa', imgMaquininha:'', imgBandeira:'' };

const CT_LANC_BASE = [
  { id:1,  data:'2026-05-28', desc:'Venda Crédito à Vista',      bruto:1250.00, parcela:'1/1', status:'Pendente'   },
  { id:2,  data:'2026-05-28', desc:'Venda Crédito Parcelado 3x', bruto:3600.00, parcela:'1/3', status:'Pendente'   },
  { id:3,  data:'2026-05-27', desc:'Venda Débito à Vista',        bruto:480.00,  parcela:'—',   status:'Liquidado'  },
  { id:4,  data:'2026-05-27', desc:'Venda Crédito à Vista',      bruto:2100.00, parcela:'1/1', status:'Liquidado'  },
  { id:5,  data:'2026-05-26', desc:'Venda Crédito Parcelado 2x', bruto:890.00,  parcela:'2/2', status:'Liquidado'  },
  { id:6,  data:'2026-05-26', desc:'Venda Débito à Vista',        bruto:320.00,  parcela:'—',   status:'Liquidado'  },
  { id:7,  data:'2026-05-25', desc:'Venda Crédito à Vista',      bruto:1750.00, parcela:'1/1', status:'Antecipado' },
  { id:8,  data:'2026-05-25', desc:'Venda Crédito Parcelado 6x', bruto:5400.00, parcela:'1/6', status:'Antecipado' },
  { id:9,  data:'2026-05-24', desc:'Venda Débito à Vista',        bruto:660.00,  parcela:'—',   status:'Liquidado'  },
  { id:10, data:'2026-05-24', desc:'Venda Crédito à Vista',      bruto:980.00,  parcela:'1/1', status:'Liquidado'  },
  { id:11, data:'2026-05-23', desc:'Venda Crédito Parcelado 3x', bruto:2700.00, parcela:'3/3', status:'Liquidado'  },
  { id:12, data:'2026-05-22', desc:'Venda Débito à Vista',        bruto:540.00,  parcela:'—',   status:'Liquidado'  },
  { id:13, data:'2026-05-21', desc:'Venda Crédito à Vista',      bruto:1120.00, parcela:'1/1', status:'Liquidado'  },
  { id:14, data:'2026-05-20', desc:'Chargeback — contestação',   bruto:-450.00, parcela:'—',   status:'Estornado'  },
  { id:15, data:'2026-05-19', desc:'Venda Crédito Parcelado 2x', bruto:760.00,  parcela:'1/2', status:'Liquidado'  },
];

const PosMachineIcon = ({ adquirente }) => {
  const cfgs = {
    Cielo:      { g0:'#eef3f8', g1:'#c2d0dc', screen:'#080c14', bezel:'#161c28', key:'#b0beca', keyD:'#8898a6', enter:'#0033a0', sTxt:'#5b9fd6', isLight:true  },
    Mastercard: { g0:'#1c1c2a', g1:'#0d0d18', screen:'#060610', bezel:'#111120', key:'#252536', keyD:'#161626', enter:'#c00018', sTxt:'#fbbf24', isLight:false },
    Rede:       { g0:'#1e1e26', g1:'#0e0e18', screen:'#060610', bezel:'#121220', key:'#242434', keyD:'#141428', enter:'#c81414', sTxt:'#f87171', isLight:false },
    PagSeguro:  { g0:'#18254a', g1:'#0e1830', screen:'#05080e', bezel:'#101828', key:'#1c2c4a', keyD:'#10203a', enter:'#1a4bd8', sTxt:'#93c5fd', isLight:false },
    Stone:      { g0:'#1a3428', g1:'#0e2018', screen:'#050a08', bezel:'#102018', key:'#1e3228', keyD:'#12241c', enter:'#007a3c', sTxt:'#86efac', isLight:false },
    GetNet:     { g0:'#3a1e0e', g1:'#22120a', screen:'#080402', bezel:'#201008', key:'#3c2010', keyD:'#2a1408', enter:'#c84810', sTxt:'#fbbf24', isLight:false },
  };
  const c = cfgs[adquirente] || cfgs.Mastercard;
  const uid = `p${adquirente.replace(/[^a-z]/gi,'')}`;
  return (
    <svg viewBox="0 0 70 108" width={66} height={102}
      style={{display:'block',flexShrink:0,filter:'drop-shadow(0 3px 8px rgba(0,0,0,0.5))'}}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={c.g0}/>
          <stop offset="100%" stopColor={c.g1}/>
        </linearGradient>
        <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.key}/>
          <stop offset="100%" stopColor={c.keyD}/>
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x={0} y={0} width={70} height={108} rx={9} fill={`url(#${uid}b)`}/>
      {/* Top shine */}
      <rect x={1} y={1} width={68} height={5} rx={8} fill="rgba(255,255,255,0.28)"/>
      {/* Left highlight */}
      <rect x={1} y={1} width={3} height={106} rx={2} fill="rgba(255,255,255,0.1)"/>
      {/* Screen bezel */}
      <rect x={4} y={7} width={62} height={54} rx={5} fill={c.bezel}/>
      {/* Screen */}
      <rect x={5} y={8} width={60} height={52} rx={4} fill={c.screen}/>
      {/* Screen top glare */}
      <rect x={5} y={8} width={34} height={14} rx={4} fill="rgba(255,255,255,0.07)"/>
      {/* Camera dot */}
      <circle cx={35} cy={14} r={2.4} fill={c.isLight ? '#22222a' : '#000'}/>
      <circle cx={35} cy={14} r={1.1} fill={c.isLight ? '#444' : '#1a1a1a'}/>
      {/* NFC waves top-right */}
      <path d="M 55 13 Q 60 9.5 60 14 Q 60 18.5 55 15" fill="none" stroke={`${c.sTxt}55`} strokeWidth={1.1} strokeLinecap="round"/>
      <path d="M 52 11.5 Q 59 6.5 59 14 Q 59 21.5 52 16.5" fill="none" stroke={`${c.sTxt}33`} strokeWidth={1.1} strokeLinecap="round"/>
      {/* Brand content in screen – brand-specific */}
      {adquirente === 'Cielo' ? <>
        <path d="M 11 35 C 16 20 52 18 59 30" fill="none" stroke={c.sTxt} strokeWidth={1.8} strokeLinecap="round"/>
        <text x={35} y={50} textAnchor="middle" fill={c.sTxt} fontSize={12} fontWeight={900} fontStyle="italic"
          fontFamily="'Arial Black',Arial,sans-serif" letterSpacing={-0.3}>cielo</text>
      </> : adquirente === 'Mastercard' ? <>
        <circle cx={27} cy={38} r={10} fill="#EB001B" opacity={0.9}/>
        <circle cx={43} cy={38} r={10} fill="#F79E1B" opacity={0.9}/>
        <path d="M 31 28.2 Q 35 38 31 47.8 Q 27 38 31 28.2 Z" fill="#FF5F00" opacity={0.78}/>
      </> : adquirente === 'Rede' ? (
        <text x={35} y={45} textAnchor="middle" fill={c.sTxt} fontSize={14} fontWeight={900}
          fontFamily="'Arial Black',Arial,sans-serif" letterSpacing={-0.4}>rede.</text>
      ) : adquirente === 'Stone' ? (
        <text x={35} y={45} textAnchor="middle" fill={c.sTxt} fontSize={12} fontWeight={900}
          fontFamily="'Arial Black',Arial,sans-serif">Stone</text>
      ) : adquirente === 'PagSeguro' ? (
        <text x={35} y={45} textAnchor="middle" fill={c.sTxt} fontSize={8} fontWeight={800}
          fontFamily="Arial,sans-serif">PagSeguro</text>
      ) : (
        <text x={35} y={45} textAnchor="middle" fill={c.sTxt} fontSize={9} fontWeight={900}
          fontFamily="Arial,sans-serif">GetNet</text>
      )}
      {/* Screen bottom accent line */}
      <rect x={16} y={56} width={38} height={1.2} rx={0.6} fill={c.sTxt} opacity={0.18}/>
      {/* Side button */}
      <rect x={68} y={20} width={3} height={14} rx={1.5} fill={c.g0} opacity={0.55}/>
      {/* Card slot housing */}
      <rect x={4} y={65} width={62} height={8} rx={3} fill="rgba(0,0,0,0.28)"/>
      {/* Card slot */}
      <rect x={7} y={67} width={56} height={4} rx={2} fill="rgba(0,0,0,0.65)"/>
      <rect x={8} y={68} width={54} height={2} rx={1} fill="rgba(0,0,0,0.38)"/>
      {/* Keys row 1 */}
      <rect x={6}  y={76} width={17} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      <rect x={27} y={76} width={16} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      <rect x={47} y={76} width={17} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      {/* Keys row 2 */}
      <rect x={6}  y={87} width={17} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      <rect x={27} y={87} width={16} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      <rect x={47} y={87} width={17} height={7.5} rx={2} fill={`url(#${uid}k)`}/>
      {/* Enter key */}
      <rect x={6} y={98} width={58} height={8} rx={2.5} fill={c.enter}/>
      <rect x={6} y={98} width={58} height={3} rx={2.5} fill="rgba(255,255,255,0.14)"/>
      <text x={35} y={103.8} textAnchor="middle" fill="#fff" fontSize={5.5} fontWeight={800}
        fontFamily="Arial,sans-serif" letterSpacing={0.6}>ENTER</text>
    </svg>
  );
};

const AdquirenteLogo = ({ adquirente }) => {
  if (adquirente === 'Cielo') return (
    <svg viewBox="0 0 76 38" width={76} height={38}>
      {/* Cielo swoosh – arco característico que passa sobre o texto */}
      <path d="M 5 26 C 12 4 62 2 70 18" fill="none" stroke="#0033a0" strokeWidth={3.4} strokeLinecap="round"/>
      {/* cielo lowercase italic bold */}
      <text x={3} y={36} fill="#0033a0" fontSize={22} fontWeight={900} fontStyle="italic"
        fontFamily="'Arial Black',Arial,sans-serif" letterSpacing={-0.8}>cielo</text>
    </svg>
  );
  if (adquirente === 'Mastercard') return (
    <svg viewBox="0 0 54 32" width={54} height={32}>
      <circle cx={18} cy={16} r={15} fill="#EB001B"/>
      <circle cx={36} cy={16} r={15} fill="#F79E1B"/>
      {/* overlap lens */}
      <path d="M 27 2 Q 22 16 27 30 Q 32 16 27 2 Z" fill="#FF5F00" opacity={0.88}/>
    </svg>
  );
  if (adquirente === 'Rede') return (
    <svg viewBox="0 0 74 28" width={74} height={28}>
      <text x={1} y={23} fill="#cc0018" fontSize={23} fontWeight={900}
        fontFamily="'Arial Black',Arial,sans-serif" letterSpacing={-1.2}>rede</text>
      <circle cx={63} cy={21} r={4} fill="#cc0018"/>
    </svg>
  );
  if (adquirente === 'PagSeguro') return (
    <svg viewBox="0 0 80 28" width={80} height={28}>
      <rect x={0} y={4} width={22} height={20} rx={4} fill="#003087"/>
      <text x={11} y={19} textAnchor="middle" fill="#fff" fontSize={8} fontWeight={900}
        fontFamily="Arial,sans-serif">PAG</text>
      <text x={26} y={20} fill="#003087" fontSize={13} fontWeight={800}
        fontFamily="Arial,sans-serif">Seguro</text>
    </svg>
  );
  if (adquirente === 'Stone') return (
    <svg viewBox="0 0 64 28" width={64} height={28}>
      <rect x={0} y={2} width={24} height={24} rx={6} fill="#00a651"/>
      <text x={12} y={18} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={900}
        fontFamily="Arial,sans-serif">st</text>
      <text x={28} y={20} fill="#00a651" fontSize={15} fontWeight={900}
        fontFamily="'Arial Black',Arial,sans-serif">Stone</text>
    </svg>
  );
  // GetNet
  return (
    <svg viewBox="0 0 72 28" width={72} height={28}>
      <text x={2} y={21} fill="#e55c19" fontSize={18} fontWeight={900}
        fontFamily="'Arial Black',Arial,sans-serif" letterSpacing={-0.5}>GetNet</text>
    </svg>
  );
};

const ControleCartoes = ({ themeMode }) => {
  const isLight = themeMode === 'light';
  const [search,        setSearch]        = useState('');
  const [statusFiltro,  setStatusFiltro]  = useState('todos');
  const [bandFiltro,    setBandFiltro]    = useState('todos');
  const [vencDe,        setVencDe]        = useState('');
  const [vencAte,       setVencAte]       = useState('');
  const [page,          setPage]          = useState(1);
  const [viewModal,     setViewModal]     = useState(null);
  const [formModal,     setFormModal]     = useState(null); // null | 'nova' | {machine obj being edited}
  const [formData,      setFormData]      = useState(CT_FORM_EMPTY);
  const [openMore,         setOpenMore]         = useState(null);
  const [maquininhas,      setMaquininhas]      = useState(CT_MAQUININHAS);
  const [lancamentosModal, setLancamentosModal] = useState(null);
  const [lancTab,          setLancTab]          = useState('Todos');
  // Imagens persistidas na API (memória → localStorage → PostgreSQL)
  const [maqFotoImages, setMaqFotoImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CT_MAQ_LS_KEY) || 'null') || {}; } catch { return {}; }
  });
  const [maqBandImages, setMaqBandImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CT_BAND_LS_KEY) || 'null') || {}; } catch { return {}; }
  });

  const ITEMS_PP = 3;
  const fmtBRL  = v => Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const fmtDate = d => d ? d.split('-').reverse().join('/') : '—';
  const fmtPct  = v => `${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;

  const filtered = useMemo(() => maquininhas.filter(m => {
    if (search) {
      const s = search.toLowerCase();
      if (!m.nome.toLowerCase().includes(s) && !m.adquirente.toLowerCase().includes(s) && !m.bandeira.toLowerCase().includes(s)) return false;
    }
    if (statusFiltro !== 'todos' && m.status.toLowerCase() !== statusFiltro) return false;
    if (bandFiltro   !== 'todos' && m.bandeira.toLowerCase() !== bandFiltro)  return false;
    return true;
  }), [maquininhas, search, statusFiltro, bandFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PP));
  const pageItems  = filtered.slice((page-1)*ITEMS_PP, page*ITEMS_PP);
  const ativas     = maquininhas.filter(m => m.status === 'Ativa').length;
  const taxaMedia  = maquininhas.length ? maquininhas.reduce((s,m) => s + m.taxa, 0) / maquininhas.length : 0;

  // Carrega imagens da API na montagem (stale-while-revalidate)
  useEffect(() => {
    ctMaqImgLoadAll().then(data => setMaqFotoImages(prev => {
      const ks = new Set([...Object.keys(prev), ...Object.keys(data)]);
      return [...ks].some(k => prev[k] !== data[k]) ? data : prev;
    })).catch(()=>{});
    ctBandImgLoadAll().then(data => setMaqBandImages(prev => {
      const ks = new Set([...Object.keys(prev), ...Object.keys(data)]);
      return [...ks].some(k => prev[k] !== data[k]) ? data : prev;
    })).catch(()=>{});
  }, []);

  const handleImgFile = (field, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => setFormData(f => ({ ...f, [field]: e.target.result }));
    r.readAsDataURL(file);
  };
  const handleOpenNova  = () => {
    setFormData(CT_FORM_EMPTY);
    setFormModal('nova');
  };
  const handleOpenEdit  = (m) => {
    setFormData({
      ...m,
      taxa: String(m.taxa), vencDias: String(m.vencDias),
      recebPrevisto: String(m.recebPrevisto), recebAntecipado: String(m.recebAntecipado),
      imgMaquininha: maqFotoImages[String(m.id)] || '',
      imgBandeira:   maqBandImages[String(m.id)] || '',
    });
    setFormModal(m);
    setViewModal(null);
    setOpenMore(null);
  };
  const handleCloseForm = () => setFormModal(null);
  const handleSalvar = () => {
    if (!formData.nome.trim() || !formData.sn.trim()) { toast('Preencha ao menos o nome e número de série.', 'warn'); return; }
    const { imgMaquininha, imgBandeira, ...rest } = formData;
    const parsed = { ...rest, taxa: parseFloat(rest.taxa)||0, vencDias: parseInt(rest.vencDias)||30, recebPrevisto: parseFloat(rest.recebPrevisto)||0, recebAntecipado: parseFloat(rest.recebAntecipado)||0 };

    let machineId;
    if (formModal === 'nova') {
      machineId = Date.now();
      setMaquininhas(prev => [...prev, { ...parsed, id: machineId, imgMaquininha: null, imgBandeira: null }]);
      toast('✅ Maquininha cadastrada!', 'success');
    } else {
      machineId = formModal.id;
      setMaquininhas(prev => prev.map(m => m.id === machineId ? { ...parsed, id: machineId, imgMaquininha: null, imgBandeira: null } : m));
      toast('✅ Maquininha atualizada!', 'success');
    }

    // ── Foto da maquininha ──────────────────────────────────────────
    if (imgMaquininha) {
      ctMaqImgSave(machineId, imgMaquininha)
        .then(c => setMaqFotoImages(prev => ({ ...prev, [String(machineId)]: c })))
        .catch(err => toast(`Erro ao salvar foto: ${err.message}`, 'error'));
    } else if (maqFotoImages[String(machineId)]) {
      ctMaqImgDelete(machineId)
        .then(() => setMaqFotoImages(prev => { const n={...prev}; delete n[String(machineId)]; return n; }))
        .catch(err => toast(`Erro ao remover foto: ${err.message}`, 'error'));
    }

    // ── Logo do adquirente / bandeira ──────────────────────────────
    if (imgBandeira) {
      ctBandImgSave(machineId, imgBandeira)
        .then(c => setMaqBandImages(prev => ({ ...prev, [String(machineId)]: c })))
        .catch(err => toast(`Erro ao salvar logo: ${err.message}`, 'error'));
    } else if (maqBandImages[String(machineId)]) {
      ctBandImgDelete(machineId)
        .then(() => setMaqBandImages(prev => { const n={...prev}; delete n[String(machineId)]; return n; }))
        .catch(err => toast(`Erro ao remover logo: ${err.message}`, 'error'));
    }

    handleCloseForm();
  };

  const handleExcluir = (id) => {
    setMaquininhas(prev => prev.filter(m => m.id !== id));
    setOpenMore(null);
    toast('Maquininha removida.', 'info');
  };

  // Close more menu when clicking outside
  const handlePageClick = () => { if (openMore !== null) setOpenMore(null); };

  const renderPagination = () => {
    const pages = [];
    if (totalPages <= 7) { for(let i=1;i<=totalPages;i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for(let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pages.push(i);
      if (page < totalPages-2) pages.push('...');
      pages.push(totalPages);
    }
    const from = filtered.length === 0 ? 0 : (page-1)*ITEMS_PP+1;
    const to   = Math.min(page*ITEMS_PP, filtered.length);
    return (
      <div className="ct-pagination">
        <span className="ct-pag-info">Mostrando {from} a {to} de {filtered.length} maquininha{filtered.length!==1?'s':''}</span>
        <div className="ct-pag-btns">
          <button className="ct-pag-btn" disabled={page<=1} onClick={()=>setPage(1)}>«</button>
          <button className="ct-pag-btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>‹</button>
          {pages.map((p,i) => p==='...'
            ? <span key={`e${i}`} className="ct-pag-ellipsis">...</span>
            : <button key={p} className={`ct-pag-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
          )}
          <button className="ct-pag-btn" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
          <button className="ct-pag-btn" disabled={page>=totalPages} onClick={()=>setPage(totalPages)}>»</button>
        </div>
      </div>
    );
  };

  return (
    <div className="ct-page" onClick={handlePageClick}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ct-header">
        <div className="ct-header-title">
          <CreditCard size={26} color="#E31E24"/>
          <h2>CONTROLE DE CARTÕES</h2>
          <span className="ct-demo-badge">demonstração</span>
        </div>
        <div className="ct-header-actions">
          <button className="ct-btn-nova" onClick={handleOpenNova}>
            <Plus size={14}/> Nova Maquininha
          </button>
          <button className="ct-btn-export" onClick={()=>{
            const ws = XLSX.utils.json_to_sheet(maquininhas.map(m=>({
              Nome:m.nome,SN:m.sn,Local:m.local,Adquirente:m.adquirente,Bandeira:m.bandeira,
              'Taxa (%)':m.taxa,'Venc. Dias':m.vencDias,'Tipo Venc.':m.vencTipo,
              'Próx. Venc.':fmtDate(m.proxVenc),'Receb. Previsto':m.recebPrevisto,
              'Receb. Antecipado':m.recebAntecipado,Status:m.status,
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb,ws,'Cartões');
            XLSX.writeFile(wb,'controle-cartoes.xlsx');
          }}>
            <Download size={14}/> Exportar Excel
          </button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="ct-kpi-row">
        {[
          { label:'Total de Maquininhas', value: String(ativas), sub:'ativas',          icon: Database,       color:'#f8fafc', bg:'rgba(248,250,252,0.08)' },
          { label:'Volume no Mês',        value: 'R$ 628.271',   sub:'R$ 628.271,00',   icon: TrendingUp,     color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
          { label:'Taxa Média',           value: fmtPct(taxaMedia), sub:'ponderada',    icon: BarChart2,      color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
          { label:'Recebimento Previsto', value: 'R$ 323.404',   sub:'R$ 323.404,84',   icon: CircleDollarSign, color:'#c084fc', bg:'rgba(192,132,252,0.12)' },
          { label:'Receb. Antecipado',    value: 'R$ 174.265',   sub:'R$ 174.265,83',   icon: Clock,          color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
        ].map(k => (
          <div key={k.label} className="ct-kpi">
            <div className="ct-kpi-icon" style={{background:k.bg}}>
              <k.icon size={22} color={k.color}/>
            </div>
            <div className="ct-kpi-body">
              <span className="ct-kpi-label">{k.label}</span>
              <span className="ct-kpi-value" style={{color:k.color}}>{k.value}</span>
              <span className="ct-kpi-sub">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="ct-filters">
        <div className="ct-search-wrap">
          <Search size={14} className="ct-search-icon"/>
          <input className="ct-search" placeholder="Buscar maquininha, adquirente ou bandeira..."
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <select className="ct-select" value={statusFiltro} onChange={e=>{setStatusFiltro(e.target.value);setPage(1);}}>
          <option value="todos">Todos os Status</option>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </select>
        <select className="ct-select" value={bandFiltro} onChange={e=>{setBandFiltro(e.target.value);setPage(1);}}>
          <option value="todos">Todas as Bandeiras</option>
          <option value="crédito">Crédito</option>
          <option value="débito">Débito</option>
        </select>
        <div className="ct-date-range">
          <span className="ct-date-label">Vencimento de</span>
          <input type="date" className="ct-date-input" value={vencDe}  onChange={e=>setVencDe(e.target.value)}/>
          <span className="ct-date-label">até</span>
          <input type="date" className="ct-date-input" value={vencAte} onChange={e=>setVencAte(e.target.value)}/>
          {(vencDe||vencAte) && <button className="ct-clear-btn" onClick={()=>{setVencDe('');setVencAte('');}}><X size={12}/></button>}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="ct-table-wrap">
        <table className="ct-table">
          <thead>
            <tr>
              <th>MAQUININHA</th>
              <th>ADQUIRENTE</th>
              <th>BANDEIRA</th>
              <th>TAXA (%)</th>
              <th>VENCIMENTO</th>
              <th className="ct-th-right">RECEBIMENTO PREVISTO</th>
              <th className="ct-th-right">RECEBIMENTO ANTECIPADO</th>
              <th className="ct-th-center">STATUS</th>
              <th className="ct-th-center">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}>Nenhuma maquininha encontrada.</td></tr>
            )}
            {pageItems.map(m => (
              <tr key={m.id} className="ct-row">
                {/* MAQUININHA */}
                <td>
                  <div className="ct-maq-cell">
                    <div style={{cursor:'pointer'}} onClick={()=>{ setLancamentosModal(m); setLancTab('Todos'); }}>
                      {maqFotoImages[String(m.id)]
                        ? <img src={maqFotoImages[String(m.id)]} className="ct-maq-img-custom" alt={m.nome}/>
                        : <PosMachineIcon adquirente={m.adquirente}/>
                      }
                    </div>
                    <div className="ct-maq-info">
                      <span className="ct-maq-nome">{m.nome}</span>
                      <span className="ct-maq-sn">SN: {m.sn}</span>
                      <span className="ct-maq-local"><MapPin size={11}/>{m.local}</span>
                    </div>
                  </div>
                </td>
                {/* ADQUIRENTE */}
                <td>
                  <div className="ct-adq-cell">
                    <div className="ct-adq-logo">
                      {maqBandImages[String(m.id)]
                        ? <img src={maqBandImages[String(m.id)]} className="ct-adq-img-custom" alt={m.adquirente}/>
                        : <AdquirenteLogo adquirente={m.adquirente}/>
                      }
                    </div>
                    <span className="ct-adq-sub">{m.adquirente}</span>
                  </div>
                </td>
                {/* BANDEIRA */}
                <td>
                  <span className={`ct-band-pill ct-band-${m.bandeira === 'Crédito' ? 'credito' : 'debito'}`}>
                    <span className="ct-band-dot"/>
                    {m.bandeira}
                  </span>
                </td>
                {/* TAXA */}
                <td>
                  <div className="ct-taxa-cell">
                    <span className="ct-taxa-val">{fmtPct(m.taxa)}</span>
                    <span className="ct-taxa-label">Taxa</span>
                  </div>
                </td>
                {/* VENCIMENTO */}
                <td>
                  <div className="ct-venc-cell">
                    <span className="ct-venc-dias">{m.vencDias} {m.vencDias===1?'dia':'dias'}</span>
                    <span className="ct-venc-tipo">{m.vencTipo}</span>
                    <span className="ct-venc-prox">Próx. venc.: {fmtDate(m.proxVenc)}</span>
                  </div>
                </td>
                {/* RECEBIMENTO PREVISTO */}
                <td style={{textAlign:'right'}}>
                  <div className="ct-rec-cell">
                    <span className="ct-rec-val">{fmtBRL(m.recebPrevisto)}</span>
                    <span className="ct-rec-prox">Próx. venc.: {fmtDate(m.proxVenc)}</span>
                  </div>
                </td>
                {/* RECEBIMENTO ANTECIPADO */}
                <td style={{textAlign:'right'}}>
                  <div className="ct-rec-cell">
                    {m.recebAntecipado > 0
                      ? <><span className="ct-rec-val">{fmtBRL(m.recebAntecipado)}</span><span className="ct-rec-disponivel">Disponível</span></>
                      : <span className="ct-rec-zero">—</span>
                    }
                  </div>
                </td>
                {/* STATUS */}
                <td style={{textAlign:'center'}}>
                  {m.status === 'Ativa'
                    ? <span className="ct-status-ativa"><span className="ct-status-dot" style={{background:'#22c55e'}}/> Ativa</span>
                    : <span className="ct-status-inativa"><span className="ct-status-dot" style={{background:'#ef4444'}}/> Inativa</span>
                  }
                </td>
                {/* AÇÕES */}
                <td>
                  <div className="ct-actions" onClick={e=>e.stopPropagation()}>
                    <button className="ct-action-btn" title="Lançamentos" onClick={()=>{ setLancamentosModal(m); setLancTab('Todos'); }}><Eye size={14}/></button>
                    <button className="ct-action-btn ct-action-edit" title="Editar" onClick={()=>handleOpenEdit(m)}><Edit2 size={14}/></button>
                    <div className="ct-action-more" style={{position:'relative'}}>
                      <button className="ct-action-btn ct-action-more-btn" title="Mais ações"
                        onClick={()=>setOpenMore(openMore===m.id?null:m.id)}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                          <circle cx={5} cy={12} r={2}/><circle cx={12} cy={12} r={2}/><circle cx={19} cy={12} r={2}/>
                        </svg>
                      </button>
                      {openMore===m.id && (
                        <div className="ct-more-menu">
                          <div className="ct-more-item" onClick={()=>{
                            setMaquininhas(prev=>prev.map(x=>x.id===m.id?{...x,status:x.status==='Ativa'?'Inativa':'Ativa'}:x));
                            setOpenMore(null);
                            toast(`Maquininha ${m.status==='Ativa'?'inativada':'ativada'}.`,'info');
                          }}>
                            {m.status==='Ativa'?<Lock size={13}/>:<Unlock size={13}/>} {m.status==='Ativa'?'Inativar':'Ativar'}
                          </div>
                          <div className="ct-more-item" onClick={()=>{ setViewModal(m); setOpenMore(null); }}>
                            <Eye size={13}/> Detalhes
                          </div>
                          <div className="ct-more-item danger" onClick={()=>handleExcluir(m.id)}>
                            <Trash2 size={13}/> Excluir
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {renderPagination()}

      {/* ── Lançamentos Modal ───────────────────────────────────────────── */}
      {lancamentosModal && (() => {
        const taxa = lancamentosModal.taxa;
        const lancs = CT_LANC_BASE.map(l => ({
          ...l,
          taxa_val: l.bruto > 0 ? parseFloat((l.bruto * taxa / 100).toFixed(2)) : 0,
          liquido:  l.bruto > 0 ? parseFloat((l.bruto * (1 - taxa / 100)).toFixed(2)) : l.bruto,
        }));
        const filtradas    = lancTab === 'Todos' ? lancs : lancs.filter(l => l.status === lancTab);
        const totalBruto   = lancs.filter(l => l.bruto > 0).reduce((s, l) => s + l.bruto, 0);
        const totalTaxa    = lancs.filter(l => l.bruto > 0).reduce((s, l) => s + l.taxa_val, 0);
        const totalLiquido = lancs.filter(l => l.bruto > 0).reduce((s, l) => s + l.liquido, 0);
        const statusColor  = { Pendente:'#fbbf24', Liquidado:'#22c55e', Antecipado:'#60a5fa', Estornado:'#ef4444' };
        const closeLanc    = () => { setLancamentosModal(null); setLancTab('Todos'); };
        const bd  = isLight ? '#f1f5f9' : '#1e2430';   // border
        const bg1 = isLight ? '#f8fafc' : '#0e1318';   // kpi / thead bg
        const bg2 = isLight ? '#f1f5f9' : '#131820';   // tab / row hover bg
        const tx1 = isLight ? '#111827' : '#e2e8f0';   // primary text
        const tx2 = isLight ? '#6b7280' : '#94a3b8';   // secondary text
        const tx3 = isLight ? '#6b7280' : '#475569';   // th text
        return (
          <div className="ct-modal-overlay" onClick={closeLanc}>
            <div className="ct-modal" style={{maxWidth:880,width:'95vw'}} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="ct-modal-header">
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:46,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {maqFotoImages[String(lancamentosModal.id)]
                      ? <img src={maqFotoImages[String(lancamentosModal.id)]} style={{width:46,height:70,objectFit:'contain',borderRadius:5}} alt={lancamentosModal.nome}/>
                      : <div style={{transform:'scale(0.66)',transformOrigin:'top left',width:46,height:70,overflow:'hidden'}}><PosMachineIcon adquirente={lancamentosModal.adquirente}/></div>
                    }
                  </div>
                  <div>
                    <h3 style={{margin:0,fontSize:16,display:'flex',alignItems:'center',gap:6}}>
                      <CreditCard size={16} color="#E31E24"/>{lancamentosModal.nome}
                    </h3>
                    <span style={{fontSize:11,color:tx2}}>
                      SN: {lancamentosModal.sn} &nbsp;|&nbsp; {lancamentosModal.local} &nbsp;|&nbsp; {lancamentosModal.adquirente} &nbsp;|&nbsp; Taxa: {fmtPct(lancamentosModal.taxa)}
                    </span>
                  </div>
                </div>
                <button className="ct-modal-close" onClick={closeLanc}><X size={18}/></button>
              </div>
              {/* KPIs */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:'12px 20px',borderBottom:`1px solid ${bd}`}}>
                {[
                  {label:'Total Bruto',   value:fmtBRL(totalBruto),   color:tx1},
                  {label:'Total Taxa',    value:fmtBRL(totalTaxa),    color:'#ef4444'},
                  {label:'Total Líquido', value:fmtBRL(totalLiquido), color:'#22c55e'},
                  {label:'Transações',    value:String(lancs.filter(l=>l.bruto>0).length), color:'#60a5fa'},
                ].map(k => (
                  <div key={k.label} style={{textAlign:'center',padding:'8px',background:bg1,borderRadius:8,border:`1px solid ${bd}`}}>
                    <div style={{fontSize:10,color:tx2,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:15,fontWeight:700,color:k.color}}>{k.value}</div>
                  </div>
                ))}
              </div>
              {/* Filter tabs */}
              <div style={{display:'flex',gap:6,padding:'10px 20px',borderBottom:`1px solid ${bd}`,flexWrap:'wrap'}}>
                {['Todos','Pendente','Liquidado','Antecipado','Estornado'].map(t => (
                  <button key={t} type="button"
                    style={{fontSize:11,padding:'4px 12px',borderRadius:6,cursor:'pointer',transition:'all 0.15s',
                      border:`1px solid ${lancTab===t?'rgba(227,30,36,0.8)':bd}`,
                      background:lancTab===t?'rgba(227,30,36,0.12)':bg2,
                      color:lancTab===t?'#e31e24':tx2,fontWeight:lancTab===t?700:400}}
                    onClick={() => setLancTab(t)}>{t}
                  </button>
                ))}
              </div>
              {/* Table */}
              <div className="ct-modal-body" style={{padding:0,maxHeight:'52vh',overflowY:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:bg1,position:'sticky',top:0,zIndex:1}}>
                      {['Data','Descrição','Bruto','Taxa','Líquido','Parcela','Status'].map(h => (
                        <th key={h} style={{padding:'9px 12px',textAlign:['Bruto','Taxa','Líquido'].includes(h)?'right':'left',
                          color:tx3,fontSize:10,fontWeight:700,borderBottom:`1px solid ${bd}`,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.length === 0 && (
                      <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:tx2,fontSize:13}}>Nenhum lançamento encontrado.</td></tr>
                    )}
                    {filtradas.map(l => (
                      <tr key={l.id} style={{borderBottom:`1px solid ${bd}`,transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background=bg2}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td style={{padding:'8px 12px',color:tx2,whiteSpace:'nowrap'}}>{l.data.split('-').reverse().join('/')}</td>
                        <td style={{padding:'8px 12px',color:tx1}}>{l.desc}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',color:l.bruto<0?'#ef4444':tx1,whiteSpace:'nowrap'}}>{fmtBRL(l.bruto)}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',color:'#ef4444',whiteSpace:'nowrap'}}>{l.bruto>0?fmtBRL(l.taxa_val):'—'}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',color:'#22c55e',whiteSpace:'nowrap'}}>{l.bruto>0?fmtBRL(l.liquido):'—'}</td>
                        <td style={{padding:'8px 12px',color:tx2,textAlign:'center'}}>{l.parcela}</td>
                        <td style={{padding:'8px 12px'}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',borderRadius:12,
                            background:`${statusColor[l.status]}18`,border:`1px solid ${statusColor[l.status]}44`,
                            color:statusColor[l.status],fontSize:10,fontWeight:600,whiteSpace:'nowrap'}}>
                            <span style={{width:5,height:5,borderRadius:'50%',background:statusColor[l.status],flexShrink:0}}/>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ct-modal-footer">
                <button className="ct-modal-cancel" onClick={closeLanc}>Fechar</button>
                <button className="ct-modal-save" onClick={() => handleOpenEdit(lancamentosModal)}>
                  <Edit2 size={13}/> Editar Maquininha
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── View Modal ──────────────────────────────────────────────────── */}
      {viewModal && (
        <div className="ct-modal-overlay" onClick={()=>setViewModal(null)}>
          <div className="ct-modal" onClick={e=>e.stopPropagation()}>
            <div className="ct-modal-header">
              <h3><CreditCard size={18} color="#E31E24"/> {viewModal.nome}</h3>
              <button className="ct-modal-close" onClick={()=>setViewModal(null)}><X size={18}/></button>
            </div>
            <div className="ct-modal-body">
              <div style={{display:'flex',justifyContent:'center',margin:'8px 0 4px'}}>
                {maqFotoImages[String(viewModal.id)]
                  ? <img src={maqFotoImages[String(viewModal.id)]} style={{width:66,height:102,objectFit:'contain',borderRadius:6,filter:'drop-shadow(0 3px 8px rgba(0,0,0,0.5))'}} alt={viewModal.nome}/>
                  : <PosMachineIcon adquirente={viewModal.adquirente}/>
                }
              </div>
              <div className="ct-modal-section">Identificação</div>
              {[
                ['Nome',             viewModal.nome],
                ['Número de Série',  viewModal.sn],
                ['Local / Caixa',    viewModal.local],
                ['Adquirente',       viewModal.adquirente],
                ['Bandeira',         viewModal.bandeira],
                ['Status',           viewModal.status],
              ].map(([k,v])=>(
                <div key={k} className="ct-modal-row">
                  <span className="ct-modal-key">{k}</span>
                  <span className="ct-modal-val">{v}</span>
                </div>
              ))}
              <div className="ct-modal-section">Taxas e Prazos</div>
              {[
                ['Taxa',                  fmtPct(viewModal.taxa)],
                ['Prazo de Vencimento',   `${viewModal.vencDias} ${viewModal.vencDias===1?'dia':'dias'} — ${viewModal.vencTipo}`],
                ['Próximo Vencimento',    fmtDate(viewModal.proxVenc)],
              ].map(([k,v])=>(
                <div key={k} className="ct-modal-row">
                  <span className="ct-modal-key">{k}</span>
                  <span className="ct-modal-val">{v}</span>
                </div>
              ))}
              <div className="ct-modal-section">Recebimentos</div>
              {[
                ['Recebimento Previsto',    fmtBRL(viewModal.recebPrevisto)],
                ['Recebimento Antecipado',  viewModal.recebAntecipado>0 ? fmtBRL(viewModal.recebAntecipado) : '—'],
              ].map(([k,v])=>(
                <div key={k} className="ct-modal-row">
                  <span className="ct-modal-key">{k}</span>
                  <span className="ct-modal-val" style={{color:'#22c55e'}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="ct-modal-footer">
              <button className="ct-modal-cancel" onClick={()=>setViewModal(null)}>Fechar</button>
              <button className="ct-modal-save" onClick={()=>handleOpenEdit(viewModal)}>
                <Edit2 size={13}/> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Form Modal — Nova / Editar Maquininha ───────────────────────── */}
      {formModal && (
        <div className="ct-modal-overlay" onClick={handleCloseForm}>
          <div className="ct-modal ct-modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="ct-modal-header">
              <h3>
                {formModal === 'nova'
                  ? <><Plus size={18} color="#E31E24"/> Nova Maquininha</>
                  : <><Edit2 size={18} color="#f59e0b"/> Editar Maquininha</>
                }
              </h3>
              <button className="ct-modal-close" onClick={handleCloseForm}><X size={18}/></button>
            </div>
            <div className="ct-form-body">
              {/* ── Uploads de Imagem ─────────────────────────────── */}
              <div className="ct-form-imgs-row">
                <div className="ct-form-img-block">
                  <span className="ct-form-label">Foto da Maquininha</span>
                  <label className="ct-img-upload">
                    {formData.imgMaquininha
                      ? <img src={formData.imgMaquininha} className="ct-img-preview" alt="maquininha"/>
                      : <div className="ct-img-placeholder"><Upload size={22}/><span>Importar imagem</span></div>
                    }
                    <input type="file" accept="image/*" className="ct-img-input"
                      onChange={e=>handleImgFile('imgMaquininha', e.target.files[0])}/>
                  </label>
                  {formData.imgMaquininha && (
                    <button className="ct-img-clear" onClick={()=>setFormData(f=>({...f,imgMaquininha:''}))}>
                      <X size={11}/> Remover
                    </button>
                  )}
                </div>
                <div className="ct-form-img-block">
                  <span className="ct-form-label">Logo Adquirente / Bandeira</span>
                  <label className="ct-img-upload">
                    {formData.imgBandeira
                      ? <img src={formData.imgBandeira} className="ct-img-preview" alt="bandeira"/>
                      : <div className="ct-img-placeholder"><Upload size={22}/><span>Importar imagem</span></div>
                    }
                    <input type="file" accept="image/*" className="ct-img-input"
                      onChange={e=>handleImgFile('imgBandeira', e.target.files[0])}/>
                  </label>
                  {formData.imgBandeira && (
                    <button className="ct-img-clear" onClick={()=>setFormData(f=>({...f,imgBandeira:''}))}>
                      <X size={11}/> Remover
                    </button>
                  )}
                </div>
              </div>
              {/* ── Campos de texto ───────────────────────────────── */}
              <div className="ct-form-grid">
                <div className="ct-form-field">
                  <label className="ct-form-label">Nome da Maquininha *</label>
                  <input className="ct-form-input" placeholder="Ex: Cielo Lio"
                    value={formData.nome} onChange={e=>setFormData(f=>({...f,nome:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Número de Série *</label>
                  <input className="ct-form-input" placeholder="SN: 00000000000000"
                    value={formData.sn} onChange={e=>setFormData(f=>({...f,sn:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Local / Caixa</label>
                  <input className="ct-form-input" placeholder="Ex: Caixa 01"
                    value={formData.local} onChange={e=>setFormData(f=>({...f,local:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Fornecedor / Adquirente</label>
                  <input className="ct-form-input" placeholder="Ex: Cielo S.A., Banco do Brasil…"
                    value={formData.adquirente} onChange={e=>setFormData(f=>({...f,adquirente:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Modalidade</label>
                  <select className="ct-form-select" value={formData.bandeira}
                    onChange={e=>setFormData(f=>({...f,bandeira:e.target.value}))}>
                    <option>Crédito</option>
                    <option>Débito</option>
                  </select>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Taxa (%)</label>
                  <input className="ct-form-input" type="number" step="0.01" placeholder="2.49"
                    value={formData.taxa} onChange={e=>setFormData(f=>({...f,taxa:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Prazo (dias)</label>
                  <input className="ct-form-input" type="number" placeholder="30"
                    value={formData.vencDias} onChange={e=>setFormData(f=>({...f,vencDias:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Tipo de Vencimento</label>
                  <select className="ct-form-select" value={formData.vencTipo}
                    onChange={e=>setFormData(f=>({...f,vencTipo:e.target.value}))}>
                    {['Padrão','D+1','D+3','D+14','D+30'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Próximo Vencimento</label>
                  <input className="ct-form-input" type="date"
                    value={formData.proxVenc} onChange={e=>setFormData(f=>({...f,proxVenc:e.target.value}))}/>
                </div>
                <div className="ct-form-field">
                  <label className="ct-form-label">Status</label>
                  <select className="ct-form-select" value={formData.status}
                    onChange={e=>setFormData(f=>({...f,status:e.target.value}))}>
                    <option>Ativa</option>
                    <option>Inativa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ct-modal-footer">
              <button className="ct-modal-cancel" onClick={handleCloseForm}>Cancelar</button>
              <button className="ct-modal-save" onClick={handleSalvar}>
                <Save size={13}/> {formModal === 'nova' ? 'Salvar Maquininha' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ── fim Controle de Cartões ───────────────────────────────────────────────────

// ── Financeiro (wrapper com abas Receber / Pagar) ────────────────────────────
const todayInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const fmtTime = value => {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const fmtDateTime = value => {
  if (!value) return 'Em aberto';
  return `${fmtDate(String(value).slice(0, 10))} ${fmtTime(value)}`;
};

// ── PDV Conference — Detail Modal ─────────────────────────────────────────────
const CpdvDetalheModal = ({ item, caixa, data, empresa, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item?.tipo) return;
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ empresa: String(empresa), data, caixa: String(caixa), tipo: item.tipo });
    fetch(`${API_URL}/api/fluxo-caixa/detalhe?${qs.toString()}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setRows(json.itens || []);
      })
      .catch(err => setError(err.message || 'Erro ao carregar detalhes.'))
      .finally(() => setLoading(false));
  }, [item, caixa, data, empresa]);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const total = rows.reduce((s, r) => s + (r.valor || 0), 0);

  const colsFor = tipo => {
    if (tipo === 'vendaCombustiveis' || tipo === 'vendaProdutos') return [
      { k: 'momento', l: 'Hora', f: fmtTime },
      { k: 'cliente', l: 'Cliente' },
      { k: 'produto', l: 'Produto' },
      { k: 'quantidade', l: 'Qtd', f: v => fmtNum(v, 3) },
      { k: 'unitario', l: 'Unit.', f: fmtBRL },
      { k: 'valor', l: 'Total', f: fmtBRL },
    ];
    if (tipo === 'recebimentos') return [
      { k: 'momento', l: 'Hora', f: fmtTime },
      { k: 'cliente', l: 'Cliente' },
      { k: 'documento', l: 'Documento' },
      { k: 'valor', l: 'Valor', f: fmtBRL },
    ];
    if (tipo === 'papeisApresentados') return [
      { k: 'operadora', l: 'Operadora' },
      { k: 'bandeira', l: 'Bandeira' },
      { k: 'valor', l: 'Valor', f: fmtBRL },
    ];
    return [
      { k: 'momento', l: 'Hora', f: fmtTime },
      { k: 'historico', l: 'Historico' },
      { k: 'valor', l: 'Valor', f: fmtBRL },
    ];
  };

  const cols = colsFor(item.tipo);

  return (
    <div className="cpdv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cpdv-modal">
        <div className="cpdv-modal-header">
          <div>
            <h3>{item.label}</h3>
            <small>Caixa {caixa} &bull; {fmtDate(data)}</small>
          </div>
          <button className="cpdv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="cpdv-modal-body">
          {loading && <div className="cpdv-empty">Carregando...</div>}
          {!loading && error && <div className="cpdv-empty" style={{ color: '#ef4444' }}>{error}</div>}
          {!loading && !error && rows.length === 0 && <div className="cpdv-empty">Nenhum registro encontrado.</div>}
          {!loading && !error && rows.length > 0 && (
            <table className="cpdv-modal-table">
              <thead><tr>{cols.map(c => <th key={c.k}>{c.l}</th>)}</tr></thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>{cols.map(c => <td key={c.k}>{c.f ? c.f(row[c.k]) : (row[c.k] ?? '—')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="cpdv-modal-footer">
          <span>{rows.length} registro{rows.length !== 1 ? 's' : ''}</span>
          <strong>{fmtBRL(total)}</strong>
        </div>
      </div>
    </div>
  );
};

// ── Fluxo de Caixa — Row icons map ───────────────────────────────────────────
const CPDV_ROW_ICONS = {
  trocoInicial:       Wallet,
  vendaCombustiveis:  Droplet,
  vendaProdutos:      Package,
  recebimentos:       TrendingUp,
  suprimentos:        PiggyBank,
  adiantamentos:      CreditCard,
  creditosVendaProg:  Tag,
  chequesTroco:       FileText,
  acrescimosCadastro: Plus,
  acrescimosGerais:   BarChart2,
  baixaDeChecques:    Download,
  outrasEntradas:     Activity,
  trocoFinal:         Wallet,
  dinheiroApresentado:DollarSign,
  papeisApresentados: FileText,
  pagamentos:         CircleDollarSign,
  sangrias:           TrendingDown,
  emprestimos:        Database,
  retiradasVendaProg: Tag,
  resgateDepontos:    Trophy,
  descontosCadastro:  Calculator,
  descontosGerais:    Calculator,
  estornoCheques:     RefreshCw,
  outrasSaidas:       Activity,
};

// ── Fluxo de Caixa — Print HTML builder ──────────────────────────────────────
function buildCpdvPrintHtml({ payload, data, empresa }) {
  if (!payload) return null;
  const { entradas = [], saidas = [], resumo = {}, caixas = [] } = payload;
  const generatedAt = new Date().toLocaleString('pt-BR');
  const dataFmt = fmtDate(data);
  const caixaInfo = caixas.length > 0 ? caixas.map(c => `Caixa ${c.numero} (${c.operador})`).join(' | ') : 'Todos os caixas';
  const divergencia = resumo.divergencia || 0;
  const mkRows = items => items.map(r =>
    `<tr><td>${r.label}</td><td class="num${r.valor > 0 ? ' bold' : ''}">${fmtNum(r.valor, 2)}</td></tr>`
  ).join('');
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>Conferência de Caixa — ${dataFmt}</title>
<style>
  @page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;font-size:11px}
  .report{width:100%}
  .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:2px solid #e31e24;padding-bottom:8px}
  h1{margin:0 0 3px;font-size:17px;font-weight:800}
  .sub{color:#555;font-size:10px}
  img.logo{width:110px;height:auto;object-fit:contain}
  .meta{display:flex;justify-content:space-between;margin-bottom:10px;color:#666;font-size:9px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
  .col-hd{font-size:11px;font-weight:800;letter-spacing:.05em;padding:5px 8px;border-radius:4px 4px 0 0;margin-bottom:0}
  .col-hd.e{background:#15803d;color:#fff}.col-hd.s{background:#b91c1c;color:#fff}
  table{width:100%;border-collapse:collapse;font-size:10px}
  tr{page-break-inside:avoid}
  td{padding:4px 6px;border-bottom:1px solid #eee}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700;color:#111}
  .total-row td{font-weight:800;font-size:11px;background:#f3f4f6;border-top:2px solid #ddd;border-bottom:2px solid #ddd}
  .footer{border-top:2px solid #e31e24;padding-top:8px;text-align:center;margin-top:8px}
  .dv-warn{font-size:13px;font-weight:800;color:#b45309}
  .dv-ok{font-size:13px;font-weight:800;color:#15803d}
  .rf{margin-top:6px;color:#777;font-size:9px;text-align:right}
  @media screen{body{background:#f3f4f6;padding:20px}.report{max-width:820px;margin:0 auto;background:#fff;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.12)}}
</style></head><body><main class="report">
<header class="hd">
  <div><h1>CONFERÊNCIA DE CAIXA (PDV)</h1><div class="sub">${caixaInfo}</div></div>
  <img class="logo" src="/logo-starvl.png" alt="STARVL"/>
</header>
<div class="meta"><span>Data: ${dataFmt} | Empresa: ${empresa}</span><span>Gerado em ${generatedAt}</span></div>
<div class="grid">
  <div><div class="col-hd e">▲ ENTRADAS</div><table>${mkRows(entradas)}
    <tr class="total-row"><td>TOTAL ENTRADAS</td><td class="num">${fmtNum(resumo.entradas||0,2)}</td></tr>
  </table></div>
  <div><div class="col-hd s">▼ SAÍDAS</div><table>${mkRows(saidas)}
    <tr class="total-row"><td>TOTAL SAÍDAS</td><td class="num">${fmtNum(resumo.saidas||0,2)}</td></tr>
  </table></div>
</div>
<div class="footer">
  ${divergencia > 0
    ? `<span class="dv-warn">⚠ DIVERGÊNCIA: R$ ${fmtNum(divergencia,2)}</span>`
    : `<span class="dv-ok">✓ Caixa Conferido</span>`}
</div>
<div class="rf">STARVL | Conferência de Caixa (PDV) | ${dataFmt}</div>
</main>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script>
</body></html>`;
}

// ── Fluxo de Caixa — Impressão Modal ─────────────────────────────────────────
const CpdvImpressaoModal = ({ caixas, data, setData, empresa, payload, onClose }) => {
  const [selCaixas, setSelCaixas] = useState((caixas || []).map(c => c.numero));

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const allSelected = selCaixas.length === (caixas || []).length;
  const toggleAll = () => setSelCaixas(allSelected ? [] : (caixas || []).map(c => c.numero));
  const toggleCaixa = num => setSelCaixas(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);

  const handleGenerate = () => {
    const html = buildCpdvPrintHtml({ payload, data, empresa });
    if (!html) return;
    const win = window.open('', '_blank');
    if (!win) { alert('Permita pop-ups no navegador para gerar o relatório.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    onClose();
  };

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Printer size={25} /></span>
            <h3>IMPRIMIR CONFERÊNCIA DE CAIXA</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose}><X size={28} /></button>
        </div>

        <div className="control-print-body">
          <section className="control-print-section">
            <div className="control-print-section-title"><Calendar size={20} /><span>DATA DE REFERÊNCIA</span></div>
            <div className="control-print-date-row">
              <label className="control-print-field" style={{ flex: 1 }}>
                <span>DATA</span>
                <div className="control-print-input">
                  <input type="date" value={data} onChange={e => setData(e.target.value)} />
                  <Calendar size={19} />
                </div>
              </label>
            </div>
          </section>

          <section className="control-print-section">
            <div className="control-print-section-title">
              <Calculator size={20} /><span>CAIXAS</span>
              {(caixas||[]).length > 0 && <em>{selCaixas.length}/{(caixas||[]).length}</em>}
            </div>
            <label className={`ranking-seller-check ranking-seller-all ${allSelected ? 'selected' : ''}`}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>Todos os caixas</span>
            </label>
            <div className="ranking-seller-list" style={{ maxHeight: 150 }}>
              {(caixas || []).map(c => (
                <label key={c.numero} className={`ranking-seller-check ${selCaixas.includes(c.numero) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={selCaixas.includes(c.numero)} onChange={() => toggleCaixa(c.numero)} />
                  <span>Caixa {c.numero} — {c.operador}</span>
                  <small>{c.numero}</small>
                </label>
              ))}
              {(caixas||[]).length === 0 && <div className="ranking-seller-state">Nenhum caixa para esta data.</div>}
            </div>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}><X size={20} /> CANCELAR</button>
          <button type="button" className="btn-primary control-print-generate" onClick={handleGenerate} disabled={!payload || selCaixas.length === 0}>
            <Printer size={20} /> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Papeis Apresentados — Tabbed Modal ────────────────────────────────────────
const PapeisModal = ({ caixa, data, empresa, onClose }) => {
  const TABS = [
    { id: 'prazo',              label: 'Prazo' },
    { id: 'chequeVista',        label: 'Cheque Vista' },
    { id: 'chequePre',          label: 'Cheque Pre' },
    { id: 'cartaoDebito',       label: 'Cartão Débito' },
    { id: 'cartaoCredito',      label: 'Cartão Crédito' },
    { id: 'tefDebito',          label: 'TEF Débito' },
    { id: 'tefCredito',         label: 'TEF Crédito' },
    { id: 'vales',              label: 'Vales' },
    { id: 'cartaFrete',         label: 'Carta Frete' },
    { id: 'vendaPrg',           label: 'Venda PRG' },
    { id: 'depositoAntecipado', label: 'Depósito Antecipado' },
  ];

  const [activeTab, setActiveTab] = useState('prazo');
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOp, setSelectedOp] = useState(null);
  const [selectedBand, setSelectedBand] = useState(null);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    if (tabData[activeTab]) return;
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ empresa: String(empresa), data, caixa: String(caixa), tab: activeTab });
    fetch(`${API_URL}/api/fluxo-caixa/papeis?${qs.toString()}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setTabData(prev => ({ ...prev, [activeTab]: json }));
      })
      .catch(err => setError(err.message || 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [activeTab, caixa, data, empresa, tabData]);

  const currentData = tabData[activeTab];

  const filteredLanc = useMemo(() => {
    if (!currentData?.lancamentos) return [];
    let items = currentData.lancamentos;
    if (selectedOp) items = items.filter(l => l.operadora === selectedOp);
    else if (selectedBand) items = items.filter(l => l.bandeira === selectedBand);
    return items;
  }, [currentData, selectedOp, selectedBand]);

  const handleTabChange = id => {
    setActiveTab(id);
    setSelectedOp(null);
    setSelectedBand(null);
    setError('');
  };

  const total = useMemo(() => {
    if (!currentData) return 0;
    if (currentData.tipo === 'card')
      return (currentData.operadoras || []).reduce((s, o) => s + o.valor, 0);
    return (currentData.rows || []).reduce((s, r) => s + (r.valor || 0), 0);
  }, [currentData]);

  const renderCard = () => {
    const { operadoras = [], bandeiras = [] } = currentData || {};
    return (
      <div className="papeis-card-layout">
        <div className="papeis-card-panel">
          <div className="papeis-panel-header">Operadoras</div>
          <table className="papeis-panel-table">
            <thead><tr><th>Cod.</th><th>Operadoras</th><th>Valor Total</th></tr></thead>
            <tbody>
              {operadoras.map((op, i) => (
                <tr key={i}
                  className={selectedOp === op.nome ? 'selected' : ''}
                  onClick={() => { setSelectedOp(prev => prev === op.nome ? null : op.nome); setSelectedBand(null); }}>
                  <td>{i + 1}</td><td>{op.nome}</td><td>{fmtBRL(op.valor)}</td>
                </tr>
              ))}
              {operadoras.length === 0 && <tr><td colSpan={3} className="papeis-empty">Sem registros</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="papeis-card-panel">
          <div className="papeis-panel-header">Bandeiras</div>
          <table className="papeis-panel-table">
            <thead><tr><th>Descricao</th><th>Valor Total</th></tr></thead>
            <tbody>
              {bandeiras.map((b, i) => (
                <tr key={i}
                  className={selectedBand === b.descricao ? 'selected' : ''}
                  onClick={() => { setSelectedBand(prev => prev === b.descricao ? null : b.descricao); setSelectedOp(null); }}>
                  <td>{b.descricao}</td><td>{fmtBRL(b.valor)}</td>
                </tr>
              ))}
              {bandeiras.length === 0 && <tr><td colSpan={2} className="papeis-empty">Sem registros</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="papeis-card-panel">
          <div className="papeis-panel-header">Lançamentos</div>
          <table className="papeis-panel-table">
            <thead><tr><th>Valor</th></tr></thead>
            <tbody>
              {filteredLanc.map((l, i) => (
                <tr key={i} className="selected"><td>{fmtBRL(l.valor)}</td></tr>
              ))}
              {filteredLanc.length === 0 && <tr><td className="papeis-empty">Sem registros</td></tr>}
            </tbody>
          </table>
          {filteredLanc.length > 0 && (
            <div className="papeis-panel-footer">
              Total: {fmtBRL(filteredLanc.reduce((s, l) => s + l.valor, 0))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLista = () => {
    const { rows = [], subTipo } = currentData || {};
    if (subTipo === 'cheque') {
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="cpdv-modal-table">
            <thead><tr>
              <th>Codigo</th><th>Responsavel</th><th>Vencimento</th>
              <th>Valor</th><th>Placa</th><th>Frentista</th><th>Venda</th><th>Conf.</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.codigo}</td><td>{r.responsavel}</td>
                  <td>{fmtDate(r.vencimento)}</td><td>{fmtBRL(r.valor)}</td>
                  <td>{r.placa || '—'}</td><td>{r.frentista}</td>
                  <td>{r.vdaCodigo || '—'}</td>
                  <td>{r.conferido ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#475569' }}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="cpdv-modal-table">
          <thead><tr>
            <th>Codigo</th><th>Documento</th><th>Venda</th>
            <th>Data</th><th>Cliente</th><th>Valor</th><th>Frentista</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.codigo}</td><td>{r.documento}</td><td>{r.venda || '—'}</td>
                <td>{fmtDateTime(r.data)}</td><td>{r.cliente}</td>
                <td>{fmtBRL(r.valor)}</td><td>{r.frentista}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#475569' }}>Nenhum registro encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="cpdv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cpdv-modal papeis-modal">
        <div className="cpdv-modal-header">
          <div>
            <h3>Papeis Apresentados</h3>
            <small>Caixa {caixa} &bull; {fmtDate(data)}</small>
          </div>
          <button className="cpdv-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="papeis-tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`papeis-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => handleTabChange(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="cpdv-modal-body papeis-body">
          {loading && <div className="cpdv-empty">Carregando...</div>}
          {!loading && error && <div className="cpdv-empty" style={{ color: '#ef4444' }}>{error}</div>}
          {!loading && !error && currentData && (
            currentData.tipo === 'card' ? renderCard() : renderLista()
          )}
        </div>
        <div className="cpdv-modal-footer">
          <span>{TABS.find(t => t.id === activeTab)?.label}</span>
          <strong>{fmtBRL(total)}</strong>
        </div>
      </div>
    </div>
  );
};

// ── Fluxo de Caixa — PDV Conference Layout ────────────────────────────────────
const FluxoCaixa = ({ clients, selectedClient, themeMode }) => {
  const empresa = selectedClient?.codigoEmpresa || selectedClient?.id || 7432;
  const [data, setData] = useState(todayInput());
  const [selectedCaixa, setSelectedCaixa] = useState(null);
  const [payload, setPayload] = useState(null);
  const [caixaPayload, setCaixaPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detalheItem, setDetalheItem] = useState(null);
  const [papeisOpen, setPapeisOpen] = useState(false);
  const [impressaoOpen, setImpressaoOpen] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError('');
    const qs = new URLSearchParams({ empresa: String(empresa), data });
    fetch(`${API_URL}/api/fluxo-caixa?${qs.toString()}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setPayload(json);
        if (json.caixas?.length > 0) setSelectedCaixa(prev => prev || json.caixas[0].numero);
      })
      .catch(err => { setError(err.message || 'Nao foi possivel carregar o fluxo de caixa.'); setPayload(null); })
      .finally(() => setLoading(false));
  }, [empresa, data]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!selectedCaixa) return;
    const qs = new URLSearchParams({ empresa: String(empresa), data, caixa: String(selectedCaixa) });
    fetch(`${API_URL}/api/fluxo-caixa?${qs.toString()}`)
      .then(r => r.json())
      .then(json => { if (!json.error) setCaixaPayload(json); })
      .catch(() => {});
  }, [empresa, data, selectedCaixa]);

  const caixas = payload?.caixas || [];
  const active = selectedCaixa && caixaPayload ? caixaPayload : payload;
  const entradas = active?.entradas || [];
  const saidas = active?.saidas || [];
  const timeline = active?.timeline || [];
  const tanques = active?.tanques || [];
  const resumo = active?.resumo || {};
  const currentCaixa = caixas.find(c => c.numero === selectedCaixa) || caixas[0];

  const NON_CLICKABLE = new Set([
    'trocoInicial', 'trocoFinal', 'dinheiroApresentado',
    'creditosVendaProg', 'retiradasVendaProg',
    'acrescimosCadastro', 'acrescimosGerais',
    'descontosCadastro', 'descontosGerais', 'chequesTroco', 'adiantamentos',
  ]);

  const openDetalhe = (id, label) => {
    if (!selectedCaixa) return;
    if (id === 'papeisApresentados') { setPapeisOpen(true); return; }
    setDetalheItem({ tipo: id, label });
  };

  const Row = ({ item }) => {
    const clickable = !NON_CLICKABLE.has(item.id) && item.valor > 0 && !!selectedCaixa;
    const Icon = CPDV_ROW_ICONS[item.id];
    return (
      <div
        className={`cpdv-row${clickable ? ' clickable' : ''}`}
        onClick={clickable ? () => openDetalhe(item.id, item.label) : undefined}
        title={clickable ? `Ver detalhes: ${item.label}` : undefined}
      >
        <span className="cpdv-row-label">
          {Icon && <Icon size={11} className="cpdv-row-icon" />}
          {item.label}
        </span>
        <span className={`cpdv-row-value${item.valor > 0 ? ' nonzero' : ''}`}>{fmtNum(item.valor, 2)}</span>
      </div>
    );
  };

  return (
    <div className="cpdv-page">
      <div className="cpdv-header">
        <div className="cpdv-header-title">
          <Wallet size={20} style={{ color: '#ef4444' }} />
          CONFERÊNCIA DE CAIXA (PDV)
        </div>
        <button
          className="btn-primary control-print-generate cpdv-print-btn"
          onClick={() => setImpressaoOpen(true)}
          title="Imprimir Conferência de Caixa"
        >
          <Printer size={16} /> IMPRIMIR RELATÓRIO
        </button>
      </div>

      <div className="cpdv-caixas-bar">
        <span className="cpdv-caixas-label">Caixas do Dia</span>
        {caixas.map(cxa => (
          <button
            key={cxa.numero}
            className={`cpdv-caixa-tab${selectedCaixa === cxa.numero ? ' active' : ''}`}
            onClick={() => { setSelectedCaixa(cxa.numero); setCaixaPayload(null); }}
          >
            Caixa {cxa.numero}
          </button>
        ))}
        <div className="cpdv-date-wrapper" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <input
            type="date"
            className="cpdv-date-input"
            value={data}
            onChange={e => { setData(e.target.value); setSelectedCaixa(null); setCaixaPayload(null); setPayload(null); }}
            style={{ colorScheme: themeMode === 'light' ? 'light' : 'dark' }}
          />
        </div>
        {currentCaixa && (
          <div className="cpdv-caixas-info">
            <div className="cpdv-info-item">
              <div>
                <div className="cpdv-info-label">Operador</div>
                <div className="cpdv-info-value">{currentCaixa.operador}</div>
              </div>
            </div>
            {[
              { label: 'Data Abertura', value: currentCaixa.abertura },
              { label: 'Data Fechamento', value: currentCaixa.fechamento },
              { label: 'Data Conferencia', value: currentCaixa.conferidoEm },
            ].map(({ label, value }) => (
              <div key={label} className="cpdv-info-item">
                <Calendar size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <div className="cpdv-info-label">{label}</div>
                  <div className="cpdv-info-value">{fmtDateTime(value)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="api-error-notice"><AlertCircle size={18} /> {error}</div>}

      {/* Resumo rápido */}
      {payload && (resumo.entradas > 0 || resumo.saidas > 0) && (
        <div className="cpdv-quick-summary">
          <div className="cpdv-qs-item">
            <span className="cpdv-qs-label"><TrendingUp size={11} /> Entradas</span>
            <span className="cpdv-qs-value green">{fmtBRL(resumo.entradas || 0)}</span>
          </div>
          <div className="cpdv-qs-sep" />
          <div className="cpdv-qs-item">
            <span className="cpdv-qs-label"><TrendingDown size={11} /> Saídas</span>
            <span className="cpdv-qs-value red">{fmtBRL(resumo.saidas || 0)}</span>
          </div>
          <div className="cpdv-qs-sep" />
          <div className="cpdv-qs-item">
            <span className="cpdv-qs-label">Saldo Líquido</span>
            <span className={`cpdv-qs-value ${((resumo.entradas || 0) - (resumo.saidas || 0)) >= 0 ? 'green' : 'red'}`}>
              {fmtBRL((resumo.entradas || 0) - (resumo.saidas || 0))}
            </span>
          </div>
          {(resumo.divergencia || 0) > 0 && (
            <>
              <div className="cpdv-qs-sep" />
              <div className="cpdv-qs-item">
                <span className="cpdv-qs-label"><AlertTriangle size={11} /> Divergência</span>
                <span className="cpdv-qs-value" style={{ color: '#f59e0b' }}>{fmtBRL(resumo.divergencia)}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="cpdv-main">
        <div className="cpdv-left">
          {loading && !payload && <div className="cpdv-empty">Carregando...</div>}
          {(!loading || payload) && (
            <div className="cpdv-columns">
              <div className="cpdv-col">
                <div className="cpdv-col-header entradas"><TrendingUp size={12} /> ENTRADAS</div>
                {entradas.map(item => <Row key={item.id} item={item} />)}
                <div className="cpdv-total-row entradas">
                  <span><TrendingUp size={11} style={{ marginRight: 4 }} />TOTAL ENTRADAS</span>
                  <strong>{fmtBRL(resumo.entradas || 0)}</strong>
                </div>
              </div>
              <div className="cpdv-col">
                <div className="cpdv-col-header saidas"><TrendingDown size={12} /> SAÍDAS</div>
                {saidas.map(item => <Row key={item.id} item={item} />)}
                <div className="cpdv-total-row saidas">
                  <span><TrendingDown size={11} style={{ marginRight: 4 }} />TOTAL SAÍDAS</span>
                  <strong>{fmtBRL(resumo.saidas || 0)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cpdv-right">
          <div className="cpdv-timeline-panel">
            <div className="cpdv-panel-header">
              <h4><Activity size={11} /> LINHA DO TEMPO</h4>
              <span className="cpdv-count">{timeline.length} eventos</span>
            </div>
            <div className="cpdv-timeline-list">
              {timeline.map((ev, i) => (
                <div key={i} className="cpdv-timeline-event">
                  <time>{fmtTime(ev.momento)}</time>
                  <div className={`cpdv-timeline-dot ${ev.tipo}`}>
                    {ev.tipo === 'abertura' ? <UserCheck size={9} /> : ev.tipo === 'fechamento' ? <Clock size={9} /> : <Activity size={9} />}
                  </div>
                  <div className="cpdv-timeline-info">
                    <strong>
                      {ev.titulo}
                      <span style={{ fontWeight: 400, color: '#64748b', fontSize: 10 }}>{ev.detalhe ? ` ${ev.detalhe}` : ''}</span>
                    </strong>
                  </div>
                  {ev.valor > 0 && (
                    <span className={`cpdv-timeline-value ${ev.tipo === 'entrada' ? 'green' : 'red'}`}>
                      {ev.tipo !== 'entrada' ? '-' : ''}{fmtBRL(ev.valor)}
                    </span>
                  )}
                </div>
              ))}
              {!loading && timeline.length === 0 && <div className="cpdv-empty">Nenhum evento.</div>}
            </div>
            {timeline.length > 0 && (
              <div className="cpdv-timeline-ver-mais">Ver todos os eventos</div>
            )}
          </div>

          <div className="cpdv-tanks-panel">
            <div className="cpdv-panel-header">
              <h4><Droplet size={11} /> MEDIÇÃO DE TANQUES</h4>
              <span className="cpdv-count">{tanques.length} tanques</span>
            </div>
            <div className="cpdv-tanks-grid">
              {tanques.map(t => (
                <div key={t.codigo} className="cpdv-tank-card">
                  <Droplet size={14} style={{ color: '#ef4444' }} />
                  <span className="cpdv-tank-name">{t.produto}</span>
                  <span className="cpdv-tank-value">{fmtNum(t.volume)} L</span>
                  <div className="cpdv-tank-bar">
                    <div className="cpdv-tank-fill" style={{ width: `${Math.max(2, Math.min(100, t.percentual || 0))}%` }} />
                  </div>
                </div>
              ))}
              {!loading && tanques.length === 0 && <div className="cpdv-empty" style={{ gridColumn: '1/-1' }}>Sem medicao cadastrada.</div>}
            </div>
            {tanques.length > 0 && (
              <div className="cpdv-timeline-ver-mais">Ver todos os tanques</div>
            )}
          </div>
        </div>
      </div>

      <div className={`cpdv-footer${(resumo.divergencia || 0) > 0 ? ' divergencia' : ''}`}>
        {(resumo.divergencia || 0) > 0 ? (
          <>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            <span className="cpdv-footer-label">DIVERGÊNCIA</span>
            <span className="cpdv-footer-value">{fmtBRL(resumo.divergencia)}</span>
            <span className="cpdv-footer-sub">Conferir caixa</span>
          </>
        ) : (
          <>
            <UserCheck size={20} style={{ color: '#22c55e' }} />
            <span className="cpdv-footer-value" style={{ color: '#22c55e', fontSize: 15 }}>Caixa Conferido</span>
          </>
        )}
        {resumo.entradas > 0 || resumo.saidas > 0 ? (
          <div className="cpdv-footer-saldo">
            <div className="cpdv-footer-saldo-row">
              <span className="cpdv-footer-saldo-label"><TrendingUp size={11} /> Entradas</span>
              <span className="cpdv-footer-saldo-val green">{fmtBRL(resumo.entradas || 0)}</span>
            </div>
            <div className="cpdv-footer-saldo-row">
              <span className="cpdv-footer-saldo-label"><TrendingDown size={11} /> Saídas</span>
              <span className="cpdv-footer-saldo-val red">{fmtBRL(resumo.saidas || 0)}</span>
            </div>
            <div className="cpdv-footer-saldo-bar">
              <div
                className="cpdv-footer-saldo-fill"
                style={{ width: `${Math.min(100, resumo.entradas > 0 ? ((resumo.entradas - resumo.saidas) / resumo.entradas) * 100 : 0)}%` }}
              />
            </div>
            <div className="cpdv-footer-saldo-row" style={{ marginTop: 4 }}>
              <span className="cpdv-footer-saldo-label">Saldo Líquido</span>
              <span className={`cpdv-footer-saldo-val ${(resumo.entradas - resumo.saidas) >= 0 ? 'green' : 'red'}`}>
                {fmtBRL((resumo.entradas || 0) - (resumo.saidas || 0))}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {detalheItem && selectedCaixa && (
        <CpdvDetalheModal
          item={detalheItem}
          caixa={selectedCaixa}
          data={data}
          empresa={empresa}
          onClose={() => setDetalheItem(null)}
        />
      )}
      {papeisOpen && selectedCaixa && (
        <PapeisModal
          caixa={selectedCaixa}
          data={data}
          empresa={empresa}
          onClose={() => setPapeisOpen(false)}
        />
      )}
      {impressaoOpen && (
        <CpdvImpressaoModal
          caixas={caixas}
          data={data}
          setData={setData}
          empresa={empresa}
          payload={active}
          onClose={() => setImpressaoOpen(false)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTA CORRENTE
// ─────────────────────────────────────────────────────────────────────────────

const CC_TABS = [
  { id: 'visao', label: 'VISÃO GERAL' },
  { id: 'lancamentos', label: 'LANÇAMENTOS' },
  { id: 'previstos', label: 'LANÇAMENTOS PREVISTOS' },
  { id: 'conciliacao', label: 'CONCILIAÇÃO' },
  { id: 'transferencias', label: 'TRANSFERÊNCIAS' },
  { id: 'extratos', label: 'EXTRATOS' },
];

function bancoBadge(banco) {
  if (banco === 'Banco do Brasil') return 'bb';
  if (banco === 'Santander') return 'santander';
  if (banco === 'Itaú') return 'itau';
  if (banco === 'Bradesco') return 'bradesco';
  if (banco === 'Caixa Econômica') return 'caixa';
  if (banco === 'Sicoob') return 'sicoob';
  return 'other';
}

function bancoAbrev(banco) {
  if (banco === 'Banco do Brasil') return 'BB';
  if (banco === 'Santander') return 'SA';
  if (banco === 'Itaú') return 'IT';
  if (banco === 'Bradesco') return 'BD';
  if (banco === 'Caixa Econômica') return 'CE';
  if (banco === 'Sicoob') return 'SC';
  return '?';
}

// ── Visão Geral ──────────────────────────────────────────────────────────────
const CcFluxoTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload || {};
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}{p.previsto ? ' (previsto)' : ''}</div>
      {payload.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: item.color, marginBottom: 2 }}>
          <span>{item.name}</span><strong>{fmtBRL(item.value)}</strong>
        </div>
      ))}
    </div>
  );
};

const CcVisaoGeral = ({ empresa }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [chartExpanded, setChartExpanded] = useState(false);

  const loadDados = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/visao-geral?empresa=${empresa}`)
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresa]);

  useEffect(() => { loadDados(); }, [loadDados]);

  if (loading) return <div className="cc-loading"><Activity size={16} /> Carregando dados...</div>;
  if (!dados || dados.error) return <div className="cc-loading">Erro ao carregar dados.</div>;

  const { kpis, contas, fluxo, recentes, previstos, alerta, resumo } = dados;

  const chartData = (fluxo || []).map(d => {
    const s = String(d.data).slice(0, 10);
    const [, m, day] = s.split('-');
    return { dia: `${day}/${m}`, entradas: d.entradas, saidas: d.saidas, saldo: d.saldoProjetado, previsto: d.previsto, _date: s };
  });

  const handleChartClick = (payload) => {
    if (!payload || !payload.activePayload) return;
    const item = payload.activePayload[0]?.payload;
    if (!item) return;
    setSelectedDay(prev => prev === item._date ? null : item._date);
  };

  const selData = selectedDay ? (fluxo || []).find(d => String(d.data).slice(0, 10) === selectedDay) : null;
  const selRecentes = selectedDay ? (recentes || []).filter(r => String(r.data).slice(0, 10) === selectedDay) : [];
  const selPrevistos = selectedDay ? (previstos || []).filter(p => String(p.vencimento).slice(0, 10) === selectedDay) : [];
  const selItems = [...selRecentes, ...selPrevistos];

  const interval = Math.max(1, Math.floor(chartData.length / 10));

  return (
    <div>
      {/* Cabeçalho visão geral */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} style={{ color: '#ef4444' }} />
          Dados bancários consolidados em tempo real
        </div>
        <button
          className="cc-btn"
          onClick={loadDados}
          title="Atualizar dados"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {alerta && (
        <div className="cc-alerta">
          <AlertTriangle size={14} />
          Atenção: saldo projetado fica negativo em {fmtDate(alerta.data)} ({fmtBRL(alerta.valor)})
        </div>
      )}

      {/* KPIs */}
      <div className="cc-kpi-grid">
        <div className="cc-kpi-card positive">
          <div className="cc-kpi-label"><DollarSign size={11} /> Saldo Consolidado</div>
          <div className={`cc-kpi-value ${kpis.saldoConsolidado >= 0 ? 'green' : 'red'}`}>{fmtBRL(kpis.saldoConsolidado)}</div>
          <div className="cc-kpi-sub">{contas.length} conta(s)</div>
        </div>
        <div className="cc-kpi-card blue">
          <div className="cc-kpi-label"><TrendingUp size={11} /> Saldo Projetado (30d)</div>
          <div className={`cc-kpi-value ${kpis.saldoProjetado >= 0 ? 'green' : 'red'}`}>{fmtBRL(kpis.saldoProjetado)}</div>
          <div className="cc-kpi-sub">entradas - saídas previstas</div>
        </div>
        <div className="cc-kpi-card yellow">
          <div className="cc-kpi-label"><TrendingUp size={11} /> Entradas Previstas</div>
          <div className="cc-kpi-value blue">{fmtBRL(kpis.entradasPrevistas)}</div>
          <div className="cc-kpi-sub">próximos 30 dias</div>
        </div>
        <div className="cc-kpi-card red">
          <div className="cc-kpi-label"><TrendingDown size={11} /> Saídas Previstas</div>
          <div className="cc-kpi-value red">{fmtBRL(kpis.saidasPrevistas)}</div>
          <div className="cc-kpi-sub">próximos 30 dias</div>
        </div>
        <div className="cc-kpi-card cyan">
          <div className="cc-kpi-label"><Wallet size={11} /> Disponível Bancário</div>
          <div className="cc-kpi-value green">{fmtBRL(kpis.disponivelBancario)}</div>
          <div className="cc-kpi-sub">contas com saldo positivo</div>
        </div>
        <div className="cc-kpi-card purple">
          <div className="cc-kpi-label"><FileText size={11} /> Cheques Pendentes</div>
          <div className="cc-kpi-value">{fmtBRL(kpis.chequesPendentes.total)}</div>
          <div className="cc-kpi-sub">{kpis.chequesPendentes.qtd} cheque(s)</div>
        </div>
      </div>

      {/* Row 2: Contas + Fluxo */}
      <div className="cc-two-col">
        <div className="cc-panel">
          <div className="cc-panel-header">
            <div className="cc-panel-title"><Building size={13} /> CONTAS BANCÁRIAS</div>
          </div>
          <div className="cc-panel-body">
            <div className="cc-conta-list">
              {contas.map(c => (
                <div key={c.codigo} className="cc-conta-item">
                  <div className={`cc-conta-icon ${bancoBadge(c.banco)}`}>{bancoAbrev(c.banco)}</div>
                  <div className="cc-conta-info">
                    <div className="cc-conta-name">{c.descricao}</div>
                    <div className="cc-conta-bank">{c.banco}</div>
                  </div>
                  <div className={`cc-conta-saldo ${c.saldo < 0 ? 'negative' : ''}`}>{fmtBRL(c.saldo)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cc-panel cc-chart-panel-expandable" onClick={() => setChartExpanded(true)}>
          <div className="cc-panel-header">
            <div className="cc-panel-title"><BarChart2 size={13} /> FLUXO PROJETADO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#475569' }}>Clique para ampliar</span>
              <button className="cc-chart-expand-btn" onClick={e => { e.stopPropagation(); setChartExpanded(true); }} title="Ampliar gráfico">
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
          <div className="cc-panel-body" style={{ padding: '10px 4px 10px 0' }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  interval={interval}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#475569' }}
                  tickFormatter={v => fmtNum(v / 1000) + 'k'}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip content={<CcFluxoTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="entradas" name="Entradas" radius={[2, 2, 0, 0]} maxBarSize={14}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill="#22c55e"
                      opacity={entry.previsto ? 0.35 : (selectedDay && selectedDay !== entry._date ? 0.4 : 0.85)}
                      stroke={selectedDay === entry._date ? '#4ade80' : 'none'}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
                <Bar dataKey="saidas" name="Saídas" radius={[2, 2, 0, 0]} maxBarSize={14}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill="#ef4444"
                      opacity={entry.previsto ? 0.35 : (selectedDay && selectedDay !== entry._date ? 0.4 : 0.85)}
                      stroke={selectedDay === entry._date ? '#f87171' : 'none'}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#60a5fa"
                  dot={false}
                  strokeWidth={1.5}
                  strokeDasharray="0"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 14, fontSize: 10, color: '#64748b', justifyContent: 'center', paddingBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} /> Entradas</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: 2, display: 'inline-block' }} /> Saídas</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 2, background: '#60a5fa', display: 'inline-block' }} /> Saldo</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#475569', borderRadius: 2, display: 'inline-block', opacity: 0.4 }} /> Projetado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day detail panel — appears when a bar is clicked */}
      {selectedDay && (
        <div className="cc-panel" style={{ marginBottom: 14 }}>
          <div className="cc-panel-header">
            <div className="cc-panel-title"><Calendar size={13} /> DETALHAMENTO — {fmtDate(selectedDay)}{selData?.previsto ? ' (projetado)' : ''}</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
              {selData && <>
                <span style={{ color: '#4ade80' }}>Entradas: {fmtBRL(selData.entradas)}</span>
                <span style={{ color: '#f87171' }}>Saídas: {fmtBRL(selData.saidas)}</span>
                <span style={{ color: selData.saldoProjetado >= 0 ? '#60a5fa' : '#f87171' }}>Saldo: {fmtBRL(selData.saldoProjetado)}</span>
              </>}
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div className="cc-panel-body no-pad">
            {selItems.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                {selData?.previsto
                  ? 'Sem lançamentos previstos para este dia — os valores são do saldo corrido.'
                  : 'Sem lançamentos detalhados para este dia no período carregado.'}
              </div>
            ) : (
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Histórico</th>
                    <th>Documento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Conta</th>
                  </tr>
                </thead>
                <tbody>
                  {selItems.map((r, i) => {
                    const isRece = r.vencimento !== undefined;
                    return (
                      <tr key={i}>
                        <td><span className={`cc-badge ${r.tipo}`}>{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                        <td>{r.historico}</td>
                        <td>{r.documento || '—'}</td>
                        <td className={r.tipo === 'entrada' ? 'amount-pos' : 'amount-neg'} style={{ textAlign: 'right' }}>{fmtBRL(r.valor)}</td>
                        <td>{isRece ? <span className="cc-badge previsto">Previsto</span> : (r.contaNome || '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Row 3: Lançamentos Recentes + Resumo */}
      <div className="cc-three-col">
        <div className="cc-panel" style={{ gridColumn: 'span 2' }}>
          <div className="cc-panel-header">
            <div className="cc-panel-title"><Clock size={13} /> LANÇAMENTOS RECENTES</div>
          </div>
          <div className="cc-panel-body no-pad" style={{ maxHeight: 280, overflow: 'auto' }}>
            <div className="cc-timeline" style={{ padding: '10px 16px' }}>
              {(recentes || []).slice(0, 12).map((r, i) => (
                <div key={i} className="cc-timeline-item">
                  <div className="cc-tl-dot-col">
                    <div className={`cc-tl-dot ${r.tipo}`} />
                    <div className="cc-tl-line" />
                  </div>
                  <div className="cc-tl-body">
                    <div className="cc-tl-hist">{r.historico}</div>
                    <div className="cc-tl-meta">{fmtDate(r.data)} · {r.contaNome}</div>
                  </div>
                  <div className={`cc-tl-val ${r.tipo}`}>{r.tipo === 'entrada' ? '+' : '-'}{fmtBRL(r.valor)}</div>
                </div>
              ))}
              {(!recentes || recentes.length === 0) && <div style={{ color: '#475569', fontSize: 12 }}>Nenhum lançamento recente.</div>}
            </div>
          </div>
        </div>

        <div className="cc-panel">
          <div className="cc-panel-header">
            <div className="cc-panel-title"><BarChart2 size={13} /> RESUMO FINANCEIRO</div>
          </div>
          <div className="cc-panel-body">
            <div className="cc-resumo-grid">
              <div className="cc-resumo-item">
                <div className="cc-resumo-label">Maior Saldo</div>
                <div className="cc-resumo-value green">{fmtBRL(resumo?.maiorSaldo)}</div>
              </div>
              <div className="cc-resumo-item">
                <div className="cc-resumo-label">Menor Saldo</div>
                <div className={`cc-resumo-value ${(resumo?.menorSaldo || 0) < 0 ? 'red' : ''}`}>{fmtBRL(resumo?.menorSaldo)}</div>
              </div>
              <div className="cc-resumo-item">
                <div className="cc-resumo-label">Total Entradas</div>
                <div className="cc-resumo-value green">{fmtBRL(resumo?.totalEntradasPeriodo)}</div>
              </div>
              <div className="cc-resumo-item">
                <div className="cc-resumo-label">Total Saídas</div>
                <div className="cc-resumo-value red">{fmtBRL(resumo?.totalSaidasPeriodo)}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, borderTop: '1px solid #1e293b', paddingTop: 14 }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Próximos Vencimentos</div>
              {(previstos || []).slice(0, 5).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: '#94a3b8' }}>{fmtDate(p.vencimento)} <span style={{ color: '#475569' }}>{p.historico?.substring(0, 18)}</span></span>
                  <span style={{ color: p.tipo === 'entrada' ? '#4ade80' : '#f87171', fontWeight: 600 }}>{fmtBRL(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal gráfico ampliado */}
      {chartExpanded && (
        <div className="cc-chart-overlay" onClick={() => setChartExpanded(false)}>
          <div className="cc-chart-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-chart-modal-header">
              <div className="cc-panel-title"><BarChart2 size={14} /> FLUXO PROJETADO — 30 dias</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} /> Entradas</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: '#ef4444', borderRadius: 2, display: 'inline-block' }} /> Saídas</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 18, height: 2, background: '#60a5fa', display: 'inline-block' }} /> Saldo</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: '#475569', borderRadius: 2, display: 'inline-block', opacity: 0.4 }} /> Projetado</span>
                </div>
                <button className="cc-chart-close-btn" onClick={() => setChartExpanded(false)} title="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 12px 16px 0', flex: 1 }}>
              <ResponsiveContainer width="100%" height={460}>
                <ComposedChart data={chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={Math.max(0, Math.floor(chartData.length / 15))}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickFormatter={v => fmtNum(v / 1000) + 'k'}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip content={<CcFluxoTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]} maxBarSize={20}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill="#22c55e"
                        opacity={entry.previsto ? 0.35 : (selectedDay && selectedDay !== entry._date ? 0.4 : 0.9)}
                        stroke={selectedDay === entry._date ? '#4ade80' : 'none'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="saidas" name="Saídas" radius={[3, 3, 0, 0]} maxBarSize={20}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill="#ef4444"
                        opacity={entry.previsto ? 0.35 : (selectedDay && selectedDay !== entry._date ? 0.4 : 0.9)}
                        stroke={selectedDay === entry._date ? '#f87171' : 'none'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#60a5fa"
                    dot={false}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {selectedDay && (
              <div style={{ padding: '0 20px 14px', fontSize: 12, color: '#94a3b8' }}>
                Dia selecionado: <strong style={{ color: '#e2e8f0' }}>{selectedDay}</strong>
                <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', marginLeft: 8, fontSize: 14 }}>×</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Lançamentos ──────────────────────────────────────────────────────────────
const CcLancamentos = ({ empresa }) => {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [dataIni, setDataIni] = useState(thirtyAgo);
  const [dataFim, setDataFim] = useState(today);
  const [tipo, setTipo] = useState('todos');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const load = useCallback((off = 0) => {
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/lancamentos?empresa=${empresa}&dataIni=${dataIni}&dataFim=${dataFim}&tipo=${tipo}&limit=${limit}&offset=${off}`)
      .then(r => r.json())
      .then(d => { setRows(d.lancamentos || []); setOffset(off); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresa, dataIni, dataFim, tipo]);

  useEffect(() => { load(0); }, [load]);

  return (
    <div className="cc-panel" style={{ minHeight: 400 }}>
      <div className="cc-panel-header">
        <div className="cc-panel-title"><FileText size={13} /> LANÇAMENTOS</div>
      </div>
      <div className="cc-filter-bar">
        <div className="cc-toolbar">
          <span className="cc-toolbar-label">De</span>
          <input type="date" className="cc-input" value={dataIni} onChange={e => setDataIni(e.target.value)} />
          <span className="cc-toolbar-label">Até</span>
          <input type="date" className="cc-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <select className="cc-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="entradas">Entradas</option>
            <option value="saidas">Saídas</option>
          </select>
          <button className="cc-btn primary" onClick={() => load(0)}>Filtrar</button>
        </div>
      </div>
      <div className="cc-panel-body no-pad">
        {loading ? (
          <div className="cc-loading"><Activity size={14} /> Carregando...</div>
        ) : (
          <table className="cc-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Histórico</th>
                <th>Documento</th>
                <th style={{ textAlign: 'right' }}>Débito</th>
                <th style={{ textAlign: 'right' }}>Crédito</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r.data)}</td>
                  <td><span className={`cc-badge ${r.tipo}`}>{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                  <td>{r.historico}</td>
                  <td>{r.documento || '—'}</td>
                  <td className="amount-neg" style={{ textAlign: 'right' }}>{r.debito > 0 ? fmtBRL(r.debito) : '—'}</td>
                  <td className="amount-pos" style={{ textAlign: 'right' }}>{r.credito > 0 ? fmtBRL(r.credito) : '—'}</td>
                  <td><span className="cc-badge concluido">{r.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#475569', padding: 24 }}>Nenhum lançamento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="cc-pagination">
        <button className="cc-btn" disabled={offset === 0} onClick={() => load(Math.max(0, offset - limit))}>
          <ChevronLeft size={14} />
        </button>
        <span>Página {Math.floor(offset / limit) + 1} · {rows.length} registros</span>
        <button className="cc-btn" disabled={rows.length < limit} onClick={() => load(offset + limit)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Lançamentos Previstos ─────────────────────────────────────────────────────
const CcPrevistos = ({ empresa }) => {
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const [dataIni, setDataIni] = useState(today);
  const [dataFim, setDataFim] = useState(future);
  const [subTab, setSubTab] = useState('todos');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/previstos?empresa=${empresa}&dataIni=${dataIni}&dataFim=${dataFim}&tipo=${subTab}&limit=100`)
      .then(r => r.json())
      .then(d => { setRows(d.previstos || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresa, dataIni, dataFim, subTab]);

  useEffect(() => { load(); }, [load]);

  const totalEnt = rows.filter(r => r.tipo === 'entrada').reduce((s, r) => s + (r.valor || 0), 0);
  const totalSai = rows.filter(r => r.tipo === 'saida').reduce((s, r) => s + (r.valor || 0), 0);

  return (
    <div className="cc-panel" style={{ minHeight: 400 }}>
      <div className="cc-panel-header">
        <div className="cc-panel-title"><Calendar size={13} /> LANÇAMENTOS PREVISTOS</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span style={{ color: '#4ade80' }}>Entradas: {fmtBRL(totalEnt)}</span>
          <span style={{ color: '#f87171' }}>Saídas: {fmtBRL(totalSai)}</span>
        </div>
      </div>
      <div className="cc-sub-tabs">
        {['todos', 'entradas', 'saidas'].map(t => (
          <button key={t} className={`cc-sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'todos' ? 'Todos' : t === 'entradas' ? 'Entradas' : 'Saídas'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="cc-toolbar-label">De</span>
          <input type="date" className="cc-input" value={dataIni} onChange={e => setDataIni(e.target.value)} />
          <span className="cc-toolbar-label">Até</span>
          <input type="date" className="cc-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <button className="cc-btn primary" onClick={load}>Filtrar</button>
        </div>
      </div>
      <div className="cc-panel-body no-pad">
        {loading ? (
          <div className="cc-loading"><Activity size={14} /> Carregando...</div>
        ) : (
          <table className="cc-table">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Tipo</th>
                <th>Histórico</th>
                <th>Documento</th>
                <th style={{ textAlign: 'right' }}>Débito</th>
                <th style={{ textAlign: 'right' }}>Crédito</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r.vencimento)}</td>
                  <td><span className={`cc-badge ${r.tipo}`}>{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                  <td>{r.historico}</td>
                  <td>{r.documento || '—'}</td>
                  <td className="amount-neg" style={{ textAlign: 'right' }}>{r.debito > 0 ? fmtBRL(r.debito) : '—'}</td>
                  <td className="amount-pos" style={{ textAlign: 'right' }}>{r.credito > 0 ? fmtBRL(r.credito) : '—'}</td>
                  <td><span className={`cc-badge ${r.status === 'Vencido' ? 'vencido' : 'previsto'}`}>{r.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#475569', padding: 24 }}>Nenhum lançamento previsto.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Conciliação ───────────────────────────────────────────────────────────────
const CcConciliacao = ({ empresa }) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataIni, setDataIni] = useState(new Date(Date.now() - 30*86400000).toISOString().slice(0,10));
  const [dataFim, setDataFim] = useState(hoje);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('rece'); // rece | paga

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/conciliacao?empresa=${empresa}&dataIni=${dataIni}&dataFim=${dataFim}`)
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresa, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);

  const statusColor = s => s === 'conciliado' ? '#4ade80' : s === 'vencido' ? '#f87171' : '#facc15';
  const statusBg = s => s === 'conciliado' ? 'rgba(34,197,94,0.12)' : s === 'vencido' ? 'rgba(239,68,68,0.12)' : 'rgba(250,204,21,0.12)';
  const rows = aba === 'rece' ? (dados?.rece || []) : (dados?.paga || []);
  const resumo = dados?.resumo;

  return (
    <div>
      {/* KPIs */}
      {resumo && (
        <div className="cc-kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 14 }}>
          <div className="cc-kpi-card positive">
            <div className="cc-kpi-label">Recebíveis Previstos</div>
            <div className="cc-kpi-value">{fmtBRL(resumo.recePrevisto)}</div>
            <div className="cc-kpi-sub">Conciliado: {fmtBRL(resumo.receConciliado)}</div>
          </div>
          <div className="cc-kpi-card red">
            <div className="cc-kpi-label">A Pagar Previsto</div>
            <div className="cc-kpi-value">{fmtBRL(resumo.pagaPrevisto)}</div>
            <div className="cc-kpi-sub">Conciliado: {fmtBRL(resumo.pagaConciliado)}</div>
          </div>
          <div className="cc-kpi-card yellow">
            <div className="cc-kpi-label">Vencidos — Receber</div>
            <div className="cc-kpi-value red">{fmtBRL(resumo.receVencido)}</div>
            <div className="cc-kpi-sub">A pagar vencido: {fmtBRL(resumo.pagaVencido)}</div>
          </div>
        </div>
      )}

      <div className="cc-panel">
        <div className="cc-panel-header">
          <div className="cc-panel-title"><RefreshCw size={13} /> CONCILIAÇÃO BANCÁRIA</div>
        </div>
        <div className="cc-sub-tabs">
          <button className={`cc-sub-tab ${aba === 'rece' ? 'active' : ''}`} onClick={() => setAba('rece')}>Contas a Receber</button>
          <button className={`cc-sub-tab ${aba === 'paga' ? 'active' : ''}`} onClick={() => setAba('paga')}>Contas a Pagar</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="cc-toolbar-label">De</span>
            <input type="date" className="cc-input" value={dataIni} onChange={e => setDataIni(e.target.value)} />
            <span className="cc-toolbar-label">Até</span>
            <input type="date" className="cc-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            <button className="cc-btn primary" onClick={load}>Filtrar</button>
          </div>
        </div>
        <div className="cc-panel-body no-pad">
          {loading ? <div className="cc-loading"><Activity size={14} /> Carregando...</div> : (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Data Vencimento</th>
                  <th>Histórico</th>
                  <th>Documento</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{fmtDate(r.data)}</td>
                    <td>{r.historico}</td>
                    <td style={{ color: '#4b5563' }}>{r.documento || '—'}</td>
                    <td className={aba === 'rece' ? 'amount-pos' : 'amount-neg'} style={{ textAlign: 'right' }}>{fmtBRL(r.valor)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: statusBg(r.status), color: statusColor(r.status) }}>
                        {r.status === 'conciliado' ? 'Conciliado' : r.status === 'vencido' ? 'Vencido' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#374151', padding: 24 }}>Nenhum registro no período.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Transferências ────────────────────────────────────────────────────────────
const CcTransferencias = ({ empresa }) => {
  const [dataIni, setDataIni] = useState(new Date(Date.now()-30*86400000).toISOString().slice(0,10));
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0,10));
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/transferencias?empresa=${empresa}&dataIni=${dataIni}&dataFim=${dataFim}`)
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empresa, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);

  const contas = dados?.contas || [];
  const totalEnt = contas.reduce((s, c) => s + c.entradas.total, 0);
  const totalSai = contas.reduce((s, c) => s + c.saidas.total, 0);

  return (
    <div>
      <div className="cc-kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 14 }}>
        <div className="cc-kpi-card positive">
          <div className="cc-kpi-label">Total Entradas no Período</div>
          <div className="cc-kpi-value green">{fmtBRL(totalEnt)}</div>
          <div className="cc-kpi-sub">em {contas.length} conta(s)</div>
        </div>
        <div className="cc-kpi-card red">
          <div className="cc-kpi-label">Total Saídas no Período</div>
          <div className="cc-kpi-value red">{fmtBRL(totalSai)}</div>
          <div className="cc-kpi-sub">em {contas.length} conta(s)</div>
        </div>
        <div className="cc-kpi-card blue">
          <div className="cc-kpi-label">Saldo Movimento</div>
          <div className={`cc-kpi-value ${totalEnt-totalSai >= 0 ? 'green' : 'red'}`}>{fmtBRL(totalEnt-totalSai)}</div>
          <div className="cc-kpi-sub">entradas — saídas</div>
        </div>
      </div>

      <div className="cc-panel">
        <div className="cc-panel-header">
          <div className="cc-panel-title"><TrendingUp size={13} /> MOVIMENTAÇÃO POR CONTA</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="cc-toolbar-label">De</span>
            <input type="date" className="cc-input" value={dataIni} onChange={e => setDataIni(e.target.value)} />
            <span className="cc-toolbar-label">Até</span>
            <input type="date" className="cc-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            <button className="cc-btn primary" onClick={load}>Filtrar</button>
          </div>
        </div>
        <div className="cc-panel-body no-pad">
          {loading ? <div className="cc-loading"><Activity size={14} /> Carregando...</div> : (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Banco</th>
                  <th style={{ textAlign: 'right' }}>Entradas</th>
                  <th style={{ textAlign: 'center' }}>Qtd Ent.</th>
                  <th style={{ textAlign: 'right' }}>Saídas</th>
                  <th style={{ textAlign: 'center' }}>Qtd Saí.</th>
                  <th style={{ textAlign: 'right' }}>Movimento</th>
                  <th style={{ textAlign: 'right' }}>Saldo Atual</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#d1d5db' }}>{c.descricao}</td>
                    <td style={{ color: '#4b5563' }}>{bancoBadge ? (() => { const b = c.descricao?.toUpperCase(); if(b?.includes('BB')||b?.includes('BRASIL'))return'Banco do Brasil'; if(b?.includes('SANT'))return'Santander'; return 'Conta Interna'; })() : '—'}</td>
                    <td className="amount-pos" style={{ textAlign: 'right' }}>{fmtBRL(c.entradas.total)}</td>
                    <td style={{ textAlign: 'center', color: '#4b5563' }}>{c.entradas.qtd}</td>
                    <td className="amount-neg" style={{ textAlign: 'right' }}>{fmtBRL(c.saidas.total)}</td>
                    <td style={{ textAlign: 'center', color: '#4b5563' }}>{c.saidas.qtd}</td>
                    <td className={c.movimento >= 0 ? 'amount-pos' : 'amount-neg'} style={{ textAlign: 'right', fontWeight: 700 }}>{fmtBRL(c.movimento)}</td>
                    <td className={c.saldo >= 0 ? 'amount-pos' : 'amount-neg'} style={{ textAlign: 'right' }}>{fmtBRL(c.saldo)}</td>
                  </tr>
                ))}
                {contas.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#374151', padding: 24 }}>Nenhuma movimentação no período.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Extratos ──────────────────────────────────────────────────────────────────
const CcExtratos = ({ empresa }) => {
  const [dataIni, setDataIni] = useState(new Date(Date.now()-30*86400000).toISOString().slice(0,10));
  const [dataFim, setDataFim] = useState(new Date().toISOString().slice(0,10));
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contaSel, setContaSel] = useState('');

  const load = useCallback((cid) => {
    const c = cid || contaSel;
    setLoading(true);
    fetch(`${API_URL}/api/conta-corrente/extratos?empresa=${empresa}&dataIni=${dataIni}&dataFim=${dataFim}${c ? `&conta=${c}` : ''}`)
      .then(r => r.json())
      .then(d => {
        setDados(d);
        if (!contaSel && d.contaId) setContaSel(String(d.contaId));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [empresa, dataIni, dataFim, contaSel]);

  useEffect(() => { load(); }, [empresa]); // eslint-disable-line

  const mov = dados?.movimentos || [];
  const totalEnt = mov.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const totalSai = mov.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);

  return (
    <div>
      <div className="cc-panel">
        <div className="cc-panel-header">
          <div className="cc-panel-title"><FileText size={13} /> EXTRATO BANCÁRIO</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="cc-select" value={contaSel} onChange={e => { setContaSel(e.target.value); }}>
              {(dados?.contas || []).map(c => (
                <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
              ))}
            </select>
            <span className="cc-toolbar-label">De</span>
            <input type="date" className="cc-input" value={dataIni} onChange={e => setDataIni(e.target.value)} />
            <span className="cc-toolbar-label">Até</span>
            <input type="date" className="cc-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            <button className="cc-btn primary" onClick={() => load(contaSel)}>Filtrar</button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="cc-extratos-summary">
          <span className="cc-extratos-summary-item">Saldo Inicial: <strong>{fmtBRL(dados?.saldoInicial || 0)}</strong></span>
          <span className="cc-extratos-summary-item" style={{ color: '#4ade80' }}>Entradas: <strong>{fmtBRL(totalEnt)}</strong></span>
          <span className="cc-extratos-summary-item" style={{ color: '#f87171' }}>Saídas: <strong>{fmtBRL(totalSai)}</strong></span>
          <span className="cc-extratos-summary-item right" style={{ color: (dados?.saldoFinal || 0) >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>Saldo Final: {fmtBRL(dados?.saldoFinal || 0)}</span>
        </div>

        <div className="cc-panel-body no-pad" style={{ maxHeight: 520, overflow: 'auto' }}>
          {loading ? <div className="cc-loading"><Activity size={14} /> Carregando...</div> : (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Histórico</th>
                  <th>Documento</th>
                  <th style={{ textAlign: 'right' }}>Débito</th>
                  <th style={{ textAlign: 'right' }}>Crédito</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {mov.map((m, i) => (
                  <tr key={i}>
                    <td>{fmtDate(m.data)}</td>
                    <td><span className={`cc-badge ${m.tipo}`}>{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                    <td>{m.historico}</td>
                    <td style={{ color: '#4b5563' }}>{m.documento || '—'}</td>
                    <td className="amount-neg" style={{ textAlign: 'right' }}>{m.debito > 0 ? fmtBRL(m.debito) : '—'}</td>
                    <td className="amount-pos" style={{ textAlign: 'right' }}>{m.credito > 0 ? fmtBRL(m.credito) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: m.saldo >= 0 ? '#4ade80' : '#f87171' }}>{fmtBRL(m.saldo)}</td>
                  </tr>
                ))}
                {mov.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#374151', padding: 24 }}>Nenhum movimento para esta conta no período.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ContaCorrente root ───────────────────────────────────────────────────────
const ContaCorrente = ({ clients, selectedClient }) => {
  const empresa = selectedClient?.codigoEmpresa || selectedClient?.id || 7432;
  const [tab, setTab] = useState('visao');

  return (
    <div className="cc-wrapper">
      <div className="cc-tab-bar">
        {CC_TABS.map(t => (
          <button key={t.id} className={`cc-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="cc-tab-content">
        {tab === 'visao'         && <CcVisaoGeral empresa={empresa} />}
        {tab === 'lancamentos'   && <CcLancamentos empresa={empresa} />}
        {tab === 'previstos'     && <CcPrevistos empresa={empresa} />}
        {tab === 'conciliacao'   && <CcConciliacao empresa={empresa} />}
        {tab === 'transferencias'&& <CcTransferencias empresa={empresa} />}
        {tab === 'extratos'      && <CcExtratos empresa={empresa} />}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Financeiro = ({ clients, selectedClient, themeMode }) => {
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
        <button
          className={`vp-period-btn vp-secao-btn${tab === 'cartoes' ? ' active' : ''}`}
          onClick={() => setTab('cartoes')}
        >
          💳 Cartões
        </button>
      </div>
      {tab === 'receber' && <ContasReceber clients={clients} selectedClient={selectedClient} />}
      {tab === 'pagar' && <ContasPagar clients={clients} selectedClient={selectedClient} />}
      {tab === 'cartoes' && <ControleCartoes themeMode={themeMode} />}
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
    if (paused || n === 0) return;
    const t = setInterval(() => setActive(p => (p + 1) % n), 3200);
    return () => clearInterval(t);
  }, [n, paused]);

  if (n === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        Sem dados de conveniência no período
      </div>
    );
  }

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
const Dashboard = ({ kpis, combustiveis, vendasDiarias, vendasHorarias, lmcControle, estoques, loading, clients, selectedClient, selectedPeriod, setSelectedPeriod, onRefresh, themeMode, topConvenio, vendasDiariasCombusFull, abcProdutos1, abcProdutos2 }) => {
  const [selectedFuelDonut, setSelectedFuelDonut] = useState(null);
  const [isCompactDashboard, setIsCompactDashboard] = useState(false);
  const [salesFuelSection, setSalesFuelSection] = useState('conveniencia');
  const [productMatrixUnit, setProductMatrixUnit] = useState('Pista');
  const [productMatrixPeriod, setProductMatrixPeriod] = useState('Mensal');
  const [productMatrixAnimKey, setProductMatrixAnimKey] = useState(0);
  // Carrega todas as imagens de produto (stale-while-revalidate)
  const [convProductImages, setConvProductImages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(IMG_LS_KEY) || 'null') || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    imgLoadAll().then(all => {
      setConvProductImages(prev => {
        const allKeys  = new Set([...Object.keys(all), ...Object.keys(prev)]);
        const changed  = [...allKeys].some(k => prev[k] !== all[k]);
        return changed ? all : prev;
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

  const _CONV_DASH_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];
  const salesConvChartData = (topConvenio && topConvenio.length > 0 ? topConvenio : []).map((r, i) => ({ ...r, color: _CONV_DASH_COLORS[i % _CONV_DASH_COLORS.length] }));

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
  const abcBase = productMatrixUnit === 'Combustível' ? (abcProdutos1 || []) : (abcProdutos2 || []);
  const productMatrixData = abcBase.map(item => ({
    ...item,
    volume: Math.round(item.volume * selectedMatrixPeriod.factor),
    margin: clamp(item.margin, 0, 99),
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
            <BarChart data={salesFuelChartData} margin={{ top: 48, right: 32, left: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
              <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={0} height={isCompactDashboard ? 46 : 30} angle={isCompactDashboard ? -18 : 0} textAnchor={isCompactDashboard ? 'end' : 'middle'} />
              <YAxis stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} width={isCompactDashboard ? 46 : 60} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtLitersLabel(v), 'Litros']} />
              <Bar dataKey="litros" name="Litros vendidos" fill={DASHBOARD_COLORS.sale} shape={ThreeDBar}>
                {salesFuelChartData.map((entry, index) => (
                  <Cell key={`sales-fuel-${entry.name}-${index}`} fill={entry.color || DASHBOARD_COLORS.sale} />
                ))}
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

        {productMatrixSorted.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Sem dados de produtos no período
          </div>
        )}
        <ResponsiveContainer key={`abc-${productMatrixAnimKey}`} width="100%" height={productMatrixSorted.length > 0 ? productMatrixHeight : 0}>
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
          <ProjecaoVendas vendasDiariasCombusFull={vendasDiariasCombusFull} selectedPeriod={selectedPeriod} />
        </div>
        <div className="dashboard-static-full">
          <MetasRealizadoChart themeMode={themeMode} vendasDiariasCombusFull={vendasDiariasCombusFull} selectedPeriod={selectedPeriod} />
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
        <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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
      <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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
      <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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
      <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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

// ── Faltas/Sobras de Caixa por Turno ─────────────────────────────────────────
const _TURNO_BASE = [
  { id:'T001', data:'2026-05-25', turno:'Manhã',  operador:'Carlos Silva',  abert:'06:00', fech:'14:00', sistema:3250.00, fisico:3250.00,  obs:'' },
  { id:'T002', data:'2026-05-25', turno:'Tarde',  operador:'Maria Santos',  abert:'14:00', fech:'22:00', sistema:4180.00, fisico:4168.50,  obs:'Verificar troco no fechamento do turno' },
  { id:'T003', data:'2026-05-25', turno:'Noite',  operador:'João Pereira',  abert:'22:00', fech:'06:00', sistema:1920.00, fisico:1922.50,  obs:'' },
  { id:'T004', data:'2026-05-26', turno:'Manhã',  operador:'Carlos Silva',  abert:'06:00', fech:'14:00', sistema:2980.00, fisico:2980.00,  obs:'' },
  { id:'T005', data:'2026-05-26', turno:'Tarde',  operador:'Ana Oliveira',  abert:'14:00', fech:'22:00', sistema:5240.00, fisico:5215.00,  obs:'Divergência identificada ao fechar caixa' },
  { id:'T006', data:'2026-05-26', turno:'Noite',  operador:'João Pereira',  abert:'22:00', fech:'06:00', sistema:2100.00, fisico:2108.00,  obs:'' },
  { id:'T007', data:'2026-05-27', turno:'Manhã',  operador:'Maria Santos',  abert:'06:00', fech:'14:00', sistema:3650.00, fisico:3650.00,  obs:'' },
  { id:'T008', data:'2026-05-27', turno:'Tarde',  operador:'Ana Oliveira',  abert:'14:00', fech:'22:00', sistema:4520.00, fisico:4515.00,  obs:'Dentro da tolerância operacional' },
  { id:'T009', data:'2026-05-27', turno:'Noite',  operador:'Pedro Lima',    abert:'22:00', fech:'06:00', sistema:1750.00, fisico:1750.00,  obs:'' },
];
const _TURNO_OPERADORES = [...new Set(_TURNO_BASE.map(r => r.operador))].sort();

function _computeTurnoRows({ dataInicial, dataFinal, turno, operador }) {
  return _TURNO_BASE
    .filter(r => {
      if (dataInicial && r.data < dataInicial) return false;
      if (dataFinal   && r.data > dataFinal)   return false;
      if (turno    !== 'Todos' && r.turno    !== turno)    return false;
      if (operador !== 'Todos' && r.operador !== operador) return false;
      return true;
    })
    .map(r => {
      const diverg    = parseFloat((r.fisico - r.sistema).toFixed(2));
      const absDiverg = Math.abs(diverg);
      const tipo      = absDiverg < 0.01 ? 'OK' : diverg < 0 ? 'Falta' : 'Sobra';
      const alerta    = absDiverg > 10 ? 'red' : absDiverg >= 0.01 ? 'yellow' : 'none';
      return { ...r, diverg, tipo, alerta };
    });
}

function buildTurnoReportHtml({ filters, clientName }) {
  const rows = _computeTurnoRows(filters);
  if (!rows.length) {
    toast('Nenhum registro encontrado para os filtros selecionados.', 'warn');
    return null;
  }

  const e    = escapeHtml;
  const fmtR = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const fmtD = s => { if (!s) return '-'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };
  const generatedAt = new Date().toLocaleString('pt-BR');

  const totSistema = rows.reduce((s,r) => s + r.sistema, 0);
  const totFisico  = rows.reduce((s,r) => s + r.fisico, 0);
  const faltas     = rows.filter(r => r.tipo === 'Falta');
  const sobras     = rows.filter(r => r.tipo === 'Sobra');
  const totFaltas  = faltas.reduce((s,r) => s + r.diverg, 0);    // negative sum
  const totSobras  = sobras.reduce((s,r) => s + r.diverg, 0);    // positive sum
  const saldoLiq   = parseFloat((totFaltas + totSobras).toFixed(2));
  const maiorDiv   = Math.max(...rows.map(r => Math.abs(r.diverg)));
  const nOK        = rows.filter(r => r.tipo === 'OK').length;
  const nRed       = rows.filter(r => r.alerta === 'red').length;

  const TIPO_MAP = {
    OK:    { icon:'🟢', color:'#059669', bg:'#d1fae5' },
    Falta: { icon:'🔴', color:'#dc2626', bg:'#fee2e2' },
    Sobra: { icon:'🟡', color:'#d97706', bg:'#fef3c7' },
  };
  const TURNO_ICON = { Manhã:'🌅', Tarde:'☀️', Noite:'🌙' };

  const kpis = [
    { label:'TURNOS',          value:e(rows.length) },
    { label:'SEM DIVERGÊNCIA', value:e(nOK) },
    { label:'FALTAS',          value:e(faltas.length), alert: faltas.length > 0 },
    { label:'SOBRAS',          value:e(sobras.length) },
    { label:'TOTAL FALTAS',    value:`-${e(fmtR(totFaltas))}`, alert: faltas.length > 0 },
    { label:'TOTAL SOBRAS',    value:e(fmtR(totSobras)) },
    { label:'SALDO LÍQUIDO',   value:`${saldoLiq >= 0 ? '+' : '-'}${e(fmtR(saldoLiq))}`, hard: saldoLiq < -10 },
    { label:'MAIOR DIVERG.',   value:e(fmtR(maiorDiv)), alert: maiorDiv > 10 },
  ];
  const kpiHtml = kpis.map(k => `
    <div class="summary-item${k.hard ? ' summary-hard' : k.alert ? ' summary-alert' : ''}">
      <span>${k.label}</span><strong>${k.value}</strong>
    </div>`).join('');

  const tableRows = rows.map((row, i) => {
    const tm = TIPO_MAP[row.tipo];
    const rowBg = row.alerta === 'red' ? 'rgba(239,68,68,.08)' : row.alerta === 'yellow' ? 'rgba(245,158,11,.07)' : (i%2===0 ? '#fff' : '#f9fafb');
    const divColor = row.tipo === 'OK' ? '#059669' : row.tipo === 'Falta' ? '#dc2626' : '#d97706';
    const divSign  = row.diverg > 0 ? '+' : row.diverg < 0 ? '' : '';
    return `
    <tr style="background:${rowBg}">
      <td>${e(fmtD(row.data))}</td>
      <td>${e((TURNO_ICON[row.turno]||'')+' '+row.turno)}</td>
      <td style="font-weight:700">${e(row.operador)}</td>
      <td class="num">${e(row.abert)}</td>
      <td class="num">${e(row.fech)}</td>
      <td class="num">${e(fmtR(row.sistema))}</td>
      <td class="num" style="font-weight:700">${e(fmtR(row.fisico))}</td>
      <td class="num" style="font-weight:800;color:${divColor}">${divSign}${row.diverg < 0 ? '-' : ''}${e(fmtR(row.diverg))}</td>
      <td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700;background:${tm.bg};color:${tm.color};white-space:nowrap">${tm.icon} ${e(row.tipo)}</span></td>
      <td style="font-size:8.5px;color:#6b7280;font-style:${row.obs?'normal':'italic'}">${e(row.obs || '—')}</td>
    </tr>`;
  }).join('');

  const saldoColor = saldoLiq < -10 ? '#dc2626' : saldoLiq > 10 ? '#059669' : '#d97706';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="color-scheme" content="light"/>
  <title>Relatorio Faltas e Sobras de Caixa por Turno</title>
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
    .summary-item strong { display:block; color:#111827; font-size:13px; font-weight:900; line-height:1.1; }
    .panel { border:1px solid #e5e7eb; border-radius:8px; background:#fff; padding:14px; }
    .panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .panel-title { margin:0; color:#111827; font-size:13px; font-weight:800; }
    .pill { border:1px solid #d0d5dd; border-radius:8px; color:#344054; padding:4px 8px; font-size:9px; font-weight:800; white-space:nowrap; background:#f9fafb; }
    .saldo-banner { margin-bottom:14px; padding:10px 16px; border-radius:8px; display:flex; align-items:center; gap:12px;
      background:${saldoLiq < -0.01 ? '#fef2f2' : '#f0fdf4'}; border:1px solid ${saldoLiq < -0.01 ? '#fca5a5' : '#bbf7d0'}; }
    .saldo-label { font-size:11px; font-weight:700; color:#374151; }
    .saldo-value { font-size:20px; font-weight:900; color:${saldoColor}; margin-left:auto; }
    table { width:100%; border-collapse:collapse; font-size:9px; }
    th,td { border:1px solid #d0d5dd; padding:5px 7px; word-break:break-word; }
    th { background:#e31e24!important; color:#fff; font-size:8.5px; font-weight:700; text-align:left; }
    td { color:#111827; background:inherit; }
    td.num,th.num { text-align:right; }
    tfoot td { color:#111827; background:#f3f4f6!important; font-weight:900; font-size:9px; }
    thead { display:table-header-group; }
    tfoot { display:table-footer-group; }
    tr { page-break-inside:avoid; break-inside:avoid; }
    .footer { margin-top:10px; color:#667085; font-size:10px; text-align:right; }
    @media screen { body { background:#f3f4f6; padding:18px; } .report { max-width:1280px; margin:0 auto; box-shadow:0 18px 50px rgba(15,23,42,.12); } }
    @media print {
      body,html,.report,.panel,.header,.summary-item,.saldo-banner { background-color:inherit!important; color-scheme:light!important; }
      th { background:#e31e24!important; color:#fff!important; }
      tfoot td { background:#f3f4f6!important; }
      .header { break-inside:avoid; page-break-inside:avoid; }
      .summary-grid { break-inside:avoid; page-break-inside:avoid; }
      .panel-head { break-inside:avoid; page-break-inside:avoid; }
      .panel { break-before:auto; page-break-before:auto; }
    }
  </style>
</head>
<body>
<main class="report">
  <section class="header">
    <div class="header-left">
      <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
      <div>
        <h1>FALTAS / SOBRAS DE CAIXA POR TURNO</h1>
        <div class="header-meta" style="text-align:left">${e(clientName||'Cliente')} | Turno: ${e(filters.turno)} · Operador: ${e(filters.operador)}</div>
      </div>
    </div>
    <div class="header-meta">
      <div>Tolerância operacional: até R$ 10,00 (amarelo)</div>
      <div>Divergências acima de R$ 10,00 destacadas em vermelho</div>
      <div>Gerado em ${e(generatedAt)}</div>
    </div>
  </section>

  <div class="summary-grid">${kpiHtml}</div>

  <div class="saldo-banner">
    <span class="saldo-label">SALDO LÍQUIDO DO PERÍODO (Faltas − Sobras)</span>
    <span class="saldo-value">${saldoLiq < 0 ? '▼' : saldoLiq > 0 ? '▲' : '='} ${saldoLiq < 0 ? '-' : '+'}${e(fmtR(saldoLiq))}</span>
  </div>

  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">REGISTROS POR TURNO — AUDITORIA DE CAIXA</h2>
      <div class="pill">${e(rows.length)} turno${rows.length!==1?'s':''} analisado${rows.length!==1?'s':''}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>DATA</th>
          <th>TURNO</th>
          <th>OPERADOR / FRENTISTA</th>
          <th class="num">ABERTURA</th>
          <th class="num">FECHAMENTO</th>
          <th class="num">SISTEMA (R$)</th>
          <th class="num">FÍSICO (R$)</th>
          <th class="num">DIVERGÊNCIA (R$)</th>
          <th>TIPO</th>
          <th>OBSERVAÇÃO</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5">TOTAL — ${e(rows.length)} turnos · ${e(faltas.length)} falta${faltas.length!==1?'s':''} · ${e(sobras.length)} sobra${sobras.length!==1?'s':''}</td>
          <td class="num">${e(fmtR(totSistema))}</td>
          <td class="num">${e(fmtR(totFisico))}</td>
          <td class="num" style="color:${saldoColor};font-size:10px">${saldoLiq < 0 ? '-' : saldoLiq > 0 ? '+' : ''}${e(fmtR(saldoLiq))}</td>
          <td colspan="2">Faltas: ${e(fmtR(totFaltas))} · Sobras: +${e(fmtR(totSobras))}</td>
        </tr>
      </tfoot>
    </table>
  </section>

  <footer class="footer">STARVL | Relatório de Faltas/Sobras de Caixa por Turno${nRed > 0 ? ` — ⚠️ ${nRed} registro${nRed>1?'s':''} com divergência crítica` : ''}</footer>
</main>
</body>
</html>`;
}

function exportTurnoReport({ filters, clientName }) {
  const html = buildTurnoReportHtml({ filters, clientName });
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

const TurnoFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const upd = field => e => setFilters(prev => ({ ...prev, [field]: e.target.value }));
  const TURNOS = ['Todos','Manhã','Tarde','Noite'];
  const TURNO_ICON = { Todos:'🔄', Manhã:'🌅', Tarde:'☀️', Noite:'🌙' };

  const preview = _computeTurnoRows(filters);
  const nFaltas = preview.filter(r => r.tipo === 'Falta').length;
  const nSobras = preview.filter(r => r.tipo === 'Sobra').length;
  const nOK     = preview.filter(r => r.tipo === 'OK').length;

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={ev => ev.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Filter size={25} /></span>
            <h3>FILTROS — FALTAS / SOBRAS DE CAIXA POR TURNO</h3>
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

            {/* Operador */}
            <section className="control-print-section">
              <div className="control-print-section-title">
                <UsersIcon size={20} /><span>OPERADOR / FRENTISTA</span>
              </div>
              <label className="control-print-field" style={{ marginTop:8 }}>
                <span>SELECIONAR OPERADOR</span>
                <div className="control-print-input">
                  <select value={filters.operador} onChange={upd('operador')} style={{ flex:1, background:'transparent', border:'none', color:'inherit', fontSize:13, cursor:'pointer' }}>
                    <option value="Todos">Todos os operadores</option>
                    {_TURNO_OPERADORES.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </label>
            </section>

          </div>

          {/* Turno */}
          <section className="control-print-section" style={{ marginTop:16 }}>
            <div className="control-print-section-title">
              <Clock size={20} /><span>TURNO</span>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
              {TURNOS.map(t => (
                <label key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
                  background: filters.turno === t ? '#E31E24' : 'transparent',
                  border: `1px solid ${filters.turno === t ? '#E31E24' : '#374151'}`,
                  borderRadius:10, cursor:'pointer', flex:'1 1 100px', justifyContent:'center',
                  color: filters.turno === t ? '#fff' : '#d1d5db', fontSize:13, fontWeight:700, transition:'all .15s' }}>
                  <input type="radio" name="turnoFiltro" value={t} checked={filters.turno === t} onChange={upd('turno')} style={{ display:'none' }} />
                  <span>{TURNO_ICON[t]}</span> {t}
                </label>
              ))}
            </div>
          </section>

          {/* Prévia */}
          <section className="control-print-section" style={{ marginTop:16 }}>
            <div className="control-print-section-title">
              <BarChart2 size={20} /><span>PRÉ-VISUALIZAÇÃO</span>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
              {[
                { label:'Turnos',     value:preview.length, c:'#94a3b8', bg:'rgba(148,163,184,.1)' },
                { label:'🟢 OK',       value:nOK,     c:'#059669', bg:'rgba(5,150,105,.1)' },
                { label:'🔴 Faltas',   value:nFaltas, c:'#dc2626', bg:'rgba(220,38,38,.1)' },
                { label:'🟡 Sobras',   value:nSobras, c:'#d97706', bg:'rgba(217,119,6,.1)'  },
              ].map(({ label, value, c, bg }) => (
                <div key={label} style={{ flex:'1 1 80px', background:bg, border:`1px solid ${c}44`, borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:900, color:c, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:10, color:c, fontWeight:700, marginTop:3 }}>{label}</div>
                </div>
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
// ── fim Faltas/Sobras de Caixa por Turno ─────────────────────────────────────

// ── REL 6 — Fluxo de Caixa Operacional ──────────────────────────────────────
const _FLUXO_ENTRADAS = [
  { descricao: 'Vendas Pista (Combustível)', valor: 682000 },
  { descricao: 'Loja de Conveniência', valor: 98500 },
  { descricao: 'Recebimentos a Prazo', valor: 42000 },
  { descricao: 'Outras Entradas', valor: 3200 },
];
const _FLUXO_SAIDAS = [
  { descricao: 'Compras de Combustível', valor: 521000 },
  { descricao: 'Fornecedores Loja', valor: 48000 },
  { descricao: 'Despesas Fixas', valor: 18500 },
  { descricao: 'Folha de Pagamento', valor: 35000 },
  { descricao: 'Impostos e Taxas', valor: 28500 },
  { descricao: 'Outras Saídas', valor: 8900 },
];

function buildFluxoReportHtml({ filters, clientName }) {
  const { conta, dataInicial, dataFinal } = filters;
  const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = d => d ? d.split('-').reverse().join('/') : '-';
  const entradas = conta === 'Saídas' ? [] : _FLUXO_ENTRADAS;
  const saidas   = conta === 'Entradas' ? [] : _FLUXO_SAIDAS;
  const totalEntradas = entradas.reduce((s, r) => s + r.valor, 0);
  const totalSaidas   = saidas.reduce((s, r) => s + r.valor, 0);
  const saldo = totalEntradas - totalSaidas;
  const seedVals = [4200,6800,2100,-800,5900,7200,3400,8100,1200,9300,5600,-1200,7800,4500,6100,3200,8900,2700,7400,5100,6800,-500,9200,4100,7700,3800,6200,8500,1900,5400];
  let running = 0;
  const dailyRows = seedVals.slice(0, 30).map((v, i) => {
    running += v;
    const day = String(i + 1).padStart(2, '0');
    return `<tr><td style="text-align:center">${day}</td><td style="text-align:right;color:${v >= 0 ? '#16a34a' : '#dc2626'}">${v >= 0 ? '+' : ''}${fmtBRL(v)}</td><td style="text-align:right;font-weight:600;color:${running >= 0 ? '#16a34a' : '#dc2626'}">${fmtBRL(running)}</td></tr>`;
  }).join('');
  const entradasRows = entradas.map(r => `<tr><td style="padding-left:24px">↳ ${r.descricao}</td><td></td><td style="text-align:right;color:#16a34a">${fmtBRL(r.valor)}</td></tr>`).join('');
  const saidasRows   = saidas.map(r => `<tr><td style="padding-left:24px">↳ ${r.descricao}</td><td></td><td style="text-align:right;color:#dc2626">${fmtBRL(r.valor)}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>REL 6 — Fluxo de Caixa Operacional</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;color:#1e293b;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color-scheme:light only}@page{size:A4 landscape;margin:10mm}@media screen{body{background:#f3f4f6;padding:18px}.page{box-shadow:0 18px 50px rgba(15,23,42,.12);background:#fff}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact!important;color-scheme:light!important}th{background:#e31e24!important;color:#fff!important}.header{break-inside:avoid;page-break-inside:avoid}}.page{max-width:1060px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:10px;border:1px solid #e5e7eb;border-bottom:3px solid #e31e24;border-radius:8px}.report-title{font-size:16px;font-weight:700}.report-sub{font-size:10px;color:#64748b;margin-top:2px}.section-title{font-size:12px;font-weight:700;padding:6px 10px;margin:12px 0 4px;border-radius:4px}.sec-green{background:#dcfce7;color:#166534}.sec-red{background:#fee2e2;color:#991b1b}.sec-blue{background:#dbeafe;color:#1e40af}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{background:#e31e24!important;color:#fff;padding:5px 8px;text-align:left;font-size:8.5px;font-weight:700}td{padding:4px 8px;border:1px solid #d0d5dd;font-size:10px}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid}.total-row td{font-weight:700;background:#f3f4f6;border-top:2px solid #e31e24}.result-row td{font-weight:700;font-size:13px;background:#e31e24!important;color:#fff;padding:8px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.kpi-box{background:#f8fafc;border-radius:6px;padding:10px 14px;border:1px solid #e2e8f0}.kpi-label{font-size:10px;color:#64748b;margin-bottom:4px}.kpi-value{font-size:18px;font-weight:700}.daily-table table td{padding:3px 6px;font-size:10px}</style></head><body><div class="page"><div class="header"><div><div class="report-title">REL 7 — Fluxo de Caixa Operacional</div><div class="report-sub">${clientName || 'Empresa'} &nbsp;|&nbsp; Período: ${fmtDate(dataInicial)} – ${fmtDate(dataFinal)} &nbsp;|&nbsp; Conta: ${conta}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><img src="/logo-starvl.png" alt="STARVL" style="width:80px;height:auto;object-fit:contain"/><span style="font-size:10px;color:#64748b">Gerado em ${new Date().toLocaleDateString('pt-BR')}</span></div></div><div class="grid2" style="margin-bottom:14px"><div class="kpi-box"><div class="kpi-label">Total Entradas</div><div class="kpi-value" style="color:#16a34a">${fmtBRL(totalEntradas)}</div></div><div class="kpi-box"><div class="kpi-label">Total Saídas</div><div class="kpi-value" style="color:#dc2626">${fmtBRL(totalSaidas)}</div></div></div><div class="section-title sec-green">📥 ENTRADAS OPERACIONAIS</div><table><thead><tr><th>Descrição</th><th></th><th style="text-align:right">Valor</th></tr></thead><tbody>${entradasRows}<tr class="total-row"><td>Total Entradas</td><td></td><td style="text-align:right;color:#16a34a">${fmtBRL(totalEntradas)}</td></tr></tbody></table><div class="section-title sec-red">📤 SAÍDAS OPERACIONAIS</div><table><thead><tr><th>Descrição</th><th></th><th style="text-align:right">Valor</th></tr></thead><tbody>${saidasRows}<tr class="total-row"><td>Total Saídas</td><td></td><td style="text-align:right;color:#dc2626">${fmtBRL(totalSaidas)}</td></tr></tbody></table><table><tbody><tr class="result-row"><td>💰 SALDO OPERACIONAL DO PERÍODO</td><td></td><td style="text-align:right;color:${saldo >= 0 ? '#4ade80' : '#f87171'};font-size:15px">${saldo >= 0 ? '+' : ''}${fmtBRL(saldo)}</td></tr></tbody></table><div class="section-title sec-blue" style="margin-top:16px">📅 EVOLUÇÃO DIÁRIA DO SALDO (simulação)</div><div class="daily-table"><table><thead><tr><th style="text-align:center">Dia</th><th style="text-align:right">Movimento Líquido</th><th style="text-align:right">Saldo Acumulado</th></tr></thead><tbody>${dailyRows}</tbody></table></div><div style="margin-top:12px;font-size:9px;color:#94a3b8;text-align:center">Dados simulados para demonstração. Integre com o banco de dados SGA para valores reais.</div></div></body></html>`;
}

function exportFluxoReport({ filters, clientName }) {
  const html = buildFluxoReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr' + 'ipt></body>'));
  w.document.close();
}

const FluxoFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => (
  <div className="modal-overlay control-print-overlay" onClick={onClose}>
    <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
      <div className="control-print-header">
        <div className="control-print-title">
          <span className="control-print-icon"><Wallet size={25} /></span>
          <h3>FILTROS — FLUXO DE CAIXA OPERACIONAL</h3>
        </div>
        <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
          <X size={28} />
        </button>
      </div>
      <div className="control-print-body">
        <div className="control-print-grid ranking-filter-grid">
          <section className="control-print-section">
            <div className="control-print-section-title">
              <BarChart2 size={20} /><span>CONTA CONTÁBIL</span>
            </div>
            <label className={`control-print-option ${filters.conta==='Todas' ? 'selected' : ''}`}>
              <Wallet size={28} />
              <div><strong>TODAS</strong><span>Entradas e Saídas</span></div>
              <input type="radio" name="fluxoConta" value="Todas" checked={filters.conta==='Todas'}
                onChange={() => setFilters(f => ({...f, conta:'Todas'}))} />
            </label>
            <label className={`control-print-option ${filters.conta==='Entradas' ? 'selected' : ''}`}>
              <TrendingUp size={28} />
              <div><strong>ENTRADAS</strong><span>Recebimentos</span></div>
              <input type="radio" name="fluxoConta" value="Entradas" checked={filters.conta==='Entradas'}
                onChange={() => setFilters(f => ({...f, conta:'Entradas'}))} />
            </label>
            <label className={`control-print-option ${filters.conta==='Saídas' ? 'selected' : ''}`}>
              <TrendingDown size={28} />
              <div><strong>SAÍDAS</strong><span>Pagamentos</span></div>
              <input type="radio" name="fluxoConta" value="Saídas" checked={filters.conta==='Saídas'}
                onChange={() => setFilters(f => ({...f, conta:'Saídas'}))} />
            </label>
          </section>
          <section className="control-print-section">
            <div className="control-print-section-title">
              <Calendar size={20} /><span>PERÍODO</span>
            </div>
            <div className="control-print-date-row">
              <label className="control-print-field">
                <span>DATA INICIAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataInicial}
                    onChange={e => setFilters(f => ({...f, dataInicial:e.target.value}))} />
                  <Calendar size={19} />
                </div>
              </label>
              <label className="control-print-field">
                <span>DATA FINAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataFinal}
                    onChange={e => setFilters(f => ({...f, dataFinal:e.target.value}))} />
                  <Calendar size={19} />
                </div>
              </label>
            </div>
          </section>
        </div>
        <div className="control-print-section" style={{background:'#23272f',borderRadius:6,padding:'10px 14px'}}>
          <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>Pré-visualização</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'#94a3b8'}}>Total Entradas</div>
              <div style={{fontSize:18,fontWeight:700,color:'#4ade80'}}>R$ 825.700</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'#94a3b8'}}>Saldo Operacional</div>
              <div style={{fontSize:18,fontWeight:700,color:'#4ade80'}}>+R$ 165.800</div>
            </div>
          </div>
        </div>
      </div>
      <div className="control-print-footer">
        <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
          <Printer size={15}/> GERAR IMPRESSÃO
        </button>
      </div>
    </div>
  </div>
);
// ── fim Fluxo de Caixa Operacional ───────────────────────────────────────────

// ── REL 7 — Giro de Estoque e Curva ABC ──────────────────────────────────────
const _ESTOQUE_BASE = [
  { produto: 'Diesel S10',         unidade: 'Pista', saldoAtual: 18000, mediaDia: 4500, custoUnitario: 6.59, faturamento: 296550 },
  { produto: 'Gasolina Comum',     unidade: 'Pista', saldoAtual: 9600,  mediaDia: 3200, custoUnitario: 5.89, faturamento: 196000 },
  { produto: 'Gasolina Aditivada', unidade: 'Pista', saldoAtual: 1200,  mediaDia: 1800, custoUnitario: 6.19, faturamento: 111420 },
  { produto: 'Etanol Hidratado',   unidade: 'Pista', saldoAtual: 6300,  mediaDia: 2100, custoUnitario: 3.89, faturamento: 81690 },
  { produto: 'Diesel S500',        unidade: 'Pista', saldoAtual: 2400,  mediaDia: 1200, custoUnitario: 6.29, faturamento: 75480 },
  { produto: 'Lubrificante 1L',    unidade: 'Loja',  saldoAtual: 24,    mediaDia: 8,    custoUnitario: 28.90, faturamento: 23120 },
  { produto: 'Café 50ml',          unidade: 'Loja',  saldoAtual: 120,   mediaDia: 40,   custoUnitario: 0.80,  faturamento: 3200 },
  { produto: 'Refrigerante 350ml', unidade: 'Loja',  saldoAtual: 54,    mediaDia: 18,   custoUnitario: 2.50,  faturamento: 4500 },
  { produto: 'Água Mineral 500ml', unidade: 'Loja',  saldoAtual: 20,    mediaDia: 25,   custoUnitario: 1.20,  faturamento: 3000 },
  { produto: 'Salgadinho 50g',     unidade: 'Loja',  saldoAtual: 24,    mediaDia: 12,   custoUnitario: 1.80,  faturamento: 2160 },
  { produto: 'Óleo Motor 5W30',    unidade: 'Loja',  saldoAtual: 45,    mediaDia: 1,    custoUnitario: 45.00, faturamento: 675 },
  { produto: 'Aditivo Radiador',   unidade: 'Loja',  saldoAtual: 48,    mediaDia: 0.5,  custoUnitario: 22.00, faturamento: 176 },
  { produto: 'Pano de Microfibra', unidade: 'Loja',  saldoAtual: 24,    mediaDia: 0.3,  custoUnitario: 8.90,  faturamento: 107 },
  { produto: 'Aromatizador Auto',  unidade: 'Loja',  saldoAtual: 18,    mediaDia: 0.2,  custoUnitario: 15.90, faturamento: 95 },
  { produto: 'Limpador Parabrisa', unidade: 'Loja',  saldoAtual: 6,     mediaDia: 0.1,  custoUnitario: 12.00, faturamento: 72 },
];

function _computeEstoqueRows({ unidade, classificacao }) {
  const sorted = [..._ESTOQUE_BASE].sort((a, b) => b.faturamento - a.faturamento);
  const totalFat = sorted.reduce((s, r) => s + r.faturamento, 0);
  let cum = 0;
  const abcMap = {};
  sorted.forEach(r => {
    cum += r.faturamento;
    abcMap[r.produto] = (cum / totalFat) <= 0.80 ? 'A' : (cum / totalFat) <= 0.95 ? 'B' : 'C';
  });
  return _ESTOQUE_BASE
    .map(r => {
      const diasGiro = r.mediaDia > 0 ? r.saldoAtual / r.mediaDia : 9999;
      const morto = diasGiro > 60;
      const status = morto ? 'Morto' : r.saldoAtual <= r.mediaDia ? 'Crítico' : r.saldoAtual <= 2 * r.mediaDia ? 'Mínimo' : 'Normal';
      return { ...r, diasGiro, status, abc: abcMap[r.produto] };
    })
    .filter(r => unidade === 'Todos' || r.unidade === unidade)
    .filter(r => classificacao === 'Todos' || r.abc === classificacao)
    .sort((a, b) => a.diasGiro - b.diasGiro);
}

function buildEstoqueReportHtml({ filters, clientName }) {
  const { unidade, classificacao } = filters;
  const rows = _computeEstoqueRows({ unidade, classificacao });
  const abcColor = { A:'#166534', B:'#1e40af', C:'#7c3aed' };
  const abcBg    = { A:'#dcfce7', B:'#dbeafe', C:'#ede9fe' };
  const stColor  = { Crítico:'#dc2626', Mínimo:'#d97706', Normal:'#16a34a', Morto:'#94a3b8' };
  const stBg     = { Crítico:'#fee2e2', Mínimo:'#fef3c7', Normal:'#f0fdf4', Morto:'#f1f5f9' };
  const tableRows = rows.map(r => {
    const isMorto = r.status === 'Morto';
    const rs = isMorto ? 'background:#f8fafc;color:#94a3b8' : '';
    return `<tr style="${rs}"><td>${r.produto}</td><td style="text-align:center">${r.unidade}</td><td style="text-align:center"><span style="background:${abcBg[r.abc]};color:${abcColor[r.abc]};padding:2px 8px;border-radius:10px;font-weight:700;font-size:10px">${r.abc}</span></td><td style="text-align:right">${r.saldoAtual.toLocaleString('pt-BR')}</td><td style="text-align:right">${r.mediaDia.toLocaleString('pt-BR',{maximumFractionDigits:1})}</td><td style="text-align:right;font-weight:700">${r.diasGiro > 999 ? '∞' : r.diasGiro.toFixed(1)}</td><td style="text-align:center"><span style="background:${stBg[r.status]};color:${stColor[r.status]};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600">${r.status}</span></td><td style="text-align:right">R$ ${r.custoUnitario.toFixed(2)}</td><td style="text-align:right">R$ ${r.faturamento.toLocaleString('pt-BR')}</td></tr>`;
  }).join('');
  const criticos = rows.filter(r => r.status === 'Crítico').length;
  const minimos  = rows.filter(r => r.status === 'Mínimo').length;
  const mortos   = rows.filter(r => r.status === 'Morto').length;
  const normais  = rows.filter(r => r.status === 'Normal').length;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>REL 7 — Giro de Estoque e Curva ABC</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;color:#1e293b;font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color-scheme:light only}@page{size:A4 landscape;margin:10mm}@media screen{body{background:#f3f4f6;padding:18px}.page{box-shadow:0 18px 50px rgba(15,23,42,.12);background:#fff}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact!important;color-scheme:light!important}th{background:#e31e24!important;color:#fff!important}.header{break-inside:avoid;page-break-inside:avoid}.kpis{break-inside:avoid;page-break-inside:avoid}}.page{max-width:1280px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border:1px solid #e5e7eb;border-bottom:3px solid #e31e24;border-radius:8px}.report-title{font-size:16px;font-weight:700}.report-sub{font-size:9px;color:#64748b;margin-top:2px}.kpis{display:flex;gap:12px;margin-bottom:14px}.kpi{background:#f9fafb;border-radius:8px;padding:9px 11px;border:1px solid #e5e7eb;flex:1;text-align:center}.kpi-label{font-size:8px;color:#667085;font-weight:800;margin-bottom:4px}.kpi-value{font-size:15px;font-weight:900;color:#111827}table{width:100%;border-collapse:collapse}th{background:#e31e24!important;color:#fff;padding:5px 8px;text-align:left;font-size:8.5px;font-weight:700;white-space:nowrap}td{padding:4px 8px;border:1px solid #d0d5dd;font-size:10px}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid}.legend{display:flex;gap:16px;margin-top:10px;font-size:9px;color:#64748b}.legend-item{display:flex;align-items:center;gap:4px}.legend-dot{width:10px;height:10px;border-radius:50%}</style></head><body><div class="page"><div class="header"><div><div class="report-title">REL 7 — Giro de Estoque e Curva ABC</div><div class="report-sub">${clientName || 'Empresa'} &nbsp;|&nbsp; Unidade: ${unidade} &nbsp;|&nbsp; Curva ABC: ${classificacao}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><img src="/logo-starvl.png" alt="STARVL" style="width:80px;height:auto;object-fit:contain"/><span style="font-size:9px;color:#64748b">Gerado em ${new Date().toLocaleDateString('pt-BR')}<br/>${rows.length} produto(s)</span></div></div><div class="kpis"><div class="kpi"><div class="kpi-label">Crítico (≤1 dia)</div><div class="kpi-value" style="color:#dc2626">${criticos}</div></div><div class="kpi"><div class="kpi-label">Mínimo (≤2 dias)</div><div class="kpi-value" style="color:#d97706">${minimos}</div></div><div class="kpi"><div class="kpi-label">Normal</div><div class="kpi-value" style="color:#16a34a">${normais}</div></div><div class="kpi"><div class="kpi-label">Estoque Morto (>60d)</div><div class="kpi-value" style="color:#94a3b8">${mortos}</div></div></div><table><thead><tr><th>Produto</th><th style="text-align:center">Unidade</th><th style="text-align:center">ABC</th><th style="text-align:right">Saldo Atual</th><th style="text-align:right">Média/Dia</th><th style="text-align:right">Dias Giro</th><th style="text-align:center">Status</th><th style="text-align:right">Custo Unit.</th><th style="text-align:right">Faturamento</th></tr></thead><tbody>${tableRows}</tbody></table><div class="legend"><div class="legend-item"><div class="legend-dot" style="background:#dcfce7;border:1px solid #166534"></div>Curva A — 80% faturamento</div><div class="legend-item"><div class="legend-dot" style="background:#dbeafe;border:1px solid #1e40af"></div>Curva B — 80–95%</div><div class="legend-item"><div class="legend-dot" style="background:#ede9fe;border:1px solid #7c3aed"></div>Curva C — restante</div><div class="legend-item"><div class="legend-dot" style="background:#f8fafc;border:1px solid #94a3b8"></div>Estoque Morto (giro>60d)</div><div style="margin-left:auto;font-size:9px;color:#94a3b8">Dados simulados — conecte ao SGA para valores reais</div></div></div></body></html>`;
}

function exportEstoqueReport({ filters, clientName }) {
  const html = buildEstoqueReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr' + 'ipt></body>'));
  w.document.close();
}

const EstoqueFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const rows = _computeEstoqueRows({ unidade: filters.unidade, classificacao: filters.classificacao });
  const criticos = rows.filter(r => r.status === 'Crítico').length;
  const mortos   = rows.filter(r => r.status === 'Morto').length;
  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Package size={25} /></span>
            <h3>FILTROS — GIRO DE ESTOQUE E CURVA ABC</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>
        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Layers size={20} /><span>UNIDADE</span>
              </div>
              {[
                {v:'Todos', icon:<Layers size={28}/>,   sub:'Todas as unidades'},
                {v:'Loja',  icon:<Building size={28}/>, sub:'Área interna'},
                {v:'Pista', icon:<Droplet size={28}/>,  sub:'Combustíveis'},
              ].map(({v, icon, sub}) => (
                <label key={v} className={`control-print-option ${filters.unidade===v ? 'selected' : ''}`}>
                  {icon}
                  <div><strong>{v.toUpperCase()}</strong><span>{sub}</span></div>
                  <input type="radio" name="estoqueUnidade" value={v} checked={filters.unidade===v}
                    onChange={() => setFilters(f => ({...f, unidade:v}))} />
                </label>
              ))}
            </section>
            <section className="control-print-section">
              <div className="control-print-section-title">
                <BarChart2 size={20} /><span>CURVA ABC</span>
              </div>
              {[
                {v:'Todos', icon:<Layers size={28}/>,    sub:'Todas as classes'},
                {v:'A',     icon:<Trophy size={28}/>,    sub:'Alta rotatividade'},
                {v:'B',     icon:<BarChart2 size={28}/>, sub:'Média rotatividade'},
                {v:'C',     icon:<Tag size={28}/>,       sub:'Baixa rotatividade'},
              ].map(({v, icon, sub}) => (
                <label key={v} className={`control-print-option ${filters.classificacao===v ? 'selected' : ''}`}>
                  {icon}
                  <div><strong>{v==='Todos'?'TODOS':`CURVA ${v}`}</strong><span>{sub}</span></div>
                  <input type="radio" name="estoqueABC" value={v} checked={filters.classificacao===v}
                    onChange={() => setFilters(f => ({...f, classificacao:v}))} />
                </label>
              ))}
            </section>
          </div>
          <div className="control-print-section" style={{background:'#23272f',borderRadius:6,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>Pré-visualização — {rows.length} produto(s)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#ef4444'}}>⚠ Críticos</div>
                <div style={{fontSize:20,fontWeight:700,color:'#ef4444'}}>{criticos}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#94a3b8'}}>Estoque Morto</div>
                <div style={{fontSize:20,fontWeight:700,color:'#94a3b8'}}>{mortos}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={15}/> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Giro de Estoque e Curva ABC ──────────────────────────────────────────

// ── REL 8 — Fluxo de Clientes e Ticket Médio ─────────────────────────────────
const _CLIENTES_SLOTS = ['06h-08h','08h-10h','10h-12h','12h-14h','14h-16h','16h-18h','18h-20h','20h-22h','22h-00h'];
const _CLIENTES_DIAS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const _CLIENTES_BASE_DATA = {
  '06h-08h':{Seg:{q:12,t:85},Ter:{q:14,t:78},Qua:{q:11,t:92},Qui:{q:13,t:88},Sex:{q:16,t:95},Sáb:{q:22,t:105},Dom:{q:18,t:98}},
  '08h-10h':{Seg:{q:45,t:112},Ter:{q:48,t:118},Qua:{q:42,t:108},Qui:{q:50,t:122},Sex:{q:55,t:128},Sáb:{q:38,t:115},Dom:{q:28,t:102}},
  '10h-12h':{Seg:{q:38,t:98},Ter:{q:35,t:94},Qua:{q:40,t:102},Qui:{q:36,t:96},Sex:{q:42,t:108},Sáb:{q:32,t:88},Dom:{q:25,t:82}},
  '12h-14h':{Seg:{q:52,t:145},Ter:{q:55,t:152},Qua:{q:48,t:138},Qui:{q:58,t:158},Sex:{q:62,t:162},Sáb:{q:35,t:118},Dom:{q:22,t:95}},
  '14h-16h':{Seg:{q:28,t:88},Ter:{q:30,t:92},Qua:{q:26,t:85},Qui:{q:32,t:95},Sex:{q:35,t:102},Sáb:{q:28,t:88},Dom:{q:18,t:75}},
  '16h-18h':{Seg:{q:42,t:105},Ter:{q:45,t:112},Qua:{q:40,t:98},Qui:{q:48,t:118},Sex:{q:52,t:125},Sáb:{q:30,t:92},Dom:{q:20,t:78}},
  '18h-20h':{Seg:{q:68,t:138},Ter:{q:72,t:145},Qua:{q:65,t:132},Qui:{q:75,t:148},Sex:{q:82,t:158},Sáb:{q:48,t:122},Dom:{q:32,t:108}},
  '20h-22h':{Seg:{q:35,t:95},Ter:{q:38,t:98},Qua:{q:32,t:88},Qui:{q:40,t:102},Sex:{q:45,t:112},Sáb:{q:38,t:105},Dom:{q:25,t:88}},
  '22h-00h':{Seg:{q:8,t:72},Ter:{q:10,t:75},Qua:{q:7,t:68},Qui:{q:9,t:72},Sex:{q:12,t:82},Sáb:{q:15,t:88},Dom:{q:10,t:75}},
};
const _CLIENTES_EXCLUIDAS = 32;

function _getDiasList(dia) {
  if (dia === 'Dias Úteis') return ['Seg','Ter','Qua','Qui','Sex'];
  if (dia === 'FDS') return ['Sáb','Dom'];
  if (dia === 'Todos') return _CLIENTES_DIAS;
  return [dia];
}

function buildClientesReportHtml({ filters, clientName }) {
  const { faixa, dia } = filters;
  const diasShow  = _getDiasList(dia);
  const slotsShow = faixa === 'Todas' ? _CLIENTES_SLOTS : [faixa];
  let allQtds = [];
  slotsShow.forEach(slot => diasShow.forEach(d => { const c = _CLIENTES_BASE_DATA[slot]?.[d]; if (c) allQtds.push(c.q); }));
  const maxQ = Math.max(...allQtds, 1);
  const minQ = Math.min(...allQtds, 0);
  function heatColor(q) {
    const pct = (q - minQ) / (maxQ - minQ || 1);
    const r = Math.round(219 + (255-219)*pct), g = Math.round(234 - (234-127)*pct), b = Math.round(254 - (254-14)*pct);
    return `rgb(${r},${g},${b})`;
  }
  const headerCells = diasShow.map(d => `<th style="text-align:center;min-width:58px">${d}</th>`).join('');
  const dataRows = slotsShow.map(slot => {
    let slotTotal=0, slotTicketSum=0, slotCount=0;
    const cells = diasShow.map(d => {
      const c = _CLIENTES_BASE_DATA[slot]?.[d];
      if (!c) return `<td style="text-align:center;color:#94a3b8">—</td>`;
      slotTotal += c.q; slotTicketSum += c.t; slotCount++;
      const bg = heatColor(c.q);
      const fg = c.q > maxQ*0.6 ? '#fff' : '#1e293b';
      return `<td style="text-align:center;background:${bg};color:${fg}"><div style="font-weight:700;font-size:11px">${c.q}</div><div style="font-size:9px">R$${c.t}</div></td>`;
    }).join('');
    const avgT = slotCount > 0 ? Math.round(slotTicketSum/slotCount) : 0;
    return `<tr><td style="font-weight:600;white-space:nowrap;background:#f8fafc">${slot}</td>${cells}<td style="text-align:center;background:#f1f5f9;font-weight:700">${slotTotal}</td><td style="text-align:center;background:#f1f5f9;color:#1e40af">R$${avgT}</td></tr>`;
  }).join('');
  const dayTotals = diasShow.map(d => {
    const tot = slotsShow.reduce((s,slot)=>s+((_CLIENTES_BASE_DATA[slot]?.[d]?.q)||0),0);
    return `<td style="text-align:center;font-weight:700;background:#f1f5f9">${tot}</td>`;
  }).join('');
  const grandTotal = slotsShow.reduce((s,slot)=>s+diasShow.reduce((ss,d)=>ss+((_CLIENTES_BASE_DATA[slot]?.[d]?.q)||0),0),0);
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>REL 8 — Fluxo de Clientes e Ticket Médio</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;color:#1e293b;font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color-scheme:light only}@page{size:A4 landscape;margin:10mm}@media screen{body{background:#f3f4f6;padding:18px}.page{box-shadow:0 18px 50px rgba(15,23,42,.12);background:#fff}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact!important;color-scheme:light!important}th{background:#e31e24!important;color:#fff!important}.header{break-inside:avoid;page-break-inside:avoid}.kpis{break-inside:avoid;page-break-inside:avoid}}.page{max-width:1280px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border:1px solid #e5e7eb;border-bottom:3px solid #e31e24;border-radius:8px}.report-title{font-size:16px;font-weight:700}.report-sub{font-size:9px;color:#64748b;margin-top:2px}table{width:100%;border-collapse:collapse;margin-bottom:10px}th{background:#e31e24!important;color:#fff;padding:5px 8px;text-align:left;font-size:8.5px;font-weight:700}td{padding:4px 6px;border:1px solid #d0d5dd;font-size:10px}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid}.kpis{display:flex;gap:10px;margin-bottom:12px}.kpi{background:#f9fafb;border-radius:8px;padding:9px 11px;border:1px solid #e5e7eb;flex:1;text-align:center}.kpi-label{font-size:8px;color:#667085;font-weight:800}.kpi-value{font-size:16px;font-weight:900;color:#111827}</style></head><body><div class="page"><div class="header"><div><div class="report-title">REL 8 — Fluxo de Clientes e Ticket Médio</div><div class="report-sub">${clientName || 'Empresa'} &nbsp;|&nbsp; Faixa: ${faixa} &nbsp;|&nbsp; Dia: ${dia}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><img src="/logo-starvl.png" alt="STARVL" style="width:80px;height:auto;object-fit:contain"/><span style="font-size:9px;color:#64748b">Gerado em ${new Date().toLocaleDateString('pt-BR')}</span></div></div><div class="kpis"><div class="kpi"><div class="kpi-label">Total Transações</div><div class="kpi-value">${grandTotal}</div></div><div class="kpi"><div class="kpi-label">Transações Excluídas</div><div class="kpi-value" style="color:#94a3b8">${_CLIENTES_EXCLUIDAS}</div></div><div class="kpi"><div class="kpi-label">Ticket Médio Geral</div><div class="kpi-value" style="color:#1e40af">R$ 108</div></div><div class="kpi"><div class="kpi-label">Pico de Movimento</div><div class="kpi-value" style="color:#d97706;font-size:12px">18h–20h Sex</div></div></div><table><thead><tr><th>Faixa de Horário</th>${headerCells}<th style="text-align:center">Total</th><th style="text-align:center">Ticket Méd.</th></tr></thead><tbody>${dataRows}<tr style="background:#f1f5f9;font-weight:700"><td>TOTAL</td>${dayTotals}<td style="text-align:center;font-weight:700">${grandTotal}</td><td style="text-align:center;color:#1e40af">R$ 108</td></tr></tbody></table><div style="display:flex;gap:14px;align-items:center;font-size:9px;color:#64748b;margin-bottom:6px"><div style="font-weight:600">Intensidade:</div><div style="display:flex;gap:3px;align-items:center"><div style="width:12px;height:12px;background:rgb(219,234,254);border-radius:2px"></div>Baixo</div><div style="display:flex;gap:3px;align-items:center"><div style="width:12px;height:12px;background:rgb(251,191,36);border-radius:2px"></div>Médio</div><div style="display:flex;gap:3px;align-items:center"><div style="width:12px;height:12px;background:rgb(255,127,14);border-radius:2px"></div>Alto</div><div style="margin-left:auto;color:#94a3b8">Cada célula: qtd. transações / ticket médio. Excluídas: aferições, estornos e testes (${_CLIENTES_EXCLUIDAS} — ~2,5%).</div></div><div style="font-size:9px;color:#94a3b8;text-align:center">Dados simulados — integre com o banco de dados SGA para valores reais.</div></div></body></html>`;
}

function exportClientesReport({ filters, clientName }) {
  const html = buildClientesReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr' + 'ipt></body>'));
  w.document.close();
}

const ClientesFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const diasShow  = _getDiasList(filters.dia);
  const slotsShow = filters.faixa === 'Todas' ? _CLIENTES_SLOTS : [filters.faixa];
  const totalQ = slotsShow.reduce((s,slot) => s + diasShow.reduce((ss,d) => ss + ((_CLIENTES_BASE_DATA[slot]?.[d]?.q)||0), 0), 0);
  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" style={{maxWidth:520}} onClick={e => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><UsersIcon size={25} /></span>
            <h3>FILTROS — FLUXO DE CLIENTES</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>
        <div className="control-print-body">
          <section className="control-print-section">
            <div className="control-print-section-title">
              <Clock size={20} /><span>FAIXA DE HORÁRIO</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {['Todas',..._CLIENTES_SLOTS].map(s => (
                <button key={s} type="button"
                  style={{fontSize:11,padding:'5px 11px',minHeight:'auto',borderRadius:7,
                    border:`1px solid ${filters.faixa===s?'rgba(227,30,36,0.8)':'#3d4552'}`,
                    background:filters.faixa===s?'rgba(227,30,36,0.12)':'#1e2430',
                    color:filters.faixa===s?'#e31e24':'#cbd5e1',
                    fontWeight:filters.faixa===s?700:400,cursor:'pointer',transition:'all 0.2s'}}
                  onClick={() => setFilters(f => ({...f, faixa:s}))}>
                  {s}
                </button>
              ))}
            </div>
          </section>
          <section className="control-print-section">
            <div className="control-print-section-title">
              <Calendar size={20} /><span>DIA DA SEMANA</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {['Todos','Dias Úteis','FDS',..._CLIENTES_DIAS].map(d => (
                <button key={d} type="button"
                  style={{fontSize:11,padding:'5px 11px',minHeight:'auto',borderRadius:7,
                    border:`1px solid ${filters.dia===d?'rgba(227,30,36,0.8)':'#3d4552'}`,
                    background:filters.dia===d?'rgba(227,30,36,0.12)':'#1e2430',
                    color:filters.dia===d?'#e31e24':'#cbd5e1',
                    fontWeight:filters.dia===d?700:400,cursor:'pointer',transition:'all 0.2s'}}
                  onClick={() => setFilters(f => ({...f, dia:d}))}>
                  {d}
                </button>
              ))}
            </div>
          </section>
          <div className="control-print-section" style={{background:'#23272f',borderRadius:6,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>Pré-visualização</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#94a3b8'}}>Total Transações</div>
                <div style={{fontSize:20,fontWeight:700,color:'#e2e8f0'}}>{totalQ}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#94a3b8'}}>Excluídas</div>
                <div style={{fontSize:20,fontWeight:700,color:'#64748b'}}>{_CLIENTES_EXCLUIDAS}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={15}/> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Fluxo de Clientes e Ticket Médio ─────────────────────────────────────

// ── REL 9 — Painel de Auxílio em Compras ────────────────────────────────────
const _COMPRAS_BASE = [
  { data:'2026-03-03', produto:'Gasolina Comum',   fornecedor:'Ipiranga',  qtd:15000, preco:5.72 },
  { data:'2026-03-05', produto:'Etanol Hidratado', fornecedor:'Raízen',    qtd:10000, preco:3.75 },
  { data:'2026-03-08', produto:'Diesel S10',       fornecedor:'Petrobras', qtd:20000, preco:6.45 },
  { data:'2026-03-12', produto:'Gasolina Comum',   fornecedor:'Shell',     qtd:12000, preco:5.78 },
  { data:'2026-03-15', produto:'Diesel S10',       fornecedor:'Petrobras', qtd:18000, preco:6.48 },
  { data:'2026-03-19', produto:'Etanol Hidratado', fornecedor:'Raízen',    qtd:8000,  preco:3.82 },
  { data:'2026-03-22', produto:'Gasolina Comum',   fornecedor:'Ipiranga',  qtd:14000, preco:5.85 },
  { data:'2026-03-28', produto:'Diesel S10',       fornecedor:'Shell',     qtd:22000, preco:6.52 },
  { data:'2026-04-02', produto:'Gasolina Comum',   fornecedor:'Petrobras', qtd:16000, preco:5.79 },
  { data:'2026-04-05', produto:'Etanol Hidratado', fornecedor:'Ipiranga',  qtd:12000, preco:3.78 },
  { data:'2026-04-10', produto:'Diesel S10',       fornecedor:'Petrobras', qtd:20000, preco:6.55 },
  { data:'2026-04-14', produto:'Gasolina Comum',   fornecedor:'Shell',     qtd:13000, preco:5.82 },
  { data:'2026-04-18', produto:'Etanol Hidratado', fornecedor:'Raízen',    qtd:9000,  preco:3.85 },
  { data:'2026-04-23', produto:'Diesel S10',       fornecedor:'Ipiranga',  qtd:19000, preco:6.49 },
  { data:'2026-04-28', produto:'Gasolina Comum',   fornecedor:'Petrobras', qtd:15000, preco:5.88 },
  { data:'2026-05-03', produto:'Diesel S10',       fornecedor:'Shell',     qtd:21000, preco:6.58 },
  { data:'2026-05-08', produto:'Etanol Hidratado', fornecedor:'Raízen',    qtd:11000, preco:3.89 },
  { data:'2026-05-12', produto:'Gasolina Comum',   fornecedor:'Ipiranga',  qtd:16000, preco:5.95 },
  { data:'2026-05-18', produto:'Diesel S10',       fornecedor:'Petrobras', qtd:20000, preco:6.62 },
  { data:'2026-05-22', produto:'Etanol Hidratado', fornecedor:'Shell',     qtd:10000, preco:4.08 },
];

function _computeComprasRows({ fornecedor, produto, dataInicial, dataFinal }) {
  return _COMPRAS_BASE.filter(r => {
    if (fornecedor !== 'Todos' && r.fornecedor !== fornecedor) return false;
    if (produto !== 'Todos' && r.produto !== produto) return false;
    if (dataInicial && r.data < dataInicial) return false;
    if (dataFinal   && r.data > dataFinal)   return false;
    return true;
  });
}

function buildComprasReportHtml({ filters, clientName }) {
  const { fornecedor, produto, dataInicial, dataFinal } = filters;
  const rows = _computeComprasRows({ fornecedor, produto, dataInicial, dataFinal });
  const fmtDate = d => d ? d.split('-').reverse().join('/') : '-';
  const fmtBRL  = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  // Compute historical avg per product (excluding its last purchase)
  const produtos = [...new Set(_COMPRAS_BASE.map(r => r.produto))];
  const avgMap = {}, lastMap = {};
  produtos.forEach(p => {
    const pRows = _COMPRAS_BASE.filter(r => r.produto === p).sort((a,b) => a.data.localeCompare(b.data));
    lastMap[p] = pRows[pRows.length - 1];
    const prev = pRows.slice(0,-1);
    avgMap[p] = prev.length > 0 ? prev.reduce((s,r) => s + r.preco, 0) / prev.length : pRows[0].preco;
  });
  const tableRows = rows.map(r => {
    const total = r.qtd * r.preco;
    const last  = lastMap[r.produto];
    const isLast = last && last.data === r.data && last.fornecedor === r.fornecedor;
    const avg = avgMap[r.produto];
    const pctDiff = avg > 0 ? ((r.preco - avg) / avg) * 100 : 0;
    const isAlert = isLast && pctDiff > 5;
    const rowBg = isAlert ? '#fff7ed' : isLast ? '#f0fdf4' : '';
    return `<tr style="background:${rowBg}"><td>${fmtDate(r.data)}</td><td>${r.produto}</td><td>${r.fornecedor}</td><td style="text-align:right">${r.qtd.toLocaleString('pt-BR')}</td><td style="text-align:right;font-weight:600">R$ ${r.preco.toFixed(2)}</td><td style="text-align:right">R$ ${avg.toFixed(2)}</td><td style="text-align:right;color:${pctDiff>5?'#dc2626':pctDiff>0?'#d97706':'#16a34a'};font-weight:${isAlert?'700':'400'}">${pctDiff>=0?'+':''}${pctDiff.toFixed(1)}%${isAlert?' ⚠':''}</td><td style="text-align:right">${fmtBRL(total)}</td><td style="text-align:center;font-size:9px;color:#1e40af;font-weight:600">${isLast?'✓ Última':''}</td></tr>`;
  }).join('');
  const hasAlert = produtos.some(p => {
    const last = lastMap[p]; const avg = avgMap[p];
    if (!last || !avg) return false;
    const inFilter = rows.some(r => r.produto===p && r.data===last.data && r.fornecedor===last.fornecedor);
    return inFilter && ((last.preco - avg)/avg)*100 > 5;
  });
  const alertBanner = hasAlert ? `<div style="background:#fff7ed;border:1px solid #f97316;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px"><span style="font-size:16px">⚠️</span><div><div style="font-weight:700;color:#c2410c;font-size:11px">ALERTA DE PREÇO</div><div style="font-size:10px;color:#92400e">Uma ou mais últimas compras estão acima de 5% da média histórica. Negocie antes da próxima compra.</div></div></div>` : '';
  const totalGasto = rows.reduce((s,r)=>s+r.qtd*r.preco,0);
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>REL 9 — Painel de Auxílio em Compras</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;color:#1e293b;font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color-scheme:light only}@page{size:A4 landscape;margin:10mm}@media screen{body{background:#f3f4f6;padding:18px}.page{box-shadow:0 18px 50px rgba(15,23,42,.12);background:#fff}}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact!important;color-scheme:light!important}th{background:#e31e24!important;color:#fff!important}.header{break-inside:avoid;page-break-inside:avoid}.kpis{break-inside:avoid;page-break-inside:avoid}}.page{max-width:1280px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border:1px solid #e5e7eb;border-bottom:3px solid #e31e24;border-radius:8px}.report-title{font-size:16px;font-weight:700}.report-sub{font-size:9px;color:#64748b;margin-top:2px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{background:#e31e24!important;color:#fff;padding:5px 8px;text-align:left;font-size:8.5px;font-weight:700}td{padding:4px 8px;border:1px solid #d0d5dd;font-size:10px}thead{display:table-header-group}tfoot{display:table-footer-group}tr{page-break-inside:avoid;break-inside:avoid}.kpis{display:flex;gap:12px;margin-bottom:14px}.kpi{background:#f9fafb;border-radius:8px;padding:9px 11px;border:1px solid #e5e7eb;flex:1;text-align:center}.kpi-label{font-size:8px;color:#667085;font-weight:800;margin-bottom:4px}.kpi-value{font-size:14px;font-weight:900;color:#111827}</style></head><body><div class="page"><div class="header"><div><div class="report-title">REL 9 — Painel de Auxílio em Compras</div><div class="report-sub">${clientName||'Empresa'} &nbsp;|&nbsp; Fornecedor: ${fornecedor} &nbsp;|&nbsp; Produto: ${produto} &nbsp;|&nbsp; ${fmtDate(dataInicial)} – ${fmtDate(dataFinal)}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><img src="/logo-starvl.png" alt="STARVL" style="width:80px;height:auto;object-fit:contain"/><span style="font-size:9px;color:#64748b">Gerado em ${new Date().toLocaleDateString('pt-BR')}<br/>${rows.length} compra(s)</span></div></div>${alertBanner}<div class="kpis"><div class="kpi"><div class="kpi-label">Total Gasto</div><div class="kpi-value">${fmtBRL(totalGasto)}</div></div><div class="kpi"><div class="kpi-label">Compras</div><div class="kpi-value">${rows.length}</div></div><div class="kpi"><div class="kpi-label">Produtos</div><div class="kpi-value">${[...new Set(rows.map(r=>r.produto))].length}</div></div><div class="kpi"><div class="kpi-label">Fornecedores</div><div class="kpi-value">${[...new Set(rows.map(r=>r.fornecedor))].length}</div></div></div><table><thead><tr><th>Data</th><th>Produto</th><th>Fornecedor</th><th style="text-align:right">Qtd (L)</th><th style="text-align:right">Preço Unit.</th><th style="text-align:right">Méd. Hist.</th><th style="text-align:right">Δ vs Méd.</th><th style="text-align:right">Total</th><th style="text-align:center">Ref.</th></tr></thead><tbody>${tableRows}</tbody></table><div style="display:flex;gap:12px;font-size:9px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;background:#fff7ed;border:1px solid #f97316;border-radius:2px"></div>Alerta: última compra >5% acima da média</div><div style="display:flex;align-items:center;gap:4px"><div style="width:12px;height:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:2px"></div>Última compra do produto</div><div style="margin-left:auto;color:#94a3b8">Média histórica calculada excluindo a última compra de cada produto.</div></div><div style="font-size:9px;color:#94a3b8;text-align:center">Dados simulados — integre com o banco de dados SGA para valores reais.</div></div></body></html>`;
}

function exportComprasReport({ filters, clientName }) {
  const html = buildComprasReportHtml({ filters, clientName });
  if (!html) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Permita pop-ups no navegador para imprimir o relatório.', 'warn'); return; }
  w.document.open();
  w.document.write(html.replace('</body>', '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr' + 'ipt></body>'));
  w.document.close();
}

const ComprasFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const rows = _computeComprasRows({ fornecedor: filters.fornecedor, produto: filters.produto, dataInicial: filters.dataInicial, dataFinal: filters.dataFinal });
  const totalGasto = rows.reduce((s,r) => s + r.qtd * r.preco, 0);
  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><CircleDollarSign size={25} /></span>
            <h3>FILTROS — PAINEL DE COMPRAS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>
        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Building2 size={20} /><span>FORNECEDOR</span>
              </div>
              {['Todos','Ipiranga','Petrobras','Raízen','Shell'].map(v => (
                <label key={v} className={`control-print-option ${filters.fornecedor===v ? 'selected' : ''}`}>
                  <Building size={28} />
                  <div><strong>{v.toUpperCase()}</strong><span>{v==='Todos'?'Todos os fornecedores':v}</span></div>
                  <input type="radio" name="comprasFornecedor" value={v} checked={filters.fornecedor===v}
                    onChange={() => setFilters(f => ({...f, fornecedor:v}))} />
                </label>
              ))}
            </section>
            <section className="control-print-section">
              <div className="control-print-section-title">
                <Package size={20} /><span>PRODUTO</span>
              </div>
              {['Todos','Gasolina Comum','Etanol Hidratado','Diesel S10'].map(v => (
                <label key={v} className={`control-print-option ${filters.produto===v ? 'selected' : ''}`}>
                  <Droplet size={28} />
                  <div><strong>{v.toUpperCase()}</strong><span>{v==='Todos'?'Todos os produtos':v}</span></div>
                  <input type="radio" name="comprasProduto" value={v} checked={filters.produto===v}
                    onChange={() => setFilters(f => ({...f, produto:v}))} />
                </label>
              ))}
            </section>
          </div>
          <section className="control-print-section">
            <div className="control-print-section-title">
              <Calendar size={20} /><span>PERÍODO</span>
            </div>
            <div className="control-print-date-row">
              <label className="control-print-field">
                <span>DATA INICIAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataInicial}
                    onChange={e => setFilters(f => ({...f, dataInicial:e.target.value}))} />
                  <Calendar size={19} />
                </div>
              </label>
              <label className="control-print-field">
                <span>DATA FINAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataFinal}
                    onChange={e => setFilters(f => ({...f, dataFinal:e.target.value}))} />
                  <Calendar size={19} />
                </div>
              </label>
            </div>
          </section>
          <div className="control-print-section" style={{background:'#23272f',borderRadius:6,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>Pré-visualização — {rows.length} compra(s)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#94a3b8'}}>Total Gasto</div>
                <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{totalGasto.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'#94a3b8'}}>Produtos</div>
                <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{[...new Set(rows.map(r=>r.produto))].length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
            <Printer size={15}/> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};
// ── fim Painel de Auxílio em Compras ─────────────────────────────────────────

// ── Compras — Print HTML builder ─────────────────────────────────────────────
function buildComprasPrintHtml({ secao, subTab, rows, periodo, empresa }) {
  const geradoEm  = new Date().toLocaleString('pt-BR');
  const mm        = periodo ? periodo.slice(0,2) : '??';
  const yyyy      = periodo ? periodo.slice(2,6) : '????';
  const periodoFmt = `${mm}/${yyyy}`;
  const totalQtd  = rows.reduce((s,r) => s + (r.qtd   || 0), 0);
  const totalVal  = rows.reduce((s,r) => s + (r.total || 0), 0);

  const isCombust   = secao === 'combustiveis';
  const is110       = subTab === 'comNota';
  const titulo      = isCombust
    ? (is110 ? 'COMPRAS DE COMBUSTÍVEIS — 110 (NF-e)'  : 'COMPRAS DE COMBUSTÍVEIS — 220 (PEDIDOS)')
    : 'COMPRAS DE PRODUTOS — NF-e ENTRADA';

  const mkHead = () => isCombust
    ? (is110
        ? `<tr><th>DATA</th><th>FORNECEDOR</th><th>COMBUSTÍVEL</th><th class="num">LITROS</th><th class="num">UNIT.</th><th class="num">TOTAL</th><th>DOCUMENTO</th></tr>`
        : `<tr><th>DATA</th><th>FORNECEDOR</th><th>COMBUSTÍVEL</th><th class="num">LITROS</th><th class="num">UNIT.</th><th class="num">TOTAL</th><th>PEDIDO</th></tr>`)
    : `<tr><th>DATA</th><th>FORNECEDOR</th><th>PRODUTO</th><th class="num">QTD</th><th class="num">UNIT.</th><th class="num">TOTAL</th><th>DOCUMENTO</th></tr>`;

  const fmtV = (v, dec = 2) => Number(v||0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const cnpjFmt = v => { if (!v) return ''; const d = String(v).replace(/\D/g,''); if (d.length===14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'); return v; };

  const mkRows = () => rows.map(r => {
    const fornCell = `<td>${r.fornecedor||'—'}${cnpjFmt(r.cnpj) ? `<br/><small style="color:#777">${cnpjFmt(r.cnpj)}</small>` : ''}</td>`;
    if (isCombust && is110) {
      return `<tr><td>${fmtDate(r.data)}</td>${fornCell}<td class="fuel">${r.combustivel||'—'}</td><td class="num">${fmtV(r.qtd,3)}</td><td class="num">R$ ${fmtV(r.unitario)}</td><td class="num bold">R$ ${fmtV(r.total)}</td><td class="doc">${r.documento||'—'}</td></tr>`;
    } else if (isCombust) {
      return `<tr><td>${fmtDate(r.data)}</td>${fornCell}<td class="fuel">${r.combustivel||'—'}</td><td class="num">${fmtV(r.qtd,3)}</td><td class="num">R$ ${fmtV(r.unitario)}</td><td class="num bold">R$ ${fmtV(r.total)}</td><td class="doc">${r.pedido!=null?'#'+r.pedido:'—'}</td></tr>`;
    } else {
      return `<tr><td>${fmtDate(r.data)}</td>${fornCell}<td>${r.produto||'—'}</td><td class="num">${fmtV(r.qtd,3)}</td><td class="num">R$ ${fmtV(r.unitario)}</td><td class="num bold">R$ ${fmtV(r.total)}</td><td class="doc">${r.documento||'—'}</td></tr>`;
    }
  }).join('');

  const unitLabel = isCombust ? 'Litros' : 'Unid.';

  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>${titulo} — ${periodoFmt}</title>
<style>
  @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;font-size:10px}
  .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:2px solid #e31e24;padding-bottom:8px}
  h1{margin:0 0 2px;font-size:15px;font-weight:800}
  .sub{color:#555;font-size:9px}
  img.logo{width:90px;height:auto;object-fit:contain}
  .meta{display:flex;justify-content:space-between;margin-bottom:8px;color:#666;font-size:8.5px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#e31e24;color:#fff}
  thead th{padding:5px 6px;text-align:left;font-size:9px;font-weight:700;letter-spacing:.04em}
  thead th.num{text-align:right}
  tbody tr:nth-child(even){background:#f9f9f9}
  tbody td{padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top;font-size:9.5px}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700}
  td.fuel{font-weight:600}
  td.doc{font-size:8.5px;color:#555;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .total-row td{font-weight:800;font-size:10px;background:#f3f4f6;border-top:2px solid #ddd}
  .footer{border-top:2px solid #e31e24;padding-top:6px;text-align:right;margin-top:10px;font-size:8px;color:#777}
  @media screen{body{background:#e5e7eb;padding:20px}table{max-width:100%;margin:0 auto;background:#fff;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,.1)}}
</style></head><body>
<header class="hd">
  <div><h1>${titulo}</h1><div class="sub">Empresa: ${empresa} &nbsp;|&nbsp; Período: ${periodoFmt}</div></div>
  <img class="logo" src="/logo-starvl.png" alt="STARVL"/>
</header>
<div class="meta"><span>${rows.length} registro(s)</span><span>Gerado em ${geradoEm}</span></div>
<table>
  <thead>${mkHead()}</thead>
  <tbody>
    ${mkRows()}
    <tr class="total-row">
      <td colspan="3">TOTAL</td>
      <td class="num">${fmtV(totalQtd,3)} ${unitLabel}</td>
      <td></td>
      <td class="num">R$ ${fmtV(totalVal)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div class="footer">STARVL &nbsp;|&nbsp; ${titulo} &nbsp;|&nbsp; ${periodoFmt}</div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script>
</body></html>`;
}

// ── Compras — Painel de Impressão ─────────────────────────────────────────────
const ComprasPrintPanel = ({ secao, combustSubTab, dataCombust, dataProd, periodo, empresa, onClose }) => {
  const [printSecao,  setPrintSecao]  = useState(secao);
  const [printSubTab, setPrintSubTab] = useState(combustSubTab);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const getRows = () => {
    if (printSecao === 'combustiveis') {
      const d = dataCombust;
      if (!d) return [];
      return printSubTab === 'comNota' ? (d.comNota || []) : (d.semNota || []);
    } else {
      const d = dataProd;
      if (!d) return d?.notas || [];
      return d.notas || [];
    }
  };

  const handleGenerate = () => {
    const rows = getRows();
    const html = buildComprasPrintHtml({ secao: printSecao, subTab: printSubTab, rows, periodo, empresa });
    const win = window.open('', '_blank');
    if (!win) { alert('Permita pop-ups no navegador para gerar o relatório.'); return; }
    win.document.write(html);
    win.document.close();
    onClose();
  };

  const secaoOpts  = [{ k:'combustiveis', l:'Combustíveis', icon:'⛽' }, { k:'produtos', l:'Produtos', icon:'🛒' }];
  const subTabOpts = [{ k:'comNota', l:'Combustíveis 110 (NF-e)' }, { k:'semNota', l:'Combustíveis 220 (Pedidos)' }];

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Printer size={22}/></span>
            <h3>IMPRIMIR COMPRAS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose}><X size={26}/></button>
        </div>

        <div className="control-print-body">
          <section className="control-print-section">
            <div className="control-print-section-title"><ShoppingCart size={18}/><span>SEÇÃO</span></div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {secaoOpts.map(o => (
                <label key={o.k} className={`ranking-seller-check${printSecao===o.k?' selected':''}`} style={{ cursor:'pointer', userSelect:'none' }}>
                  <input type="radio" name="printSecao" value={o.k} checked={printSecao===o.k} onChange={() => setPrintSecao(o.k)} style={{ display:'none' }}/>
                  <span>{o.icon} {o.l}</span>
                </label>
              ))}
            </div>
          </section>

          {printSecao === 'combustiveis' && (
            <section className="control-print-section">
              <div className="control-print-section-title"><Droplet size={18}/><span>TIPO</span></div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {subTabOpts.map(o => (
                  <label key={o.k} className={`ranking-seller-check${printSubTab===o.k?' selected':''}`} style={{ cursor:'pointer', userSelect:'none' }}>
                    <input type="radio" name="printSubTab" value={o.k} checked={printSubTab===o.k} onChange={() => setPrintSubTab(o.k)} style={{ display:'none' }}/>
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="control-print-section">
            <div className="control-print-section-title"><FileText size={18}/><span>RESUMO</span></div>
            <p style={{ margin:0, fontSize:'12px', color:'#888' }}>
              {(() => {
                const rows = getRows();
                const total = rows.reduce((s,r) => s+r.total, 0);
                return `${rows.length} registro(s) — R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
              })()}
            </p>
          </section>
        </div>

        <div className="control-print-footer">
          <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}><X size={18}/> CANCELAR</button>
          <button type="button" className="btn-primary control-print-generate" onClick={handleGenerate}>
            <Printer size={18}/> GERAR IMPRESSÃO
          </button>
        </div>
      </div>
    </div>
  );
};

// ── ComprasPage ───────────────────────────────────────────────────────────────
const ComprasPage = ({ selectedClient, clients }) => {
  const [secao, setSecao]           = useState('combustiveis'); // 'combustiveis' | 'produtos'
  const [periodo, setPeriodo]       = useState(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2,'0') + String(now.getFullYear());
  });
  const [combustSubTab, setCombustSubTab] = useState('comNota');
  const [dataCombust,   setDataCombust]   = useState(null);
  const [dataProd,      setDataProd]      = useState(null);
  const [loading,       setLoading]       = useState({});
  const [error,         setError]         = useState({});
  const [showPrintPanel, setShowPrintPanel] = useState(false);

  const empresa = useMemo(() => {
    const c = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    return c ? c.codigoEmpresa : null;
  }, [clients, selectedClient]);

  const periodoInput = useMemo(() => {
    if (!periodo || periodo.length !== 6) return '';
    const mm = periodo.slice(0,2), yyyy = periodo.slice(2,6);
    return `${yyyy}-${mm}`;
  }, [periodo]);

  const fetchCombust = useCallback(async () => {
    if (!empresa || !periodo) return;
    setLoading(p => ({ ...p, combustiveis: true }));
    setError(p => ({ ...p, combustiveis: null }));
    try {
      const r = await fetch(`${API_URL}/api/relatorios/descarregamentos?empresa=${empresa}&periodo=${periodo}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDataCombust(d);
    } catch (err) { // eslint-disable-line no-unused-vars
      setError(p => ({ ...p, combustiveis: 'Erro ao carregar compras de combustíveis.' }));
    } finally {
      setLoading(p => ({ ...p, combustiveis: false }));
    }
  }, [empresa, periodo]);

  const fetchProd = useCallback(async () => {
    if (!empresa || !periodo) return;
    setLoading(p => ({ ...p, produtos: true }));
    setError(p => ({ ...p, produtos: null }));
    try {
      const r = await fetch(`${API_URL}/api/relatorios/notas-produtos?empresa=${empresa}&periodo=${periodo}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDataProd(d);
    } catch (err) { // eslint-disable-line no-unused-vars
      setError(p => ({ ...p, produtos: 'Erro ao carregar notas de compras de produtos.' }));
    } finally {
      setLoading(p => ({ ...p, produtos: false }));
    }
  }, [empresa, periodo]);

  useEffect(() => { fetchCombust(); fetchProd(); }, [fetchCombust, fetchProd]);

  const handlePeriodo = (e) => {
    const val = e.target.value; // "YYYY-MM"
    if (!val) return;
    const [yyyy, mm] = val.split('-');
    setPeriodo(mm + yyyy);
    setDataCombust(null);
    setDataProd(null);
  };

  // ── render helpers ──
  const renderCombust = () => {
    if (loading.combustiveis) return <LoadingState label="Carregando compras de combustíveis..." />;
    if (error.combustiveis)   return <ApiErrorNotice message={error.combustiveis} onRetry={fetchCombust} />;
    const d = dataCombust;
    if (!d) return null;
    const rows     = combustSubTab === 'comNota' ? d.comNota : d.semNota;
    const totalQtd = rows.reduce((s,r) => s + r.qtd,   0);
    const totalVal = rows.reduce((s,r) => s + r.total, 0);
    return (
      <div>
        <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
          <div className="stat-card" style={{ flex:1, minWidth:0 }}>
            <div className="stat-icon red"><Droplet size={20}/></div>
            <div className="stat-content">
              <div className="stat-label">Combustíveis 110</div>
              <div className="stat-value" style={{ fontSize:'20px' }}>{fmtNum(d.comNota.reduce((s,r)=>s+r.qtd,0),0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex:1, minWidth:0 }}>
            <div className="stat-icon orange"><Droplet size={20}/></div>
            <div className="stat-content">
              <div className="stat-label">Combustíveis 220</div>
              <div className="stat-value" style={{ fontSize:'20px' }}>{fmtNum(d.semNota.reduce((s,r)=>s+r.qtd,0),0)} L</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex:1, minWidth:0 }}>
            <div className="stat-icon green"><DollarSign size={20}/></div>
            <div className="stat-content">
              <div className="stat-label">Valor Total</div>
              <div className="stat-value" style={{ fontSize:'20px' }}>{fmtBRL([...d.comNota,...d.semNota].reduce((s,r)=>s+r.total,0))}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
          {['comNota','semNota'].map(t => (
            <button key={t} type="button" onClick={() => setCombustSubTab(t)}
              style={{ padding:'6px 16px', borderRadius:'6px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer',
                background: combustSubTab===t ? '#E31E24' : '#222', color: combustSubTab===t ? '#fff' : '#888' }}>
              {t==='comNota' ? 'Combustíveis 110' : 'Combustíveis 220'}
            </button>
          ))}
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>DATA</th><th>FORNECEDOR</th><th>COMBUSTÍVEL</th>
              <th style={{textAlign:'right'}}>LITROS</th>
              <th style={{textAlign:'right'}}>UNIT.</th>
              <th style={{textAlign:'right'}}>TOTAL</th>
              {combustSubTab==='comNota' ? <th>DOCUMENTO</th> : <><th>PEDIDO</th><th>OBSERVAÇÃO</th></>}
            </tr></thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#666',padding:'32px'}}>Nenhum registro encontrado.</td></tr>}
              {rows.map((r,i) => (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:'13px'}}>{fmtDate(r.data)}</td>
                  <td>
                    <div style={{maxWidth:'220px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.fornecedor}</div>
                    {fmtCnpj(r.cnpj) && <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{fmtCnpj(r.cnpj)}</div>}
                  </td>
                  <td style={{color:getFuelColor(r.combustivel),fontWeight:600}}>{r.combustivel}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',color:'#4CAF50',fontWeight:600}}>{fmtNum(r.qtd,3)}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',fontSize:'12px'}}>{fmtBRL(r.unitario)}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',fontWeight:600}}>{fmtBRL(r.total)}</td>
                  {combustSubTab==='comNota'
                    ? <td style={{fontFamily:'monospace',fontSize:'13px',color:'#aaa',fontWeight:600}}>{r.documento||'—'}</td>
                    : <><td style={{fontSize:'12px',color:'#888'}}>#{r.pedido}</td><td style={{fontSize:'11px',color:'#888',maxWidth:'200px'}}>{r.observacao||'—'}</td></>}
                </tr>
              ))}
              {rows.length>0 && (
                <tr style={{background:'#1a1a1a',fontWeight:700}}>
                  <td colSpan={3} style={{color:'#888'}}>TOTAL</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',color:'#4CAF50'}}>{fmtNum(totalQtd,3)} L</td>
                  <td></td>
                  <td style={{textAlign:'right',fontFamily:'monospace'}}>{fmtBRL(totalVal)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProd = () => {
    if (loading.produtos) return <LoadingState label="Carregando notas de compras de produtos..." />;
    if (error.produtos)   return <ApiErrorNotice message={error.produtos} onRetry={fetchProd} />;
    const d = dataProd;
    if (!d) return null;
    const rows     = d.notas || [];
    const totalQtd = rows.reduce((s,r) => s + r.qtd,   0);
    const totalVal = rows.reduce((s,r) => s + r.total, 0);
    const totalNotas = new Set(rows.map(r => r.nota)).size;
    return (
      <div>
        <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
          <div className="stat-card" style={{ flex:1, minWidth:0 }}>
            <div className="stat-icon red"><ShoppingCart size={20}/></div>
            <div className="stat-content">
              <div className="stat-label">NF de Entrada</div>
              <div className="stat-value" style={{ fontSize:'20px' }}>{totalNotas} notas</div>
              <div className="stat-sub">{rows.length} itens</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex:1, minWidth:0 }}>
            <div className="stat-icon green"><DollarSign size={20}/></div>
            <div className="stat-content">
              <div className="stat-label">Valor Total</div>
              <div className="stat-value" style={{ fontSize:'20px' }}>{fmtBRL(totalVal)}</div>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>DATA</th><th>FORNECEDOR</th><th>PRODUTO</th>
              <th style={{textAlign:'right'}}>QTD</th>
              <th style={{textAlign:'right'}}>UNIT.</th>
              <th style={{textAlign:'right'}}>TOTAL</th>
              <th>DOCUMENTO</th>
            </tr></thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={7} style={{textAlign:'center',color:'#666',padding:'32px'}}>Nenhum registro encontrado.</td></tr>}
              {rows.map((r,i) => (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:'13px'}}>{fmtDate(r.data)}</td>
                  <td>
                    <div style={{maxWidth:'220px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.fornecedor}</div>
                    {fmtCnpj(r.cnpj) && <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{fmtCnpj(r.cnpj)}</div>}
                  </td>
                  <td style={{maxWidth:'220px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{r.produto}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',color:'#4CAF50',fontWeight:600}}>{fmtNum(r.qtd,3)}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',fontSize:'12px'}}>{fmtBRL(r.unitario)}</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',fontWeight:600}}>{fmtBRL(r.total)}</td>
                  <td style={{fontFamily:'monospace',fontSize:'13px',color:'#aaa',fontWeight:600}}>{r.documento||'—'}</td>
                </tr>
              ))}
              {rows.length>0 && (
                <tr style={{background:'#1a1a1a',fontWeight:700}}>
                  <td colSpan={3} style={{color:'#888'}}>TOTAL</td>
                  <td style={{textAlign:'right',fontFamily:'monospace',color:'#4CAF50'}}>{fmtNum(totalQtd,3)}</td>
                  <td></td>
                  <td style={{textAlign:'right',fontFamily:'monospace'}}>{fmtBRL(totalVal)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>COMPRAS</h2>
        <div className="header-actions">
          <div className="control-filter-group">
            <label className="control-filter-label">PERÍODO</label>
            <div className="control-filter-select">
              <Calendar size={15}/>
              <input type="month" value={periodoInput} onChange={handlePeriodo}/>
            </div>
          </div>
          <button type="button" className="btn-secondary"
            onClick={() => { setDataCombust(null); setDataProd(null); fetchCombust(); fetchProd(); }}
            style={{ alignSelf:'flex-end', width:'auto', display:'flex', gap:'8px', alignItems:'center', padding:'8px 16px', fontSize:'13px' }}>
            <RefreshCw size={15}/> Atualizar
          </button>
          <button type="button" className="btn-primary control-print-generate"
            onClick={() => setShowPrintPanel(true)}
            style={{ alignSelf:'flex-end', width:'auto', display:'flex', gap:'8px', alignItems:'center', padding:'8px 16px', fontSize:'13px' }}>
            <Printer size={15}/> Imprimir
          </button>
        </div>
      </div>

      {showPrintPanel && (
        <ComprasPrintPanel
          secao={secao}
          combustSubTab={combustSubTab}
          dataCombust={dataCombust}
          dataProd={dataProd}
          periodo={periodo}
          empresa={empresa}
          onClose={() => setShowPrintPanel(false)}
        />
      )}

      {/* Seletor de seção */}
      <div style={{ display:'flex', gap:'0', marginBottom:'24px', borderRadius:'10px', overflow:'hidden', border:'1px solid #222', width:'fit-content' }}>
        <button type="button" onClick={() => setSecao('combustiveis')}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 28px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:700,
            background: secao==='combustiveis' ? '#E31E24' : '#1a1a1a',
            color:      secao==='combustiveis' ? '#fff'    : '#666',
            transition:'all 0.15s' }}>
          <Droplet size={16}/> Combustíveis
        </button>
        <button type="button" onClick={() => setSecao('produtos')}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 28px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:700,
            background: secao==='produtos' ? '#E31E24' : '#1a1a1a',
            color:      secao==='produtos' ? '#fff'    : '#666',
            borderLeft:'1px solid #222',
            transition:'all 0.15s' }}>
          <ShoppingCart size={16}/> Produtos
        </button>
      </div>

      {secao==='combustiveis' ? renderCombust() : renderProd()}
    </div>
  );
};
// ── fim ComprasPage ───────────────────────────────────────────────────────────

const Reports = ({ selectedClient, selectedPeriod, setSelectedPeriod, clients }) => {
  const [activeTab, setActiveTab] = useState('vendas');
  const [data, setData] = useState({ vendas: null, historico: null, consolidado: null, controle: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [showControlPrintPanel, setShowControlPrintPanel] = useState(false);
  const [showRankingPrintPanel, setShowRankingPrintPanel] = useState(false);
  const [showMargemPanel,       setShowMargemPanel]       = useState(false);
  const [margemFilters, setMargemFilters] = useState({ categoria: 'Todos', dataInicial: '', dataFinal: '', ordenacao: 'margemTotal' });
  const [showConciliacaoPanel,  setShowConciliacaoPanel]  = useState(false);
  const [conciliacaoFilters, setConciliacaoFilters] = useState({ adquirente:'Todos', bandeira:'Todos', modalidade:'Todos', dataInicial:'', dataFinal:'' });
  const [showCnpjPanel,         setShowCnpjPanel]         = useState(false);
  const [cnpjFilters, setCnpjFilters] = useState({ search:'', periodo:'Mensal' });
  const [showTurnoPanel,        setShowTurnoPanel]        = useState(false);
  const [turnoFilters, setTurnoFilters] = useState({ dataInicial:'', dataFinal:'', turno:'Todos', operador:'Todos' });
  const [showFluxoPanel,        setShowFluxoPanel]        = useState(false);
  const [fluxoFilters,   setFluxoFilters]   = useState({ conta:'Todas', dataInicial:'', dataFinal:'' });
  const [showEstoquePanel,      setShowEstoquePanel]      = useState(false);
  const [estoqueFilters, setEstoqueFilters] = useState({ unidade:'Todos', classificacao:'Todos' });
  const [showClientesPanel,     setShowClientesPanel]     = useState(false);
  const [clientesFilters, setClientesFilters] = useState({ faixa:'Todas', dia:'Todos' });
  const [showComprasPanel,      setShowComprasPanel]      = useState(false);
  const [comprasFilters, setComprasFilters]  = useState({ fornecedor:'Todos', produto:'Todos', dataInicial:'', dataFinal:'' });
  const [showCadastroPanel,     setShowCadastroPanel]     = useState(false);
  const [cadastroFilters, setCadastroFilters] = useState({ tipo:'todos', situacao:'todos', busca:'', ordenacao:'nome', exibirCodBarras:true });
  const [showDrePanel,          setShowDrePanel]          = useState(false);
  const [dreFilters,      setDreFilters]      = useState({ visao:'Sintética', dataInicial:'', dataFinal:'' });
  const [showDrefPanel,         setShowDrefPanel]         = useState(false);
  const [drefFilters,     setDrefFilters]     = useState({ modalidade:'Todos', dataInicial:'', dataFinal:'' });
  const [drefPreviewUrl,        setDrefPreviewUrl]        = useState(null);
  const drefIframeRef = React.useRef(null);
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
      if (tab === 'vendas') {
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
    { id: 'vendas',           label: 'Vendas PDV',                 icon: <BarChart2 size={15} /> },
    { id: 'outros',           label: 'Outros Relatorios',          icon: <FileText size={15} /> },
  ];


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

  const openTurnoPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setTurnoFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal:   prev.dataFinal   || range.dataFinal,
    }));
    setShowTurnoPanel(true);
  };

  const handleGenerateTurnoReport = () => {
    if (turnoFilters.dataInicial && turnoFilters.dataFinal && turnoFilters.dataInicial > turnoFilters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }
    exportTurnoReport({ filters: turnoFilters, clientName: selectedClient });
    setShowTurnoPanel(false);
  };

  const openFluxoPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setFluxoFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal:   prev.dataFinal   || range.dataFinal,
    }));
    setShowFluxoPanel(true);
  };
  const handleGenerateFluxoReport = () => {
    if (fluxoFilters.dataInicial && fluxoFilters.dataFinal && fluxoFilters.dataInicial > fluxoFilters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }
    exportFluxoReport({ filters: fluxoFilters, clientName: selectedClient });
    setShowFluxoPanel(false);
  };

  const openEstoquePanel  = () => setShowEstoquePanel(true);
  const handleGenerateEstoqueReport = () => {
    exportEstoqueReport({ filters: estoqueFilters, clientName: selectedClient });
    setShowEstoquePanel(false);
  };

  const openClientesPanel = () => setShowClientesPanel(true);
  const handleGenerateClientesReport = () => {
    exportClientesReport({ filters: clientesFilters, clientName: selectedClient });
    setShowClientesPanel(false);
  };

  const openComprasPanel = () => {
    const range = getPeriodDateRange(selectedPeriod);
    setComprasFilters(prev => ({
      ...prev,
      dataInicial: prev.dataInicial || range.dataInicial,
      dataFinal:   prev.dataFinal   || range.dataFinal,
    }));
    setShowComprasPanel(true);
  };
  const handleGenerateComprasReport = () => {
    if (comprasFilters.dataInicial && comprasFilters.dataFinal && comprasFilters.dataInicial > comprasFilters.dataFinal) {
      toast('A data inicial não pode ser maior que a data final.', 'warn');
      return;
    }
    exportComprasReport({ filters: comprasFilters, clientName: selectedClient });
    setShowComprasPanel(false);
  };

  const handleGenerateCadastroReport = async () => {
    const client = (clients || []).find(c => c.nome === selectedClient) || (clients || [])[0];
    const empresa = client ? client.codigoEmpresa : null;
    if (!empresa) { toast('Selecione uma empresa.', 'warn'); return; }

    toast('Gerando relatório de cadastros...', 'info');
    try {
      const r = await fetch(`${API_URL}/api/relatorios/cadastro-produtos?empresa=${empresa}`);
      const result = await r.json();
      if (result.error) throw new Error(result.error);

      const { combustiveis = [], convenio = [] } = result;
      const { tipo, situacao, busca, ordenacao, exibirCodBarras } = cadastroFilters;
      const buscaLow = busca.toLowerCase();

      const filtrarItems = (arr) => arr.filter(p => {
        if (situacao !== 'todos' && p.situacao.toLowerCase() !== situacao) return false;
        if (buscaLow && !p.descricao.toLowerCase().includes(buscaLow) && !(p.codBarra||'').toLowerCase().includes(buscaLow)) return false;
        return true;
      });

      const sortItems = (arr) => {
        const sorted = [...arr];
        if (ordenacao === 'nome')    sorted.sort((a,b) => (a.descricao||'').localeCompare(b.descricao||'', 'pt-BR'));
        if (ordenacao === 'estoque') sorted.sort((a,b) => (b.estoque||0) - (a.estoque||0));
        if (ordenacao === 'situacao') sorted.sort((a,b) => (a.situacao||'').localeCompare(b.situacao||'', 'pt-BR'));
        return sorted;
      };

      const showComb = tipo === 'todos' || tipo === 'combustiveis';
      const showConv = tipo === 'todos' || tipo === 'convenio';
      const combFilt = showComb ? sortItems(filtrarItems(combustiveis)) : [];
      const convFilt = showConv ? sortItems(filtrarItems(convenio))     : [];

      const fB   = v => 'R$ ' + Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      const fP   = (v,d=2) => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
      const mCor = m => m >= 20 ? '#15803d' : m >= 10 ? '#b45309' : '#b91c1c';
      const sitCor = s => s === 'ATIVO' ? '#15803d' : '#94a3b8';
      const now = new Date().toLocaleDateString('pt-BR');
      const ordemLabel = { nome:'Nome A–Z', estoque:'Estoque (maior)', situacao:'Situação' }[ordenacao] || '';

      // KPI totais
      const totalComb = combFilt.length;
      const totalConv = convFilt.length;
      const totalAtivos = [...combFilt, ...convFilt].filter(p => p.situacao === 'ATIVO').length;
      const totalInativos = [...combFilt, ...convFilt].filter(p => p.situacao === 'INATIVO').length;
      const margemMediaComb = combFilt.length ? combFilt.reduce((s,p)=>s+(p.margem||0),0)/combFilt.length : 0;
      const margemMediaConv = convFilt.length ? convFilt.reduce((s,p)=>s+(p.margem||0),0)/convFilt.length : 0;

      const trComb = combFilt.map((p, i) => `
        <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
          <td class="mono">${p.cod}</td>
          <td>${p.descricao}</td>
          <td class="mono c">${p.anp || '—'}</td>
          <td class="r">${fB(p.precoV1)}</td>
          <td class="r">${fB(p.precoV2)}</td>
          <td class="r">${fB(p.custo)}</td>
          <td class="r" style="color:${mCor(p.margem)};font-weight:700">${fP(p.margem,1)}%</td>
          <td class="c" style="color:${sitCor(p.situacao)};font-weight:700">${p.situacao}</td>
        </tr>`).join('');

      const trConv = convFilt.map((p, i) => `
        <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
          <td class="mono">${p.cod}</td>
          ${exibirCodBarras ? `<td class="mono" style="font-size:8.5px">${p.codBarra || '—'}</td>` : ''}
          <td>${p.descricao}</td>
          <td>${p.secao}</td>
          <td>${p.grupo || '—'}</td>
          <td class="r">${fB(p.precoV1)}</td>
          <td class="r">${fB(p.custo)}</td>
          <td class="r" style="color:${mCor(p.margem)};font-weight:700">${fP(p.margem,1)}%</td>
          <td class="r">${fP(p.estoque||0,0)}</td>
          <td class="c" style="color:${sitCor(p.situacao)};font-weight:700">${p.situacao}</td>
        </tr>`).join('');

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>REL 10 — Cadastro de Produtos e Combustíveis</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body, .report, .header, .panel, table, th, td, tfoot td {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
    .report { min-height: 100vh; padding: 16px; background: #fff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 18px; border: 1px solid #e5e7eb; border-bottom: 3px solid #e31e24; border-radius: 8px; background: #fff; margin-bottom: 12px; }
    .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .header-right { text-align: right; color: #667085; font-size: 10px; line-height: 1.55; flex-shrink: 0; }
    h1 { margin: 0 0 3px; font-size: 18px; font-weight: 800; line-height: 1.15; }
    .sub { color: #667085; font-size: 10px; }
    .kpi-strip { display: flex; gap: 10px; margin-bottom: 12px; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; flex: 1; }
    .kpi span { display: block; color: #667085; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
    .kpi strong { display: block; color: #111827; font-size: 18px; font-weight: 900; }
    .panel { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; padding: 14px; margin-bottom: 12px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .panel-title { margin: 0; font-size: 12px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; }
    .pill { border: 1px solid #d0d5dd; border-radius: 8px; color: #344054; padding: 5px 10px; font-size: 9px; font-weight: 800; background: #f9fafb; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td { border: 1px solid #d0d5dd; padding: 5px 7px; word-break: break-word; }
    th { background: #e31e24 !important; color: #fff; text-align: left; font-size: 8.5px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
    td { color: #111827; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .r { text-align: right; } .c { text-align: center; } .mono { font-family: monospace; }
    tfoot td { background: #f3f4f6 !important; font-weight: 900; }
    .footer { margin-top: 10px; color: #667085; font-size: 9px; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    @media screen {
      body { background: #fff; padding: 18px; }
      .report { max-width: 1180px; min-height: auto; margin: 0 auto; box-shadow: 0 18px 50px rgba(15,23,42,.12); }
    }
    @media print {
      .pgbrk { display: none !important; }
      .report { padding-top: 82px !important; }
      .header {
        position: fixed !important;
        top: 0; left: 0; right: 0;
        background: #fff !important;
        z-index: 9999;
        border-radius: 0;
        margin: 0 !important;
        border-top: 0; border-left: 0; border-right: 0;
      }
      .kpi-strip { break-inside: avoid; page-break-inside: avoid; }
      .panel-head { break-inside: avoid; page-break-inside: avoid; }
      .panel { break-before: auto; page-break-before: auto; }
      body { background: #fff !important; }
      .report { background: #fff !important; box-shadow: none !important; }
      th { background: #e31e24 !important; color: #fff !important; }
    }
  </style>
</head>
<body>
<main class="report">

  <section class="header">
    <div class="header-left">
      <img src="/logo-starvl.png" alt="STARVL" style="width:100px;height:auto;object-fit:contain;flex-shrink:0" />
      <div>
        <h1>REL 10 — Cadastro de Produtos e Combustíveis</h1>
        <div class="sub">${selectedClient || ''} &nbsp;|&nbsp; Ordenado por: ${ordemLabel} &nbsp;|&nbsp; Emitido em ${now}</div>
      </div>
    </div>
    <div class="header-right">
      <div style="font-size:11px;font-weight:700;color:#111827">${totalComb + totalConv} produtos</div>
      <div>${totalAtivos} ativo(s) &nbsp;·&nbsp; ${totalInativos} inativo(s)</div>
      <div>Gerado em ${now}</div>
    </div>
  </section>

  <div class="kpi-strip">
    <div class="kpi"><span>Combustíveis</span><strong>${totalComb}</strong></div>
    <div class="kpi"><span>Conveniência</span><strong>${totalConv}</strong></div>
    <div class="kpi"><span>Ativos</span><strong style="color:#15803d">${totalAtivos}</strong></div>
    <div class="kpi"><span>Inativos</span><strong style="color:#94a3b8">${totalInativos}</strong></div>
    ${showComb ? `<div class="kpi"><span>Margem Média Comb.</span><strong style="color:${mCor(margemMediaComb)}">${fP(margemMediaComb,1)}%</strong></div>` : ''}
    ${showConv ? `<div class="kpi"><span>Margem Média Conv.</span><strong style="color:${mCor(margemMediaConv)}">${fP(margemMediaConv,1)}%</strong></div>` : ''}
  </div>

  ${showComb ? `
  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">🔴 COMBUSTÍVEIS <span style="background:#e31e24;color:#fff;border-radius:4px;padding:1px 8px;font-size:9px;margin-left:6px">${combFilt.length}</span></h2>
      <div class="pill">Margem média: ${fP(margemMediaComb,1)}%</div>
    </div>
    ${combFilt.length === 0 ? '<div style="text-align:center;color:#888;padding:16px;font-style:italic">Nenhum combustível encontrado.</div>' : `
    <table>
      <thead><tr>
        <th style="width:48px">Cód.</th>
        <th>Descrição</th>
        <th class="c" style="width:90px">Cód. ANP</th>
        <th class="r" style="width:82px">Preço V1</th>
        <th class="r" style="width:82px">Preço V2</th>
        <th class="r" style="width:80px">Custo</th>
        <th class="r" style="width:62px">Margem</th>
        <th class="c" style="width:66px">Situação</th>
      </tr></thead>
      <tbody>${trComb}</tbody>
      <tfoot><tr>
        <td colspan="6" style="text-align:right;font-weight:700">Total de combustíveis:</td>
        <td class="c" style="font-weight:900">${combFilt.length}</td>
        <td></td>
      </tr></tfoot>
    </table>`}
  </section>` : ''}

  ${showConv ? `
  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">📦 CONVENIÊNCIA <span style="background:#e31e24;color:#fff;border-radius:4px;padding:1px 8px;font-size:9px;margin-left:6px">${convFilt.length}</span></h2>
      <div class="pill">Margem média: ${fP(margemMediaConv,1)}%</div>
    </div>
    ${convFilt.length === 0 ? '<div style="text-align:center;color:#888;padding:16px;font-style:italic">Nenhum produto encontrado.</div>' : `
    <table>
      <thead><tr>
        <th style="width:48px">Cód.</th>
        ${exibirCodBarras ? '<th style="width:90px">Cód. Barras</th>' : ''}
        <th>Descrição</th>
        <th style="width:90px">Seção</th>
        <th style="width:80px">Grupo</th>
        <th class="r" style="width:82px">Preço V1</th>
        <th class="r" style="width:80px">Custo</th>
        <th class="r" style="width:62px">Margem</th>
        <th class="r" style="width:62px">Estoque</th>
        <th class="c" style="width:66px">Situação</th>
      </tr></thead>
      <tbody>${trConv}</tbody>
      <tfoot><tr>
        <td colspan="${exibirCodBarras ? 8 : 7}" style="text-align:right;font-weight:700">Total de produtos:</td>
        <td class="c" style="font-weight:900">${convFilt.length}</td>
        <td></td>
      </tr></tfoot>
    </table>`}
  </section>` : ''}

  <div class="footer">STARVL SISTEMAS &nbsp;|&nbsp; REL 10 — Cadastro de Produtos e Combustíveis &nbsp;|&nbsp; ${now}</div>

</main>
<script>
(function(){
  /* Paginação visual na tela — divide tabelas no limite de cada folha A4 landscape */
  var PAGE_H=Math.round(190/25.4*96); /* conteúdo útil: 190mm ≈ 718px a 96dpi */

  function cleanup(r){
    r.querySelectorAll('.pgbrk').forEach(function(e){e.remove();});
    /* Mescla tabelas divididas de volta à original (ordem reversa = nível mais fundo primeiro) */
    Array.from(r.querySelectorAll('table.pgbrk-split')).reverse().forEach(function(t){
      var orig=t._pgbrkOrig;
      if(!orig)return;
      var ob=orig.querySelector('tbody'), sb=t.querySelector('tbody');
      if(ob&&sb) Array.from(sb.querySelectorAll(':scope>tr')).forEach(function(row){ob.appendChild(row);});
      var tf=t.querySelector('tfoot');
      if(tf) orig.appendChild(tf);
      t.remove();
    });
  }

  function makeSep(pn){
    var d=document.createElement('div');
    d.className='pgbrk';
    d.style.cssText='height:28px;background:#e5e7eb;border-top:2px solid #d1d5db;border-bottom:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;margin:0 -16px';
    d.innerHTML='<span style="font-size:9px;color:#6b7280;font-family:Arial,sans-serif">— Página '+pn+' —</span>';
    return d;
  }

  function doSplit(table,idx,pn){
    var tbody=table.querySelector('tbody'),thead=table.querySelector('thead'),tfoot=table.querySelector('tfoot');
    var rows=Array.from(tbody.querySelectorAll(':scope>tr'));
    var nt=document.createElement('table');
    nt.className=(table.className+' pgbrk-split').trim();
    nt._pgbrkOrig=table;
    if(thead) nt.appendChild(thead.cloneNode(true));
    var nb=document.createElement('tbody');
    nt.appendChild(nb);
    for(var i=idx;i<rows.length;i++) nb.appendChild(rows[i]);
    if(tfoot){table.removeChild(tfoot);nt.appendChild(tfoot);}
    var sep=makeSep(pn);
    table.parentNode.insertBefore(sep,table.nextSibling);
    table.parentNode.insertBefore(nt,sep.nextSibling);
    return nt;
  }

  function paginate(){
    var r=document.querySelector('.report');
    if(!r)return;
    cleanup(r);
    var top=r.getBoundingClientRect().top, pn=2;
    Array.from(r.querySelectorAll('table:not(.pgbrk-split)')).forEach(function(orig){
      var cur=orig;
      for(var i=0;i<500;i++){
        var tb=cur.querySelector('tbody');
        if(!tb)break;
        var rows=Array.from(tb.querySelectorAll(':scope>tr')), sp=-1;
        for(var j=1;j<rows.length;j++){
          if(Math.floor((rows[j].getBoundingClientRect().top-top)/PAGE_H)>
             Math.floor((rows[j-1].getBoundingClientRect().top-top)/PAGE_H)){sp=j;break;}
        }
        if(sp===-1)break;
        cur=doSplit(cur,sp,pn++);
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',paginate);
  else paginate();
  window.addEventListener('resize',paginate);
})();
</script>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (!win) { toast('Permita pop-ups no navegador para gerar o relatório.', 'warn'); return; }
      win.document.open();
      win.document.write(html.replace('</body>', '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr' + 'ipt></body>'));
      win.document.close();
      setShowCadastroPanel(false);
    } catch (err) {
      toast(`Erro ao gerar relatório: ${err.message}`, 'error');
    }
  };

  // ── REL 11 — DRE ─────────────────────────────────────────────────────────────
  const handleGenerateDreReport = () => {
    try {
      const fmt = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
      const fmtD = d => d ? d.split('-').reverse().join('/') : '—';
      const now = new Date().toLocaleString('pt-BR');
      const { visao, dataInicial, dataFinal } = dreFilters;
      const periodo = (dataInicial && dataFinal) ? `${fmtD(dataInicial)} a ${fmtD(dataFinal)}` : 'Período Geral';

      // ── Dados de exemplo ────────────────────────────────────────────────────
      const rb_comb = 1250000, rb_conv = 125000, rb_serv = 38000;
      const rb_total = rb_comb + rb_conv + rb_serv;
      const ded_imp = 98910, ded_dev = 4200;
      const ded_total = ded_imp + ded_dev;
      const rl = rb_total - ded_total;
      const cmv_comb = 937500, cmv_conv = 68000;
      const cmv_total = cmv_comb + cmv_conv;
      const lucro_bruto = rl - cmv_total;
      const desp_pes = 89500, desp_alug = 28000, desp_en = 12400, desp_mkt = 3200, desp_man = 8700, desp_out = 5100;
      const desp_total = desp_pes + desp_alug + desp_en + desp_mkt + desp_man + desp_out;
      const ebitda = lucro_bruto - desp_total;
      const rf_rec = 2100, rf_desp = 8400;
      const rf_liq = rf_rec - rf_desp;
      const lair = ebitda + rf_liq;
      const ir = 38155;
      const ll = lair - ir;

      const corPos = '#16a34a', corNeg = '#dc2626', corTotal = '#e2e8f0', corSub = '#94a3b8';

      const linhaSimples = (desc, valor, cor='', indent=0, bold=false, bg='') =>
        `<tr style="${bg?`background:${bg};`:''}">
          <td style="padding:6px 16px 6px ${16+indent*20}px;font-size:12.5px;color:${bold?corTotal:corSub};${bold?'font-weight:700;':''}">${desc}</td>
          <td style="text-align:right;padding:6px 20px 6px 0;font-size:12.5px;font-weight:${bold?700:400};color:${cor||corSub};white-space:nowrap">${fmt(valor)}</td>
        </tr>`;

      const linhaSep = (label='') =>
        `<tr><td colspan="2" style="padding:0;border-top:1px solid #2a2a2a;"><div style="font-size:10px;color:#475569;padding:3px 16px;background:#0d1117;letter-spacing:1px">${label}</div></td></tr>`;

      const linhaTotal = (desc, valor, cor='') =>
        `<tr style="background:#101720;">
          <td style="padding:8px 16px;font-size:13px;font-weight:700;color:${cor||corTotal};border-top:2px solid #1e293b">${desc}</td>
          <td style="text-align:right;padding:8px 20px 8px 0;font-size:14px;font-weight:700;color:${cor||corTotal};border-top:2px solid #1e293b;white-space:nowrap">${fmt(valor)}</td>
        </tr>`;

      const isAnalitica = visao === 'Analítica';

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>REL 11 — DRE</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0a0d11;color:#e2e8f0;font-family:'Segoe UI',Arial,sans-serif;padding:32px 24px;}
  .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #1e293b;}
  .header-left h1{font-size:17px;font-weight:700;letter-spacing:1.5px;color:#f1f5f9;margin-bottom:4px;}
  .header-left p{font-size:11px;color:#64748b;margin-top:2px;}
  .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px;}
  .badge-verde{background:rgba(22,163,74,0.15);color:#4ade80;border:1px solid rgba(22,163,74,0.3);}
  .badge-red{background:rgba(220,38,38,0.15);color:#f87171;border:1px solid rgba(220,38,38,0.3);}
  table{width:100%;border-collapse:collapse;}
  .dre-block{background:#111827;border:1px solid #1e293b;border-radius:10px;margin-bottom:16px;overflow:hidden;}
  .dre-block-title{background:#0d1117;padding:10px 16px;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#475569;border-bottom:1px solid #1e293b;}
  .footer{margin-top:28px;padding-top:14px;border-top:1px solid #1e293b;font-size:10px;color:#334155;display:flex;justify-content:space-between;}
  @media print{body{background:#fff!important;color:#111!important;padding:16px!important;}
    .dre-block{background:#fff!important;border-color:#e5e7eb!important;}
    .dre-block-title{background:#f8fafc!important;color:#374151!important;border-color:#e5e7eb!important;}
    table tr{background:#fff!important;}
    td{color:#111!important;border-color:#e5e7eb!important;}
  }
</style>
</head><body>
<div class="report">
  <div class="header">
    <div class="header-left">
      <h1>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h1>
      <p>${selectedClient || 'STARVL SISTEMAS'} &nbsp;|&nbsp; ${periodo} &nbsp;|&nbsp; Visão: ${visao} &nbsp;|&nbsp; Emitido em ${now}</p>
    </div>
    <div>
      <span class="badge ${ll>=0?'badge-verde':'badge-red'}">${ll>=0?'LUCRO':'PREJUÍZO'}: ${fmt(Math.abs(ll))}</span>
    </div>
  </div>

  <!-- 1. RECEITA BRUTA -->
  <div class="dre-block">
    <div class="dre-block-title">1 · RECEITA BRUTA DE VENDAS</div>
    <table>
      ${isAnalitica ? `
        ${linhaSimples('Combustíveis', rb_comb, corPos, 1)}
        ${linhaSimples('Produtos de Conveniência', rb_conv, corPos, 1)}
        ${linhaSimples('Serviços (Lubrificação / Lavagem)', rb_serv, corPos, 1)}
      ` : ''}
      ${linhaTotal('TOTAL RECEITA BRUTA', rb_total, corPos)}
    </table>
  </div>

  <!-- 2. DEDUÇÕES -->
  <div class="dre-block">
    <div class="dre-block-title">2 · DEDUÇÕES DA RECEITA BRUTA</div>
    <table>
      ${isAnalitica ? `
        ${linhaSimples('(–) Impostos sobre Vendas (PIS / COFINS / ISS)', -ded_imp, corNeg, 1)}
        ${linhaSimples('(–) Devoluções e Cancelamentos', -ded_dev, corNeg, 1)}
      ` : ''}
      ${linhaTotal('TOTAL DEDUÇÕES', -ded_total, corNeg)}
      ${linhaSep('= RESULTADO')}
      ${linhaTotal('RECEITA LÍQUIDA DE VENDAS', rl, rl>=0?corPos:corNeg)}
    </table>
  </div>

  <!-- 3. CMV -->
  <div class="dre-block">
    <div class="dre-block-title">3 · CUSTO DAS MERCADORIAS VENDIDAS (CMV / CPV)</div>
    <table>
      ${isAnalitica ? `
        ${linhaSimples('(–) CMV — Combustíveis (custo direto)', -cmv_comb, corNeg, 1)}
        ${linhaSimples('(–) CMV — Produtos de Conveniência', -cmv_conv, corNeg, 1)}
      ` : ''}
      ${linhaTotal('TOTAL CMV / CPV', -cmv_total, corNeg)}
      ${linhaSep('= RESULTADO')}
      ${linhaTotal('LUCRO BRUTO', lucro_bruto, lucro_bruto>=0?corPos:corNeg)}
    </table>
  </div>

  <!-- 4. DESPESAS OPERACIONAIS -->
  <div class="dre-block">
    <div class="dre-block-title">4 · DESPESAS OPERACIONAIS</div>
    <table>
      ${isAnalitica ? `
        ${linhaSimples('(–) Pessoal e Encargos Sociais', -desp_pes, corNeg, 1)}
        ${linhaSimples('(–) Aluguel e Ocupação', -desp_alug, corNeg, 1)}
        ${linhaSimples('(–) Energia Elétrica e Utilidades', -desp_en, corNeg, 1)}
        ${linhaSimples('(–) Marketing e Publicidade', -desp_mkt, corNeg, 1)}
        ${linhaSimples('(–) Manutenção e Conservação', -desp_man, corNeg, 1)}
        ${linhaSimples('(–) Outras Despesas Operacionais', -desp_out, corNeg, 1)}
      ` : ''}
      ${linhaTotal('TOTAL DESPESAS OPERACIONAIS', -desp_total, corNeg)}
      ${linhaSep('= RESULTADO')}
      ${linhaTotal('EBITDA / RESULTADO OPERACIONAL', ebitda, ebitda>=0?corPos:corNeg)}
    </table>
  </div>

  <!-- 5. RESULTADO FINANCEIRO -->
  <div class="dre-block">
    <div class="dre-block-title">5 · RESULTADO FINANCEIRO</div>
    <table>
      ${isAnalitica ? `
        ${linhaSimples('(+) Receitas Financeiras (juros, aplicações)', rf_rec, corPos, 1)}
        ${linhaSimples('(–) Despesas Financeiras (juros, IOF, tarifas)', -rf_desp, corNeg, 1)}
      ` : ''}
      ${linhaTotal('RESULTADO FINANCEIRO LÍQUIDO', rf_liq, rf_liq>=0?corPos:corNeg)}
      ${linhaSep('= RESULTADO')}
      ${linhaTotal('RESULTADO ANTES DO IR / CSLL', lair, lair>=0?corPos:corNeg)}
    </table>
  </div>

  <!-- 6. IR / LL -->
  <div class="dre-block">
    <div class="dre-block-title">6 · IMPOSTOS SOBRE O RESULTADO</div>
    <table>
      ${linhaSimples('(–) Provisão IR / CSLL', -ir, corNeg, 1)}
      ${linhaSep('= RESULTADO FINAL')}
      <tr style="background:#0d2137;">
        <td style="padding:12px 16px;font-size:15px;font-weight:700;color:${ll>=0?'#4ade80':'#f87171'};border-top:2px solid #1e4d2b">
          ${ll>=0?'✓ LUCRO LÍQUIDO DO EXERCÍCIO':'✗ PREJUÍZO LÍQUIDO DO EXERCÍCIO'}
        </td>
        <td style="text-align:right;padding:12px 20px 12px 0;font-size:16px;font-weight:700;color:${ll>=0?'#4ade80':'#f87171'};border-top:2px solid #1e4d2b;white-space:nowrap">
          ${fmt(Math.abs(ll))}
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <span>STARVL SISTEMAS &nbsp;|&nbsp; REL 11 — Demonstração do Resultado do Exercício &nbsp;|&nbsp; ${now}</span>
    <span>Visão: ${visao} &nbsp;|&nbsp; ${periodo}</span>
  </div>
</div>
</body></html>`;

      const win = window.open('', '_blank');
      if (!win) { toast('Permita pop-ups no navegador para gerar o relatório.', 'warn'); return; }
      win.document.open();
      win.document.write(html.replace('</body>', '<scr'+'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},500);});<\/scr'+'ipt></body>'));
      win.document.close();
      setShowDrePanel(false);
    } catch (err) {
      toast(`Erro ao gerar DRE: ${err.message}`, 'error');
    }
  };

  // ── REL 12 — DREF ────────────────────────────────────────────────────────────
  const handleGenerateDrefReport = () => {
    try {
      const fmt = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
      const fmtD = d => d ? d.split('-').reverse().join('/') : '—';
      const now = new Date().toLocaleString('pt-BR');
      const { modalidade, dataInicial, dataFinal } = drefFilters;
      const periodo = (dataInicial && dataFinal) ? `${fmtD(dataInicial)} a ${fmtD(dataFinal)}` : 'Período Geral';

      // ── Dados de exemplo ────────────────────────────────────────────────────
      const rec = { dinheiro:185000, debito:320000, creditoVista:410000, creditoParc:180000, pix:90000, prazo:75000 };
      const pag = { combustiveis:937500, conveniencia:68000, pessoal:89500, impostos:98910, aluguel:28000, financiamentos:15400, outros:14200 };
      const inadimp = { vencida:12400, aVencer:85000 };

      const totalRec = Object.values(rec).reduce((s,v)=>s+v,0);
      const totalPag = Object.values(pag).reduce((s,v)=>s+v,0);
      const saldoFin = totalRec - totalPag;
      const taxas = { debito:0.019, credito:0.025, pix:0 };
      const custTaxas = rec.debito*taxas.debito + (rec.creditoVista+rec.creditoParc)*taxas.credito;
      const saldoLiq = saldoFin - custTaxas;

      const corSaldo = (v) => v >= 0 ? '#16a34a' : '#dc2626';
      const corPos = '#16a34a', corNeg = '#dc2626', corAviso = '#ea580c';

      /* --- helpers de linha (tema branco REL 1) --- */
      const linhaRec = (desc, valor, pct) =>
        `<tr>
          <td style="padding:7px 16px;font-size:12.5px;color:#374151;border-bottom:1px solid #f3f4f6">${desc}</td>
          <td style="text-align:right;padding:7px 0;font-size:12.5px;color:${corPos};white-space:nowrap;border-bottom:1px solid #f3f4f6;font-weight:600">${fmt(valor)}</td>
          <td style="text-align:right;padding:7px 20px 7px 12px;font-size:11px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #f3f4f6">${pct}%</td>
        </tr>`;

      const linhaPag = (desc, valor) =>
        `<tr>
          <td style="padding:7px 16px;font-size:12.5px;color:#374151;border-bottom:1px solid #f3f4f6">${desc}</td>
          <td style="text-align:right;padding:7px 20px 7px 0;font-size:12.5px;color:${corNeg};white-space:nowrap;font-weight:600;border-bottom:1px solid #f3f4f6" colspan="2">(${fmt(valor)})</td>
        </tr>`;

      const linhaTot = (desc, valor, cor) =>
        `<tr style="background:#f9fafb;">
          <td style="padding:9px 16px;font-size:13px;font-weight:700;color:${cor||'#111827'};border-top:2px solid #e5e7eb">${desc}</td>
          <td colspan="2" style="text-align:right;padding:9px 20px 9px 0;font-size:14px;font-weight:700;color:${cor||'#111827'};border-top:2px solid #e5e7eb;white-space:nowrap">${fmt(valor)}</td>
        </tr>`;

      const pct = (v) => (totalRec > 0 ? ((v / totalRec) * 100).toFixed(1) : '0.0');

      const saldoBadgeBg = saldoLiq >= 0 ? '#dcfce7' : '#fee2e2';
      const saldoBadgeColor = saldoLiq >= 0 ? '#15803d' : '#b91c1c';
      const saldoBadgeBorder = saldoLiq >= 0 ? '#bbf7d0' : '#fecaca';

      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>REL 12 — DREF</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body, .report, .header, .panel, .kpi, table, th, td {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #ffffff; }
  .report { min-height: 100vh; padding: 18px; background: #ffffff; }

  /* HEADER — mesmo padrão REL 1 */
  .header {
    display: flex; align-items: center; justify-content: space-between; gap: 18px;
    padding: 16px 18px;
    border: 1px solid #e5e7eb; border-bottom: 3px solid #e31e24; border-radius: 8px;
    background: #ffffff; margin-bottom: 16px;
  }
  .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .mark {
    width: 44px; height: 44px; border-radius: 8px; background: #fff5f5;
    border: 1px solid #fecaca; display: grid; place-items: end center;
    padding: 8px; gap: 3px; grid-template-columns: repeat(3, 1fr); flex: 0 0 auto;
  }
  .mark span { display: block; width: 7px; border-radius: 3px 3px 0 0; background: #e31e24; }
  .mark span:nth-child(1) { height: 14px; opacity: .75; }
  .mark span:nth-child(2) { height: 24px; }
  .mark span:nth-child(3) { height: 32px; opacity: .85; }
  h1 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0; line-height: 1.15; color: #111827; }
  .header-meta { color: #6b7280; font-size: 11px; line-height: 1.45; text-align: left; margin-top: 3px; }
  .badge-saldo {
    display: inline-block; padding: 4px 14px; border-radius: 20px;
    font-size: 10px; font-weight: 700; letter-spacing: 1px; white-space: nowrap;
    background: ${saldoBadgeBg}; color: ${saldoBadgeColor}; border: 1px solid ${saldoBadgeBorder};
  }

  /* KPI CARDS */
  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi {
    flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
    padding: 14px 16px; text-align: center;
  }
  .kpi-label { font-size: 10px; color: #6b7280; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700; }
  .kpi-value { font-size: 17px; font-weight: 900; }

  /* BLOCOS */
  .dre-block {
    background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;
    margin-bottom: 14px; overflow: hidden;
  }
  .dre-block-title {
    background: #f9fafb; padding: 8px 16px;
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    color: #374151; border-bottom: 1px solid #e5e7eb;
  }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .grid2 .dre-block { margin-bottom: 0; }

  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #e31e24; color: #ffffff;
    padding: 8px 16px; font-size: 9.5px; font-weight: 700;
    letter-spacing: 1px; text-align: left;
  }
  thead th:not(:first-child) { text-align: right; }

  /* SALDO FINAL */
  .saldo-row td {
    padding: 12px 16px; font-size: 15px; font-weight: 900;
    color: ${corSaldo(saldoLiq)}; border-top: 3px solid #e31e24; background: #fff5f5;
  }
  .saldo-row td:last-child { text-align: right; padding-right: 20px; font-size: 17px; }

  /* FOOTER */
  .footer {
    margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;
    font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;
  }

  @media screen {
    body { background: #f3f4f6; padding: 18px; }
    .report { max-width: 900px; min-height: auto; margin: 0 auto; box-shadow: 0 18px 50px rgba(15,23,42,.12); border-radius: 10px; }
  }
  @media print {
    body { background: #ffffff !important; padding: 0 !important; }
    .report { box-shadow: none !important; border-radius: 0 !important; }
    .dre-block, .kpi, .header { break-inside: avoid; page-break-inside: avoid; }
  }
</style>
</head><body>
<main class="report">

  <!-- HEADER REL 1 style -->
  <section class="header">
    <div class="header-left">
      <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;flex-shrink:0" />
      <div>
        <h1>DEMONSTRAÇÃO DO RESULTADO FINANCEIRO</h1>
        <div class="header-meta">${selectedClient||'STARVL SISTEMAS'} &nbsp;|&nbsp; ${periodo} &nbsp;|&nbsp; Modalidade: ${modalidade}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div class="badge-saldo">SALDO LÍQ: ${fmt(saldoLiq)}</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:6px">Emitido em ${now}</div>
    </div>
  </section>

  <!-- KPIs -->
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">TOTAL RECEBIMENTOS</div><div class="kpi-value" style="color:${corPos}">${fmt(totalRec)}</div></div>
    <div class="kpi"><div class="kpi-label">TOTAL PAGAMENTOS</div><div class="kpi-value" style="color:${corNeg}">${fmt(totalPag)}</div></div>
    <div class="kpi"><div class="kpi-label">CUSTO DE TAXAS</div><div class="kpi-value" style="color:${corAviso}">${fmt(custTaxas)}</div></div>
    <div class="kpi"><div class="kpi-label">SALDO FINANCEIRO LÍQ.</div><div class="kpi-value" style="color:${corSaldo(saldoLiq)}">${fmt(saldoLiq)}</div></div>
  </div>

  <!-- RECEBIMENTOS -->
  <div class="dre-block">
    <div class="dre-block-title">1 · RECEBIMENTOS — ENTRADAS POR MODALIDADE</div>
    <table>
      <thead><tr>
        <th>MODALIDADE</th>
        <th style="text-align:right;padding-right:0">VALOR</th>
        <th style="text-align:right;padding-right:20px">% RECEITA</th>
      </tr></thead>
      <tbody>
        ${linhaRec('Dinheiro / Espécie', rec.dinheiro, pct(rec.dinheiro))}
        ${linhaRec('Cartão Débito à Vista', rec.debito, pct(rec.debito))}
        ${linhaRec('Cartão Crédito à Vista', rec.creditoVista, pct(rec.creditoVista))}
        ${linhaRec('Cartão Crédito Parcelado', rec.creditoParc, pct(rec.creditoParc))}
        ${linhaRec('PIX / Transferência', rec.pix, pct(rec.pix))}
        ${linhaRec('Vendas a Prazo (CNPJ)', rec.prazo, pct(rec.prazo))}
        ${linhaTot('TOTAL RECEBIMENTOS', totalRec, corPos)}
      </tbody>
    </table>
  </div>

  <!-- PAGAMENTOS -->
  <div class="dre-block">
    <div class="dre-block-title">2 · PAGAMENTOS — SAÍDAS POR CATEGORIA</div>
    <table>
      <thead><tr>
        <th>CATEGORIA</th>
        <th colspan="2" style="text-align:right;padding-right:20px">VALOR</th>
      </tr></thead>
      <tbody>
        ${linhaPag('Fornecedores — Combustíveis', pag.combustiveis)}
        ${linhaPag('Fornecedores — Conveniência', pag.conveniencia)}
        ${linhaPag('Pessoal e Encargos', pag.pessoal)}
        ${linhaPag('Impostos e Tributos', pag.impostos)}
        ${linhaPag('Aluguel e Ocupação', pag.aluguel)}
        ${linhaPag('Financiamentos e Empréstimos', pag.financiamentos)}
        ${linhaPag('Outros Pagamentos', pag.outros)}
        ${linhaTot('TOTAL PAGAMENTOS', totalPag, corNeg)}
      </tbody>
    </table>
  </div>

  <!-- TAXAS E INADIMPLÊNCIA (grid 2 col) -->
  <div class="grid2">
    <div class="dre-block">
      <div class="dre-block-title">3 · CUSTO DE TAXAS — MAQUININHAS</div>
      <table><tbody>
        ${linhaRec('Taxa Débito (1,9%)', rec.debito*taxas.debito, ((rec.debito*taxas.debito/totalRec)*100).toFixed(1))}
        ${linhaRec('Taxa Crédito (2,5%)', (rec.creditoVista+rec.creditoParc)*taxas.credito, (((rec.creditoVista+rec.creditoParc)*taxas.credito/totalRec)*100).toFixed(1))}
        ${linhaRec('PIX (isento)', 0, '0.0')}
        ${linhaTot('TOTAL TAXAS', custTaxas, corAviso)}
      </tbody></table>
    </div>
    <div class="dre-block">
      <div class="dre-block-title">4 · POSIÇÃO DE INADIMPLÊNCIA</div>
      <table><tbody>
        ${linhaPag('Títulos Vencidos', inadimp.vencida)}
        <tr>
          <td style="padding:7px 16px;font-size:12.5px;color:#374151;border-bottom:1px solid #f3f4f6">Títulos a Vencer (30 d)</td>
          <td colspan="2" style="text-align:right;padding:7px 20px 7px 0;font-size:12.5px;color:${corAviso};white-space:nowrap;font-weight:600;border-bottom:1px solid #f3f4f6">${fmt(inadimp.aVencer)}</td>
        </tr>
        ${linhaTot('TOTAL EXPOSIÇÃO', inadimp.vencida+inadimp.aVencer, corAviso)}
      </tbody></table>
    </div>
  </div>

  <!-- SALDO FINAL -->
  <div class="dre-block">
    <div class="dre-block-title">5 · RESULTADO FINANCEIRO CONSOLIDADO</div>
    <table><tbody>
      ${linhaTot('(+) Total Recebimentos', totalRec, corPos)}
      ${linhaTot('(–) Total Pagamentos', -totalPag, corNeg)}
      ${linhaTot('(–) Custo de Taxas', -custTaxas, corAviso)}
      <tr class="saldo-row">
        <td>${saldoLiq>=0?'✓ SALDO FINANCEIRO LÍQUIDO':'✗ DÉFICIT FINANCEIRO'}</td>
        <td colspan="2" style="text-align:right;padding:12px 20px;font-size:17px;font-weight:900;color:${corSaldo(saldoLiq)};border-top:3px solid #e31e24;background:#fff5f5;white-space:nowrap">${fmt(Math.abs(saldoLiq))}</td>
      </tr>
    </tbody></table>
  </div>

  <footer class="footer">
    <span>STARVL SISTEMAS &nbsp;|&nbsp; REL 12 — DRE Financeiro &nbsp;|&nbsp; ${now}</span>
    <span>Modalidade: ${modalidade} &nbsp;|&nbsp; ${periodo}</span>
  </footer>

</main>
</body></html>`;

      // Exibe inline na app (preview branco, igual ao impresso)
      if (drefPreviewUrl) {
        URL.revokeObjectURL(drefPreviewUrl);
      }
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setDrefPreviewUrl(url);
      setShowDrefPanel(false);
    } catch (err) {
      toast(`Erro ao gerar DREF: ${err.message}`, 'error');
    }
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

        <button type="button" className="other-report-row" onClick={openTurnoPanel}>
          <div className="other-report-index">REL 5</div>
          <div className="other-report-icon"><Clock size={22} /></div>
          <div className="other-report-main">
            <strong>Faltas / Sobras de Caixa por Turno</strong>
            <span>Auditoria de fechamento por frentista — divergências e saldo líquido do período</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openFluxoPanel}>
          <div className="other-report-index">REL 6</div>
          <div className="other-report-icon"><Wallet size={22} /></div>
          <div className="other-report-main">
            <strong>Fluxo de Caixa Operacional</strong>
            <span>DRE simplificada com entradas, saídas e saldo operacional do período</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openEstoquePanel}>
          <div className="other-report-index">REL 7</div>
          <div className="other-report-icon"><Package size={22} /></div>
          <div className="other-report-main">
            <strong>Giro de Estoque e Curva ABC</strong>
            <span>Estoque crítico, morto e curva ABC por faturamento — Loja e Pista</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openClientesPanel}>
          <div className="other-report-index">REL 8</div>
          <div className="other-report-icon"><UsersIcon size={22} /></div>
          <div className="other-report-main">
            <strong>Fluxo de Clientes e Ticket Médio</strong>
            <span>Heatmap de atendimentos por horário e dia da semana com ticket médio</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={openComprasPanel}>
          <div className="other-report-index">REL 9</div>
          <div className="other-report-icon"><Target size={22} /></div>
          <div className="other-report-main">
            <strong>Painel de Auxílio em Compras</strong>
            <span>Histórico de preços de compra com alerta de variação acima da média</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={() => setShowCadastroPanel(true)}>
          <div className="other-report-index">REL 10</div>
          <div className="other-report-icon"><Database size={22} /></div>
          <div className="other-report-main">
            <strong>Cadastro de Produtos e Combustíveis</strong>
            <span>Relação completa dos cadastros com código, preço, custo, margem e situação</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={() => setShowDrePanel(true)}>
          <div className="other-report-index">REL 11</div>
          <div className="other-report-icon"><BarChart2 size={22} /></div>
          <div className="other-report-main">
            <strong>DRE — Demonstração do Resultado do Exercício</strong>
            <span>P&amp;L completo: receita bruta, deduções, CMV, despesas operacionais, resultado financeiro e lucro líquido</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="other-report-row" onClick={() => setShowDrefPanel(true)}>
          <div className="other-report-index">REL 12</div>
          <div className="other-report-icon"><PiggyBank size={22} /></div>
          <div className="other-report-main">
            <strong>DREF — DRE Financeiro</strong>
            <span>Recebimentos por modalidade, pagamentos por categoria, custo de taxas e saldo financeiro líquido</span>
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

      {showTurnoPanel && (
        <TurnoFilterPanel
          filters={turnoFilters}
          setFilters={setTurnoFilters}
          onClose={() => setShowTurnoPanel(false)}
          onGenerate={handleGenerateTurnoReport}
        />
      )}

      {showFluxoPanel && (
        <FluxoFilterPanel
          filters={fluxoFilters}
          setFilters={setFluxoFilters}
          onClose={() => setShowFluxoPanel(false)}
          onGenerate={handleGenerateFluxoReport}
        />
      )}

      {showEstoquePanel && (
        <EstoqueFilterPanel
          filters={estoqueFilters}
          setFilters={setEstoqueFilters}
          onClose={() => setShowEstoquePanel(false)}
          onGenerate={handleGenerateEstoqueReport}
        />
      )}

      {showClientesPanel && (
        <ClientesFilterPanel
          filters={clientesFilters}
          setFilters={setClientesFilters}
          onClose={() => setShowClientesPanel(false)}
          onGenerate={handleGenerateClientesReport}
        />
      )}

      {showComprasPanel && (
        <ComprasFilterPanel
          filters={comprasFilters}
          setFilters={setComprasFilters}
          onClose={() => setShowComprasPanel(false)}
          onGenerate={handleGenerateComprasReport}
        />
      )}

      {showCadastroPanel && (
        <CadastroFilterPanel
          filters={cadastroFilters}
          setFilters={setCadastroFilters}
          onClose={() => setShowCadastroPanel(false)}
          onGenerate={handleGenerateCadastroReport}
        />
      )}

      {showDrePanel && (
        <DREFilterPanel
          filters={dreFilters}
          setFilters={setDreFilters}
          onClose={() => setShowDrePanel(false)}
          onGenerate={handleGenerateDreReport}
        />
      )}

      {showDrefPanel && (
        <DREFFilterPanel
          filters={drefFilters}
          setFilters={setDrefFilters}
          onClose={() => setShowDrefPanel(false)}
          onGenerate={handleGenerateDrefReport}
        />
      )}

      {/* REL 12 — Preview inline (fundo branco, tema REL 1) */}
      {drefPreviewUrl && (
        <div style={{ position:'fixed', inset:0, zIndex:1200, display:'flex', flexDirection:'column', background:'#f3f4f6' }}>
          {/* Barra de controle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', background:'#ffffff', borderBottom:'3px solid #e31e24', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'#fff5f5', border:'1px solid #fecaca', display:'grid', placeItems:'end center', padding:6, gap:2, gridTemplateColumns:'repeat(3,1fr)', flexShrink:0 }}>
                <span style={{ display:'block', width:6, height:11, borderRadius:'3px 3px 0 0', background:'#e31e24', opacity:.75 }} />
                <span style={{ display:'block', width:6, height:19, borderRadius:'3px 3px 0 0', background:'#e31e24' }} />
                <span style={{ display:'block', width:6, height:26, borderRadius:'3px 3px 0 0', background:'#e31e24', opacity:.85 }} />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:13, color:'#111827', letterSpacing:0.5 }}>REL 12 — DRE FINANCEIRO</div>
                <div style={{ fontSize:10, color:'#6b7280', marginTop:1 }}>Pré-visualização de impressão</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button"
                onClick={() => drefIframeRef.current?.contentWindow?.print()}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'#e31e24', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <Printer size={14} /> Imprimir
              </button>
              <button type="button"
                onClick={() => { URL.revokeObjectURL(drefPreviewUrl); setDrefPreviewUrl(null); setShowDrefPanel(true); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <ChevronLeft size={14} /> Filtros
              </button>
              <button type="button"
                onClick={() => { URL.revokeObjectURL(drefPreviewUrl); setDrefPreviewUrl(null); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <X size={14} /> Fechar
              </button>
            </div>
          </div>
          {/* Iframe preview */}
          <iframe
            ref={drefIframeRef}
            src={drefPreviewUrl}
            title="REL 12 — DRE Financeiro"
            style={{ flex:1, border:'none', width:'100%', background:'#f3f4f6' }}
          />
        </div>
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

// ── CadastroFilterPanel ───────────────────────────────────────────────────────
const CadastroFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => {
  const upd = (field, val) => setFilters(f => ({ ...f, [field]: val }));

  const tipoOpts    = [['todos','Todos','Combustíveis e Conveniência'],['combustiveis','Combustíveis','prodtipo = 1'],['convenio','Conveniência','prodtipo = 2']];
  const situOpts    = [['todos','Todos','Ativos e Inativos'],['ativo','Somente Ativos','Situação = ATIVO'],['inativo','Somente Inativos','Situação = INATIVO']];
  const ordenOpts   = [['nome','Nome A–Z','Ordem alfabética'],['estoque','Estoque','Maior estoque primeiro'],['situacao','Situação','Ativos antes dos inativos']];

  return (
    <div className="modal-overlay control-print-overlay" onClick={onClose}>
      <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
        <div className="control-print-header">
          <div className="control-print-title">
            <span className="control-print-icon"><Database size={25} /></span>
            <h3>FILTROS — CADASTRO DE PRODUTOS</h3>
          </div>
          <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
            <X size={28} />
          </button>
        </div>

        <div className="control-print-body">
          <div className="control-print-grid ranking-filter-grid">

            {/* TIPO DE PRODUTO */}
            <section className="control-print-section">
              <div className="control-print-section-title"><Package size={20} /><span>TIPO DE PRODUTO</span></div>
              {tipoOpts.map(([v, label, sub]) => (
                <label key={v} className={`control-print-option ${filters.tipo === v ? 'selected' : ''}`} onClick={() => upd('tipo', v)} style={{ cursor:'pointer' }}>
                  <Package size={26} />
                  <div><strong>{label}</strong><span>{sub}</span></div>
                  <input type="radio" name="cadastroTipo" value={v} checked={filters.tipo === v} onChange={() => upd('tipo', v)} />
                </label>
              ))}
            </section>

            {/* SITUAÇÃO */}
            <section className="control-print-section">
              <div className="control-print-section-title"><Filter size={20} /><span>SITUAÇÃO</span></div>
              {situOpts.map(([v, label, sub]) => (
                <label key={v} className={`control-print-option ${filters.situacao === v ? 'selected' : ''}`} onClick={() => upd('situacao', v)} style={{ cursor:'pointer' }}>
                  <CheckCircle size={26} />
                  <div><strong>{label}</strong><span>{sub}</span></div>
                  <input type="radio" name="cadastroSitu" value={v} checked={filters.situacao === v} onChange={() => upd('situacao', v)} />
                </label>
              ))}
            </section>
          </div>

          {/* ORDENAÇÃO + BUSCA + OPÇÕES */}
          <section className="control-print-section ranking-sellers-section">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

              {/* Ordenação */}
              <div>
                <div className="control-print-section-title" style={{ marginBottom:14 }}><TrendingUp size={20} /><span>ORDENAR POR</span></div>
                {ordenOpts.map(([v, label, sub]) => (
                  <label key={v} className={`control-print-option ${filters.ordenacao === v ? 'selected' : ''}`} onClick={() => upd('ordenacao', v)} style={{ cursor:'pointer', minHeight:56 }}>
                    <TrendingUp size={22} />
                    <div><strong>{label}</strong><span>{sub}</span></div>
                    <input type="radio" name="cadastroOrdem" value={v} checked={filters.ordenacao === v} onChange={() => upd('ordenacao', v)} />
                  </label>
                ))}
              </div>

              {/* Busca + Toggle */}
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <div className="control-print-section-title" style={{ marginBottom:14 }}><Search size={20} /><span>BUSCAR</span></div>
                  <input
                    value={filters.busca}
                    onChange={e => upd('busca', e.target.value)}
                    placeholder="Descrição ou código de barras..."
                    style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #23282d', background:'#0b0e11', color:'#f8fafc', fontSize:13, outline:'none', boxSizing:'border-box' }}
                  />
                </div>

                <div>
                  <div className="control-print-section-title" style={{ marginBottom:14 }}><Package size={20} /><span>OPÇÕES DE EXIBIÇÃO</span></div>
                  <label className={`control-print-option ${filters.exibirCodBarras ? 'selected' : ''}`} onClick={() => upd('exibirCodBarras', !filters.exibirCodBarras)} style={{ cursor:'pointer', minHeight:56 }}>
                    <Database size={22} />
                    <div><strong>Código de Barras</strong><span>{filters.exibirCodBarras ? 'Visível no relatório' : 'Oculto no relatório'}</span></div>
                    <input type="checkbox" checked={!!filters.exibirCodBarras} onChange={() => upd('exibirCodBarras', !filters.exibirCodBarras)} style={{ width:21, height:21, accentColor:'#E31E24' }} />
                  </label>
                </div>
              </div>
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

// ── DREFilterPanel (REL 11) ───────────────────────────────────────────────────
const DREFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => (
  <div className="modal-overlay control-print-overlay" onClick={onClose}>
    <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
      <div className="control-print-header">
        <div className="control-print-title">
          <span className="control-print-icon"><BarChart2 size={25} /></span>
          <h3>FILTROS — DRE — DEMONSTRAÇÃO DO RESULTADO</h3>
        </div>
        <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
          <X size={28} />
        </button>
      </div>

      <div className="control-print-body">
        <div className="control-print-grid ranking-filter-grid">

          {/* VISÃO */}
          <section className="control-print-section">
            <div className="control-print-section-title"><Layers size={20} /><span>VISÃO DO RELATÓRIO</span></div>
            {[
              { v:'Sintética', icon:<BarChart2 size={28}/>, sub:'Totais por grupo' },
              { v:'Analítica', icon:<FileText size={28}/>, sub:'Todas as linhas detalhadas' },
            ].map(({ v, icon, sub }) => (
              <label key={v} className={`control-print-option ${filters.visao === v ? 'selected' : ''}`}>
                {icon}
                <div><strong>{v.toUpperCase()}</strong><span>{sub}</span></div>
                <input type="radio" name="dreVisao" value={v} checked={filters.visao === v}
                  onChange={() => setFilters(f => ({ ...f, visao: v }))} />
              </label>
            ))}
          </section>

          {/* PERÍODO */}
          <section className="control-print-section">
            <div className="control-print-section-title"><Calendar size={20} /><span>PERÍODO</span></div>
            <div className="control-print-date-row">
              <label className="control-print-field">
                <span>DATA INICIAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataInicial}
                    onChange={e => setFilters(f => ({ ...f, dataInicial: e.target.value }))} />
                  <Calendar size={19} />
                </div>
              </label>
              <label className="control-print-field">
                <span>DATA FINAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataFinal}
                    onChange={e => setFilters(f => ({ ...f, dataFinal: e.target.value }))} />
                  <Calendar size={19} />
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* PRÉ-VISUALIZAÇÃO */}
        <div className="control-print-section" style={{ background:'#23272f', borderRadius:6, padding:'10px 14px' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>Pré-visualização</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Receita Bruta</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#4ade80' }}>R$ 1.413.000</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Lucro Bruto</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#4ade80' }}>R$ 334.890</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Lucro Líquido</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#4ade80' }}>R$ 143.535</div>
            </div>
          </div>
        </div>
      </div>

      <div className="control-print-footer">
        <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
          <Printer size={15} /> GERAR IMPRESSÃO
        </button>
      </div>
    </div>
  </div>
);

// ── DREFFilterPanel (REL 12) ──────────────────────────────────────────────────
const DREFFilterPanel = ({ filters, setFilters, onClose, onGenerate }) => (
  <div className="modal-overlay control-print-overlay" onClick={onClose}>
    <div className="control-print-panel ranking-filter-panel" onClick={e => e.stopPropagation()}>
      <div className="control-print-header">
        <div className="control-print-title">
          <span className="control-print-icon"><PiggyBank size={25} /></span>
          <h3>FILTROS — DREF — RESULTADO FINANCEIRO</h3>
        </div>
        <button type="button" className="control-print-close" onClick={onClose} aria-label="Fechar">
          <X size={28} />
        </button>
      </div>

      <div className="control-print-body">
        <div className="control-print-grid ranking-filter-grid">

          {/* MODALIDADE */}
          <section className="control-print-section">
            <div className="control-print-section-title"><CreditCard size={20} /><span>MODALIDADE</span></div>
            {[
              { v:'Todos',          icon:<Wallet size={28}/>,     sub:'Todas as modalidades' },
              { v:'Cartão Débito',  icon:<CreditCard size={28}/>, sub:'Débito à vista' },
              { v:'Cartão Crédito', icon:<CreditCard size={28}/>, sub:'Crédito à vista e parcelado' },
              { v:'PIX',            icon:<Zap size={28}/>,        sub:'PIX e transferências' },
            ].map(({ v, icon, sub }) => (
              <label key={v} className={`control-print-option ${filters.modalidade === v ? 'selected' : ''}`}>
                {icon}
                <div><strong>{v.toUpperCase()}</strong><span>{sub}</span></div>
                <input type="radio" name="drefModalidade" value={v} checked={filters.modalidade === v}
                  onChange={() => setFilters(f => ({ ...f, modalidade: v }))} />
              </label>
            ))}
          </section>

          {/* PERÍODO */}
          <section className="control-print-section">
            <div className="control-print-section-title"><Calendar size={20} /><span>PERÍODO</span></div>
            <div className="control-print-date-row">
              <label className="control-print-field">
                <span>DATA INICIAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataInicial}
                    onChange={e => setFilters(f => ({ ...f, dataInicial: e.target.value }))} />
                  <Calendar size={19} />
                </div>
              </label>
              <label className="control-print-field">
                <span>DATA FINAL</span>
                <div className="control-print-input">
                  <input type="date" value={filters.dataFinal}
                    onChange={e => setFilters(f => ({ ...f, dataFinal: e.target.value }))} />
                  <Calendar size={19} />
                </div>
              </label>
            </div>

            {/* Resumo de taxas */}
            <div style={{ marginTop:16, padding:'10px 12px', background:'#1e2430', borderRadius:8, border:'1px solid #2d3748' }}>
              <div style={{ fontSize:10, color:'#94a3b8', marginBottom:8, letterSpacing:'0.8px' }}>TAXAS ESTIMADAS</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[['Débito','1,9%'],['Crédito','2,5%'],['PIX','Isento']].map(([m,t]) => (
                  <div key={m} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:'#64748b' }}>{m}</span>
                    <span style={{ color:'#fb923c', fontWeight:600 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* PRÉ-VISUALIZAÇÃO */}
        <div className="control-print-section" style={{ background:'#23272f', borderRadius:6, padding:'10px 14px' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>Pré-visualização</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Total Recebimentos</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#4ade80' }}>R$ 1.260.000</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Custo de Taxas</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fb923c' }}>R$ 16.380</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#94a3b8' }}>Saldo Financeiro</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#4ade80' }}>R$ 10.510</div>
            </div>
          </div>
        </div>
      </div>

      <div className="control-print-footer">
        <button type="button" className="btn-secondary control-print-cancel" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary control-print-generate" onClick={onGenerate}>
          <Printer size={15} /> GERAR IMPRESSÃO
        </button>
      </div>
    </div>
  </div>
);

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
const LivrosManager = ({ lmcRegistros, lmcDiario, lmcControle, selectedPeriod, setSelectedPeriod, selectedClient, clients, themeMode }) => {
  const [section, setSection] = useState('movimentacao');

  const sections = [
    { id: 'movimentacao', label: '⛽ Movimentação de Combustíveis' },
    { id: 'fluxo',        label: '💵 Fluxo de Caixa'               },
    { id: 'conta',        label: '🏦 Conta Corrente'                },
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
      {section === 'fluxo' && (
        <FluxoCaixa clients={clients} selectedClient={selectedClient} themeMode={themeMode} />
      )}
      {section === 'conta' && (
        <ContaCorrente clients={clients} selectedClient={selectedClient} themeMode={themeMode} />
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

// ── Imagens de maquininha (foto do device) ─────────────────────────────────
const CT_MAQ_LS_KEY  = 'starvl:ctmaq-v1';
let _ctMaqMem      = null;
let _ctMaqFetching = null;
function _ctMaqCacheRead()  { try { return JSON.parse(localStorage.getItem(CT_MAQ_LS_KEY) || 'null'); } catch { return null; } }
function _ctMaqCacheWrite(d){ try { localStorage.setItem(CT_MAQ_LS_KEY, JSON.stringify(d)); } catch {} }
function _ctMaqCacheSet(d)  { _ctMaqMem = d; _ctMaqCacheWrite(d); }
function _ctMaqApiFetch() {
  if (_ctMaqFetching) return _ctMaqFetching;
  _ctMaqFetching = fetch(`${API_URL}/api/imagens/maquininha`)
    .then(r => r.ok ? r.json() : {}).catch(() => ({}))
    .then(d => { _ctMaqCacheSet(d); _ctMaqFetching = null; return d; });
  return _ctMaqFetching;
}
async function ctMaqImgLoadAll() {
  if (_ctMaqMem !== null) return _ctMaqMem;
  const c = _ctMaqCacheRead();
  if (c) { _ctMaqMem = c; _ctMaqApiFetch(); return c; }
  return _ctMaqApiFetch();
}
async function ctMaqImgSave(id, dataUrl) {
  const compressed = await compressImage(dataUrl);
  const res = await fetch(`${API_URL}/api/imagens/maquininha/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: compressed }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
  _ctMaqCacheSet({ ...(_ctMaqMem||{}), [String(id)]: compressed });
  return compressed;
}
async function ctMaqImgDelete(id) {
  const res = await fetch(`${API_URL}/api/imagens/maquininha/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (_ctMaqMem) { const n = { ..._ctMaqMem }; delete n[String(id)]; _ctMaqCacheSet(n); }
}

// ── Imagens de bandeira/logo do adquirente ──────────────────────────────────
const CT_BAND_LS_KEY  = 'starvl:ctband-v1';
let _ctBandMem      = null;
let _ctBandFetching = null;
function _ctBandCacheRead()  { try { return JSON.parse(localStorage.getItem(CT_BAND_LS_KEY) || 'null'); } catch { return null; } }
function _ctBandCacheWrite(d){ try { localStorage.setItem(CT_BAND_LS_KEY, JSON.stringify(d)); } catch {} }
function _ctBandCacheSet(d)  { _ctBandMem = d; _ctBandCacheWrite(d); }
function _ctBandApiFetch() {
  if (_ctBandFetching) return _ctBandFetching;
  _ctBandFetching = fetch(`${API_URL}/api/imagens/maquininha-band`)
    .then(r => r.ok ? r.json() : {}).catch(() => ({}))
    .then(d => { _ctBandCacheSet(d); _ctBandFetching = null; return d; });
  return _ctBandFetching;
}
async function ctBandImgLoadAll() {
  if (_ctBandMem !== null) return _ctBandMem;
  const c = _ctBandCacheRead();
  if (c) { _ctBandMem = c; _ctBandApiFetch(); return c; }
  return _ctBandApiFetch();
}
async function ctBandImgSave(id, dataUrl) {
  const compressed = await compressImage(dataUrl);
  const res = await fetch(`${API_URL}/api/imagens/maquininha-band/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados: compressed }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||`HTTP ${res.status}`); }
  _ctBandCacheSet({ ...(_ctBandMem||{}), [String(id)]: compressed });
  return compressed;
}
async function ctBandImgDelete(id) {
  const res = await fetch(`${API_URL}/api/imagens/maquininha-band/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (_ctBandMem) { const n = { ..._ctBandMem }; delete n[String(id)]; _ctBandCacheSet(n); }
}

// ── CRUD de usuários do sistema (starvl_users) ─────────────────────────────
async function suLoadAll() {
  const res = await fetch(`${API_URL}/api/starvl-users`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // [{ id, usuario, senha, perfil }]
}
async function suCreate({ usuario, senha, perfil }) {
  const res = await fetch(`${API_URL}/api/starvl-users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha, perfil }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
async function suUpdate(id, { usuario, senha, perfil }) {
  const res = await fetch(`${API_URL}/api/starvl-users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha, perfil }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
async function suDelete(id) {
  const res = await fetch(`${API_URL}/api/starvl-users/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
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

const ConvenienciaManager = ({ themeMode, selectedClient, clients }) => {
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
  // Produtos carregados da API
  const [apiProds, setApiProds]       = useState([]);
  const [loadingConvenio, setLoadingConvenio] = useState(false);
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

  // Repositório de imagens — picker no edit de produto
  const [repoPickerOpen,        setRepoPickerOpen]        = useState(false);
  const [repoPickerFolders,     setRepoPickerFolders]     = useState([]);
  const [repoPickerFolder,      setRepoPickerFolder]      = useState('');
  const [repoPickerImgsByFolder,setRepoPickerImgsByFolder]= useState({});
  const [repoPickerLoading,     setRepoPickerLoading]     = useState(false);
  const [repoPickerSearch,      setRepoPickerSearch]      = useState('');

  const openRepoPicker = async () => {
    setRepoPickerOpen(true);
    setRepoPickerSearch('');
    setRepoPickerImgsByFolder({});
    // Carrega lista de pastas do servidor
    try {
      const r = await fetch(`${API_URL}/api/imagens/_folders`);
      const data = r.ok ? await r.json() : null;
      let folders = DEFAULT_FOLDERS;
      if (data && Object.keys(data).length > 0) {
        folders = Object.entries(data).map(([id, raw]) => {
          try { const p = JSON.parse(raw); return { id, label: p.label||id, emoji: p.emoji||'📦', order: p.order??99 }; }
          catch { return { id, label:id, emoji:'📦', order:99 }; }
        }).sort((a,b) => a.order - b.order || a.label.localeCompare(b.label));
      }
      setRepoPickerFolders(folders);
      setRepoPickerFolder(folders[0]?.id || '');
    } catch {
      setRepoPickerFolders(DEFAULT_FOLDERS);
      setRepoPickerFolder(DEFAULT_FOLDERS[0].id);
    }
  };

  // Carrega imagens da pasta selecionada no picker
  useEffect(() => {
    if (!repoPickerOpen || !repoPickerFolder) return;
    if (repoPickerImgsByFolder[repoPickerFolder] !== undefined) return;
    setRepoPickerLoading(true);
    fetch(`${API_URL}/api/imagens/${repoPickerFolder}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setRepoPickerImgsByFolder(prev => ({ ...prev, [repoPickerFolder]: data })))
      .catch(() => setRepoPickerImgsByFolder(prev => ({ ...prev, [repoPickerFolder]: {} })))
      .finally(() => setRepoPickerLoading(false));
  }, [repoPickerOpen, repoPickerFolder]); // eslint-disable-line react-hooks/exhaustive-deps


  // Resolve empresa a partir do cliente selecionado
  const empresa = useMemo(() => {
    const c = (clients || []).find(cl => cl.nome === selectedClient) || (clients || [])[0];
    return c?.codigoEmpresa || null;
  }, [clients, selectedClient]);

  // Busca produtos da conveniência na API sempre que a empresa mudar
  useEffect(() => {
    if (!empresa) return;
    setLoadingConvenio(true);
    fetch(`${API_URL}/api/estoque/convenio?empresa=${empresa}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        const prods = (data.produtos || []).map(r => ({
          id:     r.cod_produto,
          nome:   r.descricao,
          sub:    r.descricao_grupo || '',
          codigo: r.cod_barra       || '',
          cat:    r.descricao_secao || 'Sem Categoria',
          forn:   '',
          uni:    'UN',
          estoque: r.estoque_produto,
          preco:   r.preco_venda1,
          custo:   r.custo,
          venc:    '',        // sem data de vencimento no DB
          emoji:   '📦',
          cor:     '#94a3b8',
          situacao: r.situacao,
        }));
        setApiProds(prods);
      })
      .catch(() => { /* mantém lista vazia em caso de erro */ })
      .finally(() => setLoadingConvenio(false));
  }, [empresa]);

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
    return apiProds.map(p => {
      const edits = localEdits[p.id] || {};
      const merged = { ...p, ...edits };
      const vencRaw = merged.venc || '';
      const vencDate = vencRaw ? new Date(vencRaw + 'T00:00:00') : null;
      const dias = vencDate && !isNaN(vencDate) ? Math.round((vencDate - today) / 86400000) : null;
      const status = dias === null ? 'ok' : (dias < 0 ? 'vencido' : dias === 0 ? 'vencendo_hoje' : dias <= 7 ? 'prox_vencer' : 'ok');
      return { ...merged, dias, status, valorEstoque: (merged.custo || 0) * (merged.estoque || 0), editImg: productImages[p.id] || null };
    });
  }, [apiProds, localEdits, productImages]);

  const openEdit = useCallback((p) => {
    const merged = { ...p, ...(localEdits[p.id] || {}) };
    setEditProd(merged);
    setEditImg(productImages[p.id] || null);
    setEditForm({
      local:       merged.local  || '',
      marca:       merged.marca  || merged.sub || '',
      desc:        merged.desc   || '',
      forn:        merged.forn   || '',
      controlVenc: merged.controlVenc !== undefined ? merged.controlVenc : false,
      venc:        merged.venc   || '',
      dtFab:       merged.dtFab  || '',
      lote:        merged.lote   || '',
      qtdLote:     String(merged.qtdLote || ''),
    });
  }, [localEdits, productImages]);

  const saveEdit = useCallback(() => {
    if (!editProd) return;
    // Salvar edições de texto/números no localStorage
    setLocalEdits(prev => ({
      ...prev,
      [editProd.id]: {
        local:       editForm.local,
        marca:       editForm.marca,
        desc:        editForm.desc,
        forn:        editForm.forn,
        controlVenc: editForm.controlVenc,
        venc:        editForm.venc,
        dtFab:       editForm.dtFab,
        lote:        editForm.lote,
        qtdLote:     editForm.qtdLote ? parseInt(editForm.qtdLote) : null,
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
    const comPreco   = allProds.filter(p => p.preco > 0);
    const margem     = comPreco.length > 0
      ? comPreco.reduce((s, p) => s + (p.preco - p.custo) / p.preco * 100, 0) / comPreco.length
      : 0;
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
    { label:'OK (Válidos)',          count: sc.ok,      pct: aTotal > 0 ? sc.ok/aTotal*100      : 0, color:'#22c55e' },
    { label:'Próx. Vencer (7 dias)', count: sc.prox,    pct: aTotal > 0 ? sc.prox/aTotal*100    : 0, color:'#f59e0b' },
    { label:'Vencendo Hoje',         count: sc.hoje,    pct: aTotal > 0 ? sc.hoje/aTotal*100    : 0, color:'#fb923c' },
    { label:'Vencidos',              count: sc.vencido, pct: aTotal > 0 ? sc.vencido/aTotal*100 : 0, color:'#ef4444' },
  ];
  const donutBg = pmBuildDonut(donutParts);

  const cats = useMemo(() => ['Todas', ...new Set(apiProds.map(p => p.cat).filter(Boolean))].sort((a,b) => a === 'Todas' ? -1 : a.localeCompare(b)), [apiProds]);
  const fors = useMemo(() => ['Todos', ...new Set(apiProds.map(p => p.forn).filter(Boolean))].sort((a,b) => a === 'Todos' ? -1 : a.localeCompare(b)), [apiProds]);

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
        {loadingConvenio ? (
          <div className="pm-empty" style={{ color:'#64748b' }}>⏳ Carregando produtos...</div>
        ) : !empresa ? (
          <div className="pm-empty" style={{ color:'#64748b' }}>Selecione uma empresa para carregar os produtos.</div>
        ) : filtered.length === 0 ? (
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
                  <td>{p.venc ? fmtDate(p.venc) : <span style={{color:'#475569'}}>—</span>}</td>
                  <td className={`pm-dias ${p.dias !== null ? PM_DIAS_CLS[p.status] : 'pm-dias-ok'}`}>
                    {p.dias !== null ? (p.dias < 0 ? p.dias : p.dias === 0 ? '0' : `+${p.dias}`) : <span style={{color:'#475569'}}>—</span>}
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
                <span>{aTotal > 0 ? ((sc.ok / aTotal)*100).toFixed(0) : 0}%</span>
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
                <span className="pm-exp-pct">({(aTotal > 0 ? (row.count/aTotal)*100 : 0).toFixed(1)}%)</span>
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
                  <div className="pm-edit-img-btns" style={{ flexWrap: 'wrap' }}>
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
                    <button className="pm-edit-img-btn"
                      style={{ background: '#0f1f3a', border: '1px solid #1e3a5f', color: '#60a5fa', flex: '0 0 100%' }}
                      onClick={openRepoPicker}>
                      <FolderOpen size={11} /> REPOSITÓRIO
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
                      <label className="pm-edit-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                        Custo Médio (R$) <Lock size={9} color="#475569" />
                      </label>
                      <input className="pm-edit-input" readOnly value={fmtBRL(editProd.custo)} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                        Preço de Venda (R$) <Lock size={9} color="#475569" />
                      </label>
                      <input className="pm-edit-input" readOnly value={fmtBRL(editProd.preco)} />
                    </div>
                  </div>
                  {(() => {
                    const c = editProd.custo || 0;
                    const v = editProd.preco  || 0.01;
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

              {/* RIGHT: Stock + Venc + Sales */}
              <div className="pm-edit-col">
                <div className="pm-edit-panel">
                  <div className="pm-edit-panel-title"><Database size={12} /> DADOS DE ESTOQUE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                        Estoque Atual <Lock size={9} color="#475569" />
                      </label>
                      <input className="pm-edit-input" readOnly value={`${editProd.estoque} un.`} />
                    </div>
                    <div className="pm-edit-field">
                      <label className="pm-edit-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                        Estoque Mínimo <Lock size={9} color="#475569" />
                      </label>
                      <input className="pm-edit-input" readOnly value={`${editProd.estMin ?? 5} un.`} />
                    </div>
                  </div>
                  <div className="pm-edit-field" style={{ marginTop: 12 }}>
                    <label className="pm-edit-label">Localização no Estoque</label>
                    <input className="pm-edit-input" value={editForm.local} placeholder="Ex: Prateleira A3"
                      onChange={e => setEditForm(f => ({ ...f, local: e.target.value }))} />
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

            {/* ── Vencimento e Lote (full-width) ─────────────────────────── */}
            <div className="pm-edit-panel" style={{ marginTop:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div className="pm-edit-panel-title" style={{ margin:0 }}><Calendar size={12} /> VENCIMENTO E CONTROLE DE LOTE</div>
                <div className="pm-toggle-wrap" style={{ margin:0 }}>
                  <label className="pm-toggle">
                    <input type="checkbox" checked={!!editForm.controlVenc}
                      onChange={e => setEditForm(f => ({ ...f, controlVenc: e.target.checked }))} />
                    <span className="pm-toggle-slider" />
                  </label>
                  <span className="pm-toggle-lbl">Ativar controle de vencimento e lote</span>
                </div>
              </div>

              {editForm.controlVenc ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginTop:16 }}>
                  <div className="pm-edit-field">
                    <label className="pm-edit-label">Data de Fabricação</label>
                    <input className="pm-edit-input" type="date" value={editForm.dtFab}
                      onChange={e => setEditForm(f => ({ ...f, dtFab: e.target.value }))} />
                  </div>
                  <div className="pm-edit-field">
                    <label className="pm-edit-label">Data de Vencimento</label>
                    <input className="pm-edit-input" type="date" value={editForm.venc}
                      onChange={e => setEditForm(f => ({ ...f, venc: e.target.value }))} />
                  </div>
                  <div className="pm-edit-field">
                    <label className="pm-edit-label">Nº do Lote</label>
                    <input className="pm-edit-input" value={editForm.lote} placeholder="Ex: LOT-2026-001"
                      onChange={e => setEditForm(f => ({ ...f, lote: e.target.value }))} />
                  </div>
                  <div className="pm-edit-field">
                    <label className="pm-edit-label">Qtd. do Lote</label>
                    <input className="pm-edit-input" type="number" min="0" value={editForm.qtdLote} placeholder="0"
                      onChange={e => setEditForm(f => ({ ...f, qtdLote: e.target.value }))} />
                  </div>
                </div>
              ) : (
                <p style={{ marginTop:12, fontSize:12, color:'#475569' }}>
                  Ative o controle para registrar datas de fabricação/vencimento e número de lote.
                </p>
              )}
            </div>

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

      {/* ─── REPO PICKER MODAL ─── */}
      {repoPickerOpen && (() => {
        const pickerFolderImgs = repoPickerImgsByFolder[repoPickerFolder] || null;
        const pickerKeys = pickerFolderImgs
          ? Object.keys(pickerFolderImgs).filter(k => !repoPickerSearch || k.toLowerCase().includes(repoPickerSearch.toLowerCase()))
          : [];
        return (
          <div
            style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setRepoPickerOpen(false)}
          >
            <div
              style={{ background:'#141414', border:'1px solid #2a2a2a', borderRadius:16, width:'100%', maxWidth:780, maxHeight:'82vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #222' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:13, color:'#e2e8f0', letterSpacing:1 }}>
                  <FolderOpen size={15} color="#60a5fa" />
                  REPOSITÓRIO DE IMAGENS
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input
                    value={repoPickerSearch}
                    onChange={e => setRepoPickerSearch(e.target.value)}
                    placeholder="Buscar imagem..."
                    style={{ background:'#1e1e1e', border:'1px solid #333', borderRadius:8, padding:'6px 12px', color:'#e2e8f0', fontSize:12, outline:'none', width:170 }}
                  />
                  <button onClick={() => setRepoPickerOpen(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Folder tabs */}
              <div style={{ display:'flex', gap:6, padding:'10px 20px', borderBottom:'1px solid #1e1e1e', flexWrap:'wrap', background:'#0f0f0f' }}>
                {repoPickerFolders.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setRepoPickerFolder(f.id); setRepoPickerSearch(''); }}
                    style={{
                      display:'flex', alignItems:'center', gap:5,
                      padding:'5px 13px', borderRadius:7, cursor:'pointer', fontSize:11,
                      fontWeight: repoPickerFolder===f.id ? 700 : 400,
                      border: repoPickerFolder===f.id ? '1px solid rgba(96,165,250,0.6)' : '1px solid #252525',
                      background: repoPickerFolder===f.id ? 'rgba(96,165,250,0.1)' : '#1a1a1a',
                      color: repoPickerFolder===f.id ? '#60a5fa' : '#64748b',
                      transition:'all 0.15s',
                    }}
                  >
                    <span>{f.emoji}</span> {f.label}
                    {repoPickerImgsByFolder[f.id] && (
                      <span style={{ fontSize:10, background:'#252525', color:'#475569', borderRadius:8, padding:'0 5px', marginLeft:2 }}>
                        {Object.keys(repoPickerImgsByFolder[f.id]).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div style={{ overflowY:'auto', padding:20, flex:1 }}>
                {repoPickerLoading ? (
                  <div style={{ textAlign:'center', color:'#475569', padding:40, fontSize:13 }}>⏳ Carregando...</div>
                ) : pickerFolderImgs === null ? (
                  <div style={{ textAlign:'center', color:'#475569', padding:40, fontSize:13 }}>⏳ Carregando...</div>
                ) : Object.keys(pickerFolderImgs).length === 0 ? (
                  <div style={{ textAlign:'center', color:'#475569', padding:40, fontSize:13 }}>
                    Nenhuma imagem em <strong>{repoPickerFolders.find(f=>f.id===repoPickerFolder)?.label}</strong>.<br />
                    <span style={{ fontSize:11 }}>Acesse Configurações → Repositório de Imagens para adicionar.</span>
                  </div>
                ) : pickerKeys.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#475569', padding:40, fontSize:13 }}>Nenhuma imagem encontrada para "{repoPickerSearch}".</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:14 }}>
                    {pickerKeys.map(name => (
                      <div
                        key={name}
                        onClick={() => { setEditImg(pickerFolderImgs[name]); setRepoPickerOpen(false); toast('Imagem selecionada do repositório!', 'success'); }}
                        style={{ cursor:'pointer', borderRadius:10, border:'2px solid #2a2a2a', overflow:'hidden', background:'#1a1a1a', transition:'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#60a5fa'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                      >
                        <div style={{ width:'100%', aspectRatio:'1/1', overflow:'hidden', background:'#111' }}>
                          <img src={pickerFolderImgs[name]} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                        </div>
                        <div style={{ padding:'6px 8px', fontSize:10, color:'#94a3b8', textAlign:'center', wordBreak:'break-all', lineHeight:1.3 }}>
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
        : <ConvenienciaManager themeMode={themeMode} selectedClient={selectedClient} clients={clients} />
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
    if (!window.confirm(`Deseja remover o usuário "${user.name}"?`)) return;
    suDelete(userId)
      .then(() => {
        setAdminUsers(prev => prev.filter(u => u.id !== userId));
        toast('Usuário removido.', 'info');
      })
      .catch(err => toast(`Erro ao remover: ${err.message}`, 'error'));
  };

  const handleSave = (formData, imgData) => {
    const perfil = formData.role === 'Administrador' ? 'admin' : 'user';
    const usuario = formData.name.trim();
    const senha   = formData.senha?.trim() || '';

    if (modalMode === 'create') {
      if (!senha) { toast('Defina uma senha para o novo usuário.', 'warn'); return; }
      suCreate({ usuario, senha, perfil })
        .then(created => {
          setAdminUsers(prev => [...prev, created]);
          toast('✅ Usuário criado!', 'success');
          // foto
          if (imgData) {
            userImgSave(created.id, imgData)
              .then(c => setUserImages(prev => ({ ...prev, [String(created.id)]: c })))
              .catch(err => toast(`Erro ao salvar foto: ${err.message}`, 'error'));
          }
        })
        .catch(err => toast(`Erro ao criar usuário: ${err.message}`, 'error'));
    } else {
      const savedId = selectedUser.id;
      suUpdate(savedId, { usuario, senha, perfil })
        .then(updated => {
          setAdminUsers(prev => prev.map(u => u.id === savedId ? updated : u));
          toast('✅ Usuário atualizado!', 'success');
          // foto
          if (imgData) {
            userImgSave(savedId, imgData)
              .then(c => setUserImages(prev => ({ ...prev, [String(savedId)]: c })))
              .catch(err => toast(`Erro ao salvar foto: ${err.message}`, 'error'));
          } else if (userImages[String(savedId)] && imgData === null) {
            userImgDelete(savedId)
              .then(() => setUserImages(prev => { const n={...prev}; delete n[String(savedId)]; return n; }))
              .catch(err => toast(`Erro ao remover foto: ${err.message}`, 'error'));
          }
        })
        .catch(err => toast(`Erro ao atualizar usuário: ${err.message}`, 'error'));
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
  // ── Navegação principal ────────────────────────────────────────────────────
  const [paramTab, setParamTab] = useState('repositorio');

  // ── Pastas dinâmicas ──────────────────────────────────────────────────────
  const [repoFolders,    setRepoFolders]    = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  // Modal de pasta: null | { mode:'create' } | { mode:'edit', folder:{id,label,emoji} }
  const [folderModal,    setFolderModal]    = useState(null);
  const [folderForm,     setFolderForm]     = useState({ label:'', emoji:'📦' });
  const [folderSaving,   setFolderSaving]   = useState(false);
  const [folderDeleting, setFolderDeleting] = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null); // folder a confirmar exclusão

  // Carrega pastas do servidor
  useEffect(() => {
    setFoldersLoading(true);
    fetch(`${API_URL}/api/imagens/_folders`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || Object.keys(data).length === 0) {
          // Nenhuma pasta salva: seed com as defaults
          setRepoFolders(DEFAULT_FOLDERS);
          setRepoFolder(DEFAULT_FOLDERS[0].id);
        } else {
          const folders = Object.entries(data).map(([id, raw]) => {
            try { const p = JSON.parse(raw); return { id, label: p.label || id, emoji: p.emoji || '📦', order: p.order ?? 99 }; }
            catch { return { id, label: id, emoji: '📦', order: 99 }; }
          }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
          setRepoFolders(folders);
          setRepoFolder(f => folders.find(x => x.id === f) ? f : folders[0]?.id || '');
        }
      })
      .catch(() => { setRepoFolders(DEFAULT_FOLDERS); setRepoFolder(DEFAULT_FOLDERS[0].id); })
      .finally(() => setFoldersLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFolderToApi = async (id, label, emoji, order) => {
    const res = await fetch(`${API_URL}/api/imagens/_folders/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dados: JSON.stringify({ label, emoji, order }) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };

  const handleSaveFolder = async () => {
    const label = folderForm.label.trim();
    if (!label) return;
    setFolderSaving(true);
    try {
      if (folderModal.mode === 'create') {
        const id = slugify(label) || `pasta_${Date.now()}`;
        if (repoFolders.some(f => f.id === id)) {
          toast('Já existe uma pasta com esse nome.', 'warn'); setFolderSaving(false); return;
        }
        const order = repoFolders.length;
        await saveFolderToApi(id, label, folderForm.emoji, order);
        const newFolder = { id, label, emoji: folderForm.emoji, order };
        setRepoFolders(prev => [...prev, newFolder]);
        setRepoFolder(id);
        toast(`Pasta "${label}" criada!`, 'success');
      } else {
        // edit — mantém mesmo id (imagens ficam intactas)
        const { id, order } = folderModal.folder;
        await saveFolderToApi(id, label, folderForm.emoji, order);
        setRepoFolders(prev => prev.map(f => f.id === id ? { ...f, label, emoji: folderForm.emoji } : f));
        toast(`Pasta atualizada!`, 'success');
      }
      setFolderModal(null);
    } catch (err) {
      toast(`Erro ao salvar pasta: ${err.message}`, 'error');
    }
    setFolderSaving(false);
  };

  const handleDeleteFolder = async (folder) => {
    setFolderDeleting(folder.id);
    try {
      await fetch(`${API_URL}/api/imagens/_folders/${encodeURIComponent(folder.id)}`, { method: 'DELETE' });
      const updated = repoFolders.filter(f => f.id !== folder.id);
      setRepoFolders(updated);
      if (repoFolder === folder.id) setRepoFolder(updated[0]?.id || '');
      setDeleteConfirm(null);
      toast(`Pasta "${folder.label}" removida.`, 'success');
    } catch (err) {
      toast(`Erro ao remover pasta: ${err.message}`, 'error');
    }
    setFolderDeleting(null);
  };

  // ── Repositório de Imagens ─────────────────────────────────────────────────
  const [repoFolder,    setRepoFolder]    = useState('');
  const [repoImgs,      setRepoImgs]      = useState({});
  const [repoLoading,   setRepoLoading]   = useState(false);
  const [repoUploading, setRepoUploading] = useState(false);
  const [repoNewName,   setRepoNewName]   = useState('');
  const [repoDeleting,  setRepoDeleting]  = useState(null);
  const repoFileRef = useRef(null);

  useEffect(() => {
    if (paramTab !== 'repositorio' || !repoFolder) return;
    if (repoImgs[repoFolder] !== undefined) return;
    setRepoLoading(true);
    fetch(`${API_URL}/api/imagens/${repoFolder}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setRepoImgs(prev => ({ ...prev, [repoFolder]: data })))
      .catch(() => setRepoImgs(prev => ({ ...prev, [repoFolder]: {} })))
      .finally(() => setRepoLoading(false));
  }, [paramTab, repoFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  const folderImgs = repoFolder ? (repoImgs[repoFolder] ?? null) : null;
  const activeFolder = repoFolders.find(f => f.id === repoFolder);

  const handleRepoUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !repoFolder) return;
    const name = (repoNewName.trim() || file.name.replace(/\.[^.]+$/, '')).replace(/\s+/g, '_').toLowerCase();
    setRepoUploading(true);
    try {
      const reader = new FileReader();
      const raw = await new Promise((res, rej) => { reader.onload = ev => res(ev.target.result); reader.onerror = rej; reader.readAsDataURL(file); });
      const compressed = await compressImage(raw, 900, 0.82);
      const res = await fetch(`${API_URL}/api/imagens/${repoFolder}/${encodeURIComponent(name)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados: compressed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRepoImgs(prev => ({ ...prev, [repoFolder]: { ...(prev[repoFolder] || {}), [name]: compressed } }));
      setRepoNewName('');
      toast(`Imagem "${name}" adicionada em ${activeFolder?.label || repoFolder}!`, 'success');
    } catch (err) { toast(`Erro ao enviar imagem: ${err.message}`, 'error'); }
    setRepoUploading(false);
  };

  const handleRepoDelete = async (name) => {
    setRepoDeleting(name);
    try {
      const res = await fetch(`${API_URL}/api/imagens/${repoFolder}/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRepoImgs(prev => { const f = { ...(prev[repoFolder] || {}) }; delete f[name]; return { ...prev, [repoFolder]: f }; });
      toast(`Imagem "${name}" removida.`, 'success');
    } catch (err) { toast(`Erro ao remover: ${err.message}`, 'error'); }
    setRepoDeleting(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const mainTabs = [
    { id: 'repositorio', label: '📁 Repositório de Imagens' },
    ...(isAdmin ? [{ id: 'clientes', label: '🗄️ Database Conectada' }] : []),
  ];

  return (
    <div className="page-content">
      {/* ── Barra de abas principal ─────────────────────────────────────── */}
      <div className="estoque-tab-bar" style={{ marginBottom: 20 }}>
        <div className="vp-toggle-group">
          {mainTabs.map(t => (
            <button key={t.id} type="button"
              className={`vp-period-btn vp-secao-btn${paramTab === t.id ? ' active' : ''}`}
              onClick={() => setParamTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA: Repositório de Imagens ─────────────────────────────────── */}
      {paramTab === 'repositorio' && (
        <div className="params-section-block">
          <div className="params-section-header">
            <FolderOpen size={17} className="params-section-icon" />
            <span>REPOSITÓRIO DE IMAGENS</span>
            <div className="params-section-line" />
          </div>
          <p style={{ fontSize:12, color:'#64748b', marginBottom:16, marginTop:0 }}>
            Organize as imagens por categoria. Elas ficarão disponíveis nos cadastros de produtos de conveniência.
          </p>

          {/* ── Pastas ─────────────────────────────────────────────────── */}
          {foldersLoading ? (
            <div style={{ color:'#475569', fontSize:12, padding:'8px 0' }}>⏳ Carregando pastas...</div>
          ) : (
            <div style={{ marginBottom:20 }}>
              {/* Linha de header: título + botão Nova Pasta */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'1px', textTransform:'uppercase' }}>
                  Pastas ({repoFolders.length})
                </span>
                <button type="button"
                  onClick={() => { setFolderForm({ label:'', emoji:'📦' }); setFolderModal({ mode:'create' }); }}
                  style={{
                    display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                    borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                    border:'1px solid rgba(227,30,36,0.5)', background:'rgba(227,30,36,0.08)',
                    color:'#E31E24', transition:'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(227,30,36,0.18)'; e.currentTarget.style.borderColor='#E31E24'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(227,30,36,0.08)'; e.currentTarget.style.borderColor='rgba(227,30,36,0.5)'; }}
                >
                  <Plus size={14} /> Nova Pasta
                </button>
              </div>

              {/* Pills das pastas */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                {repoFolders.map(f => (
                  <div key={f.id} style={{
                    display:'inline-flex', alignItems:'center',
                    borderRadius:9,
                    border: repoFolder===f.id ? '1px solid rgba(227,30,36,0.6)' : '1px solid #2a2a2a',
                    background: repoFolder===f.id ? 'rgba(227,30,36,0.1)' : '#1a1a1a',
                    overflow:'hidden', transition:'all 0.18s',
                  }}>
                    {/* Área clicável da pasta */}
                    <button type="button" onClick={() => setRepoFolder(f.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:7,
                        padding:'8px 10px 8px 12px', cursor:'pointer',
                        fontSize:12, fontWeight: repoFolder===f.id ? 700 : 400,
                        background:'transparent', border:'none',
                        color: repoFolder===f.id ? '#E31E24' : '#94a3b8',
                        transition:'color 0.18s',
                      }}>
                      <span style={{ fontSize:15 }}>{f.emoji}</span>
                      {f.label}
                      {repoImgs[f.id] !== undefined && (
                        <span style={{
                          fontSize:10, fontWeight:700,
                          background: repoFolder===f.id ? 'rgba(227,30,36,0.2)' : '#252525',
                          color: repoFolder===f.id ? '#E31E24' : '#64748b',
                          borderRadius:10, padding:'1px 6px',
                        }}>{Object.keys(repoImgs[f.id]).length}</span>
                      )}
                    </button>
                    {/* Separador */}
                    <div style={{ width:1, height:20, background: repoFolder===f.id ? 'rgba(227,30,36,0.3)' : '#2a2a2a' }} />
                    {/* Botão editar */}
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setFolderForm({ label:f.label, emoji:f.emoji }); setFolderModal({ mode:'edit', folder:f }); }}
                      title="Editar pasta"
                      style={{ background:'transparent', border:'none', padding:'6px 7px', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', transition:'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color='#94a3b8'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='#64748b'; }}
                    >
                      <Edit2 size={12} />
                    </button>
                    {/* Botão excluir */}
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(f); }}
                      title="Excluir pasta"
                      style={{ background:'transparent', border:'none', padding:'6px 7px', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', transition:'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='#64748b'; }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {repoFolders.length === 0 && (
                  <span style={{ fontSize:12, color:'#334155', fontStyle:'italic' }}>
                    Nenhuma pasta criada. Clique em "Nova Pasta" para começar.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Cabeçalho da pasta ativa + upload ─────────────────────── */}
          {activeFolder && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>{activeFolder.emoji}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', letterSpacing:'0.5px' }}>{activeFolder.label}</span>
                {folderImgs && (
                  <span style={{ fontSize:11, color:'#475569' }}>
                    — {Object.keys(folderImgs).length} {Object.keys(folderImgs).length === 1 ? 'imagem' : 'imagens'}
                  </span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <input type="text" value={repoNewName} onChange={e => setRepoNewName(e.target.value)}
                  placeholder="Nome da imagem (opcional)"
                  style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, padding:'8px 13px', color:'#e2e8f0', fontSize:12, outline:'none', width:190 }}
                />
                <input ref={repoFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleRepoUpload} />
                <button type="button" className="btn-primary"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', fontSize:12 }}
                  onClick={() => repoFileRef.current?.click()} disabled={repoUploading}>
                  <ImagePlus size={14} />
                  {repoUploading ? 'ENVIANDO...' : 'ADICIONAR'}
                </button>
              </div>
            </div>
          )}

          {/* ── Grade de imagens ───────────────────────────────────────── */}
          {!activeFolder ? (
            <div style={{ textAlign:'center', color:'#334155', padding:48, fontSize:13, border:'1px dashed #2a2a2a', borderRadius:12 }}>
              Nenhuma pasta criada ainda.<br />
              <span style={{ fontSize:11 }}>Clique em "Nova Pasta" acima para começar.</span>
            </div>
          ) : folderImgs === null || repoLoading ? (
            <div style={{ textAlign:'center', color:'#475569', padding:48, fontSize:13 }}>⏳ Carregando...</div>
          ) : Object.keys(folderImgs).length === 0 ? (
            <div style={{ textAlign:'center', color:'#334155', padding:48, fontSize:13, border:'1px dashed #2a2a2a', borderRadius:12 }}>
              Nenhuma imagem em <strong style={{ color:'#64748b' }}>{activeFolder.label}</strong> ainda.<br />
              <span style={{ fontSize:11 }}>Use o botão ADICIONAR para enviar a primeira imagem.</span>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:14 }}>
              {Object.entries(folderImgs).map(([name, dataUrl]) => (
                <div key={name} style={{ borderRadius:10, border:'1px solid #2a2a2a', overflow:'hidden', background:'#141414' }}>
                  <div style={{ width:'100%', aspectRatio:'1/1', overflow:'hidden', background:'#0a0a0a' }}>
                    <img src={dataUrl} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </div>
                  <div style={{ padding:'7px 8px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                    <span style={{ fontSize:10, color:'#94a3b8', wordBreak:'break-all', lineHeight:1.3, flex:1 }}>{name}</span>
                    <button type="button" onClick={() => handleRepoDelete(name)} disabled={repoDeleting===name}
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:repoDeleting===name?'#475569':'#ef4444', padding:'2px', display:'flex', flexShrink:0 }}
                      title={`Remover "${name}"`}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: Database Conectada ──────────────────────────────────────── */}
      {paramTab === 'clientes' && isAdmin && (
        <div className="params-section-block">
          <div className="params-section-header">
            <Database size={17} className="params-section-icon" />
            <span>DATABASE CONECTADA</span>
            <div className="params-section-line" />
          </div>
          <div className="params-admin-section">
            <AdminPanel clients={clients} setClients={setClients} />
          </div>
        </div>
      )}

      {/* ── Modal criar / editar pasta ──────────────────────────────────── */}
      {folderModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setFolderModal(null)}>
          <div style={{ background:'#141414', border:'1px solid #2a2a2a', borderRadius:14, width:'100%', maxWidth:420, padding:28 }}
            onClick={e => e.stopPropagation()}>
            {/* Cabeçalho */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', letterSpacing:'0.5px' }}>
                {folderModal.mode === 'create' ? '+ Nova Pasta' : '✏️ Editar Pasta'}
              </span>
              <button onClick={() => setFolderModal(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', display:'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Nome */}
            <label style={{ fontSize:11, color:'#64748b', letterSpacing:'0.8px', display:'block', marginBottom:6 }}>NOME DA PASTA</label>
            <input
              value={folderForm.label}
              onChange={e => setFolderForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Ex: Salgadinhos, Bebidas Geladas..."
              autoFocus
              style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, padding:'10px 14px', color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:20 }}
            />

            {/* Emoji */}
            <label style={{ fontSize:11, color:'#64748b', letterSpacing:'0.8px', display:'block', marginBottom:8 }}>ÍCONE</label>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>{folderForm.emoji}</span>
              <input
                value={folderForm.emoji}
                onChange={e => setFolderForm(f => ({ ...f, emoji: e.target.value.trim().slice(0, 2) || '📦' }))}
                style={{ width:70, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, padding:'8px', color:'#e2e8f0', fontSize:18, outline:'none', textAlign:'center' }}
                placeholder="📦"
              />
              <span style={{ fontSize:11, color:'#475569' }}>ou escolha abaixo</span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:24 }}>
              {FOLDER_EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => setFolderForm(f => ({ ...f, emoji: em }))}
                  style={{
                    fontSize:18, lineHeight:1, padding:'6px 8px', borderRadius:7, cursor:'pointer',
                    border: folderForm.emoji===em ? '2px solid #E31E24' : '1px solid #2a2a2a',
                    background: folderForm.emoji===em ? 'rgba(227,30,36,0.12)' : '#1a1a1a',
                    transition:'all 0.12s',
                  }}>
                  {em}
                </button>
              ))}
            </div>

            {/* Ações */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={() => setFolderModal(null)}
                style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #2a2a2a', background:'transparent', color:'#94a3b8', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveFolder} disabled={folderSaving || !folderForm.label.trim()}
                style={{ padding:'9px 22px', borderRadius:8, border:'none', background:folderForm.label.trim()?'#E31E24':'#3a3a3a', color:'#fff', fontSize:12, fontWeight:700, cursor:folderForm.label.trim()?'pointer':'not-allowed' }}>
                {folderSaving ? 'Salvando...' : folderModal.mode === 'create' ? 'Criar Pasta' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmação de exclusão de pasta ─────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background:'#141414', border:'1px solid #3a3a3a', borderRadius:14, width:'100%', maxWidth:360, padding:28 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:700, color:'#f87171', marginBottom:12 }}>⚠️ Excluir Pasta</div>
            <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6, marginBottom:22 }}>
              Tem certeza que deseja excluir a pasta <strong style={{ color:'#e2e8f0' }}>"{deleteConfirm.label}"</strong>?<br />
              <span style={{ fontSize:11, color:'#64748b' }}>As imagens dentro dela não serão apagadas do servidor, mas a pasta deixará de aparecer.</span>
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={() => setDeleteConfirm(null)}
                style={{ padding:'9px 20px', borderRadius:8, border:'1px solid #2a2a2a', background:'transparent', color:'#94a3b8', fontSize:12, cursor:'pointer' }}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleDeleteFolder(deleteConfirm)} disabled={!!folderDeleting}
                style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {folderDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
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
        {/* DATABASE CONECTADA */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Database size={18} />
              <span>DATABASE CONECTADA</span>
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
            <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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
            <img src="/logo-starvl.png" alt="STARVL" style="width:90px;height:auto;object-fit:contain;margin-right:14px;flex-shrink:0" />
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

// ── Auditoria ──────────────────────────────────────────────────────────────
function auditFmtBRL(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

const MODULO_BADGE = { CAIXA: 'mod-caixa', VENDA: 'mod-venda', FISCAL: 'mod-fiscal' };
const ACAO_BADGE = { 'INCLUSÃO': 'acao-inclusao', 'ALTERAÇÃO': 'acao-alteracao', 'EXCLUSÃO': 'acao-exclusao', 'CANCELAMENTO': 'acao-cancelamento' };
const OP_BADGE = {
  'SANGRIA':            'op-sangria',
  'SUPRIMENTO':         'op-suprimento',
  'PAGAMENTO':          'op-pagamento',
  'EMPRÉSTIMO':         'op-emprestimo',
  'CANCELAMENTO':       'op-cancelamento',
  'LIBERAÇÃO DE VENDA': 'op-liberacao',
  'VENDA SEM FISCAL':   'op-semfiscal',
  'OUTRA ENTRADA':      'op-outra-entrada',
  'OUTRA SAÍDA':        'op-outra-saida',
};
const KPI_CLASS = (m, o) => {
  if (m === 'CAIXA') {
    if (o === 'SANGRIA')     return 'caixa-sangria';
    if (o === 'SUPRIMENTO')  return 'caixa-suprimento';
    if (o === 'PAGAMENTO')   return 'caixa-pagamento';
    return 'default';
  }
  if (m === 'VENDA') {
    if (o.includes('LIBERAL')) return 'venda-liberacao';
    if (o === 'CANCELAMENTO')  return 'venda-cancelamento';
    return 'default';
  }
  if (m === 'FISCAL') return 'fiscal';
  return 'default';
};

const Auditoria = ({ themeMode }) => {
  const today = todayISO();
  const [tab, setTab]             = useState('log');
  const [dataIni, setDataIni]     = useState(today);
  const [dataFim, setDataFim]     = useState(today);
  const [usuario, setUsuario]     = useState('');
  const [modulo, setModulo]       = useState('');
  const [tipoAcao, setTipoAcao]   = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const searchTimer = useRef(null);

  // Alertas state
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertas, setAlertas]               = useState(null);
  const [horaInicio, setHoraInicio]         = useState(6);
  const [horaFim, setHoraFim]               = useState(23);
  const [limiteLib, setLimiteLib]           = useState(500);
  const [limiteDesc, setLimiteDesc]         = useState(100);

  // Histórico (Alterações & Exclusões) state
  const [histLoading, setHistLoading]   = useState(false);
  const [histData, setHistData]         = useState(null);
  const [histPage, setHistPage]         = useState(1);
  const [histTipo, setHistTipo]         = useState('');
  const [histExpandId, setHistExpandId] = useState(null);

  const fetchData = useCallback((p = page) => {
    setLoading(true);
    const params = new URLSearchParams({
      data_ini: dataIni, data_fim: dataFim, page: p, limit: 50,
    });
    if (usuario)  params.set('usuario', usuario);
    if (modulo)   params.set('modulo', modulo);
    if (tipoAcao) params.set('tipo_acao', tipoAcao);
    if (search)   params.set('search', search);
    fetch(`${API_URL}/api/auditoria?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dataIni, dataFim, usuario, modulo, tipoAcao, search, page]);

  const fetchAlertas = useCallback(() => {
    setAlertasLoading(true);
    const params = new URLSearchParams({
      data_ini: dataIni, data_fim: dataFim,
      hora_inicio: horaInicio, hora_fim: horaFim,
      limite_liberacao: limiteLib, limite_desconto: limiteDesc,
    });
    fetch(`${API_URL}/api/auditoria/alertas?${params}`)
      .then(r => r.json())
      .then(d => { setAlertas(d); setAlertasLoading(false); })
      .catch(() => setAlertasLoading(false));
  }, [dataIni, dataFim, horaInicio, horaFim, limiteLib, limiteDesc]);

  const fetchHistorico = useCallback((p = histPage) => {
    setHistLoading(true);
    const params = new URLSearchParams({ data_ini: dataIni, data_fim: dataFim, page: p, limit: 50 });
    if (histTipo) params.set('tipo_acao', histTipo);
    if (usuario)  params.set('usuario', usuario);
    fetch(`${API_URL}/api/auditoria/historico?${params}`)
      .then(r => r.json())
      .then(d => { setHistData(d); setHistLoading(false); })
      .catch(() => setHistLoading(false));
  }, [dataIni, dataFim, histTipo, usuario, histPage]);

  useEffect(() => { fetchData(1); setPage(1); }, [dataIni, dataFim, usuario, modulo, tipoAcao]);
  useEffect(() => { if (tab === 'alertas') fetchAlertas(); }, [tab, dataIni, dataFim]);
  useEffect(() => { if (tab === 'historico') { setHistPage(1); fetchHistorico(1); } }, [tab, dataIni, dataFim, histTipo, usuario]);

  const handleSearchChange = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchData(1); }, 400);
  };

  const goPage = (p) => { setPage(p); fetchData(p); };

  const exportCSV = () => {
    if (!data?.items?.length) return;
    const cols = ['dataHoraFmt','usuario','tipoAcao','modulo','operacao','direcao','valor','referencia','detalhe'];
    const header = ['Data/Hora','Usuário','Tipo de Ação','Módulo','Operação','Direção','Valor','Referência','Detalhe'];
    const rows = data.items.map(r => cols.map(c => {
      const v = r[c];
      if (v == null) return '';
      if (c === 'valor') return String(v).replace('.', ',');
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(';'));
    const csv = [header.join(';'), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `auditoria_${dataIni}_${dataFim}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const { items = [], pagination = {}, stats = [], usuarios = [] } = data || {};
  const { total = 0, pages = 1 } = pagination;

  const pagesArray = () => {
    const arr = [];
    const p = page, max = pages;
    if (max <= 7) for (let i = 1; i <= max; i++) arr.push(i);
    else {
      arr.push(1);
      if (p > 3) arr.push('...');
      for (let i = Math.max(2, p - 1); i <= Math.min(max - 1, p + 1); i++) arr.push(i);
      if (p < max - 2) arr.push('...');
      arr.push(max);
    }
    return arr;
  };

  return (
    <div className="audit-wrap">
      {/* Header */}
      <div className="audit-header">
        <div className="audit-header-left">
          <ShieldCheck size={22} color="#60a5fa" />
          <div>
            <div className="audit-title">Auditoria de Ações</div>
            <div className="audit-subtitle">Rastreamento completo de movimentos e operações do sistema</div>
          </div>
        </div>
        <div className="audit-header-actions">
          {tab === 'log' && <>
            <button className={`audit-refresh-btn${loading ? ' spinning' : ''}`} onClick={() => { setPage(1); fetchData(1); }}>
              <RefreshCw size={13} /> Atualizar
            </button>
            <button className="audit-export-btn" onClick={exportCSV}>
              <Download size={13} /> Exportar CSV
            </button>
          </>}
          {tab === 'alertas' && (
            <button className={`audit-refresh-btn${alertasLoading ? ' spinning' : ''}`} onClick={fetchAlertas}>
              <RefreshCw size={13} /> Atualizar
            </button>
          )}
          {tab === 'historico' && (
            <button className={`audit-refresh-btn${histLoading ? ' spinning' : ''}`} onClick={() => fetchHistorico(histPage)}>
              <RefreshCw size={13} /> Atualizar
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="audit-tabs">
        <button className={`audit-tab${tab === 'log' ? ' active' : ''}`} onClick={() => setTab('log')}>
          <Database size={14} /> Log de Ações
        </button>
        <button className={`audit-tab${tab === 'alertas' ? ' active' : ''}`} onClick={() => setTab('alertas')}>
          <AlertTriangle size={14} /> Alertas & Anomalias
          {alertas && (alertas.fora_horario?.length + alertas.liberacoes_altas?.length) > 0 && (
            <span className="audit-tab-badge">
              {alertas.fora_horario.length + alertas.liberacoes_altas.length}
            </span>
          )}
        </button>
        <button className={`audit-tab${tab === 'historico' ? ' active' : ''}`} onClick={() => setTab('historico')}>
          <History size={14} /> Alterações & Exclusões
          {histData && histData.pagination?.total > 0 && (
            <span className="audit-tab-badge" style={{ background: '#f97316' }}>
              {histData.pagination.total}
            </span>
          )}
        </button>
      </div>

      {/* Filters (shared) */}
      <div className="audit-filters">
        <div className="audit-filter-group">
          <span className="audit-filter-label">De</span>
          <input type="date" className="audit-filter-input" value={dataIni}
            onChange={e => { setDataIni(e.target.value); setPage(1); }} />
        </div>
        <div className="audit-filter-group">
          <span className="audit-filter-label">Até</span>
          <input type="date" className="audit-filter-input" value={dataFim}
            onChange={e => { setDataFim(e.target.value); setPage(1); }} />
        </div>
        <div className="audit-filter-divider" />
        <div className="audit-filter-group">
          <UserCheck size={13} color="#64748b" />
          <select className="audit-filter-select" value={usuario}
            onChange={e => { setUsuario(e.target.value); setPage(1); }}>
            <option value="">Todos usuários</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="audit-filter-group">
          <Tag size={13} color="#64748b" />
          <select className="audit-filter-select" value={modulo}
            onChange={e => { setModulo(e.target.value); setPage(1); }}>
            <option value="">Todos módulos</option>
            <option value="CAIXA">Caixa</option>
            <option value="VENDA">Venda</option>
            <option value="FISCAL">Fiscal</option>
          </select>
        </div>
        <div className="audit-filter-group">
          <Activity size={13} color="#64748b" />
          <select className="audit-filter-select" value={tipoAcao}
            onChange={e => { setTipoAcao(e.target.value); setPage(1); }}>
            <option value="">Todas as ações</option>
            <option value="INCLUSÃO">Inclusão</option>
            <option value="CANCELAMENTO">Cancelamento</option>
            <option value="ALTERAÇÃO">Alteração</option>
            <option value="EXCLUSÃO">Exclusão</option>
          </select>
        </div>
        <div className="audit-filter-divider" />
        <div className="audit-filter-group">
          <Search size={13} color="#64748b" />
          <input type="search" className="audit-filter-input" placeholder="Buscar usuário, detalhe..."
            value={search} onChange={e => handleSearchChange(e.target.value)} />
        </div>
      </div>

      {tab === 'log' && <>
      {/* KPI summary */}
      {stats.length > 0 && (
        <div className="audit-kpis">
          {stats.map(s => (
            <div key={`${s.modulo}-${s.operacao}`} className={`audit-kpi ${KPI_CLASS(s.modulo, s.operacao)}`}>
              <div className="audit-kpi-label">{s.modulo} · {s.operacao}</div>
              <div className="audit-kpi-value">{s.qtd.toLocaleString('pt-BR')}</div>
              <div className="audit-kpi-sub">
                {s.totalValor > 0 ? auditFmtBRL(s.totalValor) : 'sem valor'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="audit-table-wrap">
        <div className="audit-table-header-bar">
          <span className="audit-table-info">
            {loading ? 'Carregando...' : (
              <>Exibindo <strong>{items.length}</strong> de <strong>{total.toLocaleString('pt-BR')}</strong> registros</>
            )}
          </span>
          <span className="audit-table-info" style={{ fontSize: 11 }}>
            Clique em uma linha para ver detalhes
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div className="audit-loading-overlay">
            <RefreshCw size={16} style={{ animation: 'spin .7s linear infinite' }} />
            Carregando registros...
          </div>
        ) : items.length === 0 ? (
          <div className="audit-empty">
            <ShieldCheck size={40} className="audit-empty-icon" />
            <div className="audit-empty-text">Nenhum registro encontrado para o período e filtros selecionados.</div>
          </div>
        ) : (
          <div className="audit-table-scroll">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: 24 }} />
                  <th>Data / Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Módulo</th>
                  <th>Operação</th>
                  <th>Referência</th>
                  <th>Detalhe</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isExp = expandedId === item.id;
                  const [datePart, timePart] = (item.dataHoraFmt || '').split(' ');
                  const isEntrada = item.direcao === 'ENTRADA';
                  const opKey = item.operacao?.toUpperCase();
                  const opBadge = OP_BADGE[opKey] || 'op-default';
                  const modBadge = MODULO_BADGE[item.modulo] || 'mod-sistema';
                  const acaoBadge = ACAO_BADGE[item.tipoAcao] || 'acao-inclusao';
                  return (
                    <React.Fragment key={`${item.id}-${item.dataHora}`}>
                      <tr
                        className={isExp ? 'expanded' : ''}
                        onClick={() => setExpandedId(isExp ? null : item.id)}
                      >
                        <td style={{ textAlign: 'center', paddingRight: 4 }}>
                          <span className={`audit-expand-arrow${isExp ? ' open' : ''}`}>
                            <ChevronDown size={12} />
                          </span>
                        </td>
                        <td>
                          <div className="audit-dt">
                            <span className="audit-dt-date">{datePart}</span>
                            <span className="audit-dt-time">{timePart}</span>
                          </div>
                        </td>
                        <td><span className="audit-user">{item.usuario}</span></td>
                        <td><span className={`audit-badge ${acaoBadge}`}>{item.tipoAcao || '—'}</span></td>
                        <td><span className={`audit-badge ${modBadge}`}>{item.modulo}</span></td>
                        <td><span className={`audit-badge ${opBadge}`}>{item.operacao}</span></td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{item.referencia || '—'}</td>
                        <td className="audit-detalhe">
                          <div className="audit-detalhe-clamp">{item.detalhe || '—'}</div>
                        </td>
                        <td className={`audit-valor ${item.valor == null ? 'neutro' : isEntrada ? 'positivo' : 'negativo'}`}>
                          {item.valor != null ? auditFmtBRL(item.valor) : '—'}
                        </td>
                      </tr>
                      {isExp && (
                        <tr className="detail-row" style={{ display: 'table-row' }}>
                          <td colSpan={9}>
                            <div className="detail-content">
                              <strong>Tipo de Ação:</strong> <span className={`audit-badge ${acaoBadge}`} style={{ fontSize: 11 }}>{item.tipoAcao || '—'}</span> &nbsp;|&nbsp;
                              <strong>Módulo:</strong> {item.modulo} &nbsp;|&nbsp;
                              <strong>Operação:</strong> {item.operacao} &nbsp;|&nbsp;
                              <strong>Direção:</strong> {item.direcao} &nbsp;|&nbsp;
                              <strong>Referência:</strong> {item.referencia || '—'}<br />
                              <strong>Usuário:</strong> {item.usuario} &nbsp;|&nbsp;
                              <strong>Terminal:</strong> {item.terminal || '—'} &nbsp;|&nbsp;
                              <strong>ID:</strong> {item.id}<br />
                              <strong>Detalhe:</strong> {item.detalhe || '—'}<br />
                              {item.valor != null && (
                                <><strong>Valor:</strong> {auditFmtBRL(item.valor)}</>
                              )}
                              {/* Painel antes/depois para ALTERAÇÃO e EXCLUSÃO */}
                              {(item.tipoAcao === 'ALTERAÇÃO' || item.tipoAcao === 'EXCLUSÃO') && (
                                <div className="hist-diff-inline">
                                  {item.tipoAcao === 'ALTERAÇÃO' && item.valorAntes != null && (
                                    <span className="hist-diff-chip">
                                      <span className="hist-diff-label">Valor antes</span>
                                      <span className="hist-diff-before">{auditFmtBRL(item.valorAntes)}</span>
                                      <span className="hist-diff-arrow">→</span>
                                      <span className="hist-diff-after">{auditFmtBRL(item.valorDepois)}</span>
                                    </span>
                                  )}
                                  {item.tipoAcao === 'EXCLUSÃO' && item.valorAntes != null && (
                                    <span className="hist-diff-chip exclusao">
                                      <Trash2 size={11} style={{ marginRight: 4 }} />
                                      Excluído: {auditFmtBRL(item.valorAntes)}
                                      {item.dataHoraRegistroFmt && ` em ${item.dataHoraRegistroFmt}`}
                                    </span>
                                  )}
                                  <button className="hist-ver-detalhes" onClick={() => setTab('historico')}>
                                    Ver detalhes completos →
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="audit-pagination">
            <span className="audit-pag-info">
              Página {page} de {pages.toLocaleString('pt-BR')} · {total.toLocaleString('pt-BR')} registros
            </span>
            <div className="audit-pag-btns">
              <button className="audit-pag-btn" onClick={() => goPage(1)} disabled={page === 1}>«</button>
              <button className="audit-pag-btn" onClick={() => goPage(page - 1)} disabled={page === 1}>‹</button>
              {pagesArray().map((p, i) =>
                p === '...'
                  ? <span key={`e${i}`} className="audit-pag-btn" style={{ border: 'none', background: 'none', cursor: 'default' }}>…</span>
                  : <button key={p} className={`audit-pag-btn${page === p ? ' active' : ''}`} onClick={() => goPage(p)}>{p}</button>
              )}
              <button className="audit-pag-btn" onClick={() => goPage(page + 1)} disabled={page === pages}>›</button>
              <button className="audit-pag-btn" onClick={() => goPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>
        )}
      </div>
      </>}

      {tab === 'alertas' && (
        <div>
          {/* Alertas config */}
          <div className="alerta-config">
            <span className="alerta-config-label">Horário comercial</span>
            <input type="number" className="alerta-config-input" value={horaInicio} min={0} max={12}
              onChange={e => setHoraInicio(Number(e.target.value))} style={{ width: 55 }} />
            <span style={{ color: '#64748b', fontSize: 12 }}>h às</span>
            <input type="number" className="alerta-config-input" value={horaFim} min={12} max={23}
              onChange={e => setHoraFim(Number(e.target.value))} style={{ width: 55 }} />
            <span style={{ color: '#64748b', fontSize: 12 }}>h</span>
            <span className="alerta-config-label" style={{ marginLeft: 12 }}>Alerta liberação acima de</span>
            <input type="number" className="alerta-config-input" value={limiteLib} min={0}
              onChange={e => setLimiteLib(Number(e.target.value))} />
            <span style={{ color: '#64748b', fontSize: 12 }}>R$</span>
            <span className="alerta-config-label" style={{ marginLeft: 12 }}>Alerta desconto acima de</span>
            <input type="number" className="alerta-config-input" value={limiteDesc} min={0}
              onChange={e => setLimiteDesc(Number(e.target.value))} />
            <span style={{ color: '#64748b', fontSize: 12 }}>R$</span>
            <button className={`audit-refresh-btn${alertasLoading ? ' spinning' : ''}`} style={{ marginLeft: 8 }}
              onClick={fetchAlertas}>
              <RefreshCw size={12} /> Aplicar
            </button>
          </div>

          {alertasLoading && (
            <div className="audit-loading-overlay">
              <RefreshCw size={16} style={{ animation: 'spin .7s linear infinite' }} /> Analisando anomalias...
            </div>
          )}

          {alertas && !alertasLoading && (() => {
            const fora    = alertas.fora_horario || [];
            const libAlta = alertas.liberacoes_altas || [];
            const cancRk  = alertas.cancelamentos_ranking || [];
            const libRk   = alertas.liberacoes_ranking || [];
            const recjD   = alertas.recj_descontos || [];
            return (
              <div className="alertas-grid">

                {/* Operações fora do horário */}
                <div className="alerta-card">
                  <div className="alerta-card-header">
                    <div className="alerta-card-title" style={{ color: '#f87171' }}>
                      <span className="alerta-severity-dot alto" />
                      <Clock size={14} /> Operações fora do horário
                    </div>
                    <span className="alerta-card-count">{fora.length} ocorrências</span>
                  </div>
                  <div className="alerta-card-body">
                    {fora.length === 0
                      ? <div className="alerta-empty">Nenhuma operação fora do horário</div>
                      : fora.map(r => (
                        <div className="alerta-row" key={r.id}>
                          <div className="alerta-row-left">
                            <div className="alerta-row-main">{r.usuario} — {r.operacao}</div>
                            <div className="alerta-row-sub">{r.dataHoraFmt} · Caixa {r.caixa || '—'}</div>
                          </div>
                          <div className="alerta-row-right">
                            <div className="alerta-row-valor vermelho">{r.valor != null ? auditFmtBRL(r.valor) : '—'}</div>
                            <div className="alerta-row-hora">{String(r.hora).padStart(2,'0')}h</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Liberações de alto valor */}
                <div className="alerta-card">
                  <div className="alerta-card-header">
                    <div className="alerta-card-title" style={{ color: '#fb923c' }}>
                      <span className="alerta-severity-dot medio" />
                      <TrendingUp size={14} /> Liberações de alto valor
                    </div>
                    <span className="alerta-card-count">{libAlta.length} ocorrências</span>
                  </div>
                  <div className="alerta-card-body">
                    {libAlta.length === 0
                      ? <div className="alerta-empty">Nenhuma liberação acima do limite</div>
                      : libAlta.map(r => (
                        <div className="alerta-row" key={r.id}>
                          <div className="alerta-row-left">
                            <div className="alerta-row-main">{r.usuario} · {r.referencia}</div>
                            <div className="alerta-row-sub">{r.dataHoraFmt} · {r.motivo}</div>
                          </div>
                          <div className="alerta-row-right">
                            <div className="alerta-row-valor laranja">{auditFmtBRL(r.valor)}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Ranking cancelamentos */}
                <div className="alerta-card">
                  <div className="alerta-card-header">
                    <div className="alerta-card-title" style={{ color: '#fbbf24' }}>
                      <span className="alerta-severity-dot baixo" />
                      <X size={14} /> Cancelamentos por usuário
                    </div>
                    <span className="alerta-card-count">{cancRk.reduce((s,r)=>s+r.qtd,0)} total</span>
                  </div>
                  <div className="alerta-card-body">
                    {cancRk.length === 0
                      ? <div className="alerta-empty">Nenhum cancelamento no período</div>
                      : cancRk.map(r => (
                        <div className="alerta-row" key={r.usuario}>
                          <div className="alerta-row-left">
                            <div className="alerta-row-main">{r.usuario}</div>
                            <div className="alerta-row-sub">{r.qtd} cancelamento{r.qtd !== 1 ? 's' : ''}</div>
                          </div>
                          <div className="alerta-row-right">
                            <div className="alerta-row-valor amarelo">{r.qtd} ×</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Ranking liberações por usuário */}
                <div className="alerta-card">
                  <div className="alerta-card-header">
                    <div className="alerta-card-title" style={{ color: '#a78bfa' }}>
                      <span className="alerta-severity-dot" style={{ background:'#a78bfa' }} />
                      <Unlock size={14} /> Liberações por usuário
                    </div>
                    <span className="alerta-card-count">{libRk.reduce((s,r)=>s+r.qtd,0)} total</span>
                  </div>
                  <div className="alerta-card-body">
                    {libRk.length === 0
                      ? <div className="alerta-empty">Nenhuma liberação no período</div>
                      : libRk.map(r => (
                        <div className="alerta-row" key={r.usuario}>
                          <div className="alerta-row-left">
                            <div className="alerta-row-main">{r.usuario}</div>
                            <div className="alerta-row-sub">{r.qtd} liberações · maior: {auditFmtBRL(r.maiorValor)}</div>
                          </div>
                          <div className="alerta-row-right">
                            <div className="alerta-row-valor" style={{ color:'#c4b5fd' }}>{auditFmtBRL(r.totalValor)}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Descontos em recebíveis */}
                <div className="alerta-card" style={{ gridColumn: 'span 2' }}>
                  <div className="alerta-card-header">
                    <div className="alerta-card-title" style={{ color: '#34d399' }}>
                      <span className="alerta-severity-dot" style={{ background:'#34d399' }} />
                      <PiggyBank size={14} /> Descontos em contas a receber
                    </div>
                    <span className="alerta-card-count">{recjD.length} registros</span>
                  </div>
                  <div className="alerta-card-body">
                    {recjD.length === 0
                      ? <div className="alerta-empty">Nenhum desconto acima do limite no período</div>
                      : recjD.map(r => (
                        <div className="alerta-row" key={r.id}>
                          <div className="alerta-row-left">
                            <div className="alerta-row-main">Doc {r.documento}</div>
                            <div className="alerta-row-sub">Original: {auditFmtBRL(r.valorOriginal)} · Fechamento: {r.fechamento}</div>
                          </div>
                          <div className="alerta-row-right">
                            <div className="alerta-row-valor verde">-{auditFmtBRL(r.desconto)}</div>
                            <div className="alerta-row-hora">{r.pctDesconto}%</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

              </div>
            );
          })()}

          {!alertas && !alertasLoading && (
            <div className="audit-empty">
              <AlertTriangle size={40} className="audit-empty-icon" />
              <div className="audit-empty-text">Clique em "Atualizar" para carregar os alertas do período.</div>
            </div>
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div>
          {/* Filtro de tipo */}
          <div className="hist-filter-bar">
            <History size={13} color="#f97316" />
            <span className="hist-filter-label">Filtrar por tipo:</span>
            {['', 'ALTERAÇÃO', 'EXCLUSÃO'].map(t => (
              <button
                key={t || 'all'}
                className={`hist-tipo-btn${histTipo === t ? ' active' : ''}`}
                onClick={() => { setHistTipo(t); setHistPage(1); }}
              >
                {t === '' ? 'Todos' : t === 'ALTERAÇÃO' ? 'Alterações' : 'Exclusões'}
                {histData && t !== '' && (
                  <span className="hist-tipo-count">
                    {histData.items?.filter(i => i.tipoAcao === t).length > 0
                      ? histData.items.filter(i => i.tipoAcao === t).length
                      : ''}
                  </span>
                )}
              </button>
            ))}
            <span className="hist-filter-info">
              {histData ? `${histData.pagination?.total ?? 0} evento(s) detectado(s)` : ''}
            </span>
          </div>

          {histLoading && (
            <div className="audit-loading-overlay">
              <RefreshCw size={16} style={{ animation: 'spin .7s linear infinite' }} /> Carregando histórico...
            </div>
          )}

          {!histLoading && histData && histData.items?.length === 0 && (
            <div className="audit-empty">
              <History size={40} className="audit-empty-icon" />
              <div className="audit-empty-text">
                Nenhuma alteração ou exclusão detectada no período.
                <br />
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  O watcher registra mudanças a partir do momento em que a API sobe.
                  Histórico anterior ao início do monitoramento não é rastreado.
                </span>
              </div>
            </div>
          )}

          {!histLoading && histData?.items?.length > 0 && (
            <div className="hist-cards">
              {histData.items.map(ev => {
                const isExp   = histExpandId === ev.id;
                const isExcl  = ev.tipoAcao === 'EXCLUSÃO';
                const isAlter = ev.tipoAcao === 'ALTERAÇÃO';
                const antes   = ev.dadosAntes  || {};
                const depois  = ev.dadosDepois || {};
                const FIELD_LABEL_PT = {
                  suprvalor: 'Valor', suprhistorico: 'Histórico', suproperacao: 'Operação',
                  suprcaixa: 'Caixa', suprplaca: 'Placa', suprusuario: 'Usuário',
                };
                const campos  = ev.camposAlterados || [];

                return (
                  <div key={ev.id} className={`hist-card${isExcl ? ' exclusao' : ' alteracao'}`}>
                    <div className="hist-card-header" onClick={() => setHistExpandId(isExp ? null : ev.id)}>
                      <div className="hist-card-left">
                        <span className={`audit-badge ${isExcl ? 'acao-exclusao' : 'acao-alteracao'}`}>
                          {isExcl ? <Trash2 size={10} style={{ marginRight: 3 }} /> : <Edit2 size={10} style={{ marginRight: 3 }} />}
                          {ev.tipoAcao}
                        </span>
                        <span className="hist-card-op">{ev.operacao}</span>
                        <span className="hist-card-ref">#{ev.registroId}</span>
                        {ev.usuario && ev.usuario !== '—' && (
                          <span className="hist-card-user">
                            <UserCheck size={11} /> {ev.usuario}
                          </span>
                        )}
                      </div>
                      <div className="hist-card-right">
                        {isAlter && ev.valorAntes != null && (
                          <span className="hist-valor-diff">
                            <span className="hist-valor-before">{auditFmtBRL(ev.valorAntes)}</span>
                            <span className="hist-seta">→</span>
                            <span className="hist-valor-after">{auditFmtBRL(ev.valorDepois)}</span>
                          </span>
                        )}
                        {isExcl && ev.valorAntes != null && (
                          <span className="hist-valor-excl">{auditFmtBRL(ev.valorAntes)}</span>
                        )}
                        <div className="hist-card-dates">
                          <span className="hist-dt-label">Detectado:</span> {ev.detectadoEmFmt}
                          {ev.dataHoraRegistroFmt && ev.dataHoraRegistroFmt !== '—' && (
                            <><br /><span className="hist-dt-label">Registro:</span> {ev.dataHoraRegistroFmt}</>
                          )}
                        </div>
                        <span className={`audit-expand-arrow${isExp ? ' open' : ''}`}>
                          <ChevronDown size={13} />
                        </span>
                      </div>
                    </div>

                    {isExp && (
                      <div className="hist-card-detail">
                        {isAlter && campos.length > 0 && (
                          <div className="hist-diff-table">
                            <div className="hist-diff-thead">
                              <span>Campo</span><span>Antes</span><span></span><span>Depois</span>
                            </div>
                            {campos.map(f => (
                              <div className="hist-diff-row" key={f}>
                                <span className="hist-diff-field">{FIELD_LABEL_PT[f] || f}</span>
                                <span className="hist-diff-val before">{antes[f] || '—'}</span>
                                <span className="hist-diff-arrow-sm">→</span>
                                <span className="hist-diff-val after">{depois[f] || '—'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {isExcl && (
                          <div className="hist-excl-detail">
                            <div className="hist-excl-title">
                              <Trash2 size={13} /> Dados do registro excluído
                            </div>
                            <div className="hist-excl-grid">
                              {Object.entries(FIELD_LABEL_PT).map(([k, label]) =>
                                antes[k] ? (
                                  <div key={k} className="hist-excl-item">
                                    <span className="hist-excl-label">{label}</span>
                                    <span className="hist-excl-val">{antes[k]}</span>
                                  </div>
                                ) : null
                              )}
                            </div>
                          </div>
                        )}
                        <div className="hist-card-desc">{ev.descricao}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação do histórico */}
          {histData && histData.pagination?.pages > 1 && (
            <div className="audit-pagination">
              <span className="audit-pag-info">
                Página {histPage} de {histData.pagination.pages} · {histData.pagination.total} registros
              </span>
              <div className="audit-pag-btns">
                <button className="audit-pag-btn" onClick={() => { setHistPage(1); fetchHistorico(1); }} disabled={histPage === 1}>«</button>
                <button className="audit-pag-btn" onClick={() => { const p = histPage-1; setHistPage(p); fetchHistorico(p); }} disabled={histPage === 1}>‹</button>
                <button className="audit-pag-btn" onClick={() => { const p = histPage+1; setHistPage(p); fetchHistorico(p); }} disabled={histPage === histData.pagination.pages}>›</button>
                <button className="audit-pag-btn" onClick={() => { setHistPage(histData.pagination.pages); fetchHistorico(histData.pagination.pages); }} disabled={histPage === histData.pagination.pages}>»</button>
              </div>
            </div>
          )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('starvl-sidebar-collapsed') === 'true'
  );

  // Carrega usuários da API na inicialização do app
  useEffect(() => {
    suLoadAll()
      .then(users => { if (users && users.length > 0) setAdminUsers(users); })
      .catch(() => { /* sem rede: mantém fallback hardcoded */ });
  }, []);

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
    topConvenio: [],
    vendasDiariasCombusFull: [],
    abcProdutos1: [],
    abcProdutos2: [],
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
      fetch(`${API_URL}/api/dashboard/top-convenio?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias-full?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/abc-produtos?empresa=${empresa}&periodo=${dashboardPeriodo}&prodtipo=1`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/abc-produtos?empresa=${empresa}&periodo=${dashboardPeriodo}&prodtipo=2`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, dashboardLmcControle, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp, topConvenioResp, vendasDiariasFullResp, abcProd1Resp, abcProd2Resp]) => {
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
        topConvenio: Array.isArray(topConvenioResp) ? topConvenioResp : [],
        vendasDiariasCombusFull: Array.isArray(vendasDiariasFullResp) ? vendasDiariasFullResp : [],
        abcProdutos1: Array.isArray(abcProd1Resp) ? abcProd1Resp : [],
        abcProdutos2: Array.isArray(abcProd2Resp) ? abcProd2Resp : [],
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
      fetch(`${API_URL}/api/dashboard/top-convenio?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendas-diarias-full?empresa=${empresa}&periodo=${dashboardPeriodo}`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/abc-produtos?empresa=${empresa}&periodo=${dashboardPeriodo}&prodtipo=1`).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/abc-produtos?empresa=${empresa}&periodo=${dashboardPeriodo}&prodtipo=2`).then(r => r.json()),
    ]).then(([kpis, combustiveis, vendasDiarias, vendasHorarias, dashboardLmcControle, lmcResp, lmcDiario, lmcControle, estoqueResp, projecaoResp, topConvenioResp, vendasDiariasFullResp, abcProd1Resp, abcProd2Resp]) => {
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
        topConvenio: Array.isArray(topConvenioResp) ? topConvenioResp : [],
        vendasDiariasCombusFull: Array.isArray(vendasDiariasFullResp) ? vendasDiariasFullResp : [],
        abcProdutos1: Array.isArray(abcProd1Resp) ? abcProd1Resp : [],
        abcProdutos2: Array.isArray(abcProd2Resp) ? abcProd2Resp : [],
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
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} setSelectedPeriod={setDashboardPeriod} onRefresh={handleRefresh} themeMode={themeMode} topConvenio={apiData.topConvenio} vendasDiariasCombusFull={apiData.vendasDiariasCombusFull} abcProdutos1={apiData.abcProdutos1} abcProdutos2={apiData.abcProdutos2} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} selectedPeriod={reportsPeriod} setSelectedPeriod={setReportsPeriod} clients={clients} />;
      case 'compras':
        return <ComprasPage selectedClient={selectedClient} clients={clients} />;
      case 'control':
        return <LivrosManager lmcRegistros={apiData.lmcRegistros} lmcDiario={apiData.lmcDiario} lmcControle={apiData.lmcControle} selectedPeriod={controlPeriod} setSelectedPeriod={setControlPeriod} selectedClient={selectedClient} clients={clients} themeMode={themeMode} />;
      case 'stock':
        return <EstoqueManager estoques={apiData.estoques} projecao={apiData.projecao} loading={apiData.loading} selectedClient={selectedClient} clients={clients} themeMode={themeMode} />;
      case 'receber':
        return <Financeiro clients={clients} selectedClient={selectedClient} themeMode={themeMode} />;
      case 'goals':
        return <GoalManager themeMode={themeMode} />;
      case 'auditoria':
        return <Auditoria themeMode={themeMode} />;
      case 'users':
        return <Users adminUsers={adminUsers} setAdminUsers={setAdminUsers} isAdmin={isAdmin} />;
      case 'params':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      case 'admin':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      default:
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} setSelectedPeriod={setDashboardPeriod} onRefresh={handleRefresh} themeMode={themeMode} topConvenio={apiData.topConvenio} vendasDiariasCombusFull={apiData.vendasDiariasCombusFull} abcProdutos1={apiData.abcProdutos1} abcProdutos2={apiData.abcProdutos2} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(user) => { setIsLoggedIn(true); setLoggedUser(user); setCurrentPage('dashboard'); setSidebarCollapsed(false); }} />;
  }

  return (
    <div className={`app theme-${themeMode}`}>
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogoutRequest}
        themeMode={themeMode}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => {
          const next = !prev;
          localStorage.setItem('starvl-sidebar-collapsed', String(next));
          return next;
        })}
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
