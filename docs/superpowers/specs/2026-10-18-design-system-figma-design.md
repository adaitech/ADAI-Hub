# Design system do Figma — design

**Data:** 2026-10-18 · **Figma:** `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`) · **Página:** `Home` (node `0:1`) · **Caminho:** arquitetural

## 1. Objetivo

Transformar o arquivo Figma `adai.com.br` em uma referência técnica, visual e reutilizável para o ADAI Hub. A entrega documenta o que está efetivamente desenhado, distingue inferência de proposta e alinha a camada central de tokens do front sem atribuir ao Figma decisões responsivas ou interativas que ele não contém.

O resultado principal terá três artefatos:

- `docs/design-system.md`: referência completa, auditável e textual;
- `docs/design-system.html`: style guide autocontido e navegável;
- `templates/adai-page-template.html`: composição HTML reutilizável de uma página típica.

Como o projeto já mantém uma fonte de verdade de tokens, o escopo também inclui reconciliar a documentação e o CSS existentes com a auditoria:

- `.agents/rules/Design-Tokens.md`;
- `.agents/rules/Stack-Fontes-e-Bibliotecas.md`;
- `next/src/styles/tokens.css`;
- testes estáticos diretamente afetados pela mudança dos contratos de token.

Não serão adicionados arquivos da Suisse Intl nem será presumida licença web.

## 2. Evidências e inventário

### 2.1 Pranchas obrigatórias

A auditoria cobre as 15 pranchas de primeiro nível encontradas na página `Home`:

| ID | Prancha |
| --- | --- |
| `1:3` | Home / Desktop |
| `4:270` | Unidade / Campestre / Desktop |
| `220:18960` | Nossa História · `/sobre-nos/nossa-historia` |
| `220:19032` | A Igreja Que Vemos · `/sobre-nos/a-igreja-que-vemos` |
| `220:19107` | No que cremos · `/sobre-nos/no-que-acreditamos` |
| `220:19183` | Jesus · `/jesus` |
| `220:19253` | Agenda · `/agenda` |
| `220:19333` | Contribua · `/contribua` |
| `220:19389` | Nossa Casa · `/nossacasa` |
| `220:19607` | Connect · `/connect` |
| `220:19491` | Contato · `/contato` |
| `253:1255` | Template · Ministério |
| `255:1357` | Template · Próximo passo |
| `256:1459` | Template · Evento |
| `257:1560` | Template · Mensagens |

A seção `Componentes` é o node `237:1296`.

### 2.2 Componentes obrigatórios

| ID | Componente |
| --- | --- |
| `244:1256` | Navegação / Barra de anúncio |
| `233:21` | Navegação / Top bar |
| `233:48` | Navegação / Header |
| `233:106` | Navegação / Footer |
| `237:1253` | Botão |
| `237:1246` | Botão · Claro |
| `237:1249` | Botão · Contorno |
| `237:1252` | Botão · Primário |
| `234:998` | Card / Unidade |
| `237:1199` | Card / Evento |
| `238:1236` | Card / Evento agenda |
| `234:1010` | Card / Página relacionada |

### 2.3 Método de auditoria

Para cada prancha e componente serão coletados, quando disponíveis: nome e ID do nó, dimensões, hierarquia, tipografia, preenchimentos, bordas, raios, espaçamentos, auto-layout, instâncias e estados representados. A inspeção estrutural será cruzada com captura visual do nó.

Cada afirmação receberá uma das classificações abaixo:

- **Observado:** valor lido diretamente de nó, estilo ou variável do Figma;
- **Derivado:** recorrência consolidada a partir de mais de uma evidência identificada;
- **Proposto:** decisão necessária para produção, mas ausente do Figma.

Valor ilegível ou ausente será registrado como **não identificado**. Uma semelhança visual isolada não autoriza consolidar componentes ou tokens.

## 3. Fonte de verdade e reconciliação

### 3.1 Precedência

Para propriedades visuais representadas no arquivo, o Figma é a fonte observada. Para acessibilidade, responsividade, estados ausentes, licenciamento, stack e comportamento de produção, prevalecem as regras do ADAI Hub e as decisões explicitamente marcadas como propostas.

O Markdown será a referência humana consolidada. `next/src/styles/tokens.css` será a fonte executável do produto. O HTML visual e o template repetirão o mesmo conjunto canônico de custom properties porque ambos precisam funcionar de forma autocontida; um teste comparará os nomes e valores compartilhados para impedir divergência acidental.

### 3.2 Conflitos já identificados

