import { render, screen } from '@testing-library/react';
import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { normalizeCurso } from '@/lib/eba/curso';
import type { CursoView, StrapiCurso } from '@/lib/eba/types';
import { CursoCabecalho, CursoInscricao } from './CursoCabecalho';

const [talmidimCru, , startCru] = fixture.data as StrapiCurso[];
const talmidim = normalizeCurso(talmidimCru) as CursoView;
const start = normalizeCurso(startCru) as CursoView;
const trilha = [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos', href: '/eba/cursos' }, { texto: 'Talmidim' }];

describe('CursoCabecalho', () => {
  it('trilha, vertente, título h1 com o nome, resumo e informações', () => {
    render(<CursoCabecalho curso={talmidim} trilha={trilha} />);
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toBeInTheDocument();
    expect(screen.getByText('Curso de integração')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Talmidim' })).toBeInTheDocument();
    expect(screen.getByText(talmidim.resumo)).toBeInTheDocument();
    expect(screen.getByText('Adolescentes de 12 a 15 anos')).toBeInTheDocument();
  });

  it('inscrição em nova aba: link seguro, data-curso e aviso visível', () => {
    render(<CursoCabecalho curso={talmidim} trilha={trilha} />);
    const botao = screen.getByRole('link', { name: /Quero me inscrever/ });
    expect(botao).toHaveAttribute('href', 'https://forms.gle/BtMpykm2Gs6zM1Mm6');
    expect(botao).toHaveAttribute('target', '_blank');
    expect(botao).toHaveAttribute('rel', 'noopener noreferrer');
    expect(botao).toHaveAttribute('data-curso', 'talmidim');
    expect(screen.getByText('A inscrição abre em nova aba.')).toBeInTheDocument();
  });

  it('"Perguntas frequentes" só quando o corpo tem a seção', () => {
    const { rerender } = render(<CursoCabecalho curso={talmidim} trilha={trilha} />);
    expect(screen.queryByRole('link', { name: 'Perguntas frequentes' })).toBeNull();
    rerender(<CursoCabecalho curso={{ ...talmidim, temPerguntasFrequentes: true }} trilha={trilha} />);
    expect(screen.getByRole('link', { name: 'Perguntas frequentes' })).toHaveAttribute('href', '#perguntas-frequentes');
  });

  it('com vídeo: botão que abre o player, com nome acessível do curso', () => {
    const comVideo = { ...talmidim, video: { videoId: 'dQw4w9WgXcQ', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', thumbnail: null, embeddable: true } };
    render(<CursoCabecalho curso={comVideo} trilha={trilha} />);
    expect(screen.getByRole('button', { name: 'Assistir à apresentação do Talmidim' })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('capa com prioridade de carregamento; sem capa → sem imagem; sem inscrição → sem botão', () => {
    const { container, rerender } = render(<CursoCabecalho curso={talmidim} trilha={trilha} />);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
    rerender(<CursoCabecalho curso={start} trilha={trilha} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('link', { name: /inscrever/ })).toBeNull();
  });

  it('bloco final "Pronto para começar?" repete a inscrição com data-curso; sem inscrição → nada', () => {
    const { container, rerender } = render(<CursoInscricao curso={talmidim} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Pronto para começar?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quero me inscrever/ })).toHaveAttribute('data-curso', 'talmidim');
    expect(container.querySelector('[data-section="curso-inscricao"]')).not.toBeNull();
    rerender(<CursoInscricao curso={start} />);
    expect(screen.queryByText('Pronto para começar?')).toBeNull();
  });
});

