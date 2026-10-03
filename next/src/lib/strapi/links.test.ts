import { normalizeBotoes, normalizeLink, normalizeLinks, sanitizeHref } from './links';

describe('sanitizeHref', () => {
  it.each([
    ['/planeje-sua-visita', '/planeje-sua-visita'],
    ['#conteudo', '#conteudo'],
    ['https://adai.com.br', 'https://adai.com.br'],
    ['HTTP://exemplo.com', 'HTTP://exemplo.com'],
    ['mailto:contato@adai.com.br', 'mailto:contato@adai.com.br'],
    ['tel:+5511999999999', 'tel:+5511999999999'],
    ['  /contribua  ', '/contribua'],
  ])('aceita destino seguro %p', (entrada, esperado) => {
    expect(sanitizeHref(entrada)).toBe(esperado);
  });

  it.each([
    ['javascript:alert(1)'],
    [' JavaScript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox'],
    ['//site-malicioso.com'],
    ['ftp://arquivo'],
    ['contribua'],
    [''],
    ['   '],
    [null],
    [undefined],
  ])('bloqueia %p', (entrada) => {
    expect(sanitizeHref(entrada)).toBeNull();
  });
});

describe('normalizeLink', () => {
  it('limpa o texto e mantém o destino e a nova aba', () => {
    expect(normalizeLink({ id: 1, texto: '  Agenda ', url: '/agenda', nova_aba: true })).toEqual({ label: 'Agenda', href: '/agenda', novaAba: true });
  });

  it('nova aba ausente → false', () => {
    expect(normalizeLink({ id: 1, texto: 'Agenda', url: '/agenda' })?.novaAba).toBe(false);
  });

  it('sem texto, sem destino ou destino inseguro → null (o link não aparece)', () => {
    expect(normalizeLink({ id: 1, texto: '', url: '/agenda' })).toBeNull();
    expect(normalizeLink({ id: 1, texto: 'Agenda', url: '' })).toBeNull();
    expect(normalizeLink({ id: 1, texto: 'Agenda', url: 'javascript:void(0)' })).toBeNull();
    expect(normalizeLink(null)).toBeNull();
  });
});

describe('normalizeLinks / normalizeBotoes', () => {
  it('descarta os inválidos e mantém a ordem do Strapi', () => {
    const links = normalizeLinks([
      { id: 1, texto: 'Um', url: '/um' },
      { id: 1, texto: '', url: '/vazio' },
      { id: 1, texto: 'Dois', url: 'https://dois.com' },
    ]);
    expect(links.map((l) => l.label)).toEqual(['Um', 'Dois']);
    expect(normalizeLinks(null)).toEqual([]);
  });

  it('estilo do botão: "contorno" quando pedido; qualquer outro valor vira "solido"', () => {
    const botoes = normalizeBotoes([
      { id: 1, texto: 'A', url: '/a', estilo: 'contorno' },
      { id: 1, texto: 'B', url: '/b', estilo: 'solido' },
      { id: 1, texto: 'C', url: '/c', estilo: 'desconhecido' as never },
      { id: 1, texto: 'D', url: 'javascript:x', estilo: 'contorno' },
    ]);
    expect(botoes.map((b) => [b.label, b.estilo])).toEqual([
      ['A', 'contorno'],
      ['B', 'solido'],
      ['C', 'solido'],
    ]);
    expect(normalizeBotoes(undefined)).toEqual([]);
  });
});
