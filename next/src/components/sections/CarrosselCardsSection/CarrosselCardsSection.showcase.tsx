import { acaoDe, comAcao, comEstiloBotao, alternarCampo, OPCOES_ACAO, OPCOES_ESTILO_BOTAO } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import type { StrapiMedia } from '@/lib/strapi/types';
import { CarrosselCardsSection } from './CarrosselCardsSection';
import mocks from './CarrosselCardsSection.mock.json';
import { CORES_CARD, type CardData, type CarrosselCardsData } from './types';

const comImagem = mocks.com_imagem as CarrosselCardsData;
const FOTOS = (comImagem.cards ?? []).map((c) => c.imagem).filter((m): m is StrapiMedia => Boolean(m)).slice(0, 3);
const PALETA = ['azul', 'verde', 'laranja', 'vinho', 'preto', 'branco', 'cinza'] as const;

const cardsDe = (data: CarrosselCardsData) => data.cards ?? [];
const mapCards = (data: CarrosselCardsData, fn: (card: CardData, i: number) => CardData): CarrosselCardsData => ({
  ...data,
  cards: cardsDe(data).map(fn),
});

export const carrosselCardsShowcase = defineShowcase<CarrosselCardsData>({
  slug: 'carrossel-cards',
  nome: 'Carrossel de cards',
  categoria: 'secao',
  cmsKey: 'sections.carrossel-cards',
  descricao:
    'Título, texto de apoio e uma fileira de cards que passa para o lado com setas. No último card a seta volta ao primeiro. Cards com foto (acima ou abaixo) ou sem, com botão e/ou link, em 7 cores; 2 ou 3 destaques (horários) ficam alinhados.',
  quandoUsar:
    'Listas de cards lado a lado, como unidades (Neste domingo) e eventos. A seção “Encontre seu lugar” da Home usa a Lista de ministérios.',
  doc: 'docs/componentes/carrossel-cards.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-51',
  render: (data) => <CarrosselCardsSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'Neste domingo (Home)', descricao: 'Figma: 5 unidades sem foto, link "Como chegar".', data: mocks.completo as CarrosselCardsData },
    {
      nome: 'com_imagem',
      titulo: 'Com foto e cores',
      descricao: '8 cards em todas as cores (azul, verde, laranja, vinho, preto, branco, cinza), botão e link; as setas aparecem também no computador.',
      data: comImagem,
    },
    {
      nome: 'foto_abaixo',
      titulo: 'Foto abaixo',
      descricao: '"Posição da foto nos cards" = abaixo: a foto fica depois do link.',
      data: mocks.foto_abaixo as CarrosselCardsData,
    },
    { nome: 'so_botao', titulo: 'Sem foto, só botão', descricao: '3 cards com 2 e 3 horários alinhados + link "ver todas".', data: mocks.so_botao as CarrosselCardsData },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Um card só com título: sem setas.', data: mocks.minimo as CarrosselCardsData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Títulos, destaques e textos longos.', data: mocks.texto_longo as CarrosselCardsData },
  ],
  controles: [
    {
      id: 'cor',
      tipo: 'opcoes',
      rotulo: 'Cor dos cards',
      ajuda: 'No Strapi a cor é escolhida card a card ("Cor do card"). "Variadas" usa uma cor diferente em cada card.',
      opcoes: [
        { valor: 'variadas', rotulo: 'Variadas' },
        ...CORES_CARD.map((cor) => ({ valor: cor, rotulo: cor[0].toUpperCase() + cor.slice(1) })),
      ],
      valor: (data) => {
        const cores = new Set(cardsDe(data).map((c) => c.cor ?? 'cinza'));
        return cores.size === 1 ? [...cores][0] : 'variadas';
      },
      aplicar: (data, valor) =>
        mapCards(data, (card, i) => ({ ...card, cor: valor === 'variadas' ? PALETA[i % PALETA.length] : (valor as CardData['cor']) })),
    },
    {
      id: 'foto',
      tipo: 'alternar',
      rotulo: 'Foto nos cards',
      valor: (data) => cardsDe(data).some((c) => c.imagem),
      aplicar: (data, ligado) =>
        mapCards(data, (card, i) => ({ ...card, imagem: ligado ? (card.imagem ?? FOTOS[i % FOTOS.length]) : null })),
    },
    {
      id: 'estilo_imagem',
      tipo: 'opcoes',
      rotulo: 'Tipo de imagem',
      ajuda: 'Foto: 3:2 em preto e branco. Arte de divulgação: 16:9 colorida (usada em Próximos eventos).',
      opcoes: [
        { valor: 'foto', rotulo: 'Foto (P&B)' },
        { valor: 'arte', rotulo: 'Arte (16:9, colorida)' },
      ],
      valor: (data) => data.estilo_imagem ?? 'foto',
      aplicar: (data, valor) => ({ ...data, estilo_imagem: valor === 'arte' ? 'arte' : 'foto' }),
    },
    {
      id: 'posicao',
      tipo: 'opcoes',
      rotulo: 'Posição da foto',
      ajuda: 'Só aparece com a foto ligada.',
      opcoes: [
        { valor: 'acima', rotulo: 'Acima do título' },
        { valor: 'abaixo', rotulo: 'Abaixo das ações' },
      ],
      valor: (data) => data.posicao_imagem ?? 'acima',
      aplicar: (data, valor) => ({ ...data, posicao_imagem: valor === 'abaixo' ? 'abaixo' : 'acima' }),
    },
    {
      id: 'acao',
      tipo: 'opcoes',
      rotulo: 'Ação do card',
      ajuda: 'Botão = ação principal (pílula). Link = ação secundária (texto com seta).',
      opcoes: OPCOES_ACAO,
      valor: (data) => acaoDe(cardsDe(data)[0]),
      aplicar: (data, valor) => mapCards(data, (card) => comAcao(card, valor)),
    },
    {
      id: 'estilo',
      tipo: 'opcoes',
      rotulo: 'Estilo do botão',
      ajuda: 'Só aparece quando o card tem botão.',
      opcoes: OPCOES_ESTILO_BOTAO,
      valor: (data) => cardsDe(data).find((c) => c.botao)?.botao?.estilo ?? 'solido',
      aplicar: (data, valor) => mapCards(data, (card) => comEstiloBotao(card, valor)),
    },
    alternarCampo<CarrosselCardsData, 'texto_apoio'>('texto_apoio', 'Texto de apoio', 'Texto de apoio de exemplo.'),
    alternarCampo<CarrosselCardsData, 'link'>('link', 'Link "ver todos"', { id: 9003, texto: 'Ver todos', url: '/' }),
  ],
});
