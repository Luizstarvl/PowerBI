import React from 'react';

const VARIANT_CLASS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  success:   'btn-success',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  const cls = `${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${className}`.trim();
  return <button className={cls} {...props} />;
}
