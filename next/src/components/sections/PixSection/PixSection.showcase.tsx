import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { PixSection } from './PixSection';
import mocks from './PixSection.mock.json';
import type { PixData } from './types';

export const pixShowcase = defineShowcase<PixData>({
  slug: 'pix', nome: 'Contribuição por Pix', categoria: 'secao', cmsKey: 'sections.pix',
  descricao: 'Instruções para contribuir, chave Pix copiável e contato para outras formas de contribuição.',
  quandoUsar: 'Em páginas de contribuição ou campanhas com uma chave Pix pública validada pela equipe.',
  doc: 'docs/componentes/pix.md', render: (data) => <PixSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'Com instruções e contato', data: mocks.completo as PixData },
    { nome: 'minimo', titulo: 'Somente a chave', data: mocks.minimo as PixData },
    { nome: 'texto_longo', titulo: 'Chave e título longos', data: mocks.texto_longo as PixData },
  ],
  controles: [
    alternarCampo<PixData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', mocks.completo.texto_apoio),
    alternarCampo<PixData, 'passos'>('passos', 'Passo a passo', mocks.completo.passos),
    alternarCampo<PixData, 'contato'>('contato', 'Contato da equipe', mocks.completo.contato),
    alternarCampo<PixData, 'ancora'>('ancora', 'Âncora', 'como-contribuir'),
  ],
});
