# Agenda de eventos — componente `sections.agenda-eventos`

> **Status:** `IMPLEMENTADO` · conteúdo local será criado pelo seed v18; validação com os serviços locais pendente
> **Figma:** [Agenda — node 220:19253](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=220-19253)
> **Vitrine:** `/componentes/agenda-eventos`
> **Guia do editor:** `strapi/src/editor-guide/sections.agenda-eventos.json`

## 1. O que é

### Correções da PR #10 (18/10/2026)

- Filtro por unidade mantém eventos gerais (sem igrejas do cadastro) e os daquela unidade. A resolução de IDs conhecidos é a mesma usada pelas badges; várias unidades continuam com várias badges. IDs desconhecidos são considerados gerais apenas para esse filtro, sem inferir publicação ou local pelo título/endereço.
- `/agenda/[slug]` usa título + ID por enquanto. Título incorreto ou antigo redireciona permanentemente para `urlDoEvento`; ID inválido/inexistente ou evento não publicado retorna 404. Falhas transitórias continuam recuperáveis.
- Encerrado ainda publicado permanece com conteúdo, aviso, link à Agenda e `noindex`, sem CTA de acesso. A decisão temporal é calculada fora do cache, com o fim real (ou início quando não há fim), e não altera a validade de publicação.
- A consulta cacheada reúne duas janelas: início a partir de hoje (preserva eventos sem fim) e início anterior com término a partir de hoje (preserva eventos em andamento). IDs de fronteira são deduplicados; filtros de unidade/categoria permanecem aplicados dentro do mesmo cache. Cache da lista v8.
- Para detalhes de dias anteriores, a categoria GC é confirmada em uma consulta pública restrita ao dia, compartilhada em cache por 30 minutos. Não depende da presença na lista futura. GC confirmado retorna 404; falha ou paginação incompleta não libera o evento nem vira 404 transitório.
- SEO preserva imagem original para compartilhamento e WebP no Hero, campos OG, resumo em palavras completas e BreadcrumbList. Local do Schema vem do local físico, não do campus; não há preço/oferta inferidos de `event_url`. Imagem do Hero pode servir de fallback ao SEO da página CMS, entre imagem editorial própria e padrão global.
- Medição: `acessar_evento`, `filtrar_agenda` e `buscar_evento`; seleção de cards coberta por `selecionar_evento` com origem. `como_chegar` resolve contexto Location → unidade → vazio, mantendo campus em parâmetro separado. Busca envia apenas comprimento e resultados após 1 segundo e mínimo de 3 caracteres, sem texto pessoal. Demais interações cobertas por `clique_cta` e `ver_secao`; sem novo evento de galeria. JSON GTM preparado, publicação externa pendente.
- Vitrine de detalhes inclui variante `encerrado`; mocks completos usam datas futuras estáveis. Testes de normalize/componentes, metadata, integração de rota e analytics cobrem as regressões. DataLayer validado no navegador em 18/10/2026: filtro, busca sem texto pessoal, seleção Agenda/Outros eventos, CTA e Maps com Location prioritário, inclusive em evento geral. Axe executado na Agenda e detalhes, desktop/mobile: sem falhas críticas ou violações nas seções alteradas; sinalização de contraste da marca decorativa do Footer registrada separadamente, sem alterar o componente. Leitor de tela, dispositivo real e publicação externa do GTM/GA4 permanecem pendentes.

Uma lista completa dos próximos eventos públicos da ADAI. A página ajuda pessoas a encontrar conferências, cultos especiais e encontros ativos e habilitados retornados pela API pública da inChurch. O campo legado `show_on_site` não participa dos filtros.

**Onde é usado:** página `/agenda`, depois do Hero.
**Quantas vezes por página:** uma.

## 2. Escopo

**Dentro:** listagem cronológica, arte ou data em destaque, título, horário, descrição, filtros locais por unidade e palavra-chave, e badge da unidade quando o cadastro permite identificá-la.

