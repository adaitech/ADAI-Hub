import { fake, mensagem, separar } from './__fixtures__/builders';
import elePrometeu from './__fixtures__/ele-prometeu.json';
import naoCompre from './__fixtures__/nao-compre-essa-briga.json';
import { montarSerieAtual, normalizeSerie } from './serie';
import type { YoutubePlaylistItem, YoutubeVideo } from './types';

const PLAYLIST = { id: 'PLinimigos', titulo: 'Inimigos Adoráveis' };
const junho = [
  mensagem('v1', '2026-06-07', 'Inimigos Adoráveis - Fofoca | Pr. Rodrigo Soeiro'),
  mensagem('v2', '2026-06-14', 'Inimigos Adoráveis - Ganância | Pr. Rodrigo Soeiro'),
  mensagem('v3', '2026-06-21', 'Inimigos Adoráveis - Preguiça | Pr. Rodrigo Soeiro'),
];
const liveAtiva = fake({ id: 'live', titulo: 'Culto ao vivo | ADAI On', inicio: '2026-06-28T14:00:00Z', estado: 'live' });
const liveEncerrada = fake({ id: 'live', titulo: 'Culto ao vivo | ADAI On', inicio: '2026-06-28T14:00:00Z', fim: '2026-06-28T16:10:00Z', publicado: '2026-06-28T21:00:00Z' });
const corte = mensagem('corte', '2026-06-28', 'Inimigos Adoráveis | Palavra Torpe | Pra. Tati Soeiro');

/** Horário de Brasília (UTC−3). */
const em = (iso: string) => new Date(`${iso}-03:00`);

function serie(pares: ReturnType<typeof fake>[], agora: Date, playlist = PLAYLIST) {
  return montarSerieAtual(normalizeSerie({ playlist, ...separar(pares), agora }), { agora });
}

const resumo = (s: ReturnType<typeof serie>) => s.partes.map((p) => `${p.parte}:${p.status}`);

describe('normalizeSerie + montarSerieAtual', () => {
  it('cenário 1: 4 mensagens normais → Parte 1 a 4 publicadas', () => {
    const s = serie([...junho, corte], em('2026-06-29T10:00'));
    expect(resumo(s)).toEqual(['1:published', '2:published', '3:published', '4:published']);
    expect(s.atual).toMatchObject({ parte: 4, titulo: 'Palavra Torpe', pregador: 'Pra. Tati Soeiro', data: '2026-06-28' });
  });

  it('cenário 2: 3 mensagens e o 4º domingo ainda não aconteceu → Parte 4 upcoming, sem inventar dados', () => {
    const s = serie(junho, em('2026-06-22T10:00'));
    expect(resumo(s)).toEqual(['1:published', '2:published', '3:published', '4:upcoming']);
    expect(s.partes[3]).toEqual({ parte: 4, status: 'upcoming', data: null, titulo: null, pregador: null, video: null });
    expect(s.atual?.parte).toBe(3);
  });

  it('cenário 3: live ativa no 4º domingo → Parte 4 live, sem Parte 5 e sem série "Culto ao vivo"', () => {
    const base = normalizeSerie({ playlist: PLAYLIST, ...separar([...junho, liveAtiva]), agora: em('2026-06-28T11:30') });
    const s = montarSerieAtual(base, { agora: em('2026-06-28T11:30') });
    expect(resumo(s)).toEqual(['1:published', '2:published', '3:published', '4:live']);
    expect(s.atual).toMatchObject({ parte: 4, status: 'live', titulo: 'Culto de hoje' });
    expect(s.serie.titulo).toBe('Inimigos Adoráveis');
    expect(base.aoVivo).toBe(true);
  });

  it('cenário 4: live encerrada sem corte → Parte 4 waiting-sermon-cut (culto completo assistível)', () => {
    const s = serie([...junho, liveEncerrada], em('2026-06-28T20:00'));
    expect(resumo(s)).toEqual(['1:published', '2:published', '3:published', '4:waiting-sermon-cut']);
    expect(s.atual).toMatchObject({ titulo: 'Culto de hoje', pregador: null });
    expect(s.atual?.video?.videoId).toBe('live');
    // No dia seguinte o rótulo deixa de ser "de hoje".
    expect(serie([...junho, liveEncerrada], em('2026-06-29T09:00')).atual?.titulo).toBe('Culto completo');
  });

  it('cenário 5: live + corte do mesmo domingo → o corte substitui a live, sem Parte 5', () => {
    const s = serie([...junho, liveEncerrada, corte], em('2026-06-28T20:00'));
    expect(resumo(s)).toEqual(['1:published', '2:published', '3:published', '4:published']);
    expect(s.atual).toMatchObject({ parte: 4, titulo: 'Palavra Torpe', pregador: 'Pra. Tati Soeiro' });
    expect(s.atual?.video?.videoId).toBe('corte');
  });

  it('cenário 5b: corte publicado na segunda de madrugada continua sendo a parte daquele domingo', () => {
    const corteSegunda = fake({ id: 'corte', titulo: 'Inimigos Adoráveis | Palavra Torpe | Pra. Tati Soeiro', publicado: '2026-06-29T03:50:00Z' });
    const s = serie([...junho, liveEncerrada, corteSegunda], em('2026-06-29T10:00'));
    expect(resumo(s)).toHaveLength(4);
    expect(s.atual?.video?.videoId).toBe('corte');
  });

  it('a mesma live renomeada para o título da mensagem (o que a ADAI faz) vira published', () => {
    const renomeada = fake({ id: 'live', titulo: 'Inimigos Adoráveis | Palavra Torpe | Pra. Tati Soeiro', inicio: '2026-06-28T14:00:00Z', fim: '2026-06-28T16:10:00Z' });
    expect(serie([...junho, renomeada], em('2026-06-28T20:00')).atual).toMatchObject({ status: 'published', titulo: 'Palavra Torpe' });
  });

  it('cenário 6: mês com 5 domingos → 5 partes', () => {
    const agosto = [mensagem('a1', '2026-08-02', 'Ele Prometeu Proteção | Pr. Rodrigo Soeiro')];
    const s = serie(agosto, em('2026-08-03T10:00'), { id: 'PLele', titulo: 'Ele Prometeu' });
    expect(resumo(s)).toEqual(['1:published', '2:upcoming', '3:upcoming', '4:upcoming', '5:upcoming']);
  });

  it('série antiga (mês acabou) não ganha partes futuras', () => {
    expect(resumo(serie(junho, em('2026-07-15T10:00')))).toEqual(['1:published', '2:published', '3:published']);
  });

  it('cenário 7: título fora do padrão não quebra', () => {
    const s = serie([fake({ id: 'x', titulo: '  Mensagem   especial  ', publicado: '2026-06-07T16:00:00Z' })], em('2026-06-08T10:00'));
    expect(s.atual).toMatchObject({ parte: 1, titulo: null, pregador: null });
    expect(s.serie.titulo).toBe('Mensagem especial');
  });

  it('ignora vídeo privado, removido (fora de videos.list) e live agendada (vira próxima transmissão)', () => {
    const privado = fake({ id: 'p', titulo: 'X | Y | Pr. Z', publicado: '2026-06-14T16:00:00Z', privacidade: 'private' });
    const agendada = fake({ id: 'ag', titulo: 'Culto ao vivo | ADAI On', estado: 'upcoming', agendado: '2026-06-28T14:00:00Z' });
    const { itens, videos } = separar([junho[0], privado, agendada]);
    const removido: YoutubePlaylistItem = { id: 'r', snippet: { title: 'Deleted video' }, contentDetails: { videoId: 'removido' } };
    const base = normalizeSerie({ playlist: PLAYLIST, itens: [...itens, removido], videos, agora: em('2026-06-27T10:00') });
    expect(base.conteudos.map((c) => c.video.videoId)).toEqual(['v1']);
    expect(base.proximaTransmissao).toBe('2026-06-28T14:00:00Z');
  });

  it('cenário 14: título personalizado muda só a exibição; o conteúdo continua do YouTube', () => {
    const base = normalizeSerie({ playlist: PLAYLIST, ...separar(junho), agora: em('2026-06-22T10:00') });
    const s = montarSerieAtual(base, { tituloPersonalizado: '  INIMIGOS ADORÁVEIS  ', agora: em('2026-06-22T10:00') });
    expect(s.serie).toMatchObject({ titulo: 'INIMIGOS ADORÁVEIS', tituloFonte: 'cms' });
    expect(s.partes.map((p) => p.titulo)).toEqual(['Fofoca', 'Ganância', 'Preguiça', null]);
  });

  it('título da série: vídeos → playlist → fallback', () => {
    const soCulto = normalizeSerie({ playlist: { id: 'P', titulo: 'NÃO COMPRE ESSA BRIGA' }, ...separar([liveEncerrada]) });
    expect(soCulto).toMatchObject({ titulo: 'NÃO COMPRE ESSA BRIGA', tituloFonte: 'playlist' });
    expect(normalizeSerie({ playlist: { id: 'P' }, itens: [], videos: [] })).toMatchObject({ titulo: 'Mensagens', tituloFonte: 'fallback' });
  });
});

