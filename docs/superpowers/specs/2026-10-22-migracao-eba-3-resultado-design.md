# Migração da EBA — entrega 3: página de resultado — design

> Entregas anteriores: `2026-10-18-migracao-eba-1-editorial-design.md`, `2026-10-20-migracao-eba-2-testes-design.md` e `2026-10-21-migracao-eba-2-codigo-por-email-design.md` · Componente reaproveitado: `docs/componentes/questionario-eba.md` (`Resultado`)

## 1. Objetivo

Substituir a página `/teste/resultado/<id>` do site atual da EBA por uma página do Hub que mostra os resultados dos 5 testes do CDV de um aluno **sem expor nome, e-mail, unidade, turma ou qualquer dado pessoal na URL ou na tela**.

Esta entrega é **parcial de propósito**: o levantamento (seção 2) achou dois bloqueios que dependem de decisão de produto e de segurança (seção 7). Entra só o que é inequívoco: a rota, o link opaco, a busca e a tela, **desligados por padrão** (sem a variável do segredo, tudo responde 404).

## 2. Como funciona hoje (levantado em `adaitech/eba-adai` e `adaitech/eba-ada-api`)

**Site atual, `src/app/teste/resultado/[idStudent]/page.tsx`**
- O `[idStudent]` é o `Guid` do aluno (o `id` devolvido por `POST Student` e `GET Student/email/{email}`). O Guid é a única "proteção" da URL.
- A página é cliente (`'use client'`) e **não está protegida pelo middleware** (`src/middleware.ts` só cobre `/dashboard/...`).
- Ela chama `GET /api/v1/eba/Student/{id}` e mostra **nome** (cabeçalho e `h1`), **e-mail** e **turma** (`GetClassByID`) de quem tem o Guid.
- Os resultados vêm de `GET /api/v1/eba/SurveyResult/Student/{idStudent}/Question/{idQuestion}` (um por teste), pelo `authFetch`: ele manda o **bearer do Identity da equipe** (cookie `token`). Sem login, a API responde 401 e a tela redireciona para `/login`.
- Nada no site nem na API aponta para essa rota. O e-mail "Resultado Curso DNA da ADAI" (`POST SurveyResult/Student/Email/{Email}/Class/{IdClass}`) leva para `/dashboard/consultas/details/<id>`, que é o painel da equipe, protegido pelo middleware.
- Conclusão: `/teste/resultado/<id>` é uma tela **da equipe**, órfã, que na prática só funciona com a sessão da equipe. Não existe hoje um link de resultado para o aluno.

**API, `adaitech/eba-ada-api`**
- `Program.cs`: `app.MapControllers().RequireAuthorization()`. Só tem `[AllowAnonymous]` o fluxo público dos testes: `POST Student`, `GET Student/email/{email}`, **`GET Student/{id}`**, `GET Question/...`, `GET ClassEBA...` e `POST SurveyResponse`.
- `GET SurveyResult/Student/{idStudent}` e `.../Question/{idQuestion}` **não** são anônimos: exigem o bearer do Identity.
- `GET Student/{id}` é anônimo e devolve `id, name, email, room, idClass, dateCreated, dateUpdated`: **qualquer pessoa com o Guid lê nome e e-mail do aluno**.
- Formato do resultado salvo: lista de `{ idStudent, idClass, idQuestion, totalRate, name, message, result, dateCreated, dateUpdated }`. Sem resultado, `404` com o erro `SurveyResponseNotFound`.
- O APIM expõe esses endpoints, mas a chave de assinatura do Hub **não** substitui o bearer do Identity (a menos que uma política do APIM faça isso; ver pergunta 1).

## 3. Decisões

| Tema | Decisão |
| --- | --- |
| Rota | `/eba/resultado/[codigo]`. O `codigo` **não é o Guid**: é um token opaco (seção 4). O `/teste/resultado/<id>` do site atual **não** é redirecionado para o Hub: o Guid cru não vale aqui. |
| Conteúdo | Só os resultados. **Sem nome, e-mail, unidade, turma ou datas pessoais.** O `h1` é "Seu resultado nos testes do CDV". |
| Dados | Servidor do Hub chama o APIM (`lib/eba-api`). O navegador nunca chama a API nem recebe o Guid. |
| Tela | Reaproveita o conteúdo do componente `Resultado` do Questionário (`ConteudoResultado`), uma seção por teste feito. |
| Desligada por padrão | Sem `EBA_RESULTADO_SEGREDO` (32+ caracteres) a rota responde 404 para qualquer código. |

