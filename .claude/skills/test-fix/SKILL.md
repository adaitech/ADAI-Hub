---
name: test-fix
description: Executa os testes corretos do ADAI Hub (Next e, quando aplicável, Strapi) e corrige falhas relacionadas à solicitação. Use quando o usuário pedir para rodar, diagnosticar ou corrigir testes.
---

# Executar e corrigir testes

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`cd next && yarn quality`). Ver `.agents/rules/Testes.md` e o checklist `.agents/rules/Pull-Request.md` (antes de subir e antes de abrir o PR).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — `.agents/rules/Metodo-Superpowers.md`. Esta skill é um complemento do método, não um substituto.

Adaptada da skill `test-fix` do vitru-portal.

1. Em **`next/`**: rodar `yarn test:ci` (Jest com cobertura, sem watch). Para um arquivo: `yarn test <caminho>`.
2. Corrigir falhas **relacionadas ao pedido**. Antes de mudar um teste, confirmar se o erro está no **código** (comportamento regrediu) ou no **teste** (expectativa desatualizada) — nunca "ajustar o teste para passar" sem entender.
3. Onde está cada tipo (`.agents/rules/Testes.md`): funcionalidade ao lado do código; característica em `src/__tests__/caracteristicas/`; integração em `src/__tests__/integracao/`; smoke em `scripts/smoke.mjs` (`yarn smoke`, precisa dos servidores).
4. Falhas típicas deste projeto:
   - `catalog.test.ts`: componente sem entrada na vitrine, `cmsKey` sem correspondência no `sectionRegistry`, guia do editor faltando campo → corrigir a vitrine/guia, não o teste.
   - `normalize.test.ts`: JSON do Strapi mudou → atualizar `types.ts`, `normalize.ts` **e** `.mock.json` juntos.
   - `cinco-pilares.test.ts`: campo novo no schema sem guia do editor, seção fora da dynamic zone/registry, doc sem "Medição"/"Testes" → completar o que falta.
   - `testes-obrigatorios.test.ts`: arquivo sem teste → **escrever o teste** (não adicionar exceção sem motivo real).
   - `acessibilidade-e-seo.test.tsx`: a mensagem diz o elemento e o problema (alt, nome, nova aba, id, ARIA, `undefined`) → corrigir o componente/normalize.
   - `cache-versionado.test.ts`: formato do cache mudou → subir `VERSAO_CACHE_*` e atualizar o esperado.
   - Cobertura abaixo do piso → escrever testes; **nunca** baixar `coverageThreshold`.
5. Se um arquivo continuar falhando por motivo fora do escopo, descrever o erro e **parar** aguardando instrução.
6. Ao final, rodar `yarn quality` para garantir lint + typecheck + testes juntos.

Não afirmar que os testes passaram sem ter executado nesta sessão.
