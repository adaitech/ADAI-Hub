# Perguntas frequentes — `sections.perguntas-frequentes`

> Figma: [Perguntas frequentes (31:167)](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=31-167) · Vitrine: `/componentes/perguntas-frequentes`

Seção de perguntas e respostas. A Home traz quatro dúvidas de primeira visita: ir sozinho, ADAI Kids, estacionamento e como se conectar após o culto.

## Edição no Strapi

| Campo | Uso |
| --- | --- |
| `titulo` | Obrigatório, até 80 caracteres. |
| `texto_apoio` | Opcional, até 200 caracteres. |
| `perguntas[]` | De 1 a 12 itens `items.pergunta-frequente`, na ordem exibida. |
| `pergunta` | Texto obrigatório, até 120 caracteres. |
| `resposta` | Texto obrigatório, até 500 caracteres. |

O Next descarta pares incompletos e oculta a seção se não restar nenhuma pergunta válida. Cada resposta usa `<details>` e `<summary>` nativos: abre por clique ou teclado, sem JavaScript. O sinal de mais muda para menos quando o painel abre. A vitrine cobre conteúdo completo, mínimo e texto longo.
