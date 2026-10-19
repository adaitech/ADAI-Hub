import fixture from './__fixtures__/cursos.json';
import { filtrarCursos, normalizeCurso, normalizeCursoResumo, videoDoYoutube } from './curso';
import type { CursoResumoView, StrapiCurso } from './types';

const [talmidim, reset, start] = fixture.data as StrapiCurso[];

describe('normalizeCursoResumo (card do catálogo)', () => {
  it('curso completo vira card com endereço, vertente, capa e chips na ordem fixa', () => {
    const view = normalizeCursoResumo(reset);
    expect(view).toMatchObject({
      slug: 'reset',
      nome: 'Reset',
      href: '/eba/cursos/reset',
      vertente: 'integracao',
      rotuloVertente: 'Curso de integração',
      ordem: 10,
    });
    expect(view?.capa?.alt).toBe('Pastor fala ao microfone ao lado do tanque de batismo da ADAI.');
    expect(view?.chips).toEqual([
      { rotulo: 'Para quem', valor: 'A partir de 16 anos' },
      { rotulo: 'Duração', valor: '7 aulas de 1 hora, semanais' },
      { rotulo: 'Formato', valor: 'Presencial ou on-line' },
      { rotulo: 'Quando entrar', valor: 'A qualquer momento' },
    ]);
  });

  it.each([['nome'], ['slug'], ['resumo']] as const)('sem %s → null (o card não aparece)', (campo) => {
    expect(normalizeCursoResumo({ ...reset, [campo]: '  ' })).toBeNull();
  });

  it('slug fora do padrão de URL → null', () => {
    expect(normalizeCursoResumo({ ...reset, slug: 'Reset Novo' })).toBeNull();
  });

  it('apara espaços de nome e resumo', () => {
    expect(normalizeCursoResumo({ ...reset, nome: '  Reset ', resumo: ' Batismo. ' })).toMatchObject({ nome: 'Reset', resumo: 'Batismo.' });
  });

  it('sem capa, ou capa sem texto alternativo → capa null (card sem foto)', () => {
    expect(normalizeCursoResumo(start)?.capa).toBeNull();
    expect(normalizeCursoResumo({ ...reset, capa: { ...reset.capa!, alternativeText: ' ' } })?.capa).toBeNull();
  });

  it('chips só dos campos preenchidos; formato vira o texto do enum', () => {
    expect(normalizeCursoResumo(start)?.chips).toEqual([]);
    expect(normalizeCursoResumo({ ...start, formato: 'online' })?.chips).toEqual([{ rotulo: 'Formato', valor: 'On-line' }]);
    expect(normalizeCursoResumo({ ...start, formato: 'presencial' })?.chips).toEqual([{ rotulo: 'Formato', valor: 'Presencial' }]);
  });

  it('vertente ausente → integração; consolidação tem rótulo próprio; ordem ausente → 100', () => {
    expect(normalizeCursoResumo({ ...reset, vertente: null, ordem: null })).toMatchObject({ vertente: 'integracao', ordem: 100 });
    expect(normalizeCursoResumo({ ...reset, vertente: 'consolidacao' })?.rotuloVertente).toBe('Curso de consolidação');
  });
});

describe('normalizeCurso (página do curso)', () => {
  it('traz a inscrição como botão seguro', () => {
    expect(normalizeCurso(talmidim)?.inscricao).toEqual({
      label: 'Quero me inscrever',
      href: 'https://forms.gle/BtMpykm2Gs6zM1Mm6',
      novaAba: true,
      estilo: 'solido',
    });
  });

  it('inscrição com destino inseguro (javascript:) → sem botão', () => {
    expect(normalizeCurso({ ...talmidim, inscricao: { id: 1, texto: 'Inscrever', url: 'javascript:alert(1)' } })?.inscricao).toBeNull();
  });

  it('temPerguntasFrequentes só quando o corpo tem a seção de Perguntas frequentes', () => {
    expect(normalizeCurso(talmidim)?.temPerguntasFrequentes).toBe(false);
    const comFaq = { ...talmidim, secoes: [{ __component: 'sections.perguntas-frequentes', id: 1 }] };
    expect(normalizeCurso(comFaq)?.temPerguntasFrequentes).toBe(true);
  });

  it('vídeo do YouTube vira player; sem vídeo → null; data de atualização preservada', () => {
    const view = normalizeCurso({ ...talmidim, video_apresentacao: 'https://youtu.be/dQw4w9WgXcQ' });
    expect(view?.video?.videoId).toBe('dQw4w9WgXcQ');
    expect(normalizeCurso(talmidim)?.video).toBeNull();
    expect(normalizeCurso(talmidim)?.atualizadoEm).toBe('2026-10-18T12:00:00.000Z');
  });

  it('curso inválido → null', () => {
    expect(normalizeCurso({ ...talmidim, nome: null })).toBeNull();
  });
});

describe('videoDoYoutube (só YouTube vira player)', () => {
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30'],
    ['https://m.youtube.com/shorts/dQw4w9WgXcQ'],
    ['https://youtube.com/embed/dQw4w9WgXcQ'],
  ])('%s → vídeo dQw4w9WgXcQ no youtube-nocookie', (url) => {
    expect(videoDoYoutube(url)).toEqual({
      videoId: 'dQw4w9WgXcQ',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      thumbnail: null,
      embeddable: true,
    });
  });

  it.each([['https://vimeo.com/1'], ['texto'], [''], [null], ['https://youtu.be/curto12345'], ['https://evil.com/watch?v=dQw4w9WgXcQ']])('%p → null', (url) => {
    expect(videoDoYoutube(url)).toBeNull();
  });
});

describe('filtrarCursos (catálogo)', () => {
  const cursos = [talmidim, reset, start].map((c) => normalizeCursoResumo(c)!) as CursoResumoView[];

  it('ordena por ordem e desempata pelo nome', () => {
    expect(filtrarCursos(cursos).map((c) => c.slug)).toEqual(['reset', 'start', 'talmidim']);
    const empatados = cursos.map((c) => ({ ...c, ordem: 1 }));
    expect(filtrarCursos(empatados).map((c) => c.nome)).toEqual(['Reset', 'Start', 'Talmidim']);
  });

  it('filtra por vertente; vertente sem cursos → lista vazia', () => {
    expect(filtrarCursos(cursos, { vertente: 'integracao' })).toHaveLength(3);
    expect(filtrarCursos(cursos, { vertente: 'consolidacao' })).toEqual([]);
    expect(filtrarCursos(cursos, { vertente: 'todas' })).toHaveLength(3);
  });

  it('quantidade corta a lista; maior que a lista → todos; excluirSlug tira o curso atual', () => {
    expect(filtrarCursos(cursos, { quantidade: 2 }).map((c) => c.slug)).toEqual(['reset', 'start']);
    expect(filtrarCursos(cursos, { quantidade: 12 })).toHaveLength(3);
    expect(filtrarCursos(cursos, { excluirSlug: 'reset' }).map((c) => c.slug)).toEqual(['start', 'talmidim']);
  });
});
