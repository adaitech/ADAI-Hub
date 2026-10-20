# Migração da EBA — entrega 1 — ajustes: card de curso, página de testes e área da equipe — design

> Complementa `2026-10-18-migracao-eba-1-editorial-design.md`. Protótipo aprovado em 2026-10-19: `docs/prototipo/eba/` (`cursos.html`, `testes.html`, `index.html`, `estados.html`).

## 1. Objetivo

Três ajustes pedidos depois da revisão da entrega 1:

1. **Card de curso** no padrão dos outros cards do Hub (Card / Unidade, Carrossel de cards). As informações "Para quem" e "Duração" deixam de ser chips empilhados.
2. **Página dedicada aos testes** em `/eba/testes`. Ela explica cada um dos 5 testes do CDV com o conteúdo da apostila do curso (CDV, EBA 2023, aulas 5, 6, 7, 10 e 11), resumido.
3. **Só área da equipe.** Não existe área do aluno. A seção "Área do aluno e da equipe" da home da EBA vira "Área da equipe da EBA".

## 2. Fora do escopo

- Os testes continuam no site atual (`eba.adai.com.br/teste/<slug>`), nas mesmas URLs dos QR codes impressos. Trazer os testes para o Hub é a entrega 2.
- O login da equipe continua no site atual até a entrega 4.
- Não há evento novo de medição.

## 3. Card de curso (`components/ui/CardCurso`)

- **Caixa:** cinza (`--color-bg-subtle`), `padding --space-24`, `radius-md`. No hover a caixa usa `--color-bg-subtle-2`, como o Card / Unidade.
- **Foto:** fica dentro da caixa, proporção 3:2, `radius-sm`. Sem foto: bloco 3:2 mais escuro com o nome do curso.
- **Ordem do conteúdo:** vertente (micro, cor suave) → nome (h3, ou h2 quando o catálogo abre a página) → resumo (cor suave).
- **Informações:** `Para quem` e `Duração` (as duas primeiras do curso) numa lista de definição (`<dl>`), com o rótulo à esquerda e o valor à direita. Uma linha separa essa lista do texto. Os chips continuam só no topo da página do curso.
- **Fim do card:** "Conhecer o curso →", só visual (`aria-hidden`), com sublinhado de link.
- **Alinhamento:** cada card ocupa 4 linhas da grade, com subgrid quando o navegador suporta. Assim foto, texto, informações e "Conhecer" ficam alinhados entre os cards.
- **Clique:** continua um único link, no nome do curso, cobrindo o card inteiro.

## 4. Página `/eba/testes`

### 4.1 Rota

Página `eba-testes` do Strapi, servida por `/eba/[slug]`, que já existe (`slugDaPaginaEba`). Não precisa de rota nova. Entra no sitemap pelo fluxo de páginas. A rota `/eba/[slug]` ganha trilha + BreadcrumbList: ADAI › EBA › <título da página no Strapi>. Por isso a página se chama "Testes" no painel e o título de SEO fica "Testes de dons e talentos — EBA | ADAI".

### 4.2 Strapi — collection type novo `teste` ("Testes da EBA")

Segue a anotação aprovada no protótipo: um tipo com campos fixos, para a entrega 2 reaproveitar.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `nome` | string | obrigatório, até 60 |
| `slug` | uid (de `nome`) | obrigatório, `^[a-z0-9]+(-[a-z0-9]+)*$`; vira a âncora `#<slug>` |
| `aula` | string | até 30 (ex.: "Aula 5") |
| `resumo` | text | obrigatório, até 200 |
| `o_que_e` | text | até 600 |
| `itens_titulo` | string | até 60 (ex.: "Os 11 dons do teste") |
| `itens` | text | até 600, um item por linha |
| `perguntas` | string | até 60 (ex.: "55 afirmações") |
| `resposta` | string | até 60 (ex.: "nota de 0 a 5") |
| `como_responder` | text | até 400 |
| `como_ler_resultado` | text | até 400 |
| `link_teste` | string | até 300; `https://…` ou caminho `/…` |
| `ordem` | integer | ≥ 0, padrão 100 |

Tem `draftAndPublish`. Leitura pública com `find` e `findOne`, como o curso.

### 4.3 Strapi — seção nova `sections.lista-testes` ("Lista de testes")

| Campo | Tipo | Regra |
| --- | --- | --- |
| `titulo` | string | obrigatório, até 80 |
| `texto_apoio` | text | até 240 |
| `mostrar_atalhos` | boolean | padrão `true`: links "ir para o teste" no topo |

Lista todos os testes publicados, em ordem (`ordem` e depois `nome`).