## 4. Privacidade e segurança (o que esta entrega garante)

1. **Id opaco e não adivinhável.** O token é `v1.` + base64url de `iv | tag | texto cifrado`, com **AES-256-GCM** e chave derivada de `EBA_RESULTADO_SEGREDO`. O conteúdo cifrado é `{ p: 'resultado', idStudent, exp }`. Quem vê a URL não lê o Guid (diferente de um JSON só assinado, que qualquer um decodifica) e não consegue forjar nem alterar o token (a tag GCM autentica).
2. **Validade.** O token traz `exp`. Quem **emite** informa a validade (a função não tem padrão: ver pergunta 2); na leitura, vale no máximo 30 dias e rejeita emissão no futuro além de 60 s de tolerância.
3. **Falha fechada, sem oráculo.** Sem segredo, token malformado, adulterado, expirado, de outro segredo, com limite estourado ou aluno sem nenhum resultado: **a mesma resposta 404**. A tela de "indisponível" só aparece para um token **válido** quando a API está fora (nada de dado pessoal nela).
4. **Limite de tentativas.** Reaproveita `criarLimitador` e `ipDoCliente` (`lib/eba/limite.ts`): 20 aberturas por minuto por IP (`EBA_PROXIES_CONFIAVEIS`), contadas **antes** de decifrar. Estourou → 404 igual. É por instância do servidor, como nas ações dos testes.
5. **Não indexar nem vazar.** `noindex, nofollow`; fora do sitemap (a rota não existe no Strapi); `<meta name="referrer" content="no-referrer">` para a URL não ir no cabeçalho `Referer` ao sair da página; resposta dinâmica, sem cache compartilhado.
6. **Validação do Guid.** O Guid decifrado é validado como UUID antes de entrar no caminho da API (`encodeURIComponent` mesmo assim).
7. **Logs.** Só a classe do erro. Nunca o token, o Guid, o IP ou o corpo da API.
8. **Sem cookie de sessão.** O token substitui a sessão: a página não lê nem grava o cookie `eba_sessao`. O token de resultado **não** serve como sessão e a sessão **não** serve como token de resultado (propósito `p` e formato diferentes; a chave também).
9. **Dados já expostos por outro lado.** `GET Student/{id}` anônimo (seção 2) não é desta entrega; vira a pergunta 5.

Risco aceito e documentado: o token é **stateless**; não dá para revogar um link só. Revogação geral = trocar `EBA_RESULTADO_SEGREDO` (invalida todos). Pergunta 7.

## 5. Arquitetura

| Arquivo | Papel |
| --- | --- |
| `next/src/lib/eba/link-resultado.ts` | `segredoDoResultado()`, `emitirLinkResultado(idStudent, { segredo, validadeMs, agora })`, `lerLinkResultado(codigo, segredo, agora)`. Nunca lança na leitura. |
| `next/src/lib/eba-api/resultados.ts` | `resultadosDoAluno(idStudent)`: os 5 `GET SurveyResult/Student/{id}/Question/{idQuestion}` em paralelo; devolve `{ teste, resultado }[]` só dos testes feitos. 404 → teste não feito. Outro erro (401/403/5xx/timeout) → lança. |
| `next/src/lib/eba-api/respostas.ts` | A normalização da lista de itens (nota, talentos, temperamento) vira função compartilhada com o `POST SurveyResponse`. |
| `next/src/components/eba/Questionario/Resultado.tsx` | Exporta `ConteudoResultado` (o miolo, sem botões de próximo teste nem "Sair"). O estilo salvo não traz as somas dos eixos: `motivacao`/`organizacao` ficam `null` e a tela só omite essa lista. |
| `next/src/app/(site)/eba/resultado/[codigo]/page.tsx` | Server Component dinâmico: limite → decifra → busca → monta. `generateMetadata` com `noindex`. |
| `next/.env.example`, `README.md` | `EBA_RESULTADO_SEGREDO`. |

Resultado salvo e o `result`: a API marca o resultado vigente em `result`. A busca fica com as linhas `result === true` quando houver; senão, com todas. **Confirmar em homologação** (pergunta 4).

