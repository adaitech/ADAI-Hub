import { fireEvent, render, screen } from '@testing-library/react';
import { RastreadorAnalytics } from './RastreadorAnalytics';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));
jest.mock('next/web-vitals', () => ({ useReportWebVitals: jest.fn() }));

const eventos = () => (window.dataLayer ?? []).map((e) => e.event);

describe('RastreadorAnalytics', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('clique em link de seção (Server Component) gera os eventos da regra', () => {
    render(
      <main>
        <section data-section="carrossel-cards">
          <ul>
            <li>
              <h3>Campestre</h3>
              <a href="https://www.google.com/maps/search/?api=1&query=x">
                Como chegar<span className="visually-hidden"> (abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </section>
        <RastreadorAnalytics />
      </main>,
    );
    fireEvent.click(screen.getByRole('link', { name: /Como chegar/ }));
    expect(eventos()).toEqual(['como_chegar', 'clique_cta']);
    expect(window.dataLayer![0]).toMatchObject({ unidade: 'campestre', origem: 'carrossel-cards' });
    expect(window.dataLayer![1]).toMatchObject({ texto: 'como chegar' });
  });

  it('ignora elementos com data-analytics="manual" (disparam o próprio evento)', () => {
    render(
      <section data-section="serie-atual">
        <button type="button" data-analytics="manual">Assistir mensagem</button>
        <RastreadorAnalytics />
      </section>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(eventos()).toEqual([]);
  });

  it('abrir pergunta da FAQ → ver_faq', () => {
    const { container } = render(
      <section data-section="perguntas-frequentes">
        <details>
          <summary>Como faço para me batizar?</summary>
          <p>Resposta</p>
        </details>
        <RastreadorAnalytics />
      </section>,
    );
    const detalhe = container.querySelector('details')!;
    detalhe.open = true;
    fireEvent(detalhe, new Event('toggle'));
    expect(window.dataLayer![0]).toMatchObject({ event: 'ver_faq', pergunta: 'como faco para me batizar?' });
  });
});
