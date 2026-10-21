# Migração da EBA — entrega 2: testes do CDV no Hub — design

> Protótipo: `docs/prototipo/eba/teste-dons-servico.html` (10 estados) e `testes.html` · Entrega 1: `2026-10-18-migracao-eba-1-editorial-design.md` e `2026-10-19-migracao-eba-1-ajustes-card-testes-design.md`

## 1. Objetivo

Os 5 testes do CDV passam a ser respondidos no ADAI Hub, em `/eba/testes/<slug>`, com o visual do Hub. A equipe da EBA continua vendo os resultados no painel atual, como hoje.

O caminho completo que precisa funcionar:

1. O aluno lê o QR code impresso.
2. Cai no Hub e se identifica pelo e-mail.
3. Responde, uma pergunta por tela.
4. Vê o resultado.
5. A equipe encontra esse resultado no painel atual (`eba.adai.com.br/dashboard/consultas`).

## 2. Decisões do brainstorm (2026-10-20)

| Tema | Decisão |
| --- | --- |
| Abordagem | **A**: o Hub vira o novo front da API atual (`eba-ada-api`). Todas as chamadas saem do **servidor** do Hub, pelo API Management. O cálculo continua na API. |
| Identificação | E-mail, **com proteção**: a busca roda só no servidor e a tela nunca mostra dados de um e-mail já cadastrado. Primeiro acesso pede nome, unidade e turma. |
| Sessão | Cookie de **sessão** (sem data de validade), `httpOnly` e assinado, com **no máximo 2 h**. Fechar o navegador encerra. Botões "Trocar e-mail" e "Sair". |
| Progresso | Uma pergunta por tela, com barra de progresso e voltar. As respostas ficam no `sessionStorage`: sobrevivem a uma recarga e somem quando a aba fecha. |
| Lançamento | Como na entrega 1: validado em homologação, entra no ar junto com o Hub. Os redirecionamentos dos QR codes ficam prontos e desligados. |

## 3. Fora do escopo

- O painel da equipe (`/dashboard/*`) e o login da equipe: entrega 4.
- A página de resultado por id (`/teste/resultado/<id>`): entrega 3.
- Mudar perguntas, escalas, cálculo, mensagens ou o banco da API.
- Login com senha para o aluno.
- ~~Envio de e-mail com código~~: **entrou no escopo** depois da revisão do PR #15 (21/10/2026). Desenho em `2026-10-21-migracao-eba-2-codigo-por-email-design.md`.

## 4. Como funciona hoje (levantado no código de `adaitech/eba-adai`)

**API e testes**
- API .NET em `eba-adai-api` (Azure SQL). O site atual chama a API direto, sem chave.
- O APIM `eba-adai-API` (`https://eba-adai-api.azure-api.net`) expõe todos os endpoints abaixo e exige chave de assinatura (`Ocp-Apim-Subscription-Key`).

| Teste | Slug | `idQuestion` | Perguntas | Resposta |
| --- | --- | --- | --- | --- |
| Dons de serviço prático | `dons-servico` | `80cd890e-…85c3` | API (55) | nota 0–5 |
| Dons ministeriais | `dons-ministerio` | `f055b0b0-…2826` | API (25) | nota 0–5 |
| Talentos naturais | `talentos-naturais` | `49850007-…4059` | API | marcar itens |
| Estilo pessoal | `estilo-pessoal` | `e6bb31ca-…b4` | conteúdo local do site (`estilo-pessoal.ts`) | escala 1–5 |
| Temperamento pessoal | `temperamento-pessoal` | `8699a220-…2edd` | API + tabela local (`temperamento-table.ts`) | marcar itens |

**Endpoints usados**