Os cards navegam para `/agenda/<nome>-<id>`. Os detalhes validam a publicação na API pública (`GET /v1/event/{id}/`) antes de buscar conteúdo completo no endpoint administrativo `GET /api/v2/inchurch_event/{id}/?auth=event`, com header fixo `Channel: control_panel`. URLs com títulos antigos continuam funcionando pelo ID. HeroSection e ProximosEventosSection são reutilizados. A descrição HTML vira texto seguro com parágrafos, quebras de linha e URLs HTTP(S) clicáveis. O botão “Acessar evento” usa somente `event_url` HTTP(S) válido, independentemente de domínio, preço ou flags de inscrição. Sem esse destino, não há botão; `external_subscription_url` e `public_url` não geram CTA. Links externos abrem em nova aba com `noopener noreferrer`.

Nos detalhes, `units[].related_obj.id` identifica igrejas locais quando `model=inradartertiarygroup`; o ID da Unit não é o ID da igreja. Múltiplas unidades são preservadas e os nomes usam o cadastro existente quando disponível. `tertiarygroup` é fallback se não houver destinos em `units`; uma publicação explicitamente regional/denominacional não vira igreja por inferência. O vínculo público existente é mantido apenas quando não há informação administrativa de unidade. Sem associação segura, o campo fica oculto. Investimento continua ausente: os indicadores internos não representam preços de provedores externos. O bloco Local preserva o endereço físico e recebe campos administrativos mais completos, sem inferir campus pelo endereço. Maps prefere coordenadas válidas e usa endereço como alternativa.

`event_schedule` é ordenado por data e início, agrupado por dia e exibido na seção Programação, com horário inicial/final, título, descrição e local disponíveis. Horários locais não sofrem conversão de fuso. Sem atividades válidas, a seção não aparece. A vitrine `/componentes/evento-detalhe` usa apenas conteúdo público, sem copiar os dados administrativos do evento de referência; a programação desse evento de referência fica isolada nas fixtures de teste fornecidas na tarefa.

A integração administrativa é exclusiva do servidor (`server-only`). Configuração em `next/.env.example`: `INCHURCH_API_BASE_ADMIN` e `INCHURCH_ADMIN_API_KEY` (header completo `ApiKey USUARIO:CHAVE`). Nunca usar prefixo público nem colocar a credencial na URL. O cache de 30 minutos guarda somente a projeção pública normalizada; metadata e página compartilham o resultado por renderização. Nenhum objeto administrativo completo é enviado ao navegador. Eventos inativos ou desabilitados continuam bloqueados nos detalhes e no SEO. A publicação é validada na API pública; `is_public` administrativo não bloqueia um evento já aprovado por essa fonte (o Connect Pulse retorna esse indicador falso). `show_on_site` não bloqueia listagem, detalhes ou metadados, mesmo quando falso ou ausente. Falha administrativa ou credencial ausente usa dados públicos já validados/última versão válida, sem expor autenticação; sem versão pública válida, erro recuperável. A API pública continua definindo quais eventos podem entrar na listagem. As unidades de publicação são complementadas pelo mesmo cliente administrativo dos detalhes; nenhuma alteração no Strapi.

`event_attractions` fornece a seção opcional Convidados, entre Programação e Outros eventos. A normalização mantém a ordem e apenas nome, cargo, biografia, foto e link HTTP(S) válidos; nomes vazios são descartados. Sem foto válida, o card usa iniciais; sem cargo, biografia ou link, o respectivo campo fica oculto. Biografias são texto seguro com parágrafos, quebras de linha e links. Cards com foto circular usam uma coluna em mobile/tablet e até duas no desktop. O link reutiliza `TextLink`, com seta, aviso de nova aba e proteção `noopener noreferrer`. Nenhuma consulta adicional ou dado no Strapi. A vitrine apresenta um exemplo de contrato identificado como demonstração, sem buscar convidados privados.

A prévia local foi removida. Todos os IDs, inclusive 1646183, seguem o mesmo fluxo de validação, cache, metadados e JSON-LD. Não existe exceção por ambiente ou ID.

**Decisões pendentes:** como eventos online serão identificados após observar dados reais da inChurch.

