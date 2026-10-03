---
description: Padrão obrigatório de componentes alimentados por JSON do Strapi — modelagem no CMS, registry, normalize, mock, governança
alwaysApply: true
---

# Componentes alimentados pelo CMS (Strapi → JSON → React)

## Por que este padrão existe

A visão do projeto exige que ministérios e o time Criativo **criem páginas, campanhas e espaços de ministério sem depender de dev**, e que a identidade da ADAI se mantenha **mesmo com muita gente publicando**.

A resposta técnica é:

1. **Toda página é uma pilha de seções** escolhidas no Strapi (dynamic zone).
2. **Cada seção é um componente React reutilizável**, que recebe apenas o JSON do seu bloco.
3. **O visual é garantido pelo código**, não pelo editor: o CMS oferece escolhas semânticas (ex.: "fundo claro/escuro"), nunca cor, fonte ou HTML livres.

Assim a mesma seção "Próximos eventos" serve à Home, à página do Ministério KIDS e a uma campanha — sem código novo.

---

## 1. Fluxo de dados

```
Strapi 5
  Page { titulo, slug, seo, sections: [ { __component: "sections.hero", ...campos }, ... ] }
      │
      ▼  src/lib/strapi/queries/page.ts  (servidor, tipado, cache por tag)
src/app/[slug]/page.tsx  (Server Component)
      │
      ▼
<SectionRenderer sections={page.sections} />         src/components/sections/SectionRenderer.tsx
      │  lê __component → sectionRegistry
      ▼
<HeroSection data={bloco} index={0} />                src/components/sections/HeroSection/
      │  normalizeHero(data) → view model limpo
      ▼
<Heading/> <Button/> <Image/> ...                     src/components/ui/
```

**Regra:** cada camada só conhece a vizinha. O componente de UI (`Button`) nunca sabe que o Strapi existe; a página nunca sabe como o Hero é desenhado.

---

## 2. Modelagem no Strapi

### 2.1 Convenções de nome

| Item | Convenção | Exemplo |
| --- | --- | --- |
| Display name (o que o editor vê) | pt-BR, com acento | `Próximos eventos` |
| Nome técnico do componente | `categoria.kebab-case`, sem acento | `sections.proximos-eventos` |
| Campos (UID) | `snake_case` pt-BR, sem acento | `titulo`, `texto_apoio`, `ctas` |
| Collection types | singular, sem acento | `unidade`, `evento`, `ministerio` |

**O nome técnico do componente é a chave do registry.** Renomear no Strapi = renomear no registry, tipos, mock e doc no mesmo PR.

### 2.2 Categorias de componentes

| Categoria | Uso | Pode ir na dynamic zone? |
| --- | --- | --- |
| `sections.*` | Seções de página (Hero, Unidades, FAQ…) | **Sim — só esta** |
| `layout.*` | Blocos fixos do site no single type `global`: `layout.header`, `layout.footer` | Não |
| `shared.*` | Peças reutilizáveis: `shared.link` (link de texto), `shared.botao` (CTA com estilo), `shared.seo` | Não |
| `items.*` | Itens internos repetíveis de uma seção (`items.pergunta`, `items.passo`) | Não |

### 2.3 Content types

| Tipo | Nome | Conteúdo |
| --- | --- | --- |
| Collection | `page` | `titulo`, `slug` (UID), `seo` (`shared.seo`), `sections` (dynamic zone de `sections.*`) |
| Single | `global` | Header (links, CTAs) e Footer (colunas, textos, redes) |
| Collection | `unidade`, `evento`, `mensagem`, `ministerio`, `lider`… | **Dados reaproveitados em várias páginas** |

**Dado que aparece em mais de um lugar vira collection type e é referenciado por relação.** Ex.: `sections.proximos-eventos` tem relação com `evento`; não copia título/data em cada página. Criar um evento o faz aparecer em todas as seções que o referenciam ou filtram.

### 2.4 Governança de conteúdo (identidade protegida)

Vários ministérios publicam; o código garante a identidade:

