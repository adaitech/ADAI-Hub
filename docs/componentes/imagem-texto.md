# Imagem e texto — componente `sections.imagem-texto`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: Home e `/exemplos`, seed atual v14) · validação humana pendente
> **Figma:** [Primeira vez — node 1:107](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-107) · [Nossa Liderança — node 6:4](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=6-4) · [Contribua — node 1:279](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-279)
> **Vitrine:** `/componentes/imagem-texto`
> **Guia do editor:** `strapi/src/editor-guide/sections.imagem-texto.json` + `items.destaque.json`

## 1. O que é

Foto grande (preto e branco, 4:5) de um lado e texto do outro: rótulo, título grande, parágrafos, lista de destaques, botão e link. **Um único componente** atende "Primeira vez na ADAI?" (foto à esquerda + lista + botão), "Pastores Líderes — Rodrigo & Tati Soeiro" (foto à direita + rótulo + botão) e "Contribua" (foto à esquerda + três botões).

## 2. Contrato no Strapi

```text
sections.imagem-texto
├── imagem          Media (1 imagem) · obrigatório
├── posicao_imagem  Enumeration · esquerda | direita · default esquerda
├── rotulo          Text (short) · máx. 40
├── titulo          Text (long) · obrigatório · máx. 80 · Enter quebra a linha
├── texto           Text (long) · máx. 400 · Enter = novo parágrafo
├── lista[]         Component repeatable (items.destaque) · máx. 5
│   ├── titulo      Text (short) · obrigatório · máx. 30
│   └── texto       Text (long) · máx. 160
├── botao           Component (shared.botao) · opcional
├── botoes_secundarios[] Component repeatable (shared.botao) · máx. 2 · opcional
└── link            Component (shared.link) · opcional
```

## 3. Variações

| Variação | Onde ver |
| --- | --- |
| Primeira vez: foto à esquerda, lista de 3, botão | Home · vitrine `completo` |
| Pastores Líderes: foto à direita, rótulo, texto, botão | Home · vitrine `direita` |
| Botão + link | `/exemplos` · vitrine `com_link` |
| Contribua: foto à esquerda, botão principal largo e dois botões menores | Home · vitrine `contribua` |
| Mínimo (foto + título) | vitrine `minimo` |
| Texto longo | vitrine `texto_longo` |

## 4. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| deixar o título vazio | a seção não aparece |
| não enviar foto | o texto ocupa a largura toda |
| criar item da lista sem título | o item não aparece |
| passar de 5 itens na lista | só os 5 primeiros aparecem |
| não escolher o lado da foto | esquerda |

## 5. Layout

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | 🟡 Foto em cima (sempre), texto abaixo; lista empilhada |
| Tablet 769–1023 | 🟡 Igual ao mobile; itens da lista com título e explicação lado a lado |
| Desktop ≥1024 | ✅ Duas colunas iguais, 86px entre elas, texto centralizado na vertical; foto à esquerda ou direita |

A ordem no HTML é sempre foto → texto (leitura e teclado previsíveis); a troca de lado no desktop é só visual (CSS grid).

Em “Contribua”, `botoes_secundarios` cria uma segunda linha de ações e o botão principal ocupa toda a largura do grupo. O componente normaliza e limita a dois botões secundários. “Contribuir agora” e “Outras formas de contribuir” apontam por enquanto a `/contribua`, que pode retornar 404 até essa página ser criada; “Projeto Nossa Casa” aponta ao site público da ADAI.

## 6. Fotos e textos (conferidos no Figma pelo navegador em 2026-09-27)

| Seção | Foto | P&B | Origem |
| --- | --- | --- | --- |
| Primeira vez (1:108) | Culto com telão "Bem-vindos, voluntários" (2160×1440, original colorido) | Sim | Download do fill original |
| Pastores Líderes (6:14) | Rodrigo e Tati diante de parede de mármore (1268×1584) | **Não** (colorida no Figma) | Export 2x do nó, como aparece no layout |

- Por isso existe o campo **"Foto em preto e branco"** (`preto_e_branco`, padrão ligado).
- Raio das fotos confirmado: **20px** (`--radius-md`).
- Textos de "Primeira vez" vindos do Figma: subtítulo "Chegar num lugar novo pode ser estranho. Por isso, vale saber um pouco antes de ir." e itens "Como é o culto", "Seus filhos", "Fale com a gente".
- ⚠️ O nó 6:14 tem, como preenchimento, uma **imagem gerada por IA** (nome do arquivo é um prompt: "Professional portrait of a couple, pastor Rodrigo…"), que fica escondida sob a foto real. Ela **não** foi usada. Recomenda-se remover essa camada do Figma para não ser exportada por engano.

## 7. Pendências

- ⏳ Validação humana: leitor de tela, celular real, aprovação do design para o mobile.
