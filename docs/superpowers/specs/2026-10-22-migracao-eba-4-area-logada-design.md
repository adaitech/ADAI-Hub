# Migração da EBA — entrega 4: área logada da equipe — design

> Série: 1 editorial · 2 testes · 3 resultado · **4 área logada** · Entregas anteriores: `2026-10-18-migracao-eba-1-editorial-design.md`, `2026-10-20-migracao-eba-2-testes-design.md`, `2026-10-22-migracao-eba-3-resultado-design.md` · Levantado em `adaitech/eba-adai` e `adaitech/eba-ada-api` (22/10/2026)

## 1. Objetivo

Levar para o ADAI Hub a área logada da EBA (hoje em `eba.adai.com.br/dashboard`): **login da equipe**, **consulta interna de aluno** (com o resultado dos testes), **gerenciar turmas**, **aulas em vídeo** e **QR codes dos testes**. A equipe passa a usar um só site. Esta entrega **não** muda a API, o cálculo dos testes nem o banco.

Esta entrega é **parcial de propósito**: o levantamento (seção 2) achou decisões de segurança e de produto que não se resolvem pelo código (seção 8). Entra o que é inequívoco, **desligado por padrão** (sem `EBA_EQUIPE_SEGREDO`, tudo responde 404).

## 2. Como funciona hoje

**Login (`/login`)**
- Formulário no navegador chama direto a API (`POST /login`, Identity). O `accessToken` fica num cookie **legível por JavaScript** (`token`, sem `httpOnly`) e o e-mail no `localStorage`. Qualquer XSS lê o token.
- A regra de senha forte é só do formulário. As contas existem só no banco (cadastro desligado na API).
- **Não há papéis.** `isAdmin` está fixo em `true` na barra lateral: todo usuário logado vê tudo. Na API, a política padrão dá a qualquer usuário autenticado acesso a todos os endpoints protegidos, inclusive apagar aluno e turma.

**Proteção das rotas**
- O `middleware.ts` só cobre `/dashboard/consultas` e `/dashboard/gerenciar` (e só confere se o cookie existe, não se vale). **`/dashboard/aulas/*`, `/dashboard/testes` e `/dashboard/ajuda` abrem sem login**, e `/teste/resultado/<id>` também (ver entrega 3). Na prática os 25 vídeos das aulas são públicos para quem tem o endereço.

**Consultas (`/dashboard/consultas`)**
- Busca por e-mail (`GET Student/email/{q}`, anônimo na API) ou por nome (`GET Student/name/{q}`, protegido). "Listar todos" chama `GET Student` e mostra só a **primeira página**: o padrão da API é 10 alunos por página e a tela ignora as demais. O nome da turma vem de uma chamada por aluno (`GET ClassEBA/{id}`).
- Detalhes (`/dashboard/consultas/details/<id>`): nome, e-mail e turma (`GET Student/{id}`) e os 5 resultados (`GET SurveyResult/Student/{id}/Question/{idQuestion}`), com a data de cada um. O botão "Baixar resultado" não faz nada.

**Gerenciar (`/dashboard/gerenciar`)**
- **Turmas:** listar por status, criar, editar e apagar (`GET/POST/PUT/DELETE ClassEBA`). Campos: nome (3 a 200 caracteres), status (1 Pendente, 2 Em andamento, 3 Concluída), início e término (término depois do início). O apagar é definitivo e a tela não avisa se a turma tem alunos.
- **Alunos:** aba "Em construção".

**Aulas (`/dashboard/aulas/dna/*` e `/reset/*`)**
- 17 aulas do DNA e 8 do Reset, definidas em arquivos de código (`aulas-dna.ts`, `aulas-reset.ts`): título, autor, cargo, foto do autor, descrição e endereço do **Vimeo** (`player.vimeo.com/video/<id>?h=<hash>`, vídeo não listado). O conteúdo é editorial, mas não está num CMS.

**QR codes (`/dashboard/testes`)**
- Lista de 5 imagens de QR com o endereço de cada teste e um botão de copiar.

**Ajuda (`/dashboard/ajuda`):** página vazia.

## 3. Decisões do desenho (sujeitas às perguntas da seção 8)

