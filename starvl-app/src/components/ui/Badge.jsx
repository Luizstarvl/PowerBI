import React from 'react';

const VARIANT_CLASS = {
  success: 'badge-ativo',
  warning: 'badge-warn',
  error:   'badge-inativo',
  neutral: 'badge-neutral',
  admin:   'badge-admin',
  user:    'badge-user',
  info:    'badge-info',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const cls = `badge ${VARIANT_CLASS[variant] || VARIANT_CLASS.neutral} ${className}`.trim();
  return <span className={cls}>{children}</span>;
}
