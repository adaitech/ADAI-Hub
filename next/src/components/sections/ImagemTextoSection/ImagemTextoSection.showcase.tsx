import { acaoDe, alternarCampo, comAcao, comEstiloBotao, OPCOES_ACAO, OPCOES_ESTILO_BOTAO } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { ImagemTextoSection } from './ImagemTextoSection';
import mocks from './ImagemTextoSection.mock.json';
import type { ImagemTextoData } from './types';

const completo = mocks.completo as ImagemTextoData;

export const imagemTextoShowcase = defineShowcase<ImagemTextoData>({
  slug: 'imagem-texto',
  nome: 'Imagem e texto',
  categoria: 'secao',
  cmsKey: 'sections.imagem-texto',
  descricao:
    'Foto grande (P&B) de um lado e texto do outro: rótulo, título grande, parágrafos, lista de destaques, botão e link. A foto pode ficar à esquerda ou à direita.',
  quandoUsar:
    'Apresentar um tema com imagem: Primeira vez na ADAI, liderança, ministério, projeto. Alterne o lado da foto em seções seguidas.',
  doc: 'docs/componentes/imagem-texto.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-107',
  render: (data) => <ImagemTextoSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'Primeira vez na ADAI (foto à esquerda, lista e botão)', descricao: 'Figma node 1:107.', data: mocks.completo as ImagemTextoData },
    { nome: 'direita', titulo: 'Pastores Líderes (foto à direita, rótulo e botão)', descricao: 'Figma node 6:4.', data: mocks.direita as ImagemTextoData },
    { nome: 'com_link', titulo: 'Botão + link', descricao: 'Ação principal e secundária lado a lado.', data: mocks.com_link as ImagemTextoData },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Só foto e título.', data: mocks.minimo as ImagemTextoData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Rótulo, título, parágrafos e lista longos.', data: mocks.texto_longo as ImagemTextoData },
  ],
  controles: [
    {
      id: 'lado',
      tipo: 'opcoes',
      rotulo: 'Lado da foto',
      ajuda: 'No celular a foto fica sempre acima do texto.',
      opcoes: [
        { valor: 'esquerda', rotulo: 'Esquerda' },
        { valor: 'direita', rotulo: 'Direita' },
      ],
      valor: (data) => (data.posicao_imagem === 'direita' ? 'direita' : 'esquerda'),
      aplicar: (data, valor) => ({ ...data, posicao_imagem: valor === 'direita' ? 'direita' : 'esquerda' }),
    },
    alternarCampo<ImagemTextoData, 'imagem'>('imagem', 'Foto', completo.imagem ?? null, 'Sem foto, o texto ocupa a largura toda.'),
    {
      id: 'pb',
      tipo: 'alternar',
      rotulo: 'Foto em preto e branco',
      valor: (data) => data.preto_e_branco !== false,
      aplicar: (data, ligado) => ({ ...data, preto_e_branco: ligado }),
    },
    alternarCampo<ImagemTextoData, 'rotulo'>('rotulo', 'Rótulo acima do título', 'Rótulo'),
    alternarCampo<ImagemTextoData, 'texto'>('texto', 'Texto', completo.texto ?? 'Texto de exemplo.'),
    alternarCampo<ImagemTextoData, 'lista'>('lista', 'Lista de destaques', completo.lista ?? null),
    {
      id: 'acao',
      tipo: 'opcoes',
      rotulo: 'Ações',
      ajuda: 'Botão = ação principal (pílula). Link = ação secundária (texto com seta).',
      opcoes: OPCOES_ACAO,
      valor: (data) => acaoDe(data),
      aplicar: (data, valor) => comAcao(data, valor),
    },
    {
      id: 'estilo',
      tipo: 'opcoes',
      rotulo: 'Estilo do botão',
      ajuda: 'Só aparece quando há botão.',
      opcoes: OPCOES_ESTILO_BOTAO,
      valor: (data) => data.botao?.estilo ?? 'solido',
      aplicar: (data, valor) => comEstiloBotao(data, valor),
    },
  ],
});
