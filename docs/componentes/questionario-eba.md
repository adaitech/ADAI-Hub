# Questionário dos testes da EBA — `Questionario`

Ilha cliente (`'use client'`) da página `/eba/testes/<slug>`: a tela em que o aluno responde um dos 5 testes do CDV. Código em `next/src/components/eba/Questionario/`; vitrine em `/componentes/questionario-eba`. Spec: `docs/superpowers/specs/2026-10-20-migracao-eba-2-testes-design.md` §5.4, §5.5, §7 e §8. Protótipo: `docs/prototipo/eba/teste-dons-servico.html`.

## De onde vem cada parte

| Parte | Origem |
| --- | --- |
| Nome | tipo "Testes da EBA" do Strapi; sem o teste lá, `TESTES` (a página monta a prop `teste`) |
| "Teste N de 5", "Próximo teste" | `TESTES` em `lib/eba-api/testes.ts` (ordem da apostila) |
| Resumo, Perguntas/Resposta, "Como responder", aula | tipo "Testes da EBA" do Strapi (prop `abertura`, montada pela página) |
| Perguntas de nota e talentos | API da EBA (`GET Question/{id}`), buscadas pelo servidor (prop `perguntas`, timeout de 10 s). API fora ou fria ao abrir → `perguntasIndisponiveis`: a abertura aparece e "Começar" busca de novo pela ação `carregarPerguntas` (ver "API fria" abaixo) |
| Pares do estilo e opções do temperamento | dados locais em `lib/eba-api/conteudo-local.ts` |
| Identificação, cadastro, envio, sair, carregar perguntas, aquecer | Server Actions de `app/(site)/eba/testes/[slug]/acoes.ts`, recebidas pela prop `acoes` (testes e vitrine passam versões de mentira) |
| Fotos (decorativas, `alt=""`) | `fotoDoTeste` em `lib/eba/fotos-testes.ts` |

Não está no Strapi: o fluxo, as escalas e a agregação das respostas são regras do teste, não conteúdo editorial.

## Página `/eba/testes/<slug>`

`app/(site)/eba/testes/[slug]/page.tsx` (Server Component, dinâmica pelo cookie de sessão): só os 5 slugs de `TESTES` (outro → 404, sem chamar Strapi nem API); trilha ADAI › EBA › Testes › <nome> com BreadcrumbList; metadata `<nome> — Testes da EBA | ADAI`, descrição = resumo, `noindex, nofollow`, fora do sitemap. Sem o teste no Strapi, resumo padrão "Responda com sinceridade, pensando em como você é hoje.". Sem `EBA_API_URL`/`EBA_API_KEY` ou sem `EBA_SESSAO_SEGREDO` válido: "Testes indisponíveis no momento" com link para `/eba/testes`, sem o questionário. Como a pasta `testes/` tem precedência sobre `/eba/[slug]`, `/eba/testes` tem `page.tsx` própria que monta a página "eba-testes" do Strapi (helper `app/(site)/eba/pagina-eba.tsx`).

## Estados

`abertura → email → codigo → cadastro | pergunta → enviando → resultado`, mais `erro` (envio falhou; "Tentar de novo") e `expirou` (sessão encerrada; pede o e-mail e reenvia sozinho depois, se for a mesma pessoa). Com sessão válida, "Começar o teste" pula a identificação. O reducer puro fica em `estado.ts`.

