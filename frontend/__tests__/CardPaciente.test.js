import { render, screen, fireEvent } from '@testing-library/react';
import CardPaciente, { parseUTCDate } from '../src/components/CardPaciente';

const mockTriagem = {
  id: 1,
  classificacao: 'vermelho',
  queixa_principal: 'Dor torácica intensa',
  created_at: new Date().toISOString(),
  paciente: {
    nome: 'João da Silva',
  },
};

describe('CardPaciente', () => {
  it('renderiza o nome do paciente', () => {
    render(<CardPaciente triagem={mockTriagem} onChamar={() => {}} />);
    expect(screen.getByText('João da Silva')).toBeInTheDocument();
  });

  it('renderiza a queixa principal', () => {
    render(<CardPaciente triagem={mockTriagem} onChamar={() => {}} />);
    expect(screen.getByText('Dor torácica intensa')).toBeInTheDocument();
  });

  it('renderiza a classificação correta', () => {
    render(<CardPaciente triagem={mockTriagem} onChamar={() => {}} />);
    expect(screen.getByText(/Emergência/)).toBeInTheDocument();
  });

  it('chama onChamar ao clicar no botão', () => {
    const onChamar = jest.fn();
    render(<CardPaciente triagem={mockTriagem} onChamar={onChamar} />);
    fireEvent.click(screen.getByText('Chamar'));
    expect(onChamar).toHaveBeenCalledWith(1);
  });

  it('normaliza strings ISO sem Z como UTC em parseUTCDate', () => {
    const d = parseUTCDate('2026-05-26T20:00:00');
    expect(d.toISOString()).toBe('2026-05-26T20:00:00.000Z');
  });
});
