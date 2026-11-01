'use client';

/**
 * Componente de Navegação (Navbar).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/triagem', label: 'Triagem' },
    { href: '/pacientes', label: 'Pacientes' },
    { href: '/painel', label: 'Painel' },
  ];

  return (
    <nav className="navbar" id="navbar-principal">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon" aria-hidden="true">+</div>
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
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
