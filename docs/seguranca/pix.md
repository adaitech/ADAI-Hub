# Escrita da seção Pix

Páginas contendo `sections.pix` só podem ser alteradas por usuários autenticados
pela estratégia administrativa do Strapi com o papel `strapi-super-admin`.
Editor, Author, usuários da API e tokens de API recebem `ForbiddenError` (403).
Nenhuma permissão nova é concedida; as permissões normais do Strapi continuam
necessárias. A leitura e a escrita de outros conteúdos permanecem disponíveis
conforme o RBAC existente.

O middleware do Document Service é registrado em `strapi/src/index.ts`.
Verifica tanto `data.sections` recebido quanto todas as variantes persistidas
do `documentId`, incluindo rascunho/publicado e idiomas. Não depende do slug,
nem dos filtros, campos ou populate enviados pelo cliente. Cobre criação,
atualização, publicação, despublicação, exclusão, clone e descarte de rascunho,
inclusive inclusão ou remoção de Pix. Uma página com Pix é protegida por inteiro.

Foi escolhido o Document Service porque o RBAC do painel, sozinho, não cobre
tokens da Content API e todas as operações sobre variantes. Uma condição RBAC
dependente de campos recebidos também não basta para detectar remoção de Pix.
O código foi conferido contra as APIs locais do Strapi 5.56, incluindo a
estratégia `admin`, `requestContext` e o gerenciador de middlewares de documentos.

## Limites e operação

Super Admin é uma função confiável: atribuí-la somente aos responsáveis pelos
dados de contribuição. Operações internas sem contexto HTTP (bootstrap, seed e
jobs de backend) são confiáveis e continuam permitidas. Não usar essa exceção
para encaminhar escritas de clientes a jobs sem autorização equivalente.

Escritas diretas pelo Query Engine (`strapi.db`), SQL, importação de dados ou
alterações no código não passam pelo Document Service. Exigem acesso operacional
restrito e revisão. O middleware usa o Query Engine apenas para leitura, evitando
recursão. Falhas nessa consulta abortam a mutação. A verificação e a escrita não
são um bloqueio transacional contra alterações concorrentes feitas por operadores
confiáveis; evitar edições simultâneas da mesma página por responsáveis e editores.

Teste automatizado sem subir serviços:
`cd next && yarn test --runInBand src/__tests__/integracao/pix-permissions.test.ts`.
