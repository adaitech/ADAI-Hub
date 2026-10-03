/**
 * Característica: a **Regra dos 5 pilares** (AGENTS.md) vale para todo componente.
 * Cruza os arquivos do Strapi com o Next, a vitrine e os docs — se alguém criar um componente
 * no Strapi e esquecer uma das pontas, este teste falha antes do Pull Request.
 *
 * 1. Dados no CMS  → schema + guia do editor com os mesmos campos
 * 2. Página        → seção liberada na dynamic zone de `page` e registrada no `sectionRegistry`
 * 3. Componente    → entrada na vitrine `/componentes` (o catálogo testa variantes e controles)
 * 4. SEO           → coberto por `acessibilidade-e-seo.test.tsx`
 * 5. Medição       → decisão registrada no doc do componente
 *    + Testes      → doc lista os testes do componente
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sectionRegistry } from '@/lib/registry/sectionRegistry';
import { showcaseCatalog } from '@/lib/showcase/catalog';

const raiz = join(process.cwd(), '..');
const ler = (caminho: string) => readFileSync(join(raiz, caminho), 'utf8');
const lerJson = <T>(caminho: string) => JSON.parse(ler(caminho)) as T;

type Schema = { attributes: Record<string, { type: string; component?: string; components?: string[] }> };
type Guia = { uid: string; campos: { campo: string }[] };

/** Todos os componentes do Strapi: `sections.hero`, `layout.header`, `shared.botao`… */
const componentesStrapi = readdirSync(join(raiz, 'strapi/src/components')).flatMap((categoria) =>
  readdirSync(join(raiz, 'strapi/src/components', categoria))
    .filter((arquivo) => arquivo.endsWith('.json'))
    .map((arquivo) => ({ uid: `${categoria}.${arquivo.replace(/\.json$/, '')}`, schema: `strapi/src/components/${categoria}/${arquivo}` })),
);
const tiposDeConteudo = ['page', 'global'].map((api) => ({
  uid: `api.${api}`,
  uidStrapi: `api::${api}.${api}`,
  schema: `strapi/src/api/${api}/content-types/${api}/schema.json`,
}));

const secoesStrapi = componentesStrapi.filter((c) => c.uid.startsWith('sections.')).map((c) => c.uid);
const zonaDinamica = lerJson<Schema>('strapi/src/api/page/content-types/page/schema.json').attributes.sections.components ?? [];
const indiceGuias = ler('strapi/src/editor-guide/index.ts');

describe('Pilar 1 — Dados no CMS: guia do editor de cada componente do Strapi', () => {
  it.each([...componentesStrapi, ...tiposDeConteudo].map((c) => [c.uid, c.schema, 'uidStrapi' in c ? c.uidStrapi : c.uid]))('%s', (uid, schema, uidStrapi) => {
    const arquivoGuia = `strapi/src/editor-guide/${uid}.json`;
    expect(existsSync(join(raiz, arquivoGuia))).toBe(true);
    // Registrado no índice que aplica os guias ao painel do Strapi.
    expect(indiceGuias).toContain(`'./${uid}.json'`);

    const guia = lerJson<Guia>(arquivoGuia);
    expect(guia.uid).toBe(uidStrapi);
    const camposSchema = Object.keys(lerJson<Schema>(schema).attributes).sort();
    const camposGuia = guia.campos.map((c) => c.campo).sort();
    // Campo novo no schema precisa de label/descrição para quem edita (e vice-versa).
    expect(camposGuia).toEqual(camposSchema);
  });

  it('componentes usados dentro de outros (component/dynamiczone) existem no Strapi', () => {
    const existentes = new Set(componentesStrapi.map((c) => c.uid));
    for (const { schema } of [...componentesStrapi, ...tiposDeConteudo]) {
      for (const atributo of Object.values(lerJson<Schema>(schema).attributes)) {
        for (const usado of [atributo.component, ...(atributo.components ?? [])].filter(Boolean)) {
          expect(existentes.has(usado!)).toBe(true);
        }
      }
    }
  });
});

describe('Pilar 2 — Página: seção do Strapi ↔ dynamic zone ↔ registry do Next', () => {
  it('toda seção do Strapi pode ser usada em páginas (dynamic zone de `page`)', () => {
    expect([...zonaDinamica].sort()).toEqual([...secoesStrapi].sort());
  });

  it('toda seção do Strapi tem componente no Next (`sectionRegistry`) e vice-versa', () => {
    expect(Object.keys(sectionRegistry).sort()).toEqual([...secoesStrapi].sort());
  });
});

describe('Pilar 3 — Componente: vitrine `/componentes`', () => {
  it('toda seção e todo layout do Strapi têm entrada no catálogo da vitrine', () => {
    const naVitrine = new Set(showcaseCatalog.map((e) => e.cmsKey).filter(Boolean));
    for (const uid of componentesStrapi.map((c) => c.uid).filter((u) => /^(sections|layout)\./.test(u))) {
      expect(naVitrine.has(uid)).toBe(true);
    }
  });
});

describe('Pilar 5 — Medição, e testes documentados', () => {
  // Componentes de UI (botão, link) são documentados no próprio índice; os demais têm doc próprio.
  const docs = [...new Set(showcaseCatalog.map((e) => e.doc))].filter((doc) => !doc.endsWith('README.md'));

  it.each(docs)('%s registra a decisão de Medição (DataLayer) e lista os testes', (doc) => {
    const conteudo = ler(doc);
    expect(conteudo).toMatch(/^## Medição \(DataLayer\)$/m);
    expect(conteudo).toMatch(/^## (\d+\. )?Testes$/m);
  });

  it('todo doc de componente está no índice docs/componentes/README.md', () => {
    const indice = ler('docs/componentes/README.md');
    for (const arquivo of readdirSync(join(raiz, 'docs/componentes')).filter((a) => a.endsWith('.md') && a !== 'README.md')) {
      expect(indice).toContain(`(./${arquivo})`);
    }
  });
});
