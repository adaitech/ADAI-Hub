# Próximos eventos — componente `sections.proximos-eventos`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: Home e `/exemplos`, seed v10) · validação humana pendente
> **Figma:** [Próximos eventos — node 1:173](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-173)
> **Vitrine:** `/componentes/proximos-eventos`
> **Guia do editor:** `strapi/src/editor-guide/sections.proximos-eventos.json`

## 1. O que é

Os próximos eventos da ADAI em cards que passam para o lado. **Os eventos vêm da inChurch** (fonte prioritária de dados da igreja, `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §3.6). O Strapi guarda só a apresentação. A seção **reaproveita o Carrossel de cards** (`CarrosselCardsSection`): mesmo card, setas, retorno ao início, cores e acessibilidade.

| Camada | Responsabilidade |
| --- | --- |
| **inChurch** (Public API) | Eventos: nome, datas, arte, descrição, link online/inscrição, "mostrar no site", destaque |
| **Strapi** | Título, texto de apoio, quantidade, cor dos cards, link "agenda completa" |
| **Next** (`src/lib/inchurch/`) | Integração, cache, regras (site × GC × recorrência), normalização |
| **Componente** | `ProximosEventosSection` (servidor) → JSON do Carrossel → `CarrosselCardsSection` |

## 2. Contrato no Strapi

```text
sections.proximos-eventos         (dynamic zone `sections` de `page`)
├── titulo        Text (short) · obrigatório · máx. 60 · padrão "Próximos eventos"
├── texto_apoio   Text (long) · máx. 200
├── quantidade    Integer · 1 a 12 · padrão 8
├── cor_cards     Enumeration · cinza | branco | preto | azul | verde | laranja | vinho · padrão cinza
└── link          Component (shared.link) · opcional ("Agenda completa")
```

Nenhum evento é cadastrado no Strapi.

## 3. Regras (`src/lib/inchurch/eventos.ts`)

Validadas com a API real e comparadas com a tela "Próximos Eventos" do painel (`admin.inchurch.com.br/programacao/next`) em 27–28/09/2026: mesma lista, menos o que não está marcado para o site.

| Regra | Decisão |
| --- | --- |
| Aparecer no site | `active && enabled && show_on_site` ("Mostrar no site" no painel manda) |
| GCs | Nunca aparecem: categoria "Grupo de Conexão" (id 8776, buscada por `category_id`) **ou** nome começando com "GC". A categoria nem sempre é preenchida no painel |
| Recorrência | `recurrence_model: true` é o modelo (ignorado); as datas vêm como eventos próprios e viram **um** card com todas as datas |
| Cópias | Mesmo nome + mesmo início = uma só (ex.: GC recriado) |
| Datas | A API manda horário local sem fuso → tratado como America/Sao_Paulo (−03:00) |
| Ordem | Destaques do painel (`highlighted`) primeiro; depois do mais próximo para o mais distante |
| Passado | A cada renderização, datas já encerradas somem; evento sem data futura some |
| Link do card | Inscrição externa ("Inscreva-se") → link online ("Participar online", ex.: Zoom aberto de oração) → nenhum. Só `http(s)` (bloqueia `javascript:`) |
| Imagem | `image_webp` → `image` (arte 1280×720) com `alt=""` (o nome do evento já é o título do card) |

**Card** (`normalize.ts` `paraCarrossel`): foto = arte; título = nome; destaques = data + hora ("14 de Outubro · 20h", "05 a 09 de Outubro · 5h", ou a próxima data + "Também em …"); texto = primeiro parágrafo da descrição (≤ 140 caracteres); link; cor do CMS. O Carrossel recebe `estilo_imagem: 'arte'` (16:9, colorida) — opção criada no Carrossel para artes de divulgação (ver `carrossel-cards.md`).

## 4. Integração e cache

- `client.ts` `inchurchFetch`: `Authorization: Basic base64(INCHURCH_API_KEY:INCHURCH_API_SECRET)` só no servidor (header, nunca URL), `INCHURCH_API_BASE_PUBLIC`, timeout 8 s, `InchurchError` (`config` · `limite` 429 · `http` · `timeout` · `rede` · `resposta`) sem credenciais na mensagem.
- `eventos-cache.ts` `getEventosInchurch`: busca os eventos a partir de hoje (paginado, 100 por página) + os da categoria GC → `normalizeEventos` → `unstable_cache` **30 min**, tag `inchurch`. 2–3 chamadas por atualização (limite: 200/min). Falha → versão anterior (stale-if-error do Next) → último válido em memória → `null` (seção some). Log só em cache miss: `[inchurch] Eventos atualizados: N futuros → M no site.`
- Mudanças no Strapi usam o webhook atual (tag `strapi`); mudanças na inChurch aparecem em até 30 min.

## 5. Variações

| Variação | Onde ver |
| --- | --- |
| 8 eventos, cinza (padrão) | Home · vitrine `minimo` |
| 4 eventos, cards pretos, texto de apoio | `/exemplos` · vitrine `completo` |

Controles na vitrine: quantidade, cor dos cards, texto de apoio, link. Dados: fixture **real** da API (`src/lib/inchurch/__fixtures__/eventos.json`, sem contatos e sem credenciais).

## 6. Estados

| Situação | Resultado |
| --- | --- |
| Nenhum evento futuro no site | Seção não aparece |
| inChurch fora, sem cache | Seção não aparece; página normal |
| Evento sem arte | Card sem imagem (alinhamento mantido) |
| Evento sem link | Card sem link |

## 7. Pendências

- Link público da página do evento na inChurch: a API traz `public_url`/`short_url_code`, mas a documentação não informa o formato do endereço. Quando confirmado, vira o link padrão do card.
- Link "Agenda completa": definir o destino (app ou página de eventos da ADAI).
- ⏳ Validação do design (cards com arte 16:9 no lugar do bloco de data do Figma).