| Uso | Endpoint |
| --- | --- |
| Perguntas | `GET /api/v1/eba/Question/{id}` |
| Aluno por e-mail | `GET /api/v1/eba/Student/email/{email}` |
| Cadastro | `POST /api/v1/eba/Student` (`name`, `email`, `room` = unidade, `idClass`) |
| Turmas | `GET /api/v1/eba/ClassEBA?Status=…` |
| Envio das respostas | `POST /api/v1/eba/SurveyResponse` (`responseQuestionList`). Devolve o resultado calculado: `name`, `totalRate`, `message`; no estilo pessoal, a combinação "Tarefa/Pessoas × Estruturado/Não estruturado". |

**Unidades** gravadas no campo `room`: `campestre`, `sbc`, `santos` e as demais da lista atual. Os valores exatos são copiados do `form-complete.tsx`.

**Anália Franco** substitui a antiga opção Colorado e continua gravando `colorado` (decisão de 2026-10-20).

**Unidades novas (pedido de 2026-10-20):** o Primeiro acesso ganha **"Outra igreja"** (`outra-igreja`) e **"Visitante"** (`visitante`), além das 5 ADAIs. O campo `room` é texto livre na API, mas o painel da equipe pode filtrar ou exibir por esses valores. Antes do lançamento, é preciso confirmar no painel atual como aparecem os dois valores novos. Se o painel tiver uma lista fixa, ajustá-la fica para a entrega 4.

**Imagens:** o site atual mostra uma foto decorativa por estado:
- capa;
- uma foto por pergunta (55 em dons de serviço, 25 em dons ministeriais, 20 em temperamento, 14 em estilo pessoal e 1 em talentos);
- foto do resultado;
- foto da identificação (`login-student.jpg`).

Os originais estão em `eba-adai/public/assets/testes/` e somam cerca de 90 MB (os JPGs de dons têm 2048 px).

## 5. Arquitetura

### 5.1 Rotas

| Rota | Tipo | Observação |
| --- | --- | --- |
| `/eba/testes/[slug]` | Página do Next (Server Component + ilha cliente do questionário) | Só os 5 slugs; outro slug → 404. `noindex, nofollow`; fora do sitemap. |
| `/eba/testes` | Página do Strapi (já existe) | O "Fazer o teste" passa a apontar para `/eba/testes/<slug>`: o seed troca o `link_teste` para o caminho interno. |
| `eba.adai.com.br/teste/:slug` | Redirecionamento **307 (temporário)** no site atual | Fica em `redirecionamentos.mjs` (branch `feat/redirecionar-para-hub`), desligado até o lançamento. Temporário porque o destino é `noindex` e o rollback é desligar o redirecionamento: um 301 ficaria no cache dos celulares que já leram o QR code. Home e cursos seguem com 301. |

A rota `/eba/testes/[slug]` é mais específica que `/eba/[slug]` e tem precedência.

### 5.2 Camadas (padrão `Arquitetura-e-Governanca.md` §4.1)

```
lib/eba-api/            ← integração nova (só servidor)
  client.ts             fetch com base APIM + chave no header, timeout por chamada, erro tipado
  tipos.ts              JSON cru da API
  testes.ts             mapa slug → idQuestion, tipo de resposta e escala (fonte única)
  perguntas.ts          perguntas normalizadas por teste (cache 1 h, tag `eba-testes`)
  alunos.ts             buscar por e-mail, cadastrar
  turmas.ts             turmas ativas (cache 10 min) e aquecimento (GET leve, sem cache)
  respostas.ts          enviar respostas → resultado normalizado
lib/eba/sessao.ts       cria/lê/apaga o cookie de sessão (HMAC-SHA256, expira em 2 h)
app/(site)/eba/testes/[slug]/
  page.tsx              abertura (Strapi `teste`) + perguntas (API) → <Questionario>
  acoes.ts              Server Actions: identificar, cadastrar, enviar, sair, carregarPerguntas, aquecer
components/eba/Questionario/   ilha cliente: estados, progresso, sessionStorage
```

