# Controle do projeto — ADAI Hub

> Atualizado em **17/10/2026** (Sábado 1 do hackathon). Quem mexe numa frente atualiza a própria linha no mesmo PR.
> Marcos: **24/10** integração em homologação · **09/11** congelamento · **13–14/11** lançamento (Conferência de Voluntários).
> Contexto das squads: `docs/hackathon/2026-10-17-hackathon-adai-tech.md`.

## 1. Quem está fazendo o quê

| Dev | Frente | Squad | Entrega macro | Status | Branch / PR |
| --- | --- | --- | --- | --- | --- |
| **Diogo** | Página de **Agenda** | Experiência / Eventos | Página `/agenda` com os eventos da inChurch (base: seção Próximos eventos, filtro por unidade) | 🟡 em andamento | _a preencher_ |
| **Marcelo (Bigasjunior)** | Página **Contribua** | Experiência / Contribuição | `/contribua` editorial, Pix, explicações e componentes reutilizáveis | 🔵 em revisão | `codex/contribua` → `main`; revisão solicitada ao Jonatan |
| **Jefter** | **GC** — Encontre seu GC | Comunhão | Busca por unidade, bairro, dia e público; card do GC; inscrição enviada ao inChurch | 🟡 em andamento | _a preencher_ |
| **Yuri** | **Dados** | Dados | Decisão Power BI × admin web na camada Silver; 3–5 indicadores | 🟡 em andamento | _a preencher_ |
| **Euires** | **Dados** | Dados | Idem (dupla com o Yuri) | 🟡 em andamento | _a preencher_ |
| **Thomaz** | **Infra** | Infra | Azure: AKS (hml e prod), ACR, PostgreSQL do Strapi, Blob, Key Vault, CI/CD no GitHub Actions | 🟡 em andamento | _a preencher_ |
| **Ton Dev** | **Série** | Experiência / Série atual | Parte de série (seção Série atual: YouTube, partes, player) | 🟡 em andamento | _a preencher_ |

Legenda: ⚪ não iniciado · 🟡 em andamento · 🔵 em revisão (PR aberto) · ✅ mergeado · 🔴 bloqueado.

## 2. Pontos a confirmar

- **Ton Dev / Série:** a seção *Série atual* já existe (`docs/componentes/serie-atual.md`). Confirmar se o trabalho é evolução dela (ex.: página de séries, histórico) ou outra coisa, e registrar o escopo.
- **Agenda × Próximos eventos:** a seção já filtra por unidade (PR das páginas de unidades). A página `/agenda` deve **reusar** essa seção/cache da inChurch, sem criar uma segunda integração.
- **Hoje nenhum evento do site está cadastrado numa igreja na inChurch** (pendência do PR de unidades). Sem isso, a Agenda mostra tudo para todas as unidades.
- **Sem dono ainda:** Palavra (Blog), Cuidado (Oração e Testemunho), QA transversal, Design das demais páginas.

## 3. Dependências entre frentes

- **Infra (Thomaz)** é bloqueante para a integração de 24/10: Strapi em PostgreSQL e mídias em Blob (hoje é SQLite local). Quando o Strapi hospedado existir, a regra do snapshot (`yarn data:export` em todo PR do Strapi) sai.
- **GC (Jefter)** e **Agenda (Diogo)** dependem de credenciais/endpoints da inChurch de homologação.
- **Dados (Yuri e Euires)** dependem da decisão do caminho (Power BI × admin web) e de acesso à camada Silver.
- Toda frente que cria seção: contrato em `docs/componentes/`, vitrine, tokens, mobile-first e **Medição (DataLayer)**.

## 4. Como o time é validado (resumo)

Todo PR passa por três portas, nesta ordem. Detalhes em `.agents/rules/Pull-Request.md` e `.agents/skills/pr-code-review/SKILL.md`.

1. **Autor** — roda `/pr-code-review` na própria máquina e corrige 🔴/🟡 (autorrevisão obrigatória), depois o checklist Partes A e B: `yarn quality`, `yarn build`, `yarn smoke`, navegador em 375/768/1440, 5 pilares, medição no `window.dataLayer`, sem segredos, docs. ✅ só o que rodou na sessão.
2. **Revisão** — skill `pr-code-review` gera `documents/github/CODE_REVIEW.md` com veredicto 🎯.
3. **Merge** — skill `pre-merge` (quality + build) por quem mergeia; **merge nunca sem humano**.

**Decisões de governança (17/10/2026):**

- **CI em todo PR** (`.github/workflows/ci.yml`): `yarn quality` + `yarn build` do Next e build do Strapi. PR com mais de 40 arquivos recebe só um **alerta**, sem bloquear.
- **Proteção da `main`:** PR obrigatório, CI verde, sem push direto. **Só a coordenação do Tech aprova** (CODEOWNERS), por enquanto.
- **Revisão cruzada com IA:** quem revisa roda `pr-code-review` e posta o veredicto no PR. A aprovação final é humana e é da coordenação.
- **Evidência de UI (medição, 375/768/1440, a11y):** por enquanto o autor só **descreve** o que viu no PR, sem print obrigatório. Automação via Playwright fica para depois.

Cadência: check-in curto no meio da semana (18–23/10); PRs pequenos, um assunto só, ideal abaixo de ~40 arquivos.

## 5. Registro de PRs

| PR | Autor | Frente | Veredicto da revisão | Merge |
| --- | --- | --- | --- | --- |
| _—_ | | | | |
