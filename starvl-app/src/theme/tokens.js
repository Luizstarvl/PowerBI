// Espelha os tokens de cor de App.css para contextos que precisam de valores
// literais (Recharts, paletas de identidade) em vez de CSS custom properties.

export const CHART_COLORS = ['#F97316', '#FB923C', '#F8FAFC', '#94A3B8', '#16A34A', '#38BDF8'];

// Cor de identidade por usuário — deliberadamente sem laranja, para não se
// confundir com a cor de marca/CTA.
export const AVATAR_COLORS = ['#2563EB', '#16A34A', '#7C3AED', '#DC2626', '#0891B2', '#DB2777'];

export const STATUS_COLORS = {
  success: '#22C55E',
  warning: '#FB923C',
  error:   '#EF4444',
  neutral: '#71717A',
};
