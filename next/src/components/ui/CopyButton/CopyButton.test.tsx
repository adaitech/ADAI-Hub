import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('copia o valor e anuncia o sucesso somente após resolver', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CopyButton valor="chave@exemplo.com" rotulo="Copiar chave Pix" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar chave Pix' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copiado!'));
    expect(writeText).toHaveBeenCalledWith('chave@exemplo.com');
  });

  it.each([true, false])('explica a cópia manual quando o clipboard falha ou está ausente (%s)', async (disponivel) => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: disponivel ? { writeText: jest.fn().mockRejectedValue(new Error('Negado')) } : undefined });
    render(<CopyButton valor="chave@exemplo.com" rotulo="Copiar chave Pix" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Selecione e copie o valor acima.'));
    expect(screen.getByRole('status')).not.toHaveTextContent('Copiado!');
  });
});