- ✅ Variações visuais por **Enumeration** com valores semânticos (`fundo: claro | escuro | cinza`, `layout: imagem_esquerda | imagem_direita`), com default.
- ✅ Texto com **limite de caracteres** (`maxLength`) coerente com o layout do Figma.
- ✅ Rich text só no formato **Blocks**, renderizado por `@strapi/blocks-react-renderer` com um mapa de elementos permitido (parágrafo, negrito, itálico, lista, link). Headings, imagens e código embutidos ficam fora, salvo seção que exija.
- ✅ Imagem com `alternativeText` **obrigatório** no fluxo editorial (o normalize descarta imagem sem alt informativo quando ela for conteúdo).
- ✅ Campos obrigatórios marcados como `required` no schema.
- ❌ Proibido: campo de cor livre (hex), fonte, tamanho, CSS, HTML ou Markdown livre, "classe CSS", embed de script.
- Todo campo tem **Label, Descrição e Placeholder** no painel do Strapi. O texto vem do **guia do editor** `strapi/src/editor-guide/<nome-tecnico>.json` (fonte única), aplicado automaticamente no bootstrap do Strapi e exibido na vitrine `/componentes` — ver skill `create-strapi-doc`. Não configurar à mão em *Configurar a visualização* (seria sobrescrito).
- **Pendente de decisão do time:** papéis de acesso por ministério no painel do Strapi (quem publica o quê). Verificar o que a edição do Strapi em uso permite antes de prometer.

---

## 3. Código — anatomia obrigatória de uma seção

```
src/components/sections/ProximosEventosSection/
├── ProximosEventosSection.tsx          ← Server Component; recebe { data, index }
├── ProximosEventosSection.module.css   ← mobile-first + tokens
├── ProximosEventosCarousel.tsx         ← (opcional) parte 'use client', se houver interação
├── types.ts                            ← tipo do JSON cru do Strapi + view model
├── normalize.ts                        ← JSON cru → view model (puro, testável)
├── populate.ts                         ← o que popular desta seção na query do Strapi
├── ProximosEventosSection.mock.json    ← JSON de exemplo idêntico ao da API (variantes)
├── ProximosEventosSection.showcase.ts  ← entrada da vitrine /componentes
├── ProximosEventosSection.test.tsx     ← render + a11y básico
├── normalize.test.ts                   ← casos de borda do normalize
└── index.ts                            ← export público
+ docs/componentes/proximos-eventos.md  ← contrato Strapi (skill create-strapi-doc)
```

### 3.1 `types.ts`

```ts
import type { StrapiLink, StrapiMedia } from '@/lib/strapi/types';

/** JSON cru de `sections.hero` como a API do Strapi 5 entrega. */
export interface HeroData {
  __component: 'sections.hero';
  id: number;
  titulo_linhas?: { id: number; texto?: string }[];
  texto_apoio?: string | null;
  imagem?: StrapiMedia | null;
  ctas?: StrapiLink[];
}

/** View model: só o que o componente precisa, já validado. */
export interface HeroView {
  linhas: string[];
  textoApoio?: string;
  imagem?: { url: string; alt: string; width: number; height: number };
  ctas: { label: string; href: string; variante: 'primario' | 'secundario' }[];
}
```

### 3.2 `normalize.ts` — o único lugar com "inteligência"

Função **pura**: sem React, sem fetch, sem `window`. Responsável por:

- `trim` de strings e descarte de vazios;
- descartar itens sem campo obrigatório (ex.: CTA sem `href`);
- aplicar **defaults** de enumerations;
- resolver URL de mídia (`resolveStrapiMedia`);
- retornar `null` quando a seção não tem o mínimo para renderizar.

```ts
export function normalizeHero(data: HeroData): HeroView | null {
  const linhas = (data.titulo_linhas ?? [])
    .map((l) => l.texto?.trim())
    .filter((t): t is string => Boolean(t));
  if (linhas.length === 0) return null; // sem título, sem hero

  return {
    linhas,
    textoApoio: data.texto_apoio?.trim() || undefined,
    imagem: resolveStrapiMedia(data.imagem) ?? undefined,
    ctas: normalizeLinks(data.ctas),
  };
}
```

### 3.3 O componente

