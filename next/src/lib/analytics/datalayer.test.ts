import { normalizarValor, registrarEvento } from './datalayer';

describe('registrarEvento', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('empurra o evento com campos comuns e valores padronizados', () => {
    registrarEvento('como_chegar', { origem: 'carrossel-cards', unidade: '  Anália   Franco ' });
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toMatchObject({
      event: 'como_chegar',
      origem: 'carrossel-cards',
      unidade: 'analia franco',
      page_path: '/',
      site_ambiente: 'homologacao',
    });
    expect(window.dataLayer![0].event_id).toEqual(expect.any(String));
  });

  it('page_location sem query string nem âncora (podem carregar dados pessoais)', () => {
    window.history.pushState({}, '', '/contribua?email=pessoa@exemplo.com#pix');
    registrarEvento('ver_secao', { secao: 'hero', posicao: 1 });
    expect(window.dataLayer![0]).toMatchObject({ page_location: 'http://localhost/contribua', page_path: '/contribua' });
    window.history.pushState({}, '', '/');
  });

  it('omite parâmetros vazios e mantém números', () => {
    registrarEvento('ver_todas_mensagens', { origem: 'serie-atual', serie: '' });
    registrarEvento('ver_secao', { secao: 'hero', posicao: 1 });
    expect(window.dataLayer![0]).not.toHaveProperty('serie');
    expect(window.dataLayer![1]).toMatchObject({ posicao: 1 });
  });

  it('corta valores em 100 caracteres (limite do GA4)', () => {
    expect((normalizarValor('a'.repeat(150)) as string).length).toBe(100);
  });
});
