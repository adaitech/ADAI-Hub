# Nossa história, No que cremos e Jesus

Conteúdo aprovado em prévia pelo Marcelo, com linguagem para pessoas que estão conhecendo a igreja e a fé cristã. Estrutura baseada nas telas enviadas do Figma; explicações e convites são adaptações editoriais. A história e os temas de fé foram conferidos nas páginas publicadas em adai.com.br. Fotos atuais do acervo ainda são provisórias em relação ao Figma; falta o retrato original de Paulo Silas.

Rotas: `/sobre-nos/nossa-historia`, `/sobre-nos/no-que-acreditamos` e `/jesus`. Mantidos os endereços já usados no rodapé e os redirecionamentos existentes.

## Edição e composição

`strapi/seed/institucionais.json` cadastra o conteúdo inicial. A migração independente `institucionais_version` aplica somente essas três páginas uma vez, sem reconstruir Home, Agenda ou Contribua. A entrega atualiza e publica essas páginas conforme solicitado; edições posteriores ficam no painel e não são sobrescritas em cada reinício. Importar o snapshot substitui conteúdo do ambiente, como nos demais fluxos do projeto.

A apresentação **institucional** reaproveita Hero (somente imagem), Texto rico, Imagem e texto e Carrossel de cards em grade. Hero não contém títulos sobre a foto nessa apresentação. O primeiro conteúdo textual recebe h1, mesmo após uma capa; demais seções mantêm a hierarquia. Todos os componentes mantêm suas vitrines existentes. A apresentação padrão e a editorial do Contribua não mudam.

Tipografia usa `--font-display`, `--font-size-h1` e demais tokens do site, carregados pelo Next. Nada de cópia de fonte ou stylesheet da prévia. Texto longo em coluna de leitura; nove blocos de crenças com destaque. Intervalos de 40px no celular, 56px no desktop e 12px entre crenças consecutivas.

## Fontes e revisão editorial

- História: https://www.adai.com.br/sobre-nos/nossa-historia — início em 01/05/2003 com trinta pessoas, Paulo Silas e Mara, AVC em 2008 e liderança de Rodrigo e Tati em 2010.
- Crenças: https://www.adai.com.br/sobre-nos/no-que-acreditamos — temas alinhados com a declaração atual. Os nove blocos, sua ordem e referências bíblicas vieram das imagens do Figma; texto publicado organiza os temas de outra forma.
- Jesus: https://www.adai.com.br/jesus — humanidade e divindade, amor e perdão. Explicações sobre cruz e ressurreição também conferidas na declaração de fé.
- Frase de Paulo Silas: https://www.adai.com.br/nossacasa.

Texto fala na voz da ADAI. Glossário, perguntas e primeiros passos são propostas didáticas aprovadas na prévia. Não foram importadas crenças da Passion City. Nenhuma imagem de comunicado de falecimento foi usada como foto editorial.

## SEO, medição e validação

Conteúdo renderizado no servidor, um h1 por página, metadados e imagem de compartilhamento no Strapi, alt em imagens. Medição coberta por `clique_cta` e `ver_secao` existentes; nenhum novo evento ou script externo.

Testes: hierarquia com/sem capa em `SectionRenderer.test.tsx`; dados editoriais em `institucionais-seed.test.ts`. Verificar quality, builds, smoke e navegador em 375/768/1440 antes do merge.
