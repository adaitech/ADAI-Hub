# Medição (DataLayer, GTM e GA4)

> **Dono do código:** dev/IA. **Não vem do Strapi**: o time de conteúdo não cria nem altera eventos (decisão de 2026-10-02).
> **Código:** `next/src/lib/analytics/` · `next/src/components/analytics/` · aviso de cookies em `next/src/components/layout/BannerCookies/`
> **Importação do GTM:** [`gtm-container-adai.json`](gtm-container-adai.json)

## 1. Como funciona

```text
site (Next)  ──registrarEvento()──▶  window.dataLayer  ──▶  GTM  ──▶  GA4 (G-SCG09PWV8B)
"o que aconteceu"                                   "o que fazer com isso" (sem deploy)
```

| Peça | Arquivo | Papel |
| --- | --- | --- |
| Catálogo de eventos | `lib/analytics/eventos.ts` | **Fonte única** dos nomes e parâmetros (TypeScript: evento com parâmetro errado não compila) |
| Envio | `lib/analytics/datalayer.ts` `registrarEvento` | Padroniza valores (sem acento, minúsculo, ≤ 100 caracteres) e acrescenta `event_id`, `page_location`, `page_path`, `site_ambiente` |
| Regras de clique | `lib/analytics/cliques.ts` `eventosDoClique` | Decide os eventos de um clique pelo contexto (seção, texto, destino, card) — função pura, testada |
| Rastreador | `components/analytics/RastreadorAnalytics.tsx` | **Único** Client Component de medição: ouve cliques e o abrir da FAQ, observa seções na tela, envia Web Vitals. As seções continuam Server Components |
| GTM + Consent Mode | `lib/analytics/gtm.ts` + `components/analytics/GoogleTagManager.tsx` | Container por ambiente (`NEXT_PUBLIC_GTM_ID`). **O GTM só carrega depois do aceite** (Política de Privacidade: nada vai ao Google antes da escolha); consentimento negado por padrão e liberado no aceite |
| Aviso de cookies | `components/layout/BannerCookies/` | Aceitar/Recusar; reabre pelo rodapé ("Preferências de cookies") |
| Disparo manual | `data-analytics="manual"` | Elemento que dispara o próprio evento (player da Série atual, aviso de cookies) e é ignorado pelo rastreador |

O GTM e o rastreador ficam no layout do **site** (`app/(site)/layout.tsx`): a vitrine `/componentes` e o preview não enviam dados.

## 2. Contas e containers

| Item | ID | Uso |
| --- | --- | --- |
| Conta Google | `adaitech.hub@gmail.com` | Dona do GA4 e do GTM (institucional) |
| GA4 (fluxo Web) | `G-SCG09PWV8B` | Configurado **dentro do GTM** (tag "Google tag"). Nunca colocar o `gtag.js` direto no código: duplicaria as visualizações |
| GTM homologação | `GTM-5945V9DQ` | `NEXT_PUBLIC_GTM_ID` em dev e homologação → `site_ambiente = homologacao` |
| GTM produção | `GTM-5MGM7CK2` | `NEXT_PUBLIC_GTM_ID` só no deploy de produção → `site_ambiente = producao` |

Os IDs são públicos (aparecem no HTML de qualquer site com GTM). Sem `NEXT_PUBLIC_GTM_ID` nenhuma tag carrega.

## 3. Plano de medição

Todo evento também leva `site_ambiente`, `page_path`, `page_location` e `event_id`.

