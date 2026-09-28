import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { TextoBotoesSection } from './TextoBotoesSection';
import mocks from './TextoBotoesSection.mock.json';
import type { TextoBotoesData } from './types';

const completo = mocks.completo as TextoBotoesData;

export const textoBotoesShowcase = defineShowcase<TextoBotoesData>({
  slug: 'texto-botoes',
  nome: 'Texto e botões',
  categoria: 'secao',
  cmsKey: 'sections.texto-botoes',
  descricao: 'Chamada central com título, frase de apoio e até dois botões. Na Home, divulga o aplicativo da ADAI nas lojas.',
  quandoUsar: 'Para uma chamada breve com uma ou duas ações, sem imagem ou lista de conteúdo.',
  doc: 'docs/componentes/texto-botoes.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-296',
  render: (data) => <TextoBotoesSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'A igreja no seu bolso', descricao: 'App Store e Google Play, como no Figma.', data: completo },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Somente o título.', data: mocks.minimo as TextoBotoesData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Verifica quebras do título e da descrição.', data: mocks.texto_longo as TextoBotoesData },
  ],
  controles: [
    alternarCampo<TextoBotoesData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', completo.texto_apoio ?? null),
    alternarCampo<TextoBotoesData, 'botoes'>('botoes', 'Botões', completo.botoes ?? []),
  ],
});