- **Código por e-mail (spec `2026-10-21-migracao-eba-2-codigo-por-email-design.md`):** depois do e-mail, o servidor manda um código de 6 dígitos pelo MailerSend (vale 10 min, 5 tentativas; 3 envios por e-mail a cada 15 min) e a tela abre o passo "Digite o código" ("Enviamos um código de 6 dígitos para a***@…"). A resposta é a mesma para e-mail de aluno ou não. O campo usa `inputmode="numeric"` e `autocomplete="one-time-code"` e fica só com os dígitos (aceita "123 456" colado); "Confirmar" faz uma conferência por vez; erro em `role="alert"` ("Código incorreto. Você tem mais N tentativas." / "Este código não vale mais. Enviamos um novo?" com "Enviar novo código"); "Reenviar código" depois de 60 s; "Usar outro e-mail". O Strapi guarda só hashes (tipo privado `verificacao-eba`).
- **Aparelho lembrado:** código certo ou cadastro concluído gravam `eba_aparelho` (hash do e-mail, 7 dias); com ele, o mesmo e-mail segue sem código. Código certo de e-mail sem cadastro grava `eba_email_verificado` (15 min), exigido pelo `cadastrar` e pelo "Tentar de novo" do Primeiro acesso (sem ele, a tela volta ao e-mail). "Não é você?" e "Sair" esquecem o aparelho.
- **Respondendo como:** "Respondendo como a***@… · Não é você? Trocar e-mail" aparece na abertura (com sessão válida), nas perguntas e no erro de envio. "Trocar e-mail" encerra a sessão (`sair`), **apaga o progresso** (estado e `sessionStorage`) e volta para a identificação; depois, o teste recomeça da primeira pergunta.
- **Identificação indisponível:** API fora ou turmas que não carregam (no e-mail ou no Primeiro acesso) mostram "Tentar de novo", que refaz a identificação; no Primeiro acesso o formulário preenchido é mantido e a lista de turmas é atualizada. Nome e turma inválidos têm mensagem própria ligada por `aria-describedby`, como a unidade; nome com caractere de controle é recusado.
- **Sessão de outra aba:** o envio leva o `respondidoComo` (dono das respostas). Se o cookie for de outra pessoa (o e-mail foi trocado ou a sessão venceu e outra pessoa entrou em outra aba), o servidor devolve `sessao` sem chamar a API; a tela mostra "Sua sessão foi encerrada" e, se quem se identifica é outra pessoa, o teste recomeça da primeira pergunta, sem reenviar. Limite: dois e-mails com a mesma máscara (`a***@x.com`) não se distinguem.
- **Envio sem duplicar:** o servidor grava uma vez só as mesmas respostas do mesmo aluno no mesmo teste: chamadas iguais em andamento (duas abas) compartilham a chamada à API, e um reenvio até 10 min depois do sucesso recebe o mesmo resultado sem gravar de novo (`lib/eba/envio-unico.ts`; chave = hash de aluno, turma, teste e respostas). Falhas não ficam guardadas. É por instância do servidor; a idempotência na própria API (`SurveyResponse`) é conferida em homologação.
- **Limite de tentativas por IP:** o IP vem do `x-forwarded-for` lido da direita para a esquerda, pulando os proxies confiáveis (`EBA_PROXIES_CONFIAVEIS`, padrão 1). O que vem antes deles pode ser forjado pelo cliente e não muda a chave do limite.
- **Sem resultado:** se a API grava as respostas (2xx) mas devolve um corpo ilegível (vazio, HTML, timeout na leitura), um resultado fora do formato ou uma lista vazia, a tela mostra "Respostas enviadas" e "Suas respostas foram enviadas para a equipe da EBA. Não conseguimos mostrar o resultado agora.", sem "Tentar de novo" (reenviar duplicaria a gravação); o progresso é apagado e `concluir_teste` dispara.

