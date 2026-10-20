import { render, screen, within } from '@testing-library/react';
import type { EventoSite } from '@/lib/inchurch/eventos';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import mocks from './ProximosEventosSection.mock.json';
import { getIgrejasInchurch } from '@/lib/strapi/queries/unidades';
import { datasDoEvento, igrejaDe, paraCarrossel, quantidadeDe, selecionarEventos } from './normalize';
import { ProximosEventosSection } from './ProximosEventosSection';
import { proximosEventosShowcase } from './ProximosEventosSection.showcase';
import type { ProximosEventosData, ProximosEventosExemplo } from './types';

jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));
const getEventos = getEventosInchurch as jest.MockedFunction<typeof getEventosInchurch>;
jest.mock('@/lib/strapi/queries/unidades', () => ({ getIgrejasInchurch: jest.fn(async () => []) }));
const getIgrejas = getIgrejasInchurch as jest.MockedFunction<typeof getIgrejasInchurch>;

const exemplo = (nome: string) => proximosEventosShowcase.variantes.find((v) => v.nome === nome)!.data as ProximosEventosExemplo;
const minimo = mocks.minimo as ProximosEventosData;

const ev = (ocorrencias: [string, string][], extra: Partial<EventoSite> = {}): EventoSite => ({
  id: 1,
  nome: 'Evento',
  ocorrencias: ocorrencias.map(([inicio, fim]) => ({ inicio: `${inicio}-03:00`, fim: `${fim}-03:00` })),
  imagem: null,
  descricao: null,
  link: null,
  destaque: false,
  igrejaId: null,
  ...extra,
});

describe('datasDoEvento', () => {
  it('uma data: dia e hora', () => {
    expect(datasDoEvento(ev([['2026-10-14T20:00:00', '2026-10-14T21:00:00']]))).toEqual({ destaques: '14 de Outubro\n20h', extra: null });
    expect(datasDoEvento(ev([['2026-10-17T09:30:00', '2026-10-17T11:30:00']])).destaques).toBe('17 de Outubro\n9h30');
  });

  it('dias seguidos (recorrência ou evento de 2 dias): intervalo', () => {
    const jejum = ev(['05', '06', '07', '08', '09'].map((d) => [`2026-10-${d}T05:00:00`, `2026-10-${d}T05:30:00`] as [string, string]));
    expect(datasDoEvento(jejum).destaques).toBe('05 a 09 de Outubro\n5h');
    expect(datasDoEvento(ev([['2026-11-13T19:00:00', '2026-11-14T20:00:00']])).destaques).toBe('13 a 14 de Novembro\n19h');
  });

  it('datas soltas: próxima + "Também em"', () => {
    const quarto = ev([
      ['2026-10-09T20:00:00', '2026-10-09T20:30:00'],
      ['2026-11-06T20:00:00', '2026-11-06T20:30:00'],
    ]);
    expect(datasDoEvento(quarto)).toEqual({ destaques: '09 de Outubro\n20h', extra: 'Também em 06 de Novembro' });
  });
});

describe('paraCarrossel', () => {
  it('monta o JSON do Carrossel: arte 16:9, cor do CMS, link externo em nova aba', () => {
    const data = paraCarrossel({ ...minimo, cor_cards: 'azul' }, [
      ev([['2026-10-14T20:00:00', '2026-10-14T21:00:00']], {
        nome: 'The Chosen',
        imagem: { url: 'https://storage.googleapis.com/media_files_prod/x.webp', width: 1280, height: 720 },
        link: { url: 'https://zoom.us/j/1', texto: 'Participar online' },
      }),
    ]);
    expect(data).toMatchObject({ titulo: 'Próximos eventos', estilo_imagem: 'arte', posicao_imagem: 'apos_titulo' });
    expect(data.cards?.[0]).toMatchObject({
      titulo: 'The Chosen',
      url: '/agenda/the-chosen-1',
      cor: 'azul',
      destaques: '14 de Outubro\n20h',
      imagem: { url: 'https://storage.googleapis.com/media_files_prod/x.webp', alternativeText: '' },
      link: { texto: 'Participar online', url: 'https://zoom.us/j/1', nova_aba: true },
    });
  });

  it('igrejaDe: ID da Unidade escolhida; vazio ou inválido → sem filtro', () => {
    expect(igrejaDe({ ...minimo, unidade: { id: 1, nome: 'ADAI Campestre', igreja_inchurch_id: 30146 } })).toBe(30146);
    expect(igrejaDe({ ...minimo, unidade: null })).toBeNull();
    expect(igrejaDe(minimo)).toBeNull();
    expect(igrejaDe({ ...minimo, unidade: { id: 1, igreja_inchurch_id: 0 } })).toBeNull();
  });

  it('quantidade: padrão 8, limitada a 1..12', () => {
    expect(quantidadeDe({ ...minimo, quantidade: null })).toBe(8);
    expect(quantidadeDe({ ...minimo, quantidade: 40 })).toBe(12);
    expect(quantidadeDe({ ...minimo, quantidade: 0 })).toBe(8);
  });
});

