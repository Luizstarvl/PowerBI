import { Wallet, Package, FileText, Target, BarChart3, GraduationCap, Fuel, DollarSign, TrendingUp, Users } from 'lucide-react';

export const FEATURE_CARDS = [
  { key: 'financeiro',    label: 'Financeiro',    Icon: Wallet },
  { key: 'estoque',       label: 'Estoque',        Icon: Package },
  { key: 'fiscal',        label: 'Fiscal',         Icon: FileText },
  { key: 'metas',         label: 'Metas',          Icon: Target },
  { key: 'bi',            label: 'BI',             Icon: BarChart3 },
  { key: 'treinamentos',  label: 'Treinamentos',   Icon: GraduationCap },
];

export const CHECKLIST_ITEMS = [
  '1.200+ postos ativos',
  '12 milhões de documentos processados',
  'Atualizações em tempo real',
];

// Valores ilustrativos — a tela de login não tem sessão/empresa selecionada
// ainda, então não há dado real pra puxar aqui (mesma prática de páginas de
// login de SaaS de referência, que mostram números de exemplo).
export const METRIC_CARDS = [
  {
    key: 'vendas', label: 'Vendas hoje', Icon: Fuel,
    value: 'R$ 48.730,25', comparison: '+12,5% vs ontem',
    points: [12, 18, 15, 24, 20, 30, 26, 34, 30, 40],
  },
  {
    key: 'faturamento', label: 'Faturamento', Icon: DollarSign,
    value: 'R$ 287.430,80', comparison: '+8,7% vs semana passada',
    points: [40, 38, 44, 42, 50, 48, 56, 52, 60, 58],
  },
  {
    key: 'lucro', label: 'Lucro', Icon: TrendingUp,
    value: 'R$ 63.540,90', comparison: '+15,3% vs semana passada',
    points: [10, 14, 12, 20, 18, 26, 22, 30, 28, 36],
  },
  {
    key: 'usuarios', label: 'Usuários online', Icon: Users,
    value: '23', comparison: 'Online agora',
    points: [18, 20, 17, 22, 21, 25, 23, 24, 22, 23],
  },
];
