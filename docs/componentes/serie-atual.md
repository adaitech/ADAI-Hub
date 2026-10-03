# Série atual — componente `sections.serie-atual`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: Home automática e `/exemplos` com override, seed v8) · validação humana pendente
> **Figma:** [Mensagens — node 1:132](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-132)
> **Vitrine:** `/componentes/serie-atual`
> **Guia do editor:** `strapi/src/editor-guide/sections.serie-atual.json`

## 1. O que é

Série de mensagens do momento: nome da série, a parte mais recente com player dentro do site, as outras partes do mês e "Ao vivo agora" durante o culto.

| Camada | Responsabilidade |
| --- | --- |
| **YouTube** (Data API v3) | Fonte de verdade: vídeos, títulos, temas, pregadores, datas, thumbnails, status da live |
| **Strapi** | Só configuração editorial opcional (3 campos). **Nunca** cadastrar sermão, vídeo, videoId, pregador ou data |
| **Next.js** (`src/lib/youtube/`) | Integração, cache, regras (domingos, live × corte), normalização, fallback |
| **Componente** (`SerieAtualSection/`) | Apresentação. Não conhece o Google nem o formato do Strapi |

## 2. Contrato no Strapi

```text
sections.serie-atual            (dynamic zone `sections` de `page`)
├── exibir                Boolean · padrão true        "Exibir seção"
├── titulo_personalizado  Text (short) · máx. 60       "Título personalizado" — muda só a exibição
└── playlist_url          Text (short) · máx. 300      "Playlist personalizada" — link de playlist do YouTube
```

Padrão = tudo vazio = automático: o time **não** precisa entrar no CMS todo mês. `playlist_url` aceita o link (`https://www.youtube.com/playlist?list=PL…`, também `watch?v=…&list=…`, `m.`/`music.`) ou o ID; o site extrai o ID (`parsePlaylistUrl`). A chave da API nunca vai para o Strapi.

Populate: `true` (seção só com campos simples; o Strapi 5 **omite** da dynamic zone o componente que não aparece em `on`).

## 3. Fluxo

```text
Home (ISR 60s) → SectionRenderer → SerieAtualSection (Server Component, async)
  normalizeSerieAtualConfig(JSON do Strapi)             exibir / título / playlistId
  getSerieAtual(playlistId | null)                       lib/youtube/serie-atual.ts (cache)
    ├─ playlistCache (4h)   resolveCurrentSeriesPlaylist   1. CMS  2. mais recente válida
    ├─ serieNormalCache (4h) ou serieAoVivoCache (5 min)   playlistItems + videos (1 chamada)
    │     normalizeSerie → SerieYoutube (JSON cacheado)
    └─ erro → última versão válida (Data Cache ou memória) → senão null (seção some)
  montarSerieAtual(serie, { tituloPersonalizado, agora })  partes futuras, "Culto de hoje", título do CMS
  <SerieAtual view={…}/>                                   apresentação; único client: <AssistirVideo/>
```

## 4. Regras de negócio (`src/lib/youtube/`)

| Regra | Onde | Decisão |
| --- | --- | --- |
| Playlist | `playlist.ts` `resolveCurrentSeriesPlaylist` | 1) `playlist_url` do CMS, se existir no YouTube e tiver vídeos (`source: cms`); 2) senão, playlist pública mais recente por `snippet.publishedAt` entre as 5 mais novas que **tenha culto de domingo** (`source: youtube-latest`). Descarta conferências e cultos de sábado (ex.: "Conferência Flores 2026", "Culto Enraizados"). CMS inválido → `console.warn` + automático. Nome da playlist nunca identifica a série |
| Canal | `playlist.ts` `buscarChannelId` | `channels.list?forHandle=YOUTUBE_CHANNEL_HANDLE`, cache de 7 dias |
| Título do vídeo | `titulo.ts` `parseSermonTitle` | `Série \| Tema \| Pr.` · `Série - Tema \| Pr.` · `Série Tema \| Pr.` (separa pelo nome da playlist: "Ele Prometeu Paz") · `Série \| Pr.`. Fora do padrão não quebra |
| Culto ao vivo | `titulo.ts` `isAdaiLiveService` | "Culto ao vivo \| ADAI On" (qualquer caixa/acento/espaço) = culto completo, **nunca** série |
| Data do vídeo | `serie.ts` | `liveStreamingDetails.actualStartTime` → `videoPublishedAt` → `publishedAt` (a posição da playlist não é usada) |
| Domingo | `domingos.ts` `domingoDe` | Domingo da semana em America/Sao_Paulo (corte publicado na segunda cai no domingo anterior) |
| Um domingo = uma parte | `serie.ts` `normalizeSerie` | Prioridade: mensagem definitiva > ao vivo > culto encerrado. Corte publicado **substitui** a live; não cria parte nova |
| Status | `serie.ts` | `published` · `live` (`liveBroadcastContent: live` sem `actualEndTime`) · `waiting-sermon-cut` (culto encerrado sem corte) · `upcoming` |
| Partes | `serie.ts` `montarSerieAtual` | Conteúdos em ordem cronológica = Parte 1…n. Futuras = domingos do mês da série depois do último conteúdo **e** a partir de hoje (4 ou 5, nunca fixo; série antiga não ganha futura) |
| Título da série | `serie.ts` | CMS → nome mais frequente nos títulos dos vídeos → nome da playlist → "Mensagens" |
| Thumbnail | `thumbnails.ts` `getBestYoutubeThumbnail` | maxres → standard → high → medium → default |
| Ignorados | `serie.ts` | Vídeo privado, removido (não volta em `videos.list`), live agendada (vira `proximaTransmissao`) |

