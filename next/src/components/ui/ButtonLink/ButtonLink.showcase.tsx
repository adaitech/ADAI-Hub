import { defineShowcase } from '@/lib/showcase/types';
import { ButtonLink, type ButtonLinkProps } from './ButtonLink';

type Exemplo = Omit<ButtonLinkProps, 'children'> & { texto: string };

export const buttonLinkShowcase = defineShowcase<Exemplo>({
  slug: 'button-link',
  nome: 'Botão (link)',
  categoria: 'ui',
  cmsKey: null,
  descricao:
    'CTA com formato de pílula. Todo CTA do site navega, por isso é um link. Estilo sólido (ação principal) ou contorno (secundária), para fundo claro ou escuro.',
  quandoUsar: 'Dentro de seções e do cabeçalho. No Strapi, vem do componente "Botão" (shared.botao).',
  doc: 'docs/componentes/README.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-27',
  render: ({ texto, ...props }) => (
    <div style={{ padding: 24, background: props.superficie === 'escura' ? 'var(--color-bg-media)' : undefined }}>
      <ButtonLink {...props}>{texto}</ButtonLink>
    </div>
  ),
  variantes: [
    { nome: 'solido-clara', titulo: 'Sólido · fundo claro', data: { href: '/planeje-sua-visita', texto: 'Planeje sua visita', estilo: 'solido', superficie: 'clara', tamanho: 'sm' } },
    { nome: 'contorno-clara', titulo: 'Contorno · fundo claro', data: { href: '/ao-vivo', texto: 'Ao vivo', estilo: 'contorno', superficie: 'clara', tamanho: 'sm' } },
    { nome: 'solido-escura', titulo: 'Sólido · sobre foto', data: { href: '/planeje-sua-visita', texto: 'Planeje sua visita', estilo: 'solido', superficie: 'escura', tamanho: 'md' } },
    { nome: 'contorno-escura', titulo: 'Contorno · sobre foto', data: { href: '/unidades', texto: 'Unidades', estilo: 'contorno', superficie: 'escura', tamanho: 'md' } },
    { nome: 'externo', titulo: 'Link externo (nova aba)', data: { href: 'https://www.youtube.com/', texto: 'Assista no YouTube', estilo: 'contorno', superficie: 'clara', tamanho: 'md', novaAba: true } },
  ],
  controles: [
    {
      id: 'estilo',
      tipo: 'opcoes',
      rotulo: 'Estilo',
      opcoes: [{ valor: 'solido', rotulo: 'Sólido (principal)' }, { valor: 'contorno', rotulo: 'Contorno (secundário)' }],
      valor: (data) => data.estilo ?? 'solido',
      aplicar: (data, valor) => ({ ...data, estilo: valor as Exemplo['estilo'] }),
    },
    {
      id: 'superficie',
      tipo: 'opcoes',
      rotulo: 'Fundo',
      opcoes: [{ valor: 'clara', rotulo: 'Claro' }, { valor: 'escura', rotulo: 'Escuro (sobre foto)' }],
      valor: (data) => data.superficie ?? 'clara',
      aplicar: (data, valor) => ({ ...data, superficie: valor as Exemplo['superficie'] }),
    },
    {
      id: 'tamanho',
      tipo: 'opcoes',
      rotulo: 'Tamanho',
      opcoes: [{ valor: 'md', rotulo: 'Médio · 52px' }, { valor: 'sm', rotulo: 'Pequeno · 40px' }],
      valor: (data) => data.tamanho ?? 'md',
      aplicar: (data, valor) => ({ ...data, tamanho: valor as Exemplo['tamanho'] }),
    },
    {
      id: 'nova_aba',
      tipo: 'alternar',
      rotulo: 'Abrir em nova aba',
      ajuda: 'Para sites externos. Leitores de tela ouvem "(abre em nova aba)".',
      valor: (data) => data.novaAba === true,
      aplicar: (data, ligado) => ({ ...data, novaAba: ligado }),
    },
  ],
});
