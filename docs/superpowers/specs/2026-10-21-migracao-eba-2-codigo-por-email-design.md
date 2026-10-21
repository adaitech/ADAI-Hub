# Migração da EBA — entrega 2: código por e-mail na identificação — design

> Complementa `2026-10-20-migracao-eba-2-testes-design.md` (testes do CDV no Hub). Origem: revisão do PR #15 (21/10/2026), achado 🔴 "quem conhece o e-mail de um aluno abre uma sessão e envia respostas em nome dele".

## 1. Objetivo

Só quem tem acesso à caixa de e-mail consegue abrir a sessão dos testes. Antes de abrir a sessão (aluno cadastrado) ou de cadastrar (primeiro acesso), o Hub manda um código de 6 dígitos para o e-mail digitado e confere o código. O aparelho verificado fica lembrado por 30 dias, para o aluno não digitar código a cada teste do CDV.

## 2. Decisões do brainstorm (21/10/2026, Jonatan)

| Tema | Decisão |
| --- | --- |
| Prova de posse do e-mail | **Código de 6 dígitos por e-mail** (não link mágico: o e-mail costuma ser aberto em outro aparelho que não o do QR code). |
| Envio | **MailerSend**, como no site atual (`adaitech/adai`, `src/utils/sendMail.ts`): `POST https://api.mailersend.com/v1/email`, remetente `no-reply@adai.com.br` (domínio já verificado no MailerSend). Token **novo e exclusivo do Hub**, só com permissão de envio, em `MAILERSEND_API_TOKEN` (só servidor). Sem a biblioteca `mailersend`: `fetch` direto. |
| Texto do e-mail | **No código do Hub** (HTML simples + texto), versionado e testado. Sem template do painel do MailerSend. |
| Frequência | **Lembrar o aparelho por 30 dias** (cookie assinado). "Não é você? Trocar e-mail" esquece o aparelho. |
| Onde guardar o código | **Strapi**: tipo privado `verificacao-eba` com rotas próprias, acessado só pelo servidor do Next com token próprio. Funciona com várias réplicas do Next. |

## 3. Fora do escopo

- Login com senha.
- Mudar a API da EBA (`eba-ada-api`) ou o painel da equipe.
- Painel para a equipe ver ou reenviar códigos.

## 4. Fluxo do aluno

1. **E-mail.** O aluno digita o e-mail e toca em "Continuar".
   - Cookie `eba_aparelho` válido **para esse e-mail** (mesmo hash): segue direto, como antes deste design (aluno cadastrado → sessão; e-mail novo → Primeiro acesso). Não manda e-mail.
   - Senão: o Hub responde **sempre** "Enviamos um código de 6 dígitos para a\*\*\*@email.com", exista ou não um aluno com esse e-mail.
2. **Código.** Tela nova com um campo de 6 dígitos, "Confirmar", "Reenviar código" (liberado 60 s depois do último envio) e "Usar outro e-mail". O código vale **10 min** e aceita **5 tentativas**.
3. **Código certo.**
   - Aluno cadastrado: abre a sessão de 2 h (cookie `eba_sessao`, sem mudança) e grava `eba_aparelho` (30 dias).
   - E-mail novo: grava `eba_email_verificado` (15 min) e vai ao Primeiro acesso. O `cadastrar` só aceita o e-mail desse cookie; ao cadastrar, abre a sessão e grava `eba_aparelho`.
4. **"Não é você? Trocar e-mail"** e **"Sair"** apagam `eba_sessao` **e** `eba_aparelho`.
5. As respostas já dadas continuam salvas na aba (`sessionStorage`) durante todo o fluxo, como antes.

## 5. Arquitetura

### 5.1 Strapi: tipo `verificacao-eba`

- `collectionType` sem `draftAndPublish`, **sem permissão pública** e oculto no Content Manager (`pluginOptions.content-manager.visible: false`).
- Campos: `email_hash` (string, indexado), `codigo_hash` (string), `expira_em` (datetime), `tentativas` (integer, padrão 0), `usado` (boolean), `criado_em` (datetime).
- Nunca guarda e-mail nem código em texto: os hashes são HMAC-SHA256 com `EBA_SESSAO_SEGREDO`, calculados no Next. O Strapi não conhece o segredo.
- Rotas próprias (`src/api/verificacao-eba/routes/custom.ts`), autenticadas por **API token** do Strapi (token "Custom" só com estas ações):
  - `POST /api/verificacoes-eba/emitir` `{ emailHash, codigoHash, expiraEm }` → invalida as verificações abertas do mesmo `emailHash` (marca `usado`) e cria a nova. Recusa (429) se já houver **3 emissões do mesmo `emailHash` nos últimos 15 min**.
  - `POST /api/verificacoes-eba/conferir` `{ emailHash, codigoHash }` → numa única operação no banco (`UPDATE … SET tentativas = tentativas + 1 WHERE email_hash = ? AND usado = false AND expira_em > agora AND tentativas < 5`), soma a tentativa; depois confere o hash e, se bater, marca `usado`. Devolve `{ resultado: 'ok' | 'errado' | 'esgotado' | 'vencido', restantes }`.
