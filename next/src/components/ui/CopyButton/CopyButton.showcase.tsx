import { defineShowcase } from '@/lib/showcase/types';
import { CopyButton, type CopyButtonProps } from './CopyButton';

export const copyButtonShowcase = defineShowcase<CopyButtonProps>({
  slug: 'copy-button', nome: 'Botão de copiar', categoria: 'ui', cmsKey: null,
  descricao: 'Copia um valor público, com confirmação acessível e orientação caso o navegador bloqueie a cópia.',
  quandoUsar: 'Ao lado de um valor público visível, como a chave Pix. O valor deve permitir seleção manual.',
  doc: 'docs/componentes/copy-button.md',
  render: (data) => <div><p>{data.valor}</p><CopyButton {...data} /></div>,
  variantes: [
    { nome: 'pix', titulo: 'Chave Pix', data: { valor: 'nossacasa@adai.com.br', rotulo: 'Copiar chave Pix' } },
    { nome: 'codigo', titulo: 'Código público', data: { valor: 'ADAI-2026', rotulo: 'Copiar código' } },
  ],
});