**Regras da integração**
- **Variáveis**, todas só no servidor:
  - `EBA_API_URL` (URL do APIM);
  - `EBA_API_KEY` (assinatura própria do Hub no APIM);
  - `EBA_SESSAO_SEGREDO` (segredo da assinatura do cookie).
  - Nada com `NEXT_PUBLIC_`. Sem as variáveis, a página do teste mostra "Testes indisponíveis no momento" com link para `/eba/testes`, e o build não quebra.
- **Server Actions** para os passos com efeito (identificar, cadastrar, enviar, sair). O Next já protege contra CSRF por origem.
- **Validação com `zod`** na entrada de cada ação:
  - e-mail válido e com até 254 caracteres;
  - nome com 3 a 100 caracteres;
  - unidade da lista;
  - turma entre as turmas ativas;
  - respostas completas, na faixa de cada escala, uma por pergunta.
- **Envio:** o `idStudent` e o `idClass` vêm **da sessão**, nunca do formulário.
- **Limite de tentativas** da identificação: 10 por minuto por IP, em memória. Freia quem tenta descobrir e-mails cadastrados.
- **Logs:** nunca registram e-mail nem nome; só o código de erro da API.
- **API fria (2026-10-21):** o banco Azure SQL da API pausa quando fica ocioso; a primeira chamada depois da pausa leva de 10 a 45 s (medido: `Student/email` em 44 s, a seguinte em 0,6 s). Por isso o timeout é por tipo de chamada (`ebaFetch(caminho, { timeoutMs })`; constantes em `client.ts`):

  | Constante | Valor | Uso |
  | --- | --- | --- |
  | `TIMEOUT_PAGINA_MS` | 10 s | Perguntas buscadas ao renderizar a página (padrão de `ebaFetch` e das funções de `lib/eba-api`): a página não pode travar. |
  | `TIMEOUT_ACAO_MS` | 45 s | Chamadas dentro de Server Actions: `alunoPorEmail`, `cadastrarAluno`, `turmasAtivas`, `carregarPerguntas` e as perguntas da validação do `enviar`. |
  | `TIMEOUT_ENVIO_MS` | 60 s | `POST SurveyResponse` (padrão de `enviarRespostas`). |
  | `TIMEOUT_AQUECER_MS` | 8 s | Aquecimento (padrão de `aquecerApi`): o banco começa a acordar com a tentativa de conexão, então não é preciso esperar a resposta. |

  As regras de erro não mudam (POST com 2xx ilegível continua `EbaApiRespostaInvalida`). A página `/eba/testes/[slug]` declara `export const maxDuration = 120` (segmento de rota; as Server Actions da página herdam), para a hospedagem não encerrar uma ação antes dos 45/60 s; no envio, isso poderia levar a gravação dupla.
- **Aquecimento:** a ação `aquecer()` faz um GET leve e sem cache (`ClassEBA?page-size=1`, 8 s) só para acordar o banco. A tela a chama uma vez, sem esperar, quando monta na abertura (nunca na vitrine). Ela nunca lança nem devolve dados; erros só vão para o log com a classe. Limite próprio de 5 por minuto por IP (mesma chave do `identificar`, sem gastar as tentativas dele); sem variáveis ou sem segredo, não chama a API. Como o Next despacha as Server Actions uma por vez por cliente, um `identificar` feito logo depois espera o aquecimento terminar; por isso o timeout do aquecimento é curto (no máximo 8 s de fila).
- **Perguntas depois da abertura:** se a busca da página falhar, a ação `carregarPerguntas(slug)` busca de novo com 45 s (slug inválido → `invalido`; falha → `indisponivel`; estilo e temperamento → `[]`, sem chamar a API; mesmo limite por IP do `identificar`). Estilo e temperamento usam conteúdo local: a página nem busca perguntas para eles, então nunca ficam "indisponíveis".

### 5.3 Sessão

