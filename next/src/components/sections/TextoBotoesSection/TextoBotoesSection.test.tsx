import { render, screen } from '@testing-library/react';
import { TextoBotoesSection } from './TextoBotoesSection';
import { normalizeTextoBotoes } from './normalize';
import mocks from './TextoBotoesSection.mock.json';
import type { TextoBotoesData } from './types';

const completo = mocks.completo as TextoBotoesData;

describe('TextoBotoesSection', () => {
  it('liga as duas lojas oficiais sem perder os parâmetros da Play Store', () => {
    render(<TextoBotoesSection data={completo} index={1} />);
    expect(screen.getByRole('heading', { name: 'A igreja no seu bolso', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Baixar na App Store/ })).toHaveAttribute('href', 'https://apps.apple.com/mw/app/igreja-adai/id6736497082');
    expect(screen.getByRole('link', { name: /Baixar no Google Play/ })).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=br.com.inchurch.adaltoipiranga&hl=pt_BR&pli=1');
  });

  it('mantém o título sem ações e descarta botões inseguros', () => {
    const view = normalizeTextoBotoes({
      ...completo,
      botoes: [
        { id: 1, texto: 'Inválido', url: 'javascript:alert(1)' },
        ...(completo.botoes ?? []),
        { id: 2, texto: 'Terceiro', url: '/terceiro' },
      ],
    });
    expect(view?.botoes).toHaveLength(2);
    expect(view?.botoes[0].label).toBe('Baixar na App Store');
    render(<TextoBotoesSection data={mocks.minimo as TextoBotoesData} index={0} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
