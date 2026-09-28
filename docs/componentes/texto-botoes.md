# Texto e botões — `sections.texto-botoes`

> Figma: [A igreja no seu bolso (1:296)](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-296) · Vitrine: `/componentes/texto-botoes`

Chamada central reutilizável com título, texto de apoio e até dois botões, sem imagem. Na Home, convida a baixar o aplicativo da ADAI. A App Store usa `https://apps.apple.com/mw/app/igreja-adai/id6736497082` e o Google Play usa `https://play.google.com/store/apps/details?id=br.com.inchurch.adaltoipiranga&hl=pt_BR&pli=1`; ambos abrem em nova aba.

## Edição no Strapi

| Campo | Uso |
| --- | --- |
| `titulo` | Obrigatório, até 80 caracteres. Sem título, a seção não aparece. |
| `texto_apoio` | Opcional, até 200 caracteres. |
| `botoes[]` | Até duas ações `shared.botao`, com texto, URL, estilo e opção de nova aba. |

O Next ignora URLs inseguras e botões sem texto, limita a dois itens e mantém o título quando não há ações. A vitrine cobre conteúdo completo, mínimo e texto longo.

No desktop, o título usa a tipografia da chamada no Figma (77,8px em 1440px), texto de 20px e respiro vertical de 129,6px. Os botões ocupam a largura disponível em telas pequenas.
