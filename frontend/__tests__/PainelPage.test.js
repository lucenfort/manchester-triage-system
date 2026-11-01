import { render, screen, waitFor } from '@testing-library/react';
import PainelPage from '../src/app/painel/page';

jest.mock('../src/services/api', () => ({
  listarFila: jest.fn(),
  atenderPaciente: jest.fn(),
  limparFila: jest.fn(),
}));

jest.mock('../src/components/FilaPacientes', () => {
  return function MockFilaPacientes() {
    return <div data-testid="fila-pacientes-mock" />;
  };
});

jest.mock('../src/components/SeedDataButton', () => {
  return function MockSeedDataButton() {
    return <div data-testid="seed-button-mock" />;
  };
});

const { listarFila } = require('../src/services/api');

describe('PainelPage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  it('mostra erro visível quando a fila falha ao carregar', async () => {
    listarFila.mockRejectedValue(new Error('NetworkError when attempting to fetch resource.'));

    render(<PainelPage />);

    expect(await screen.findByText(/Erro ao carregar a fila:/i)).toBeInTheDocument();
    expect(screen.getByText(/NetworkError when attempting to fetch resource/i)).toBeInTheDocument();
  });

  it('renderiza a fila quando a API responde', async () => {
    listarFila.mockResolvedValue([
      {
        id: 1,
        classificacao: 'vermelho',
        queixa_principal: 'Dor intensa',
        created_at: new Date().toISOString(),
        paciente: { nome: 'Paciente Teste' },
      },
    ]);

    render(<PainelPage />);

    expect(await screen.findByText('Painel da Recepção')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(
          (content, element) =>
            element.tagName.toLowerCase() === 'p' &&
            element.textContent.includes('1 paciente aguardando atendimento')
        )
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('fila-pacientes-mock')).toBeInTheDocument();
  });
});
