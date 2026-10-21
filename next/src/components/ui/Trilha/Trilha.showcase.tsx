import { defineShowcase } from '@/lib/showcase/types';
import { Trilha, type TrilhaItem } from './Trilha';

export const trilhaShowcase = defineShowcase<{ itens: TrilhaItem[] }>({
  slug: 'trilha',
  nome: 'Trilha (breadcrumb)',
  categoria: 'ui',
  cmsKey: null,
  descricao: 'Mostra onde a pessoa está: ADAI › EBA › Cursos › Reset. No celular vira só "‹ Cursos" (voltar ao nível anterior).',
  quandoUsar: 'No topo das páginas internas da EBA (catálogo e cursos). Gerada pelo código a partir do endereço.',
  doc: 'docs/componentes/curso-cabecalho.md',
  render: (data) => (
    <div style={{ padding: '0 24px 24px' }}>
      <Trilha {...data} />
    </div>
  ),
  variantes: [
    {
      nome: 'curso',
      titulo: 'Página de curso',
      data: { itens: [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos', href: '/eba/cursos' }, { texto: 'Reset' }] },
    },
    { nome: 'catalogo', titulo: 'Catálogo', data: { itens: [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos' }] } },
  ],
});
