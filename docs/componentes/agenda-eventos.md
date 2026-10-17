# Agenda de eventos — componente `sections.agenda-eventos`

> **Status:** `IMPLEMENTADO` · conteúdo local será criado pelo seed v18; validação com os serviços locais pendente
> **Figma:** [Agenda — node 220:19253](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=220-19253)
> **Vitrine:** `/componentes/agenda-eventos`
> **Guia do editor:** `strapi/src/editor-guide/sections.agenda-eventos.json`

## 1. O que é

Uma lista completa dos próximos eventos públicos da ADAI. A página ajuda pessoas a encontrar conferências, cultos especiais e encontros que a equipe marcou como **Mostrar no site** na inChurch.

**Onde é usado:** página `/agenda`, depois do Hero.
**Quantas vezes por página:** uma.

## 2. Escopo

**Dentro:** listagem cronológica, arte ou data em destaque, título, horário, descrição, filtros locais por unidade e palavra-chave, e badge da unidade quando o cadastro permite identificá-la.

**Fora:** página individual do evento, inscrição, participação, botões, links no card e classificação automática de evento online.

**Decisões pendentes:** definir a futura página/fluxo de inscrição e como eventos online serão identificados após observar dados reais da inChurch.

## 3. Contrato no Strapi

| Propriedade | Valor |
| --- | --- |
| Display name | Agenda de eventos (inChurch) |
| Nome técnico | `sections.agenda-eventos` |
| Onde entra | Dynamic zone `sections` de `api::page.page` |
| Componente no front | `next/src/components/sections/AgendaEventosSection/` |
| Chave do registry | `sections.agenda-eventos` |

```text
sections.agenda-eventos
├── titulo             Text (short) · obrigatório · máx. 80 · padrão “Todos os eventos”
└── mensagem_vazia     Text (short) · obrigatório · máx. 160 · padrão “Ainda não há eventos programados.”
```

Eventos, horários, artes e descrições não são duplicados no Strapi: vêm da inChurch. O nome da unidade vem de `api::unidade.unidade`, associado ao ID da igreja na inChurch.

### Regras do contrato

- O editor configura somente os dois textos. Não há campo de cor, fonte, HTML, card ou link livre.
- O título e a mensagem são obrigatórios no painel; o front mantém os valores padrão como proteção para conteúdo incompleto.
- Os eventos seguem as regras centralizadas da inChurch: ativos, habilitados, “Mostrar no site”, sem GCs, recorrências agrupadas e dados em cache.
- A resposta de `GET /v1/event/` não informa a unidade diretamente. O servidor também consulta cada unidade do Strapi por `church_id` e só exibe a badge quando essa consulta confirma o vínculo; eventos gerais ou sem essa associação continuam sem badge.

## 4. Campos (na ordem do painel)

### 4.1 `titulo`

| Propriedade | Valor |
| --- | --- |
| Nome no painel | Título da seção |
| Nome técnico | `titulo` |
| Tipo Strapi | Text (short) |
| Obrigatório | Sim |
| Limites | Máx. 80 caracteres |
| Default | Todos os eventos |
| Descrição no painel | Título acima de todos os cards da agenda. |
| Placeholder | Ex.: Todos os eventos |
| Onde aparece | Título grande depois do Hero. |
| Dicas | Prefira uma frase curta que explique a lista. |

### 4.2 `mensagem_vazia`

| Propriedade | Valor |
| --- | --- |
| Nome no painel | Mensagem sem eventos |
| Nome técnico | `mensagem_vazia` |
| Tipo Strapi | Text (short) |
| Obrigatório | Sim |
| Limites | Máx. 160 caracteres |
| Default | Ainda não há eventos programados. |
| Descrição no painel | Texto mostrado quando a inChurch responde sem eventos futuros. |
| Placeholder | Ex.: Ainda não há eventos programados. |
| Onde aparece | Abaixo do título, no lugar dos cards quando não há eventos. |
| Dicas | Não use como mensagem de erro; em caso de falha da inChurch a seção fica oculta. |