| Evento | Quando dispara | Parâmetros | Conversão? |
| --- | --- | --- | --- |
| `planejar_visita` | Clique em link para `/planeje-sua-visita` (ou texto "Planeje sua visita") | `origem`, `texto` | **Sim** |
| `como_chegar` | Clique em link do Google Maps (ou texto "Como chegar") | `origem`, `unidade` (título do card) | — |
| `assistir_mensagem` | Abrir o player (site) ou ir ao YouTube na Série atual | `origem` (botao, thumbnail, card), `serie`, `parte`, `status` (published, live, waiting-sermon-cut), `player` (site, youtube) | — |
| `ver_todas_mensagens` | "Todas as mensagens" (playlist do YouTube) | `origem`, `serie` | — |
| `selecionar_evento` | Link de um card em Próximos eventos | `evento` (nome), `acao` (Inscreva-se, Participar online) | — |
| `ver_faq` | Abrir uma pergunta da FAQ | `pergunta` | — |
| `selecionar_ministerio` | Clique em um ministério de "Encontre seu lugar" | `ministerio` | — |
| `contribuir` | Link para `/contribua` ou texto com contribuir/dízimo/oferta/doação | `origem`, `texto` | **Sim** |
| `baixar_app` | Link da App Store ou do Google Play | `origem`, `loja` (app_store, google_play) | — |
| `clique_cta` | **Todo** clique em link/botão (inclusive os acima) | `origem`, `texto`, `destino` (sem query string) | — |
| `ver_secao` | Seção 25% visível, uma vez por página | `secao`, `posicao` | — |
| `web_vitals` | Core Web Vitals de usuários reais | `metrica` (LCP, CLS, INP, FCP, TTFB), `valor` (CLS × 1000), `avaliacao` | — |
| `consentimento_cookies` | Escolha no aviso de cookies | `escolha` (aceito, recusado) | — |

`origem` = `data-section` da seção (`hero`, `serie-atual`, `proximos-eventos`…), `header`, `footer` ou `pagina`.

## 4. Configurar o Google (uma vez por container)

### 4.1 GTM — importar o container pronto

Fazer em **cada** container (homologação e produção):

1. tagmanager.google.com → container → **Administrador → Importar contêiner**.
2. Arquivo: `docs/analytics/gtm-container-adai.json`.
3. Espaço de trabalho: **Existente** (Default Workspace) → opção **Mesclar** → **Substituir tags, acionadores e variáveis conflitantes**.
4. Confirmar. Entram:
   - tag **"GA4 - Google tag (G-SCG09PWV8B)"** (dispara em "Initialization - All Pages");
   - tag **"GA4 - Eventos ADAI (DataLayer)"** (nome do evento = `{{Event}}`, com todos os parâmetros);
   - acionador **"CE - Eventos ADAI (DataLayer)"** (evento personalizado, regex com os 13 eventos);
   - variáveis **"DLV - …"** (uma por parâmetro).
5. **Visualizar** (Tag Assistant) → abrir o site → clicar em "Como chegar", abrir a FAQ etc. → conferir as tags disparando.
6. **Enviar → Publicar** (versão "Eventos ADAI v1").

Se a importação falhar, criar à mão seguindo a mesma lista (uma variável "Variável da camada de dados" por parâmetro; acionador "Evento personalizado" com regex `^(planejar_visita|como_chegar|…)$`; tag "Evento do Google Analytics: GA4" com nome `{{Event}}`).

**Consentimento:** o próprio site só carrega o GTM depois do "Aceitar" (quem recusa ou ainda não escolheu não faz nenhuma requisição ao Google). As tags também respeitam o Consent Mode. Não marcar "Exigir consentimento adicional".

### 4.2 GA4 — dimensões e conversões

Em analytics.google.com → **Administrador**:

1. **Definições personalizadas → Criar dimensão personalizada** (escopo **Evento**), uma para cada: `origem`, `texto`, `destino`, `unidade`, `serie`, `parte`, `status`, `player`, `evento`, `acao`, `pergunta`, `ministerio`, `loja`, `secao`, `posicao`, `escolha`, `site_ambiente`, `metrica`, `avaliacao`. Sem isso o parâmetro chega, mas não aparece nos relatórios.
2. **Métrica personalizada:** `valor` (Web Vitals).
3. **Eventos-chave:** marcar `planejar_visita` e `contribuir`. O GA4 só mostra a estrela depois que o evento aparece em **Exibição de dados → Eventos → Eventos recentes** (até 24h após o primeiro disparo; não há como criar pelo nome antes).

