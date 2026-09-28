import { defineShowcase } from '@/lib/showcase/types';
import { TextLink, type TextLinkProps } from './TextLink';

type Exemplo = Omit<TextLinkProps, 'children'> & { texto: string };

export const textLinkShowcase = defineShowcase<Exemplo>({
  slug: 'text-link',
  nome: 'Link com seta',
  categoria: 'ui',
  cmsKey: null,
  descricao: 'Ação secundária: texto sublinhado com seta que anda no hover. Usado nos cards e na seção Imagem e texto.',
  quandoUsar: 'Ao lado ou abaixo de um botão, para uma alternativa (Como chegar, Falar no WhatsApp). No Strapi, vem do componente "Link" (shared.link).',
  doc: 'docs/componentes/README.md',
  render: ({ texto, ...props }) => (
    <div style={{ padding: 24, background: props.superficie === 'escura' ? 'var(--color-bg-media)' : undefined }}>
      <TextLink {...props}>{texto}</TextLink>
    </div>
  ),
  variantes: [
    { nome: 'clara', titulo: 'Fundo claro', data: { href: '/unidades', texto: 'Como chegar' } },
    { nome: 'externo', titulo: 'Externo (nova aba)', data: { href: 'https://www.youtube.com/', texto: 'Assistir', novaAba: true } },
    { nome: 'escura', titulo: 'Fundo escuro', data: { href: '/contato', texto: 'Falar no WhatsApp', superficie: 'escura' } },
  ],
  controles: [
    {
      id: 'superficie',
      tipo: 'opcoes',
      rotulo: 'Fundo',
      opcoes: [{ valor: 'clara', rotulo: 'Claro' }, { valor: 'escura', rotulo: 'Escuro (sobre foto)' }],
      valor: (data) => data.superficie ?? 'clara',
      aplicar: (data, valor) => ({ ...data, superficie: valor as Exemplo['superficie'] }),
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
