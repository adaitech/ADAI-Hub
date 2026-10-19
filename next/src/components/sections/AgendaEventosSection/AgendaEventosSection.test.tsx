import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { EventoSite, EventosInchurch } from '@/lib/inchurch/eventos';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { getUnidadesInchurch, type UnidadeInchurch } from '@/lib/strapi/queries/unidades';
import { AgendaEventos, AgendaEventosSection } from './AgendaEventosSection';
import { agendaEventosShowcase } from './AgendaEventosSection.showcase';
import { normalizeAgendaEventos } from './normalize';
import type { AgendaEventosData } from './types';

jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));
jest.mock('@/lib/strapi/queries/unidades', () => ({ getUnidadesInchurch: jest.fn() }));

const getEventos = getEventosInchurch as jest.MockedFunction<typeof getEventosInchurch>;
const getUnidades = getUnidadesInchurch as jest.MockedFunction<typeof getUnidadesInchurch>;

const data: AgendaEventosData = {
  __component: 'sections.agenda-eventos',
  id: 71,
  titulo: 'Todos os eventos',
  mensagem_vazia: 'Ainda não há eventos programados.',
};

const unidades: UnidadeInchurch[] = [
  { nome: 'ADAI Campestre', igrejaId: 30146 },
  { nome: 'ADAI Santos', igrejaId: 31876 },
];

const evento = (id: number, parcial: Partial<EventoSite> = {}): EventoSite => ({
  id,
  nome: `Evento ${id}`,
  ocorrencias: [{ inicio: '2027-10-17T10:00:00-03:00', fim: '2027-10-17T11:00:00-03:00' }],
  imagem: { url: `https://storage.googleapis.com/media_files_prod/evento-${id}.webp`, width: 1280, height: 720 },
  descricao: 'Uma descrição editorial do evento.',
  link: null,
  destaque: false,
  igrejaId: null,
  ...parcial,
});

const eventos: EventoSite[] = [
  evento(1, { nome: 'Culto Campestre', igrejaId: 30146 }),
  evento(2, { nome: 'Encontro geral' }),
  evento(3, { nome: 'Evento sem unidade conhecida', igrejaId: 99999 }),
  evento(4, { nome: 'Evento online', link: { url: 'https://zoom.us/j/123', texto: 'Participar online' } }),
  evento(5, { nome: 'Evento sem arte', imagem: null }),
];

it('renderiza todas as badges conhecidas e encontra o card por qualquer unidade associada', () => {
  const view = normalizeAgendaEventos(data, [evento(1646183, { nome: 'HACKATHON ADAI HUB', igrejaId: 30146, igrejaIds: [30146, 31876, 99999] })], unidades);
  render(<AgendaEventos view={view} index={1} id={data.id} />);
  const card = screen.getByRole('article', { name: 'HACKATHON ADAI HUB' });
  expect(within(card).getByText('ADAI Campestre')).toBeInTheDocument();
  expect(within(card).getByText('ADAI Santos')).toBeInTheDocument();
  expect(within(card).queryByText('99999')).not.toBeInTheDocument();
  for (const id of ['30146', '31876']) {
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: id } });
    expect(screen.getByRole('article', { name: 'HACKATHON ADAI HUB' })).toBeInTheDocument();
  }
});

const dados: EventosInchurch = { eventos, atualizadoEm: '2027-10-01T00:00:00-03:00' };

beforeEach(() => {
  getUnidades.mockReset();
  getEventos.mockReset();
  getUnidades.mockResolvedValue(unidades);
  getEventos.mockResolvedValue(dados);
});

describe('normalizeAgendaEventos', () => {
  it('inclui badge só para a unidade conhecida e destaca a data quando falta arte', () => {
    const view = normalizeAgendaEventos(data, eventos, unidades);

    expect(view.cards.find((card) => card.titulo === 'Culto Campestre')?.badge).toBe('ADAI Campestre');
    expect(view.cards.find((card) => card.titulo === 'Encontro geral')?.badge).toBeNull();
    expect(view.cards.find((card) => card.titulo === 'Evento sem unidade conhecida')?.badge).toBeNull();
    expect(view.cards.find((card) => card.titulo === 'Evento sem arte')?.fallbackData).toEqual({ dia: '17', mes: 'OUT' });
  });
});