### 4.4 Next — `ListaTestesSection`

- Server Component que busca `listarTestesPublicados()` (`lib/strapi/queries/testes.ts`, tag `testes`) e entrega o resultado para `ListaTestes`, que só apresenta.
- **Normalização (`lib/eba/teste.ts`):**
  - Sem nome, sem resumo ou com slug inválido: o teste não aparece.
  - `itens` é dividido por linha; linhas vazias saem.
  - Link que não seja `https://` nem um caminho começando com `/` não gera botão.
  - Uma parte vazia (o que é, itens, como responder, como ler o resultado) não aparece.
- **Cada teste é um `<article id=slug>`:**
  - Abertura: "Teste N de T · Aula X do CDV", nome (h2 quando a seção abre a página; senão h3), resumo, `<dl>` Perguntas/Resposta, e o botão "Fazer o teste". O botão tem o nome acessível "Fazer o teste de <nome>" e abre na mesma aba.
  - Corpo: até 4 partes em caixas brancas ("O que é", título dos itens com etiquetas, "Como responder", "Como ler o resultado"), em h3 (ou h4).
- **Falha do Strapi:** a seção some quando não abre a página. Abrindo a página, vai para o `error.tsx`, como o catálogo. Sem testes, a seção some.

### 4.5 Composição da página `eba-testes` (seed)

1. **Imagem e texto (h1):**
   - rótulo "Parte do curso CDV", título "Testes de dons e talentos", texto;
   - foto do CDV colorida, à direita;
   - botões "Ver os testes" (`#os-testes`) e "Conhecer o CDV".
2. **Texto (Markdown) "Como funciona":** 3 passos numerados.
3. **Lista de testes "Os 5 testes":** com atalhos.
4. **Perguntas frequentes:** 4 perguntas.
5. **Texto e botões "Faça os testes no CDV":** leva a `/eba/cursos/cdv`.

A `ListaTestes` expõe `id="os-testes"` no `<section>` (uma lista por página), âncora do botão "Ver os testes".

### 4.6 Links que mudam

- **Home da EBA:**
  - o botão do Hero passa de "Fazer um teste" (site atual) para "Conhecer os testes" → `/eba/testes`;
  - a seção "Descubra seus dons e talentos" lista os 5 testes com link para `/eba/testes#<slug>` e termina com o link "Conhecer os testes".
- **Página do CDV:** "Os testes do CDV" aponta para `/eba/testes#<slug>`.

## 5. Área da equipe

Na seção Texto e botões da home da EBA:

- título: "Área da equipe da EBA";
- texto de apoio: "Acesso restrito a professores e coordenadores da EBA, para acompanhar as turmas.";
- botão: "Entrar na área da equipe" → `eba.adai.com.br/login`.

## 6. SEO

- `/eba/testes` tem um único h1 (Imagem e texto) e os testes em h2. Metadados vêm do `seo` da página: "Testes de dons e talentos — EBA | ADAI".
- Os testes não ganham página própria nem dados estruturados.

## 7. Medição

Sem evento novo:

- o clique em "Fazer o teste" é coberto por `clique_cta` (link com `data-section="lista-testes"` como origem);
- a visualização da seção é coberta por `ver_secao`.

## 8. Testes (TDD)

- **`CardCurso`:** `<dl>` com Para quem/Duração; no máximo 2 itens; sem informação, não há `<dl>`; continua com um único link.
- **`lib/eba/teste.ts`:** normalização (campos vazios, itens por linha, link inválido, slug inválido) e ordenação.
- **`queries/testes.ts`:** parâmetros da busca e tag.
- **`ListaTestesSection` / `ListaTestes`:**
  - níveis de título conforme o `index`;
  - atalhos;
  - "Teste N de T";
  - nome acessível do botão;
  - seção vazia some;
  - erro com `index === 0` lança.
- **Seed:**
  - página `eba-testes` com as 5 seções;
  - 5 testes;
  - textos da área da equipe;
  - links para `/eba/testes`.
- **Smoke:** `/eba/testes` responde 200.
- **Característica:** os 5 pilares, a11y/SEO da vitrine e CSS passam sem exceção nova.

## 9. Critérios de aceite

- Card de curso igual ao protótipo em 375, 768 e 1440, com as informações alinhadas entre os cards.
- `/eba/testes` mostra os 5 testes com o conteúdo da apostila, e cada "Fazer o teste" abre a URL atual do teste.
- A home não fala mais em área do aluno.
- `yarn quality`, `yarn build` (Next e Strapi) e `yarn smoke` passam.