- **API fria (2026-10-21):** o banco da API pausa quando fica ocioso e a primeira chamada leva de 10 a 45 s.
  - **Aquecimento:** ao montar na abertura, a tela chama `acoes.aquecer()` uma vez, sem esperar a resposta (GET leve no servidor com timeout de 8 s, só para acordar o banco). Na vitrine (`estadoInicial`) não chama; `aquecer` é opcional na prop `acoes`.
  - **Preparando o teste:** com `perguntasIndisponiveis` (só nota e talentos; estilo e temperamento não buscam perguntas), a abertura já monta uma região `role="status"` vazia; "Começar" coloca nela "Preparando o teste…" (botão com `aria-disabled`, para o foco não sair dele; uma chamada por vez) e chama `acoes.carregarPerguntas(slug)`. Sucesso: usa as perguntas recebidas, restaura o progresso salvo (que fica intacto até lá; o de outra pessoa é descartado) e segue para a identificação ou as perguntas. Falha (ou lista vazia em nota/talentos): "Não conseguimos carregar as perguntas agora. Tente em alguns minutos." e o botão vira "Tentar de novo".
  - **Aviso de espera:** se identificar, cadastrar (e o "Tentar de novo" dele), carregar perguntas ou enviar passar de 5 s, aparece "A primeira conexão do dia pode levar até um minuto. Aguarde, por favor.": dentro da região de status que já existe ("Preparando o teste…", "Calculando seu resultado…") ou numa região `role="status"` própria na identificação e no cadastro (`AvisoDeEspera.tsx`). Some quando a ação termina.

- **Nota (0–5):** radios nativos. Escolher com mouse ou toque avança; pelo teclado (setas, espaço) só marca, e "Próxima pergunta" segue (WCAG 2.1.1 e 3.2.2). Voltar mostra a resposta escolhida. Nome acessível "N — Rótulo".
- **Talentos:** etapa 1 marca as habilidades (sem limite); etapa 2 escolhe até 3 entre as marcadas ("Concluir" exige uma). Envia 1 para as escolhidas e 0 para as demais.
- **Estilo (1–5):** 14 pares (motivação 1–7, organização 8–14); nome acessível "1 — mais perto de: <frase da esquerda>". Envia a soma de cada eixo (`numero` 1 e 2).
- **Temperamento:** 20 páginas de 10 opções, com "Próximo". Envia quantas foram marcadas em cada grupo (`numero` 1 a 4).
- **Resultado:** barras proporcionais a `maximo`, 3 primeiros em destaque e a mensagem do primeiro; temperamento em porcentagem (máximo 0 → 0%); talentos como lista; estilo com a combinação, os dois totais e a descrição. "Próximo teste" some no último. "Sair" encerra a sessão no servidor.
- **Foco:** vai para o enunciado (`legend`) a cada pergunta e para o título de cada estado.
- **Progresso:** `sessionStorage`, chave `eba-teste:<slug>`: as respostas e `respondidoComo`, o **dono opaco** da sessão em que foram dadas (HMAC do aluno com o segredo da sessão, 22 caracteres; nunca o e-mail nem o nome). O e-mail mascarado serve só para mostrar "Respondendo como a***@…": ele se repete entre pessoas (`ana@` e `alice@` viram `a***@`) e por isso não identifica ninguém; apagado ao mostrar o resultado. Ao restaurar, descarta o que não cabe no teste (pergunta inexistente, nota fora da escala, id inválido, mais de 3 escolhidas) e o progresso sem `respondidoComo`. Se a sessão atual (na abertura ou depois de uma identificação) tem outro dono, mesmo com a mesma máscara de e-mail, o progresso é descartado e o teste recomeça: as respostas de uma pessoa nunca são enviadas como de outra.
- **Fotos:** capa na abertura, identificação no e-mail/cadastro/sessão encerrada, uma por pergunta (página no temperamento, par no estilo; sem foto própria → capa) e resultado no envio. A da próxima pergunta é pré-carregada (`preload` do React).

## Layout

Caixa cinza + foto na mesma grade, raio `--radius-lg`, gap `--space-12`. Abaixo de 1024 px a foto é uma faixa 16:9 acima da caixa; a partir de 1024 px fica à direita com a mesma altura da caixa. 🟡 Sem token no design system: largura máxima da caixa (44rem) e altura mínima da foto (32rem), do protótipo; borda de campo e destaque de erro usam o cinza de texto e o preto (falta um token de alerta).

## Medição (DataLayer)

