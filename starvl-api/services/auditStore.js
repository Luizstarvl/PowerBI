const fs   = require('fs');
const path = require('path');

const DATA_DIR      = path.join(__dirname, '..', 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'supr_snapshot.json');
const EVENTS_FILE   = path.join(DATA_DIR, 'audit_events.json');
const MAX_EVENTS    = 20000;

let _snapshot = {};
let _events   = [];
let _loaded   = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDataDir();

  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      _snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    }
  } catch { _snapshot = {}; }

  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      _events = Array.isArray(parsed) ? parsed : [];
    }
  } catch { _events = []; }

  _loaded = true;
  console.log(`[AuditStore] Carregado: ${Object.keys(_snapshot).length} linhas no snapshot, ${_events.length} eventos`);
}

function persist() {
  ensureDataDir();
  if (_events.length > MAX_EVENTS) _events = _events.slice(-MAX_EVENTS);
  try {
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(_snapshot), 'utf8');
    fs.writeFileSync(EVENTS_FILE,   JSON.stringify(_events),   'utf8');
  } catch (err) {
    console.error('[AuditStore] Erro ao persistir:', err.message);
  }
}

function addEvent(ev) {
  _events.push({ ...ev, detectado_em: new Date().toISOString() });
}

function setSnapshot(map) { _snapshot = map; }
function getSnapshot()    { return _snapshot; }
function isLoaded()       { return _loaded; }

function queryEvents({ empresa, data_ini, data_fim, tipo_acao, usuario, search, page = 1, limit = 50 }) {
  let rows = _events.filter(e => e.empresa === empresa);

  if (data_ini) {
    const d = new Date(data_ini + 'T00:00:00-03:00');
    rows = rows.filter(e => new Date(e.detectado_em) >= d);
  }
  if (data_fim) {
    const d = new Date(data_fim + 'T23:59:59-03:00');
    rows = rows.filter(e => new Date(e.detectado_em) <= d);
  }
  if (tipo_acao) rows = rows.filter(e => e.tipo_acao === tipo_acao);
  if (usuario) {
    const u = usuario.toUpperCase();
    rows = rows.filter(e => (e.usuario || '').toUpperCase().includes(u));
  }
  if (search) {
    const s = search.toUpperCase();
    rows = rows.filter(e =>
      (e.usuario   || '').toUpperCase().includes(s) ||
      (e.operacao  || '').toUpperCase().includes(s) ||
      (e.descricao || '').toUpperCase().includes(s) ||
      String(e.registro_id || '').includes(s)
    );
  }

  rows.sort((a, b) => new Date(b.detectado_em) - new Date(a.detectado_em));

  const total = rows.length;
  const items = rows.slice((page - 1) * limit, page * limit);
  return { items, total };
}

module.exports = { load, persist, addEvent, setSnapshot, getSnapshot, isLoaded, queryEvents };