```tsx
import Image from 'next/image';
import type { SectionProps } from '@/types/sections';
import { Button } from '@/components/ui/Button';
import { normalizeHero } from './normalize';
import type { HeroData } from './types';
import styles from './HeroSection.module.css';

export function HeroSection({ data, index }: SectionProps<HeroData>) {
  const view = normalizeHero(data);
  if (!view) return null;

  const tituloId = `hero-${data.id}-titulo`;
  return (
    <section className={styles.hero} aria-labelledby={tituloId} data-section="hero">
      {view.imagem && (
        <Image
          src={view.imagem.url}
          alt={view.imagem.alt}
          fill
          sizes="100vw"
          priority={index === 0}
          className={styles.imagem}
        />
      )}
      <h1 id={tituloId} className={styles.titulo}>
        {view.linhas.map((linha) => <span key={linha}>{linha}</span>)}
      </h1>
      {/* ... */}
    </section>
  );
}
```

Regras do componente:

- Recebe **somente** `SectionProps<TData>` = `{ data: TData; index: number }`. `index` serve para `priority` de imagem nos primeiros blocos.
- Raiz é `<section>` com `aria-labelledby` apontando para o título e `data-section="<nome>"` (âncora estável para testes/QA).
- Só **uma** `<h1>` por página: somente a seção de abertura (`index === 0`) usa `h1`; as demais usam `h2`.
- Nada de `any`, nada de fetch, nada de valor visual solto (usar tokens).

### 3.4 `populate.ts` — cada seção declara o que precisa

```ts
import type { SectionPopulate } from '@/lib/strapi/types';

export const heroPopulate: SectionPopulate = {
  populate: { titulo_linhas: true, imagem: true, ctas: true },
};
```

Seção só com campos simples (sem mídia/componentes) declara `populate = true`: o Strapi 5 **omite** da dynamic zone todo componente que não aparece nos fragmentos `on` (conferido com `sections.serie-atual`).

A query da página monta o `populate` da dynamic zone a partir do registry (fragmentos `on` do Strapi 5). **Não usar populate profundo genérico** (`populate=deep`, middleware `deepPopulate` do template): busca dados demais e esconde dependências.

### 3.5 `.mock.json` — JSON real, com variantes

Espelha **exatamente** o que a API do Strapi retorna para o bloco (mesmos nomes, tipos e aninhamento, incluindo `__component` e `id`). Contém variantes nomeadas:

```json
{
  "completo": { "__component": "sections.hero", "id": 1, "titulo_linhas": [ { "id": 1, "texto": "Amar." } ], "...": "..." },
  "minimo":   { "__component": "sections.hero", "id": 2, "titulo_linhas": [ { "id": 1, "texto": "Amar." } ] },
  "texto_longo": { "...": "..." }
}
```

Variantes mínimas obrigatórias: **`completo`** (todos os campos), **`minimo`** (só obrigatórios) e, quando houver texto variável, **`texto_longo`**. O mesmo arquivo alimenta testes e a vitrine.

**Como obter:** preferir copiar a resposta real da API do Strapi (`GET /api/pages?filters[slug]=...&populate=...`) e anonimizar; imagens do mock usam arquivos em `public/mocks/`.

---

## 4. Registry e renderer

```ts
// src/lib/registry/sectionRegistry.ts
import { HeroSection, heroPopulate } from '@/components/sections/HeroSection';
import { ProximosEventosSection, proximosEventosPopulate } from '@/components/sections/ProximosEventosSection';

export const sectionRegistry = {
  'sections.hero': { component: HeroSection, populate: heroPopulate },
  'sections.proximos-eventos': { component: ProximosEventosSection, populate: proximosEventosPopulate },
} satisfies Record<string, SectionRegistryEntry>;

export type SectionKey = keyof typeof sectionRegistry;
```

