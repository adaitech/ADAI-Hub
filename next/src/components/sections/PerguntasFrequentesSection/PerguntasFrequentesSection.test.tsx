import { fireEvent, render, screen } from '@testing-library/react';
import { PerguntasFrequentesSection } from './PerguntasFrequentesSection';
import { normalizePerguntasFrequentes } from './normalize';
import mocks from './PerguntasFrequentesSection.mock.json';
import type { PerguntasFrequentesData } from './types';

const completo = mocks.completo as PerguntasFrequentesData;

describe('PerguntasFrequentesSection', () => {
  it('mostra as quatro perguntas em painéis acessíveis que abrem por clique', () => {
    render(<PerguntasFrequentesSection data={completo} index={1} />);
    expect(screen.getByRole('heading', { name: 'Perguntas frequentes', level: 2 })).toBeInTheDocument();
    const primeira = screen.getByText('Posso ir sozinho(a)?');
    const painel = primeira.closest('details');
    expect(painel).not.toHaveAttribute('open');
    fireEvent.click(primeira);
    expect(painel).toHaveAttribute('open');
    expect(screen.getByText(/Muitas pessoas vêm pela primeira vez sozinhas/)).toBeInTheDocument();
    expect(document.querySelectorAll('details')).toHaveLength(4);
  });

  it('descarta perguntas vazias e limita a doze', () => {
    const view = normalizePerguntasFrequentes({
      ...completo,
      perguntas: [
        { id: 0, pergunta: 'Sem resposta', resposta: '' },
        ...Array.from({ length: 14 }, (_, i) => ({ id: i + 1, pergunta: `Pergunta ${i}`, resposta: 'Resposta' })),
      ],
    });
    expect(view?.perguntas).toHaveLength(12);
    expect(normalizePerguntasFrequentes({ ...completo, perguntas: [] })).toBeNull();
  });
});
