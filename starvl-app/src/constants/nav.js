import { LayoutGrid, Users, Target, Settings, CheckSquare } from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'dashboard',  tk: 'nav_dashboard',  Icon: LayoutGrid  },
  { key: 'tarefas',    tk: 'nav_tarefas',    Icon: CheckSquare },
  { key: 'metas',      tk: 'nav_metas',      Icon: Target      },
  { key: 'usuarios',   tk: 'nav_usuarios',   Icon: Users       },
  { key: 'parametros', tk: 'nav_parametros', Icon: Settings    },
];
