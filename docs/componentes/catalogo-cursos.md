# Catálogo de cursos — `sections.catalogo-cursos`

> Protótipo: `docs/prototipo/eba/` (home da EBA e `/eba/cursos`) · Vitrine: `/componentes/catalogo-cursos` e `/componentes/card-curso` · Spec: `docs/superpowers/specs/2026-10-18-migracao-eba-1-editorial-design.md` §4.3

Lista automática dos cursos da EBA publicados no Strapi (tipo **Cursos da EBA**). O editor não escolhe os cursos à mão: escolhe só o título, a vertente e quantos mostrar. Publicar um curso o faz aparecer em todos os catálogos; despublicar o tira.

## Edição no Strapi

| Campo | Nome no painel | Uso |
| --- | --- | --- |
| `titulo` | Título | Obrigatório, até 80 caracteres. `h1` quando a seção abre a página; `h2` nas demais posições. |
| `texto_apoio` | Texto de apoio | Opcional, até 240 caracteres. |
| `vertente` | Quais cursos | `todas` (padrão), `integracao` ou `consolidacao`. |
| `quantidade` | Quantos cursos mostrar | 1 a 12; vazio = todos. |
| `link_ver_todos` | Mostrar "Ver todos os cursos" | Padrão ligado; leva a `/eba/cursos`. |

Ordem dos cursos: campo **Ordem no catálogo** de cada curso (menor primeiro); empate em ordem alfabética.

| Se… | Na página acontece |
| --- | --- |
| nenhum curso publicado (ou nenhum na vertente) e a seção **não** abre a página | a seção some |
| nenhum curso publicado e a seção abre a página (`/eba/cursos`) | aparece "Novos cursos em breve" com o e-mail da EBA (`EMAIL_EBA` em `next/src/lib/eba/contato.ts`) |
| o Strapi falha ao listar os cursos e a seção **não** abre a página | a seção some; o resto da página continua |
| o Strapi falha ao listar os cursos e a seção abre a página (`/eba/cursos`) | erro da página (`error.tsx`): o catálogo é o conteúdo principal |
| curso sem capa ou com capa sem texto alternativo | card sem foto: o nome ocupa o lugar da imagem |

Cada card é um **Card de curso** (`next/src/components/ui/CardCurso/`): foto 4:3, vertente, nome (único link do card), resumo e as duas primeiras informações (Para quem, Duração).

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `clique_cta` no card (`origem: 'catalogo-cursos'`, `destino: /eba/cursos/<slug>`) responde "quais cursos despertam interesse"; `ver_secao`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/CatalogoCursosSection/CatalogoCursosSection.test.tsx`
- `next/src/components/sections/CatalogoCursosSection/normalize.test.ts`
- `next/src/components/ui/CardCurso/CardCurso.test.tsx`
- `next/src/lib/eba/curso.test.ts` (ordem, filtro, capa sem alt)
- `next/src/lib/strapi/queries/cursos.test.ts`

Também cobrem este componente, sem precisar editar nada: os testes de característica (5 pilares, a11y/SEO de toda variante, CSS) e a integração da vitrine.

## Status

Implementado na branch `feat/eba-editorial` · publicado no Strapi de dev pelo seed v19.
