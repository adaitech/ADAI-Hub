# Agenda — design

**Data:** 2026-10-17 · **Figma:** `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`), protótipo Agenda (node `220:19253`) · **Caminho:** arquitetural

## 1. Objetivo

Disponibilizar a primeira versão pública de **`/agenda`**, para que qualquer pessoa encontre todos os próximos eventos que a equipe marcou como “Mostrar no site” na inChurch. A página conserva a arte de cada evento como elemento principal do card e identifica, quando houver dado confiável, a unidade responsável.

O escopo termina na listagem. Não haverá rota individual de evento, inscrição, participação, CTA ou link no card nesta entrega.

## 2. Decisões do brainstorming

| Tema | Decisão |
| --- | --- |
| Modelo da página | Uma `page` do Strapi de slug `agenda`, atendida pela rota existente `(site)/[slug]`; não criar `app/(site)/agenda/page.tsx`. |
| Seção | Novo componente Strapi `sections.agenda-eventos`, com seu próprio Server Component. Não adaptar `sections.proximos-eventos`, que continua sendo o carrossel limitado da Home e das unidades. |
| Fonte dos eventos | inChurch Public API, pelas regras já centralizadas: ativo, habilitado e “Mostrar no site”; GCs ficam excluídos. |
| Abrangência | Todos os eventos futuros gerais e de todas as unidades; sem limite e sem a priorização por destaque usada na Home. |
| Ordem | Cronológica, da próxima ocorrência à mais distante. Recorrências continuam sendo um único evento, com as datas futuras agrupadas e ordenadas. |
| Badge | Sobre a arte, no canto superior direito. O texto é somente o `nome` da coleção Strapi `unidade`, associado por `igreja_inchurch_id`. Evento geral ou unidade sem correspondência confiável não recebe badge. |
| Eventos online | Sem regra especial nesta etapa. Não inferir “online” de URL; a definição de ADAI On ou online será tomada após integrar e observar dados reais. |
| Card | Componente visual próprio, arredondado, com arte 16:9, badge, título, data/hora e descrição resumida. Não é clicável nesta fase. |
| Sem arte | O card permanece na lista. No lugar da arte, usa um bloco de data em destaque, com dia e mês da próxima ocorrência, preservando a proporção 16:9 e a badge quando aplicável. |
| Lista vazia | Quando a inChurch responder corretamente sem eventos futuros, mostrar a seção e a mensagem “Ainda não há eventos programados.” |
| Falha da inChurch | Se não houver valor em cache, ocultar a seção — nunca afirmar que não existem eventos. O stale-if-error existente continua valendo. |

## 3. Strapi e conteúdo local

### 3.1 Dynamic zone

Criar `sections.agenda-eventos` e liberá-lo na dynamic zone de `api::page.page`.

O componente terá conteúdo editorial mínimo e explícito:

- `titulo`: `string`, obrigatório, máximo de 80 caracteres. Seed: `Todos os eventos`.
- `mensagem_vazia`: `string`, obrigatório, máximo de 160 caracteres. Seed: `Ainda não há eventos programados.`

O guia do editor explica que os campos controlam apenas textos da página; eventos, artes, descrições, horários e unidades vêm da inChurch e da coleção **Unidades**. Criar também o contrato/documentação do componente e liberá-lo no registro de guias do Strapi.

### 3.2 Página Agenda

O seed local será elevado para a próxima versão e passará a criar/publicar (ou reconstruir apenas nessa migração de seed) a página:

- título e slug: `Agenda` / `agenda`;
- SEO: `Agenda | ADAI` e a descrição `Confira os próximos eventos, conferências e cultos especiais da ADAI.`;
- seções, nesta ordem: `sections.hero` existente; depois `sections.agenda-eventos` com os textos acima.

O Hero segue integralmente o contrato editorial já existente: `titulo`, `texto_apoio`, `imagem`, botões, `subtitulo` e `preto_e_branco` são dados da dynamic zone, editáveis no Strapi como nas demais páginas. O seed cria somente os valores iniciais locais conforme o Figma — título `Agenda`, texto de apoio “Confira os próximos eventos, conferências e cultos especiais da ADAI.” e uma mídia válida com texto alternativo descritivo — sem tratamento especial no Next e sem prender conteúdo ao código. A mídia, seus textos e os demais campos poderão ser alterados pelo time no painel.

A página hoje não existe no Strapi local, portanto o seed é parte necessária da funcionalidade, e não um passo manual do editor. Como produção não executa seed, a implementação também atualiza o snapshot `strapi/data/adai-conteudo.tar.gz` depois de validá-lo, seguindo o procedimento do repositório.

### 3.3 Unidades

`api::unidade.unidade` já possui o contrato adequado: `nome` e `igreja_inchurch_id` único. Não criar outro campo ou duplicar nomes de unidades em eventos.

`lib/strapi/queries/unidades.ts` passará a expor uma consulta tipada de unidades com ambos os campos. `getIgrejasInchurch()` pode derivar dela para preservar os consumidores atuais. A seção monta um mapa por ID para resolver o texto de cada badge; falha do Strapi resulta em mapa vazio, sem bloquear ou rotular incorretamente os eventos.