## 6. Medição, SEO e acessibilidade

- **Medição:** coberto por `clique_cta` (links "Ver todos os testes" e "Fazer outro teste") e `ver_secao`. Sem evento novo, e sem o token ou o Guid em parâmetro algum (o `destino` dos cliques é o caminho interno dos testes, nunca o da própria página).
- **SEO:** `noindex, nofollow`, um `h1`, `h2` por teste, fora do sitemap.
- **Acessibilidade:** reaproveita as listas ordenadas e `visually-hidden` do `Resultado`; `data-section="resultado-eba"`.

## 7. Perguntas em aberto (decisão do Jonatan / equipe da EBA e da API)

| # | Pergunta | Por que bloqueia | Recomendação |
| --- | --- | --- | --- |
| 1 | **Como o Hub é autorizado a ler `SurveyResult`?** Hoje a API pede o bearer do Identity da equipe. | Sem isso a página, com token válido, mostra "indisponível". | (a) Rota nova na API, só de leitura, sem dado pessoal e restrita à assinatura do Hub; ou (c) política do APIM que valide a assinatura e troque por credencial interna. Evitar (b) guardar usuário e senha da equipe no Hub. |
| 2 | **Quem recebe o link e como ele nasce?** O aluno na tela de resultado ("Guardar este resultado")? Um e-mail depois do teste? A equipe, copiando do painel (entrega 4)? Qual a **validade** (a lib exige o valor)? | Sem emissor, ninguém tem um link. O código não tem botão de "copiar link" até a decisão. | Aluno vê o link só depois de concluir; validade curta (7 a 30 dias). |
| 3 | A equipe precisa ver nome, e-mail e turma junto do resultado? | Esses dados não entram nesta URL. | Ficam no painel autenticado (entrega 4). |
| 4 | Aluno que refaz o teste: qual resultado vale? A API tem o `result` (vigente). | Normalização escolhe `result === true`. | Conferir em homologação com um aluno de teste que refez um teste. |
| 5 | A API pode fechar `GET Student/{id}` (hoje anônimo, devolve nome e e-mail pelo Guid)? | Vazamento por quem souber um Guid. O site atual e o painel dependem dele. | Pedir à API: exigir autorização e deixar o Hub fora (ele usa `Student/email` só no servidor). |
| 6 | O `/teste/resultado/<id>` do site atual será mantido até a entrega 4? | Ele é a tela da equipe hoje. | Manter como está; não redirecionar. |
| 7 | Revogar um link sozinho é necessário? | O token é stateless. | Aceitar a troca do segredo como revogação geral. |

## 8. Testes (TDD)

- **`link-resultado`:** ida e volta; o token não contém o Guid nem é decodificável; adulterado, truncado, outro segredo, segredo curto, expirado, validade acima do teto, emissão no futuro, propósito errado e cookie de sessão usado como token → `null`.
- **`resultados`:** URL com o id codificado e a chave no header; 5 chamadas; 404 → teste omitido; 401/500/timeout → lança; Guid inválido → lança sem chamar a rede; `result` vigente; estilo sem somas; temperamento com o nome vindo de `message`.
- **Página (integração):** token válido → `h1` único, um `h2` por teste feito, **nenhum** nome/e-mail/Guid no HTML; token inválido, sem segredo, limite estourado e aluno sem resultado → 404 idêntico; API fora → "indisponível" sem dado pessoal; `noindex` e `referrer`.
- **Característica:** `seguranca-e-privacidade` já impede `NEXT_PUBLIC_EBA_`; `.env.example` sem valor; a rota nova tem teste (`testes-obrigatorios`).
- **Smoke:** `/eba/resultado/codigo-invalido` responde 404 e `noindex`.

## 9. Rollout e rollback

- Merge com a variável **ausente**: nada muda para ninguém (404).
- Ligar só depois das perguntas 1 e 2 respondidas e de um teste em homologação com um aluno de teste.
- Rollback: remover `EBA_RESULTADO_SEGREDO` (a rota volta a 404 na hora).

## 10. Fora do escopo

- Botão ou e-mail que gera o link (pergunta 2).
- Painel e login da equipe (entrega 4).
- Mudanças na API (perguntas 1 e 5).
- "Baixar resultado" (PDF) do site atual.
