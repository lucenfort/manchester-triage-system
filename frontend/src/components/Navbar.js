'use client';

/**
 * Componente de Navegação (Navbar).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/triagem', label: 'Triagem', icon: '🩺' },
    { href: '/pacientes', label: 'Pacientes', icon: '👥' },
    { href: '/painel', label: 'Painel', icon: '📋' },
  ];

  return (
    <nav className="navbar" id="navbar-principal">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">🏥</div>
          <span>Triagem Manchester</span>
        </Link>

        <ul className="navbar-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
                id={`nav-${link.label.toLowerCase()}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
