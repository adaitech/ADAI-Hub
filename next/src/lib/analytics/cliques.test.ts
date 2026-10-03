import { eventosDoClique } from './cliques';

const nomes = (eventos: ReturnType<typeof eventosDoClique>) => eventos.map(([nome]) => nome);

describe('eventosDoClique', () => {
  it('Planeje sua visita (conversão) + clique_cta', () => {
    const eventos = eventosDoClique({ secao: 'hero', texto: 'Planeje sua visita', destino: 'http://localhost:3000/planeje-sua-visita', card: null });
    expect(eventos[0]).toEqual(['planejar_visita', { origem: 'hero', texto: 'Planeje sua visita' }]);
    expect(nomes(eventos)).toEqual(['planejar_visita', 'clique_cta']);
  });

  it('Como chegar (Google Maps) usa o card como unidade', () => {
    const [evento] = eventosDoClique({
      secao: 'carrossel-cards',
      texto: 'Como chegar',
      destino: 'https://www.google.com/maps/search/?api=1&query=Av.+Dom+Pedro+II',
      card: 'Campestre',
    });
    expect(evento).toEqual(['como_chegar', { origem: 'carrossel-cards', unidade: 'Campestre' }]);
  });

  it('Contribuir (conversão) pelo destino ou pelo texto', () => {
    expect(nomes(eventosDoClique({ secao: 'imagem-texto', texto: 'Contribuir agora', destino: 'http://localhost:3000/contribua', card: null }))).toContain('contribuir');
    expect(nomes(eventosDoClique({ secao: 'header', texto: 'Dízimos e ofertas', destino: 'https://exemplo.com/x', card: null }))).toContain('contribuir');
  });

  it('Baixar o app (App Store / Google Play)', () => {
    expect(eventosDoClique({ secao: 'texto-botoes', texto: 'Baixar na App Store', destino: 'https://apps.apple.com/mw/app/igreja-adai/id1', card: null })[0]).toEqual([
      'baixar_app',
      { origem: 'texto-botoes', loja: 'app_store' },
    ]);
    expect(eventosDoClique({ secao: 'texto-botoes', texto: 'Google Play', destino: 'https://play.google.com/store/apps/details?id=x', card: null })[0][1]).toMatchObject({ loja: 'google_play' });
  });

  it('Próximos eventos, ministérios e "Todas as mensagens"', () => {
    expect(eventosDoClique({ secao: 'proximos-eventos', texto: 'Participar online', destino: 'https://zoom.us/j/1', card: 'Semana de Jejum & Oração' })[0]).toEqual([
      'selecionar_evento',
      { evento: 'Semana de Jejum & Oração', acao: 'Participar online' },
    ]);
    expect(eventosDoClique({ secao: 'ministerios', texto: 'KIDS Crianças', destino: 'http://localhost:3000/ministerios/kids', card: 'KIDS' })[0]).toEqual([
      'selecionar_ministerio',
      { ministerio: 'KIDS' },
    ]);
    expect(nomes(eventosDoClique({ secao: 'serie-atual', texto: 'Todas as mensagens', destino: 'https://www.youtube.com/playlist?list=PL1', card: null }))).toEqual([
      'ver_todas_mensagens',
      'clique_cta',
    ]);
  });

  it('clique genérico: só clique_cta, sem query string no destino', () => {
    expect(eventosDoClique({ secao: 'footer', texto: 'Instagram', destino: 'https://www.instagram.com/adai/?utm=x', card: null })).toEqual([
      ['clique_cta', { origem: 'footer', texto: 'Instagram', destino: 'https://www.instagram.com/adai/' }],
    ]);
  });

  it('"Preguiça" ou "Ganância" não viram conversão por engano', () => {
    expect(nomes(eventosDoClique({ secao: 'serie-atual', texto: 'Parte 2: Ganância', destino: '', card: null }))).toEqual(['clique_cta']);
  });
});
