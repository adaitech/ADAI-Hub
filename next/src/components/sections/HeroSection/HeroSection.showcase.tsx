import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { HeroSection } from './HeroSection';
import mocks from './HeroSection.mock.json';
import type { HeroData } from './types';

const completo = mocks.completo as HeroData;
const BOTOES = completo.botoes ?? [];

export const heroShowcase = defineShowcase<HeroData>({
  slug: 'hero',
  nome: 'Hero',
  categoria: 'secao',
  cmsKey: 'sections.hero',
  descricao:
    'Abertura da página: foto grande em preto e branco com cantos arredondados, frase principal em até 3 linhas, texto de apoio e até 2 botões.',
  quandoUsar: 'Primeira seção da Home e de páginas de ministério ou campanha. Apenas um por página.',
  doc: 'docs/componentes/hero.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-32',
  render: (data) => <HeroSection data={data} index={0} />,
  variantes: [
    { nome: 'completo', titulo: 'Completo', descricao: 'Como está na Home (Figma).', data: mocks.completo as HeroData },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Só frase principal e foto.', data: mocks.minimo as HeroData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Frases e botões longos.', data: mocks.texto_longo as HeroData },
    { nome: 'sem_imagem', titulo: 'Sem foto', descricao: 'Estado incompleto: foto não enviada.', data: mocks.sem_imagem as HeroData },
  ],
  controles: [
    alternarCampo<HeroData, 'imagem'>('imagem', 'Foto de fundo', completo.imagem ?? null, 'Sem foto, o fundo fica cinza-escuro.'),
    alternarCampo<HeroData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', completo.texto_apoio ?? null),
    {
      id: 'botoes',
      tipo: 'opcoes',
      rotulo: 'Botões',
      opcoes: [
        { valor: '2', rotulo: '2 botões' },
        { valor: '1', rotulo: '1 botão' },
        { valor: '0', rotulo: 'Nenhum' },
      ],
      valor: (data) => String(Math.min(data.botoes?.length ?? 0, 2)),
      aplicar: (data, valor) => {
        const qtd = Number(valor);
        const atuais = data.botoes ?? [];
        return { ...data, botoes: [...atuais, ...BOTOES.slice(atuais.length)].slice(0, qtd) };
      },
    },
  ],
});
