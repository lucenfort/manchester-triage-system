import { render, screen } from '@testing-library/react';
import DashboardPage from '../src/app/page';

jest.mock('../src/services/api', () => ({
  obterEstatisticas: jest.fn(),
}));

const { obterEstatisticas } = require('../src/services/api');

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  it('renders stats and donut chart when API resolves successfully', async () => {
    obterEstatisticas.mockResolvedValue({
      total_aguardando: 6,
      vermelho: 1,
      laranja: 2,
      amarelo: 3,
      verde: 0,
      azul: 0,
      total_pacientes: 10,
      total_atendidos: 4,
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Painel de Controle')).toBeInTheDocument();

    expect(screen.getAllByText('Emergência').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Muito Urgente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Urgente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pouco Urgente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Não Urgente').length).toBeGreaterThan(0);

    expect(screen.getByText(/Total de pacientes cadastrados:/i)).toBeInTheDocument();
    expect(screen.getByText(/Em atendimento:/i)).toBeInTheDocument();

    const waitCounts = screen.getAllByText('6');
    expect(waitCounts.length).toBeGreaterThan(0);

    expect(screen.getByText('1 paciente')).toBeInTheDocument();
    expect(screen.getByText('2 pacientes')).toBeInTheDocument();
    expect(screen.getByText('3 pacientes')).toBeInTheDocument();
    expect(screen.getAllByText('0 pacientes').length).toBe(2);
  });

  it('renders zeroed stats when API fails', async () => {
    obterEstatisticas.mockRejectedValue(new Error('API Down'));

    render(<DashboardPage />);

    expect(await screen.findByText('Painel de Controle')).toBeInTheDocument();

    const waitCounts = screen.getAllByText('0');
    expect(waitCounts.length).toBeGreaterThan(0);
  });
});
