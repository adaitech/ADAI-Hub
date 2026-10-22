/**
 * Seed das aulas em vídeo (`strapi/src/bootstrap/seed-aulas.ts`): os dados do site atual chegam completos e
 * válidos, e a criação é idempotente. Strapi simulado em memória (o arquivo do seed não importa `@strapi/*`).
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { AULAS_EBA, ensureAulas, type ImagemDeAula, type StrapiSeedAulas } from '../../../../strapi/src/bootstrap/seed-aulas';
import { normalizeAula, urlDoVideo } from '@/lib/eba/aula';
import type { StrapiAula } from '@/lib/eba/types';

const SEED = join(__dirname, '../../../../strapi/seed');

function strapiEmMemoria() {
  const docs: { documentId: string; data: Record<string, unknown>; publicado: boolean }[] = [];
  const log: string[] = [];
  const strapi: StrapiSeedAulas = {
    documents: () => ({
      async findFirst({ filters }) {
        const d = docs.find((x) => x.data.curso === filters.curso && x.data.endereco === filters.endereco);
        return d ? { documentId: d.documentId } : null;
      },
      async create({ data }) {
        const d = { documentId: `doc-${docs.length + 1}`, data: data as Record<string, unknown>, publicado: false };
        docs.push(d);
        return { documentId: d.documentId };
      },
      async update({ documentId, data }) {
        const d = docs.find((x) => x.documentId === documentId)!;
        d.data = data as Record<string, unknown>;
        return { documentId };
      },
      async publish({ documentId }) {
        docs.find((x) => x.documentId === documentId)!.publicado = true;
      },
    }),
    log: { info: (m) => log.push(m) },
  };
  return { strapi, docs, log };
}
const imagem: ImagemDeAula = jest.fn(async () => 7);

describe('AULAS_EBA (conteúdo do site atual)', () => {
  it('17 aulas do DNA e 8 do Reset', () => {
    expect(AULAS_EBA.filter((a) => a.curso === 'dna')).toHaveLength(17);
    expect(AULAS_EBA.filter((a) => a.curso === 'reset')).toHaveLength(8);
  });

  it('curso + endereço únicos, ordem 1..N em cada curso, endereços no padrão do Strapi', () => {
    const chaves = AULAS_EBA.map((a) => `${a.curso}/${a.endereco}`);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const c of ['dna', 'reset'] as const) {
      const ordens = AULAS_EBA.filter((a) => a.curso === c).map((a) => a.ordem);
      expect(ordens).toEqual(ordens.map((_, i) => i + 1));
    }
    for (const a of AULAS_EBA) expect(a.endereco).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('todo vídeo é o player do Vimeo, já limpo (sem &amp; nem aspas), e a aula normaliza sem perder nada', () => {
    for (const a of AULAS_EBA) {
      expect(a.video_url).not.toMatch(/&amp;|["\\]/);
      expect(urlDoVideo(a.video_url)).toBe(a.video_url);
      const view = normalizeAula({ id: 1, documentId: 'x', ...a, foto_autor: null } as unknown as StrapiAula);
      expect(view).not.toBeNull();
      expect(view?.titulo).not.toMatch(/\\/);
    }
  });

  it('as 3 fotos de autor existem em strapi/seed', () => {
    for (const arquivo of new Set(AULAS_EBA.map((a) => a.foto))) expect(existsSync(join(SEED, arquivo))).toBe(true);
  });
});

describe('ensureAulas', () => {
  it('cria e publica as 25 aulas, com a foto do autor', async () => {
    const { strapi, docs } = strapiEmMemoria();
    await ensureAulas(strapi, false, imagem);
    expect(docs).toHaveLength(25);
    expect(docs.every((d) => d.publicado && d.data.foto_autor === 7)).toBe(true);
    expect(docs.some((d) => 'foto' in d.data)).toBe(false);
  });

  it('idempotente: rodar de novo não duplica nem reenvia imagem; reconstruir atualiza no lugar', async () => {
    const { strapi, docs } = strapiEmMemoria();
    await ensureAulas(strapi, false, imagem);
    jest.mocked(imagem).mockClear();
    await ensureAulas(strapi, false, imagem);
    expect(docs).toHaveLength(25);
    expect(imagem).not.toHaveBeenCalled();
    docs[0].data.titulo = 'editado no painel';
    await ensureAulas(strapi, true, imagem);
    expect(docs).toHaveLength(25);
    expect(docs[0].data.titulo).not.toBe('editado no painel');
  });
});
