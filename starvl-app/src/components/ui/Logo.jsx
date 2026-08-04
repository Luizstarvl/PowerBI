import React from 'react';
import logoDark from '../../assets/eclipse-logo-dark.png';
import logoLight from '../../assets/eclipse-logo-light.png';

export default function Logo({ className = '', variant }) {
  if (variant === 'dark')  return <img src={logoDark}  alt="Eclipse" className={`brand-logo ${className}`.trim()} />;
  if (variant === 'light') return <img src={logoLight} alt="Eclipse" className={`brand-logo ${className}`.trim()} />;
  return (
    <>
      <img src={logoDark}  alt="Eclipse" className={`brand-logo brand-logo--dark ${className}`.trim()} />
      <img src={logoLight} alt="Eclipse" className={`brand-logo brand-logo--light ${className}`.trim()} />
    </>
  );
}
