# Código por e-mail na identificação dos testes da EBA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Só quem recebe o código de 6 dígitos no e-mail abre a sessão dos testes do CDV ou se cadastra; o aparelho verificado fica lembrado por 30 dias.

**Architecture:** O servidor do Next gera o código, guarda só hashes num tipo privado do Strapi (rotas `emitir`/`conferir` com contagem atômica de tentativas) e envia o e-mail pelo MailerSend. As Server Actions `pedirCodigo`/`confirmarCodigo` substituem o `identificar`; cookies assinados (`eba_aparelho`, `eba_email_verificado`) guardam a verificação. A tela ganha o passo `codigo`.

**Tech Stack:** Next 16 (App Router, Server Actions), React 19, TypeScript, Jest + Testing Library, Strapi 5 (rotas e serviço próprios, knex), MailerSend API v1.

**Spec:** `docs/superpowers/specs/2026-10-21-migracao-eba-2-codigo-por-email-design.md` (complementa `2026-10-20-migracao-eba-2-testes-design.md`).

Branch: `feat/eba-testes` (worktree `C:\ADAI\ADAI-Hub-eba`). Regras: `AGENTS.md`, `.agents/rules/Testes.md`, `.agents/rules/Pull-Request.md`.

## Global Constraints

- Código: 6 dígitos (`000000`–`999999`, `crypto.randomInt(0, 1_000_000)`), validade **10 min**, **5 tentativas** por código.
- Emissões: no máximo **3 por e-mail a cada 15 min** (Strapi); além disso, a resposta é a mesma e nenhum e-mail sai. Limite por IP já existente: 10/min (`ipDoCliente`).
- "Reenviar código" liberado **60 s** depois do último envio (tela).
- Cookies (`httpOnly`, `secure` em produção, `sameSite=lax`, `path=/eba/testes`, assinados com `EBA_SESSAO_SEGREDO`): `eba_aparelho` = `{ emailHash, emitidoEm }`, **30 dias**; `eba_email_verificado` = `{ emailHash, emitidoEm }`, **15 min**. `eba_sessao` não muda (2 h).
- Hashes: HMAC-SHA256 com `EBA_SESSAO_SEGREDO`; `emailHash = HMAC('email:' + normalizarEmail(email))`, `codigoHash = HMAC('codigo:' + emailHash + ':' + codigo)`. O Strapi nunca recebe e-mail nem código em texto.
- MailerSend: `POST https://api.mailersend.com/v1/email`, `Authorization: Bearer ${MAILERSEND_API_TOKEN}`, remetente `{ email: 'no-reply@adai.com.br', name: 'ADAI' }`, timeout **10 s**; sucesso = HTTP 202 (corpo vazio).
- Variáveis novas, só servidor: `MAILERSEND_API_TOKEN`, `STRAPI_TOKEN_VERIFICACAO`. Nunca `NEXT_PUBLIC_`. Sem elas, falha fechado (`indisponivel`).
- Logs: só a classe do erro/status; nunca e-mail, código, hash ou token.
- Arquivos em `strapi/src/**` importados pelos testes do Next **não importam `@strapi/*`** (o CI do Next não instala o Strapi).
- Textos da tela (pt-BR, exatos):
  - enviado: "Enviamos um código de 6 dígitos para {emailMascarado}."
  - indisponível: "Não conseguimos enviar o código agora. Tente de novo em alguns minutos."
  - errado: "Código incorreto. Você tem mais {N} tentativas." (N=1: "mais 1 tentativa.")
  - vencido/esgotado: "Este código não vale mais. Enviamos um novo?" + botão "Enviar novo código"
  - ajuda: "Não chegou? Confira o spam ou reenvie em {s} s." → depois de 60 s, botão "Reenviar código"
  - assunto do e-mail: "Seu código para os testes da EBA: {codigo}"

## Review Focus

