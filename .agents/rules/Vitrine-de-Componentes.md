---
description: Vitrine interna /componentes — obrigatória a cada componente criado ou alterado
alwaysApply: true
---

# Vitrine de Componentes (`/componentes`)

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

## Por que existe

A vitrine é o "Storybook" do ADAI Hub, só que dentro do próprio Next. Ela mostra **todos os componentes reais**, renderizados a partir do **mesmo JSON que o Strapi entrega**, para que:

- qualquer dev ou IA entenda **o que existe, como funciona e quando usar** antes de criar algo novo;
- o time Criativo veja as variações possíveis de cada seção antes de montar uma página;
- a validação mobile-first seja feita sem montar página no CMS.

**Regra:** criar ou alterar um componente **sempre** cria ou atualiza sua entrada na vitrine. Sem isso o trabalho não está pronto (DoD).

---

## 1. Rotas

| Rota | Conteúdo |
| --- | --- |
| `/componentes` | Índice agrupado por categoria (**UI**, **Layout**, **Seções**) com nome, descrição curta e chave do Strapi |
| `/componentes/[slug]` | Página do componente: descrição, quando usar, **exemplos em abas com controles** (§3.2), **Guia do editor** (ver §3.1), JSON de exemplo (colapsável em `<details>`), link para o doc |
| `/componentes/preview/[slug]?variante=<nome>&<controle>=<valor>` | Renderiza **só** o componente (com os controles aplicados), sem Header/Footer nem cabeçalho da vitrine — usado no iframe de viewport |

Na página do componente, cada variante é uma **aba** (não ficam empilhadas); a aba ativa aparece num **iframe** do `preview`, com botões de largura **375 / 768 / 1440 px** (a altura se ajusta sozinha), para conferir os três tiers mobile-first. Como `preview` é um segmento estático, nenhum componente pode ter o slug `preview`.

Arquivos:

```
src/app/componentes/
├── layout.tsx                    # proteção de ambiente + noindex (sem visual)
├── (vitrine)/
│   ├── layout.tsx                # cabeçalho da vitrine
│   ├── page.tsx                  # índice
│   └── [slug]/page.tsx           # página do componente + guia do editor
├── preview/[slug]/page.tsx       # render isolado da variante
└── _vitrine/                     # VariantesTabs (abas + controles), ViewportFrame, PreviewHeight, EditorGuidePanel
src/lib/showcase/
├── types.ts                      # ShowcaseEntry, ShowcaseVariant, defineShowcase
├── controles.ts                  # lê a URL, aplica controles, monta a query do preview
├── acoes.ts                      # helpers: alternarCampo, ação botão/link, estilo do botão
├── catalog.ts                    # importa todos os *.showcase.tsx
└── catalog.test.tsx              # garante cobertura do registry, docs e guia do editor
```

## 2. Proteção

- Em produção a rota responde **404**, exceto se `SHOW_COMPONENTS=true` estiver definido (uso em homologação para o time).
- Sempre `robots: { index: false, follow: false }` no `metadata` do layout.
- Nunca linkar a vitrine no Header/Footer do site.

## 3. Entrada de um componente (`*.showcase.ts`)

Fica **junto do componente**:

```ts
// src/components/sections/HeroSection/HeroSection.showcase.ts
import type { ShowcaseEntry } from '@/lib/showcase/types';
import mocks from './HeroSection.mock.json';
import { HeroSection } from './HeroSection';

export const heroShowcase: ShowcaseEntry = {
  slug: 'hero',
  nome: 'Hero',
  categoria: 'secao',               // 'ui' | 'layout' | 'secao'
  cmsKey: 'sections.hero',          // null para ui/layout
  descricao: 'Abertura da página: foto em P&B, título em até 3 linhas, texto de apoio e até 2 CTAs.',
  quandoUsar: 'Primeira seção da Home e de páginas de ministério/campanha. Uma por página.',
  doc: 'docs/componentes/hero.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-32',
  render: (data) => <HeroSection data={data} index={0} />,
  variantes: [
    { nome: 'completo', titulo: 'Completo', data: mocks.completo },
    { nome: 'minimo', titulo: 'Mínimo (só título)', data: mocks.minimo },
    { nome: 'texto_longo', titulo: 'Texto longo', data: mocks.texto_longo },
  ],
};
```

Se o arquivo usa JSX, a extensão é `.showcase.tsx`.

Campos obrigatórios: `slug`, `nome`, `categoria`, `cmsKey`, `descricao`, `quandoUsar`, `doc`, `render`, `variantes` (mínimo 2 para seções: `completo` e `minimo`). `figma` quando houver referência.

Seção com dados de fora do CMS (ex.: Série atual = config do Strapi + YouTube): a variante é `{ strapi, youtube, agora }` e a entrada declara `cms: (data) => data.strapi` — o teste do guia do editor compara só a parte do Strapi. Os dados externos vêm de fixtures **reais** da API (sem segredos).

Componentes de **UI** usam `variantes` com props diretas (sem JSON do CMS), cobrindo cada `variante`/`tamanho`/estado (ex.: Button primário, secundário, desabilitado, com ícone).

