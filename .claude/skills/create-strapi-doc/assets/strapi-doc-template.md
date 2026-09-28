# [NOME EDITORIAL] — componente `[categoria.nome-tecnico]`

> **Status:** `[PROPOSTO | IMPLEMENTADO | PUBLICADO NO STRAPI | VALIDADO]`
> **Figma:** `[link com node-id | NÃO DISPONÍVEL]`
> **Vitrine:** `/componentes/[slug]`
> **Guia do editor:** `strapi/src/editor-guide/[nome-tecnico].json`

## 1. O que é

[Uso editorial em 2–3 frases: o que a pessoa vê na página e para que serve. Ligar à visão quando fizer sentido.]

**Onde é usado:** [Home, páginas de ministério, campanhas…]
**Quantas vezes por página:** [ex.: uma]

## 2. Escopo

**Dentro:** [ITEM]
**Fora:** [ITEM]
**Decisões pendentes:** [ITEM ou `Nenhuma`]

## 3. Contrato no Strapi

| Propriedade | Valor |
| --- | --- |
| Display name | `[Nome]` |
| Nome técnico | `[categoria.nome-tecnico]` |
| Onde entra | Dynamic zone `sections` de `page` / single type `global` |
| Componente no front | `next/src/components/[pasta]/[Nome]/` |
| Chave do registry | `[categoria.nome-tecnico]` |

```text
[categoria.nome-tecnico]
├── [campo_raiz]            Text (short) · obrigatório · máx. [N]
├── [enumeracao]            Enumeration · default [valor]
└── [itens][]               Component repeatable (items.[nome]) · [mín]–[máx]
    ├── [campo_interno]
    └── [link]              Component (shared.link)
```

### Regras do contrato

- [Obrigatoriedade, ordem, fallback, reuso]

## 4. Campos (na ordem do painel)

### 4.1 `[campo_raiz]`

| Propriedade | Valor |
| --- | --- |
| Nome no painel | `[Label]` |
| Nome técnico | `[campo_raiz]` |
| Tipo Strapi | `Text (short)` |
| Obrigatório | `[Sim / Não]` |
| Limites | `máx. [N] caracteres` |
| Descrição no painel | `[até ~140 caracteres, orientada à ação]` |
| Placeholder | `Ex.: [conteúdo realista]` |
| Onde aparece | `[região visível, linguagem de editor]` |
| Dicas | `[o que evitar, tom, recorte…]` |

### 4.2 `[enumeracao]`

| Propriedade | Valor |
| --- | --- |
| Nome no painel | `[Label]` |
| Nome técnico | `[enumeracao]` |
| Tipo Strapi | `Enumeration` |
| Opções | `[Rótulo]: [valor]` / `[Rótulo]: [valor]` |
| Default | `[valor]` |
| Descrição no painel | `[...]` |
| Placeholder | Não se aplica |
| Onde aparece | `[...]` |

*(Criar uma ficha por campo real; remover as de exemplo.)*

## 5. Exemplo de preenchimento

```text
[campo]: [valor realista da ADAI]
[itens]
└─ [campo_interno]: [valor]
```

## 6. JSON da API (igual ao `.mock.json` → variante `completo`)

```json
{
  "__component": "[categoria.nome-tecnico]",
  "id": 1,
  "[campo]": "[valor]"
}
```

## 7. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| deixar `[campo]` vazio | [o bloco não aparece / o botão some / …] |

## 8. Layout

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | [...] |
| Tablet 769–1023 | [...] |
| Desktop ≥1024 | [...] (Figma) |

## 9. Checklist

### Strapi
- [ ] Schema criado com o nome técnico correto
- [ ] Campos, tipos, ordem, obrigatoriedade e limites conferidos
- [ ] Guia do editor (`editor-guide/*.json`) com todos os campos; descrições aparecendo no painel
- [ ] Componente adicionado à dynamic zone / single type

### Front
- [ ] `types`, `normalize`, `populate`, `mock`, registry coerentes com este doc
- [ ] Estados incompletos cobertos por teste
- [ ] Vitrine `/componentes/[slug]` com variantes e guia do editor

### Qualidade
- [ ] `yarn quality` e `yarn build` (executados nesta sessão ou ⏳)
- [ ] Mobile e desktop conferidos
