# Migração da EBA — entrega 2: testes do CDV no Hub — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans`, tarefa por tarefa. Passos com checkbox (`- [ ]`).

**Objetivo:** os 5 testes do CDV são respondidos em `/eba/testes/<slug>` no Hub. O resultado é gravado e calculado pela API atual da EBA, que o Hub chama só pelo servidor, via API Management.

**Arquitetura:**
- **Integração `lib/eba-api/`**, só no servidor: client APIM, perguntas, alunos, turmas e respostas.
- **Sessão do aluno:** cookie de sessão assinado, com no máximo 2 h.
- **Server Actions** para identificar, cadastrar, enviar e sair.
- **Ilha cliente `Questionario`:** um reducer puro de estados mais componentes de apresentação, com o progresso no `sessionStorage`.
- **Página `/eba/testes/[slug]`:** abertura vinda do Strapi (tipo `teste`) e perguntas vindas da API.

**Stack:** Next 16.3.8 (App Router, Server Actions) · React 19 · TypeScript strict · CSS Modules + tokens · `zod` (já no projeto) · `node:crypto` · Jest + Testing Library · Strapi 5.56.

**Spec:** `docs/superpowers/specs/2026-10-20-migracao-eba-2-testes-design.md` (ler inteira). Protótipo aprovado: `docs/prototipo/eba/teste-dons-servico.html`.

## Restrições globais

**Regras do projeto**
- Valem `AGENTS.md` e `.agents/rules/`: 5 pilares, TDD, tokens, mobile-first 769/1024, WCAG 2.2 AA e Server Components por padrão.
- **Branch:** `feat/eba-testes`, criada a partir de `feat/eba-editorial`, local. Parar o `strapi develop` antes de trocar de branch.
  - Commits locais por tarefa.
  - Push, PR, snapshot do Strapi e qualquer ação no Azure só com pedido explícito do usuário.

**Variáveis e segurança**
- Variáveis só de servidor:
  - `EBA_API_URL` (ex.: `https://eba-adai-api.azure-api.net`);
  - `EBA_API_KEY`, que vai no header `Ocp-Apim-Subscription-Key`;
  - `EBA_SESSAO_SEGREDO`, com no mínimo 32 caracteres.
- Nunca `NEXT_PUBLIC_`. Documentar em `next/.env.example`, sem valores.
- **Endpoints (prefixo `/api/v1/eba`):**
  - `GET Question/{id}`;
  - `GET Student/email/{email}`;
  - `POST Student` (`name`, `email`, `room`, `idClass`);
  - `GET ClassEBA`;
  - `POST SurveyResponse` (`{ responseQuestionList: [{ idStudent, idClass, idQuestion, numberQuestion, rate }] }`).
- **Sessão:**
  - cookie `eba_sessao`, `httpOnly`, `secure` em produção, `sameSite=lax`, `path=/eba/testes`;
  - **sem** `maxAge`/`expires`;
  - validade de 2 h (`7_200_000` ms), conferida no servidor.
- **Limite de identificação:** 10 tentativas por minuto por IP.

**Testes e conteúdo**

| Slug | idQuestion | Tipo |
| --- | --- | --- |
| `dons-servico` | `80cd890e-e0c2-45f2-84ac-2447185e85c3` | `nota` 0–5 |
| `dons-ministerio` | `f055b0b0-c5e4-46bf-a778-93ea00c02826` | `nota` 0–5 |
| `talentos-naturais` | `49850007-06ae-49ad-ac22-6d2527404059` | `talentos`: marca, depois escolhe até 3 |
| `estilo-pessoal` | `e6bb31ca-7151-4c1f-8815-7f794e0c5bb4` | `estilo`: 7 + 7 pares, escala 1–5 |
| `temperamento-pessoal` | `8699a220-0588-4c3f-8609-e1be453d2edd` | `temperamento`: 4 grupos × 50, páginas de 10 |

- **Rótulos da escala 0–5:**
  - Nunca, Raramente, Às vezes, Frequentemente, Muito, Eu brilho nisso!;
  - o nome acessível de cada opção fica "N — Rótulo".
- **Unidades (`room`):**
  - valores, na ordem: `campestre`, `colorado`, `sbc`, `santos`, `adai-on`, `outra-igreja`, `visitante`;
  - rótulos: Campestre, Anália Franco, São Bernardo do Campo, Santos, ADAI On, Outra igreja, Visitante.
  - **Anália Franco grava `colorado`** (decisão do usuário em 2026-10-20: Anália Franco substitui Colorado). O valor antigo é mantido para que os alunos já cadastrados e o painel continuem consistentes.
