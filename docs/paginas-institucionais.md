# Páginas institucionais da ADAI

## A igreja que vemos e foto do fundador

Quarta página: `/sobre-nos/a-igreja-que-vemos`, com conteúdo de visão já publicado e missão/valores transcritos das imagens do Figma enviadas pelo Marcelo. Títulos curtos dos dez pontos de visão são adaptações para facilitar a leitura; os textos integrais foram preservados. A composição `institucional-grade` reutiliza Texto rico em destaque em duas colunas (uma no celular), faixa de missão com Texto e botões e componentes existentes de convite e páginas relacionadas. A migração isolada `visao_version` publica apenas essa página.

A fotografia de Paulo Silas enviada pelo Marcelo foi copiada sem edição para `strapi/seed/paulo-silas.png` e para a vitrine. A migração `foto_paulo_silas_version` troca somente a mídia no Hero da história, em rascunho/publicado, sem republicar textos. Renderização mantém 324×213px sem recorte nem ampliação; substituir quando a igreja enviar uma foto maior. As demais capas seguem provisórias em relação ao Figma.

Conteúdo aprovado em prévia pelo Marcelo, com linguagem para pessoas que estão conhecendo a igreja e a fé cristã. Estrutura baseada nas telas enviadas do Figma; explicações e convites são adaptações editoriais. A história e os temas de fé foram conferidos nas páginas publicadas em adai.com.br. A foto enviada de Paulo Silas já está incluída; as demais capas do acervo ainda são provisórias em relação ao Figma.

Rotas: `/sobre-nos/nossa-historia`, `/sobre-nos/no-que-acreditamos` e `/jesus`. Mantidos os endereços já usados no rodapé e os redirecionamentos existentes.

## Edição e composição

`strapi/seed/institucionais.json` cadastra o conteúdo inicial. A migração independente `institucionais_version` aplica o conjunto inicial de páginas uma vez; a adição de visão usa `visao_version`. A entrega atualiza e publica as páginas conforme solicitado; edições posteriores ficam no painel e não são sobrescritas em cada reinício. Importar o snapshot substitui conteúdo do ambiente, como nos demais fluxos do projeto. A integração da main preserva a EBA: o snapshot combinado foi comparado com os 24 registros de cursos, testes e páginas EBA da versão da main, sem perda ou alteração de conteúdo.

A apresentação **institucional** reaproveita Hero (somente imagem), Texto rico, Imagem e texto e Carrossel de cards em grade. Hero não contém títulos sobre a foto nessa apresentação. O primeiro conteúdo textual recebe h1, mesmo após uma capa; demais seções mantêm a hierarquia. Todos os componentes mantêm suas vitrines existentes. A apresentação padrão e a editorial do Contribua não mudam.

Tipografia usa `--font-display`, `--font-size-h1` e demais tokens do site, carregados pelo Next. Nada de cópia de fonte ou stylesheet da prévia. Texto longo em coluna de leitura; nove blocos de crenças com destaque. Intervalos de 40px no celular, 56px no desktop e 12px entre crenças consecutivas.

## Fontes e revisão editorial

- História: https://www.adai.com.br/sobre-nos/nossa-historia — início em 01/05/2003 com trinta pessoas, Paulo Silas e Mara, AVC em 2008 e liderança de Rodrigo e Tati em 2010.
- Crenças: https://www.adai.com.br/sobre-nos/no-que-acreditamos — temas alinhados com a declaração atual. Os nove blocos, sua ordem e referências bíblicas vieram das imagens do Figma; texto publicado organiza os temas de outra forma.
- Jesus: https://www.adai.com.br/jesus — humanidade e divindade, amor e perdão. Explicações sobre cruz e ressurreição também conferidas na declaração de fé.
- Frase de Paulo Silas: https://www.adai.com.br/nossacasa.

Texto fala na voz da ADAI. Glossário, perguntas e primeiros passos são propostas didáticas aprovadas na prévia. Não foram importadas crenças da Passion City. Nenhuma imagem de comunicado de falecimento foi usada como foto editorial.

## SEO, medição e validação

No que cremos inclui índice com nove links internos e retorno aos temas em cada bloco. Usa Markdown e o campo Âncora já existentes em Texto rico, com alvos de toque de 44px e margem de rolagem para o cabeçalho. A migração independente `cremos_indice_version` acrescenta os links em rascunho e publicado sem republicar nem substituir os textos do editor. Medição coberta por `clique_cta`; navegação na mesma página não gera conversão.

Conteúdo renderizado no servidor, um h1 por página, metadados e imagem de compartilhamento no Strapi, alt em imagens. Medição coberta por `clique_cta` e `ver_secao` existentes; nenhum novo evento ou script externo.

Testes: hierarquia com/sem capa em `SectionRenderer.test.tsx`; dados editoriais em `institucionais-seed.test.ts`. Verificar quality, builds, smoke e navegador em 375/768/1440 antes do merge.
