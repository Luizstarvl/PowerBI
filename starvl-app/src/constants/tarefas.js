import {
  Wallet, Package, FileText, Target, BarChart3, GraduationCap, Users, ShoppingCart,
  Plus, Calendar, FolderOpen, AlertTriangle, CheckSquare, FileBarChart,
} from 'lucide-react';

export const PRIORIDADES = [
  { value: 'baixa',  label: 'Baixa'   },
  { value: 'media',  label: 'Média'   },
  { value: 'alta',   label: 'Alta'    },
  { value: 'urgente', label: 'Urgente' },
];

export const STATUS_TAREFA = [
  { value: 'pendente',  label: 'Pendente'   },
  { value: 'andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída'  },
  { value: 'atrasada',  label: 'Atrasada'   },
];

export const CATEGORIAS_TAREFA = [
  'Financeiro', 'Estoque', 'Fiscal', 'Metas', 'BI', 'Compras', 'Vendas',
  'RH', 'CRM', 'Agendamentos', 'Auditoria', 'Chamados', 'Treinamentos', 'Outros',
];

export const CATEGORIA_ICON = {
  Financeiro: Wallet, Estoque: Package, Fiscal: FileText, Metas: Target,
  BI: BarChart3, Compras: ShoppingCart, Vendas: BarChart3, RH: Users,
  CRM: Users, Agendamentos: Calendar, Auditoria: FileText, Chamados: FileText,
  Treinamentos: GraduationCap, Outros: FolderOpen,
};

// Severidade do alerta → cor (vermelho/laranja/azul/verde do spec).
export const SEVERIDADE = {
  critico:   { label: 'Crítico',   color: '#EF4444' },
  atencao:   { label: 'Atenção',   color: '#FB923C' },
  info:      { label: 'Info',      color: '#38BDF8' },
  concluido: { label: 'Concluído', color: '#22C55E' },
};

// Tipos de alerta manual disponíveis pro admin — inclui os que ainda não têm
// integração automática (módulo correspondente não existe no sistema hoje).
export const TIPOS_ALERTA_MANUAL = [
  'Estoque baixo', 'Produto vencendo', 'Meta atrasada', 'Caixa pendente',
  'Pedido aguardando aprovação', 'Nota fiscal rejeitada', 'Backup não realizado',
  'Erro do sistema', 'Atualização disponível', 'Outro',
];

export const QUICK_ACTIONS = [
  { key: 'nova',      label: 'Nova tarefa',    Icon: Plus },
  { key: 'agenda',    label: 'Agenda',         Icon: Calendar },
  { key: 'todas',     label: 'Ver todas',      Icon: FolderOpen },
  { key: 'alertas',   label: 'Ver alertas',    Icon: AlertTriangle },
  { key: 'minhas',    label: 'Minhas tarefas', Icon: CheckSquare },
  { key: 'relatorios', label: 'Relatórios',    Icon: FileBarChart },
];