- **Ordem da apostila:** dons-servico, dons-ministerio, talentos-naturais, estilo-pessoal, temperamento-pessoal. Define o "Teste N de 5" e o "Próximo teste".

**Medição**
- Eventos novos: `iniciar_teste` `{ teste: slug }` e `concluir_teste` `{ teste: slug }`.
- `data-section="teste-eba"` na tela.
- Sem dado pessoal no DataLayer, nos logs ou no `localStorage`.

## Foco da revisão

O que a spec implica e nenhum teste óbvio cobre. Cada item ganha um teste na tarefa dona.

1. **E-mail com maiúsculas ou espaços** (`  Ana@Email.com `). Deve virar `ana@email.com` antes de buscar e cadastrar, para não criar um aluno duplicado na API. Tarefa 3.
2. **Recarregar no meio do teste e voltar a uma pergunta.** A resposta já dada aparece marcada e a contagem não muda. Uma chave do `sessionStorage` de outro teste não vaza. Tarefa 7.
3. **Sessão que vence (mais de 2 h) entre a última pergunta e o envio.** O envio não grava com ids antigos. Mostra "Sessão encerrada" e mantém as respostas. Tarefa 5.
4. **Duplo clique em "Enviar" ou em "Tentar de novo".** Gera um único envio, com o botão desabilitado enquanto envia. Tarefa 7.
5. **Talentos sem nenhuma habilidade escolhida, ou tentativa de escolher uma 4ª.** Não envia com zero escolhidas e a 4ª fica desabilitada. Tarefa 7.

---

### Tarefa 0: Preparação

- [ ] Parar o `strapi-eba` e o `next-eba`. Criar a branch: `git -C C:/ADAI/ADAI-Hub-eba switch -c feat/eba-testes`.
- [ ] Adicionar ao `next/.env.example` as 3 variáveis `EBA_*`, comentadas e sem valores.

### Tarefa 1: Definição dos testes como dados

**Arquivos**
- Criar `next/src/lib/eba-api/testes.ts`.
- Criar `next/src/lib/eba-api/conteudo-local.ts`, que copia, como dados, do site atual (`eba-adai/src/utils/content/tests/`):
  - `estilo-pessoal.ts`: `motivacao`, `organizacao` e as descrições de resultado;
  - `temperamento.ts`: as 4 listas de opções;
  - `temperamento-table.ts`: `getDescription`.
- Testes em `next/src/lib/eba-api/testes.test.ts`.

**Interfaces (produz)**

```ts
export type TipoTeste = 'nota' | 'talentos' | 'estilo' | 'temperamento';
export type SlugTeste = 'dons-servico' | 'dons-ministerio' | 'talentos-naturais' | 'estilo-pessoal' | 'temperamento-pessoal';
export interface DefinicaoTeste { slug: SlugTeste; nome: string; idQuestion: string; tipo: TipoTeste; ordem: number }
export const TESTES: readonly DefinicaoTeste[];
export function definicaoDoTeste(slug: string): DefinicaoTeste | null;
export function proximoTeste(slug: SlugTeste): DefinicaoTeste | null; // null no último
export const ESCALA_NOTA: readonly { valor: 0|1|2|3|4|5; rotulo: string }[];
export const UNIDADES: readonly { valor: string; rotulo: string }[];
// conteudo-local.ts
export const PARES_ESTILO: { motivacao: ParEstilo[]; organizacao: ParEstilo[] }; // ParEstilo = { titulo, esquerda, direita }
export const GRUPOS_TEMPERAMENTO: { numero: 1|2|3|4; nome: 'Sanguíneo'|'Colérico'|'Melancólico'|'Fleumático'; opcoes: string[] }[];
export function descricaoDoEstilo(mensagem: string): string | null;
export function descricaoDoTemperamento(nome: string): string | null;
```

- [ ] **Passo 1: testes que falham.**
  - `TESTES` tem os 5 slugs na ordem da apostila, com os `idQuestion` da tabela.
  - `definicaoDoTeste('x')` devolve `null`.
  - `proximoTeste('temperamento-pessoal')` devolve `null` e `proximoTeste('dons-servico')?.slug === 'dons-ministerio'`.
  - `ESCALA_NOTA` tem 6 rótulos exatos.
  - `UNIDADES` tem os valores da restrição global.
  - `PARES_ESTILO.motivacao.length === 7` e `organizacao.length === 7`.
  - Cada grupo de temperamento tem 50 opções.
  - As descrições devolvem texto para as 4 combinações de estilo e para os 4 temperamentos.
