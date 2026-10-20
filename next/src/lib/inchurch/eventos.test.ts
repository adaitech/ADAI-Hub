import fixture from './__fixtures__/eventos.json';
import { ehGrupoDeConexao, eventosDaAgenda, idIgrejaValido, normalizeEventos, paraIsoSaoPaulo, proximosEventos } from './eventos';
import type { InchurchEvento } from './types';

const reais = fixture.results as InchurchEvento[];
const idsGc = new Set(fixture.idsCategoriaGc);
const em = (iso: string) => new Date(`${iso}-03:00`);

const evento = (parcial: Partial<InchurchEvento> & { id: number; name: string; start_datetime: string }): InchurchEvento => ({
  active: true,
  enabled: true,
  show_on_site: true,
  recurrence_model: false,
  end_datetime: parcial.start_datetime,
  ...parcial,
});

describe('normalizeEventos (dados reais da inChurch, 28/09/2026)', () => {
  it('preserva múltiplas igrejas sem duplicar o card e inclui o evento em ambas as unidades', () => {
    const raw = evento({ id: 1646183, name: 'HACKATHON ADAI HUB', start_datetime: '2027-01-01T10:00:00' });
    const dados = normalizeEventos([raw, raw], new Set(), new Date(), new Map([[raw.id, [31876, 30146, 30146]]]));
    expect(dados.eventos).toHaveLength(1);
    expect(dados.eventos[0]).toMatchObject({ igrejaId: 30146, igrejaIds: [30146, 31876] });
    for (const igrejaId of [30146, 31876]) expect(proximosEventos(dados, { igrejaId, agora: new Date('2026-01-01') })).toHaveLength(1);
    expect(proximosEventos(dados, { igrejaId: 999, agora: new Date('2026-01-01') })).toHaveLength(0);
  });
  it('usa a unidade informada pela API quando não existe mapa externo', () => {
    const raw = evento({ id: 1, name: 'Evento', start_datetime: '2027-01-01T09:00:00', responsible_church: { id: 30146, name: 'Campestre' } });
    expect(normalizeEventos([raw], new Set()).eventos[0].igrejaId).toBe(30146);
    expect(normalizeEventos([raw], new Set(), new Date(), new Map([[1, 31876]])).eventos[0].igrejaId).toBe(31876);
  });
  const dados = normalizeEventos(reais, idsGc, em('2026-09-28T09:00'));
  const nomes = dados.eventos.map((e) => e.nome);

  it('lista os mesmos eventos da tela "Próximos Eventos" do painel (menos os que não são do site)', () => {
    expect(nomes).toEqual([
      'Semana de Jejum & Oração',
      'ADAI 360',
      'Quarto de Guerra',
      'The Chosen',
      'Entre Amigas',
      'Connect Pulse',
      'Summit Next Gen | InPulse',
      'SOLA | 10 horas de louvor e adoração',
      'Conferência ADAI para voluntários',
    ]);
  });

  it('nenhum GC aparece (por categoria ou por nome)', () => {
    expect(nomes.some((n) => /^GC\b/.test(n))).toBe(false);
  });

  it('show_on_site falso ou ausente não exclui eventos ativos e habilitados', () => {
    const base = { name: 'Evento de teste', start_datetime: '2027-01-01T10:00:00' };
    for (const show_on_site of [false, undefined, null]) {
      expect(normalizeEventos([evento({ id: 1, ...base, show_on_site })], new Set()).eventos).toHaveLength(1);
    }
  });

  it('recorrência: um item com todas as datas, sem o modelo nem cópias', () => {
    const jejum = dados.eventos.find((e) => e.nome === 'Semana de Jejum & Oração')!;
    expect(jejum.ocorrencias.map((o) => o.inicio.slice(0, 10))).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    expect(jejum.link).toEqual({ url: expect.stringMatching(/^https:\/\/.*zoom\.us\//), texto: 'Participar online' });
    const quarto = dados.eventos.find((e) => e.nome === 'Quarto de Guerra')!;
    expect(quarto.ocorrencias).toHaveLength(2);
  });

  it('usa a arte da inChurch (https, 16:9)', () => {
    for (const e of dados.eventos) expect(e.imagem?.url).toMatch(/^https:\/\/storage\.googleapis\.com\//);
  });
});

describe('regras', () => {
  it('GC: categoria "Grupo de Conexão" ou nome "GC …"', () => {
    expect(ehGrupoDeConexao(evento({ id: 1, name: 'GC Daniela', start_datetime: '2026-10-01T20:00:00' }), new Set())).toBe(true);
    expect(ehGrupoDeConexao(evento({ id: 2, name: 'Encontro', start_datetime: '2026-10-01T20:00:00' }), new Set([2]))).toBe(true);
    expect(ehGrupoDeConexao(evento({ id: 3, name: 'GCs da cidade: culto', start_datetime: '2026-10-01T20:00:00' }), new Set())).toBe(false);
  });

  it('inativo, desabilitado ou modelo de recorrência → fora; show_on_site não filtra', () => {
    const base = { name: 'X', start_datetime: '2026-10-01T20:00:00' };
    const dados = normalizeEventos(
      [
        evento({ id: 1, ...base, active: false }),
        evento({ id: 2, ...base, name: 'Y', enabled: false }),
        evento({ id: 3, ...base, name: 'Z', show_on_site: false }),
        evento({ id: 4, ...base, name: 'W', recurrence_model: true }),
        evento({ id: 5, ...base, name: 'OK' }),
      ],
      new Set(),
    );
    expect(dados.eventos.map((e) => e.nome)).toEqual(['Z', 'OK']);
  });

  it('link: inscrição externa > link online > nenhum; bloqueia javascript:', () => {
    const [a, b, c] = normalizeEventos(
      [
        evento({ id: 1, name: 'A', start_datetime: '2026-10-01T10:00:00', has_external_subscription: true, external_subscription_url: 'https://sympla.com/x', event_url: 'https://zoom.us/j/1' }),
        evento({ id: 2, name: 'B', start_datetime: '2026-10-02T10:00:00', event_url: 'javascript:alert(1)' }),
        evento({ id: 3, name: 'C', start_datetime: '2026-10-03T10:00:00' }),
      ],
      new Set(),
    ).eventos;
    expect(a.link).toEqual({ url: 'https://sympla.com/x', texto: 'Inscreva-se' });
    expect(b.link).toBeNull();
    expect(c.link).toBeNull();
  });

  it('datas sem fuso são horário de São Paulo', () => {
    expect(paraIsoSaoPaulo('2026-10-14T20:00:00')).toBe('2026-10-14T20:00:00-03:00');
    expect(paraIsoSaoPaulo('2026-10-14T20:00:00Z')).toBe('2026-10-14T20:00:00Z');
    expect(paraIsoSaoPaulo('lixo')).toBeNull();
  });
});

describe('proximosEventos (aplica "agora" e quantidade)', () => {
  const dados = normalizeEventos(reais, idsGc, em('2026-09-28T09:00'));

  it('tira datas que já acabaram e respeita a quantidade', () => {
    const lista = proximosEventos(dados, { agora: em('2026-10-06T06:00'), limite: 3 });
    expect(lista).toHaveLength(3);
    expect(lista[0].nome).toBe('Conferência ADAI para voluntários'); // destaque no painel vem primeiro
    const jejum = proximosEventos(dados, { agora: em('2026-10-06T06:00'), limite: 12 }).find((e) => e.nome.startsWith('Semana'))!;
    expect(jejum.ocorrencias[0].inicio.slice(0, 10)).toBe('2026-10-07');
  });

  it('sem datas futuras → lista vazia', () => {
    expect(proximosEventos(dados, { agora: em('2027-01-01T00:00') })).toEqual([]);
  });
});

describe('eventosDaAgenda (listagem cronológica completa)', () => {
  it('remove ocorrências encerradas, preserva recorrência e ignora destaque na ordenação', () => {
    const dados = normalizeEventos(
      [
        evento({ id: 1, name: 'Destaque distante', start_datetime: '2026-10-20T10:00:00', highlighted: true }),
        evento({ id: 2, name: 'Próximo', start_datetime: '2026-10-11T10:00:00' }),
        evento({ id: 3, name: 'Recorrente', start_datetime: '2026-10-12T10:00:00' }),
        evento({ id: 4, name: 'Recorrente', start_datetime: '2026-10-18T10:00:00' }),
        evento({ id: 5, name: 'Encerrado', start_datetime: '2026-10-01T10:00:00', end_datetime: '2026-10-02T10:00:00' }),
      ],
      new Set(),
    );

    const agenda = eventosDaAgenda(dados, { agora: em('2026-10-10T09:00') });

    expect(agenda.map((item) => item.nome)).toEqual(['Próximo', 'Recorrente', 'Destaque distante']);
    expect(agenda.find((item) => item.nome === 'Recorrente')?.ocorrencias.map((ocorrencia) => ocorrencia.inicio.slice(0, 10))).toEqual(['2026-10-12', '2026-10-18']);
  });

  it('não limita a lista de eventos futuros', () => {
    const dados = normalizeEventos(Array.from({ length: 13 }, (_, indice) => evento({
      id: indice + 1,
      name: `Evento ${indice + 1}`,
      start_datetime: `2026-11-${String(indice + 1).padStart(2, '0')}T10:00:00`,
    })), new Set());

    expect(eventosDaAgenda(dados, { agora: em('2026-10-10T09:00') })).toHaveLength(13);
  });
});

describe('unidade (igreja na inChurch)', () => {
  const agora = em('2026-10-01T09:00');
  const lista = [
    evento({ id: 1, name: 'Café Campestre', start_datetime: '2026-10-10T09:00:00' }),
    evento({ id: 2, name: 'Conferência geral', start_datetime: '2026-10-11T09:00:00' }),
    evento({ id: 3, name: 'Culto Santos', start_datetime: '2026-10-12T09:00:00' }),
    evento({ id: 4, name: 'Pulse', start_datetime: '2026-10-13T19:00:00' }),
    evento({ id: 5, name: 'Pulse', start_datetime: '2026-10-20T19:00:00' }),
  ];
  const mapa = new Map([
    [1, 30146],
    [3, 31876],
    [5, 30146],
  ]);
  const dados = normalizeEventos(lista, new Set(), agora, mapa);
  const igrejaDe = (nome: string) => dados.eventos.find((e) => e.nome === nome)?.igrejaId;

  it('grava a igreja do evento; quem não está em nenhuma igreja é geral (null)', () => {
    expect(igrejaDe('Café Campestre')).toBe(30146);
    expect(igrejaDe('Culto Santos')).toBe(31876);
    expect(igrejaDe('Conferência geral')).toBeNull();
  });

  it('mesmo nome em igrejas diferentes: um card por igreja (não some de nenhuma unidade)', () => {
    const batismos = normalizeEventos(
      [
        evento({ id: 10, name: 'Batismo', start_datetime: '2026-10-18T10:00:00' }),
        evento({ id: 11, name: 'Batismo', start_datetime: '2026-10-25T10:00:00' }),
        evento({ id: 12, name: 'Batismo', start_datetime: '2026-11-01T10:00:00' }),
      ],
      new Set(),
      agora,
      new Map([
        [10, 30146],
        [11, 31876],
        [12, 30146],
      ]),
    );
    expect(batismos.eventos.map((e) => [e.igrejaId, e.ocorrencias.length])).toEqual([
      [30146, 2],
      [31876, 1],
    ]);
    const santos = proximosEventos(batismos, { agora, limite: 12, igrejaId: 31876 });
    expect(santos.map((e) => e.igrejaId)).toEqual([31876]);
  });

  it('sem mapa, todos são gerais', () => {
    expect(normalizeEventos(lista, new Set(), agora).eventos.every((e) => e.igrejaId === null)).toBe(true);
  });

  it('filtro: eventos da unidade + gerais; os de outra unidade ficam de fora', () => {
    const nomes = (igrejaId?: number | null) => proximosEventos(dados, { agora, limite: 12, igrejaId }).map((e) => e.nome);
    expect(nomes(30146)).toEqual(['Café Campestre', 'Conferência geral', 'Pulse', 'Pulse']);
    expect(nomes(31876)).toEqual(['Conferência geral', 'Culto Santos', 'Pulse']);
    expect(nomes()).toEqual(['Café Campestre', 'Conferência geral', 'Culto Santos', 'Pulse', 'Pulse']);
  });

  it('idIgrejaValido: só inteiro positivo', () => {
    expect(idIgrejaValido(30146)).toBe(30146);
    expect(idIgrejaValido(0)).toBeNull();
    expect(idIgrejaValido(-1)).toBeNull();
    expect(idIgrejaValido(1.5)).toBeNull();
    expect(idIgrejaValido('30146')).toBeNull();
    expect(idIgrejaValido(null)).toBeNull();
  });
});