**Como a ADAI publica hoje** (dados reais, set/2026): a live "Culto ao vivo | ADAI On" entra na playlist da série na manhã de domingo (agendada). Depois do culto, **o mesmo vídeo** é cortado e renomeado para "Série | Tema | Pr.". As duas formas (renomear ou publicar um corte separado) resultam na mesma parte.

## 5. Cache

| Camada | TTL | Chave | Observação |
| --- | --- | --- | --- |
| channelId | 7 dias | handle | `unstable_cache`, tag `youtube` |
| Playlist resolvida | 4h | playlistId do CMS ou `auto` | mudar a playlist no CMS muda a chave → efeito na próxima renderização |
| Série (normal) | **4h** (14400 s) | playlistId | resultado **normalizado** (`SerieYoutube`), não o JSON do Google |
| Série (live) | **5 min** (300 s) | playlistId | usado quando o cache de 4h mostra live no ar, ou live agendada entre 15 min antes e 6h depois do horário |
| Botão “Ao vivo” do cabeçalho | **5 min** (300 s) | playlist automática atual + vídeos | checagem independente da série normal de 4h; só aparece com `liveBroadcastContent: live` e resultado de até 10 min |
| Stale-if-error | — | — | `unstable_cache` devolve a entrada anterior se a revalidação falhar (conferido em `next/dist/server/web/spec-extension/unstable-cache.js`); sem entrada → `ultimoValido` em memória; sem nada → seção oculta |

- **Revalidation do CMS:** o webhook atual (`/api/revalidate` → tag `strapi`) atualiza a Home; `exibir`, `titulo_personalizado` e `playlist_url` são lidos a cada renderização (título aplicado fora do cache do YouTube), então **não** esperam 4h. O cache do YouTube tem tag própria (`youtube`) e não é apagado pelo webhook do Strapi.
- **Quota:** cada atualização custa 2–3 unidades (`playlistItems` + `videos`; `playlists` a cada 4h, até 5 `playlistItems` para validar). Com live, ~30 unidades/h. Limite diário padrão: 10.000.
- **Limitação conhecida:** a live só é percebida quando a série é atualizada. Se a live for adicionada à playlist depois da última atualização de 4h, o "Ao vivo agora" pode atrasar até 4h. Se isso incomodar, a evolução simples é usar o cache de 5 min também na janela do culto de domingo (ex.: 8h–14h).
- O botão do cabeçalho usa consulta própria de 5 minutos e some se o YouTube não confirmar uma live recente; a limitação de 4h acima vale apenas para o destaque da seção de mensagens.

## 6. Segurança e erros

- `YOUTUBE_API_KEY` e `YOUTUBE_CHANNEL_HANDLE` só em `src/lib/youtube/client.ts` (servidor, sem `NEXT_PUBLIC_`). A chave vai no header `X-Goog-Api-Key`, **fora da URL**: não aparece em log, mensagem de erro, chave de cache nem HTML.
- `YoutubeError` (`config` · `quota` · `http` · `timeout` · `rede` · `resposta`) com endpoint, status e motivo do Google, nada mais. Timeout de 8 s.
- Nenhuma falha derruba a página: chave ausente, handle ausente, canal/playlist não encontrados, playlist vazia, 403, 429, quota, timeout, JSON inválido → última versão válida ou seção oculta + `console.warn('[youtube] …')`.
- Logs de decisão (só em cache miss): `[youtube] Playlist da série: … (source=cms|youtube-latest)` e `[youtube] Série atualizada: … titulo=video|playlist|fallback partes=… aoVivo=…`.