- [ ] **Passo 2:** `yarn test src/lib/eba-api/testes.test.ts` falha porque o módulo não existe.
- [ ] **Passo 3:** implementar copiando os dados do site atual, só como dados, sem lógica de UI.
- [ ] **Passo 4:** o teste passa.
- [ ] **Passo 5:** commit `feat(eba): definição dos 5 testes do CDV como dados`.

### Tarefa 2: Client da API via APIM

**Arquivos:** criar `next/src/lib/eba-api/client.ts` e `tipos.ts`; testes em `client.test.ts`.

**Interfaces (produz)**

```ts
export class EbaApiError extends Error { constructor(readonly status: number, readonly codigo: string | null) }
export class EbaApiIndisponivel extends Error {} // variáveis ausentes, rede ou timeout
export function ebaApiConfigurada(): boolean;
export async function ebaFetch<T>(caminho: string, init?: { metodo?: 'GET'|'POST'; corpo?: unknown; cache?: { revalidate: number; tags: string[] } }): Promise<T>;
```

- [ ] **Passo 1: testes que falham.**
  - A URL vira `${EBA_API_URL}/api/v1/eba/${caminho}`, sem barra dupla.
  - O header `Ocp-Apim-Subscription-Key` recebe a chave e `Content-Type` é JSON no POST.
  - Timeout de 10 s → `EbaApiIndisponivel`.
  - Sem variáveis → `ebaApiConfigurada() === false`, e `ebaFetch` lança `EbaApiIndisponivel` sem chamar o `fetch`.
  - 4xx/5xx → `EbaApiError`, com o `codigo` tirado de `Erros[0].Code` quando existir.
  - O GET leva `next: { revalidate, tags }`. O POST leva `cache: 'no-store'`.
  - A mensagem de erro não contém o corpo enviado (que tem o e-mail).
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar com `AbortSignal.timeout(10_000)`.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): client da API da EBA via API Management`.

### Tarefa 3: Perguntas, alunos, turmas e respostas

**Arquivos:**
- criar em `next/src/lib/eba-api/`: `perguntas.ts`, `alunos.ts`, `turmas.ts` e `respostas.ts`, cada um com o seu `.test.ts`;
- fixtures em `next/src/lib/eba-api/__fixtures__/`, com o JSON real da API. Gravar as respostas de GET com `curl` no APIM; o POST vem do formato do site atual.

**Interfaces (consome):** `ebaFetch`, `definicaoDoTeste`.

**Interfaces (produz)**

```ts
export interface Pergunta { numero: number; texto: string }
export async function perguntasDoTeste(slug: SlugTeste): Promise<Pergunta[]>; // GET Question/{idQuestion}; cache 3600 s, tag 'eba-testes'; ordenadas por numero
export function normalizarEmail(email: string): string; // trim + lowercase
export async function alunoPorEmail(email: string): Promise<{ idStudent: string; idClass: string } | null>; // 404 → null
export async function cadastrarAluno(dados: { nome: string; email: string; unidade: string; idTurma: string }): Promise<{ idStudent: string; idClass: string }>;
export interface Turma { id: string; nome: string }
export async function turmasAtivas(): Promise<Turma[]>; // GET ClassEBA; cache 600 s; ordenadas por nome
export interface ItemResultado { nome: string; total: number; mensagem: string | null }
export type Resultado = { tipo: 'pontuacao'; itens: ItemResultado[]; maximo: number } | { tipo: 'estilo'; combinacao: string; descricao: string | null; motivacao: number; organizacao: number };
export async function enviarRespostas(e: { slug: SlugTeste; idStudent: string; idClass: string; respostas: { numero: number; nota: number }[] }): Promise<Resultado>;
```

- [ ] **Passo 1: testes que falham.**
  - `perguntasDoTeste('dons-servico')` devolve 55 perguntas ordenadas a partir da fixture e pede `Question/80cd890e-…`.
  - `normalizarEmail('  Ana@Email.com ') === 'ana@email.com'`. **Foco 1:** `alunoPorEmail` busca com o e-mail normalizado e codificado na URL.
  - `alunoPorEmail` com 404 devolve `null`, e com 500 lança.
  - `cadastrarAluno` faz POST com `{ name, email (normalizado), room, idClass }`.
  - `turmasAtivas` devolve só id e nome.
  - **Resultado:**
    - em `enviarRespostas`, cada item enviado leva `idQuestion` do teste e `numberQuestion`/`rate`;
    - nos testes de pontuação, os itens voltam ordenados por `total` decrescente;
    - `maximo` é 25 para nota, 3 para talentos e 50 para temperamento;
    - no estilo, `tipo: 'estilo'` com `combinacao` = `message` da API e `descricao` vinda de `descricaoDoEstilo`;
    - no temperamento, a `mensagem` de cada item vem de `descricaoDoTemperamento`.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar (um arquivo por recurso).
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): perguntas, alunos, turmas e respostas da API da EBA`.

