import fixture from '@/lib/inchurch/__fixtures__/eventos.json';
import { eventosDaAgenda, normalizeEventos, type EventosInchurch } from '@/lib/inchurch/eventos';
import type { InchurchEvento } from '@/lib/inchurch/types';
import { defineShowcase } from '@/lib/showcase/types';
import type { UnidadeInchurch } from '@/lib/strapi/queries/unidades';
import mocks from './AgendaEventosSection.mock.json';
import { AgendaEventos } from './AgendaEventosSection';
import { normalizeAgendaEventos } from './normalize';
import type { AgendaEventosData, AgendaEventosExemplo } from './types';

const AGORA = '2026-09-28T09:00:00-03:00';
const unidades: UnidadeInchurch[] = [
  { nome: 'ADAI Campestre', igrejaId: 30146 },
  { nome: 'ADAI Santos', igrejaId: 31876 },
];
const eventosNormalizados = normalizeEventos(fixture.results as InchurchEvento[], new Set(fixture.idsCategoriaGc), new Date(AGORA));

function comIgrejas(dados: EventosInchurch): EventosInchurch {
  return {
    ...dados,
    eventos: dados.eventos.map((evento, indice) => ({ ...evento, igrejaId: indice === 0 ? 30146 : indice === 1 ? 31876 : null, igrejaIds: indice === 0 ? [30146, 31876] : indice === 1 ? [31876] : [] })),
  };
}

const completo = comIgrejas(eventosNormalizados);
const semArte: EventosInchurch = {
  ...completo,
  eventos: completo.eventos.slice(0, 1).map((evento) => ({ ...evento, imagem: null })),
};

export const agendaEventosShowcase = defineShowcase<AgendaEventosExemplo>({
  slug: 'agenda-eventos',
  nome: 'Agenda de eventos (inChurch)',
  categoria: 'secao',
  cmsKey: 'sections.agenda-eventos',
  descricao: 'Listagem completa de eventos futuros da inChurch, com arte, data, descrição e a unidade quando ela é identificada.',
  quandoUsar: 'Na página /agenda, depois do Hero. Eventos e unidades não são cadastrados nesta seção: vêm da inChurch e do cadastro de Unidades.',
  doc: 'docs/componentes/agenda-eventos.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=220-19253',
  cms: (data) => data.strapi,
  render: ({ strapi, inchurch, unidades: unidadesDaVitrine, agora }) => {
    const view = normalizeAgendaEventos(strapi, eventosDaAgenda(inchurch, { agora: new Date(agora) }), unidadesDaVitrine);
    return <AgendaEventos view={view} index={1} id={strapi.id} />;
  },
  variantes: [
    {
      nome: 'minimo',
      titulo: 'Textos padrão',
      descricao: 'Configuração mínima da seção: os dois textos obrigatórios usam os valores aprovados para a página Agenda.',
      data: { strapi: mocks.minimo as AgendaEventosData, inchurch: completo, unidades, agora: AGORA },
    },
    {
      nome: 'completo',
      titulo: 'Arte, data, descrição e unidade',
      descricao: 'Eventos normalizados da inChurch. O primeiro demonstra duas unidades no mesmo card; o segundo, uma unidade.',
      data: { strapi: mocks.completo as AgendaEventosData, inchurch: completo, unidades, agora: AGORA },
    },
    {
      nome: 'sem_arte',
      titulo: 'Evento sem arte',
      descricao: 'A data em destaque ocupa a área 16:9 quando a inChurch não fornece a arte.',
      data: { strapi: mocks.sem_arte as AgendaEventosData, inchurch: semArte, unidades, agora: AGORA },
    },
    {
      nome: 'vazio',
      titulo: 'Nenhum evento futuro',
      descricao: 'Resposta válida da inChurch sem eventos: o título e a mensagem editorial continuam visíveis.',
      data: { strapi: mocks.vazio as AgendaEventosData, inchurch: { eventos: [], atualizadoEm: AGORA }, unidades, agora: AGORA },
    },
  ],
  controles: [
    {
      id: 'titulo',
      tipo: 'opcoes',
      rotulo: 'Título da seção',
      opcoes: [
        { valor: 'padrao', rotulo: 'Todos os eventos' },
        { valor: 'alternativo', rotulo: 'Agenda da ADAI' },
      ],
      valor: (data) => (data.strapi.titulo === 'Todos os eventos' ? 'padrao' : 'alternativo'),
      aplicar: (data, valor) => ({ ...data, strapi: { ...data.strapi, titulo: valor === 'padrao' ? 'Todos os eventos' : 'Agenda da ADAI' } }),
    },
    {
      id: 'mensagem_vazia',
      tipo: 'opcoes',
      rotulo: 'Mensagem sem eventos',
      opcoes: [
        { valor: 'padrao', rotulo: 'Ainda não há eventos programados.' },
        { valor: 'alternativa', rotulo: 'Volte em breve para novidades.' },
      ],
      valor: (data) => (data.strapi.mensagem_vazia === 'Ainda não há eventos programados.' ? 'padrao' : 'alternativa'),
      aplicar: (data, valor) => ({
        ...data,
        strapi: { ...data.strapi, mensagem_vazia: valor === 'padrao' ? 'Ainda não há eventos programados.' : 'Volte em breve para novidades.' },
      }),
    },
  ],
});