1. Código colado do e-mail com espaços ou traço ("123 456", " 123456\n") deve ser aceito: só os dígitos contam. → teste no Task 6 (`confirmarCodigo`) e no Task 7 (campo).
2. O mesmo e-mail com maiúsculas e espaços ("  Ana@X.com ") gera o mesmo hash que "ana@x.com", e o aparelho lembrado vale para ele. → teste no Task 4 e no Task 6.
3. Aparelho lembrado para a ana e a pessoa digita outro e-mail: **manda código** (não pula). → teste no Task 6.
4. Depois de reenviar, a pessoa digita o código **antigo**: "Este código não vale mais…", nunca abre sessão. → teste no Task 1 (regra) e no Task 6.
5. Dois toques rápidos em "Confirmar": uma chamada só; o segundo não mostra erro depois do sucesso. → teste no Task 7.

---

### Task 1: Strapi — tipo `verificacao-eba`, regra de emitir/conferir e rotas

**Files:**
- Create: `strapi/src/api/verificacao-eba/content-types/verificacao-eba/schema.json`
- Create: `strapi/src/api/verificacao-eba/regras.ts` (sem imports de `@strapi/*`)
- Create: `strapi/src/api/verificacao-eba/repositorio.ts` (knex via `strapi.db`)
- Create: `strapi/src/api/verificacao-eba/controllers/verificacao-eba.ts`, `routes/verificacao-eba.ts`, `services/verificacao-eba.ts`
- Create: `strapi/config/cron-tasks.ts`; Modify: `strapi/config/server.ts` (`cron: { enabled: true, tasks }`)
- Create: `strapi/src/editor-guide/api.verificacao-eba.json`; Modify: `strapi/src/editor-guide/index.ts`
- Test: `next/src/__tests__/integracao/verificacao-eba-strapi.test.ts`

**Interfaces:**
- Produces (HTTP, token "Custom" do Strapi): `POST /api/verificacoes-eba/emitir` body `{ emailHash: string; codigoHash: string; expiraEm: string /* ISO */ }` → `201 {}` ou `429 {}`; `POST /api/verificacoes-eba/conferir` body `{ emailHash: string; codigoHash: string }` → `200 { resultado: 'ok' | 'errado' | 'esgotado' | 'vencido'; restantes: number }`.
- Produces (código): em `regras.ts`, `interface RepositorioVerificacao { contarEmissoesDesde(emailHash: string, desde: Date): Promise<number>; invalidarAbertas(emailHash: string): Promise<void>; criar(r: { emailHash: string; codigoHash: string; expiraEm: Date; criadoEm: Date }): Promise<void>; somarTentativa(emailHash: string, agora: Date): Promise<RegistroVerificacao | null> /* atômico: só a verificação aberta, não vencida, com tentativas < 5; devolve o registro já somado */; ultima(emailHash: string): Promise<RegistroVerificacao | null>; marcarUsado(id: number): Promise<boolean> /* true só se mudou de false para true */; apagarAntesDe(data: Date): Promise<number> }`, `type RegistroVerificacao = { id: number; codigoHash: string; expiraEm: Date; tentativas: number; usado: boolean }`, `emitir(repo, dados, agora: Date): Promise<'emitido' | 'limite'>`, `conferir(repo, dados, agora: Date): Promise<{ resultado: 'ok' | 'errado' | 'esgotado' | 'vencido'; restantes: number }>`, constantes `MAX_TENTATIVAS = 5`, `MAX_EMISSOES = 3`, `JANELA_EMISSOES_MS = 900_000`.

- [ ] **Step 1: Write the failing tests** (repositório em memória dentro do teste, implementando `RepositorioVerificacao`)

```ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { conferir, emitir, MAX_TENTATIVAS } from '../../../../strapi/src/api/verificacao-eba/regras';

const T0 = new Date('2026-10-21T12:00:00Z');
const min = (n: number) => new Date(T0.getTime() + n * 60_000);
const emissao = (codigoHash = 'c1') => ({ emailHash: 'e1', codigoHash, expiraEm: min(10) });

it('emite e confere o código certo uma vez só (uso único)', async () => {
  const repo = repoEmMemoria();
  expect(await emitir(repo, emissao(), T0)).toBe('emitido');
  expect(await conferir(repo, { emailHash: 'e1', codigoHash: 'c1' }, min(1))).toEqual({ resultado: 'ok', restantes: 4 });
  expect((await conferir(repo, { emailHash: 'e1', codigoHash: 'c1' }, min(2))).resultado).toBe('vencido');
});
it('código errado desconta; na 5ª errada fica esgotado e o certo não vale mais', async () => {
  // 4 erradas → restantes 4,3,2,1; 5ª errada → { resultado: 'errado', restantes: 0 }; depois o certo → 'esgotado'
});
it('vencido depois de 10 min', async () => { /* conferir em min(10) → 'vencido' */ });
it('emitir um novo invalida o anterior (o código antigo não vale mais)', async () => {
  // emitir c1, emitir c2; conferir c1 → 'vencido'; conferir c2 → 'ok'
});
it('no máximo 3 emissões por e-mail em 15 min; a 4ª é "limite" e não cria nada', async () => {
  // 3× 'emitido', 4ª → 'limite' (repo sem 4º registro); em min(15) volta a 'emitido'
});
it('sem verificação nenhuma → vencido, restantes 0', async () => {});
it('regras.ts não importa pacotes do Strapi', () => {
  const fonte = readFileSync(join(process.cwd(), '..', 'strapi/src/api/verificacao-eba/regras.ts'), 'utf8');
  expect(fonte).not.toMatch(/from ['"]@strapi\//);
});
it('o tipo é privado: fora das permissões públicas e oculto no painel', () => {
  // public-permissions.ts não contém 'verificacao-eba'; schema.json tem pluginOptions.content-manager.visible === false
});
```

- [ ] **Step 2: Run** `cd next && npx jest src/__tests__/integracao/verificacao-eba-strapi.test.ts` — Expected: FAIL (`Cannot find module …/regras`).

- [ ] **Step 3: Implement**
  - `schema.json`: `collectionType`, `collectionName: "verificacoes_eba"`, `singularName: "verificacao-eba"`, `pluralName: "verificacoes-eba"`, `displayName: "Verificações de e-mail (EBA)"`, `draftAndPublish: false`, `pluginOptions: { "content-manager": { "visible": false }, "content-type-builder": { "visible": false } }`; atributos `email_hash` (string, required), `codigo_hash` (string, required), `expira_em` (datetime, required), `tentativas` (integer, default 0), `usado` (boolean, default false), `criado_em` (datetime, required).
  - `regras.ts`: `emitir` = `contarEmissoesDesde(emailHash, agora − 15 min) >= 3` → `'limite'`; senão `invalidarAbertas` + `criar`. `conferir` = `somarTentativa`; `null` → `ultima()` decide `'esgotado'` (tentativas ≥ 5 e não usada) ou `'vencido'` (qualquer outro caso); registro somado com hash igual (`timingSafeEqual` de `node:crypto`) → `marcarUsado` (false → `'vencido'`) → `'ok'`; diferente → `'errado'`. `restantes = MAX_TENTATIVAS − tentativas`.
  - `repositorio.ts`: `criarRepositorio(strapi)` implementa a interface com `strapi.db.query('api::verificacao-eba.verificacao-eba')` para criar/ler/atualizar e, **só** em `somarTentativa`, `strapi.db.connection('verificacoes_eba').where({ email_hash, usado: false }).andWhere('expira_em', '>', agora).andWhere('tentativas', '<', 5).increment('tentativas', 1)` seguido da leitura da mesma linha. `marcarUsado` com `update … where id and usado = false` (linhas afetadas = 1).
  - Controller: `emitir`/`conferir` validam o body (strings não vazias de até 100 caracteres, data ISO), chamam o serviço e respondem conforme Interfaces; body inválido → 400. Route: os dois `POST` com `config: { auth: { scope: [...] } }` padrão (sem `auth: false`).
  - `cron-tasks.ts`: `'0 3 * * *'` → `apagarAntesDe(agora − 24 h)`.
  - Guia `api.verificacao-eba.json`: `nome` "Verificações de e-mail (EBA)", `resumo` "Tipo interno, preenchido só pelo site: guarda por alguns minutos o código enviado por e-mail aos alunos dos testes. Não edite.", um item em `campos` para cada atributo do schema (o `cinco-pilares.test.ts` exige os mesmos campos); registrar no `index.ts`.

