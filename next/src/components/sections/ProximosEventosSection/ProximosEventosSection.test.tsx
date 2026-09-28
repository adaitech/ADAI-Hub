import { render, screen, within } from '@testing-library/react';
import type { EventoSite } from '@/lib/inchurch/eventos';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import mocks from './ProximosEventosSection.mock.json';
import { datasDoEvento, paraCarrossel, quantidadeDe } from './normalize';
import { ProximosEventosSection } from './ProximosEventosSection';
import { proximosEventosShowcase } from './ProximosEventosSection.showcase';
import type { ProximosEventosData, ProximosEventosExemplo } from './types';

jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));
const getEventos = getEventosInchurch as jest.MockedFunction<typeof getEventosInchurch>;

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
    expect(data).toMatchObject({ titulo: 'Próximos eventos', estilo_imagem: 'arte', posicao_imagem: 'acima' });
    expect(data.cards?.[0]).toMatchObject({
      titulo: 'The Chosen',
      cor: 'azul',
      destaques: '14 de Outubro\n20h',
      imagem: { url: 'https://storage.googleapis.com/media_files_prod/x.webp', alternativeText: '' },
      link: { texto: 'Participar online', url: 'https://zoom.us/j/1', nova_aba: true },
    });
  });

  it('quantidade: padrão 8, limitada a 1..12', () => {
    expect(quantidadeDe({ ...minimo, quantidade: null })).toBe(8);
    expect(quantidadeDe({ ...minimo, quantidade: 40 })).toBe(12);
    expect(quantidadeDe({ ...minimo, quantidade: 0 })).toBe(8);
  });
});

describe('ProximosEventosSection', () => {
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

  it('inChurch fora (sem cache) ou sem eventos futuros → seção some', async () => {
    getEventos.mockResolvedValue(null);
    expect(await ProximosEventosSection({ data: minimo, index: 1 })).toBeNull();
    getEventos.mockResolvedValue({ eventos: [], atualizadoEm: '' });
    expect(await ProximosEventosSection({ data: minimo, index: 1 })).toBeNull();
  });
});
