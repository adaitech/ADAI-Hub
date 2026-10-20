# Topo do curso — `CursoCabecalho`

> Protótipo: `docs/prototipo/eba/talmidim.html` · Vitrine: `/componentes/curso-cabecalho`, `/componentes/chips` e `/componentes/trilha` · Spec: `docs/superpowers/specs/2026-10-18-migracao-eba-1-editorial-design.md` §4.4–4.5

Abertura da página `/eba/cursos/<slug>`. Não é uma seção da dynamic zone: é montada pelo código a partir dos **campos fixos** do curso no Strapi (tipo **Cursos da EBA**). O corpo da página vem depois, com as seções que o editor montou.

## De onde vem cada parte

| Parte | Campo do curso | Observação |
| --- | --- | --- |
| Trilha | — | ADAI › EBA › Cursos › <nome>; no celular só "‹ Cursos" (`Trilha`) |
| Rótulo da vertente | `vertente` | "Curso de integração" / "Curso de consolidação" |
| Título (`h1`) | `nome` | Escala display |
| Resumo | `resumo` | — |
| Informações | `publico_alvo`, `duracao`, `formato`, `entrada` | Lista com rótulo visível (`Chips`); só as preenchidas |
| Botão de inscrição | `inscricao` | Nova aba quando marcado, com aviso "A inscrição abre em nova aba."; leva `data-curso` (prop `curso` do `ButtonLink`), exceto inscrição por e-mail (`mailto:`), que é contato e não conversão |
| "Perguntas frequentes" | — | Só quando o corpo tem a seção Perguntas frequentes (âncora) |
| Vídeo de apresentação | `video_apresentacao` | Só YouTube; player do site (youtube-nocookie) só depois do clique |
| Foto | `capa` | Some sem texto alternativo; carrega com prioridade (LCP) |

## Medição (DataLayer)

Evento novo **`inscrever_curso`** (`origem`, `curso` = slug) no clique do botão de inscrição por formulário (inscrição por `mailto:` só gera `clique_cta`) — evento-chave, no padrão de `planejar_visita`. Os demais cliques ("Perguntas frequentes", "Assistir à apresentação") ficam com `clique_cta`; o player é o mesmo da Série atual, sem o evento `assistir_mensagem` (que é das mensagens). Ver `docs/analytics/README.md` §3.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/layout/CursoCabecalho/CursoCabecalho.test.tsx`
- `next/src/components/ui/Chips/Chips.test.tsx`
- `next/src/components/ui/Trilha/Trilha.test.tsx`
- `next/src/lib/eba/curso.test.ts` (vídeo do YouTube, inscrição segura, chips)
- `next/src/__tests__/integracao/eba.test.tsx` (página do curso)

Também cobrem este componente, sem precisar editar nada: os testes de característica (a11y/SEO de toda variante, CSS) e a integração da vitrine.

## Status

Implementado na branch `feat/eba-editorial`.