### Tarefa 4: Sessão do aluno e limite de tentativas

**Arquivos:** criar `next/src/lib/eba/sessao.ts` e `next/src/lib/eba/limite.ts`, cada um com o seu `.test.ts`.

**Interfaces (produz)**

```ts
export interface SessaoAluno { idStudent: string; idClass: string; emailMascarado: string; emitidoEm: number }
export const COOKIE_SESSAO = 'eba_sessao';
export const VALIDADE_SESSAO_MS = 7_200_000;
export function mascararEmail(email: string): string;          // 'ana@email.com' → 'a***@email.com'
export function assinarSessao(s: SessaoAluno, segredo: string): string;   // base64url(json).base64url(hmac-sha256)
export function lerSessao(valor: string | undefined, segredo: string, agora: number): SessaoAluno | null; // assinatura inválida ou expirada → null
export const OPCOES_COOKIE: { httpOnly: true; sameSite: 'lax'; path: '/eba/testes'; secure: boolean }; // sem maxAge
// limite.ts
export function criarLimitador(max: number, janelaMs: number): (chave: string, agora: number) => boolean; // true = permitido
```

- [ ] **Passo 1: testes que falham.**
  - assina e lê a mesma sessão;
  - um byte trocado no payload ou na assinatura → `null`;
  - `agora - emitidoEm > 7_200_000` → `null`, e exatamente 2 h ainda vale;
  - `OPCOES_COOKIE` não tem `maxAge` nem `expires`;
  - a comparação usa `timingSafeEqual`, coberta pelo caso de assinatura com tamanho diferente → `null` sem lançar;
  - `mascararEmail` funciona com usuário de 1 letra;
  - o limitador permite 10 tentativas, nega a 11ª no mesmo minuto e libera depois da janela.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar com `node:crypto` (`createHmac`, `timingSafeEqual`).
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): sessão assinada do aluno e limite de tentativas`.

### Tarefa 5: Server Actions

**Arquivos:** criar `next/src/app/(site)/eba/testes/[slug]/acoes.ts` (`'use server'`); testes em `acoes.test.ts`, com `next/headers` simulado.

**Interfaces (consome):** Tarefas 3 e 4. Lê o IP de `x-forwarded-for` (primeiro valor), ou `'local'`.

**Interfaces (produz)**

```ts
export type RespostaAcao<T = undefined> = { ok: true; dados?: T } | { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' };
export async function identificar(email: string): Promise<RespostaAcao<{ emailMascarado: string } | { novo: true; turmas: Turma[] }>>;
export async function cadastrar(dados: { email: string; nome: string; unidade: string; idTurma: string }): Promise<RespostaAcao<{ emailMascarado: string }>>;
export async function enviar(slug: string, respostas: { numero: number; nota: number }[]): Promise<RespostaAcao<Resultado>>;
export async function sair(): Promise<void>;
export async function sessaoAtual(): Promise<{ emailMascarado: string } | null>;
```

- [ ] **Passo 1: testes que falham.**
  - **Validação com zod:**
    - e-mail inválido ou com mais de 254 caracteres → `invalido`;
    - nome com menos de 3 ou mais de 100 caracteres → `invalido`;
    - unidade fora de `UNIDADES` → `invalido`;
    - turma fora de `turmasAtivas()` → `invalido`.
  - `identificar` com e-mail existente grava o cookie e devolve só `emailMascarado`, sem nome nem turma. Com e-mail novo, devolve `{ novo: true, turmas }` e não grava cookie.
  - A 11ª chamada de `identificar` no minuto devolve `limite`.
  - E-mail novo com `turmasAtivas()` falhando → `indisponivel`. A tela orienta a tentar de novo e não oferece o cadastro sem turmas.
  - **`enviar`:**
    - usa `idStudent`/`idClass` **da sessão**; o corpo não tem ids vindos do cliente;
    - sem sessão ou sessão expirada → `sessao` (**Foco 3**), sem chamar a API;
    - respostas incompletas, fora da faixa ou com número repetido → `invalido`. A validação por tipo (nota 0–5 e 55 itens nos dons de serviço…) usa `perguntasDoTeste`/`TESTES`;
    - `EbaApiError` 400 → `recusado`; `EbaApiIndisponivel` ou 5xx → `indisponivel`.
  - `sair` apaga o cookie.
  - Nenhum `console.*` recebe o e-mail: o teste espia o `console` e procura o e-mail em todas as chamadas.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): ações de identificar, cadastrar, enviar e sair`.

### Tarefa 6: Fotos dos testes

**Arquivos**
- Criar `next/scripts/converter-fotos-testes.mjs` (usa `sharp`).
- Criar `next/public/eba/testes/<slug>/{capa,1..N,resultado}.webp` e `next/public/eba/testes/identificacao.webp`.
- Criar `next/src/lib/eba/fotos-testes.ts` e o seu `.test.ts`.

**Origem das fotos:** `C:/ADAI/eba-adai/public/assets/testes/`.

| Pasta de origem | Teste | Fotos por pergunta |
| --- | --- | --- |
| `dons/` | dons-servico | 55 (`CAPA`, `RESULTADO`) |
| `dons-ministerio/` | dons-ministerio | 25 |
| `estilo-pessoal/` | estilo-pessoal | 14 |
| `temperamento-pessoal/` | temperamento-pessoal | 20 (uma por página de 10) |
| `teste-talentos-naturais/foto.webp` | talentos-naturais | capa = resultado = única foto |

A foto `login-student.jpg` vira `identificacao.webp`. Todas vão para WebP com no máximo 1200 px e qualidade 72.

**Interface (produz)**

```ts
export function fotoDoTeste(slug: SlugTeste, momento: 'capa' | 'resultado' | 'identificacao' | { pergunta: number }): string; // caminho em /eba/testes/...; sem foto da pergunta → capa
```

- [ ] **Passo 1: testes que falham.**
  - os caminhos de cada momento;
  - pergunta sem foto → capa;
  - um teste de característica que confere que todo arquivo apontado por `fotoDoTeste` existe em `public/` e pesa até 120 KB.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** rodar o script, conferir o total em MB e implementar o mapa.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): fotos dos testes convertidas para WebP`.

### Tarefa 7: Questionário (ilha cliente) + vitrine

**Arquivos**
- Criar em `next/src/components/eba/Questionario/`:
  - `estado.ts`: reducer puro;
  - `Questionario.tsx` (`'use client'`);
  - `PerguntaNota.tsx`, `PerguntaMarcar.tsx` (talentos e temperamento), `PerguntaEstilo.tsx`;
  - `Identificacao.tsx`, `Resultado.tsx`;
  - `Questionario.module.css`;
  - `Questionario.showcase.tsx` e `Questionario.mock.json`;
  - testes.
- Criar `docs/componentes/questionario-eba.md`, com Medição e Testes, e incluir no README.

**Interfaces (consome):** ações da Tarefa 5 (recebidas por props, para testar sem servidor), `fotoDoTeste`, `ESCALA_NOTA`, `PARES_ESTILO`, `GRUPOS_TEMPERAMENTO`, `proximoTeste`.

**Interfaces (produz)**

```ts
export interface QuestionarioProps {
  teste: DefinicaoTeste; abertura: { resumo: string; perguntas: string | null; resposta: string | null; comoResponder: string | null; aula: string | null };
  perguntas: Pergunta[]; sessao: { emailMascarado: string } | null;
  acoes: { identificar: typeof identificar; cadastrar: typeof cadastrar; enviar: typeof enviar; sair: typeof sair };
}
export type Estado = 'abertura' | 'email' | 'cadastro' | 'pergunta' | 'enviando' | 'resultado' | 'erro' | 'expirou';
export function reducer(s: EstadoQuestionario, a: Acao): EstadoQuestionario; // em estado.ts
export const chaveProgresso = (slug: SlugTeste) => `eba-teste:${slug}`;
```

**Regras da UI (do protótipo)**
- Layout em grade: caixa cinza mais foto, com o mesmo raio (`--radius-lg`), gap `--space-12`, mesma altura a partir de 1024 px e faixa 16:9 acima no celular.
- `h1` com o nome do teste. "Teste N de 5 · Aula X do CDV".
- Barra de progresso com `role="progressbar"`.
- **Nota:** radios nativos; escolher avança. **Estilo:** 5 radios. **Marcar:** checkboxes.
- O foco vai para a `legend` a cada troca de pergunta.
- Talentos tem duas etapas: marcar e depois escolher até 3 entre as marcadas.
- Temperamento em páginas de 10, com "Próximo".
- "Respondendo como a***@…" mais "Trocar e-mail" com sessão. "Sair" no resultado.
- O resultado mostra barras proporcionais a `maximo`, com os 3 primeiros em destaque, a mensagem do primeiro e "Próximo teste: <nome>" (não aparece no último).
- `data-section="teste-eba"`.
- **Identificação:**
  - texto "Usamos seu e-mail só para ligar suas respostas à sua turma." com link para `/politica-de-privacidade`;
  - campo com `autocomplete="email"` e `inputmode="email"`.
- **Mensagens por erro da ação:**

| Erro | Mensagem |
| --- | --- |
| `invalido` | "Confira os campos destacados." |
| `limite` | "Muitas tentativas. Aguarde um minuto." |
| `indisponivel` na identificação | "Não conseguimos verificar agora. Tente em alguns minutos." |
| `recusado` | "Algumas respostas não foram aceitas." |

- **Fotos:** a foto troca com o estado e a pergunta (`fotoDoTeste`). A da próxima pergunta é pré-carregada com `<link rel="preload" as="image">` ou `new Image()`.

- [ ] **Passo 1: testes que falham.**
  - **Reducer:** transições de cada estado.
  - **Avançar e voltar:**
    - voltar mantém a resposta marcada;
    - **Foco 2:** recarregar restaura do `sessionStorage` só a chave do próprio slug, e `respondidas` não duplica.
  - **Envio:**
    - **Foco 4:** dois cliques em "Enviar" → `acoes.enviar` chamado uma vez, com o botão `disabled` enquanto envia;
    - `erro: 'sessao'` → estado `expirou`, com as respostas mantidas;
    - `indisponivel` → estado `erro`, com "Tentar de novo".
  - **Talentos (Foco 5):** a 4ª escolha fica `disabled` e "Concluir" fica desabilitado com zero escolhidas.
  - **Nomes acessíveis:** "0 — Nunca"… e no estilo "1 — mais perto de: <frase da esquerda>".
  - **Ao concluir:** limpa o `sessionStorage`.
  - **Medição:** `iniciar_teste` dispara uma vez, na primeira pergunta; `concluir_teste` dispara ao mostrar o resultado. Os dois via `registrarEvento`.
  - **Vitrine:**
    - variantes `abertura`, `pergunta-nota`, `estilo`, `temperamento`, `resultado` e `erro`, mais o controle "tipo de teste";
    - o teste de característica de a11y/SEO da vitrine passa.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar. O CSS usa só tokens: para o raio, `--radius-lg`, `--radius-md` e `--radius-sm`; nada de `--font-size-h2` (regra do design system).
- [ ] **Passo 4:** os testes passam, junto com `yarn test src/__tests__/caracteristicas`.
- [ ] **Passo 5:** commit `feat(eba): questionário dos testes com sessão, progresso e fotos`.

### Tarefa 8: Página `/eba/testes/[slug]`

**Arquivos:**
- criar `next/src/app/(site)/eba/testes/[slug]/page.tsx` e `page.module.css`;
- teste de integração em `next/src/__tests__/integracao/eba-testes.test.tsx`;
- modificar `next/src/lib/strapi/queries/testes.ts`.

**Interfaces (consome):**
- `definicaoDoTeste`, `perguntasDoTeste`, `sessaoAtual` e as ações;
- o texto da abertura vem do tipo `teste` do Strapi, via `getTesteBySlug`.

**Interface (produz):** `export async function getTesteBySlug(slug: string): Promise<TesteView | null>`.

- [ ] **Passo 1: testes que falham** (Strapi e API simulados).
  - Cada um dos 5 slugs responde com `h1` = nome, trilha "ADAI › EBA › Testes › <nome>" e `robots: { index: false, follow: false }` no metadata.
  - Slug fora da lista → 404, sem chamar a API.
  - **Indisponibilidade** (nunca 404):
    - API fora → a abertura aparece, e "Começar" mostra "Não conseguimos carregar as perguntas agora. Tente em alguns minutos.";
    - sem variáveis → "Testes indisponíveis no momento", com link para `/eba/testes`.
  - O teste de sitemap confirma que `/eba/testes/` não entra.
  - **Característica:** um teste novo garante que nenhum arquivo em `src/` usa `NEXT_PUBLIC_EBA_`.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar. As perguntas são buscadas no servidor e entregues prontas à ilha. A rota não entra em `app/sitemap.ts`.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(eba): página /eba/testes/[slug]`.

