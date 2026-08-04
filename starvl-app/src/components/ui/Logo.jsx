import React from 'react';
// "Logo Tema Dark.png"  = logo de cor escura → aparece no TEMA CLARO (fundo branco)
// "Logo Tema White.png" = logo branca        → aparece no TEMA ESCURO (fundo preto)
import logoForDarkBg  from '../../assets/eclipse-logo-light.png'; // branca → tema escuro
import logoForLightBg from '../../assets/eclipse-logo-dark.png';  // escura → tema claro

export default function Logo({ className = '', variant }) {
  // variant="dark"  → fundo sempre escuro (ex: painel de login)
  if (variant === 'dark')  return <img src={logoForDarkBg}  alt="Eclipse" className={`brand-logo ${className}`.trim()} />;
  // variant="light" → fundo sempre claro
  if (variant === 'light') return <img src={logoForLightBg} alt="Eclipse" className={`brand-logo ${className}`.trim()} />;
  // sem variant: CSS decide qual exibir conforme o tema ativo
  return (
    <>
      <img src={logoForDarkBg}  alt="Eclipse" className={`brand-logo brand-logo--dark  ${className}`.trim()} />
      <img src={logoForLightBg} alt="Eclipse" className={`brand-logo brand-logo--light ${className}`.trim()} />
    </>
  );
}
