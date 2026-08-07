import { LayoutGrid, Users, Settings, ClipboardList, TrendingUp, Package } from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'dashboard',             tk: 'nav_dashboard',             Icon: LayoutGrid  },
  { key: 'planejamento_comercial',tk: 'nav_planejamento_comercial', Icon: TrendingUp  },
  { key: 'cadastros',             tk: 'nav_cadastros',             Icon: ClipboardList },
  { key: 'estoque',               tk: 'nav_estoque',               Icon: Package     },
  { key: 'usuarios',              tk: 'nav_usuarios',              Icon: Users       },
  { key: 'parametros',            tk: 'nav_parametros',            Icon: Settings    },
];
