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
| [ministerios.md](./ministerios.md) | Encontre seu lugar | `sections.ministerios` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [texto-botoes.md](./texto-botoes.md) | A igreja no seu bolso | `sections.texto-botoes` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [perguntas-frequentes.md](./perguntas-frequentes.md) | Perguntas frequentes | `sections.perguntas-frequentes` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [footer.md](./footer.md) | Footer | `layout.footer` | single type `global` | implementado · publicado (dev) |
| [texto-rico.md](./texto-rico.md) | Texto (documento) — Política de Privacidade | `sections.texto-rico` | dynamic zone `sections` de `page` | implementado · publicado (dev) |
| [banner-cookies.md](./banner-cookies.md) | Aviso de cookies (LGPD) | — (código; não vem do Strapi) | layout do site | implementado |

Status possíveis: **proposto → implementado → publicado no Strapi → validado**.
