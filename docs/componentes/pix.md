# Contribuição por Pix

Seção `sections.pix`, com chave pública, instruções numeradas e contato da equipe. Todos os dados editoriais vêm do Strapi. Nenhum dado bancário do visitante é solicitado.

Campos: `titulo` (obrigatório, 80 caracteres), `chave_pix` (obrigatório, 140), `texto_apoio` (220), `passos` (600, um por linha), `contato` (`shared.link`) e `ancora` (60, letras minúsculas, números e hífens, iniciando por letra).

Sem título ou chave a seção é omitida. Links passam pela sanitização compartilhada. A chave fica visível e selecionável; a cópia usa `CopyButton`, com sucesso anunciado apenas após confirmação do navegador. Sem acesso à área de transferência, a mensagem orienta a cópia manual.

Vitrine: `/componentes/pix`, com variantes completa, mínima e texto longo, e controles dos campos opcionais. Guia: `strapi/src/editor-guide/sections.pix.json`.

## Medição (DataLayer)

Coberto por `ver_secao` e `clique_cta` no botão de copiar e no contato. Os links de contribuição da página também disparam `contribuir`. Não se registra o valor da chave nem se presume uma transferência concluída. Nenhum evento novo é necessário.

## Testes

`PixSection.test.tsx` cobre normalização, conteúdo mínimo, links inseguros e hierarquia. `contribua.test.tsx` cobre a composição da página, âncoras e limites dos schemas.

Layout mobile em uma coluna; a partir de 769px as instruções ficam ao lado da chave. Usa os tokens atuais, Inter e Inter Tight. Título h1 somente se abrir a página, h2 nos demais casos.
