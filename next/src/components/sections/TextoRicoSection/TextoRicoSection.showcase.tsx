import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { TextoRicoSection } from './TextoRicoSection';
import mocks from './TextoRicoSection.mock.json';
import type { TextoRicoData } from './types';

const completo = mocks.completo as unknown as TextoRicoData;

export const textoRicoShowcase = defineShowcase<TextoRicoData>({
  slug: 'texto-rico',
  nome: 'Texto (documento)',
  categoria: 'secao',
  cmsKey: 'sections.texto-rico',
  descricao:
    'Documento longo editado no Strapi em Markdown: títulos, listas, tabelas e links, numa coluna confortável de leitura. Usado na Política de Privacidade e Cookies.',
  quandoUsar: 'Páginas institucionais e legais (política, termos, regulamentos). Normalmente a única seção da página.',
  doc: 'docs/componentes/texto-rico.md',
  render: (data) => <TextoRicoSection data={data} index={0} />,
  variantes: [
    {
      nome: 'completo',
      titulo: 'Política de Privacidade e Cookies',
      descricao: 'Conteúdo real da página /politica-de-privacidade (Strapi), com data de atualização e tabelas.',
      data: completo,
    },
    {
      nome: 'minimo',
      titulo: 'Texto curto',
      descricao: 'Como em /exemplos: sem data, com negrito, link, lista e tabela.',
      data: mocks.minimo as unknown as TextoRicoData,
    },
    {
      nome: 'sem_titulo',
      titulo: 'Sem título (abaixo de um Hero)',
      descricao: 'Como em /sobre-nos/nossa-historia: o título da página é o do Hero; aqui só o texto.',
      data: mocks.sem_titulo as unknown as TextoRicoData,
    },
  ],
  controles: [
    alternarCampo<TextoRicoData, 'atualizado_em'>('atualizado_em', 'Data de atualização', '2026-10-02', 'Aparece como "Última atualização: …" abaixo do título.'),
  ],
});
