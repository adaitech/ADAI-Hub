import { render, screen } from '@testing-library/react';
import { draftMode } from 'next/headers';
import { PreviewBanner } from './PreviewBanner';

jest.mock('next/headers', () => ({ draftMode: jest.fn() }));
const modoRascunho = (isEnabled: boolean) => (draftMode as jest.Mock).mockResolvedValue({ isEnabled });

describe('PreviewBanner', () => {
  it('site publicado (sem draft mode) → nada aparece', async () => {
    modoRascunho(false);
    expect(await PreviewBanner()).toBeNull();
  });

  it('rascunho do Strapi → aviso anunciado ao leitor de tela e botão para sair', async () => {
    modoRascunho(true);
    render(<>{await PreviewBanner()}</>);
    expect(screen.getByRole('status')).toHaveTextContent('Você está vendo o rascunho (ainda não publicado).');
    expect(screen.getByRole('button', { name: 'Sair da pré-visualização' })).toHaveAttribute('type', 'submit');
  });
});