## 4. Arquitetura no Next

### 4.1 Limites dos componentes

Criar `AgendaEventosSection/` no mesmo padrão das seções existentes:

- `types.ts`, `normalize.ts`, `AgendaEventosSection.tsx`, CSS Module, mock JSON, showcase com controles, teste e `index.ts`;
- entrada no `sectionRegistry` e na vitrine `/componentes`;
- `AgendaEventoCard` como componente de apresentação interno e reutilizável pela seção, sem acesso a rede ou a Strapi.

`AgendaEventosSection` é um Server Component. Ele obtém as unidades no Strapi, chama uma vez `getEventosInchurch(idsDasUnidades)` e entrega um view model pronto ao card. O card não conhece o formato cru da inChurch, não busca dados e não recebe links de evento.

### 4.2 Seleção e formatação dos eventos

Criar uma função pura específica da agenda, por exemplo `eventosDaAgenda`, que:

1. remove ocorrências cujo término já passou;
2. remove eventos sem ocorrência futura;
3. mantém as ocorrências futuras de cada evento em ordem;
4. ordena os eventos pela primeira ocorrência futura, ignorando `destaque`;
5. não aplica limite.

As regras atuais de normalização, cache de 30 minutos, deduplicação, agrupamento de recorrências, filtro de GCs e “Mostrar no site” permanecem a fonte única de verdade. `proximosEventos` não muda de comportamento.

A formatação de datas hoje usada por `ProximosEventosSection` será extraída para uma função pura compartilhada: uma data, intervalo de dias consecutivos e recorrências em dias soltos seguem o formato já testado. Isso evita que Home e Agenda expressem as mesmas ocorrências de modos divergentes. O fallback visual da arte usa o dia e o mês da primeira ocorrência futura; os detalhes textuais mantêm o formato completo.

Para cada evento, o normalizador da seção produz somente o necessário ao card: identificador, nome, datas já formatadas, descrição resumida existente (primeiro parágrafo, até 140 caracteres), imagem válida ou fallback de data e nome da unidade opcional.

### 4.3 Estado e renderização

Com dados: a seção apresenta `h2`, uma grade de `article`s e, em telas maiores, duas colunas; no celular é uma coluna. A arte usa a mídia 16:9 da inChurch, com a badge posicionada sobre ela. Sem imagem, o bloco de data em destaque ocupa a mesma área, sem fabricar arte ou omitir evento.

Com resposta válida e zero cards: renderizar o `h2` e a mensagem vazia editorial. Com retorno `null` de `getEventosInchurch`: retornar `null` para a seção. Não haverá loading client-side nem mensagem de erro pública nesta fase.

## 5. Acessibilidade, SEO e medição

- O Hero preserva o único `h1` da página; a Agenda usa `h2`, e o nome de cada evento, `h3`.
- Cards sem destino usam `article`, não link ou botão, portanto não entram indevidamente na ordem de foco. Quando uma rota de evento existir, ela poderá envolver o mesmo card em link sem alterar dados ou cache.
- A arte é decorativa quando o nome do evento já aparece no card; o fallback de data é texto visível. Badge mantém contraste adequado e não é a única forma de comunicar o local.
- O SEO vem da página do Strapi e a rota entra no sitemap pelo mecanismo existente de páginas publicadas.
- Medição: sem clique ou nova conversão, não há evento novo. A exibição da seção é coberta por `ver_secao`; registrar essa decisão em `docs/componentes/agenda-eventos.md`.

## 6. Testes e verificação

Pelo TDD, os testes falham antes da implementação e cobrem:

- `eventosDaAgenda`: expiração, preservação de recorrências, ordenação cronológica, nenhum limite e nenhum efeito de `destaque`;
- formatação compartilhada de uma data, intervalo e datas soltas, mantendo os casos existentes de Próximos Eventos;
- normalização da agenda: nome da unidade resolve badge; evento geral e ID sem unidade não recebem badge; fallback sem imagem usa a próxima data;
- card: renderiza arte ou fallback, badge opcional, título/data/descrição e não gera link;
- seção: cenário completo, lista vazia e `null` vindo da inChurch;
- integração: `agenda` retornada pelo Strapi, incluindo o Hero existente renderizado pelo `SectionRenderer`, `sectionRegistry`, metadados/um `h1` e vitrine do componente;
- características obrigatórias do repositório, incluindo CSS, SEO, acessibilidade e ausência de segredos.

Gates finais: `yarn quality`, build de Next e Strapi, `yarn smoke` com ambos servidores, inspeção de 375/768/1440, os cinco pilares, e as validações de Lighthouse e axe quando os serviços locais estiverem disponíveis.

## 7. Fora de escopo e pendências

- Rota individual, inscrição e participação em evento.
- Tornar o card clicável ou disparar `selecionar_evento`.
- Classificar automaticamente links como eventos online ou rotular “ADAI On” sem dados reais da inChurch.
- Alterar o carrossel “Próximos eventos” da Home e das páginas de unidade, exceto a extração pontual da função de formatação compartilhada.

Depois da integração com credenciais, validar o payload real de eventos online e decidir se a unidade ADAI On deve aparecer como badge ou se haverá outro indicador.
