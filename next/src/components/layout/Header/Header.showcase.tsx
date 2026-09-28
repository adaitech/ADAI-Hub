import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { Header } from './Header';
import mocks from './Header.mock.json';
import type { HeaderData } from './types';

const completo = mocks.completo as HeaderData;

export const headerShowcase = defineShowcase<HeaderData>({
  slug: 'header',
  nome: 'Cabeçalho',
  categoria: 'layout',
  cmsKey: 'layout.header',
  descricao:
    'Topo de todas as páginas: logo (fixo, leva à Home), menu principal e até 2 botões. Abaixo de 1024px o menu e os botões ficam no botão "Menu".',
  quandoUsar: 'Automático em todas as páginas do site. Editado em "Configurações do site" no Strapi.',
  doc: 'docs/componentes/header.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-13',
  render: (data) => <Header data={data} />,
  variantes: [
    { nome: 'completo', titulo: 'Completo', descricao: 'Como está no Figma.', data: mocks.completo as HeaderData },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Sem links nem botões: só o logo.', data: mocks.minimo as HeaderData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: '6 links com nomes longos e botão externo.', data: mocks.texto_longo as HeaderData },
  ],
  controles: [
    alternarCampo<HeaderData, 'links'>('links', 'Links do menu', completo.links ?? null),
    alternarCampo<HeaderData, 'botoes'>('botoes', 'Botões', completo.botoes ?? null, 'No celular ficam dentro do botão "Menu".'),
  ],
});
