import { render, screen, within } from '@testing-library/react';
import mocks from './TextoRicoSection.mock.json';
import { normalizeTextoRico } from './normalize';
import { TextoRicoSection } from './TextoRicoSection';
import type { TextoRicoData } from './types';

const politica = mocks.completo as unknown as TextoRicoData;
const base: TextoRicoData = { __component: 'sections.texto-rico', id: 1, titulo: 'Termos', conteudo: '## Seção\n\nTexto.' };

describe('normalizeTextoRico', () => {
  it('formata a data em pt-BR sem depender do fuso do servidor', () => {
    expect(normalizeTextoRico({ ...base, atualizado_em: '2026-10-02' })).toMatchObject({
      atualizadoEm: '2 de outubro de 2026',
      atualizadoEmIso: '2026-10-02',
    });
  });

  it('sem conteúdo → não exibe; título é opcional; data inválida é ignorada', () => {
    expect(normalizeTextoRico({ ...base, titulo: ' ' })).toMatchObject({ titulo: null });
    expect(normalizeTextoRico({ ...base, conteudo: '' })).toBeNull();
    expect(normalizeTextoRico({ ...base, atualizado_em: 'ontem' })?.atualizadoEm).toBeNull();
  });
});

describe('TextoRicoSection', () => {
  it('Política de Privacidade: h1, data, seções h2 e tabelas acessíveis', () => {
    render(<TextoRicoSection data={politica} index={0} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade e Cookies' })).toBeInTheDocument();
    expect(screen.getByText('2 de outubro de 2026')).toHaveAttribute('datetime', '2026-10-02');
    const secoes = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(secoes[0]).toBe('1. Quem é responsável pelos seus dados');
    expect(secoes).toHaveLength(14);
    const tabelas = screen.getAllByRole('region', { name: /Tabela/ });
    expect(tabelas.map((t) => t.getAttribute('aria-label'))).toEqual([
      'Tabela 1 (role para os lados no celular)',
      'Tabela 2 (role para os lados no celular)',
    ]);
    expect(within(tabelas[0]).getByRole('table')).toBeInTheDocument();
  });

  it('links: e-mail e externos em nova aba com aviso; javascript: vira texto', () => {
    render(
      <TextoRicoSection
        data={{ ...base, conteudo: '[contato](mailto:contato@adai.com.br) · [ANPD](https://www.gov.br/anpd) · [mau](javascript:alert(1))' }}
        index={0}
      />,
    );
    expect(screen.getByRole('link', { name: 'contato' })).toHaveAttribute('href', 'mailto:contato@adai.com.br');
    expect(screen.getByRole('link', { name: 'ANPD (abre em nova aba)' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('link', { name: 'mau' })).toBeNull();
    expect(screen.getByText(/mau/)).toBeInTheDocument();
  });

  it('fora do topo: título h2 e "##" do texto vira h3; HTML cru é ignorado', () => {
    const { container } = render(<TextoRicoSection data={{ ...base, conteudo: '## Seção\n\n<script>alert(1)</script>' }} index={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Termos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Seção' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('sem título (abaixo do Hero): nenhum cabeçalho próprio e "##" vira h2', () => {
    render(<TextoRicoSection data={{ ...base, titulo: null, conteudo: '## Parte\n\nTexto da página.' }} index={1} />);
    expect(screen.getAllByRole('heading').map((h) => [h.tagName, h.textContent])).toEqual([['H2', 'Parte']]);
    expect(screen.getByText('Texto da página.')).toBeInTheDocument();
  });

  it('link #preferencias-cookies vira o botão que reabre o aviso de cookies', () => {
    const abrir = jest.fn();
    window.addEventListener('adai:abrir-preferencias-cookies', abrir);
    render(<TextoRicoSection data={{ ...base, conteudo: 'Mude quando quiser: [Preferências de cookies](#preferencias-cookies).' }} index={0} />);
    expect(screen.queryByRole('link', { name: /Preferências/ })).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Preferências de cookies' }).click();
    expect(abrir).toHaveBeenCalledTimes(1);
    window.removeEventListener('adai:abrir-preferencias-cookies', abrir);
  });
});