- **Conteúdo do cookie `eba_sessao`:** `idStudent`, `idClass`, o e-mail mascarado para exibição (`a***@email.com`) e `emitidoEm`, com assinatura HMAC.
- **Atributos:** `httpOnly`, `secure` em produção, `sameSite=lax`, `path=/eba/testes` e **sem** `maxAge`, ou seja, um cookie de sessão.
- **Validade:** o servidor recusa a sessão se `agora − emitidoEm > 2 h` e a apaga. A tela mostra "Sua sessão foi encerrada".
- **"Respondendo como":** a tela mostra o e-mail **mascarado**, nunca o nome nem a turma do cadastro.

### 5.4 Fluxo da tela

A tela tem os estados do protótipo:

1. **Abertura.** Textos do tipo "Testes da EBA" no Strapi: nome, aula, resumo, perguntas/resposta e "Como responder". A linha "Tempo" fica de fora porque o Strapi não tem esse dado.
2. **Identificação.**
   - Com sessão válida, a tela pula direto para as perguntas.
   - E-mail encontrado → cria a sessão e segue.
   - E-mail não encontrado → abre o **Primeiro acesso**: nome, unidade e turma, depois cadastra e cria a sessão.
   - "Usar outro e-mail" volta ao começo.
3. **Pergunta.**
   - **0–5:** radio. Escolher avança; voltar mostra a resposta escolhida.
   - **Marcar itens:** checkbox com "Próximo".
   - **Estilo 1–5:** cada opção tem nome acessível completo, por exemplo "1 — mais perto de: uma meta alcançada".
   - O foco vai para o enunciado a cada troca de pergunta.
4. **Enviando.** `role="status"`, com o botão desabilitado.
5. **Resultado.**
   - Itens em ordem decrescente, com os 3 primeiros em destaque e barras proporcionais à escala do teste.
   - A mensagem da API do primeiro item.
   - Botões "Próximo teste: <nome>" (na ordem da apostila; não aparece no último teste), "Ver todos os testes" e "Sair".
   - O progresso salvo é apagado.
6. **Erro no envio.** As respostas continuam no `sessionStorage` e o aluno pode tentar de novo.
7. **Sessão encerrada.** Pede o e-mail de novo e mantém as respostas da aba.

### 5.5 Conteúdo e Strapi

- O tipo `teste` (entrega 1) continua sendo a fonte dos textos da abertura.
- O seed muda o `link_teste` dos 5 testes para `/eba/testes/<slug>` e sobe para o v21.
- Perguntas, escalas e tabelas locais (estilo pessoal e temperamento) são copiadas do site atual para `lib/eba-api/testes.ts`, como **dados**, com teste de que o total bate com o site atual.
- **Fotos dos testes:**
  - **Origem e formato:** copiadas do site atual e convertidas para WebP com no máximo 1200 px (cerca de 20 a 50 KB cada), em `next/public/eba/testes/<slug>/` (`capa`, `1`…`N`, `resultado`), mais `identificacao.webp`. Ficam fora do Strapi porque estão ligadas ao número da pergunta, não ao conteúdo editorial.
  - **Acessibilidade:** são decorativas (`alt=""`).
  - **Posição e alinhamento:** no desktop (≥ 1024 px), coluna à direita com a **mesma altura da caixa** do questionário (topo e base alinhados); no celular e no tablet, faixa 16:9 acima, com a mesma largura. Caixa e foto usam o mesmo raio (`--radius-lg`) e gap de 12 px entre elas, o mesmo das grades de cards.
  - **Troca:** acompanha o estado e a pergunta. A foto da próxima pergunta é pré-carregada.
  - **Teste do mapa:** cada slug tem capa, resultado e uma foto por pergunta, ou cai na capa.
  - **Script de conversão:** reprodutível em `next/scripts/`, sem novas dependências; usa `sharp`, que já vem com o Next.

## 6. Erros

