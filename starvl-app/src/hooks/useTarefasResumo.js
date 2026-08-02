import { useCallback, useEffect, useRef, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const POLL_MS = 45000;

const META_TIPO_LABEL = {
  vencida: 'Meta vencida', ultrapassada: 'Meta ultrapassada',
  abaixo_esperado: 'Abaixo do esperado', prazo_proximo: 'Prazo próximo',
  atingiu_100: 'Meta atingida',
};
const META_TIPO_SEVERIDADE = {
  vencida: 'critico', ultrapassada: 'atencao', abaixo_esperado: 'atencao',
  prazo_proximo: 'atencao', atingiu_100: 'concluido',
};

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

async function safeJson(promise) {
  try {
    const res = await promise;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Hub compartilhado: busca tarefas + alertas manuais + alertas computados ao
// vivo (Metas, Estoque baixo, Contas a vencer) reaproveitando os endpoints já
// existentes desses módulos — sem duplicar lógica de negócio. Usado por
// App.jsx (badge da sidebar + sino), pelo card do Dashboard e pela página
// completa de Tarefas.
export default function useTarefasResumo({ empresaId, codigoEmpresa, userId, detalhado = false }) {
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!empresaId) { setLoading(false); return; }

    const [tasksData, alertsData, metasData, receberData, pagarData, estoqueData] = await Promise.all([
      safeJson(fetch(`${API_URL}/api/tasks?empresa=${empresaId}${userId ? `&userId=${userId}` : ''}`)),
      safeJson(fetch(`${API_URL}/api/alerts?empresa=${empresaId}`)),
      safeJson(fetch(`${API_URL}/api/metas/notificacoes?empresa=${empresaId}`)),
      codigoEmpresa ? safeJson(fetch(`${API_URL}/api/receber/resumo?empresa=${codigoEmpresa}`)) : null,
      codigoEmpresa ? safeJson(fetch(`${API_URL}/api/pagar/resumo?empresa=${codigoEmpresa}`))   : null,
      codigoEmpresa ? safeJson(fetch(`${API_URL}/api/estoque?empresa=${codigoEmpresa}`))         : null,
    ]);

    const agora = new Date().toISOString();
    const unified = [];

    if (Array.isArray(alertsData)) unified.push(...alertsData);

    if (Array.isArray(metasData)) {
      metasData.forEach(n => {
        unified.push({
          id: `metas-${n.metaId}-${n.tipo}`,
          titulo: `${n.metaNome} — ${META_TIPO_LABEL[n.tipo] || n.tipo}`,
          severidade: META_TIPO_SEVERIDADE[n.tipo] || 'info',
          modulo: 'Metas',
          lido: !!n.lida,
          criadoEm: agora,
          resolvidoEm: null,
          origem: 'metas',
          origemId: n.metaId,
          origemTipo: n.tipo,
        });
      });
    }

    if (receberData?.emAtraso > 0) {
      unified.push({
        id: 'financeiro-receber-atraso',
        titulo: `Contas a receber em atraso: R$ ${receberData.emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        severidade: 'critico', modulo: 'Financeiro', lido: false,
        criadoEm: agora, resolvidoEm: null, origem: 'financeiro',
      });
    }
    if (pagarData?.emAtraso > 0) {
      unified.push({
        id: 'financeiro-pagar-atraso',
        titulo: `Contas a pagar em atraso: R$ ${pagarData.emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        severidade: 'critico', modulo: 'Financeiro', lido: false,
        criadoEm: agora, resolvidoEm: null, origem: 'financeiro',
      });
    }

    if (Array.isArray(estoqueData?.estoques)) {
      estoqueData.estoques.forEach(p => {
        const pct = p.percentualEstimado ?? p.percentualOcupacao ?? 100;
        if (pct < 20) {
          unified.push({
            id: `estoque-${p.produtoCodigo}`,
            titulo: `Estoque baixo: ${p.produtoNome} (${pct.toFixed(0)}%)`,
            severidade: pct < 10 ? 'critico' : 'atencao',
            modulo: 'Estoque', lido: false,
            criadoEm: agora, resolvidoEm: null, origem: 'estoque',
          });
        }
      });
    }

    unified.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setAlerts(unified);
    setLoading(false);
  }, [empresaId, codigoEmpresa, userId]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  const hoje = hojeISO();
  const tarefasAbertas = tasks.filter(t => t.status !== 'concluida');
  const alertasAtivos  = alerts.filter(a => !a.resolvidoEm);
  const counts = {
    pendentes:         tarefasAbertas.length,
    criticos:          alertasAtivos.filter(a => a.severidade === 'critico').length
                        + tasks.filter(t => t.status === 'atrasada').length,
    vencendoHoje:       tasks.filter(t => t.prazo && String(t.prazo).slice(0, 10) === hoje && t.status !== 'concluida').length,
    novasNotificacoes: alertasAtivos.filter(a => !a.lido).length,
  };

  return { tasks, alerts, counts, loading, refetch: fetchAll };
}
