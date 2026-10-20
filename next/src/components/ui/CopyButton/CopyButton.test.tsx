import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CopyButton } from './CopyButton';
import { registrarEvento } from '@/lib/analytics/datalayer';

jest.mock('@/lib/analytics/datalayer', () => ({ registrarEvento: jest.fn() }));

describe('CopyButton', () => {
  beforeEach(() => jest.clearAllMocks());
  it('somente o sucesso da cópia Pix registra contribuir, sem enviar a chave', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue(undefined) } });
    render(<CopyButton valor="chave@exemplo.com" rotulo="Copiar chave Pix" conversao="pix" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(registrarEvento).toHaveBeenCalledWith('contribuir', { origem: 'pix', texto: 'Copiar chave Pix' }));
    expect(registrarEvento).toHaveBeenCalledTimes(1);
  });
  it('falha da cópia Pix não registra conversão', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<CopyButton valor="chave@exemplo.com" rotulo="Copiar chave Pix" conversao="pix" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar'));
    expect(registrarEvento).not.toHaveBeenCalled();
  });
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