| Situação | Comportamento |
| --- | --- |
| API ou APIM fora (ou fria, mais de 10 s) ao abrir o teste | A abertura aparece. "Começar" mostra "Preparando o teste…" (`role="status"`) e chama `carregarPerguntas` (45 s), uma chamada por vez. Sucesso: segue o fluxo normal (identificação ou perguntas), com o progresso salvo restaurado. Falha: "Não conseguimos carregar as perguntas agora. Tente em alguns minutos." e o botão "Tentar de novo", que chama de novo. Não é 404. |
| API fria na identificação, no cadastro ou no envio | As ações esperam até 45 s (envio: 60 s) em vez de falhar aos 10 s. |
| Ação demorando (identificar, cadastrar, carregar perguntas, enviar) | Depois de 5 s, junto do estado de espera, aparece "A primeira conexão do dia pode levar até um minuto. Aguarde, por favor." numa região `role="status"`; some quando a ação termina. |
| Turmas não carregam no Primeiro acesso | Mensagem com "Tentar de novo"; sem cadastro. |
| A API recusa o envio (400) | "Algumas respostas não foram aceitas." O código da API vai para o log. As respostas são mantidas. |
| Falha de rede ou 5xx no envio | Estado **Erro no envio**, com "Tentar de novo". |
| A API grava (2xx), mas o resultado vem fora do formato, vazio (`[]`) ou ilegível (corpo vazio, HTML, timeout na leitura do POST) | Estado de resultado com "Suas respostas foram enviadas para a equipe da EBA. Não conseguimos mostrar o resultado agora.", sem "Tentar de novo" (reenviar duplicaria a gravação). O progresso é apagado e `concluir_teste` dispara. |
| Aluno (Student) fora do formato (sem `id`/`idClass`) | Identificação e cadastro respondem como API indisponível; nenhuma sessão é aberta. |
| Envio com a sessão de outra pessoa (trocada em outra aba): o `respondidoComo` do cliente difere do dono da sessão do cookie | `enviar` devolve `sessao` sem chamar a API; a tela mostra "Sua sessão foi encerrada" e, se quem se identifica é outra pessoa, o teste recomeça sem reenviar. O dono é um HMAC do `idStudent` (`donoDaSessao`), não o e-mail mascarado: pessoas com a mesma máscara (`ana@` e `alice@` → `a***@`) se distinguem. (Revisão do PR #15, 21/10: antes era risco aceito.) |
| Muitas tentativas de e-mail | "Muitas tentativas. Aguarde um minuto." |
| Variáveis ausentes | "Testes indisponíveis no momento." |

## 7. Medição (DataLayer)

Os testes são o objetivo da área, então ganham **2 eventos novos**, sem dado pessoal:

| Evento | Quando | Parâmetros |
| --- | --- | --- |
| `iniciar_teste` | A primeira pergunta aparece | `teste` (slug) |
| `concluir_teste` | O resultado aparece | `teste` (slug) |

- `concluir_teste` vira **evento-chave** no GA4.
- Os botões e links continuam cobertos por `clique_cta`, e a tela tem `data-section="teste-eba"`.
- O GTM ganha os 2 eventos no gatilho e a variável `DLV - teste`. Atualizar o README de medição.

## 8. SEO, acessibilidade e LGPD

- **SEO:** `noindex` e fora do sitemap. Um `h1` (nome do teste), com os passos em `h2`.
- **Acessibilidade:**
  - radios e checkboxes nativos;
  - `fieldset`/`legend` no enunciado;
  - barra com `role="progressbar"`;
  - foco gerenciado entre os estados;
  - alvos de 44 px;
  - `prefers-reduced-motion` respeitado.
- **LGPD:**
  - aviso com link para a Política de Privacidade no formulário de e-mail;
  - dados pessoais só no servidor e na API;
  - nenhum dado pessoal no DataLayer, no `localStorage` ou em logs.
  - O texto da Política precisa citar os testes da EBA: a revisão do texto fica com a ADAI.

## 9. Testes (TDD)

- **`lib/eba-api/*`:**
  - URL, header da chave e timeout;
  - normalização das perguntas e do resultado;
  - erros tipados;
  - testes sem variáveis de ambiente.
- **`sessao.ts`:**
  - assina e lê;
  - assinatura adulterada → inválida;
  - mais de 2 h → expirada;
  - sem `maxAge`.
- **Server Actions:**
  - validação com zod;
  - envio usa os ids da sessão e ignora ids vindos do cliente;
  - limite de tentativas;
  - e-mail nunca no log.
- **`Questionario`:**
  - cada estado;
  - avançar e voltar mantendo a resposta;
  - restaurar do `sessionStorage`;
  - nomes acessíveis da escala;
  - foco;
  - eventos `iniciar_teste` e `concluir_teste`.
- **Integração:**
  - página com Strapi e API simulados;
  - slug inválido → 404;
  - API fora → mensagem, nunca 404.
- **Característica:**
  - a rota fica fora do sitemap e tem `noindex`;
  - nenhuma variável `EBA_` com `NEXT_PUBLIC_`.
- **Smoke:** `/eba/testes/dons-servico` responde 200 com a abertura. O smoke não envia respostas.
- **Seed:** `link_teste` aponta para o caminho interno.
- **Redirecionamentos** (`eba-adai-hub`): `/teste/:slug` → `/eba/testes/:slug` com 307 quando ligado (home e cursos com 301).

## 10. Pré-requisitos externos (cada um com aprovação do usuário)

1. **Assinatura do Hub no APIM** (`adai-hub`, produto da API da EBA). A chave vai para o cofre e para o `.env`, nunca para o chat nem para o Git.
2. **Teste de ponta a ponta em homologação**, usando um e-mail e uma turma de teste combinados com a EBA. Ele grava um aluno de teste no banco real, então precisa de autorização antes.
3. **Depois do lançamento**, fechar o acesso direto ao App Service, deixando só o APIM (memória do projeto) e girar a senha do SQL. Fica fora desta entrega, como lembrete.

## 11. Rollout e rollback

- **Homologação:** variáveis configuradas, teste de ponta a ponta com o aluno de teste e conferência no painel atual.
- **Lançamento:** junto com o Hub, ligando `REDIRECIONAR_PARA_HUB` no site atual; os QR codes passam a cair no Hub.
- **Rollback:**
  - desligar o redirecionamento devolve os QR codes ao site atual, que continua funcionando (o redirecionamento dos testes é 307, temporário, para os celulares não o guardarem em cache);
  - voltar o `link_teste` no Strapi para o site atual.

## 12. Riscos

- **A API fora derruba os testes.** Hoje também derruba. A mensagem de erro e as respostas guardadas na aba reduzem o impacto.
- **Enumeração de e-mails.** O Primeiro acesso revela se um e-mail existe. Mitigação: o limite de tentativas e nenhum dado do cadastro na tela. **Fechado** pelo código por e-mail (`2026-10-21-migracao-eba-2-codigo-por-email-design.md` §6): o "é novo?" só aparece depois do código certo.
- **Turmas inativas.** Sem turma ativa, ninguém consegue se cadastrar. A mensagem orienta a falar com a equipe da EBA.
- **Divergência de conteúdo local.** As tabelas do estilo e do temperamento ficam copiadas no Hub. Um teste confere a quantidade de itens contra a fonte atual.

## 13. Critérios de aceite

- Os 5 testes funcionam em `/eba/testes/<slug>` em 375, 768 e 1440, com todos os estados do protótipo e as fotos de cada pergunta.
- O Primeiro acesso oferece as 5 ADAIs, "Outra igreja" e "Visitante".
- Um resultado feito no Hub aparece no painel atual para a equipe, conferido em homologação.
- Nenhuma chamada à API sai do navegador. A aba Network mostra só chamadas ao Hub.
- `yarn quality`, `yarn build` (Next e Strapi) e `yarn smoke` passam.