| Tema | Decisão |
| --- | --- |
| Onde mora | `/eba/equipe/...`, `noindex, nofollow`, fora do sitemap. Visual do Hub, com menu lateral próprio da área. O site atual continua no ar até a virada. |
| Login | **No servidor do Hub.** O formulário chama uma Server Action, que faz o `POST /login` no APIM; o bearer **nunca chega ao navegador**: fica num cookie `httpOnly`, cifrado (AES-256-GCM), de sessão, com validade igual à do token. Sem `localStorage`. |
| Chamadas à API | Só do servidor, com `Authorization: Bearer` mais a chave da assinatura do Hub no APIM. Resposta 401 → sessão encerrada e volta ao login. |
| Guarda | **Toda** rota de `/eba/equipe/*` confere a sessão no servidor (inclusive aulas, QR codes e ajuda). Sem sessão válida → redireciona para o login. Sem `EBA_EQUIPE_SEGREDO` → 404. |
| Força bruta | Limite de tentativas de login por IP (5 por minuto), mesma mensagem para qualquer erro, nada de e-mail ou senha em log. |
| Papéis | Igual a hoje: quem tem conta vê tudo. A divisão por papéis fica para depois (pergunta 3). |
| Consulta | Busca por e-mail ou nome, com **paginação de verdade** (a tela atual perdia alunos), nome da turma na mesma lista e a tela de detalhes com o resultado dos 5 testes (reaproveita a normalização de `lib/eba-api/resultados.ts` e o `ConteudoResultado`). |
| Turmas | Listar, criar, editar e apagar com **confirmação**; formulário no servidor com validação igual à da API. |
| Aulas | Conteúdo no **Strapi** (tipo `aula`), não em código. Acesso conforme a pergunta 2. |

## 4. Privacidade e segurança

1. O bearer e a senha nunca chegam ao navegador nem ao `localStorage`; a senha só passa pela Server Action.
2. Cookie `eba_equipe`: `httpOnly`, `secure` em produção, `sameSite=strict`, de sessão (sem `maxAge`), `path=/eba/equipe`, cifrado com `EBA_EQUIPE_SEGREDO`. Adulterado, vencido ou de outro segredo → sem sessão.
3. Toda Server Action de dados confere a sessão **antes** de qualquer chamada à API e usa só o bearer da sessão (nunca um valor vindo do cliente).
4. Dados pessoais (nome, e-mail, turma) só aparecem nas telas da equipe, com `Cache-Control: no-store` e `noindex`; nunca em URL (o detalhe usa o id do aluno, que já é o identificador da API, não o e-mail) nem em log nem em `dataLayer`.
5. Cada ação de escrita (criar, editar e apagar turma) pede confirmação e registra só a classe do erro.
6. `GET Student/{id}` anônimo da API continua sendo um risco fora desta entrega (entrega 3, pergunta 5).

## 5. Arquitetura (primeira fatia, implementada)

| Arquivo | Papel |
| --- | --- |
| `next/src/lib/eba/equipe/sessao.ts` | `segredoDaEquipe()`, `abrirSessaoEquipe`/`lerSessaoEquipe` (cifra e decifra o bearer com a validade), cookie e opções. |
| `next/src/lib/eba-api/client.ts` | `ebaFetch` ganha a opção `bearer` e o caminho de raiz (`/login` não fica sob `/api/v1/eba`). |
| `next/src/lib/eba-api/equipe.ts` | `entrar`, `listarAlunos`, `buscarAlunos`, `alunoDaEquipe`, `listarTurmas`, `criarTurma`, `editarTurma`, `apagarTurma`, todas com bearer; 401 vira `SessaoEncerrada`. |
| `next/src/app/(site)/eba/equipe/` | Layout com menu e "Sair", `login`, `consultas`, `consultas/[idStudent]`, `turmas`. |
| `next/src/components/eba/Equipe/` | Telas de apresentação (login, busca, tabela de alunos, detalhe, turmas). |

Fica para as próximas fatias (dependem das perguntas): aulas, QR codes e ajuda.

## 6. Medição, SEO e acessibilidade

