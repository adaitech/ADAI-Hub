---
name: test-fix
description: Executa os testes corretos do ADAI Hub (Next e, quando aplicável, Strapi) e corrige falhas relacionadas à solicitação. Use quando o usuário pedir para rodar, diagnosticar ou corrigir testes.
---

# Executar e corrigir testes

Adaptada da skill `test-fix` do vitru-portal.

1. Em **`next/`**: rodar `yarn test:ci` (Jest com cobertura, sem watch). Para um arquivo: `yarn test <caminho>`.
2. Corrigir falhas **relacionadas ao pedido**. Antes de mudar um teste, confirmar se o erro está no **código** (comportamento regrediu) ou no **teste** (expectativa desatualizada) — nunca "ajustar o teste para passar" sem entender.
3. Falhas típicas deste projeto:
   - `catalog.test.ts`: componente sem entrada na vitrine, `cmsKey` sem correspondência no `sectionRegistry`, guia do editor faltando campo → corrigir a vitrine/guia, não o teste.
   - `normalize.test.ts`: JSON do Strapi mudou → atualizar `types.ts`, `normalize.ts` **e** `.mock.json` juntos.
4. Se um arquivo continuar falhando por motivo fora do escopo, descrever o erro e **parar** aguardando instrução.
5. Ao final, rodar `yarn quality` para garantir lint + typecheck + testes juntos.

Não afirmar que os testes passaram sem ter executado nesta sessão.