```tsx
// src/components/sections/SectionRenderer.tsx (Server Component)
export function SectionRenderer({ sections }: { sections: StrapiSection[] }) {
  return sections.map((section, index) => {
    const entry = sectionRegistry[section.__component as SectionKey];
    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SectionRenderer] "${section.__component}" não está no sectionRegistry.`);
      }
      return null;
    }
    const Component = entry.component;
    return <Component key={`${section.__component}-${section.id}`} data={section} index={index} />;
  });
}
```

- Seções acima da dobra (Hero) são importadas estaticamente. As demais podem usar `next/dynamic` **com SSR ligado** (padrão) se o bundle justificar — nunca `ssr: false`.
- Chave `__component` desconhecida não quebra a página: é ignorada, com aviso só em dev.

---

## 5. Header e Footer

Vêm do single type `global` e seguem o **mesmo padrão** (types, normalize, mock, showcase, teste, doc), mas vivem em `src/components/layout/` e **não** entram no `sectionRegistry`. São registrados manualmente no catálogo da vitrine.

## 6. Componentes de UI (`src/components/ui/`)

Átomos reutilizáveis (Button, Heading, Card, Container, Tag…):

- Props tipadas e explícitas (`variante`, `tamanho`, `as`); nenhum tipo do Strapi.
- Também entram na vitrine (categoria `ui`), com mock de props em `.showcase.ts`.
- Antes de criar, procurar um existente; para adaptar, seguir `Extensao-Sem-Sobreposicao.md`.

---

## 7. Regra dos 5 pilares (obrigatória): CMS + página + vitrine + SEO + medição

Todo componente novo ou alterado precisa estar **funcionando e verificado nos cinco pilares** (`AGENTS.md`), sempre com **Strapi e Next rodando** (`cd strapi && yarn develop` e `cd next && yarn dev`). Os três primeiros (o antigo tripé):

1. **Strapi** — schema, guia do editor aplicado no painel, componente na dynamic zone e **conteúdo cadastrado** (em dev, pelo seed `strapi/src/bootstrap/seed.ts`; subir a `SEED_VERSION` quando a Home ganhar seções novas).
2. **Página** — seção registrada no `sectionRegistry` e visível numa página real (Home ou outra) vinda do Strapi.
3. **Vitrine** — `/componentes/<slug>` com as variações e o guia do editor.

E sempre:

4. **SEO** — conteúdo no HTML do servidor, `h1` único (seção na posição 0 vira `h1`), hierarquia de títulos, `alt` correto, texto de link descritivo.
5. **Medição** — analisar se o componente precisa de **evento novo de `data_layer`** ou se `clique_cta`/`ver_secao`/um evento existente já cobre; registrar a decisão no doc do componente. Evento novo segue `docs/analytics/README.md` §5 (catálogo → regra → teste → plano → GTM). Eventos não ficam no Strapi.

Não basta o teste passar: **abrir e conferir**. Se algum pilar não puder ser executado, declarar como ⏳ pendente — nunca como pronto.

## 7.1 Passo a passo — criar uma nova seção

1. **Figma:** identificar a seção, extrair o contexto de design (uma chamada por seção; reaproveitar o resultado).
2. **Contrato:** rodar a skill `create-strapi-doc` → `docs/componentes/<nome>.md` (campos, tipos, limites, enumerations, JSON de exemplo) **e** `strapi/src/editor-guide/<nome-tecnico>.json` (guia do editor). Validar com o time antes de codar.
3. **Strapi:** criar o componente `sections.<nome>` (e `items.*`/collection types necessários) exatamente como o doc; adicioná-lo à dynamic zone de `page`.
4. **Mock:** copiar a resposta real da API para `<Nome>Section.mock.json` (variantes `completo`, `minimo`, `texto_longo`).
5. **Código:** `types.ts` → `normalize.ts` (+ `normalize.test.ts`) → componente + CSS → `populate.ts` → `index.ts`.
6. **Registry:** adicionar a linha no `sectionRegistry`.
7. **Vitrine:** criar `<Nome>Section.showcase.ts` e registrar no catálogo (ver `Vitrine-de-Componentes.md`).
8. **Testes:** render das variantes + normalize com casos de borda.
9. **Medição:** decidir se precisa de evento novo de `data_layer` (`docs/analytics/README.md` §5) e registrar no doc.
10. **Validar:** `yarn quality`, conferir em `/componentes/<slug>` nos três tamanhos (375/768/1440) e numa página real montada no Strapi.
11. **DoD:** `Definition-of-Done.md`.

## 8. Anti-padrões

- ❌ Componente que faz `fetch` ou importa de `src/lib/strapi/queries`.
- ❌ `data.titulo_linhas[0].texto` direto no JSX (sem normalize → quebra com CMS incompleto).
- ❌ Mock "inventado" que não bate com a API real.
- ❌ Chave do registry diferente do nome técnico no Strapi.
- ❌ Seção criada sem doc, sem showcase ou sem teste.
- ❌ Campo de cor/HTML livre no Strapi "para dar flexibilidade".
- ❌ `populate=deep` ou `ssr: false`.