### Tarefa 9: Medição no GTM e na documentação

**Arquivos:**
- modificar `next/src/lib/analytics/eventos.ts`, adicionando `iniciar_teste` e `concluir_teste` com `{ teste: string }`, mais os testes;
- modificar `docs/analytics/gtm-container-adai.json`: gatilho e variável `DLV - teste`;
- modificar `docs/analytics/README.md`: tabela e `concluir_teste` como evento-chave.

- [ ] **Passo 1:** testes que falham.
  - `eventos.test.ts`: os 2 nomes estão no contrato.
  - O teste do contrato do GTM (`eventos.test.ts`, que já existe) cobre o gatilho com os novos nomes e a variável `DLV - teste`.
- [ ] **Passo 2:** os testes falham.
- [ ] **Passo 3:** implementar. Editar o JSON do GTM por script, como no merge da `main`, mantendo os ids únicos.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** commit `feat(analytics): eventos iniciar_teste e concluir_teste`.

### Tarefa 10: Seed v21, smoke e redirecionamentos

**Arquivos**
- Modificar `strapi/src/bootstrap/seed-eba.ts`: `link_teste: '/eba/testes/<slug>'`.
- Modificar `strapi/src/bootstrap/seed.ts`: `SEED_VERSION = 21`.
- Modificar `next/src/__tests__/integracao/seed-eba.test.ts`.
- Modificar `next/scripts/smoke.mjs`: incluir `/eba/testes/dons-servico`.
- Modificar `docs/componentes/lista-testes.md`.
- No worktree `C:/ADAI/eba-adai-hub` (branch `feat/redirecionar-para-hub`), modificar `redirecionamentos.mjs` e o seu teste.

