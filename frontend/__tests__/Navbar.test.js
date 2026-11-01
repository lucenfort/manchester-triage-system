import { render, screen } from '@testing-library/react';
import Navbar from '../src/components/Navbar';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...rest }) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Navbar', () => {
  it('renderiza o título da aplicação', () => {
    render(<Navbar />);
    expect(screen.getByText('Triagem Manchester')).toBeInTheDocument();
  });

  it('renderiza os links de navegação', () => {
    render(<Navbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Triagem')).toBeInTheDocument();
    expect(screen.getByText('Pacientes')).toBeInTheDocument();
    expect(screen.getByText('Painel')).toBeInTheDocument();
  });

  it('marca o link ativo com a classe correta', () => {
    render(<Navbar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
  });
});
