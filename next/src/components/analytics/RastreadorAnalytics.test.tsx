import { fireEvent, render, screen } from '@testing-library/react';
import { RastreadorAnalytics } from './RastreadorAnalytics';
import { useReportWebVitals } from 'next/web-vitals';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));
jest.mock('next/web-vitals', () => ({ useReportWebVitals: jest.fn() }));

const eventos = () => (window.dataLayer ?? []).map((e) => e.event);

describe('RastreadorAnalytics', () => {
  it('callback de métricas permanece estável após rerender e mantém valor das métricas', () => {
    const { rerender } = render(<RastreadorAnalytics />);
    const hook = jest.mocked(useReportWebVitals);
    const callback = hook.mock.calls.at(-1)![0];
    rerender(<RastreadorAnalytics />);
    expect(hook.mock.calls.at(-1)![0]).toBe(callback);
    callback({ name: 'CLS', value: 0.125, rating: 'good' } as Parameters<typeof callback>[0]);
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'web_vitals', metrica: 'cls', valor: 125 }));
  });
  it('lê contexto explícito do detalhe para Maps e CTA, preservando clique base', () => {
    render(<section data-section="evento-detalhe" data-evento="Encontro" data-evento-id="123" data-local="Auditório" data-unidade="Campus">
      <a href="https://www.google.com/maps/search/">Ver no Google Maps</a>
      <div data-acao-evento="acessar"><a href="https://example.com/evento?token=privado">Acessar evento</a></div>
      <RastreadorAnalytics />
    </section>);
    fireEvent.click(screen.getByText('Ver no Google Maps'));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'como_chegar', local: 'auditorio', unidade: 'campus', evento: 'encontro' }));
    fireEvent.click(screen.getByText('Acessar evento'));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: 'acessar_evento', evento_id: 123, destino: 'https://example.com/evento' }));
    expect(window.dataLayer?.filter(e => e.event === 'clique_cta')).toHaveLength(2);
  });
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

  it('ver_secao: seção alta (texto longo, mais de 4 telas) conta quando ocupa metade da tela', () => {
    let callback: IntersectionObserverCallback = () => {};
    const original = window.IntersectionObserver;
    window.IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
      callback = cb;
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
    }) as unknown as typeof IntersectionObserver;
    const { container } = render(
      <main>
        <div data-section="texto-rico">Texto longo</div>
        <RastreadorAnalytics />
      </main>,
    );
    const alvo = container.querySelector('[data-section]')!;
    const entrada = (ratio: number, altura: number) =>
      ({ target: alvo, isIntersecting: true, intersectionRatio: ratio, intersectionRect: { height: altura } }) as unknown as IntersectionObserverEntry;
    callback([entrada(0.1, window.innerHeight * 0.2)], {} as IntersectionObserver);
    expect(eventos()).toEqual([]);
    callback([entrada(0.15, window.innerHeight * 0.6)], {} as IntersectionObserver);
    expect(window.dataLayer).toEqual([expect.objectContaining({ event: 'ver_secao', secao: 'texto-rico', posicao: 1 })]);
    window.IntersectionObserver = original;
  });

  it('Como chegar no Hero da página da unidade usa o h1 como unidade', () => {
    render(
      <main>
        <section data-section="hero">
          <h1>Campestre</h1>
          <a href="https://www.google.com/maps/search/?api=1&query=x">Como chegar</a>
        </section>
        <RastreadorAnalytics />
      </main>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Como chegar' }));
    expect(window.dataLayer![0]).toMatchObject({ event: 'como_chegar', unidade: 'campestre' });
  });
});