describe('ProximosEventosSection', () => {
  it('ordem cronológica inclui evento em andamento e mantém o comportamento padrão de destaques', () => {
    const dados = { atualizadoEm: '', eventos: [
      ev([['2026-10-20T09:00:00', '2026-10-20T10:00:00']], { id: 1, destaque: true }),
      ev([['2026-10-16T09:00:00', '2026-10-18T10:00:00']], { id: 2 }),
      ev([['2026-10-16T09:00:00', '2026-10-16T10:00:00']], { id: 3 }),
    ] };
    const agora = new Date('2026-10-17T12:00:00-03:00');
    expect(selecionarEventos(minimo, dados, { agora, ordemCronologica: true }).map((e) => e.id)).toEqual([2, 1]);
    expect(selecionarEventos(minimo, dados, { agora }).map((e) => e.id)).toEqual([1, 2]);
  });
  it('Outros eventos: exclui atual e encerrados, ordena por início e limita a três sem priorizar destaque ou unidade', async () => {
    getIgrejas.mockClear(); getEventos.mockClear();
    const dados = { atualizadoEm: '', eventos: [
      ev([['2027-01-10T09:00:00', '2027-01-10T10:00:00']], { id: 1 }),
      ev([['2027-01-11T09:00:00', '2027-01-11T10:00:00']], { id: 2, nome: 'Outro' }),
      ev([['2027-01-12T09:00:00', '2027-01-12T10:00:00']], { id: 3, nome: 'Da unidade', igrejaId: 10 }),
      ev([['2027-01-13T09:00:00', '2027-01-13T10:00:00']], { id: 4, nome: 'Mais um' }),
      ev([['2027-01-14T09:00:00', '2027-01-14T10:00:00']], { id: 5, nome: 'Excedente', destaque: true }),
      ev([['2020-01-01T09:00:00', '2020-01-01T10:00:00']], { id: 6, nome: 'Encerrado' }),
    ] };
    render(<>{await ProximosEventosSection({ data: { ...minimo, titulo: 'Outros eventos', quantidade: 12 }, index: 1, eventosExternos: dados, excluirId: 1, priorizarIgrejaId: 10, detalhes: true })}</>);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Outro', 'Da unidade', 'Mais um']);
    expect(screen.getByRole('link', { name: 'Da unidade' })).toHaveAttribute('href', '/agenda/da-unidade-3');
    expect(screen.getByRole('list', { name: /Outros eventos: 3 cards/ })).toHaveClass('tresColunas');
    expect(getIgrejas).not.toHaveBeenCalled(); expect(getEventos).not.toHaveBeenCalled();
  });
  it('renderiza o mesmo Carrossel de cards com as artes coloridas da inChurch', () => {
    render(<>{proximosEventosShowcase.render(exemplo('completo'))}</>);
    const lista = screen.getByRole('list', { name: /Agenda da ADAI: 4 cards/ });
    expect(lista).toHaveClass('arte');
    expect(within(lista).getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(within(lista).getByRole('heading', { name: 'Semana de Jejum & Oração' })).toBeInTheDocument();
    expect(within(lista).getByText('05 a 09 de Outubro')).toBeInTheDocument();
  });

  it('server: busca na inChurch e respeita a quantidade do CMS', async () => {
    getEventos.mockResolvedValue(exemplo('minimo').inchurch);
    const ui = await ProximosEventosSection({ data: { ...minimo, quantidade: 2 }, index: 1 });
    render(<>{ui}</>);
    expect(screen.getByRole('list', { name: 'Próximos eventos: 2 cards' })).toBeInTheDocument();
  });

  it('Home: título e card abrem detalhes pelo ID, mesmo sem link externo de inscrição', async () => {
    getEventos.mockResolvedValue({ atualizadoEm: '', eventos: [
      ev([['2027-01-10T09:00:00', '2027-01-10T10:00:00']], { id: 1635364, nome: 'Connect Pulse' }),
      ev([['2027-01-11T09:00:00', '2027-01-11T10:00:00']], { id: 2, nome: 'Conferência ADAI', link: { texto: 'Participar online', url: 'https://zoom.us/j/1' } }),
    ] });
    render(<>{await ProximosEventosSection({ data: minimo, index: 1 })}</>);
    const connect = screen.getByRole('link', { name: 'Connect Pulse' });
    expect(connect).toHaveAttribute('href', '/agenda/connect-pulse-1635364');
    expect(connect).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'Conferência ADAI' })).toHaveAttribute('href', '/agenda/conferencia-adai-2');
    expect(screen.getByRole('link', { name: /Participar online/ })).toHaveAttribute('href', 'https://zoom.us/j/1');
  });

  it('inChurch fora (sem cache) ou sem eventos futuros → seção some', async () => {
    getEventos.mockResolvedValue(null);
    expect(await ProximosEventosSection({ data: minimo, index: 1 })).toBeNull();
    getEventos.mockResolvedValue({ eventos: [], atualizadoEm: '' });
    expect(await ProximosEventosSection({ data: minimo, index: 1 })).toBeNull();
  });

  describe('página de unidade', () => {
    const tres = {
      atualizadoEm: '',
      eventos: [
        ev([['2027-01-10T09:00:00', '2027-01-10T10:00:00']], { id: 1, nome: 'Café Campestre', igrejaId: 30146 }),
        ev([['2027-01-11T09:00:00', '2027-01-11T10:00:00']], { id: 2, nome: 'Conferência geral' }),
        ev([['2027-01-12T09:00:00', '2027-01-12T10:00:00']], { id: 3, nome: 'Culto Santos', igrejaId: 31876 }),
      ],
    };
    const titulos = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

    it('mostra eventos da unidade + gerais e busca a igreja da seção mesmo fora da lista', async () => {
      getIgrejas.mockResolvedValueOnce([31876]);
      getEventos.mockResolvedValue(tres);
      const ui = await ProximosEventosSection({ data: { ...minimo, unidade: { id: 1, nome: 'ADAI Campestre', igreja_inchurch_id: 30146 } }, index: 1 });
      render(<>{ui}</>);
      expect(getEventos).toHaveBeenLastCalledWith([30146, 31876]);
      expect(titulos()).toEqual(['Café Campestre', 'Conferência geral']);
    });

    it('sem unidade (Home) → todos os eventos', async () => {
      getEventos.mockResolvedValue(tres);
      render(<>{await ProximosEventosSection({ data: minimo, index: 1 })}</>);
      expect(titulos()).toEqual(['Café Campestre', 'Conferência geral', 'Culto Santos']);
    });

    it('Unidade com ID inválido → não esconde a agenda (mostra todos)', async () => {
      getEventos.mockResolvedValue(tres);
      render(<>{await ProximosEventosSection({ data: { ...minimo, unidade: { id: 1, igreja_inchurch_id: -3 } }, index: 1 })}</>);
      expect(titulos()).toHaveLength(3);
    });
  });
});

describe('vitrine', () => {
  it('variante unidade: o evento de outra unidade fica de fora', () => {
    render(<>{proximosEventosShowcase.render(exemplo('unidade'))}</>);
    expect(screen.queryByRole('heading', { name: 'The Chosen' })).not.toBeInTheDocument();
    render(<>{proximosEventosShowcase.render(exemplo('minimo'))}</>);
    expect(screen.getByRole('heading', { name: 'The Chosen' })).toBeInTheDocument();
  });
});