- Limpeza: no `bootstrap`, um cron do Strapi apaga verificações com `criado_em` acima de 24 h.
- Guia do editor: `editor-guide/api.verificacao-eba.json` existe (o `cinco-pilares.test.ts` exige guia de todo tipo) e descreve o tipo como **interno, preenchido só pelo site**, sem ação do editor.

### 5.2 Next: servidor

| Peça | O que faz |
| --- | --- |
| `lib/email/mailersend.ts` | `enviarEmail({ para, assunto, html, texto })`: `fetch` com `Authorization: Bearer MAILERSEND_API_TOKEN`, timeout curto (10 s), sem log de destinatário. Falha → `EmailIndisponivel`. |
| `lib/eba/codigo-email.ts` | Monta assunto ("Seu código para os testes da EBA: 123456"), HTML e texto: o código, a validade (10 min) e "Se não foi você, ignore este e-mail". Sem nome, turma ou outro dado. |
| `lib/eba/verificacao.ts` | `gerarCodigo()` (`crypto.randomInt(0, 1_000_000)`, 6 dígitos com zeros à esquerda), `hashDoEmail`, `hashDoCodigo` (HMAC com o segredo; o do código inclui o `emailHash`), cliente das rotas do Strapi com `STRAPI_TOKEN_VERIFICACAO`. |
| `lib/eba/aparelho.ts` | Cookie `eba_aparelho`: `{ emailHash, emitidoEm }` assinado (mesmo formato do `eba_sessao`), validade de 30 dias conferida no servidor; cookie `eba_email_verificado` (`{ emailHash, emitidoEm }`, 15 min). Os dois com os mesmos atributos do `eba_sessao` (`httpOnly`, `secure` em produção, `sameSite=lax`, `path=/eba/testes`); o do aparelho com `maxAge` de 30 dias, o do e-mail verificado de 15 min. |
| Ações (`acoes.ts`) | `pedirCodigo(email)` substitui o começo do `identificar`: aparelho lembrado → segue como o `identificar` atual; senão emite e envia, e responde `{ codigoEnviado: true, emailMascarado }` (igual para e-mail existente ou não). `confirmarCodigo(email, codigo)` → `ok` abre a sessão ou devolve `{ novo: true, turmas }`; `errado` com tentativas restantes; `esgotado`/`vencido`. `reenviarCodigo(email)` = `pedirCodigo` com o mesmo limite. `cadastrar` exige `eba_email_verificado` com o mesmo `emailHash`. `trocarEmail`/`sair` apagam também `eba_aparelho`. |

### 5.3 Next: tela

- Estado novo `codigo` no reducer do questionário, entre `email` e `pergunta`/`cadastro`. O e-mail digitado fica só na memória da tela (como já acontece no Primeiro acesso), nunca no `sessionStorage`.
- Componente `ConfirmarCodigo` (em `Questionario/Identificacao.tsx`): campo com `inputmode="numeric"`, `autocomplete="one-time-code"`, `maxlength=6`, rótulo visível, erro em região `aria-live`, foco no título ao entrar; "Reenviar código" com contagem de 60 s; "Usar outro e-mail".
- Protótipo: o estado novo entra em `docs/prototipo/eba/estados.html` (marcado como **Proposto**).

### 5.4 Variáveis de ambiente

| Variável | Onde | Uso |
| --- | --- | --- |
| `MAILERSEND_API_TOKEN` | `next/.env` (só servidor) | Token do MailerSend exclusivo do Hub, só envio. Nunca `NEXT_PUBLIC_` (o site atual usa `NEXT_PUBLIC_MAILSENDER_API_TOKEN`; não repetir). |
| `STRAPI_TOKEN_VERIFICACAO` | `next/.env` (só servidor) | API token "Custom" do Strapi só com `emitir`/`conferir` do `verificacao-eba`. |

Sem qualquer uma delas, os testes ficam "indisponíveis" (falha fechado), como já acontece sem `EBA_SESSAO_SEGREDO`.

## 6. Segurança e limites