- [ ] **Step 4: Run** o teste do Step 2 e `npx jest src/__tests__/caracteristicas/cinco-pilares.test.ts` — Expected: PASS. Depois `cd ../strapi && yarn build` — Expected: build ok.

- [ ] **Step 5: Conferir a contagem atômica no Strapi local** (`yarn develop`, token "Custom" criado no painel só com `emitir`/`conferir`): emitir um hash e disparar 8 `conferir` errados em paralelo (`for i in $(seq 8); do curl -s -X POST … & done; wait`). Expected: exatamente 5 respostas `errado` (restantes 4…0) e 3 `esgotado`; a coluna `tentativas` termina em 5.

- [ ] **Step 6: Commit** `feat(strapi): tipo privado verificacao-eba com emitir e conferir atômicos`

### Task 2: Next — cliente das verificações no Strapi

**Files:**
- Create: `next/src/lib/strapi/verificacao.ts`, Test: `next/src/lib/strapi/verificacao.test.ts`

**Interfaces:**
- Consumes: HTTP do Task 1; `STRAPI_URL` de `lib/strapi/client.ts`.
- Produces: `emitirVerificacao(d: { emailHash: string; codigoHash: string; expiraEm: Date }): Promise<'emitido' | 'limite'>`, `conferirVerificacao(d: { emailHash: string; codigoHash: string }): Promise<{ resultado: 'ok' | 'errado' | 'esgotado' | 'vencido'; restantes: number }>`, `verificacaoConfigurada(): boolean` (true só com `STRAPI_TOKEN_VERIFICACAO`), `class VerificacaoIndisponivel extends Error`.

- [ ] **Step 1: Write the failing tests** (`global.fetch` simulado): `POST` em `${STRAPI_URL}/api/verificacoes-eba/emitir` com `Authorization: Bearer <token>`, `cache: 'no-store'` e corpo JSON (data em ISO); 201 → `'emitido'`, 429 → `'limite'`; `conferir` devolve o corpo; 401/500/rede/timeout (10 s, `AbortSignal.timeout`) → `VerificacaoIndisponivel`; corpo de `conferir` fora do formato → `VerificacaoIndisponivel`; sem token → `verificacaoConfigurada() === false` e nenhuma chamada; nenhum `console.*` com o hash.
- [ ] **Step 2: Run** `cd next && npx jest src/lib/strapi/verificacao.test.ts` — Expected: FAIL (módulo inexistente).
- [ ] **Step 3: Implement** as três funções e a classe conforme Interfaces.
- [ ] **Step 4: Run** o mesmo teste — Expected: PASS.
- [ ] **Step 5: Commit** `feat(eba): cliente das verificações de e-mail no Strapi`

### Task 3: Next — envio pelo MailerSend e texto do e-mail

**Files:**
- Create: `next/src/lib/email/mailersend.ts` + `.test.ts`
- Create: `next/src/lib/eba/codigo-email.ts` + `.test.ts`

**Interfaces:**
- Produces: `enviarEmail(e: { para: string; assunto: string; html: string; texto: string }): Promise<void>`, `emailConfigurado(): boolean`, `class EmailIndisponivel extends Error`; `emailDoCodigo(codigo: string): { assunto: string; html: string; texto: string }`.