| Tema | Figma observado | Projeto atual | Tratamento |
| --- | --- | --- | --- |
| Tipografia | SuisseIntl-Bold e SuisseIntl-Book | Inter Tight e Inter | Documentar a Suisse como fonte de design e manter Inter Tight/Inter como fallback licenciado de produção até existir licença web comprovada. |
| Escala | estilos locais Display, H1–H4, Abertura, Corpo, Corpo pequeno, Legenda, Micro, Botão, Link menu, Número/Data e Marca/Rodapé | escala parcial com nomes históricos | Criar tokens canônicos para toda a escala e aliases temporários apenas onde consumidores existentes precisarem de migração segura. |
| Container | viewport de 1440px, conteúdo recorrente de 1280px e margens de 80px | `--container-max: 1440px` e gutter fluido de até 57,6px | Separar shell de 1440px de container de conteúdo de 1280px; 80px é observado no desktop. |
| Espaço de seção | recorrência de 120px vertical | token atual chega a 129,6px em 1440px | Alinhar o valor desktop a 120px; mínimos mobile/tablet permanecem propostas. |
| Raio pequeno | variável local `raio/pequeno` e base informada de 14px | `--radius-sm: 12px` proposto | Trocar para o valor observado após confirmar a variável e revisar consumidores. |
| Cinza acessível | `#777777` observado | `#6B6B6B` proposto para texto | Preservar ambos: `#777777` como primitivo observado, `#6B6B6B` como semântico proposto quando AA exigir. |

Compatibilidade não esconderá a origem: aliases terão comentário de migração e o documento indicará se apontam para valor observado ou proposto.

## 4. Tipografia e licença

Os 14 estilos locais já confirmados no Figma serão transcritos com valores exatos e IDs de estilo. A documentação explicará peso, line-height, tracking, contexto e exemplos de aplicação. O style guide exibirá Book e Bold lado a lado, além de usos corretos e incorretos do negrito.

No HTML autocontido, a pilha será:

```css
"Suisse Intl", "SuisseIntl-Book", Arial, Helvetica, sans-serif
```

Para títulos em Bold, a pilha continuará declarativa, com `font-weight: 700`. Sem a fonte instalada, o conteúdo seguirá legível em Arial/Helvetica. No Next, Inter e Inter Tight permanecem auto-hospedadas via `next/font` como substitutas licenciadas. A documentação de stack deixará explícito o mapeamento Suisse Book → Inter/Inter Tight Regular e Suisse Bold → Inter/Inter Tight Bold.

Adotar a fonte oficial no produto exigirá prova de licença web e arquivos `.woff2`; essa futura mudança usará `next/font/local` e não alterará a API semântica dos componentes.

## 5. Arquitetura dos artefatos

### 5.1 `docs/design-system.md`

O documento seguirá a estrutura pedida: visão geral, evidências, tipografia, cores, espaçamento, layout, formas, componentes, padrões de página e boas práticas. Tabelas importantes terão coluna de classificação e exemplos de nodes. Regras propostas serão reunidas também em um inventário final, sem depender apenas de notas dispersas.

Cada componente terá finalidade, anatomia, variantes, medidas, tipografia, cores, espaçamentos, estados observados, estados propostos, uso/antiuso e acessibilidade. As 15 pranchas terão ao menos um registro de inspeção e seus padrões relevantes.

### 5.2 `docs/design-system.html`

Será uma página HTML5 única, sem dependências de rede, com:

- navegação interna com skip link;
- `header`, `nav`, `main`, seções identificadas e `footer`;
- tokens em `:root` organizados por cor, tipografia, espaço, forma e layout;
- paleta, escala tipográfica completa, pesos, contraste, espaçamentos e raios;
- botões, links, cards, campos de formulário, header/footer e seções reais;
- badges visuais de Observado, Derivado e Proposto;
- demonstração de grid de 1280px dentro de shell de 1440px;
- estados `:hover`, `:focus-visible`, `:active` e `:disabled`;
- suporte a `prefers-reduced-motion` e `prefers-contrast` sem depender de JavaScript.

O JavaScript, se necessário, ficará limitado a melhorias progressivas sem impedir leitura, navegação ou exemplos quando desativado.

### 5.3 `templates/adai-page-template.html`

O template também será autocontido e usará o mesmo núcleo de tokens. Terá comentários claros nos pontos de troca de conteúdo, imagem e destino, além de:

- barra de anúncio, top bar, header e navegação;
- hero com título, descrição e ações;
- seção editorial;
- grade de cards;
- CTA de destaque;
- footer.

A estrutura semântica permitirá adaptação a ministério, próximo passo, evento, mensagens e página institucional sem duplicar layouts inteiros. Variações serão indicadas por comentários e classes modificadoras pequenas, não por cinco templates incompletos.

## 6. Tokens e migração do front

`tokens.css` será organizado em primitivos e semânticos. Os tokens compartilhados pelos artefatos terão nomes equivalentes e valores consistentes. A escala consolidada incluirá os valores observados 8, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96 e 120px somente quando a auditoria confirmar uso sistemático; ocorrências locais não serão promovidas automaticamente.