> **Status (2026-10-02, propriedade `G-SCG09PWV8B`):** ✅ 19 dimensões personalizadas (escopo Evento) e a métrica `valor` criadas. ✅ `planejar_visita` e `contribuir` já disparados e vistos no **Tempo real**. ⏳ **Falta marcar a estrela** dos dois em Eventos recentes quando aparecerem (até 24h). Filtro de homologação: não criado.
4. **Filtro de dados** (opcional): excluir `site_ambiente = homologacao` dos relatórios de produção — ou analisar com essa dimensão.
5. **Retenção de dados:** 14 meses.

## 5. Criar ou não um evento novo (regra "Medição")

Toda criação ou alteração de componente passa por esta análise (ver `AGENTS.md`, pilar **Medição**):

1. **Que pergunta de negócio o componente responde?** (ex.: "quais unidades atraem mais gente?").
2. **Um evento existente já responde?** `clique_cta` (todo clique), `ver_secao` (visualização) e os eventos acima cobrem a maioria dos casos. Se sim: **não criar** — registrar no doc do componente "Medição: coberto por `…`".
3. **Se não:** criar o evento **no catálogo** (`eventos.ts`) → regra em `cliques.ts` (ou disparo manual com `data-analytics="manual"`) → teste → linha neste plano (§3) → atualizar o regex em `gtm-container-adai.json` → reimportar no GTM → registrar dimensões novas no GA4.
4. **Nunca** enviar dado pessoal (nome, e-mail, telefone, CPF) nem texto digitado pelo usuário.

O teste `lib/analytics/eventos.test.ts` falha se o catálogo, o JSON do GTM e este plano divergirem.

## 6. Status e produção

| Ambiente | Container | Situação |
| --- | --- | --- |
| Homologação / dev | `GTM-5945V9DQ` | ✅ **Publicado** em 2026-10-02 (versão 2 "Eventos ADAI v1"). Verificado: antes do aceite **nenhuma** requisição ao Google; depois do aceite, o GA4 `G-SCG09PWV8B` recebe `page_view` e os eventos do DataLayer (`gcs=G101`) e o **Tempo real** mostrou `ver_secao`, `web_vitals` e `consentimento_cookies` |
| Produção | `GTM-5MGM7CK2` | ⏳ Importado (24 alterações no espaço de trabalho), **não publicado** — de propósito, até o site ir para produção |

**Para subir para produção:**

1. No servidor de produção: `NEXT_PUBLIC_GTM_ID=GTM-5MGM7CK2` **antes do build** (variável `NEXT_PUBLIC_` é embutida no build).
2. GTM → **ADAI Produção** → Enviar → nome "Eventos ADAI v1" → Publicar.
3. GTM → Visualizar (Tag Assistant) no domínio de produção → aceitar cookies → conferir as tags.
4. GA4 → Tempo real: eventos com `site_ambiente = producao`.
5. GA4 → dimensões personalizadas, eventos-chave e filtro de homologação (§4.2), se ainda não feitos.

Checklist geral (Strapi, segredos, integrações, LGPD): `README.md` → "Antes de subir para produção".

## 7. Pendências

- **Eventos-chave** `planejar_visita` e `contribuir`: marcar a estrela no GA4 (§4.2).
- **Política de Privacidade** (LGPD): página `/politica-de-privacidade` publicada no Strapi (seção `sections.texto-rico`, texto de `docs/conteudo/politica-de-privacidade.md`), com link no aviso de cookies e no rodapé. Falta a revisão jurídica e confirmar os dados da controladora e do encarregado antes de produção.
- Bônus de vídeo: com `enablejsapi=1` no embed do YouTube, o gatilho "Vídeo do YouTube" do GTM mede início/progresso/fim das mensagens assistidas no site.
