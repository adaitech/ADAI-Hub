import aulas from './__fixtures__/aulas.json';
import { CURSOS_DE_AULAS, curso, normalizeAula, ordenarAulas, urlDoVideo } from './aula';
import type { StrapiAula } from './types';

const base = aulas.data[0] as unknown as StrapiAula;
const com = (campos: Partial<StrapiAula>): StrapiAula => ({ ...base, ...campos });

describe('urlDoVideo (só o player do Vimeo)', () => {
  it.each([
    'https://player.vimeo.com/video/1047669729?h=5de9c9b90c&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479',
    'https://player.vimeo.com/video/1047669656?h=aa973e5d4e',
    'https://player.vimeo.com/video/1047669656',
  ])('aceita %s', (url) => {
    expect(urlDoVideo(url)).toBe(url);
  });

  it('decodifica &amp; (o site atual guardava assim) e ignora aspas e espaços nas pontas', () => {
    expect(urlDoVideo('  https://player.vimeo.com/video/1047669729?h=5de9c9b90c&amp;badge=0&amp;autopause=0"  ')).toBe(
      'https://player.vimeo.com/video/1047669729?h=5de9c9b90c&badge=0&autopause=0',
    );
  });

  it.each([
    '',
    null,
    undefined,
    'http://player.vimeo.com/video/1047669729',
    'https://vimeo.com/1047669729',
    'https://player.vimeo.com.evil.com/video/1047669729',
    'https://evil.com/player.vimeo.com/video/1047669729',
    'https://user:senha@player.vimeo.com/video/1047669729',
    'https://player.vimeo.com:8443/video/1047669729',
    'https://player.vimeo.com/video/abc',
    'https://player.vimeo.com/video/1047669729/../../x',
    'https://player.vimeo.com/outro/1047669729',
    'javascript:alert(1)',
    'https://www.youtube.com/embed/abc',
    'https://player.vimeo.com/video/1047669729#"><script>',
    'https://player.vimeo.com/video/1047669729?h=abc&onload=alert(1)',
    'https://player.vimeo.com/video/1047669729?h="><script>',
    'https://player.vimeo.com/video/1047669729?h=a b',
  ])('recusa %p', (url) => {
    expect(urlDoVideo(url as string)).toBeNull();
  });
});

describe('normalizeAula', () => {
  it('campos principais, foto do autor com URL absoluta e o vídeo limpo', () => {
    const a = normalizeAula(base)!;
    expect(a).toMatchObject({
      curso: 'dna',
      endereco: 'aula-01',
      titulo: '01 - Fundamentos, Visão e Pilares',
      autor: 'Pr. Rodrigo Soeiro',
      cargoAutor: 'Pastor Líder',
      descricao: 'Aula 01 - Fundamentos, Visão e Pilares',
      ordem: 2,
    });
    expect(a.videoUrl).toMatch(/^https:\/\/player\.vimeo\.com\/video\/1047669729\?h=5de9c9b90c/);
    expect(a.fotoAutor).toMatchObject({ alt: 'Foto do Pr. Rodrigo Soeiro.' });
    expect(a.fotoAutor?.url).toMatch(/\/uploads\/avatar_rodrigo_soeiro\.webp$/);
  });

  it('sem foto, autor, cargo ou descrição → null; ordem ausente vai para o fim', () => {
    const a = normalizeAula(com({ foto_autor: null, autor: ' ', cargo_autor: null, descricao: '', ordem: null }))!;
    expect(a).toMatchObject({ fotoAutor: null, autor: null, cargoAutor: null, descricao: null, ordem: 100 });
  });

  it.each([
    ['sem título', { titulo: '  ' }],
    ['curso desconhecido', { curso: 'start' as never }],
    ['endereço inválido (maiúscula)', { endereco: 'Aula-01' }],
    ['endereço com barra', { endereco: 'aula/01' }],
    ['endereço vazio', { endereco: '' }],
    ['vídeo de outro site', { video_url: 'https://evil.com/video/1' }],
    ['sem vídeo', { video_url: null }],
  ])('%s → null (a aula não aparece)', (_nome, campos) => {
    expect(normalizeAula(com(campos))).toBeNull();
  });
});

describe('ordenarAulas e cursos', () => {
  it('ordem do Strapi, depois título', () => {
    const lista = aulas.data.map((a) => normalizeAula(a as unknown as StrapiAula)!);
    expect(ordenarAulas(lista).map((a) => a.endereco)).toEqual(['boas-vindas', 'aula-01', 'aula-02']);
    const empate = ordenarAulas([{ ...lista[0], ordem: 5, titulo: 'B' }, { ...lista[1], ordem: 5, titulo: 'A' }]);
    expect(empate.map((a) => a.titulo)).toEqual(['A', 'B']);
  });

  it('os dois cursos, com o rótulo do menu do site atual', () => {
    expect(CURSOS_DE_AULAS).toEqual([
      { slug: 'reset', nome: 'Reset', rotulo: 'Aulas / Reset' },
      { slug: 'dna', nome: 'DNA', rotulo: 'Aulas / DNA' },
    ]);
    expect(curso('dna')?.nome).toBe('DNA');
    expect(curso('start')).toBeNull();
    expect(curso('../dna')).toBeNull();
  });
});
