---
name: create-strapi-doc
description: Cria ou revisa o contrato de um componente no Strapi (schema, campos, limites, enumerations, JSON de exemplo) e o guia do editor (descrição, placeholder e onde cada campo aparece na página). Use quando o pedido envolver documentar, estruturar, modelar ou conferir um componente/seção no CMS, criar docs em docs/componentes/ ou o arquivo de guia em strapi/src/editor-guide/.
---

# Criar documentação de componente no Strapi

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`cd next && yarn quality`). Ver `.agents/rules/Testes.md` e o checklist `.agents/rules/Pull-Request.md` (antes de subir e antes de abrir o PR).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — `.agents/rules/Metodo-Superpowers.md`. Esta skill é um complemento do método, não um substituto.

Produzir um contrato que uma pessoa consiga executar no Strapi **sem deduzir** nomes técnicos, ordem, validações ou textos de ajuda — e que o editor final (ministérios, time Criativo) entenda **sem saber programar**.

Adaptada da skill `create-contentstack-doc` do vitru-portal.

## Recursos

- Esqueleto do doc: [`assets/strapi-doc-template.md`](assets/strapi-doc-template.md) — adaptar e remover blocos que não se aplicam.
- Regras: `.agents/rules/Componentes-e-CMS.md` (convenções de nome, categorias, governança) e `.agents/rules/Vitrine-de-Componentes.md`.

## Saídas (sempre as três, coerentes entre si)

| Artefato | Caminho | Para quem |
| --- | --- | --- |
| Doc técnico-editorial | `docs/componentes/<slug>.md` | Dev, IA, revisor de PR |
| Guia do editor (fonte única) | `strapi/src/editor-guide/<nome-tecnico>.json` | Painel do Strapi (descrição/placeholder) **e** vitrine `/componentes/<slug>` (aba "Guia do editor") |
| Schema | `strapi/src/components/<categoria>/<nome>.json` | Strapi |

## 1. Reunir evidências

1. Ler `AGENTS.md` e as regras materiais.
2. `git status` — preservar mudanças não relacionadas.
3. Procurar docs parecidos em `docs/componentes/` (no máximo dois como exemplo).
4. Ler demanda, Figma (uma chamada por seção; reaproveitar resultado) ou material do usuário.
5. Se já houver código: conferir `types.ts`, `normalize.ts`, `populate.ts`, `.mock.json`, registry e testes.
6. Procurar componentes `shared.*` existentes antes de propor outro (principalmente `shared.link` para CTA e `shared.midia`).

Precedência quando fontes divergem:

1. requisito explicitamente aprovado;
2. schema real do Strapi / JSON observado na API;
3. contrato implementado e coberto por testes;
4. Figma;
5. convenção dos docs existentes.

Divergência → registrar como **decisão pendente**. Não inventar nome técnico, obrigatoriedade, limite, opção de enumeration nem comportamento.

## 2. Definir o contrato antes do tutorial

Explicitar:

- display name (pt-BR) e nome técnico (`categoria.kebab-case`);
- anatomia e ordem dos campos (a ordem do painel = ordem de leitura na página);
- campos raiz vs. componentes aninhados (`items.*`, `shared.*`) e se são repetíveis (mín./máx.);
- obrigatoriedade e dependências condicionais (ex.: "texto do botão só vale com link");
- enumerations como pares `Rótulo: valor`, com default;
- relações com collection types (ex.: `evento`);
- comportamento mobile e desktop quando a estrutura afeta layout;
- o JSON que a API entrega (com `__component` e `id`).

Aplicar a governança de `Componentes-e-CMS.md` §2.4: nada de cor, fonte, HTML ou CSS livres.

## 3. Ficha de cada campo

Uma ficha por campo, na ordem de cadastro, com tabela `Propriedade | Valor`:

| Propriedade | Regra |
| --- | --- |
| **Nome no painel** (label) | Curto, pt-BR, sem jargão. Ex.: `Título (linhas)` |
| **Nome técnico** | `snake_case` sem acento. Ex.: `titulo_linhas` |
| **Tipo Strapi** | `Text (short)`, `Text (long)`, `Rich text (Blocks)`, `Media`, `Enumeration`, `Boolean`, `Component (repeatable)`, `Relation`… |
| **Obrigatório** | Sim / Não |
| **Limites** | `maxLength`, mín./máx. de itens, tipos de mídia aceitos |
| **Default** | Enumerations e booleanos |
| **Descrição no painel** | Aparece abaixo do campo no Strapi. **Máx. ~140 caracteres**, orientada à ação: *o que preencher*. |
| **Placeholder** | Só em campos de texto. Começa com `Ex.:` e usa conteúdo realista da ADAI. |
| **Onde aparece** | Região visível na página, em linguagem de editor. Ex.: *"Letras grandes brancas no canto inferior esquerdo da foto."* |
| **Dicas** | Regras extras: o que evitar, tom de voz, recorte de imagem, texto alternativo. |

Regras de escrita (texto vai para pessoas que **não** são devs):

- Nada de "normalize", "registry", "payload", "props", "renderiza".
- Explicar consequência visível: *"Se ficar vazio, o botão não aparece."*
- Imagem: sempre orientar o **texto alternativo** (descrever a cena para quem não enxerga) e o recorte.
- Rich text: listar o que é permitido (parágrafo, negrito, itálico, lista, link).

