import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { PerguntasFrequentesSection } from './PerguntasFrequentesSection';
import mocks from './PerguntasFrequentesSection.mock.json';
import type { PerguntasFrequentesData } from './types';

const completo = mocks.completo as PerguntasFrequentesData;

export const perguntasFrequentesShowcase = defineShowcase<PerguntasFrequentesData>({
  slug: 'perguntas-frequentes',
  nome: 'Perguntas frequentes',
  categoria: 'secao',
  cmsKey: 'sections.perguntas-frequentes',
  descricao: 'Lista de dúvidas em caixas cinza. Cada pergunta abre a resposta com teclado, mouse ou toque.',
  quandoUsar: 'Para esclarecer dúvidas de quem vai visitar a ADAI ou participar de um ministério ou evento.',
  doc: 'docs/componentes/perguntas-frequentes.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=31-167',
  render: (data) => <PerguntasFrequentesSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'Quatro perguntas da Home', descricao: 'Perguntas e respostas do Figma.', data: completo },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Uma pergunta, sem texto de apoio.', data: mocks.minimo as PerguntasFrequentesData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Perguntas e respostas extensas.', data: mocks.texto_longo as PerguntasFrequentesData },
  ],
  controles: [
    alternarCampo<PerguntasFrequentesData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', completo.texto_apoio ?? null),
    {
      id: 'quantidade', tipo: 'opcoes', rotulo: 'Quantidade de perguntas',
      opcoes: [1, 2, 4].map((n) => ({ valor: String(n), rotulo: String(n) })),
      valor: (data) => String(data.perguntas?.length ?? 0),
      aplicar: (data, valor) => ({ ...data, perguntas: [...(data.perguntas ?? []), ...(completo.perguntas ?? [])].slice(0, Number(valor)) }),
    },
  ],
});
