/**
 * Seed de desenvolvimento da EBA (strapi/src/bootstrap/seed-eba.ts) com um Strapi simulado:
 * as páginas só são montadas (e as imagens buscadas) quando vão ser criadas ou reconstruídas.
 */
import { CURSOS_EBA, TESTES_EBA, ebaSections, ebaTestesSections, ensureCursos, ensurePaginasEba, ensureTestes } from '../../../../strapi/src/bootstrap/seed-eba';

function strapiFake(existentes: string[]) {
  const pages = {
    findFirst: jest.fn(async ({ filters }: { filters: { slug: string } }) =>
      existentes.includes(filters.slug) ? { documentId: `doc-${filters.slug}` } : null,
    ),
    create: jest.fn(async ({ data }: { data: { slug: string } }) => ({ documentId: `doc-${data.slug}` })),
    update: jest.fn(async () => ({})),
    publish: jest.fn(async () => ({})),
  };
  const strapi = { documents: () => pages, log: { info: jest.fn(), warn: jest.fn() } };
  return { strapi: strapi as never, pages };
}

describe('ensurePaginasEba', () => {
  it('páginas já existem e o seed não subiu de versão → nada é montado nem gravado', async () => {
    const { strapi, pages } = strapiFake(['eba', 'eba-cursos', 'eba-testes']);
    const imagem = jest.fn(async () => 1);
    await ensurePaginasEba(strapi, imagem, false);
    expect(imagem).not.toHaveBeenCalled();
    expect(pages.create).not.toHaveBeenCalled();
    expect(pages.update).not.toHaveBeenCalled();
  });

  it('versão nova → reconstrói e publica as três páginas', async () => {
    const { strapi, pages } = strapiFake(['eba', 'eba-cursos', 'eba-testes']);
    const imagem = jest.fn(async () => 1);
    await ensurePaginasEba(strapi, imagem, true);
    expect(pages.update).toHaveBeenCalledTimes(3);
    expect(pages.publish).toHaveBeenCalledTimes(3);
    expect(imagem).toHaveBeenCalled();
  });

  it('banco novo → cria "eba", "eba-cursos" e "eba-testes" com SEO e seções', async () => {
    const { strapi, pages } = strapiFake([]);
    await ensurePaginasEba(strapi, jest.fn(async () => 1), false);
    const criadas = pages.create.mock.calls.map(([{ data }]) => data as { slug: string; sections: unknown[]; seo: { metaTitle: string } });
    expect(criadas.map((d) => d.slug)).toEqual(['eba', 'eba-cursos', 'eba-testes']);
    expect(criadas.every((d) => d.sections.length > 0 && d.seo.metaTitle.endsWith('| ADAI'))).toBe(true);
    // O título da página é o último item da trilha (ADAI › EBA › Testes); o SEO tem o título completo.
    const testes = pages.create.mock.calls.map(([{ data }]) => data as { slug: string; titulo: string; seo: { metaTitle: string } }).find((d) => d.slug === 'eba-testes')!;
    expect(testes.titulo).toBe('Testes');
    expect(testes.seo.metaTitle).toBe('Testes de dons e talentos — EBA | ADAI');
  });
});

type Secao = { __component: string; [campo: string]: unknown };
const textoDe = (secoes: Secao[]) => JSON.stringify(secoes);

describe('ensureTestes', () => {
  function strapiTestes(existentes: string[]) {
    const testes = {
      findFirst: jest.fn(async ({ filters }: { filters: { slug: string } }) =>
        existentes.includes(filters.slug) ? { documentId: `doc-${filters.slug}` } : null,
      ),
      create: jest.fn(async ({ data }: { data: { slug: string } }) => ({ documentId: `doc-${data.slug}` })),
      update: jest.fn(async () => ({})),
      publish: jest.fn(async () => ({})),
    };
    return { strapi: { documents: () => testes, log: { info: jest.fn() } } as never, testes };
  }

  it('banco novo → cria e publica os 5 testes', async () => {
    const { strapi, testes } = strapiTestes([]);
    await ensureTestes(strapi, false);
    expect(testes.create).toHaveBeenCalledTimes(5);
    expect(testes.publish).toHaveBeenCalledTimes(5);
  });

  it('testes já existem e o seed não subiu → nada muda; versão nova → atualiza', async () => {
    const slugs = TESTES_EBA.map((t) => t.slug);
    const parado = strapiTestes(slugs);
    await ensureTestes(parado.strapi, false);
    expect(parado.testes.update).not.toHaveBeenCalled();
    const novo = strapiTestes(slugs);
    await ensureTestes(novo.strapi, true);
    expect(novo.testes.update).toHaveBeenCalledTimes(5);
  });
});

