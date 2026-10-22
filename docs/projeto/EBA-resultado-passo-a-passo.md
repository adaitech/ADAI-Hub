# EBA — resultado dos testes: passo a passo para ligar e testar

Entrega 3 da migração da EBA (PR #20). Tudo nasce **desligado**. Este roteiro leva do código no GitHub até o resultado funcionando em homologação, na ordem. Spec: `docs/superpowers/specs/2026-10-22-migracao-eba-3-resultado-design.md`.

> Valores de segredo nunca vão para o Git, para o chat nem para o PR. Abaixo só aparecem **nomes** de variáveis.

## 0. Ordem dos merges

1. PR #15 (`feat/eba-testes` → `main`): testes do CDV e código por e-mail. Ver o item "Achados da revisão" no fim.
2. PR #20 (`feat/eba-resultado`): depois que o #15 entrar, mudar a base do #20 para `main` (hoje a base é `feat/eba-testes`).

## 1. Rodar no seu computador

```bash
git fetch origin && git checkout feat/eba-resultado
yarn setup                    # instala tudo e copia os .env de exemplo
cd strapi && yarn data:import # conteúdo da EBA (Strapi parado)
cd .. && yarn dev             # Strapi (1337) e Next (3000)
cd next && yarn smoke         # em outro terminal: esperado 48/48
```

O que conferir no navegador (375, 768 e 1440):

| Endereço | Esperado |
| --- | --- |
| `/eba/resultado/qualquer-coisa` | 404 |
| `/eba/resultado` | Sem `EBA_RESULTADO_SEGREDO`: 404. Com ele: "Receber meu resultado" |
| `/eba/testes` | Com o segredo: faixa "Já fez os testes? Consultar meus resultados" depois da trilha. Sem o segredo: sem faixa |

## 2. Variáveis do Hub (`next/.env`, só servidor, nunca `NEXT_PUBLIC_`)

| Variável | De onde vem |
| --- | --- |
| `EBA_API_URL`, `EBA_API_KEY` | URL do API Management e chave da assinatura **adai-hub**, do cofre da equipe |
| `EBA_SESSAO_SEGREDO` | você gera: `openssl rand -base64 48` |
| `EBA_RESULTADO_SEGREDO` | você gera outro valor, diferente do da sessão: `openssl rand -base64 48` |
| `MAILERSEND_API_TOKEN` | token do MailerSend só do Hub, só com permissão de envio |
| `STRAPI_TOKEN_VERIFICACAO` | Strapi: Settings > API Tokens > tipo Custom, só `emitir`, `conferir` e `cancelar` do `verificacao-eba` (o `cancelar` é novo: token antigo precisa ganhar essa permissão) |
| `EBA_PROXIES_CONFIAVEIS` | opcional. 1 (padrão) com só o ingress; 2 com Front Door + ingress |

Em homologação e produção, os mesmos nomes vão no cofre da infraestrutura (Key Vault) e na configuração do AKS. Trocar `EBA_RESULTADO_SEGREDO` invalida todos os links já enviados (é a revogação geral).

## 3. API da EBA (`adaitech/eba-ada-api`)

O Hub lê o resultado por uma rota nova, só para ele (spec §4.1). O patch está em `docs/superpowers/patches/2026-10-22-eba-ada-api-rota-resultado-hub.patch` e **não foi compilado nem publicado**.

1. Clonar `eba-ada-api`, criar uma branch e aplicar: `git am docs/superpowers/patches/2026-10-22-eba-ada-api-rota-resultado-hub.patch` (a partir do Hub, ajustando o caminho).
2. Rodar `dotnet test` nos projetos `eba-adai-api.Tests` e `eba-adai-api.UnitTests`. Corrigir o que o compilador apontar antes de seguir.
3. Abrir PR na API, revisar e publicar.
4. No App Service da API, criar a configuração `HubResultados__ChaveInterna` com 32+ caracteres aleatórios (cofre; nunca no Git).
5. No APIM:
   - criar um _named value_ secreto com o mesmo valor da chave interna;
   - na operação `GET Hub/SurveyResult/Student/{IdStudent}/Question/{IdQuestion}`, liberar **só** o produto da assinatura `adai-hub`;
   - na política de entrada da operação: `set-header` com `name="X-Hub-Key"`, `exists-action="override"` e o valor do _named value_.
6. Conferir: chamada sem a assinatura do Hub → recusada pelo APIM; chamada direta ao App Service sem o cabeçalho → 404.

## 4. Teste de ponta a ponta em homologação

Precisa de autorização da EBA: grava um **aluno de teste** no banco real.

1. Combinar com a EBA um e-mail de teste (caixa que você abre) e uma turma de teste.
2. Em `/eba/testes/dons-servico`, identificar-se com esse e-mail (código por e-mail), cadastrar-se e responder.
3. Na tela do resultado, clicar em **Receber o link por e-mail** (ou abrir `/eba/resultado`): e-mail → código → "Confira seu e-mail".
4. Abrir o e-mail: deve ter só o botão "Ver meu resultado", sem nome nem resultados. Abrir o botão.
5. Conferir na página: `h1` "Seu resultado nos testes do CDV", só os testes feitos, nenhum nome, e-mail ou turma, e a aba Network sem nenhuma chamada à API da EBA.
6. Refazer um teste e abrir o link de novo: confirma qual resultado vale (campo `result`; spec §7, pergunta 4).
7. Pedir o link com um e-mail que **não** é de aluno: a tela responde igual e nenhum e-mail chega.
8. Conferir no painel atual da EBA que o resultado do teste aparece.

## 5. Ligar em produção e voltar atrás

- Ligar: configurar `EBA_RESULTADO_SEGREDO` e reiniciar o Next. A faixa e os botões aparecem sozinhos.
- Voltar: remover `EBA_RESULTADO_SEGREDO`. As rotas voltam a 404 e as entradas somem na hora.

## 6. O que ainda não está pronto

- Botão "Consultar meus resultados" no CTA de `/eba`: é conteúdo do Strapi (seed e snapshot). A faixa de `/eba/testes` e o botão no fim do teste já existem.
- Validação humana: leitor de tela e celular real.
- Decisões em aberto (spec §7): validade de 7 dias; fechar o `GET Student/{id}` anônimo da API; manter o `/teste/resultado/<id>` do site atual até a entrega 4.

## 7. Achados da revisão (rodada de 22/10/2026): todos tratados

Quase todos eram do código do PR #15, que o #20 reaproveita. Foram corrigidos na branch do #20 (commits `fix(eba): ...`), cada um com teste.

| # | Achado | O que foi feito |
| --- | --- | --- |
| 1 | `zod` fora do `package.json` | Declarado em `dependencies` (`^4.6.5`) |
| 2 | Código gasto antes das chamadas à API | Marca de e-mail verificado gravada antes; a tela oferece "Tentar de novo" sem novo código (testes e resultado) |
| 3 | Quem sabe um e-mail pode gastar os envios dele | Parcial: aviso honesto no limite e cota devolvida quando o e-mail não sai; **risco residual aceito** (ver `docs/componentes/questionario-eba.md`) |
| 4 | Falha do MailerSend gastava a cota e o limite fingia envio | Nova rota `cancelar` no Strapi devolve a cota; o limite responde `emails` com mensagem própria |
| 5 | Limite por IP depende de `EBA_PROXIES_CONFIAVEIS` | Valor inválido vira 1; em produção o log avisa uma vez se a variável faltar ou faltar o `x-forwarded-for`. **Conferir o valor em homologação** |
| 6 | `enviar` sem limite por IP | 6 por minuto por IP |
| 7 | Aparelho de 30 dias e `sair` incompleto | Aparelho em 7 dias; `sair` apaga as duas marcas |
| 8 | Validade do envio único contada do começo; resposta ilegível não guardada | Conta do fim da gravação; "sem resultado" fica guardado |
| 9 | Validade do código escrita em dois lugares | O e-mail usa `VALIDADE_CODIGO_MS` |
| 10 | Tentativas relidas depois do incremento | `UPDATE … RETURNING` (testado no knex/SQLite do Strapi) |

Ações suas por causa disso: dar a permissão `cancelar` ao token `STRAPI_TOKEN_VERIFICACAO` e conferir `EBA_PROXIES_CONFIAVEIS` (1 com só o ingress; 2 com Front Door + ingress).
