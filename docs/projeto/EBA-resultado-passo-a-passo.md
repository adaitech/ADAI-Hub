# EBA — resultado dos testes: checklist final do que falta você fazer

Entrega 3 da migração da EBA (PR #20). Este é o **documento mestre**: tudo que depende de uma pessoa (acesso, segredo, decisão, aparelho real) está aqui, na ordem de execução. Marque `[x]` conforme for fazendo. Spec: `docs/superpowers/specs/2026-10-22-migracao-eba-3-resultado-design.md`.

> Valores de segredo nunca vão para o Git, para o chat nem para o PR. Abaixo só aparecem **nomes** de variáveis.

## 0. Onde estamos (já feito e verificado no código)

- Página `/eba/resultado/<codigo>`, pedido do link (e-mail, código, link por e-mail), entradas "Consultar meus resultados" e leitura pela rota nova da API, tudo **desligado** sem `EBA_RESULTADO_SEGREDO`.
- Os 10 achados da autorrevisão foram corrigidos (seção 9).
- Verificado aqui: `yarn quality` (2216 testes), `yarn build` do Next e do Strapi, `yarn smoke` 48/48, telas em 375/768/1440, axe, ordem de foco, `dataLayer`, e as três rotas do `verificacao-eba` no Strapi real respondendo 403 sem token.
- **Não** verificado (depende de você): API real, APIM, MailerSend real, aluno de teste, leitor de tela, celular real. O patch da API **não foi compilado** (sem .NET no ambiente).

## 1. Antes de mergear

- [ ] Revisar e mergear o PR #15 (`feat/eba-testes` → `main`).
- [ ] Mudar a base do PR #20 de `feat/eba-testes` para `main` e conferir que o diff ficou só com a entrega 3 e as correções.
- [ ] Tirar o PR #20 de rascunho depois do passo 6 (homologação).
- [ ] Se algum commit antigo ainda aparecer com outro autor, conferir `git log --format='%an'` (os do #20 estão como Jonatan Cardoso Saraiva).

## 2. API da EBA (`adaitech/eba-ada-api`)

O Hub lê o resultado por uma rota nova só para ele (spec §4.1). Patch: `docs/superpowers/patches/2026-10-22-eba-ada-api-rota-resultado-hub.patch`.

- [ ] Clonar `eba-ada-api`, criar a branch e aplicar o patch (`git am` com o caminho do arquivo).
- [ ] Rodar `dotnet test` em `eba-adai-api.Tests` e `eba-adai-api.UnitTests`. O patch foi escrito sem compilador: corrigir o que o build apontar.
- [ ] Abrir o PR na API, revisar e publicar.
- [ ] Criar no App Service da API a configuração `HubResultados__ChaveInterna` (32+ caracteres aleatórios; `openssl rand -base64 48`), guardando o valor no cofre.
- [ ] Conferir: sem o cabeçalho `X-Hub-Key` a rota dá 404 (nunca 401); com o cabeçalho certo e sem resultado também 404.

## 3. API Management (APIM)

- [ ] Criar um _named value_ secreto com o **mesmo valor** de `HubResultados__ChaveInterna`.
- [ ] Na operação `GET /api/v1/eba/Hub/SurveyResult/Student/{IdStudent}/Question/{IdQuestion}`: liberar **só** o produto da assinatura `adai-hub`.
- [ ] Na política de entrada dessa operação: `set-header` com `name="X-Hub-Key"`, `exists-action="override"` e o valor do _named value_ (o cliente nunca consegue mandar o cabeçalho).
- [ ] Conferir: chamada sem a assinatura do Hub → recusada pelo APIM; chamada direta ao App Service sem o cabeçalho → 404.

## 4. Strapi de produção

- [ ] Token `STRAPI_TOKEN_VERIFICACAO` (Settings > API Tokens > tipo Custom): marcar **`emitir`, `conferir` e `cancelar`** do `verificacao-eba`. A permissão `cancelar` é nova: token antigo precisa ser editado.
- [ ] Conteúdo da EBA publicado (README, tabela de produção, item 11) e as páginas `eba`, `eba-cursos` e `eba-testes`.
- [ ] **No dia de ligar o recurso** (seção 8): no painel, na página `eba`, na seção "Descubra seus dons e talentos", adicionar o botão "Consultar meus resultados" com destino `/eba/resultado`. Não foi colocado no seed de propósito: com o recurso desligado ele levaria a um 404. A faixa de `/eba/testes` e o botão no fim do teste aparecem sozinhos.

## 5. MailerSend e variáveis do Hub

- [ ] MailerSend: token só do Hub, só com permissão de envio (remetente `no-reply@adai.com.br`).
- [ ] Mandar um código de teste para um e-mail da equipe e conferir SPF/DKIM e que não cai no spam. Conferir também o e-mail do link ("Ver meu resultado").

Variáveis do Hub (`next/.env` local; cofre e AKS em homologação e produção), todas só servidor, nunca `NEXT_PUBLIC_`:

| Variável | De onde vem |
| --- | --- |
| `EBA_API_URL`, `EBA_API_KEY` | URL do APIM e chave da assinatura **adai-hub**, do cofre da equipe |
| `EBA_SESSAO_SEGREDO` | você gera: `openssl rand -base64 48` |
| `EBA_RESULTADO_SEGREDO` | você gera **outro** valor, diferente do da sessão. Vazio = recurso desligado |
| `MAILERSEND_API_TOKEN` | token do MailerSend do Hub |
| `STRAPI_TOKEN_VERIFICACAO` | token do passo 4 |
| `EBA_PROXIES_CONFIAVEIS` | 1 com só o ingress; 2 com Front Door + ingress. Em produção, sem ela o log avisa `[eba-limite] EBA_PROXIES_CONFIAVEIS ausente` |

- [ ] Conferir o valor de `EBA_PROXIES_CONFIAVEIS` em homologação: o último item do `x-forwarded-for` no log do ingress deve ser o IP real do visitante.
- [ ] Trocar `EBA_RESULTADO_SEGREDO` invalida **todos** os links já enviados (é a revogação geral).

## 6. Teste de ponta a ponta em homologação

Precisa de autorização da EBA: grava um **aluno de teste** no banco real.

- [ ] Combinar com a EBA um e-mail de teste (caixa que você abre) e uma turma de teste.
- [ ] Em `/eba/testes/dons-servico`: identificar-se (código por e-mail), cadastrar-se e responder.
- [ ] Na tela do resultado, clicar em **Receber o link por e-mail** (ou abrir `/eba/resultado`): e-mail, código, "Confira seu e-mail".
- [ ] No e-mail, só o botão "Ver meu resultado", sem nome nem resultados. Abrir o botão.
- [ ] Na página: `h1` "Seu resultado nos testes do CDV", só os testes feitos, nenhum nome, e-mail ou turma; aba Network sem nenhuma chamada à API da EBA.
- [ ] Refazer um teste e abrir o link de novo: confirmar qual resultado vale (o Hub usa as linhas com `result: true`; spec §7, pergunta 4).
- [ ] Pedir o link com um e-mail que **não** é de aluno: a tela responde igual e nenhum e-mail chega.
- [ ] Com a API fria (primeira chamada do dia), confirmar o código: se a API da EBA demorar ou falhar, a tela deve mostrar "Código confirmado, mas não conseguimos continuar agora" e oferecer "Tentar de novo" sem pedir outro código.
- [ ] Pedir 4 códigos seguidos para o mesmo e-mail: o 4º mostra "Já enviamos códigos demais…".
- [ ] Conferir no painel atual da EBA que o resultado do teste aparece.
- [ ] Confirmar com a EBA os dois valores novos de unidade, `outra-igreja` e `visitante` (spec da entrega 2, §4), e se o painel atual os mostra.

## 7. Verificações humanas

- [ ] Leitor de tela (NVDA, VoiceOver ou TalkBack) nos passos: faixa, e-mail, código, "Confira seu e-mail", e a página do resultado.
- [ ] Celular real em 375: toque no campo do código (teclado numérico), colar o código, rolagem, alvos de 44 px.
- [ ] Rodar `yarn smoke` em homologação e conferir `/eba/resultado/codigo-invalido` dando 404.
- [ ] Conferir no `window.dataLayer` os cliques na faixa e nos botões (`clique_cta` com `origem` e sem dado pessoal). Já conferi a faixa localmente.
- [ ] Opcional: Lighthouse mobile em `/eba/testes` e `/eba/resultado`.

## 8. Ligar em produção e voltar atrás

- [ ] Ligar: configurar `EBA_RESULTADO_SEGREDO` (e as demais variáveis do passo 5) e reiniciar o Next. A faixa e o botão do fim do teste aparecem sozinhos; depois, adicionar o botão do passo 4 no Strapi.
- [ ] Voltar: remover `EBA_RESULTADO_SEGREDO` (as rotas voltam a 404 e as entradas somem na hora) e tirar o botão do Strapi.

## 9. Achados da revisão (22/10/2026): todos tratados no código

| # | Achado | O que foi feito |
| --- | --- | --- |
| 1 | `zod` fora do `package.json` | Declarado em `dependencies` (`^4.6.5`) |
| 2 | Código gasto antes das chamadas à API | Marca de e-mail verificado antes; "Tentar de novo" sem novo código (testes e resultado) |
| 3 | Quem sabe um e-mail pode gastar os envios dele | Parcial: aviso honesto e cota devolvida; **risco residual aceito** (`docs/componentes/questionario-eba.md`) |
| 4 | Falha do MailerSend gastava a cota e o limite fingia envio | Rota `cancelar` no Strapi; o limite responde `emails` |
| 5 | Limite por IP depende de `EBA_PROXIES_CONFIAVEIS` | Valor inválido vira 1; aviso em produção. Conferir em homologação (passo 5) |
| 6 | `enviar` sem limite por IP | 6 por minuto por IP |
| 7 | Aparelho de 30 dias e `sair` incompleto | Aparelho em 7 dias; `sair` apaga as duas marcas |
| 8 | Envio único: validade do começo; resposta ilegível não guardada | Conta do fim; "sem resultado" fica guardado |
| 9 | Validade do código escrita em dois lugares | O e-mail usa `VALIDADE_CODIGO_MS` |
| 10 | Tentativas relidas depois do incremento | `UPDATE … RETURNING` |

## 10. Decisões em aberto (spec §7)

- [ ] Validade do link: **7 dias** implementado como proposta (`app/(site)/eba/resultado/validade.ts`). Confirmar ou trocar.
- [ ] Caminho por e-mail com código: implementado como proposta. Confirmar.
- [ ] Manter o `/teste/resultado/<id>` do site atual (tela da equipe) até a entrega 4: proposta é manter e não redirecionar.
- [ ] Revogação de um link só: hoje só dá para invalidar todos (trocar o segredo). Aceitar ou pedir lista de revogação.
- [ ] Aparelho lembrado em **7 dias** (era 30): confirmar o prazo.
- [ ] Risco residual do item 3 da seção 9: aceitar ou pedir limite por IP também no Strapi.

## 11. Depois do lançamento (fora da entrega 3)

- [ ] Pedir à API que feche o `GET Student/{id}` anônimo (hoje devolve nome e e-mail para quem tiver o Guid). O site atual e o painel dependem dele; planejar a troca.
- [ ] Fechar o acesso direto ao App Service da API, deixando só o APIM, e girar a senha do SQL (spec da entrega 2, §10).
- [ ] Entrega 4: painel e login da equipe no Hub (a equipe vê nome, e-mail e turma junto do resultado, nunca nesta URL).
- [ ] Depois do merge do #15 e do #20, atualizar `docs/projeto/CONTROLE.md` com os números dos PRs e o status.
