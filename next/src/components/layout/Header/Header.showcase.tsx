import { defineShowcase } from '@/lib/showcase/types';
import { Header } from './Header';
import mocks from './Header.mock.json';
import type { HeaderData } from './types';

interface HeaderExemplo {
  strapi: HeaderData;
  aoVivoUrl: string | null;
}

const LIVE_URL = 'https://www.youtube.com/watch?v=adaiAoVivoExemplo';
const completo = mocks.completo as HeaderData;

export const headerShowcase = defineShowcase<HeaderExemplo>({
  slug: 'header',
  nome: 'Cabeçalho',
  categoria: 'layout',
  cmsKey: 'layout.header',
  descricao:
    'Topo de todas as páginas: logo, menu e até 2 botões. “Ao vivo” só aparece quando o YouTube confirma uma transmissão; abaixo de 1024px as ações ficam no Menu.',
  quandoUsar: 'Automático em todas as páginas do site. Editado em "Configurações do site" no Strapi.',
  doc: 'docs/componentes/header.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-13',
  cms: (data) => data.strapi,
  render: ({ strapi, aoVivoUrl }) => <Header data={strapi} aoVivoUrl={aoVivoUrl} />,
  variantes: [
    { nome: 'completo', titulo: 'Durante a live', descricao: 'Menu e dois botões; Ao vivo leva à transmissão atual.', data: { strapi: completo, aoVivoUrl: LIVE_URL } },
    { nome: 'offline', titulo: 'Sem transmissão', descricao: 'Ao vivo fica oculto; Planeje sua visita permanece.', data: { strapi: completo, aoVivoUrl: null } },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Sem links nem botões: só o logo.', data: { strapi: mocks.minimo as HeaderData, aoVivoUrl: null } },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: '6 links com nomes longos e botão externo.', data: { strapi: mocks.texto_longo as HeaderData, aoVivoUrl: LIVE_URL } },
  ],
  controles: [
    {
      id: 'links', tipo: 'alternar', rotulo: 'Links do menu',
      valor: (data) => Boolean(data.strapi.links?.length),
      aplicar: (data, ligado) => ({ ...data, strapi: { ...data.strapi, links: ligado ? data.strapi.links?.length ? data.strapi.links : completo.links : [] } }),
    },
    {
      id: 'botoes', tipo: 'alternar', rotulo: 'Botões', ajuda: 'No celular ficam dentro do Menu.',
      valor: (data) => Boolean(data.strapi.botoes?.length),
      aplicar: (data, ligado) => ({ ...data, strapi: { ...data.strapi, botoes: ligado ? data.strapi.botoes?.length ? data.strapi.botoes : completo.botoes : [] } }),
    },
    {
      id: 'ao_vivo', tipo: 'alternar', rotulo: 'Transmissão ao vivo', ajuda: 'Simula o estado confirmado pelo YouTube.',
      valor: (data) => Boolean(data.aoVivoUrl),
      aplicar: (data, ligado) => ({ ...data, aoVivoUrl: ligado ? LIVE_URL : null }),
    },
  ],
});