describe('dados reais do canal (fixtures da YouTube Data API)', () => {
  const real = (f: typeof naoCompre) => ({
    playlist: { id: f.playlist.id, titulo: f.playlist.snippet.title },
    itens: f.itens as YoutubePlaylistItem[],
    videos: f.videos as YoutubeVideo[],
  });

  it('"Não Compre Essa Briga" em 27/09 (culto terminou, corte não saiu): Parte 3 aguardando o corte', () => {
    const agora = em('2026-09-27T20:00');
    const s = montarSerieAtual(normalizeSerie({ ...real(naoCompre), agora }), { agora });
    expect(s.serie).toMatchObject({ titulo: 'Não compre essa briga', tituloFonte: 'video' });
    expect(s.partes.map((p) => [p.parte, p.status, p.titulo, p.pregador])).toEqual([
      [1, 'published', 'Batalhas externas', 'Pr. Rodrigo Soeiro'],
      [2, 'published', 'Batalhas morais', 'Pr. Rodrigo Soeiro'],
      [3, 'waiting-sermon-cut', 'Culto de hoje', null],
    ]);
  });

  it('"Ele Prometeu" (agosto, 5 domingos, tema sem separador): 5 partes com tema pelo nome da playlist', () => {
    const agora = em('2026-08-31T10:00');
    const s = montarSerieAtual(normalizeSerie({ ...real(elePrometeu as typeof naoCompre), agora }), { agora });
    expect(s.serie.titulo).toBe('Ele Prometeu');
    expect(s.partes.map((p) => `${p.parte} ${p.data} ${p.titulo} | ${p.pregador}`)).toEqual([
      '1 2026-08-02 Proteção | Pr. Rodrigo Soeiro',
      '2 2026-08-09 Presença | Pr. Diego Alves',
      '3 2026-08-16 Perdão | Pr. Fellipe Magalhães',
      '4 2026-08-23 Paz | Pr. Rodrigo Soeiro',
      '5 2026-08-30 Provisão | Pr. Eduardo Isidio',
    ]);
  });
});
