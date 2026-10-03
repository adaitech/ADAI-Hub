import { CarrosselCardsSection } from '@/components/sections/CarrosselCardsSection';
import { CORES_CARD } from '@/components/sections/CarrosselCardsSection/types';
import fixture from '@/lib/inchurch/__fixtures__/eventos.json';
import { normalizeEventos, proximosEventos } from '@/lib/inchurch/eventos';
import type { InchurchEvento } from '@/lib/inchurch/types';
import { defineShowcase } from '@/lib/showcase/types';
import mocks from './ProximosEventosSection.mock.json';
import { paraCarrossel, quantidadeDe } from './normalize';
import type { ProximosEventosData, ProximosEventosExemplo } from './types';

/** Eventos REAIS da inChurch (lib/inchurch/__fixtures__, sem contatos nem credenciais). */
const AGORA = '2026-09-28T09:00:00-03:00';
const inchurch = normalizeEventos(fixture.results as InchurchEvento[], new Set(fixture.idsCategoriaGc), new Date(AGORA));

export const proximosEventosShowcase = defineShowcase<ProximosEventosExemplo>({
  slug: 'proximos-eventos',
  nome: 'Próximos eventos (inChurch)',
  categoria: 'secao',
  cmsKey: 'sections.proximos-eventos',
  descricao:
    'Eventos da ADAI vindos da inChurch no mesmo Carrossel de cards, com a arte do evento (16:9, colorida), datas e horário. Só aparecem eventos marcados "Mostrar no site"; GCs ficam de fora.',
  quandoUsar: 'Na Home, depois da Série atual. No Strapi só se escolhe título, quantidade e cor; os eventos são da inChurch.',
  doc: 'docs/componentes/proximos-eventos.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-173',
  cms: (data) => data.strapi,
  render: ({ strapi, inchurch: dados, agora }) => {
    const eventos = proximosEventos(dados, { agora: new Date(agora), limite: quantidadeDe(strapi) });
    if (eventos.length === 0) return null;
    return <CarrosselCardsSection data={paraCarrossel(strapi, eventos)} index={1} secao="proximos-eventos" />;
  },
  variantes: [
    {
      nome: 'completo',
      titulo: 'Como em /exemplos (4 eventos, cards pretos)',
      descricao: 'Título e texto de apoio do Strapi; eventos reais da inChurch em 28/09.',
      data: { strapi: mocks.completo as ProximosEventosData, inchurch, agora: AGORA },
    },
    {
      nome: 'minimo',
      titulo: 'Home (padrão: 8 eventos, cinza)',
      descricao: 'Só o título: tudo o mais vem da inChurch. Recorrência (Semana de Jejum) vira "05 a 09 de Outubro".',
      data: { strapi: mocks.minimo as ProximosEventosData, inchurch, agora: AGORA },
    },
  ],
  controles: [
    {
      id: 'quantidade',
      tipo: 'opcoes',
      rotulo: 'Quantidade de eventos',
      opcoes: ['2', '4', '8', '12'].map((valor) => ({ valor, rotulo: valor })),
      valor: (data) => String(quantidadeDe(data.strapi)),
      aplicar: (data, valor) => ({ ...data, strapi: { ...data.strapi, quantidade: Number(valor) } }),
    },
    {
      id: 'cor',
      tipo: 'opcoes',
      rotulo: 'Cor dos cards',
      opcoes: CORES_CARD.map((cor) => ({ valor: cor, rotulo: cor[0].toUpperCase() + cor.slice(1) })),
      valor: (data) => data.strapi.cor_cards ?? 'cinza',
      aplicar: (data, valor) => ({ ...data, strapi: { ...data.strapi, cor_cards: valor as ProximosEventosData['cor_cards'] } }),
    },
    {
      id: 'texto_apoio',
      tipo: 'alternar',
      rotulo: 'Texto de apoio',
      valor: (data) => Boolean(data.strapi.texto_apoio?.trim()),
      aplicar: (data, ligado) => ({
        ...data,
        strapi: { ...data.strapi, texto_apoio: ligado ? data.strapi.texto_apoio || 'Cultos especiais, conferências e encontros para toda a igreja.' : null },
      }),
    },
    {
      id: 'link',
      tipo: 'alternar',
      rotulo: 'Link "agenda completa"',
      valor: (data) => Boolean(data.strapi.link),
      aplicar: (data, ligado) => ({
        ...data,
        strapi: { ...data.strapi, link: ligado ? (data.strapi.link ?? { id: 9101, texto: 'Agenda completa', url: '/agenda' }) : null },
      }),
    },
  ],
});
