# Questionário dos testes da EBA — `Questionario`

Ilha cliente (`'use client'`) da página `/eba/testes/<slug>`: a tela em que o aluno responde um dos 5 testes do CDV. Código em `next/src/components/eba/Questionario/`; vitrine em `/componentes/questionario-eba`. Spec: `docs/superpowers/specs/2026-10-20-migracao-eba-2-testes-design.md` §5.4, §5.5, §7 e §8. Protótipo: `docs/prototipo/eba/teste-dons-servico.html`.

## De onde vem cada parte

| Parte | Origem |
| --- | --- |
| Nome, "Teste N de 5", "Próximo teste" | `TESTES` em `lib/eba-api/testes.ts` (ordem da apostila) |
| Resumo, Perguntas/Resposta, "Como responder", aula | tipo "Testes da EBA" do Strapi (prop `abertura`, montada pela página) |
| Perguntas de nota e talentos | API da EBA (`GET Question/{id}`), buscadas pelo servidor (prop `perguntas`) |
| Pares do estilo e opções do temperamento | dados locais em `lib/eba-api/conteudo-local.ts` |
| Identificação, cadastro, envio, sair | Server Actions de `app/(site)/eba/testes/[slug]/acoes.ts`, recebidas pela prop `acoes` (testes e vitrine passam versões de mentira) |
| Fotos (decorativas, `alt=""`) | `fotoDoTeste` em `lib/eba/fotos-testes.ts` |

Não está no Strapi: o fluxo, as escalas e a agregação das respostas são regras do teste, não conteúdo editorial.

## Estados

`abertura → email | cadastro → pergunta → enviando → resultado`, mais `erro` (envio falhou; "Tentar de novo") e `expirou` (sessão encerrada; pede o e-mail e reenvia sozinho depois). Com sessão válida, "Começar o teste" pula a identificação. O reducer puro fica em `estado.ts`.

- **Nota (0–5):** radios nativos. Escolher com mouse ou toque avança; pelo teclado (setas, espaço) só marca, e "Próxima pergunta" segue (WCAG 2.1.1 e 3.2.2). Voltar mostra a resposta escolhida. Nome acessível "N — Rótulo".
- **Talentos:** etapa 1 marca as habilidades (sem limite); etapa 2 escolhe até 3 entre as marcadas ("Concluir" exige uma). Envia 1 para as escolhidas e 0 para as demais.
- **Estilo (1–5):** 14 pares (motivação 1–7, organização 8–14); nome acessível "1 — mais perto de: <frase da esquerda>". Envia a soma de cada eixo (`numero` 1 e 2).
- **Temperamento:** 20 páginas de 10 opções, com "Próximo". Envia quantas foram marcadas em cada grupo (`numero` 1 a 4).
- **Resultado:** barras proporcionais a `maximo`, 3 primeiros em destaque e a mensagem do primeiro; temperamento em porcentagem (máximo 0 → 0%); talentos como lista; estilo com a combinação, os dois totais e a descrição. "Próximo teste" some no último. "Sair" encerra a sessão no servidor.
- **Foco:** vai para o enunciado (`legend`) a cada pergunta e para o título de cada estado.
- **Progresso:** `sessionStorage`, chave `eba-teste:<slug>`, só respostas (nunca e-mail ou nome); apagado ao mostrar o resultado. Ao restaurar, descarta o que não cabe no teste (pergunta inexistente, nota fora da escala, id inválido, mais de 3 escolhidas).
- **Fotos:** capa na abertura, identificação no e-mail/cadastro/sessão encerrada, uma por pergunta (página no temperamento, par no estilo; sem foto própria → capa) e resultado no envio. A da próxima pergunta é pré-carregada (`preload` do React).

## Layout

Caixa cinza + foto na mesma grade, raio `--radius-lg`, gap `--space-12`. Abaixo de 1024 px a foto é uma faixa 16:9 acima da caixa; a partir de 1024 px fica à direita com a mesma altura da caixa. 🟡 Sem token no design system: largura máxima da caixa (44rem) e altura mínima da foto (32rem), do protótipo; borda de campo e destaque de erro usam o cinza de texto e o preto (falta um token de alerta).

## Medição (DataLayer)

Dois eventos novos, sem dado pessoal: **`iniciar_teste`** (`teste` = slug), uma vez, quando a primeira pergunta aparece, e **`concluir_teste`** (`teste` = slug) quando o resultado aparece (evento-chave). Os botões e links continuam cobertos por `clique_cta`; a tela tem `data-section="teste-eba"`. No modo vitrine (`estadoInicial`) nenhum evento é enviado. Ver `docs/analytics/README.md`.

## Testes

- `estado.test.ts`: transições do reducer, leitura do progresso salvo, agregação das respostas por tipo.
- `Questionario.test.tsx`: cada estado, avançar/voltar mantendo a resposta, restauração só da chave do slug sem duplicar (Foco 2), envio único com botão desabilitado (Foco 4), sessão encerrada e erro, talentos com a 4ª escolha desabilitada (Foco 5), nomes acessíveis, foco, fotos e eventos.
- `Resultado.test.tsx`: barras, destaque, porcentagem com máximo 0, talentos, estilo, próximo teste e sair.
- Vitrine: `lib/showcase/catalog.test.tsx` e `__tests__/caracteristicas/acessibilidade-e-seo.test.tsx` (todas as variantes e o controle "Tipo de teste").

## Status

Implementado (Tarefa 7). A página `/eba/testes/[slug]` que monta o componente com os dados do servidor é a Tarefa 8.
