# Componentes — contratos Strapi ↔ front

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`cd next && yarn quality`). Ver [`Testes.md`](../../.agents/rules/Testes.md) e o checklist [`Pull-Request.md`](../../.agents/rules/Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** — [`Metodo-Superpowers.md`](../../.agents/rules/Metodo-Superpowers.md).

Um documento por componente alimentado pelo Strapi, gerado com a skill `create-strapi-doc` (template em `.agents/skills/create-strapi-doc/assets/strapi-doc-template.md`).

Cada componente tem três artefatos coerentes entre si:

| Artefato | Onde |
| --- | --- |
| Contrato técnico-editorial | `docs/componentes/<slug>.md` (este diretório) |
| Guia do editor (fonte única dos textos de ajuda) | `strapi/src/editor-guide/<nome-tecnico>.json` |
| Vitrine (variantes + guia do editor renderizado) | `/componentes/<slug>` no site (dev/homologação) |

## Índice

| Doc | Componente | Nome técnico | Onde entra | Status |
| --- | --- | --- | --- | --- |
| [header.md](./header.md) | Header | `layout.header` | single type `global` | implementado · publicado (dev) |
| [hero.md](./hero.md) | Hero | `sections.hero` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [carrossel-cards.md](./carrossel-cards.md) | Carrossel de cards | `sections.carrossel-cards` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [imagem-texto.md](./imagem-texto.md) | Imagem e texto | `sections.imagem-texto` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [serie-atual.md](./serie-atual.md) | Série atual (mensagens do YouTube) | `sections.serie-atual` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [proximos-eventos.md](./proximos-eventos.md) | Próximos eventos (inChurch) | `sections.proximos-eventos` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [agenda-eventos.md](./agenda-eventos.md) | Agenda de eventos (inChurch) | `sections.agenda-eventos` | dynamic zone `sections` de `page` (`/agenda`) | implementado · seed local pendente de validação |
| [ministerios.md](./ministerios.md) | Encontre seu lugar | `sections.ministerios` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [texto-botoes.md](./texto-botoes.md) | A igreja no seu bolso | `sections.texto-botoes` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [perguntas-frequentes.md](./perguntas-frequentes.md) | Perguntas frequentes | `sections.perguntas-frequentes` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [footer.md](./footer.md) | Footer | `layout.footer` | single type `global` | implementado · publicado (dev) |
| [texto-rico.md](./texto-rico.md) | Texto (documento) — Política de Privacidade | `sections.texto-rico` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [catalogo-cursos.md](./catalogo-cursos.md) | Catálogo de cursos da EBA (+ Card de curso) | `sections.catalogo-cursos` | dynamic zone `sections` de `page` (`/eba`, `/eba/cursos`) | implementado · seed v20 (dev) |
| [lista-testes.md](./lista-testes.md) | Lista de testes do CDV (EBA) | `sections.lista-testes` + tipo `teste` | dynamic zone `sections` de `page` (`/eba/testes`) | implementado · seed v20 (dev) |
| [curso-cabecalho.md](./curso-cabecalho.md) | Topo do curso da EBA (+ Informações, Trilha) | — (campos fixos do tipo `curso`) | página `/eba/cursos/<slug>` | implementado |
| [banner-cookies.md](./banner-cookies.md) | Aviso de cookies (LGPD) | — (código; não vem do Strapi) | layout do site | implementado |

Status possíveis: **proposto → implementado → publicado no Strapi → validado**.