- [ ] **Step 1: Write the failing tests**
  - `mailersend.test.ts`: corpo enviado = `{ from: { email: 'no-reply@adai.com.br', name: 'ADAI' }, to: [{ email: para }], subject, html, text }`; header `Authorization: Bearer <MAILERSEND_API_TOKEN>`; **HTTP 202 com corpo vazio resolve** (é o sucesso da API); 401/422/429/500, rede e timeout de 10 s → `EmailIndisponivel`; sem token → `emailConfigurado() === false`; nenhum `console.*` contém o destinatário.
  - `codigo-email.test.ts`: `emailDoCodigo('042137')` → `assunto === 'Seu código para os testes da EBA: 042137'`; `html` e `texto` contêm `042137`, "10 minutos" e "Se não foi você, ignore este e-mail"; nenhum link no corpo (`not.toMatch(/https?:\/\//)`); o código vem escapado no HTML (só dígitos aceitos: `emailDoCodigo('<b>')` lança).
- [ ] **Step 2: Run** `npx jest src/lib/email src/lib/eba/codigo-email.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** conforme Interfaces; HTML simples (tabela única, fonte do sistema, código em destaque), sem imagens externas.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(eba): e-mail do código pelo MailerSend`

### Task 4: Next — código, hashes e cookies assinados

**Files:**
- Create: `next/src/lib/eba/assinatura.ts` (+ teste); Modify: `next/src/lib/eba/sessao.ts` (passa a usar `assinatura.ts`, sem mudar a interface pública)
- Create: `next/src/lib/eba/verificacao.ts` (+ teste), `next/src/lib/eba/aparelho.ts` (+ teste)

**Interfaces:**
- Consumes: `normalizarEmail` de `lib/eba-api/alunos.ts`; `TAMANHO_MINIMO_SEGREDO`, `OPCOES_COOKIE` de `sessao.ts`.
- Produces: `assinarJson(dados: object, segredo: string): string`, `lerJsonAssinado(valor: string | undefined, segredo: string): unknown | null`; `gerarCodigo(): string`, `hashDoEmail(email: string, segredo: string): string`, `hashDoCodigo(emailHash: string, codigo: string, segredo: string): string`, `soDigitos(codigo: string): string | null` (6 dígitos após tirar espaços/traços, senão null), `VALIDADE_CODIGO_MS = 600_000`; `COOKIE_APARELHO = 'eba_aparelho'`, `COOKIE_EMAIL_VERIFICADO = 'eba_email_verificado'`, `VALIDADE_APARELHO_MS = 2_592_000_000`, `VALIDADE_EMAIL_VERIFICADO_MS = 900_000`, `assinarMarca(emailHash: string, segredo: string, agora: number): string`, `lerMarca(valor: string | undefined, segredo: string, agora: number, validadeMs: number): { emailHash: string } | null`, `opcoesCookieMarca(validadeMs: number)` (= `OPCOES_COOKIE` + `maxAge` em segundos).

