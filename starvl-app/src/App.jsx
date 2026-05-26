import React, { useState, useEffect, useCallback, useMemo } from 'react';
import logoStarvl from './logo-starvl.png';
import logoStarvlBlack from './logo-starvl-black.png';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LabelList, ComposedChart, ReferenceLine } from 'recharts';
import { Home, FileText, Users as UsersIcon, Truck, Package, LogOut, Eye, Search, Plus, Edit2, Trash2, X, Calendar, TrendingUp, Droplet, DollarSign, Calculator, Bell, ChevronDown, Activity, Settings, Building2, Phone, Mail, MapPin, Hash, Clock, BarChart2, Layers, CircleDollarSign, UserCheck, UserPlus, AlertCircle, Globe, Camera, Building, Tag, RefreshCw, Database, ChevronRight, ChevronLeft, Filter, Printer, Moon, Sun, Trophy, Lock, Unlock, Wallet, Download, CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
import './App.css';
import './cr-styles.css';
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
const Sidebar = ({ currentPage, setCurrentPage, onLogout, themeMode }) => {
  const menuItems = [
    { icon: Home,      label: 'DASHBOARD',           page: 'dashboard' },
    { icon: Package,   label: 'ESTOQUE',              page: 'stock'     },
    { icon: Truck,     label: 'LIVROS',               page: 'control'   },
    { icon: Wallet,    label: 'FINANCEIRO',           page: 'receber'   },
    { icon: FileText,  label: 'RELATÓRIOS',           page: 'reports'   },
    { icon: Settings,  label: 'CONFIGURAÇÕES',        page: 'params'    },
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
  receber: 'Contas a Receber',
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
  const fmtBRL = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return (
    <div className="pv-tooltip">
      <strong>Dia {pt?.dia}/mai</strong>
      {real?.value != null && <span style={{ color: '#38bdf8' }}>Realizado: {fmtBRL(real.value)}</span>}
      {proj?.value != null && pt?.isProjection && <span style={{ color: '#fb923c' }}>Projetado: {fmtBRL(proj.value)}</span>}
    </div>
  );
};

const ProjecaoVendas = () => {
  const [unit,    setUnit]    = useState('Combustível');
  const [dayType, setDayType] = useState('Todos');

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

  return (
    <div className="chart-card pv-card">
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="card-header pv-header">
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

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="vp-kpi-row">
        <div className="vp-kpi">
          <span className="vp-kpi-label">Realizado até hoje</span>
          <span className="vp-kpi-value" style={{ color: '#38bdf8' }}>{fmtK(totalRealizado)}</span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">Projeção do mês</span>
          <span className="vp-kpi-value" style={{ color: '#fb923c' }}>{fmtK(projecaoTotal)}</span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">Média diária</span>
          <span className="vp-kpi-value">{fmtK(mediaDiaria)}</span>
        </div>
        <div className="vp-kpi">
          <span className="vp-kpi-label">Dias restantes</span>
          <span className="vp-kpi-value">{diasRestantes}</span>
        </div>
        <div className="vp-kpi pv-kpi-progress">
          <span className="vp-kpi-label">Andamento do mês — {pct}%</span>
          <div className="pv-progress-bar">
            <div className="pv-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="pv-progress-sub">{fmtK(totalRealizado)} / {fmtK(projecaoTotal)}</span>
        </div>
      </div>

      {/* ── Gráfico ─────────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 24, right: 36, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="pvProjGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#fb923c" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0.03} />
            </linearGradient>
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
          {/* Área sombreada sob a projeção */}
          <Area dataKey="projetado" fill="url(#pvProjGrad)" stroke="none"
            connectNulls={false} isAnimationActive={false} />
          {/* Linha realizado — sólida */}
          <Line type="monotone" dataKey="realizado" name="Realizado"
            stroke="#38bdf8" strokeWidth={2.5} dot={false}
            activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false} isAnimationActive={false} />
          {/* Linha projetado — tracejada */}
          <Line type="monotone" dataKey="projetado" name="Projeção"
            stroke="#fb923c" strokeWidth={2} strokeDasharray="8 4" dot={false}
            activeDot={{ r: 5, fill: '#fb923c', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false} isAnimationActive={false} />
          {/* Marcador vertical "Hoje" */}
          <ReferenceLine
            x={String(lastRealDia)}
            stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} strokeOpacity={0.7}
            label={{ value: 'Hoje', position: 'top', fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Legenda ─────────────────────────────────────────────────────── */}
      <div className="pv-legend">
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

  const empresa = useMemo(() => {
    const c = (clients||[]).find(cl=>cl.nome===selectedClient)||(clients||[])[0];
    return c?.codigoEmpresa||null;
  }, [clients, selectedClient]);

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

  const fmtBRL = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtPct = v => `${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;
  const fmtDate = s => s ? String(s).substring(0,10).split('-').reverse().join('/') : '-';

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
                    <button className="cr-action-btn" title="Exportar"><FileText size={15}/></button>
                    <button className="cr-action-btn cr-action-down" title="Registrar Recebimento"><Download size={15}/></button>
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
    </div>
  );
};
// ── fim ContasReceber ─────────────────────────────────────────────────────────

// Dashboard Component
const Dashboard = ({ kpis, combustiveis, vendasDiarias, vendasHorarias, lmcControle, estoques, loading, clients, selectedClient, selectedPeriod, themeMode }) => {
  const [selectedFuelDonut, setSelectedFuelDonut] = useState(null);
  const [isCompactDashboard, setIsCompactDashboard] = useState(false);
  const [salesFuelSection, setSalesFuelSection] = useState('combustivel');
  const [productMatrixUnit, setProductMatrixUnit] = useState('Pista');
  const [productMatrixPeriod, setProductMatrixPeriod] = useState('Mensal');

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

  // Mock top-4 conveniência mais vendida (demo) — produtos individuais
  const _CONV_DASH_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];
  const _CONV_DASH_BASE   = [
    { name: 'Refrig. 350ml',   qty: 1842 },
    { name: 'Água 500ml',      qty: 1725 },
    { name: 'Café Expresso',   qty:  930 },
    { name: 'Marlboro',        qty:  760 },
  ];
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
  const tooltipStyle = { background: DASHBOARD_COLORS.tooltipBg, border: `1px solid ${DASHBOARD_COLORS.sale}`, borderRadius: 8, color: DASHBOARD_COLORS.label };
  const purchaseTooltipStyle = { ...tooltipStyle, border: `1px solid ${DASHBOARD_COLORS.purchase110}` };
  const labelStyle = { fill: DASHBOARD_COLORS.label, fontWeight: 700 };
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
          <h3>{salesFuelSection === 'combustivel' ? 'COMBUSTÍVEIS MAIS VENDIDOS' : 'CONVENIÊNCIA MAIS VENDIDA'}</h3>
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
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtLitersLabel(v), 'Litros']} />
              <Bar dataKey="litros" name="Litros vendidos" fill={DASHBOARD_COLORS.sale} radius={[8, 8, 0, 0]}>
                {salesFuelChartData.map((entry, index) => (
                  <Cell key={`sales-fuel-${entry.name}-${index}`} fill={entry.color || DASHBOARD_COLORS.sale} />
                ))}
                <LabelList dataKey="litros" position="top" formatter={(v) => Number(v) > 0 ? fmtLitersLabel(v) : ''} {...labelStyle} fontSize={isCompactDashboard ? 10 : 12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={wideChartHeight}>
            <BarChart data={salesConvChartData} margin={{ top: 28, right: 12, left: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_COLORS.grid} />
              <XAxis dataKey="name" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={0} height={isCompactDashboard ? 46 : 30} angle={isCompactDashboard ? -18 : 0} textAnchor={isCompactDashboard ? 'end' : 'middle'} />
              <YAxis stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} width={isCompactDashboard ? 46 : 60} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v, _name, props) => [<span style={{ color: props.payload?.color || '#60a5fa', fontWeight: 700 }}>{Number(v).toLocaleString('pt-BR') + ' un.'}</span>, <span style={{ color: props.payload?.color || '#60a5fa' }}>Unidades</span>]} />
              <Bar dataKey="qty" name="Unidades vendidas" radius={[8, 8, 0, 0]}>
                {salesConvChartData.map((entry, index) => (
                  <Cell key={`sales-conv-${entry.name}-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="qty" position="top" formatter={(v) => Number(v) > 0 ? Number(v).toLocaleString('pt-BR') + ' un.' : ''} {...labelStyle} fontSize={isCompactDashboard ? 10 : 12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
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
              contentStyle={purchaseTooltipStyle}
              labelStyle={{ color: '#fff' }}
              formatter={(v) => [fmt(v) + ' L', 'Litros']}
            />
            <Legend />
            <Bar dataKey="compra110" name="Compra 110" fill={DASHBOARD_COLORS.purchase110} radius={[8, 8, 0, 0]}>
              <LabelList dataKey="compra110" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} {...labelStyle} fontSize={isCompactDashboard ? 9 : 11} />
            </Bar>
            <Bar dataKey="compra220" name="Compra 220" fill={DASHBOARD_COLORS.purchase220} radius={[8, 8, 0, 0]}>
              <LabelList dataKey="compra220" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactLiters(v) : ''} {...labelStyle} fontSize={isCompactDashboard ? 9 : 11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    productMatrix: (
      <div className="chart-card product-matrix-card">
        <div className="card-header product-matrix-header">
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
        <div className="pm-abc-legend">
          <span><span style={{ color: PM_ABC_COLORS.A }}>■</span> A — Alto volume (top 20%)</span>
          <span><span style={{ color: PM_ABC_COLORS.B }}>■</span> B — Volume médio (30%)</span>
          <span><span style={{ color: PM_ABC_COLORS.C }}>■</span> C — Baixo volume (50%)</span>
        </div>

        <ResponsiveContainer width="100%" height={productMatrixHeight}>
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
            <Bar dataKey="volume" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
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
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
            <Bar dataKey="value" fill={DASHBOARD_COLORS.sale} radius={[6, 6, 0, 0]}>{showDenseValueLabels && <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...labelStyle} fontSize={9} />}</Bar>
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
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
            <Area type="monotone" dataKey="value" stroke={DASHBOARD_COLORS.sale} fillOpacity={1} fill="url(#colorWeekly)"><LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...labelStyle} fontSize={isCompactDashboard ? 9 : 10} /></Area>
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
            <Area type="monotone" dataKey="value" stroke={DASHBOARD_COLORS.sale} fillOpacity={1} fill="url(#colorMonthly)">{showDenseValueLabels && <LabelList dataKey="value" position="top" formatter={(v) => Number(v) > 0 ? fmtCompactCurrency(v) : ''} {...labelStyle} fontSize={9} />}</Area>
            <XAxis dataKey="day" stroke={DASHBOARD_COLORS.axis} tick={xTickStyle} interval={isCompactDashboard ? 6 : 4} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} formatter={(v) => [fmtCompactCurrency(v), 'Valor']} />
          </AreaChart>
        </ResponsiveContainer>
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
          <VendasPista clients={clients} selectedClient={selectedClient} selectedPeriod={selectedPeriod} themeMode={themeMode} />
        </div>
        <div className="dashboard-static-full">{dashboardSections.productMatrix}</div>
        <div className="dashboard-static-full">
          <ProjecaoVendas />
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
    window.alert('Nenhuma venda encontrada para os filtros selecionados.');
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
        <div class="mark" aria-hidden="true"><span></span><span></span><span></span></div>
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
    window.alert('Permita pop-ups para gerar a impressao do relatorio.');
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

const Reports = ({ selectedClient, selectedPeriod, setSelectedPeriod, clients }) => {
  const [activeTab, setActiveTab] = useState('descarregamentos');
  const [data, setData] = useState({ descarregamentos: null, vendas: null, historico: null, consolidado: null, controle: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [descSubTab, setDescSubTab] = useState('comNota');
  const [showControlPrintPanel, setShowControlPrintPanel] = useState(false);
  const [showRankingPrintPanel, setShowRankingPrintPanel] = useState(false);
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
      window.alert('A data inicial nao pode ser maior que a data final.');
      return;
    }

    if (vendedores.length && !filters.vendedores.length) {
      window.alert('Selecione pelo menos um vendedor.');
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
      window.alert(`Erro ao gerar relatorio: ${getFriendlyApiError(err)}`);
    } finally {
      setLoading(prev => ({ ...prev, rankingExport: false }));
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

const ConvenienciaManager = ({ themeMode }) => {
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [fornecedor, setFornecedor] = useState('Todos');
  const [statusFilt, setStatusFilt] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim]       = useState('');
  const [viewProd, setViewProd]     = useState(null);
  const LIMIT = 7;

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, categoria, fornecedor, statusFilt, dataInicio, dataFim]);

  const fmtBRL  = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = s => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

  // Compute status for all products
  const allProds = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return PM_MOCK_PRODUCTS.map(p => {
      const vencDate = new Date(p.venc + 'T00:00:00');
      const dias = Math.round((vencDate - today) / 86400000);
      const status = dias < 0 ? 'vencido' : dias === 0 ? 'vencendo_hoje' : dias <= 7 ? 'prox_vencer' : 'ok';
      return { ...p, dias, status, valorEstoque: p.custo * p.estoque };
    });
  }, []);

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
        <div className="pm-header-actions">
          <button className="pm-btn-primary" onClick={() => alert('Funcionalidade disponível na versão completa')}><Plus size={15} /> NOVO PRODUTO</button>
          <button className="pm-btn-outline"><Filter size={14} /> FILTROS</button>
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
                    <div className="pm-foto-box" style={{ background: p.cor + '22' }}>{p.emoji}</div>
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
                      <button className="pm-action-btn pm-action-edit" title="Editar" onClick={() => alert('Edição disponível na versão completa')}><Edit2 size={13} /></button>
                      <button className="pm-action-btn pm-action-del" title="Excluir" onClick={() => alert('Exclusão disponível na versão completa')}><Trash2 size={13} /></button>
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

      {/* Modal de detalhes */}
      {viewProd && (
        <div className="pm-modal-overlay" onClick={() => setViewProd(null)}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h3 className="pm-modal-title">Detalhes do Produto</h3>
              <button className="pm-modal-close" onClick={() => setViewProd(null)}><X size={18} /></button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-modal-foto" style={{ background: viewProd.cor + '22' }}>{viewProd.emoji}</div>
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
  const [tab, setTab] = useState('pista');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="estoque-tab-bar">
        <div className="vp-toggle-group">
          <button type="button" className={`vp-period-btn vp-secao-btn${tab === 'pista' ? ' active' : ''}`} onClick={() => setTab('pista')}>⛽ Pista</button>
          <button type="button" className={`vp-period-btn vp-secao-btn${tab === 'conveniencia' ? ' active' : ''}`} onClick={() => setTab('conveniencia')}>🏪 Conveniência</button>
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
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} themeMode={themeMode} />;
      case 'reports':
        return <Reports selectedClient={selectedClient} selectedPeriod={reportsPeriod} setSelectedPeriod={setReportsPeriod} clients={clients} />;
      case 'control':
        return <Control lmcRegistros={apiData.lmcRegistros} lmcDiario={apiData.lmcDiario} lmcControle={apiData.lmcControle} selectedPeriod={controlPeriod} setSelectedPeriod={setControlPeriod} selectedClient={selectedClient} clients={clients} />;
      case 'stock':
        return <EstoqueManager estoques={apiData.estoques} projecao={apiData.projecao} loading={apiData.loading} selectedClient={selectedClient} clients={clients} themeMode={themeMode} />;
      case 'receber':
        return <ContasReceber clients={clients} selectedClient={selectedClient} />;
      case 'users':
        return <Users adminUsers={adminUsers} setAdminUsers={setAdminUsers} isAdmin={isAdmin} />;
      case 'params':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      case 'admin':
        return <Parameters clients={clients} setClients={setClients} isAdmin={isAdmin} />;
      default:
        return <Dashboard kpis={apiData.kpis} combustiveis={apiData.combustiveis} vendasDiarias={apiData.vendasDiarias} vendasHorarias={apiData.vendasHorarias} lmcControle={apiData.dashboardLmcControle} estoques={apiData.estoques} loading={apiData.loading} clients={clients} selectedClient={selectedClient} selectedPeriod={dashboardPeriod} themeMode={themeMode} />;
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
