import { render, screen, fireEvent } from '@testing-library/react';
import FormTriagem, { isCPFValid } from '../src/components/FormTriagem';

describe('isCPFValid algorithm validation', () => {
  it('identifies valid CPFs', () => {
    expect(isCPFValid('529.982.247-25')).toBe(true);
    expect(isCPFValid('12345678909')).toBe(true);
    expect(isCPFValid('11144477735')).toBe(true);
  });

  it('identifies invalid CPFs', () => {
    expect(isCPFValid('000.000.000-00')).toBe(false);
    expect(isCPFValid('111.111.111-11')).toBe(false);
    expect(isCPFValid('123.456.789-01')).toBe(false);
    expect(isCPFValid('')).toBe(false);
    expect(isCPFValid('123')).toBe(false);
  });
});

describe('FormTriagem integration', () => {
  it('disables submit button and shows validation feedback on user input', () => {
    render(<FormTriagem onSubmit={() => {}} carregando={false} />);
    const submitBtn = screen.getByRole('button', { name: /Registrar Triagem/ });
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');

    expect(submitBtn).toBeDisabled();

    fireEvent.change(cpfInput, { target: { value: '111.111.111-11' } });
    expect(screen.getByText('CPF Inválido')).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    fireEvent.change(cpfInput, { target: { value: '529.982.247-25' } });
    expect(screen.getByText('CPF Válido')).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });
});
