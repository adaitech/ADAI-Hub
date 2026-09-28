import { render, screen, within } from '@testing-library/react';
import { ImagemTextoSection } from './ImagemTextoSection';
import mocks from './ImagemTextoSection.mock.json';
import { normalizeImagemTexto } from './normalize';
import type { ImagemTextoData } from './types';

const completo = mocks.completo as ImagemTextoData;
const direita = mocks.direita as ImagemTextoData;

describe('ImagemTextoSection', () => {
  it('Primeira vez: título em 2 linhas, lista de 3 itens e botão', () => {
    render(<ImagemTextoSection data={completo} index={2} />);
    const secao = screen.getByRole('region', { name: /Primeira vez/ });
    expect(secao).toHaveAttribute('data-posicao', 'esquerda');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Primeira vez naADAI?');
    expect(within(secao).getByText('Seus filhos')).toBeInTheDocument();
    const lista = within(secao).getByRole('list');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Planeje sua visita' })).toHaveAttribute('href', '/planeje-sua-visita');
  });

  it('Pastores Líderes: rótulo antes do título e foto à direita', () => {
    render(<ImagemTextoSection data={direita} index={3} />);
    expect(screen.getByRole('region', { name: /Rodrigo/ })).toHaveAttribute('data-posicao', 'direita');
    expect(screen.getByText('Pastores Líderes').tagName).toBe('P');
    expect(screen.getByRole('img')).toHaveAttribute('alt', expect.stringContaining('Rodrigo e Tati Soeiro'));
  });

  it('mostra botão e link juntos', () => {
    render(<ImagemTextoSection data={mocks.com_link as ImagemTextoData} index={1} />);
    expect(screen.getByRole('link', { name: 'Planeje sua visita' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toHaveAttribute('href', '/contato');
  });

  it('Contribua mostra as três ações com o botão principal em destaque', () => {
    render(<ImagemTextoSection data={mocks.contribua as ImagemTextoData} index={5} />);
    expect(screen.getByRole('link', { name: 'Contribuir agora' })).toHaveAttribute('href', '/contribua');
    expect(screen.getByRole('link', { name: /Projeto Nossa Casa/ })).toHaveAttribute('href', 'https://www.adai.com.br/nossacasa');
    expect(screen.getByRole('link', { name: 'Outras formas de contribuir' })).toHaveAttribute('href', '/contribua');
  });

  it('não renderiza nada sem título', () => {
    const { container } = render(<ImagemTextoSection data={{ ...completo, titulo: '' }} index={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('normalizeImagemTexto', () => {
  it('usa "esquerda" por padrão, descarta itens sem título e limita a 5', () => {
    const view = normalizeImagemTexto({
      ...completo,
      posicao_imagem: null,
      lista: [{ id: 1, titulo: '' }, ...Array.from({ length: 7 }, (_, i) => ({ id: i + 2, titulo: `Item ${i}` }))],
    });
    expect(view?.posicao).toBe('esquerda');
    expect(view?.lista).toHaveLength(5);
  });

  it('foto em P&B por padrão; colorida só quando o editor desliga', () => {
    expect(normalizeImagemTexto({ ...completo, preto_e_branco: null })?.pretoEBranco).toBe(true);
    expect(normalizeImagemTexto({ ...completo, preto_e_branco: false })?.pretoEBranco).toBe(false);
  });

  it('funciona sem foto', () => {
    expect(normalizeImagemTexto({ ...completo, imagem: null })?.imagem).toBeNull();
  });

  it('descarta botões secundários sem destino e limita a dois', () => {
    const botao = { id: 1, texto: 'Saiba mais', url: '/saiba-mais', estilo: 'contorno' as const };
    const view = normalizeImagemTexto({ ...completo, botoes_secundarios: [{ ...botao, url: 'javascript:alert(1)' }, botao, botao, botao] });
    expect(view?.botoesSecundarios).toHaveLength(2);
    expect(view?.botoesSecundarios[0].href).toBe('/saiba-mais');
  });
});