| Ameaça | Defesa |
| --- | --- |
| Adivinhar o código | 6 dígitos, 10 min, 5 tentativas por código contadas no Strapi numa única operação; depois, o código morre. |
| Flood de e-mails e custo | 3 emissões por e-mail a cada 15 min (Strapi) + limite por IP já existente (10/min, IP do `x-forwarded-for` pela direita). Além do limite, a resposta é a mesma e nenhum e-mail sai. |
| Enumeração de e-mails | `pedirCodigo` responde igual para e-mail cadastrado ou não; "é novo?" só depois do código certo. Substitui o risco aceito na spec da entrega 2 (§12). |
| Cookie do aparelho roubado | `httpOnly`, `secure`, `sameSite=lax`, `path=/eba/testes`, assinado; só vale para o mesmo e-mail digitado; 30 dias. |
| Código reaproveitado | Usado no primeiro acerto; emitir um novo invalida os anteriores do mesmo e-mail. |
| Dado pessoal | Strapi só com hashes; logs só com a classe do erro; e-mail fora de URL, `dataLayer` e log. |

## 7. Erros e textos

| Situação | Texto | Comportamento |
| --- | --- | --- |
| MailerSend ou Strapi fora | "Não conseguimos enviar o código agora. Tente de novo em alguns minutos." | Não abre sessão (falha fechado). |
| Código errado | "Código incorreto. Você tem mais N tentativas." | Campo limpo e focado. |
| Última tentativa errada, vencido | "Este código não vale mais. Enviamos um novo?" | Botão "Enviar novo código". |
| Limite de envios | (mesma resposta do envio normal) | Nenhum e-mail sai. |
| E-mail não chegou | "Não chegou? Confira o spam ou reenvie em 60 s." | "Reenviar código" liberado depois de 60 s. |

## 8. Medição (DataLayer)

- `clique_cta` continua automático nos botões (sem o e-mail em `texto` nem em `destino`).
- Evento novo `confirmar_codigo` `{ teste, resultado: 'ok' | 'errado' | 'esgotado' | 'vencido' }`, sem dado pessoal; plano em `docs/analytics/README.md` §3 e container GTM.

## 9. Testes (TDD)

- **Unidade:** `gerarCodigo` (6 dígitos, faixa toda), hashes (estáveis, dependem do segredo, não revelam o e-mail), cookies `eba_aparelho`/`eba_email_verificado` (assinatura, validade, adulteração), `codigo-email` (o código aparece; nenhum dado pessoal além do destinatário), `mailersend` (`fetch` simulado: header, corpo, erro → `EmailIndisponivel`, sem log do destinatário).
- **Ações:** resposta igual para e-mail existente e inexistente; aparelho lembrado pula o código; 6ª tentativa recusada; código vencido; limite de envios sem e-mail; `cadastrar` sem `eba_email_verificado` recusado; "Trocar e-mail" apaga o aparelho; falha do MailerSend/Strapi → indisponível.
- **Strapi:** rotas `emitir`/`conferir` (limite de 3 em 15 min, contagem atômica, uso único, invalidação dos anteriores) e permissões (nada público).
- **Tela:** passo `codigo` no `Questionario.test.tsx` (foco, `aria-live`, reenviar com 60 s, usar outro e-mail, acessibilidade com o auditor do projeto).
- **Característica:** `seguranca-e-privacidade.test.ts` cobre as variáveis novas sem `NEXT_PUBLIC_` e o `.env.example` sem valores.

## 10. Pré-requisitos externos (com o Jonatan)

1. Criar no MailerSend um **token exclusivo do Hub** com permissão só de envio (domínio `adai.com.br`).
2. Criar no Strapi de cada ambiente o API token "Custom" do `verificacao-eba`.
3. Guardar os dois no cofre e configurar na hospedagem.
4. Homologação: um envio real para um e-mail de teste, conferindo SPF/DKIM aprovados e que não cai no spam.

## 11. Rollout e rollback

- Entra no **PR #15**, que fica bloqueado até isto estar pronto e validado em homologação.
- Seed do Strapi sobe de versão (tipo novo, sem conteúdo); snapshot exportado com o ok do Jonatan.
- Rollback: reverter o PR. Não há dado a migrar (as verificações são temporárias).

## 12. Riscos

- **E-mail que não chega ou cai no spam** trava o aluno na sala. Mitigação: texto curto sem links, remetente verificado, "Reenviar" e orientação da equipe da EBA na aula.
- **Strapi fora** derruba a identificação (antes, só as páginas). Mitigação: mensagem clara e falha fechado.
- **Celular compartilhado** com o aparelho lembrado: "Não é você?" esquece o aparelho; a sessão continua com o limite de 2 h.

## 13. Critérios de aceite

- Sem o código, nenhuma sessão é aberta e nenhum cadastro é feito.
- A resposta ao pedir o código é a mesma para e-mail cadastrado e não cadastrado.
- Aparelho verificado não pede código de novo por 30 dias para o mesmo e-mail.
- Em homologação: código recebido pelo MailerSend, sessão aberta e resultado do teste no painel atual.
- `yarn quality`, `yarn build` (Next e Strapi) e `yarn smoke` passam.
