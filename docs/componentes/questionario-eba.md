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

`abertura → email | cadastro → pergunta → enviando → resultado`, mais `erro` (envio falhou; "Tentar de novo") e `expirou` (sessão encerrada; pede o e-mail e reenvia sozinho depois, se for a mesma pessoa). Com sessão válida, "Começar o teste" pula a identificação. O reducer puro fica em `estado.ts`.

- **Respondendo como:** "Respondendo como a***@… · Não é você? Trocar e-mail" aparece na abertura (com sessão válida), nas perguntas e no erro de envio. "Trocar e-mail" encerra a sessão (`sair`), **apaga o progresso** (estado e `sessionStorage`) e volta para a identificação; depois, o teste recomeça da primeira pergunta.
- **Identificação indisponível:** API fora ou turmas que não carregam (no e-mail ou no Primeiro acesso) mostram "Tentar de novo", que refaz a identificação; no Primeiro acesso o formulário preenchido é mantido e a lista de turmas é atualizada. Nome e turma inválidos têm mensagem própria ligada por `aria-describedby`, como a unidade; nome com caractere de controle é recusado.
- **Sessão de outra aba:** o envio leva o `respondidoComo` (dono das respostas). Se o cookie for de outra pessoa (o e-mail foi trocado ou a sessão venceu e outra pessoa entrou em outra aba), o servidor devolve `sessao` sem chamar a API; a tela mostra "Sua sessão foi encerrada" e, se quem se identifica é outra pessoa, o teste recomeça da primeira pergunta, sem reenviar. Limite: dois e-mails com a mesma máscara (`a***@x.com`) não se distinguem.
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
- **Progresso:** `sessionStorage`, chave `eba-teste:<slug>`: as respostas e `respondidoComo`, o e-mail **mascarado** da sessão em que foram dadas (nunca o e-mail inteiro nem o nome); apagado ao mostrar o resultado. Ao restaurar, descarta o que não cabe no teste (pergunta inexistente, nota fora da escala, id inválido, mais de 3 escolhidas) e o progresso sem `respondidoComo`. Se a sessão atual (na abertura ou depois de uma identificação) tem outro e-mail mascarado, o progresso é descartado e o teste recomeça: as respostas de uma pessoa nunca são enviadas como de outra.
- **Fotos:** capa na abertura, identificação no e-mail/cadastro/sessão encerrada, uma por pergunta (página no temperamento, par no estilo; sem foto própria → capa) e resultado no envio. A da próxima pergunta é pré-carregada (`preload` do React).

## Layout

Caixa cinza + foto na mesma grade, raio `--radius-lg`, gap `--space-12`. Abaixo de 1024 px a foto é uma faixa 16:9 acima da caixa; a partir de 1024 px fica à direita com a mesma altura da caixa. 🟡 Sem token no design system: largura máxima da caixa (44rem) e altura mínima da foto (32rem), do protótipo; borda de campo e destaque de erro usam o cinza de texto e o preto (falta um token de alerta).

## Medição (DataLayer)

Dois eventos novos, sem dado pessoal: **`iniciar_teste`** (`teste` = slug), uma vez, quando a primeira pergunta aparece, e **`concluir_teste`** (`teste` = slug) quando o resultado aparece (evento-chave). Os botões e links continuam cobertos por `clique_cta`; a tela tem `data-section="teste-eba"`. No modo vitrine (`estadoInicial`) nenhum evento é enviado. Ver `docs/analytics/README.md`.

## Testes

- `estado.test.ts`: transições do reducer, leitura do progresso salvo, agregação das respostas por tipo.
- `Questionario.test.tsx`: aquecimento (uma vez na abertura, nunca na vitrine), "Preparando o teste…" com sucesso, falha e "Tentar de novo" (uma chamada por vez, progresso restaurado), aviso de espera depois de 5 s (timers falsos) em cada ação; cada estado, avançar/voltar mantendo a resposta, restauração só da chave do slug sem duplicar (Foco 2), envio único com botão desabilitado (Foco 4), sessão encerrada e erro, talentos com a 4ª escolha desabilitada (Foco 5), nomes acessíveis, foco, fotos e eventos.
- `Resultado.test.tsx`: barras, destaque, porcentagem com máximo 0, talentos, estilo, sem resultado, próximo teste e sair.
- Vitrine: `lib/showcase/catalog.test.tsx` e `__tests__/caracteristicas/acessibilidade-e-seo.test.tsx` (todas as variantes e o controle "Tipo de teste").

## Status

Implementado (Tarefa 7). A página `/eba/testes/[slug]` que monta o componente com os dados do servidor é a Tarefa 8.