describe('AgendaEventos', () => {
  it('mede filtro com contagem correta e busca com debounce, sem enviar texto pessoal', () => {
    jest.useFakeTimers();
    window.dataLayer = [];
    const { unmount } = render(<AgendaEventos view={normalizeAgendaEventos(data, eventos, unidades)} index={1} id={data.id} />);
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: '30146' } });
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'filtrar_agenda', resultados: 5, valor_filtro: 'adai campestre' }));
    fireEvent.change(screen.getByLabelText('Buscar eventos'), { target: { value: 'meu-email@example.com' } });
    act(() => jest.advanceTimersByTime(999));
    expect(window.dataLayer?.filter(e => e.event === 'buscar_evento')).toHaveLength(0);
    act(() => jest.advanceTimersByTime(1));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'buscar_evento', caracteres: 21, resultados: 0 }));
    expect(JSON.stringify(window.dataLayer)).not.toContain('example.com');
    fireEvent.change(screen.getByLabelText('Buscar eventos'), { target: { value: 'ab' } });
    act(() => jest.advanceTimersByTime(1000));
    expect(window.dataLayer?.filter(e => e.event === 'buscar_evento')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Buscar eventos'), { target: { value: 'cancelar' } });
    unmount();
    act(() => jest.advanceTimersByTime(1000));
    expect(window.dataLayer?.filter(e => e.event === 'buscar_evento')).toHaveLength(1);
    jest.useRealTimers();
  });
  it('filtro de unidade preserva gerais e denominação, mas oculta outras unidades', () => {
    const view = normalizeAgendaEventos(data, [evento(90, { nome: 'Geral', igrejaId: null }), evento(91, { nome: 'Denominação', igrejaId: 3320 }), evento(92, { nome: 'Santos', igrejaId: 31876 }), evento(93, { nome: 'Campestre', igrejaId: 30146 })], unidades);
    render(<AgendaEventos view={view} index={1} id={data.id} />);
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: '30146' } });
    expect(screen.getByRole('article', { name: 'Geral' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Denominação' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Campestre' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Santos' })).not.toBeInTheDocument();
  });
  it('renderiza cards informativos com arte, badge, data, descrição e fallback', () => {
    const view = normalizeAgendaEventos(data, eventos, unidades);
    render(<AgendaEventos view={view} index={1} id={data.id} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Todos os eventos' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(within(screen.getByRole('article', { name: 'Culto Campestre' })).getByText('ADAI Campestre')).toBeInTheDocument();
    expect(screen.getAllByText('17 de Outubro')).toHaveLength(5);
    expect(screen.getAllByText('10h')).toHaveLength(5);
    expect(screen.getAllByText('Uma descrição editorial do evento.')).toHaveLength(5);
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('OUT')).toBeInTheDocument();

    for (const artigo of screen.getAllByRole('article')) {
      expect(within(artigo).getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^\/agenda\/.+-\d+$/));
      expect(within(artigo).queryByRole('button')).not.toBeInTheDocument();
    }
  });

  it('combina filtro de unidade e busca sem diferenciar acentos, e permite limpar quando não há resultado', () => {
    const view = normalizeAgendaEventos(
      data,
      [
        evento(10, { nome: 'Celebração no Campestre', descricao: 'Um encontro para toda a família.', igrejaId: 30146 }),
        evento(11, { nome: 'Culto em Santos', descricao: 'Momento de comunhão.', igrejaId: 31876 }),
      ],
      unidades,
    );
    render(<AgendaEventos view={view} index={1} id={data.id} />);

    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: '30146' } });
    fireEvent.change(screen.getByPlaceholderText('Buscar eventos...'), { target: { value: 'celebracao' } });

    expect(screen.getByRole('article', { name: 'Celebração no Campestre' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Culto em Santos' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Buscar eventos...'), { target: { value: 'comunhao' } });

    expect(screen.getByRole('article', { name: 'Culto em Santos' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Buscar eventos...'), { target: { value: 'inexistente' } });

    expect(screen.getByText('Nenhum evento encontrado com estes filtros.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

describe('AgendaEventosSection', () => {
  it('busca todas as unidades e não transforma link online em ação do card', async () => {
    render(<>{await AgendaEventosSection({ data, index: 1 })}</>);

    expect(getEventos).toHaveBeenCalledWith([30146, 31876]);
    const online = screen.getByRole('article', { name: 'Evento online' });
    expect(within(online).getByRole('link')).toHaveAttribute('href', '/agenda/evento-online-4');
    expect(within(online).queryByRole('button')).not.toBeInTheDocument();
  });

  it('mantém a seção visível com a mensagem editorial quando a resposta válida não traz eventos', async () => {
    getEventos.mockResolvedValue({ eventos: [], atualizadoEm: '' });

    render(<>{await AgendaEventosSection({ data, index: 1 })}</>);

    expect(screen.getByRole('heading', { level: 2, name: 'Todos os eventos' })).toBeInTheDocument();
    expect(screen.getByText('Ainda não há eventos programados.')).toBeInTheDocument();
  });

  it('oculta a seção quando a inChurch está indisponível sem cache', async () => {
    getEventos.mockResolvedValue(null);

    expect(await AgendaEventosSection({ data, index: 1 })).toBeNull();
  });
});

describe('vitrine', () => {
  it('oferece os estados completo, sem arte e vazio com os controles editoriais', () => {
    expect(agendaEventosShowcase.variantes.map((variante) => variante.nome)).toEqual(expect.arrayContaining(['completo', 'minimo', 'sem_arte', 'vazio']));
    expect(agendaEventosShowcase.controles?.map((controle) => controle.id)).toEqual(['titulo', 'mensagem_vazia']);

    const semArte = agendaEventosShowcase.variantes.find((variante) => variante.nome === 'sem_arte')!;
    render(<>{agendaEventosShowcase.render(semArte.data)}</>);
    expect(screen.getByText('OUT')).toBeInTheDocument();
  });
});
