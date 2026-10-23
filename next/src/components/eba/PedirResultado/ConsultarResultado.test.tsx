import { render, screen } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { ConsultarResultado } from './ConsultarResultado';

describe('ConsultarResultado', () => {
  it('faixa com o título, a explicação e o link para o pedido do resultado', () => {
    const { container } = render(<ConsultarResultado />);
    expect(screen.getByRole('heading', { level: 2, name: 'Já fez os testes?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consultar meus resultados' })).toHaveAttribute('href', '/eba/resultado');
    expect(container.querySelector('[data-section="consultar-resultado"]')).not.toBeNull();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });
});