- **Medição:** a área da equipe **não** manda eventos de DataLayer com dado pessoal. `clique_cta` nos botões segue a regra do projeto (texto e destino sem dado pessoal). Sem evento novo.
- **SEO:** `noindex, nofollow`, um `h1` por tela, fora do sitemap.
- **Acessibilidade:** formulários com rótulo, erro em `role="alert"` ligado por `aria-describedby`, tabela com `caption` e cabeçalhos, foco gerenciado entre telas, diálogo de confirmação acessível.

## 7. Testes (TDD)

- **Sessão da equipe:** ida e volta, adulteração, outro segredo, vencida, segredo curto, o cookie dos outros recursos não vale.
- **Cliente da API:** `login` (URL na raiz, chave no header, corpo, erro 401 genérico), `Authorization: Bearer` nas chamadas, 401 → `SessaoEncerrada`, paginação, validação de ids.
- **Ações:** sem sessão não chama a API; limite de tentativas de login; mensagens sem dado pessoal; senha nunca no log.
- **Telas:** estados (vazio, carregando, erro, resultado), foco, rótulos, confirmação do apagar.
- **Integração:** rotas redirecionam sem sessão, 404 sem o segredo, `noindex`, sem `Cache` compartilhado.
- **Característica:** variável `EBA_EQUIPE_SEGREDO` só de servidor (já coberto); rotas novas têm teste.

## 8. Perguntas em aberto (decisão do Jonatan, da EBA e de quem cuida da API)

| # | Pergunta | Por que bloqueia | Recomendação |
| --- | --- | --- | --- |
| 1 | **O APIM expõe o `/login` do Identity (e o `/refresh`) para o Hub?** Hoje o login é direto no App Service. | O Hub chama `POST {EBA_API_URL}/login`. Se o APIM não expõe, o login não funciona. | Expor `/login` e `/refresh` no produto `adai-hub`. |
| 2 | **Quem assiste às aulas?** Hoje os vídeos abrem sem login para quem tem o endereço. Os alunos do DNA e do Reset também usam? | Se alunos usam, as aulas **não podem** ficar só atrás do login da equipe. | Decidir por curso: aula pública no Hub (Strapi + Vimeo) ou só da equipe. Hoje o vídeo já é público de fato. |
| 3 | A equipe terá **papéis** (quem gerencia turma e apaga, quem só consulta)? | Hoje todo usuário faz tudo, e a API não distingue. | Começar igual a hoje, e planejar papéis no Identity. |
| 4 | **Apagar turma:** a API apaga em definitivo, sem checar alunos. O Hub pode recusar quando a turma tem alunos? | Apagar com alunos pode deixar alunos sem turma. | Recusar na tela e pedir confirmação. A API pode checar também. |
| 5 | **Validade da sessão:** o token do Identity dura o padrão (1 h). Usar `/refresh` (Hub renova sozinho) ou pedir login de novo? | Muda a experiência da equipe. | Renovar com `/refresh` até 8 h de sessão. |
| 6 | **Vimeo:** os vídeos são "não listados" com hash. O Hub embute o mesmo endereço no Strapi, ou há restrição por domínio no Vimeo? | Restrição por domínio exige incluir o domínio do Hub. | Conferir no Vimeo antes da virada. |
| 7 | "Gerenciar aluno" está "em construção" no site atual. Entra nesta entrega? | Não há desenho. | Deixar de fora e tratar à parte. |
| 8 | "Baixar resultado" (PDF) não funciona hoje. Entra? | Não há desenho. | Deixar de fora. |
| 9 | Criação de contas da equipe: continua só pelo banco? | O Hub não cria usuários. | Continua pelo banco. |

## 9. Fora do escopo

- Mudar a API, o banco ou o cálculo dos testes.
- Papéis e permissões finas (pergunta 3).
- Gerenciar aluno e baixar resultado (perguntas 7 e 8).
- Redirecionar `/dashboard/*` do site atual para o Hub: só na virada, com a EBA.

## 10. Rollout e rollback

- Merge com `EBA_EQUIPE_SEGREDO` **ausente**: nada muda (404).
- Ligar em homologação com um usuário de teste do Identity, comparar com o site atual e só então ligar em produção.
- Rollback: remover `EBA_EQUIPE_SEGREDO` (as rotas voltam a 404); o site atual segue funcionando o tempo todo.