- [ ] **Step 1: Write the failing tests**: `gerarCodigo` sempre `/^\d{6}$/` (inclui zeros à esquerda com `randomInt` simulado devolvendo 42 → `'000042'`); `hashDoEmail('  Ana@X.com ', s) === hashDoEmail('ana@x.com', s)` e não contém "ana"; hash muda com o segredo; `hashDoCodigo` depende do `emailHash` (mesmo código, e-mails diferentes → hashes diferentes); `soDigitos('123 456') === '123456'`, `soDigitos(' 123-456\n') === '123456'`, `soDigitos('12345') === null`, `soDigitos('12a456') === null`; `lerMarca` aceita a marca dentro da validade, recusa adulterada, vencida (30 dias + 1 ms para o aparelho; 15 min + 1 ms para o e-mail verificado) e emitida mais de 60 s no futuro; `opcoesCookieMarca(VALIDADE_APARELHO_MS).maxAge === 2_592_000`. Os testes atuais de `sessao.test.ts` continuam passando sem mudança.
- [ ] **Step 2: Run** `npx jest src/lib/eba` — Expected: FAIL nos módulos novos.
- [ ] **Step 3: Implement** conforme Interfaces (`assinatura.ts` com o formato atual `base64url(json).base64url(hmac)` e `timingSafeEqual`).
- [ ] **Step 4: Run** `npx jest src/lib/eba` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(eba): código, hashes e marcas assinadas do aparelho`

### Task 5: Next — medição `confirmar_codigo`

**Files:**
- Modify: `next/src/lib/analytics/eventos.ts` (+ `eventos.test.ts`), `docs/analytics/README.md` (§3 e notas de GTM), `docs/analytics/gtm-container-adai.json` (gatilho com o evento novo)

**Interfaces:**
- Produces: evento `confirmar_codigo: { teste: string; resultado: 'ok' | 'errado' | 'esgotado' | 'vencido' }` em `EventosAnalytics` e `NOMES_EVENTOS`.

- [ ] **Step 1: Write the failing test** em `eventos.test.ts`: `NOMES_EVENTOS` contém `'confirmar_codigo'` e o gatilho do `gtm-container-adai.json` lista todos os `NOMES_EVENTOS` (se o teste já compara as listas, só rodar).
- [ ] **Step 2: Run** `npx jest src/lib/analytics` — Expected: FAIL.
- [ ] **Step 3: Implement** o tipo, o nome e a linha do plano (§3: "O aluno confere o código do e-mail | `teste`, `resultado` | Não"), o gatilho do GTM e a nota "reimportar o container".
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(medicao): evento confirmar_codigo`

### Task 6: Next — ações `pedirCodigo`, `confirmarCodigo`, `retomarCadastro`

**Files:**
- Modify: `next/src/app/(site)/eba/testes/[slug]/acoes.ts` (+ `acoes.test.ts`)

**Interfaces:**
- Consumes: Tasks 2, 3 e 4; `SessaoVisivel`, `abrirSessao`, `dentroDoLimite`, `configuracao` (existentes).
- Produces (substituem `identificar`, que sai):
  - `RespostaAcao<T>` passa a ser `{ ok: true; dados?: T } | { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' | 'verificacao' }` (`verificacao` = o e-mail precisa ser verificado de novo; a tela volta ao passo do e-mail).
  - `type Identificado = SessaoVisivel | { novo: true; turmas: Turma[] }`.
  - `pedirCodigo(email: string): Promise<RespostaAcao<Identificado | { codigoEnviado: true; emailMascarado: string }>>`.
  - `confirmarCodigo(email: string, codigo: string): Promise<RespostaAcao<Identificado> | { ok: false; erro: 'codigo'; resultado: 'errado' | 'esgotado' | 'vencido'; restantes: number }>`.
  - `retomarCadastro(email: string): Promise<RespostaAcao<Identificado>>` (exige `eba_email_verificado` do mesmo e-mail; usado pelo "Tentar de novo" do Primeiro acesso).
  - `cadastrar(...)` passa a exigir `eba_email_verificado` com `hashDoEmail(email)`; sem ele → `{ ok: false, erro: 'verificacao' }`. Ao abrir a sessão (cadastro ou código certo), grava `eba_aparelho` e apaga `eba_email_verificado`.
  - `sair()` apaga `eba_sessao` e `eba_aparelho`.
  - `configuracao()` passa a exigir também `emailConfigurado()` e `verificacaoConfigurada()`.