- [ ] **Passo 1: testes que falham.**
  - **Seed:** o `link_teste` de cada teste é `/eba/testes/${slug}`. O teste do conteúdo que exigia o link do site atual passa a exigir o caminho interno.
  - **Redirecionamentos:** ligado, `{ source: '/teste/:slug', destination: `${base}/eba/testes/:slug`, statusCode: 301 }`. O teste que impedia `/teste/:path*` de redirecionar passa a impedir só `/dna`, `/login` e `/dashboard/:path*`.
- [ ] **Passo 2:** os testes falham. Rodar `yarn test` (next) e `node --test redirecionamentos.test.mjs` (eba-adai-hub).
- [ ] **Passo 3:** implementar. Atualizar o doc da lista de testes: o botão agora abre o teste no Hub.
- [ ] **Passo 4:** os testes passam.
- [ ] **Passo 5:** dois commits, um em cada repositório:
  - `feat(eba): testes abrem no Hub (seed v21)`;
  - `feat: QR codes dos testes redirecionam para o Hub`.

### Tarefa 11: Verificação final

- [ ] `yarn quality` (next), `yarn build` (next e strapi).
- [ ] Subir os servidores. O Strapi aplica o seed v21. Rodar `yarn smoke`.
- [ ] **Sem chave do APIM:** conferir no navegador os 5 testes, em 375, 768 e 1440:
  - estado "Testes indisponíveis";
  - abertura com foto;
  - nenhuma chamada da aba Network para `azure-api.net` ou `azurewebsites.net`.
- [ ] **Com aprovação do usuário:**
  - criar a assinatura `adai-hub` no APIM;
  - pôr a chave no `.env` local, sem exibir no chat;
  - fazer um teste completo com e-mail e turma de teste combinados com a EBA;
  - conferir o resultado no painel atual.
- [ ] Revisão da branch inteira (`requesting-code-review`) e atualização da spec com o que mudou.
