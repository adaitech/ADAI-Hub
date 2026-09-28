# CMS da ADAI (Strapi 5)

O Strapi mantém o conteúdo editorial da Home e das demais páginas. A estrutura de cada seção fica em `src/components/`, é liberada na dynamic zone de `src/api/page/content-types/page/schema.json` e tem instruções de edição em `src/editor-guide/`. O site Next.js lê essas seções pelo registry e mostra exemplos na vitrine `/componentes`.

## Começar

Na raiz do repositório, rode `yarn setup` e preencha `strapi/.env` conforme o [README principal](../README.md). Depois use `yarn dev`, que inicia Strapi e Next. O painel está em http://localhost:1337/admin. Não versione `.env`, `strapi/.tmp/` nem uma exportação com usuários ou tokens.

## Conteúdo reproduzível

O bootstrap em `src/bootstrap/seed.ts` cria as configurações globais, publica a Home e a página `/exemplos`. A versão atual do seed é **v14** e inclui “Encontre seu lugar”, “Contribua”, “A igreja no seu bolso” e o FAQ. Um novo ambiente consegue continuar a partir do seed e das imagens de `seed/`.

O arquivo versionado `data/adai-conteudo.tar.gz` guarda o conteúdo e as mídias atuais, inclusive edições feitas no painel. Para restaurá-lo em um banco local de desenvolvimento, pare o Strapi e execute `yarn data:import` na pasta `strapi/`. A importação substitui o conteúdo existente. Para atualizar o snapshot depois de uma mudança editorial, execute `yarn data:export`, confira que a exportação contém apenas `content,files` e nenhum segredo, e versione o arquivo resultante.

Os contratos de cada seção estão em [`docs/componentes/`](../docs/componentes/README.md). Eventos vêm da inChurch e mensagens do YouTube; o CMS guarda só a apresentação/configuração dessas fontes.