- [ ] **Step 1: Write the failing tests** (mockar `@/lib/strapi/verificacao` e `@/lib/email/mailersend`; manter os mocks atuais da API da EBA):
  - e-mail **cadastrado** e **não cadastrado** sem aparelho → a mesma resposta `{ ok: true, dados: { codigoEnviado: true, emailMascarado: 'a***@exemplo.com' } }`, `alunoPorEmail` **não** chamado, `enviarEmail` chamado uma vez com o assunto do código, nenhum cookie de sessão.
  - limite do Strapi (`'limite'`) → mesma resposta e `enviarEmail` não chamado.
  - MailerSend ou Strapi fora → `{ ok: false, erro: 'indisponivel' }`; nenhum log com o e-mail.
  - aparelho lembrado **para o mesmo e-mail** (`"  ANA.SILVA@exemplo.com "`) → comportamento do antigo `identificar` (sessão ou `{ novo, turmas }`), sem e-mail enviado. **Outro e-mail** com o aparelho da ana → manda código.
  - `confirmarCodigo` com `'123 456'` envia ao Strapi o hash de `'123456'`; `'12345'` → `invalido` sem chamar o Strapi.
  - `ok` + aluno cadastrado → `SessaoVisivel`, cookies `eba_sessao` e `eba_aparelho` (maxAge 2 592 000) gravados; `ok` + e-mail novo → `{ novo: true, turmas }` e cookie `eba_email_verificado` (maxAge 900).
  - `errado` → `{ ok: false, erro: 'codigo', resultado: 'errado', restantes: 3 }`; `vencido` (inclusive código antigo depois de reenviar) e `esgotado` repassados; nenhum cookie gravado.
  - `cadastrar` sem `eba_email_verificado`, ou com a marca de outro e-mail → `verificacao`, sem chamar `cadastrarAluno`.
  - `sair` apaga os dois cookies no `path` `/eba/testes`.
  - sem `MAILERSEND_API_TOKEN` ou sem `STRAPI_TOKEN_VERIFICACAO` → `indisponivel` em `pedirCodigo`.
