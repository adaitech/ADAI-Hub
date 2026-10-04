# Hero (abertura) — componente `sections.hero`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local, via seed) · validação humana pendente
> **Figma:** [Hero — node 1:32](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-32)
> **Vitrine:** `/componentes/hero`
> **Guia do editor:** `strapi/src/editor-guide/sections.hero.json`

## 1. O que é

Primeira faixa da página: foto grande em preto e branco com cantos arredondados, a frase principal em letras enormes ("Amar. Servir. Influenciar."), um texto de apoio e até dois botões. É o primeiro contato com a visão da ADAI.

**Onde é usado:** Home; futuramente páginas de ministério e campanhas.
**Quantas vezes por página:** uma, sempre como primeira seção.

## 2. Escopo

**Dentro:** frase em até 3 linhas, texto de apoio com quebras de linha, foto (P&B automático), até 2 botões (sólido/contorno).
**Fora:** vídeo de fundo, carrossel de imagens, escolha de cor.
**Decisões pendentes:**
- Layout mobile/tablet proposto (não há frame mobile no Figma).
- Texto do Figma dizia "influenciam"; o seed usa "influencia" (concordância). Confirmar com o time Criativo.

## 3. Contrato no Strapi

| Propriedade | Valor |
| --- | --- |
| Display name | `Hero (abertura)` |
| Nome técnico | `sections.hero` |
| Onde entra | Dynamic zone `sections` de `page` |
| Componente no front | `next/src/components/sections/HeroSection/` |
| Chave do registry | `sections.hero` |

```text
sections.hero
├── titulo        Text (long) · obrigatório · máx. 60 · uma linha por frase
├── texto_apoio   Text (long) · máx. 220 · parágrafos separados por Enter
├── imagem        Media (1 imagem) · obrigatório
├── botoes[]      Component repeatable (shared.botao) · máx. 2
├── subtitulo     Text (long) · máx. 220 · opcional — texto abaixo da frase principal (coluna esquerda)
└── preto_e_branco Boolean · padrão true — false = foto colorida (páginas das unidades)
    ├── texto     Text (short) · obrigatório · máx. 30
    ├── url       Text (short) · obrigatório · máx. 300
    ├── estilo    Enumeration · solido | contorno · default solido
    └── nova_aba  Boolean · default false
```

### Regras do contrato

- `titulo` usa **quebra de linha** para separar as linhas visuais (mais simples para o editor do que uma lista).
- A foto é enviada **colorida**; o front aplica preto e branco (`filter: grayscale(1)`).
- Botões reutilizam `shared.botao` (mesmo componente do cabeçalho).

## 4. Campos

Textos exatos (label, descrição, placeholder, onde aparece) estão no guia do editor `strapi/src/editor-guide/sections.hero.json` e aparecem no painel do Strapi e na vitrine. Resumo:

| Campo | Nome no painel | Onde aparece |
| --- | --- | --- |
| `titulo` | Frase principal | Letras enormes brancas, canto inferior esquerdo da foto |
| `texto_apoio` | Texto de apoio | Texto menor à direita, acima dos botões (no celular, abaixo da frase) |
| `imagem` | Foto de fundo | Fundo inteiro da faixa |
| `botoes` | Botões | Abaixo do texto de apoio |
| `subtitulo` | Texto abaixo da frase principal | Coluna esquerda, logo abaixo do título (Figma 28:421; largura máx. 626px, token `--hero-subtitulo-max`) |
| `preto_e_branco` | Foto em preto e branco | Filtro P&B na foto (padrão ligado; Home). Desligado nas unidades (Figma "Hero / Campestre", 28:414) |

## 5. Exemplo de preenchimento

```text
Frase principal:  Amar.⏎Servir.⏎Influenciar.
Texto de apoio:   Uma igreja que ama, serve e influencia em cinco localidades, com as portas abertas todo domingo.⏎Tem um lugar pra você aqui.
Foto de fundo:    hero-adai.jpg (alt: "Voluntária sorri na entrada da igreja segurando uma placa…")
Botões:           Planeje sua visita → /planeje-sua-visita (Sólido) · Unidades → /unidades (Contorno)
```

## 6. JSON da API

Igual à variante `completo` de `HeroSection.mock.json` (capturado da API real em 2026-09-27; a URL da imagem no mock aponta para `/mocks/hero-adai.jpg`).

## 7. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| deixar a frase principal vazia | o Hero não aparece |
| escrever mais de 3 linhas | só as 3 primeiras aparecem |
| não enviar foto | fundo cinza-escuro (`#333`) |
| não preencher o texto alternativo da foto | a foto vira decorativa (`alt=""`) — evite |
| criar botão sem texto ou sem link, ou com link inválido (`javascript:`…) | o botão não aparece |
| criar mais de 2 botões | só os 2 primeiros aparecem |

## 8. Layout

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | 🟡 Cartão com altura mínima de 600px; frase, texto e botões empilhados; padding 24 |
| Tablet 769–1023 | 🟡 Igual ao mobile, padding 40 |
| Desktop ≥1024 | ✅ Figma: altura até 702px; frase à esquerda e apoio (máx. 360px) à direita; padding 56; raio 28 |

## 9. Checklist

### Strapi
- [x] Schema `sections.hero` criado e na dynamic zone de `page`
- [x] Guia do editor aplicado (labels, descrições e placeholders no painel)
- [x] Página `home` publicada com o Hero (seed de desenvolvimento)

### Front
- [x] `types`, `normalize`, `populate`, mock, registry coerentes com este doc
- [x] Estados incompletos cobertos por teste (`normalize.test.ts`)
- [x] Vitrine com 4 variações e guia do editor

### Qualidade
- [ ] ⏳ Validação humana: leitor de tela, celular real, layout mobile aprovado pelo design

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `planejar_visita` (conversão) no botão para `/planeje-sua-visita`; `clique_cta` nos demais; `ver_secao`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/HeroSection/HeroSection.test.tsx`
- `next/src/components/sections/HeroSection/normalize.test.ts`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