## 5. Exemplo de preenchimento

```text
Título da seção: Todos os eventos
Mensagem sem eventos: Ainda não há eventos programados.
```

## 6. JSON da API (igual ao `.mock.json` → variante `completo`)

```json
{
  "__component": "sections.agenda-eventos",
  "id": 71,
  "titulo": "Todos os eventos",
  "mensagem_vazia": "Ainda não há eventos programados."
}
```

## 7. Estados e dados externos

| Situação | Na página acontece |
| --- | --- |
| inChurch retorna eventos futuros | Cards em ordem cronológica, sem limite ou prioridade por destaque. |
| Evento tem arte | A arte 16:9 ocupa o topo do card; o nome da unidade aparece sobre ela quando o ID corresponde ao cadastro de Unidades. |
| Evento não tem arte | A próxima data aparece em destaque na mesma área 16:9; a badge continua disponível quando houver unidade. |
| Evento geral ou unidade desconhecida | Nenhuma badge é mostrada; nenhum ID técnico aparece para a pessoa. |
| Filtro de unidade | As opções vêm do collection type `Unidades`; a seleção mostra somente eventos com vínculo confirmado àquela unidade. |
| Busca | Filtra título e descrição no navegador, sem recarregar a página e sem diferenciar maiúsculas, minúsculas ou acentos. |
| Filtros sem resultado | A página explica que não encontrou eventos e oferece “Limpar filtros”. |
| inChurch responde sem eventos | O título e a mensagem editorial permanecem visíveis. |
| inChurch falha sem cache | A seção fica oculta; o site não afirma que não existem eventos. |
| Editor deixa texto vazio | O front usa o texto padrão; o painel já impede salvar sem os dois campos. |

## 8. Layout e acessibilidade

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | Uma coluna de cards arredondados; filtros empilhados, arte/fallback 16:9 e badge no canto superior esquerdo. |
| Tablet 769–1023 | Duas colunas. |
| Desktop ≥1024 | Três colunas e 80 px de respiro inferior antes do rodapé. |

O Hero comum da página mantém o único `h1`; a Agenda usa `h2` e cada evento usa `h3`. Os filtros usam `label`s associados a controles nativos, e a ausência de resultado é anunciada por uma região de status. Os cards são `article`s informativos, sem link nem botão nesta entrega. A arte é decorativa porque o nome do evento aparece em texto; a data também fica disponível como texto no card.

## 9. Checklist dos 5 pilares

- **Dados no CMS:** schema, guia, dynamic zone e seed v18 descrevem os dois campos e a página local `agenda`.
- **Página:** a rota genérica `[slug]` recebe a página `agenda` do Strapi; não existe rota especial no Next.
- **Vitrine:** `/componentes/agenda-eventos` tem os estados completo, mínimo, sem arte e vazio, com controles para os textos editoriais.
- **SEO:** Hero é o `h1` da página; seção é `h2`; eventos são `h3`; cards sem ação não entram no foco.
- **Medição:** decisão registrada abaixo; nenhum evento do Strapi controla tracking.

## Medição (DataLayer)

Medição: coberto por `ver_secao`. Não há evento novo nesta entrega porque os cards não têm clique, CTA nem fluxo de inscrição; filtros são uma utilidade local e não enviam dados a terceiros.

## Testes

- `next/src/lib/inchurch/datas.test.ts`
- `next/src/lib/inchurch/eventos.test.ts`
- `next/src/lib/strapi/queries/unidades.test.ts`
- `next/src/components/sections/AgendaEventosSection/AgendaEventosSection.test.tsx`
- `next/src/lib/registry/sectionRegistry.test.ts`
- `next/src/__tests__/integracao/paginas.test.tsx`

As características automáticas também conferem schema/guia/registry/vitrine, acessibilidade/SEO, CSS e documentação dos cinco pilares.
