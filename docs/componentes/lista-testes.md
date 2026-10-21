# Lista de testes — `sections.lista-testes`

> Protótipo: `docs/prototipo/eba/testes.html` · Vitrine: `/componentes/lista-testes` · Spec: `docs/superpowers/specs/2026-10-19-migracao-eba-1-ajustes-card-testes-design.md` §4

A seção lista sozinha os testes do CDV publicados no Strapi (tipo **Testes da EBA**) e explica cada um. O editor escolhe só o título, o texto de apoio e se os atalhos aparecem. Publicar um teste faz ele aparecer; despublicar tira.

Os testes continuam sendo feitos no site atual da EBA (`eba.adai.com.br/teste/<slug>`), nas mesmas URLs dos QR codes. Trazer os testes para o Hub é a entrega 2.

## Edição no Strapi

### Seção

| Campo | Nome no painel | Uso |
| --- | --- | --- |
| `titulo` | Título | Obrigatório, até 80 caracteres. É `h1` quando a seção abre a página e `h2` nas demais posições. |
| `texto_apoio` | Texto de apoio | Opcional, até 240 caracteres. |
| `mostrar_atalhos` | Mostrar atalhos | Ligado por padrão: um link para cada teste (`#<endereço>`). |

### Tipo Testes da EBA (`api::teste.teste`)

| Campo | Nome no painel | Na página |
| --- | --- | --- |
| `nome` | Nome do teste | Título do bloco (obrigatório). |
| `slug` | Endereço | Âncora `#<endereço>` (obrigatório; só minúsculas, números e hífen). |
| `aula` | Aula do CDV | "Aula 5 do CDV", acima do nome. |
| `resumo` | Resumo | Abaixo do nome (obrigatório). |
| `o_que_e` | O que é | Caixa "O que é". |
| `itens_titulo` / `itens` | Título da lista / Itens avaliados | Caixa com etiquetas, uma por linha. |
| `perguntas` / `resposta` | Perguntas / Resposta | Lista "Perguntas · Resposta" na abertura. |
| `como_responder` | Como responder | Caixa "Como responder". |
| `como_ler_resultado` | Como ler o resultado | Caixa "Como ler o resultado". |
| `link_teste` | Link do teste | Botão "Fazer o teste". Aceita só `https://` ou um caminho do site. |
| `ordem` | Ordem na lista | Menor primeiro; em caso de empate, ordem alfabética. |

| Se… | Na página acontece |
| --- | --- |
| nenhum teste publicado | a seção some |
| o teste não tem nome, resumo ou endereço válido | o teste não aparece |
| uma parte do teste está vazia | a caixa dessa parte não aparece |
| o link está vazio, é `http://`, `mailto:` ou `javascript:` | o teste aparece sem o botão |
| o Strapi falha e a seção **não** abre a página | a seção some e o resto da página continua |
| o Strapi falha e a seção abre a página | erro da página (`error.tsx`) |

O `<section>` tem `id="os-testes"`: é a âncora do botão "Ver os testes" no topo de `/eba/testes`. Use uma lista por página.

## Medição (DataLayer)

Não tem evento novo. Os eventos do catálogo já cobrem a seção (`docs/analytics/README.md`):

- `clique_cta` no botão "Fazer o teste", com `origem: 'lista-testes'` e o destino da URL do teste. Ele responde "quais testes as pessoas abrem".
- `clique_cta` nos atalhos.
- `ver_secao`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/ListaTestesSection/ListaTestesSection.test.tsx`
- `next/src/components/sections/ListaTestesSection/normalize.test.ts`
- `next/src/lib/eba/teste.test.ts` (partes vazias, itens por linha, link inválido, ordem)
- `next/src/lib/strapi/queries/testes.test.ts`

Os testes de característica também cobrem o componente, sem precisar de edição: os 5 pilares, a11y/SEO de toda variante, CSS e a integração da vitrine.

## Status

Implementado na branch `feat/eba-editorial`. Publicado no Strapi de dev pelo seed v20, com os 5 testes da apostila do CDV (EBA 2023).
