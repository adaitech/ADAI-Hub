# Migração da EBA — entrega 1 — ajustes: card, testes e área da equipe — plano

> Execução nativa (`superpowers:executing-plans`), nesta sessão, na branch `feat/eba-editorial`, com commits locais autorizados. Sem push e sem PR.

**Spec:** `docs/superpowers/specs/2026-10-19-migracao-eba-1-ajustes-card-testes-design.md` · **Protótipo:** `docs/prototipo/eba/` (aprovado em 2026-10-19).

**Restrições:** as mesmas do plano da entrega 1 (`2026-10-18-migracao-eba-1-editorial.md`):

- TDD;
- tokens e mobile-first 769/1024;
- WCAG 2.2 AA;
- `git add` com caminhos explícitos;
- snapshot só com pedido.

Os servidores de dev (Strapi 1338, Next 3002) foram subidos pelo agente a pedido do usuário. O agente pode reiniciá-los para a verificação.

## Tarefa 1: Card de curso no padrão do Hub

- [x] Teste do `CardCurso` (falha primeiro):
  - `<dl>` com "Para quem" e "Duração";
  - no máximo 2 pares;
  - sem informação, não há `<dl>`;
  - "Conhecer o curso" com `aria-hidden`;
  - continua com um único link.
- [x] `CardCurso.tsx`: trocar `Chips` por `<dl>`.
- [x] `CardCurso.module.css`: caixa cinza, padding 24, foto 3:2 `radius-sm`, linha acima da `<dl>`, hover, subgrid de 4 linhas.
- [x] `CatalogoCursosSection.module.css`: o `li` repassa o subgrid e a grade usa gap 12.
- [x] Atualizar o doc `catalogo-cursos.md` e a vitrine do card, se o texto mudar.

## Tarefa 2: Tipo `teste` no Strapi

- [x] `strapi/src/api/teste/**` (schema, controller, route, service), conforme a spec §4.2.
- [x] Guia do editor `api.teste.json` + registro em `editor-guide/index.ts`.
- [x] Liberar `find` e `findOne` públicos (no mesmo lugar do curso, no `seed.ts`).
- [x] Rodar `npx strapi ts:generate-types` e `yarn build` no Strapi.

## Tarefa 3: Regras puras e busca

- [x] Testes em `lib/eba/teste.test.ts` (fixture `__fixtures__/testes.json`, no formato da API).
- [x] Implementar `lib/eba/teste.ts`: `normalizeTeste`, `ordenarTestes` e `linkDeTeste`.
- [x] Tipos em `lib/eba/types.ts`.
- [x] Testes em `lib/strapi/queries/testes.test.ts`.
- [x] Implementar `listarTestesPublicados()` (tag `testes`).

## Tarefa 4: Seção `sections.lista-testes`

- [x] Schema `strapi/src/components/sections/lista-testes.json` + guia + liberar na dynamic zone de `page`.
- [x] Next `components/sections/ListaTestesSection/`:
  - `types`, `normalize`, `populate`, `index`;
  - `ListaTestes` (apresentação) e `ListaTestesSection` (busca);
  - CSS, mock, showcase e testes.
- [x] Registrar no `sectionRegistry` e no catálogo da vitrine.
- [x] Doc `docs/componentes/lista-testes.md` (com Medição e Testes) + índice do README.

## Tarefa 5: Conteúdo de dev (seed v20)

- [x] Testes do seed (falha primeiro):
  - 5 testes;
  - página `eba-testes` com as 5 seções;
  - home com "Área da equipe da EBA" e links para `/eba/testes`;
  - CDV com links para `/eba/testes#<slug>`.
- [x] `seed-eba.ts`: `TESTES_EBA`, `ensureTestes`, `ebaTestesSections`, a página nova em `PAGINAS_EBA` e os textos da home e do CDV.
- [x] `seed.ts`: `SEED_VERSION` 20 e chamada de `ensureTestes`.
- [x] Sitemap: conferir se os testes do `sitemap` precisam da página nova.
- [x] Smoke: incluir `/eba/testes`.

## Tarefa 6: Verificação e commits

- [x] Rodar os gates:
  - `yarn quality` (next);
  - `yarn build` (next e strapi);
  - reiniciar o Strapi para o seed v20;
  - `yarn smoke`.
- [x] Conferir no navegador:
  - `/eba`, `/eba/cursos`, `/eba/testes` e `/eba/cursos/cdv` em 375, 768 e 1440;
  - DataLayer do "Fazer o teste".
- [x] Commits locais por assunto: card; tipo e seção de testes; seed e página; docs, spec, plano e protótipo.
