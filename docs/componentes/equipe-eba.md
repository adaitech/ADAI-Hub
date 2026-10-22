# Área da equipe da EBA — `/eba/equipe`

Login da equipe, consulta interna de aluno e gerenciamento de turmas, no ADAI Hub. Código em `next/src/app/(restrito)/eba/equipe/` (rotas), `next/src/components/eba/Equipe/` (telas), `next/src/lib/eba/equipe/` (sessão) e `next/src/lib/eba-api/equipe.ts` (API). Spec: `docs/superpowers/specs/2026-10-22-migracao-eba-4-area-logada-design.md`.

## Por que não está no Strapi

É uma ferramenta interna (dados de alunos vêm da API da EBA), sem conteúdo editorial. Os textos de tela são fixos no código. **Aulas em vídeo** são conteúdo editorial e entrarão no Strapi (próxima fatia; depende da pergunta 2 da spec).

## Ligar e desligar

Sem `EBA_EQUIPE_SEGREDO` (32+ caracteres) a área inteira responde 404. Com ele, toda página de `/eba/equipe/*` (menos o login) exige sessão válida no servidor; sem sessão redireciona para `/eba/equipe/login`.

## Telas

| Rota | O que faz |
| --- | --- |
| `/eba/equipe/login` | E-mail e senha. A Server Action chama o `/login` do Identity pelo APIM; o bearer vira um cookie `httpOnly` cifrado (`eba_equipe`, sessão, `sameSite=strict`, no máximo 8 h). Limite de 5 tentativas por minuto por IP; mesma mensagem para qualquer erro de credencial. |
| `/eba/equipe/consultas` | Busca por e-mail ou nome (Server Action, **nada na URL**) e lista de todos os alunos, **paginada** (`?pagina=N`, 20 por página), com o nome da turma. |
| `/eba/equipe/consultas/<id>` | Cadastro do aluno e o resultado dos testes já feitos (mesmo miolo da tela do aluno, `ConteudoResultado`). `<id>` é o id do aluno na API. |
| `/eba/equipe/turmas` | Listar, criar, editar e apagar. Apagar pede confirmação e é **recusado** se a turma tem alunos. |

## Segurança e privacidade

- Senha e bearer só no servidor; nunca em `localStorage`, URL, log ou `dataLayer`.
- Toda ação confere a sessão **antes** de chamar a API e usa só o bearer da sessão. 401 da API encerra a sessão.
- **Sem analytics:** as rotas ficam no grupo `(restrito)`, cujo layout não carrega GTM, rastreador de cliques nem aviso de cookies (o endereço de um aluno ou de um resultado nunca vai para o GA4). Garantido por `area-restrita-sem-analytics.test.ts`.
- `noindex, nofollow` e fora do sitemap.

## Medição

Nenhum evento de `data_layer` na área (decisão de privacidade). Os links **para** a área, quando existirem em páginas do site, seguem `clique_cta`.

## Testes

`lib/eba/selo.test.ts`, `lib/eba/equipe/{sessao,servidor,formato}.test.ts`, `lib/eba-api/{client,equipe,resultados}.test.ts`, `app/(restrito)/eba/equipe/acoes.test.ts`, `components/eba/Equipe/*.test.tsx`, `__tests__/integracao/eba-equipe.test.tsx` e `__tests__/caracteristicas/area-restrita-sem-analytics.test.ts`.
