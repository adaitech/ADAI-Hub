import { fireEvent, render, screen } from '@testing-library/react';
import { VariantesTabs, type VarianteInfo } from './VariantesTabs';

const variantes: VarianteInfo[] = [
  { nome: 'completo', titulo: 'Completo', descricao: 'Como na Home.', data: { a: 1 }, padrao: { foto: false, cor: 'cinza' } },
  { nome: 'com_imagem', titulo: 'Com foto', data: { a: 2 }, padrao: { foto: true, cor: 'azul' } },
  { nome: 'minimo', titulo: 'Mínimo', data: { a: 3 }, padrao: { foto: false, cor: 'cinza' } },
];

function renderizar() {
  render(
    <VariantesTabs
      slug="carrossel-cards"
      nomeComponente="Carrossel"
      rotuloJson="JSON do Strapi deste exemplo"
      variantes={variantes}
      controles={[
        { id: 'foto', tipo: 'alternar', rotulo: 'Foto nos cards' },
        { id: 'cor', tipo: 'opcoes', rotulo: 'Cor', opcoes: [{ valor: 'cinza', rotulo: 'Cinza' }, { valor: 'azul', rotulo: 'Azul' }] },
      ]}
    />,
  );
}

const iframeSrc = () => screen.getByTitle(/Carrossel —/).getAttribute('src');

describe('VariantesTabs', () => {
  it('mostra os exemplos como abas e o primeiro selecionado', () => {
    renderizar();
    const abas = screen.getAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual(['Completo', 'Com foto', 'Mínimo']);
    expect(abas[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Completo' })).toBeInTheDocument();
    expect(iframeSrc()).toBe('/componentes/preview/carrossel-cards?variante=completo');
  });

  it('setas do teclado trocam de aba (com retorno) e o foco acompanha', () => {
    renderizar();
    const [primeira] = screen.getAllByRole('tab');
    fireEvent.keyDown(primeira, { key: 'ArrowLeft' });
    const ultima = screen.getByRole('tab', { name: 'Mínimo' });
    expect(ultima).toHaveAttribute('aria-selected', 'true');
    expect(ultima).toHaveFocus();
    fireEvent.keyDown(ultima, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Completo' })).toHaveFocus();
  });

  it('controles mudam a URL do preview; "voltar ao original" limpa', () => {
    renderizar();
    fireEvent.click(screen.getByRole('switch', { name: 'Foto nos cards' }));
    expect(screen.getByRole('switch', { name: 'Foto nos cards' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Azul' }));
    expect(iframeSrc()).toBe('/componentes/preview/carrossel-cards?variante=completo&foto=1&cor=azul');

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao exemplo original' }));
    expect(iframeSrc()).toBe('/componentes/preview/carrossel-cards?variante=completo');
    expect(screen.getByRole('radio', { name: 'Cinza' })).toBeChecked();
  });

  it('trocar de aba reinicia os controles com o estado daquele exemplo', () => {
    renderizar();
    fireEvent.click(screen.getByRole('tab', { name: 'Com foto' }));
    expect(screen.getByRole('switch', { name: 'Foto nos cards' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Azul' })).toBeChecked();
    expect(iframeSrc()).toBe('/componentes/preview/carrossel-cards?variante=com_imagem');
  });
});