- [ ] **Step 2: Run** `npx jest "src/app/\(site\)/eba/testes/\[slug\]/acoes.test.ts"` — Expected: FAIL.
- [ ] **Step 3: Implement** conforme Interfaces; `pedirCodigo` e `confirmarCodigo` usam o limite por IP de 10/min já existente.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(eba): pedir e confirmar código antes da sessão e do cadastro`

### Task 7: Next — passo `codigo` na tela, vitrine e protótipo

**Files:**
- Modify: `next/src/components/eba/Questionario/estado.ts` (+ teste), `Identificacao.tsx`, `Questionario.tsx` (+ `Questionario.test.tsx`), `QuestionarioVitrine.tsx`, `Questionario.mock.json`, `Questionario.module.css` (só se precisar)
- Modify: `next/src/app/(site)/eba/testes/[slug]/page.tsx` (passa as ações novas), `docs/prototipo/eba/estados.html` (estado "Código", selo **Proposto**), `docs/componentes/questionario-eba.md`

**Interfaces:**
- Consumes: ações do Task 6; `confirmar_codigo` do Task 5.
- Produces: `Estado` ganha `'codigo'`; `Acao` ganha `{ tipo: 'codigoEnviado'; email: string; emailMascarado: string }` e `{ tipo: 'outroEmail' }`; `EstadoQuestionario.verificacao: { email: string; emailMascarado: string } | null` (só memória). `QuestionarioProps['acoes']` troca `identificar` por `pedirCodigo`, `confirmarCodigo`, `retomarCadastro`. Componente `ConfirmarCodigo({ email, emailMascarado, confirmar, reenviar, onIdentificado, onNovo, onOutroEmail, onResultado, tituloRef })` em `Identificacao.tsx`.

- [ ] **Step 1: Write the failing tests**
  - `estado.test.ts`: `codigoEnviado` vai para `'codigo'` guardando `verificacao`; `outroEmail` volta a `'email'` e limpa `verificacao`; `identificado`/`novoAluno` limpam `verificacao`; `progressoDe` **não** contém o e-mail.
  - `Questionario.test.tsx`: e-mail → tela "Digite o código" com "Enviamos um código de 6 dígitos para a\*\*\*@email.com." e foco no título; campo com `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength=6` e rótulo; código certo → perguntas (ou Primeiro acesso); errado → "Código incorreto. Você tem mais 3 tentativas." em `aria-live` e campo limpo; vencido → "Este código não vale mais. Enviamos um novo?" com "Enviar novo código"; "Reenviar código" desabilitado até 60 s (`jest.useFakeTimers`) com "reenvie em N s"; "Usar outro e-mail" volta ao e-mail; colar "123 456" chama `confirmarCodigo(email, '123 456')`; **dois cliques rápidos em "Confirmar" → uma chamada só** e nenhum erro depois do sucesso; `registrarEvento('confirmar_codigo', { teste, resultado })` em cada resposta; o e-mail nunca aparece no `sessionStorage` nem no DataLayer; `auditarAcessibilidade(container)` sem achados no passo do código.
  - Vitrine: tela `codigo` renderiza sem chamar ações reais.
- [ ] **Step 2: Run** `npx jest src/components/eba/Questionario` — Expected: FAIL.
- [ ] **Step 3: Implement** conforme Interfaces e os textos das Global Constraints; o `Identificacao` chama `pedirCodigo` e trata as três respostas (sessão, novo, código enviado); `Cadastro` usa `retomarCadastro` no "Tentar de novo" e volta ao e-mail em `verificacao`; "Não é você?" e "Sair" continuam chamando `sair` (que agora esquece o aparelho). Documentar o passo, os cookies e o evento em `questionario-eba.md`; estado "Código" no protótipo como **Proposto**.
- [ ] **Step 4: Run** `npx jest src/components/eba src/app` e `npx tsc --noEmit` — Expected: PASS, sem erros de tipo.
- [ ] **Step 5: Commit** `feat(eba): passo do código por e-mail no questionário`

### Task 8: Variáveis, documentação, gates e PR

**Files:**
- Modify: `next/.env.example`, `README.md` (tabela de variáveis e checklist de produção), `next/src/__tests__/caracteristicas/seguranca-e-privacidade.test.ts`, `docs/superpowers/specs/2026-10-20-migracao-eba-2-testes-design.md` (§5.3 e §6 apontam para o passo do código), `strapi/data/adai-conteudo.tar.gz` (só com o ok do Jonatan)

- [ ] **Step 1: Write the failing test** em `seguranca-e-privacidade.test.ts`: `MAILERSEND_API_TOKEN` e `STRAPI_TOKEN_VERIFICACAO` aparecem no `.env.example` sem valor e nenhum arquivo de `src/` usa `NEXT_PUBLIC_MAILERSEND` nem `NEXT_PUBLIC_STRAPI_TOKEN`.
- [ ] **Step 2: Run** `npx jest src/__tests__/caracteristicas/seguranca-e-privacidade.test.ts` — Expected: FAIL até o `.env.example` ter as duas linhas.
- [ ] **Step 3: Implement** as duas variáveis no `.env.example` (comentário: token exclusivo do Hub, só envio; token "Custom" do Strapi só com `emitir`/`conferir`) e na tabela do README; no checklist de produção, criar os dois tokens e guardá-los no cofre.
- [ ] **Step 4: Gates** (saída desta sessão): `cd next && yarn quality` e `yarn build`; `cd strapi && yarn build`; com os dois servidores e um token do MailerSend de teste: `cd next && yarn smoke`, e o fluxo no navegador em 375/768/1440 (e-mail → código recebido → perguntas; código errado; reenviar; aparelho lembrado num segundo teste), console sem erros, sem rolagem lateral, eventos `confirmar_codigo` no `window.dataLayer`.
- [ ] **Step 5: Snapshot** — perguntar ao Jonatan antes de `cd strapi && yarn data:export` (o seed não muda; o schema muda). Se autorizado: exportar com o Strapi parado, revisar (sem admins, tokens ou registros de `verificacoes_eba`) e commitar.
- [ ] **Step 6: Commit e PR** — `git add` com caminhos explícitos; `chore(eba): variáveis do código por e-mail e documentação`; push na `feat/eba-testes` (conta jonatanc: `GH_TOKEN=$(gh auth token -u jonatanc)`); atualizar o PR #15: a linha 🔴 vira ✅ com o que foi testado e o que falta em homologação (envio real, SPF/DKIM, painel atual).