A migração seguirá estas regras:

1. adicionar os tokens canônicos confirmados;
2. mapear nomes antigos usados em vários componentes para o novo valor quando a semântica for equivalente;
3. manter alias temporário quando a remoção exigir mudança ampla sem benefício funcional;
4. atualizar módulos CSS somente quando o token antigo misturar papéis diferentes ou produzir valor contrário ao Figma;
5. não alterar conteúdo, contrato do Strapi, analytics ou lógica dos componentes;
6. registrar qualquer divergência visual remanescente como pendência explícita.

Esse trabalho não transforma a documentação em uma refatoração indiscriminada de todas as páginas. A camada central fica alinhada e consumidores incompatíveis são corrigidos; diferenças locais fora do padrão são documentadas para ciclos próprios.

## 7. Responsividade proposta

O arquivo não contém pranchas mobile ou tablet. O desktop de 1440px será marcado como observado. Os tiers do projeto permanecem:

- mobile: base, até 768px;
- tablet: `@media (min-width: 769px)`;
- desktop: `@media (min-width: 1024px)`.

Decisões propostas:

- reduzir gutters por `clamp()` sem ultrapassar os 80px observados;
- empilhar texto e mídia, preservando a ordem de leitura;
- transformar grades de cinco, três ou duas colunas em uma coluna no mobile e duas no tablet quando couber;
- permitir quebra de títulos, usando escala fluida e `overflow-wrap` sem `white-space: nowrap`;
- manter controles com área mínima de 44×44px;
- tornar navegação compacta sem esconder conteúdo essencial;
- conservar proporção e `object-fit` das mídias;
- impedir overflow horizontal em 375px.

Nenhuma dessas regras será atribuída ao Figma.

## 8. Acessibilidade e contraste

As combinações foreground/background serão calculadas conforme WCAG 2.2. Texto normal exigirá 4,5:1 e texto grande, 3:1. O `#777777` observado será demonstrado, mas não recomendado sobre `#F2F2F2`, onde falha AA para texto normal. O semântico acessível existente (`#6B6B6B`) permanecerá classificado como proposta do produto.

Os HTMLs terão landmarks, hierarquia de títulos, labels visíveis, nomes acessíveis, foco evidente, ordem de tabulação natural, links distinguíveis e estados não comunicados apenas por cor. Exemplos incorretos serão apresentados como demonstração não interativa ou claramente rotulada para não criar barreiras reais na própria documentação.

## 9. Testes e verificação

O trabalho seguirá TDD para os contratos verificáveis. Antes das alterações de produção, os testes devem falhar pelos motivos esperados e depois passar. A cobertura incluirá:

- presença dos três artefatos e ausência de placeholders, TODOs ou seções vazias;
- inventário das 15 pranchas e dos 12 componentes/variantes;
- consistência dos tokens compartilhados entre Markdown, style guide, template e `tokens.css`;
- HTML semântico, idioma `pt-BR`, viewport, títulos, labels e destinos válidos;
- ausência de dependências externas e de arquivos proprietários da Suisse Intl;
- regras existentes de CSS, tokens e breakpoints;
- contraste das combinações documentadas;
- navegação por teclado e foco visível;
- inspeção visual em 375, 768, 1024 e 1440px;
- `document.documentElement.scrollWidth <= innerWidth` e ausência de texto cortado;
- `yarn quality` e `yarn build` do Next, proporcionais às alterações centrais.

Como esta entrega não altera Strapi nem conteúdo editorial, build do Strapi, seed, snapshot e os cinco pilares de componentes CMS não entram no escopo. Se a implementação revelar mudança em componente ou contrato editorial, o plano será interrompido e ampliado antes de alterar essas camadas.

## 10. Limites e pendências

Ficam fora de escopo:

- baixar, versionar ou incorporar a Suisse Intl;
- criar componentes, páginas ou schemas novos no Next/Strapi;
- modificar o arquivo Figma;
- inventar hover, animação ou comportamento mobile como se fossem observados;
- substituir conteúdo editorial existente;
- fazer uma auditoria pixel a pixel de páginas já implementadas além do necessário para migrar tokens incompatíveis.

Pendências esperadas ao final:

- confirmação documental da licença web da Suisse Intl;
- validação do layout mobile pelo time de design;
- decisão sobre eventuais exceções locais que não mereçam token;
- aprovação de ajustes acessíveis que divergem do valor visual original, como o cinza de texto.

## 11. Critério de conclusão

O trabalho só será considerado concluído quando os três artefatos estiverem completos, as 15 pranchas e os componentes obrigatórios constarem na evidência, os tokens centrais estiverem reconciliados, os HTMLs forem navegáveis por teclado e responsivos, as propostas estiverem listadas separadamente e os gates executados tiverem evidência nesta sessão. Qualquer validação impossível será descrita como pendente, nunca presumida.
