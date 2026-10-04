<!--
Antes de abrir este PR, rode o checklist de .agents/rules/Pull-Request.md (Parte A e B).
Nenhum PR sem teste: todo código novo ou alterado tem teste unitário (.agents/rules/Testes.md).
Marque ✅ só o que rodou nesta sessão; o resto é ⏳ com o motivo.
-->

## O que mudou

<!-- Comportamento em linguagem natural, decisões e trade-offs. Componente novo: rota da vitrine (/componentes/<slug>) e o que o editor passa a poder fazer no Strapi. -->

## Testes

<!-- Quais testes foram escritos ou alterados, e de que tipo. -->

- Funcionalidade (unitário):
- Característica:
- Integração:
- Bug corrigido → teste que reproduz:

## Como validar

```bash
cd next && yarn quality && yarn build
cd strapi && yarn build        # se mexeu no Strapi
cd next && yarn smoke          # com Strapi e Next rodando
```

Rotas para abrir (375 / 768 / 1440):

## Validações

- [ ] `yarn quality` (lint + typecheck + testes + cobertura)
- [ ] `yarn build` (next)
- [ ] `yarn build` (strapi) — ou não se aplica
- [ ] `yarn smoke`
- [ ] Navegador: console sem erros, sem scroll lateral em 375, teclado ok
- [ ] 5 pilares (Dados no CMS, Página, Componente, SEO, Medição) — ou não se aplica
- [ ] Snapshot do Strapi (`strapi/data/adai-conteudo.tar.gz`) exportado e revisado — obrigatório quando mexer no Strapi, enquanto o projeto usar o Strapi local; ou não se aplica
- [ ] Sem segredos no diff
- [ ] Docs atualizados (componente: Medição e Testes)
- [ ] ⏳ Validação humana (leitor de tela, celular real) — quando houver UI

## Pendências e riscos

<!-- O que ficou de fora, o que depende de humano/produção, impacto em outras páginas. -->