## 4. Guia do editor (`strapi/src/editor-guide/<nome-tecnico>.json`)

Fonte única dos textos de ajuda. Formato:

```json
{
  "uid": "sections.hero",
  "nome": "Hero (abertura da página)",
  "resumo": "Primeira faixa da página: foto grande em preto e branco com a frase principal e até dois botões.",
  "ondeAparece": "Topo da página, logo abaixo do cabeçalho. Use apenas um Hero por página.",
  "boasPraticas": ["Frases curtas, uma ideia por linha.", "Foto com pessoas reais da ADAI."],
  "campos": [
    {
      "campo": "titulo",
      "label": "Frase principal",
      "descricao": "Uma frase por linha (aperte Enter para quebrar). Até 3 linhas curtas.",
      "placeholder": "Ex.: Amar. (Enter) Servir. (Enter) Influenciar.",
      "ondeAparece": "Letras enormes brancas no canto inferior esquerdo da foto.",
      "obrigatorio": true,
      "limite": "Até 3 linhas · 60 caracteres no total",
      "exemplo": "Amar.\nServir.\nInfluenciar."
    },
    {
      "campo": "botoes",
      "label": "Botões",
      "descricao": "Até 2 botões.",
      "placeholder": "",
      "ondeAparece": "Abaixo do texto de apoio.",
      "obrigatorio": false,
      "limite": "Até 2 botões",
      "exemplo": "Planeje sua visita (Sólido)",
      "componente": "shared.botao"
    }
  ]
}
```

- `uid` = nome técnico do componente (`sections.hero`) ou do content type (`api::page.page`); o arquivo se chama `<uid>.json` (ex.: `api.page.json` para content types).
- Todo arquivo novo precisa ser importado em `strapi/src/editor-guide/index.ts`.
- `label`, `descricao` e `placeholder` são aplicados ao painel do Strapi no bootstrap (`strapi/src/bootstrap/editor-guide.ts`); `descricao` com **no máximo 140 caracteres**.
- `componente` aponta o guia do componente aninhado (a vitrine mostra os campos dele numa sub-tabela).
- Itens repetíveis ganham um "campo principal" (título do item no painel) em `mainFields`, no mesmo `index.ts`.
- A vitrine mostra `resumo`, `ondeAparece`, `boasPraticas` e a tabela de `campos`.
- Todo campo do JSON da API precisa estar em `campos` (o `catalog.test.tsx` da vitrine confere).

## 5. Integração editorial (no doc)

Documentar quando aplicável:

1. inclusão do componente na dynamic zone `sections` de `page` (ou no single type `global`);
2. relações e collection types envolvidos;
3. exemplo de preenchimento realista (conteúdo da ADAI, não lorem ipsum);
4. JSON esperado da API, coerente com o `.mock.json`;
5. estados incompletos (tabela "se o editor deixar X vazio → acontece Y");
6. checklist de CMS, frontend e qualidade.

Separar claramente os status **proposto → implementado → publicado no Strapi → validado**. Não afirmar que algo foi criado no Strapi, testado no browser ou publicado sem evidência.

## 6. Revisar contra o frontend

Confirmar:

- nome técnico igual à chave do `sectionRegistry`;
- campos e formatos iguais a `types.ts`, `normalize.ts` e `.mock.json`;
- obrigatoriedade editorial compatível com o fallback do `normalize`;
- ordem dos campos = ordem de leitura renderizada;
- defaults de enumeration aceitos pelo `normalize`;
- guia do editor cobre todos os campos do schema;
- doc não promete variação visual que o componente não tem.

Doc bonito mas incompatível com o código **não está concluído**.

## 7. Regra dos 5 pilares (obrigatória)

O doc só vale quando o componente existe e foi **verificado com Strapi e Next rodando** nos cinco pilares (`AGENTS.md` → Regra dos 5 pilares):

1. **Strapi:** schema + guia do editor aplicado no painel + conteúdo cadastrado (seed de dev; subir `SEED_VERSION` em `strapi/src/bootstrap/seed.ts` quando a Home ganhar seção nova — variações extras vão para a página `exemplos`).
2. **Página:** a seção aparece numa página real vinda do Strapi (Home ou `/exemplos`).
3. **Vitrine:** `/componentes/<slug>` com as variações em abas, os `controles` de cada opção do Strapi e o guia do editor.
4. **SEO:** `h1` único/hierarquia de títulos, `alt`, texto de link descritivo, conteúdo no HTML do servidor.
5. **Medição:** o doc tem a seção **`## Medição (DataLayer)`** (linha **"Medição"**) dizendo se o componente usa evento existente (`clique_cta`, `ver_secao`…) ou se foi criado evento novo de `data_layer` (`docs/analytics/README.md` §5). Eventos não ficam no Strapi.
6. **Testes:** o doc tem a seção **`## Testes`** listando os arquivos de teste do componente (verificado por `cinco-pilares.test.ts`); nenhum PR sem eles (`.agents/rules/Testes.md`).

## 8. Validar e entregar

```bash
git diff --check
cd next && yarn quality   # inclui guia do editor × schema, 5 pilares, a11y/SEO e testes obrigatórios
```

Informar ao usuário: caminhos criados, contrato e campos cobertos, divergências/decisões pendentes, validações realmente executadas e que nada foi commitado.

Não criar nem alterar conteúdo no Strapi de produção sem pedido explícito.
