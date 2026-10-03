# ADAI Hub

Novo ecossistema digital da ADAI — **Amar a Deus. Servir as pessoas. Influenciar o mundo.**

Site em **Next.js 16 + React 19** (`next/`) alimentado pelo CMS **Strapi 5** (`strapi/`): ministérios e o time Criativo montam páginas empilhando seções reutilizáveis, sem depender de desenvolvimento.

> **Antes de codar, leia o [`AGENTS.md`](AGENTS.md)** — ele aponta as regras do projeto (`.agents/rules/`), as skills (`.agents/skills/`) e a visão ([`Visao-do-Projeto.md`](.agents/rules/Visao-do-Projeto.md)).

## Requisitos

- Node.js 22 LTS
- Yarn 1.x

## Rodar localmente

```bash
yarn setup   # instala dependências e cria next/.env e strapi/.env a partir dos .env.example
yarn dev     # sobe Strapi (http://localhost:1337) e, quando ele responder, o Next (http://localhost:3000)
```

Depois do `yarn setup`, preencha os `.env` (nunca commitar; os `.env.example` têm só os nomes):

| Variável | Onde | Para quê |
| --- | --- | --- |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | `strapi/.env` | Segredos do Strapi — trocar os `tobemodified` por valores aleatórios |
| `PREVIEW_SECRET` | `strapi/.env` **e** `next/.env` (mesmo valor) | Pré-visualização de rascunhos |
| `REVALIDATE_SECRET` | `next/.env` (e no webhook do Strapi) | Webhook que atualiza o site quando o conteúdo muda |
| `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_IMAGE_ALLOW_LOCAL_IP` | `next/.env` | URLs e imagens locais |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_HANDLE` | `next/.env` (só servidor) | Série atual (YouTube Data API v3) |
| `INCHURCH_API_BASE_PUBLIC`, `INCHURCH_API_KEY`, `INCHURCH_API_SECRET` | `next/.env` (só servidor) | Próximos eventos (inChurch Public API) |
| `SITE_INDEXAVEL` | `next/.env` | `true` **só em produção** (lido no build): libera o Google no `robots.txt` e gera o `sitemap.xml`. Ausente = tudo bloqueado (homologação/dev). Ver `.agents/rules/Arquitetura-e-Governanca.md` §9 |
| `NEXT_PUBLIC_GTM_ID` | `next/.env` (público) | Google Tag Manager: `GTM-5945V9DQ` em dev/homologação, `GTM-5MGM7CK2` só em produção. Vazio = sem tags. Ver `docs/analytics/README.md` |

Peça os valores reais ao responsável do projeto (cofre da equipe). Sem as chaves do YouTube/inChurch o site funciona, só sem as seções Série atual e Próximos eventos.

### Conteúdo do Strapi

O banco local (SQLite em `strapi/.tmp/`) **não** vai para o Git (tem usuários e tokens). Há dois caminhos para reproduzir o conteúdo de dev:

1. **Automático (padrão):** na primeira vez que o Strapi sobe, o bootstrap aplica os **guias do editor** ao painel, libera leitura pública de páginas e configurações e cria o conteúdo (cabeçalho, rodapé, Home, `/exemplos` e `/politica-de-privacidade`) a partir do seed v15 em `strapi/src/bootstrap/seed.ts` + imagens em `strapi/seed/`. Quando a versão do seed sobe, ele reconstrói as seções da Home.
2. **Snapshot versionado:** `strapi/data/adai-conteudo.tar.gz` (conteúdo + mídias, **sem** admins ou tokens; inclui os papéis e permissões públicos exportados pelo Strapi). Use quando precisar reproduzir também edições feitas no painel. A importação substitui o conteúdo local, então execute-a com o Strapi parado e num banco de desenvolvimento:

```bash
yarn data:import   # substitui o conteúdo local pelo snapshot (Strapi parado)
yarn data:export   # gera um novo snapshot a partir do seu banco local
```

Crie seu usuário administrador em http://localhost:1337/admin.

O estado atual da Home inclui “Encontre seu lugar”, “Contribua”, “A igreja no seu bolso” e “Perguntas frequentes”. Os componentes têm exemplos e guias em `/componentes/ministerios`, `/componentes/imagem-texto`, `/componentes/texto-botoes` e `/componentes/perguntas-frequentes`. O botão “Ao vivo” do cabeçalho só é exibido após confirmação recente de live pelo YouTube; sem API disponível ou live ativa ele fica oculto.

## Onde ver o quê

| Endereço | O que é |
| --- | --- |
| http://localhost:3000 | Site (Home) |
| http://localhost:3000/exemplos | Página montada no Strapi com as variações dos componentes |
| http://localhost:3000/componentes | **Vitrine de componentes**: variações em 375/768/1440 px e o guia de como preencher cada componente no Strapi (só em dev/homologação) |
| http://localhost:1337/admin | Painel do Strapi |

## Qualidade, testes e Pull Request

**Nenhum Pull Request sem teste:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando.

```bash
yarn quality   # em next/: lint + typecheck + testes (funcionalidade, característica, integração) + piso de cobertura
yarn build     # build do Strapi e do Next
yarn smoke     # em next/, com Strapi e Next rodando: confere o site no ar (páginas, SEO, imagens, APIs)
```

| Documento | Para quê |
| --- | --- |
| [`.agents/rules/Metodo-Superpowers.md`](.agents/rules/Metodo-Superpowers.md) | **Método de trabalho (sempre):** superpowers — desenho antes de código, plano, TDD, verificação com evidência, revisão e finalização |
| [`.agents/rules/Testes.md`](.agents/rules/Testes.md) | Tipos de teste (funcionalidade, característica, integração, smoke), onde ficam e o que cada mudança exige |
| [`.agents/rules/Pull-Request.md`](.agents/rules/Pull-Request.md) | **Checklist antes de subir (`git push`) e antes de abrir o PR** — vale para dev e agente de IA |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | Corpo do PR que o GitHub preenche |

## Antes de subir para produção

Checklist do que **muda** entre homologação e produção (detalhes de medição em `docs/analytics/README.md` §6):

| # | O quê | Onde | Valor de produção |
| --- | --- | --- | --- |
| 1 | Container do GTM | `next/.env` do servidor de produção | `NEXT_PUBLIC_GTM_ID=GTM-5MGM7CK2` (homologação usa `GTM-5945V9DQ`). É `NEXT_PUBLIC_`: vale no **build** — rebuildar depois de trocar |
| 2 | Publicar o container de produção | tagmanager.google.com → ADAI Produção → **Enviar** → versão "Eventos ADAI v1" → **Publicar** | As tags já estão importadas no espaço de trabalho (24 alterações), só falta publicar |
| 3 | URL do site e Google | `next/.env` | `NEXT_PUBLIC_SITE_URL=https://<domínio de produção>` (canonical, Open Graph, sitemap) **e** `SITE_INDEXAVEL=true`, antes do build. Depois: `yarn smoke https://<domínio>` deve mostrar "robots.txt de produção" e o sitemap com URLs 200; enviar `https://<domínio>/sitemap.xml` no Google Search Console |
| 4 | Strapi | `next/.env` | `NEXT_PUBLIC_STRAPI_URL` do Strapi de produção; `STRAPI_API_TOKEN` (somente leitura); `NEXT_IMAGE_ALLOW_LOCAL_IP` **removido** |
| 5 | Segredos | `next/.env` e `strapi/.env` | `PREVIEW_SECRET` e `REVALIDATE_SECRET` novos (não reaproveitar os de dev); webhook do Strapi apontando para `https://<domínio>/api/revalidate` |
| 6 | Integrações | `next/.env` | `YOUTUBE_*` e `INCHURCH_*` do cofre (chave do YouTube restrita à YouTube Data API v3; cliente inChurch só leitura) |
| 7 | GA4 | analytics.google.com → Administrador | Dimensões personalizadas e eventos-chave (`planejar_visita`, `contribuir`) — `docs/analytics/README.md` §4.2; filtrar `site_ambiente = homologacao` nos relatórios |
| 8 | LGPD | site | Página de **Política de Privacidade** publicada e link no aviso de cookies |

## Fontes de dados

| Fonte | O que vem de lá | Onde no código |
| --- | --- | --- |
| **Strapi** | Páginas, seções, textos, imagens editoriais, configurações das seções | `next/src/lib/strapi/` |
| **inChurch Public API** — fonte prioritária de dados da igreja | Eventos (Próximos eventos); próximos: células/GCs, grupos | `next/src/lib/inchurch/` · [docs](https://docs.inchurch.com.br) |
| **YouTube Data API v3** | Mensagens/séries (Série atual) | `next/src/lib/youtube/` |

Regras de cada integração: `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §3.6 e `.agents/rules/Arquitetura-e-Governanca.md` §4.1.

## Estrutura

```
ADAI-Hub/
├── AGENTS.md / CLAUDE.md     # orientações para agentes de IA e devs
├── .agents/rules/            # regras (arquitetura, componentes/CMS, tokens, mobile-first, DoD…)
├── .agents/skills/           # skills (espelhadas em .claude/skills/)
├── docs/componentes/         # contrato Strapi ↔ front de cada componente
├── next/                     # site (Next.js)
└── strapi/                   # CMS (Strapi)
```
