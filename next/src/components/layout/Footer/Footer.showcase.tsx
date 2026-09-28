import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { Footer } from './Footer';
import mocks from './Footer.mock.json';
import type { FooterData } from './types';

const completo = mocks.completo as FooterData;

export const footerShowcase = defineShowcase<FooterData>({
  slug: 'footer',
  nome: 'Rodapé',
  categoria: 'layout',
  cmsKey: 'layout.footer',
  descricao:
    'Fim de todas as páginas: logo, frase da marca, até 3 colunas de links, linha de direitos autorais e a palavra ADAI gigante ao fundo (fixa).',
  quandoUsar: 'Automático em todas as páginas do site. Editado em "Configurações do site" no Strapi.',
  doc: 'docs/componentes/footer.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-306',
  render: (data) => <Footer data={data} />,
  variantes: [
    { nome: 'completo', titulo: 'Completo', descricao: 'Como está no Figma.', data: mocks.completo },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Sem textos nem colunas: só logo e ADAI.', data: mocks.minimo },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Frases e links longos, 2 colunas.', data: mocks.texto_longo },
  ],
  controles: [
    alternarCampo<FooterData, 'texto_marca'>('texto_marca', 'Frase da marca', completo.texto_marca ?? null),
    alternarCampo<FooterData, 'colunas'>('colunas', 'Colunas de links', completo.colunas ?? null),
    alternarCampo<FooterData, 'copyright'>('copyright', 'Direitos autorais', completo.copyright ?? null),
    alternarCampo<FooterData, 'assinatura'>('assinatura', 'Assinatura', completo.assinatura ?? null),
  ],
});
