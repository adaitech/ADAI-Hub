# Página Contribua

Rota `/contribua`, com a segunda proposta aprovada: acolhimento para quem chega, apresentação da ADAI, propósito das contribuições, dízimo e oferta, citação bíblica, Pix, perguntas e contato.

Conteúdo editável em **Strapi → Páginas → Contribua**, com escrita restrita a Super Admin por conter dados Pix. Usa Imagem e texto, Texto rico, Cards em grade, Pix, Perguntas frequentes e Texto e botões. Chave aprovada: `nossacasa@adai.com.br`; contato: `contato@adai.com.br`. Favorecido confirmado pelo Marcelo em 19/10/2026: **Igreja Evangélica Assembleia de Deus Ministério Alto do Ipiranga**, CNPJ **08.020.296/0001-14**. A pessoa deve conferir os dados no aplicativo do banco.

`strapi/seed/contribua.json` guarda o conteúdo inicial. O bootstrap aplica a revisão 1 apenas uma vez, com uma chave de versão independente. A revisão 2 altera somente a apresentação para editorial, preservando os textos editados no painel e sem reconstruir a Home. A revisão 3 mantém a foto colorida, sem recriar as seções. A foto usa a imagem existente `hero-adai.jpg`. O snapshot versionado acompanha a atualização do CMS.

A opção **Apresentação da página → Editorial** no Strapi usa uma moldura comum de 1280px de conteúdo, com margens e respiro pelos tokens atuais. Títulos, grades e caixas começam e terminam nas mesmas linhas. A abertura usa foto quadrada no desktop. É uma opção reutilizável em qualquer página; a ausência da escolha mantém o comportamento anterior. As grades não reservam linhas vazias para campos opcionais nem recebem o recuo padrão de listas do navegador.

As variações novas são opcionais: `exibicao: grade` nos cards; `apresentacao: destaque` e `ancora` no Texto rico. A ausência delas mantém o carrossel e a coluna de documento atuais. Não há estilos por slug nem alteração dos tokens globais.

Medição: eventos existentes `ver_secao`, `clique_cta`, `contribuir` e `ver_faq`. Rolagem por âncora na mesma página gera somente clique; cópia Pix concluída gera uma conversão com origem `pix`, sem enviar a chave. Não há novo nome de evento ou coleta de dados financeiros. SEO renderizado no servidor, um h1 e imagem de compartilhamento da página vindos do Strapi.

A revisão 5 adiciona somente o favorecido/CNPJ confirmados e a imagem de SEO diretamente em cada versão, sem reconstruir os textos nem publicar rascunhos. O snapshot atualizado preserva Agenda e Contribua. A citação após os cards usa intervalo de 40px pelos tokens existentes, como continuação do mesmo assunto. Os demais intervalos editoriais permanecem iguais.
