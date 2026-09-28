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

Peça os valores reais ao responsável do projeto (cofre da equipe). Sem as chaves do YouTube/inChurch o site funciona, só sem as seções Série atual e Próximos eventos.

### Conteúdo do Strapi

O banco local (SQLite em `strapi/.tmp/`) **não** vai para o Git (tem usuários e tokens). Há dois caminhos, e os dois dão o mesmo conteúdo de dev:

1. **Automático (padrão):** na primeira vez que o Strapi sobe, o bootstrap aplica os **guias do editor** ao painel, libera leitura pública de páginas e configurações e cria o conteúdo (cabeçalho, rodapé, Home e `/exemplos`) a partir de `strapi/src/bootstrap/seed.ts` + imagens em `strapi/seed/`.
2. **Snapshot versionado:** `strapi/data/adai-conteudo.tar.gz` (conteúdo + mídias, **sem** admins, tokens ou configurações). Útil quando alguém editou conteúdo no painel e quer compartilhar:

```bash
yarn data:import   # substitui o conteúdo local pelo snapshot (Strapi parado)
yarn data:export   # gera um novo snapshot a partir do seu banco local
```

Crie seu usuário administrador em http://localhost:1337/admin.

## Onde ver o quê

| Endereço | O que é |
| --- | --- |
| http://localhost:3000 | Site (Home) |
| http://localhost:3000/exemplos | Página montada no Strapi com as variações dos componentes |
| http://localhost:3000/componentes | **Vitrine de componentes**: variações em 375/768/1440 px e o guia de como preencher cada componente no Strapi (só em dev/homologação) |
| http://localhost:1337/admin | Painel do Strapi |

## Qualidade

```bash
yarn quality   # em next/: lint + typecheck + testes (inclui a checagem da vitrine e do guia do editor)
yarn build     # build do Strapi e do Next
```

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
