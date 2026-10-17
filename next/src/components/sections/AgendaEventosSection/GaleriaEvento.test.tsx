import { fireEvent, render, screen, within } from '@testing-library/react';
import { GaleriaEvento } from './GaleriaEvento';

const imagens = [1, 2, 3].map((id) => ({ id, imagem: `https://example.com/foto-${id}.webp`, miniatura: `https://example.com/miniatura-${id}.jpg` }));

it('sem imagens não cria seção nem modal', () => {
  const { container } = render(<GaleriaEvento imagens={[]} nomeEvento="Evento" />);
  expect(container).toBeEmptyDOMElement();
});

it('uma foto usa miniatura, abre sob demanda e devolve foco e rolagem ao fechar', () => {
  document.body.style.overflow = 'auto';
  const { container } = render(<GaleriaEvento imagens={imagens.slice(0, 1)} nomeEvento="Evento" />);
  expect(container.querySelector('img')).toHaveAttribute('src', imagens[0].miniatura);
  expect(document.querySelector(`img[src="${imagens[0].imagem}"]`)).toBeNull();
  const abrir = screen.getByRole('button', { name: 'Ampliar foto 1 de Evento' });
  fireEvent.click(abrir);
  const modal = screen.getByRole('dialog', { name: 'Galeria de Evento' });
  expect(within(modal).getByRole('img')).toHaveAttribute('src', imagens[0].imagem);
  expect(within(modal).queryByRole('button', { name: 'Próxima foto' })).toBeNull();
  expect(screen.getByRole('status')).toHaveTextContent('Foto 1 de 1');
  expect(screen.getByRole('button', { name: 'Fechar galeria' })).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('button', { name: 'Fechar galeria' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(abrir).toHaveFocus();
  expect(document.body.style.overflow).toBe('auto');
  document.body.style.overflow = '';
});

it('abre a imagem escolhida, navega com botões e teclado, fecha com Esc e pelo fundo', () => {
  render(<GaleriaEvento imagens={imagens} nomeEvento="Evento" />);
  const abrir = screen.getByRole('button', { name: 'Ampliar foto 2 de Evento' });
  fireEvent.click(abrir);
  let modal = screen.getByRole('dialog');
  expect(screen.getByRole('status')).toHaveTextContent('Foto 2 de 3');
  const proxima = screen.getByRole('button', { name: 'Próxima foto' });
  proxima.focus();
  fireEvent.keyDown(proxima, { key: 'Tab' });
  const fechar = screen.getByRole('button', { name: 'Fechar galeria' });
  expect(fechar).toHaveFocus();
  fireEvent.keyDown(fechar, { key: 'Tab', shiftKey: true });
  expect(proxima).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima foto' }));
  expect(within(modal).getByRole('img')).toHaveAttribute('src', imagens[2].imagem);
  fireEvent.keyDown(modal, { key: 'ArrowRight' });
  expect(screen.getByRole('status')).toHaveTextContent('Foto 1 de 3');
  fireEvent.keyDown(modal, { key: 'ArrowLeft' });
  fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
  expect(screen.getByRole('status')).toHaveTextContent('Foto 2 de 3');
  fireEvent(modal, new Event('cancel', { cancelable: true, bubbles: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(abrir).toHaveFocus();
  fireEvent.click(abrir);
  modal = screen.getByRole('dialog');
  fireEvent.click(within(modal).getByRole('img'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.click(modal);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('restaura rolagem ao desmontar com o lightbox aberto', () => {
  const { unmount } = render(<GaleriaEvento imagens={imagens} nomeEvento="Evento" />);
  fireEvent.click(screen.getByRole('button', { name: 'Ampliar foto 1 de Evento' }));
  unmount();
  expect(document.documentElement.style.overflow).toBe('');
  expect(document.body.style.overflow).toBe('');
});
