import { defineShowcase } from '@/lib/showcase/types';
import { Chips, type ChipsProps } from './Chips';

const completo: ChipsProps['itens'] = [
  { rotulo: 'Para quem', valor: 'A partir de 16 anos' },
  { rotulo: 'Duração', valor: '7 aulas de 1 hora, semanais' },
  { rotulo: 'Formato', valor: 'Presencial ou on-line' },
  { rotulo: 'Quando entrar', valor: 'A qualquer momento' },
];

export const chipsShowcase = defineShowcase<ChipsProps>({
  slug: 'chips',
  nome: 'Informações do curso',
  categoria: 'ui',
  cmsKey: null,
  descricao: 'Lista de informações curtas com rótulo visível (Para quem, Duração, Formato, Quando entrar).',
  quandoUsar: 'No card e no topo da página de um curso da EBA. Os valores vêm dos campos do curso no Strapi.',
  doc: 'docs/componentes/curso-cabecalho.md',
  render: (props) => (
    <div style={{ padding: 24, background: props.tom === 'inverso' ? 'var(--color-bg-media)' : undefined }}>
      <Chips {...props} />
    </div>
  ),
  variantes: [
    { nome: 'completo', titulo: 'Quatro informações', data: { itens: completo } },
    { nome: 'curto', titulo: 'Uma informação', data: { itens: completo.slice(0, 1) } },
  ],
  controles: [
    {
      id: 'tom',
      tipo: 'opcoes',
      rotulo: 'Fundo',
      opcoes: [{ valor: 'claro', rotulo: 'Claro' }, { valor: 'inverso', rotulo: 'Escuro' }],
      valor: (data) => data.tom ?? 'claro',
      aplicar: (data, valor) => ({ ...data, tom: valor as ChipsProps['tom'] }),
    },
  ],
});
