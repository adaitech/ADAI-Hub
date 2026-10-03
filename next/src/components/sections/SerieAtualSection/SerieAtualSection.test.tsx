import { fireEvent, render, screen, within } from '@testing-library/react';
import { getSerieAtual } from '@/lib/youtube/serie-atual';
import { normalizeSerieAtualConfig } from './normalize';
import { SerieAtualSection } from './SerieAtualSection';
import { serieAtualShowcase } from './SerieAtualSection.showcase';
import type { SerieAtualExemplo } from './types';

jest.mock('@/lib/youtube/serie-atual', () => ({ getSerieAtual: jest.fn() }));
const getSerie = getSerieAtual as jest.MockedFunction<typeof getSerieAtual>;

const exemplo = (nome: string) => serieAtualShowcase.variantes.find((v) => v.nome === nome)!.data as SerieAtualExemplo;
const renderExemplo = (nome: string) => render(<>{serieAtualShowcase.render(exemplo(nome))}</>);

describe('SerieAtual (apresentação)', () => {
  it('destaque com série, parte atual, pregador, data e ações', () => {
    renderExemplo('completo');
    expect(screen.getByRole('heading', { level: 2, name: 'Ele Prometeu — agosto' })).toBeInTheDocument();
    expect(screen.getByText('Parte 5: Provisão')).toBeInTheDocument();
    expect(screen.getByText('Pr. Eduardo Isidio, domingo 30 de Agosto.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assistir mensagem' })).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.getByRole('link', { name: /Todas as mensagens/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/playlist?list=PLQfoGbsdZPXo',
    );
    const partes = screen.getByRole('list', { name: /Partes da série/ });
    expect(within(partes).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Parte 1: Proteção',
      'Parte 2: Presença',
      'Parte 3: Perdão',
      'Parte 4: Paz',
    ]);
  });

  it('não carrega iframe antes do clique; o clique abre o player dentro do site', () => {
    renderExemplo('completo');
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Assistir mensagem' }));
    const iframes = document.querySelectorAll('iframe');
    expect(iframes).toHaveLength(1);
    expect(document.querySelector('dialog')).toHaveAttribute('open');
    expect(iframes[0].getAttribute('src')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+\?autoplay=1/);
    expect(screen.getAllByRole('link', { name: /Assistir no YouTube/, hidden: true })[0]).toHaveAttribute('target', '_blank');
  });

  it('live: "Ao vivo agora", Parte 3 "Culto de hoje" e "Assistir ao vivo"', () => {
    renderExemplo('ao_vivo');
    expect(screen.getByText('Ao vivo agora')).toBeInTheDocument();
    expect(screen.getByText('Parte 3: Culto de hoje')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assistir ao vivo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Não compre essa briga' })).toBeInTheDocument();
  });

  it('aguardando corte: culto completo como Parte 3', () => {
    renderExemplo('aguardando_corte');
    expect(screen.getByText('Parte 3: Culto de hoje')).toBeInTheDocument();
    expect(screen.getByText(/Culto completo de domingo 27 de Setembro/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Assistir culto' })).toBeInTheDocument();
  });

  it('parte futura: sem título, pregador, data ou clique inventados', () => {
    renderExemplo('proxima_parte');
    const futura = screen.getByRole('heading', { name: 'Parte 3' }).closest('li')!;
    expect(futura).toHaveAttribute('data-status', 'upcoming');
    expect(within(futura).getByText('Mensagem ainda não disponível')).toBeInTheDocument();
    expect(within(futura).queryByRole('button')).toBeNull();
    expect(within(futura).queryByRole('link')).toBeNull();
  });

  it('cenário 10: vídeo não incorporável → link direto para o YouTube, nunca iframe', () => {
    const base = exemplo('completo');
    const controle = serieAtualShowcase.controles!.find((c) => c.id === 'player')!;
    const data = controle.tipo === 'alternar' ? controle.aplicar(base, false) : base;
    render(<>{serieAtualShowcase.render(data)}</>);
    const assistir = screen.getByRole('link', { name: 'Assistir mensagem (abre no YouTube)' });
    expect(assistir.getAttribute('href')).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(assistir).toHaveAttribute('rel', 'noopener noreferrer');
    fireEvent.click(assistir);
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('button', { name: /Assistir/ })).toBeNull();
  });
});

describe('SerieAtualSection (Strapi → YouTube → UI)', () => {
  const youtube = exemplo('aguardando_corte').youtube;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    getSerie.mockReset();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  const secao = (data: Partial<SerieAtualExemplo['strapi']>) =>
    SerieAtualSection({ data: { __component: 'sections.serie-atual', id: 1, ...data }, index: 1 });

  it('cenário 11: sem playlist no CMS → pede a série automática (null)', async () => {
    getSerie.mockResolvedValue(youtube);
    render(<>{await secao({ exibir: true })}</>);
    expect(getSerie).toHaveBeenCalledWith(null);
    expect(screen.getByRole('heading', { name: 'Não compre essa briga' })).toBeInTheDocument();
  });

  it('cenário 12: playlist do CMS → usa o ID extraído da URL', async () => {
    getSerie.mockResolvedValue(youtube);
    await secao({ playlist_url: 'https://www.youtube.com/playlist?list=PLQfoGbsdZPXo' });
    expect(getSerie).toHaveBeenCalledWith('PLQfoGbsdZPXo');
  });

  it('cenário 13: link inválido no CMS → aviso no servidor e série automática', async () => {
    getSerie.mockResolvedValue(youtube);
    await secao({ playlist_url: 'https://exemplo.com/nao-e-playlist' });
    expect(getSerie).toHaveBeenCalledWith(null);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Playlist personalizada'));
  });

  it('cenário 14: título personalizado muda só o título exibido', async () => {
    getSerie.mockResolvedValue(youtube);
    render(<>{await secao({ titulo_personalizado: 'Não Compre Essa Briga' })}</>);
    expect(screen.getByRole('heading', { name: 'Não Compre Essa Briga' })).toBeInTheDocument();
    expect(screen.getByText('Parte 2: Batalhas morais')).toBeInTheDocument();
  });

  it('"Exibir seção" desligado → não consulta o YouTube', async () => {
    expect(await secao({ exibir: false })).toBeNull();
    expect(getSerie).not.toHaveBeenCalled();
  });

  it('YouTube indisponível sem cache → seção some sem erro', async () => {
    getSerie.mockResolvedValue(null);
    expect(await secao({})).toBeNull();
  });
});

describe('normalizeSerieAtualConfig', () => {
  it('campos vazios = automático', () => {
    expect(normalizeSerieAtualConfig({ __component: 'sections.serie-atual', id: 1 })).toEqual({
      exibir: true,
      tituloPersonalizado: null,
      playlistId: null,
      playlistUrlInvalida: false,
    });
  });
});