## 7. Apresentação

| Estado da parte atual | Linha 1 | Linha 2 | Botão |
| --- | --- | --- | --- |
| `published` | Parte 3: Batalhas morais | Pr. Rodrigo Soeiro, domingo 20 de Setembro. | Assistir mensagem |
| `live` | Parte 3: Culto de hoje + selo "Ao vivo agora" | — | Assistir ao vivo |
| `waiting-sermon-cut` | Parte 3: Culto de hoje (ou "Culto completo" depois do domingo) | Culto completo de domingo … A mensagem editada será publicada em breve. | Assistir culto |

- **Player:** `AssistirVideo` (único Client Component). Thumbnail + play, "Assistir…" e os cards abrem um `<dialog>` modal com o iframe `https://www.youtube.com/embed/{id}`. Nada do player existe antes do clique; fechar remove o iframe. No dialog: "Assistir no YouTube" (`watch?v=`, nova aba).
- **`embeddable: false`:** os gatilhos viram links para `https://www.youtube.com/watch?v={id}` (`target="_blank"`, `rel="noopener noreferrer"`); nenhum iframe.
- **"Todas as mensagens":** não existe página de mensagens no site → `https://www.youtube.com/playlist?list={playlistId}` (nova aba).
- **Cards:** as demais partes. Publicada: data · "Parte N: Tema" · pregador, card inteiro clicável (botão no título + área estendida). Futura: "Parte N" · "Mensagem ainda não disponível", borda tracejada, sem clique e sem inventar dados.
- **Figma (1440):** caixa `#F2F2F2` raio 28 padding 72; texto 517 + thumbnail 620 (16:10, raio 20), gap 72; título 57,6px bold, −0,045em; cards 443px, gap 12, raio 20, padding 24, altura mín. 180. Tokens: `--font-size-titulo-serie`, `--serie-caixa-padding`, `--serie-play`, `--serie-parte-min`. Mobile/tablet 🟡 (texto, depois a thumbnail; cards 1 e 2 colunas). Dialog 🟡 (sem Figma).

## 8. Variações (vitrine e Strapi)

| Variação | Onde ver |
| --- | --- |
| Playlist e título do CMS, 5 domingos (Ele Prometeu, dados reais) | `/exemplos` · vitrine `completo` |
| Tudo automático, culto encerrado aguardando corte (27/09 real) | Home · vitrine `aguardando_corte` |
| Ao vivo agora | vitrine `ao_vivo` |
| Parte futura | vitrine `proxima_parte` |
| Mínimo (1 publicada + 4 futuras) | vitrine `minimo` |
| Título longo (60) | vitrine `texto_longo` |

Controles: parte mais recente (publicada / ao vivo / aguardando corte), título personalizado, player no site (embeddable), exibir seção. Os exemplos usam fixtures **reais** da API (`src/lib/youtube/__fixtures__/`, sem chave).

## 9. Testes

`next/src/lib/youtube/*.test.ts`, `next/src/components/sections/SerieAtualSection/SerieAtualSection.test.tsx` e `next/src/__tests__/caracteristicas/cache-versionado.test.ts` (formato guardado em cache × `VERSAO_CACHE_YOUTUBE`; player em youtube-nocookie.com) cobrem os 14 cenários do pedido: 4 mensagens; parte futura; live ativa sem Parte 5; live encerrada (`waiting-sermon-cut`); live + corte sem Parte 5 (inclusive corte na segunda de madrugada e live renomeada); 5 domingos; título fora do padrão; YouTube fora com cache anterior; thumbnail sem maxres; `embeddable: false`; playlist vazia/válida/inválida no CMS; título personalizado. Mais: chave só no header, erros 403/429/timeout/JSON, chave ausente, `videos.list` em uma chamada, TTL 4h × 5 min, fuso de São Paulo e dados reais do canal.

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).

## 10. Pendências

- ⏳ Validação humana: design do dialog e do selo "Ao vivo agora", layout mobile, leitor de tela.
- Página própria de mensagens: quando existir, trocar o link "Todas as mensagens".
- Produção: restringir a `YOUTUBE_API_KEY` à YouTube Data API v3 no Google Cloud (a chave é server-side, então restrição por referer não se aplica; por IP, se o provedor permitir).

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `assistir_mensagem` (disparo manual no `AssistirVideo`: `serie`, `parte`, `status`, `origem`, `player`); `ver_todas_mensagens`; `ver_secao`.
