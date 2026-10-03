# Lista de ministérios — `sections.ministerios`

> Figma: [Encontre seu lugar (1:230)](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-230) · Vitrine: `/componentes/ministerios`

Convite para participação e lista vertical de ministérios. É uma lista estática, sem controles ou movimento de carrossel. No desktop, a caixa cinza com cantos arredondados tem duas colunas: convite à esquerda e oito linhas à direita. No celular, o convite aparece acima da lista.

## Edição no Strapi

| Campo | Uso |
| --- | --- |
| `titulo` | Convite curto. Obrigatório; sem ele a seção não aparece. |
| `texto_apoio` | Até 200 caracteres; Enter preserva a quebra de linha. |
| `botao` | Ação opcional “Quero servir” via `shared.botao`. |
| `ministerios[]` | De 1 a 12 itens na ordem de exibição. Cada `items.ministerio` tem `nome` obrigatório, `publico` e `url` opcionais. |

Na Home inicial, KIDS, INPULSE, PULSE, FLORES, ENRAIZADOS, ESPORTE, MUSIC e CRTV aparecem na ordem do Figma. Ainda não há destinos publicados para cada ministério, então suas linhas são texto, sem clique; ao cadastrar uma URL válida no Strapi, a linha vira link. O botão “Quero servir” usa o formulário público atualmente vinculado pelo site da ADAI.

Os grupos da API inChurch não trazem os públicos e destinos desta lista; a curadoria da seção fica no Strapi. URLs inseguras são descartadas pelo Next.js. Itens sem nome são ignorados, e a renderização limita a 12 itens mesmo com dados fora do contrato.

## Layout e validação

No desktop, padding interno de 72px, vão entre colunas de 86px e linhas de 78px seguem o nó do Figma. O layout responsivo empilha colunas e põe o público abaixo do nome em telas menores. A vitrine inclui estados completo, mínimo e texto longo.

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `selecionar_ministerio` (`ministerio` = nome); `clique_cta`; `ver_secao`.
