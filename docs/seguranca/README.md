# Segurança — ADAI Hub

Tema dividido em 4 entregas, cada uma com spec, plano e testes (método: [`Metodo-Superpowers.md`](../../.agents/rules/Metodo-Superpowers.md)).

| # | Entrega | Situação |
| --- | --- | --- |
| 1 | **Atualizações urgentes de dependências** (Strapi, Next, sharp) | ✅ 2026-10-03 — esta página |
| 2 | Cabeçalhos HTTP e CSP com nonce no site (HSTS, frame-ancestors, Referrer/Permissions-Policy, relatórios de violação) | ⏳ próxima |
| 3 | Endurecimento do Strapi (chaves sem valor de reserva, CORS restrito, cabeçalhos, limite de login, permissões públicas) | ⏳ |
| 4 | Processo e código (comparação de segredo em tempo constante, `security.txt`, `yarn audit` no checklist de PR, regra de segurança nos MDs) | ⏳ |

Spec e plano da entrega 1: `docs/superpowers/specs/2026-10-03-seguranca-1-atualizacoes-design.md` e `docs/superpowers/plans/2026-10-03-seguranca-1-atualizacoes.md`.

## 1. Diagnóstico (2026-10-03)

| Pacote | Antes | Depois | Por quê |
| --- | --- | --- | --- |
| `@strapi/strapi` + `plugin-users-permissions` | 5.17.0 | **5.56.0** | 13 críticas, entre elas **vazamento de dados sensíveis por filtro relacional na API pública** (corrigido em 5.37.0) e **SQL injection no Content-Type Builder** (5.33.2) |
| `@strapi/plugin-seo` | `^2.0.4` | **2.0.9 fixo** | A ferramenta `@strapi/upgrade` tenta fixá-lo em "5.17.0", versão que não existe |
| `react-router-dom` (Strapi) | 6.30.0 | **6.30.6** | Exigido pela 5.56 |
| `next` | 16.3.6 | **16.3.8 fixo** | Patch mais recente |
| `sharp` | 0.34.x | **0.35.5** | 2 altas: libvips (CVE-2026-33327/33328/35590) e libheif |

`yarn audit --groups dependencies`:

| App | Antes | Depois |
| --- | --- | --- |
| `next/` | 2 altas | **0** |
| `strapi/` | 605 (13 críticas, 306 altas) | **66 (0 críticas, 12 altas)** — todas em risco aceito (§3) |

A API do Strapi foi comparada antes e depois (Home, Política, exemplos e configurações do site): **conteúdo idêntico**; a única diferença é o campo novo `focalPoint: null` nas mídias (recurso da 5.x, ignorado pelo site).

## 2. O que foi feito no Strapi

- Atualização pela ferramenta oficial: `npx @strapi/upgrade minor` (nenhum codemod alterou código ou configuração do projeto).
- **`resolutions`** em `strapi/package.json` — só correções dentro da mesma versão principal, para pacotes que o Strapi trava com versão exata:

| Pacote | Versão forçada | Motivo |
| --- | --- | --- |
| `axios` | `^1.20.0` | Redirecionamento/DoS (painel) |
| `lodash` | `^4.18.1` | Injeção de código via `_.template` |
| `nodemailer` | `^9.1.1` | Troca de falhas, com saldo menor: corrige 1 alta e 3 moderadas da 9.0.1, mas a linha 9.1–10.0.4 tem 1 alta própria (endereços juntados por comentários) e 1 moderada. Ver §3 |
| `postcss` | `^8.5.28` | Leitura de arquivo via source map |
| `@remix-run/router` | `^1.23.4` | XSS por redirecionamento aberto (painel) |
| `@swc/core` | `1.15.47` | **Não é falha de segurança:** a 1.16 recusa o cache nativo quando `C:\Users\<usuário>\AppData\Local` herda permissão de uma identidade de sandbox (`S-1-15-3-…`), o que quebra o build do painel no Windows. Só ferramenta de build. Rever quando o ambiente mudar |

- Outras 16 dependências transitivas foram reatualizadas dentro das faixas pedidas (entradas removidas do `yarn.lock` e resolvidas de novo no `yarn install`).

## 3. Riscos aceitos (altas restantes)

> ⚠️ **Desvio da spec:** a spec só aceitava sobra em ferramenta de build/CLI. `braces` e `nodemailer` **rodam no servidor de produção** do Strapi. Ficam abertos até decisão do responsável pelo projeto; a entrega 3 (endurecimento do Strapi) remove o caminho de ataque do `nodemailer`.

| Pacote | Por que fica | Mitigação / quando rever |
| --- | --- | --- |
| `braces` (8 avisos) | **Roda em produção** (content-type-builder → micromatch; @strapi/utils → preferred-pm). Não há versão corrigida publicada | Falha de negação de serviço com padrão de glob muito aninhado; os padrões vêm da configuração do Strapi, não do visitante. Rever a cada `yarn audit` |
| `vite` 5 | Só no `strapi develop` (servidor de desenvolvimento do painel); correção exige vite 6 | Nunca rodar `develop` em produção (produção usa `strapi start`). Some quando o Strapi adotar vite 6 |
| `webpack-dev-middleware` 6 | Só desenvolvimento; correção exige major 7 | Igual ao vite |
| `nodemailer` < 10.0.6 | **Roda em produção:** sem `config/plugins.ts` de e-mail vale o provedor padrão `sendmail`, que usa o nodemailer e é carregado no bootstrap; "esqueci a senha" (admin e users-permissions) já envia e-mail por ele. Correção exige major 10 | Falha de negação de serviço no parser de endereços. **Entrega 3:** desligar os endpoints públicos que o site não usa (cadastro e esqueci a senha do users-permissions) e configurar um provedor de e-mail atual antes de qualquer envio exposto ao público |

## 4. Como auditar

```bash
cd next && yarn audit --groups dependencies      # meta: 0 críticas e 0 altas
cd strapi && yarn audit --groups dependencies    # meta: 0 críticas; altas só as da §3
cd next && yarn test src/__tests__/caracteristicas/dependencias-seguras.test.ts
```

O teste `dependencias-seguras.test.ts` falha se alguém voltar o Strapi para antes da 5.37.0, o Next para antes da 16.3.8, o sharp para antes da 0.35.4 ou deixar o plugin de SEO fora da linha 2.x fixa.

## 5. Lições desta entrega

- **Nunca trocar de branch (nem fazer `git pull`/`checkout`) com o `strapi develop` rodando.** O Strapi recarrega ao ver os arquivos mudarem e sincroniza o banco com o schema do código naquele instante: se a branch não tem um componente, **os dados desse componente são apagados**. Aconteceu em 2026-10-03 com a Política de Privacidade (restaurada com `yarn data:import`). Parar o Strapi antes; se acontecer, `yarn data:import` com o Strapi parado.
- Depois de um `yarn data:import`, o seed reconstrói as seções da Home e de `/exemplos` (a versão do seed fica fora do snapshot) — esperado.
- O Next serve a resposta em cache uma vez antes de revalidar (60 s): depois de mexer no Strapi, a primeira visita pode mostrar o conteúdo antigo.

## 6. Ferramentas

- **Security Guidance** (plugin da Anthropic, ativo na conta): alerta padrões perigosos durante a edição, revisa o diff e os commits (injeção, XSS, SSRF, segredos no código e outras classes). **Alerta dele é achado de revisão**: corrigir ou registrar por que não se aplica, nunca ignorar em silêncio. Instalação: claude.ai → Plugins → "Security Guidance".
- `yarn audit` nos dois apps e o teste de versões seguras (§4).
