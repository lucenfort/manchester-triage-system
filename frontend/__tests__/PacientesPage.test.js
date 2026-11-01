import { render, screen, fireEvent } from '@testing-library/react';
import PacientesPage from '../src/app/pacientes/page';

jest.mock('../src/services/api', () => ({
  listarPacientes: jest.fn(),
  excluirPaciente: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  };
});

const { listarPacientes } = require('../src/services/api');

describe('PacientesPage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  it('mostra tela de erro caso falhe carregar pacientes', async () => {
    listarPacientes.mockRejectedValue(new Error('Fetch failed'));

    render(<PacientesPage />);

    expect(await screen.findByText('Não foi possível carregar a lista de pacientes.')).toBeInTheDocument();
  });

  it('renderiza os pacientes retornados pela API e realiza filtros de busca', async () => {
    listarPacientes.mockResolvedValue([
      { id: 1, nome: 'Maria Antônia', cpf: '11122233344', data_nascimento: '10/05/1985', created_at: '2026-05-26T20:00:00Z' },
      { id: 2, nome: 'João Pedro', cpf: '55566677788', data_nascimento: '15/12/1992', created_at: '2026-05-26T20:10:00Z' },
    ]);

    render(<PacientesPage />);

    expect(await screen.findByText('Consulta de Pacientes')).toBeInTheDocument();
    expect(screen.getByText(/Novo Cadastro/)).toBeInTheDocument();

    expect(screen.getByText('Maria Antônia')).toBeInTheDocument();
    expect(screen.getByText('João Pedro')).toBeInTheDocument();

    expect(screen.getByText('111.222.333-44')).toBeInTheDocument();
    expect(screen.getByText('555.666.777-88')).toBeInTheDocument();

    const buscaInput = screen.getByPlaceholderText('🔍 Buscar por nome ou CPF...');
    fireEvent.change(buscaInput, { target: { value: 'Maria' } });

    expect(screen.getByText('Maria Antônia')).toBeInTheDocument();
    expect(screen.queryByText('João Pedro')).not.toBeInTheDocument();

    fireEvent.change(buscaInput, { target: { value: '555.666.777-88' } });
    expect(screen.queryByText('Maria Antônia')).not.toBeInTheDocument();
    expect(screen.getByText('João Pedro')).toBeInTheDocument();
  });
});