Três eventos novos, sem dado pessoal: **`confirmar_codigo`** (`teste`, `resultado` = `ok`, `errado`, `esgotado` ou `vencido`) a cada conferência do código; **`iniciar_teste`** (`teste` = slug), uma vez, quando a primeira pergunta aparece, e **`concluir_teste`** (`teste` = slug) quando o resultado aparece (evento-chave). Os botões e links continuam cobertos por `clique_cta`; a tela tem `data-section="teste-eba"`. No modo vitrine (`estadoInicial`) nenhum evento é enviado. Ver `docs/analytics/README.md`.

## Testes

- `estado.test.ts`: transições do reducer (inclusive o passo `codigo`, com o e-mail só na memória), leitura do progresso salvo, agregação das respostas por tipo.
- `Questionario.test.tsx`: aquecimento (uma vez na abertura, nunca na vitrine), "Preparando o teste…" com sucesso, falha e "Tentar de novo" (uma chamada por vez, progresso restaurado), aviso de espera depois de 5 s (timers falsos) em cada ação; cada estado, avançar/voltar mantendo a resposta, restauração só da chave do slug sem duplicar (Foco 2), envio único com botão desabilitado (Foco 4), sessão encerrada e erro, talentos com a 4ª escolha desabilitada (Foco 5), nomes acessíveis, foco, fotos e eventos.
- `Questionario.test.tsx` (código por e-mail): título e foco, campo do celular, código colado com espaço, errado/vencido/esgotado, reenviar só depois de 60 s, "Usar outro e-mail", dois toques em "Confirmar" (uma chamada), evento `confirmar_codigo`, e-mail fora do storage e do DataLayer.
- `acoes.test.ts`: `pedirCodigo` (mesma resposta para e-mail de aluno ou não, limite, aparelho lembrado), `confirmarCodigo`, `retomarCadastro`, `cadastrar` sem e-mail verificado. Regras do Strapi em `__tests__/integracao/verificacao-eba-strapi.test.ts`.
- `Resultado.test.tsx`: barras, destaque, porcentagem com máximo 0, talentos, estilo, sem resultado, próximo teste e sair.
- Vitrine: `lib/showcase/catalog.test.tsx` e `__tests__/caracteristicas/acessibilidade-e-seo.test.tsx` (todas as variantes e o controle "Tipo de teste").

## Status

Implementado (Tarefa 7). A página `/eba/testes/[slug]` que monta o componente com os dados do servidor é a Tarefa 8.

## Resultado salvo — `/eba/resultado/<codigo>` (entrega 3)

Página do servidor (`app/(site)/eba/resultado/[codigo]/page.tsx`) que mostra os resultados já gravados dos 5 testes, reaproveitando `ConteudoResultado` (o miolo do `Resultado`, sem "Próximo teste" nem "Sair"). Spec: `docs/superpowers/specs/2026-10-22-migracao-eba-3-resultado-design.md`.

- **Desligada por padrão:** sem `EBA_RESULTADO_SEGREDO` (32+ caracteres), tudo responde 404. Ligar só depois das perguntas em aberto da spec (§7: autorização da API para ler `SurveyResult` e quem emite o link).
- **Privacidade:** o `codigo` é opaco (AES-256-GCM, `lib/eba/link-resultado.ts`), não o id do aluno; vale no máximo 30 dias. A tela mostra só resultados: sem nome, e-mail, turma ou id. Código inválido, expirado, limite estourado (20 aberturas por minuto por IP) e aluno sem resultado dão o mesmo 404. `noindex, nofollow`, `referrer: no-referrer`, fora do sitemap.
- **Dados:** `lib/eba-api/resultados.ts` (`GET Hub/SurveyResult/Student/{id}/Question/{idQuestion}`, 5 em paralelo, 404 = teste não feito; rota da API só para o Hub, patch em `docs/superpowers/patches/`). O resultado de estilo salvo não traz as somas dos eixos, então `motivacao` e `organizacao` ficam `null` e a lista some.
- **Medição:** coberto por `clique_cta` (link "Ver todos os testes") e `data-section="resultado-eba"`. Sem evento novo; nenhum parâmetro leva o código ou o id.
- **Testes:** `link-resultado.test.ts`, `resultados.test.ts`, `Resultado.test.tsx` e `__tests__/integracao/eba-resultado.test.tsx`.

