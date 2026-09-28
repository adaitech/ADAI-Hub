---
name: lighthouse-performance-mcp
description: Audita performance (e opcionalmente acessibilidade, SEO e boas práticas) com Lighthouse via MCP ou CLI no ADAI Hub. Orienta next start vs next dev, variância de score e leitura de LCP/TBT/CLS, e relaciona oportunidades aos arquivos do projeto. Use quando o pedido for Lighthouse, performance mobile/desktop local ou análise após mudanças de imagem, fonte ou seções.
---

# Lighthouse — Performance

Adaptada da skill `lighthouse-performance-mcp` do vitru-portal (sem os scripts shell do vitru; usa a CLI do Lighthouse diretamente).

## Pré-requisitos

1. **Servidor de produção local** — números comparáveis só com build:
   ```bash
   cd next && yarn build && yarn start   # http://localhost:3000
   ```
   `next dev` distorce LCP/TBT (HMR, JS não minificado): **não** usar para decidir.
2. Strapi rodando com conteúdo (`cd strapi && yarn develop`), se a página depender do CMS.
3. MCP de Lighthouse é opcional (score rápido); **oportunidades detalhadas vêm do JSON da CLI** (ver [`reference.md`](reference.md)).

## Metas (DoD)

- **Mobile ≥ 80** (fluxo principal) · desktop ≥ 90 quando medido.
- LCP < 2,5 s · CLS < 0,1 · TBT baixo (proxy de INP < 200 ms).
- Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90 (quando pedidas as categorias extras).

## Interpretação (sempre comunicar)

1. **Um run não é verdade absoluta**: variância de ±10–15 pontos é comum → 3 runs e mediana para decidir.
2. **Extensões do Chrome** inflam TBT → usar headless/anônimo.
3. Score ruim em `next dev` **não** invalida produção.
4. **LCP da Home é a foto do Hero**: conferir `next/image` com `priority`, `sizes="100vw"` e formato moderno; e que as fontes vêm de `next/font`.
5. Lighthouse local não substitui medição em ambiente publicado.

## Fluxo

1. Reutilizar o servidor se a URL já responder; senão, build + start.
2. Rodar a CLI mobile com saída JSON em `documents/lighthouse/` (comando em `reference.md`).
3. Extrair do JSON: score, FCP, LCP, TBT, CLS e as **3 maiores oportunidades** (receita em `reference.md`).
4. Relacionar cada oportunidade a arquivos reais (`next/src/components/...`, `layout.tsx`, `next.config.ts`).
5. Encerrar o servidor só se foi iniciado nesta execução.

## Saída para o usuário

- URL, device, throttling, dev vs prod.
- Score + FCP/LCP/TBT/CLS.
- Top 3 oportunidades com arquivo e ação sugerida.
- Aviso de variância se o score estiver perto da meta.