`event_images` fornece a seção Galeria do evento após Convidados e antes de Outros eventos. IDs positivos estáveis, ordem da API e apenas URLs HTTP(S) válidas; blacklist e IDs duplicados são descartados. A imagem ampliada prioriza WebP/imagem original, com fallback para app/thumbnail; o grid usa a mesma fonte de maior resolução, redimensionada responsivamente pelo Next/Image. O thumbnail da inChurch pode ter apenas 180×101 e fica como último fallback, evitando ampliação de uma fonte pequena. Nunca replica o Hero automaticamente. O grid usa 1/2/3 colunas em mobile/tablet/desktop e limita a imagem única. `GaleriaEvento` usa o padrão de dialog nativo do player existente, carregando somente a imagem ampliada selecionada. Suporta botões, setas, Escape, clique no fundo, contador, foco contido/retornado e bloqueio de rolagem. Miniaturas usam lazy loading e proporção 16:9; imagens ampliadas usam contain. Next/Image otimiza somente o host/caminho já autorizado de storage.googleapis.com; outras URLs usam entrega direta, sem ampliar remotePatterns. Dados vêm da consulta administrativa já existente, com projeção e cache versionados. Vitrine: variantes de galeria única/múltipla com imagens já públicas.

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
- Os eventos seguem as regras centralizadas da inChurch: ativos, habilitados, sem filtro por `show_on_site`, sem GCs, recorrências agrupadas e dados em cache.
- A resposta de `GET /v1/event/` não informa a unidade diretamente. O servidor também consulta cada unidade do Strapi por `church_id` e acumula todas as associações confirmadas em `igrejaIds`, sem sobrescrever as anteriores. Cada unidade conhecida gera uma badge no canto superior direito, com quebra de linha quando necessário. O evento continua em um único card e pode ser encontrado pelo filtro de qualquer unidade associada; eventos gerais ou sem associação conhecida continuam sem badge. Quando os filtros públicos omitem publicações em várias igrejas, `units[].related_obj.id` da administração confirma os vínculos. O header `Channel: control_panel` é necessário para receber esses campos. Essa leitura por evento compartilha cache de 30 minutos com os detalhes, limitado aos campos utilizados, com até quatro consultas simultâneas na atualização; em falhas, os vínculos públicos são preservados. Não há novas consultas por unidade.

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
| Mobile ≤768 | Uma coluna de cards arredondados; filtros empilhados, arte/fallback 16:9 e badge no canto superior direito, assim como nos demais tamanhos de tela. |
| Tablet 769–1023 | Duas colunas. |
| Desktop ≥1024 | Três colunas e 80 px de respiro inferior antes do rodapé. |

O Hero comum da página mantém o único `h1`; a Agenda usa `h2` e cada evento usa `h3`. Os filtros usam `label`s associados a controles nativos, e a ausência de resultado é anunciada por uma região de status. Os cards são `article`s com link esticado para os detalhes. A arte é decorativa porque o nome do evento aparece em texto; a data também fica disponível como texto no card. Nos detalhes, o Hero não tem título: o nome do evento é o único `h1`.

## 9. Checklist dos 5 pilares

- **Dados no CMS:** schema, guia, dynamic zone e seed v18 descrevem os dois campos e a página local `agenda`.
- **Página:** a rota genérica `[slug]` recebe a página `agenda` do Strapi; não existe rota especial no Next.
- **Vitrine:** `/componentes/agenda-eventos` tem os estados completo, mínimo, sem arte e vazio, com controles para os textos editoriais.
- **SEO:** Hero é o `h1` da página; seção é `h2`; eventos são `h3`; cards sem ação não entram no foco.
- **Medição:** decisão registrada abaixo; nenhum evento do Strapi controla tracking.

## Medição (DataLayer)

Medição: coberto por `ver_secao` na Programação, Convidados, Galeria e demais seções, e `clique_cta` na Agenda, breadcrumb, acesso ao evento, Maps, links dos convidados e botões da galeria; os cards de Outros eventos também usam `selecionar_evento`. Nenhum evento novo. Testes: `admin-client.test.ts`, `EventoDetalhe.test.tsx`, `detalhes.test.ts`, `eventos-cache.test.ts` e integração `evento-detalhe.test.tsx` cobrem dados ausentes, convidados únicos/múltiplos, opcionais, segurança, navegação, metadata e falhas.

## Testes

- `next/src/lib/inchurch/datas.test.ts`
- `next/src/lib/inchurch/eventos.test.ts`
- `next/src/lib/strapi/queries/unidades.test.ts`
- `next/src/components/sections/AgendaEventosSection/AgendaEventosSection.test.tsx`
- `next/src/lib/registry/sectionRegistry.test.ts`
- `next/src/__tests__/integracao/paginas.test.tsx`

As características automáticas também conferem schema/guia/registry/vitrine, acessibilidade/SEO, CSS e documentação dos cinco pilares.