describe('conteúdo dos testes (apostila do CDV)', () => {
  it('5 testes, na ordem da apostila, com o link do teste no Hub', () => {
    expect(TESTES_EBA.map((t) => t.slug)).toEqual(['dons-servico', 'dons-ministerio', 'talentos-naturais', 'estilo-pessoal', 'temperamento-pessoal']);
    for (const t of TESTES_EBA) {
      expect(t.link_teste).toBe(`/eba/testes/${t.slug}`);
      expect(t.resumo.length).toBeLessThanOrEqual(200);
      expect(t.o_que_e.length).toBeLessThanOrEqual(600);
      expect(t.como_responder.length).toBeLessThanOrEqual(400);
      expect(t.como_ler_resultado.length).toBeLessThanOrEqual(400);
      expect(t.itens.split(/\n/).length).toBeGreaterThan(1);
    }
    expect(TESTES_EBA.map((t) => t.ordem)).toEqual([...TESTES_EBA.map((t) => t.ordem)].sort((a, b) => a - b));
  });
});

describe('página eba-testes', () => {
  it('abertura (h1), como funciona, lista, perguntas e chamada para o CDV', async () => {
    const secoes = (await ebaTestesSections({} as never, jest.fn(async () => 7))) as Secao[];
    expect(secoes.map((s) => s.__component)).toEqual([
      'sections.imagem-texto',
      'sections.texto-rico',
      'sections.lista-testes',
      'sections.perguntas-frequentes',
      'sections.texto-botoes',
    ]);
    expect(secoes[0]).toMatchObject({ titulo: 'Testes de dons e talentos', imagem: 7, botao: { url: '#os-testes' } });
    expect(textoDe(secoes)).toContain('/eba/cursos/cdv');
  });
});

describe('home da EBA e CDV apontam para /eba/testes', () => {
  it('home: só área da equipe (sem área do aluno) e testes em /eba/testes', async () => {
    const secoes = (await ebaSections({} as never, jest.fn(async () => 1))) as Secao[];
    const texto = textoDe(secoes);
    expect(texto).not.toMatch(/aluno/i);
    expect(secoes.find((s) => s.titulo === 'Área da equipe da EBA')).toMatchObject({
      botoes: [{ texto: 'Entrar na área da equipe', url: 'https://eba.adai.com.br/login' }],
    });
    expect(texto).toContain('/eba/testes#dons-servico');
    expect(texto).not.toContain('eba.adai.com.br/teste/');
    expect(secoes[0]).toMatchObject({ botoes: expect.arrayContaining([{ texto: 'Conhecer os testes', url: '/eba/testes', estilo: 'contorno' }]) });
  });

  it('CDV: "Os testes do CDV" leva a /eba/testes#<teste>', async () => {
    type Curso = { slug: string; secoes: Secao[] };
    const cursos = {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }: { data: Curso }) => ({ documentId: data.slug })),
      publish: jest.fn(),
    };
    await ensureCursos({ documents: () => cursos, log: { info: jest.fn() } } as never, jest.fn(async () => 1), false);
    const cdv = cursos.create.mock.calls.map(([{ data }]) => data).find((d) => d.slug === 'cdv')!;
    const texto = textoDe(cdv.secoes);
    expect(texto).toContain('/eba/testes#temperamento-pessoal');
    expect(texto).not.toContain('eba.adai.com.br/teste/');
    expect(CURSOS_EBA.filter((c) => c.testes).map((c) => c.slug)).toEqual(['cdv']);
  });
});