### Pedido do link — `/eba/resultado` e as entradas

- **Entradas (só com `EBA_RESULTADO_SEGREDO` configurado):** faixa `ConsultarResultado` ("Já fez os testes? Consultar meus resultados") logo depois da trilha de `/eba/testes`, e "Quer rever depois? Receber o link por e-mail" na tela de resultado de cada teste (prop `linkResultado` do `Questionario`/`Resultado`). A faixa é código, não Strapi: só existe quando o recurso está ligado, o que o editor não controla.
- **Página `/eba/resultado`:** `components/eba/PedirResultado` (ilha cliente): e-mail → código de 6 dígitos → "Confira seu e-mail". O link do resultado vai **só por e-mail** (validade de 7 dias, `app/(site)/eba/resultado/validade.ts`) e nunca aparece na tela. A resposta é igual para e-mail de aluno ou não. Sem o segredo, 404.
- **Server Actions:** `pedirCodigoResultado` (manda o código, não consulta a API) e `confirmarLinkResultado` (confere o código, busca o aluno por e-mail e envia o link). Limite de 10 tentativas por minuto por IP; falha fechada sem `EBA_RESULTADO_SEGREDO`, API, MailerSend ou token das verificações.
- **Medição:** coberto por `clique_cta` (faixa, botões e links) e `data-section` (`consultar-resultado`, `pedir-resultado-eba`); sem evento novo e sem e-mail, código ou link em parâmetro algum.
- **Testes:** `PedirResultado.test.tsx`, `ConsultarResultado.test.tsx`, `acoes.test.ts` (resultado), `email-resultado.test.ts`, `codigo-email.test.ts` e `__tests__/integracao/eba-resultado.test.tsx`.

### Revisão de 22/10/2026 (código por e-mail e envio)

- **Código aceito, API fora:** o código é de uso único e é gasto ao conferir. Agora o servidor grava a marca de e-mail verificado (15 min) **antes** de chamar a API da EBA; se ela falhar (API fria), a resposta traz `codigoAceito` e a tela mostra "Código confirmado, mas não conseguimos continuar agora" com **Tentar de novo** (`retomarCadastro`), sem pedir outro código. Se a marca venceu, volta ao e-mail. O pedido do link do resultado faz o mesmo com `reenviarLinkResultado` e a marca `eba_resultado_verificado`.
- **Limite de envios do e-mail:** a 4ª emissão em 15 min responde `emails` ("Já enviamos códigos demais para este e-mail. Aguarde 15 minutos para pedir outro."), em vez de mostrar "código enviado". A resposta não depende de o e-mail ser de aluno.
- **E-mail não saiu (MailerSend fora):** a emissão é cancelada no Strapi (`cancelar`) e não gasta a cota.
- **Aparelho lembrado: 7 dias** (antes 30), e "Sair" apaga a sessão, o aparelho e o e-mail verificado.
- **Envio das respostas:** limite de 6 por minuto por IP; a validade do envio único conta do fim da gravação; resposta 2xx ilegível fica guardada como "sem resultado" (reenviar não grava de novo).
- **Limite por IP:** `EBA_PROXIES_CONFIAVEIS` inválido vira 1; em produção o log avisa uma vez se a variável faltar ou se a requisição vier sem `x-forwarded-for`.
- **Strapi:** a soma de tentativas devolve a linha já somada (`UPDATE … RETURNING`); nova rota `POST /api/verificacoes-eba/cancelar` (o token Custom precisa de `emitir`, `conferir` e `cancelar`).
- **Risco aceito:** quem conhece um e-mail pode gastar os 3 envios em 15 min (cada e-mail enviado vai para a caixa do dono, que tem um código válido). O custo é o limite por IP e a cota por e-mail; um atacante com muitos IPs ainda consegue atrasar um e-mail específico.