### 3.1 Guia do editor (componentes alimentados pelo Strapi)

Para quem edita no Strapi (ministérios, time Criativo), a página do componente tem a seção **"Guia do editor"**:

- **O que é** e **onde aparece** na página, com a pré-visualização da variante `completo`;
- **Boas práticas** de conteúdo;
- **Tabela de campos:** nome no painel do Strapi · onde aparece · descrição · obrigatório · limite · exemplo.

**Fonte única:** `strapi/src/editor-guide/<nome-tecnico>.json` (formato na skill `create-strapi-doc`). O mesmo arquivo:

1. é aplicado ao **painel do Strapi** no bootstrap (label, descrição e placeholder de cada campo);
2. é copiado para `next/src/generated/editor-guide/` pelo script `next/scripts/sync-editor-guide.mjs` (roda antes de `dev`, `build` e `test`; pasta gerada é ignorada pelo Git) e lido pela vitrine.

Nunca escrever o texto de ajuda em dois lugares.

### 3.2 Controles (liga/desliga) — obrigatório para toda opção do Strapi

Cada `*.showcase.tsx` declara `controles`: um por **opção que o editor tem no Strapi** (campo opcional, enum, booleano) ou por prop visual do componente de UI. A vitrine mostra os controles acima do preview; mudar um controle recarrega o iframe com `?variante=…&id=valor` e o JSON mostrado passa a ser o JSON com os controles aplicados.

| Tipo | Quando | Exemplo |
| --- | --- | --- |
| `alternar` (interruptor) | campo opcional ou booleano | "Foto nos cards", "Foto em preto e branco", "Link \"ver todos\"" |
| `opcoes` (pílulas de rádio) | enum ou escolha entre formatos | "Cor dos cards", "Posição da foto", "Ação do card: botão + link / só botão / só link / nenhuma" |

```ts
controles: [
  alternarCampo<HeroData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', completo.texto_apoio ?? null),
  {
    id: 'posicao', tipo: 'opcoes', rotulo: 'Posição da foto', ajuda: 'Só aparece com a foto ligada.',
    opcoes: [{ valor: 'acima', rotulo: 'Acima do título' }, { valor: 'abaixo', rotulo: 'Abaixo das ações' }],
    valor: (data) => data.posicao_imagem ?? 'acima',          // estado da variação = valor inicial
    aplicar: (data, valor) => ({ ...data, posicao_imagem: valor }), // devolve cópia, nunca muta
  },
],
```

Regras:
- `valor(data)` lê o estado da variação (é o valor inicial ao abrir a aba); `aplicar` recebe o JSON e devolve **cópia**.
- Ao ligar algo que a variação não tem (foto, botão, lista), use conteúdo de exemplo do próprio mock (`completo`) ou dos helpers de `acoes.ts`.
- `id` curto, sem acento (vai na URL). `rotulo` e `ajuda` em linguagem de editor, iguais aos termos do guia do editor.
- Trocar de aba reinicia os controles; "Voltar ao exemplo original" limpa.
- `catalog.test.tsx` renderiza **cada opção de cada controle em cada variação**: um controle que quebra o componente falha o `yarn test`.

## 4. Catálogo e garantia automática

```ts
// src/lib/showcase/catalog.ts
import { heroShowcase } from '@/components/sections/HeroSection/HeroSection.showcase';
import { buttonShowcase } from '@/components/ui/Button/Button.showcase';
// ...
export const showcaseCatalog: ShowcaseEntry[] = [heroShowcase, buttonShowcase /* ... */];
```

`catalog.test.ts` **falha** quando:

- uma chave do `sectionRegistry` não tem entrada com o mesmo `cmsKey`;
- dois componentes têm o mesmo `slug`;
- uma seção tem menos de 2 variantes, ou uma variante não renderiza (erro no render);
- alguma opção de algum controle quebra o render em alguma variante;
- o arquivo em `doc` não existe;
- um componente com `cmsKey` não tem guia do editor, ou o guia não cobre todos os campos do mock `completo`.

Assim, esquecer a vitrine quebra o `yarn test`.

Além disso, `src/__tests__/caracteristicas/acessibilidade-e-seo.test.tsx` audita **cada variante** de cada entrada do catálogo (alt, nome de link/botão, nova aba, ids, ARIA, texto quebrado), e `__tests__/integracao/vitrine.test.tsx` renderiza a página e o preview de cada componente.

## 5. Checklist ao criar/alterar componente

- [ ] `*.showcase.ts(x)` criado/atualizado, com descrição e "quando usar" em linguagem simples
- [ ] Variantes cobrem: completo, mínimo e texto longo (seções) ou todos os estados (UI)
- [ ] `controles` cobrem toda opção do Strapi (campos opcionais, enums, booleanos) ou props visuais (UI)
- [ ] Mock idêntico ao JSON real do Strapi (seções)
- [ ] Guia do editor (`strapi/src/editor-guide/*.json`) cobre todos os campos, em linguagem para não-devs
- [ ] Entrada adicionada em `catalog.ts`
- [ ] Conferido em `/componentes/<slug>` nos três tamanhos (375 / 768 / 1440)
- [ ] `catalog.test.ts` passando
