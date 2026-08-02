import React from 'react';
import logoDark from '../../assets/horse-logo-dark.png';
import logoLight from '../../assets/horse-logo-light.png';

// Sem `variant`: renderiza as duas versões e deixa o CSS ([data-theme])
// decidir qual aparece — usado onde o fundo muda com o tema (sidebar).
// Com `variant="dark"|"light"`: força uma versão só, para fundos fixos que
// não acompanham o tema (o painel de marca do Login é sempre escuro).
export default function Logo({ className = '', variant }) {
  if (variant === 'dark')  return <img src={logoDark}  alt="Horse" className={`brand-logo ${className}`.trim()} />;
  if (variant === 'light') return <img src={logoLight} alt="Horse" className={`brand-logo ${className}`.trim()} />;
  return (
    <>
      <img src={logoDark}  alt="Horse" className={`brand-logo brand-logo--dark ${className}`.trim()} />
      <img src={logoLight} alt="Horse" className={`brand-logo brand-logo--light ${className}`.trim()} />
    </>
  );
}
