import { render, screen } from '@testing-library/react';
import fixture from '@/lib/inchurch/__fixtures__/eventos.json';
import { normalizeDetalhe, normalizeDetalheAdministrativo } from '@/lib/inchurch/detalhes';
import administrativo from '@/lib/inchurch/__fixtures__/evento-admin.json';
import type { InchurchEvento } from '@/lib/inchurch/types';
import { EventoDetalhe } from './EventoDetalhe';

const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))! as InchurchEvento;
beforeEach(() => { jest.useFakeTimers({ now: new Date('2026-09-28T12:00:00-03:00') }); });
afterEach(() => { jest.useRealTimers(); });

it('encerrado permanece acessível com aviso, retorno à Agenda e sem CTA', () => {
  const evento = normalizeDetalhe({ ...raw, start_datetime: '2020-01-01T10:00:00', end_datetime: '2020-01-01T11:00:00', event_url: 'https://example.com/evento' })!;
  render(<EventoDetalhe evento={evento} />);
  expect(screen.getByText('Este evento já aconteceu.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Confira os próximos eventos na Agenda' })).toHaveAttribute('href', '/agenda');
  expect(screen.queryByRole('link', { name: /Acessar evento/ })).not.toBeInTheDocument();
});

it('convidado mostra foto, cargo, biografia em parágrafos e link com seta em nova aba', () => {
  const evento = normalizeDetalheAdministrativo({ id: raw.id, event_attractions: [{ name: 'Diogo Mour', title: 'Software Development Manager', description: '<p>Biografia do convidado</p><p>Outro parágrafo\nOutra linha</p><script>alert(1)</script>', photo: 'https://storage.googleapis.com/convidado.jpg', url: 'https://www.linkedin.com/in/diogomoura/' }] }, normalizeDetalhe(raw)!, [])!;
  const { container } = render(<EventoDetalhe evento={evento} />);
  expect(screen.getByRole('heading', { name: 'Convidados', level: 2 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Diogo Mour', level: 3 })).toBeInTheDocument();
  expect(screen.getByAltText('Foto de Diogo Mour')).toHaveAttribute('src', 'https://storage.googleapis.com/convidado.jpg');
  expect(screen.getByText('Software Development Manager')).toBeInTheDocument();
  expect(screen.getByText('Biografia do convidado').tagName).toBe('P');
  expect(screen.getByText(/Outro parágrafo/).textContent).toBe('Outro parágrafo\nOutra linha');
  const link = screen.getByRole('link', { name: /Saiba mais sobre Diogo Mour/ });
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(link.querySelector('svg')).not.toBeNull();
  expect(container.querySelector('script')).toBeNull();
});

it('múltiplos convidados mantêm ordem e iniciais; opcionais e seção vazia ficam ocultos', () => {
  const base = normalizeDetalhe(raw)!;
  const evento = normalizeDetalheAdministrativo({ ...administrativo, id: raw.id, show_on_site: true, event_attractions: [{ name: 'Diogo Mour', url: 'javascript:alert(1)' }, { name: 'Convidada de teste' }], event_images: [{ id: 115202, image: 'https://example.com/foto.jpg' }] }, base, [])!;
  const { rerender, container } = render(<EventoDetalhe evento={evento} />);
  const secao = screen.getByRole('region', { name: 'Convidados' });
  expect(Array.from(secao.querySelectorAll('h3')).map((h) => h.textContent)).toEqual(['Diogo Mour', 'Convidada de teste']);
  expect(screen.getByText('DM')).toHaveAttribute('aria-hidden', 'true');
  expect(secao.querySelector('a, img')).toBeNull();
  expect(Array.from(container.querySelectorAll('section[data-section]')).map((s) => s.getAttribute('data-section')).slice(-3)).toEqual(['programacao-evento', 'convidados-evento', 'galeria-evento']);
  expect(screen.getByRole('heading', { name: 'Galeria do evento', level: 2 })).toBeInTheDocument();
  rerender(<EventoDetalhe evento={base} />);
  expect(screen.queryByRole('heading', { name: 'Convidados' })).not.toBeInTheDocument();
});

it('programação mostra horários locais, atividade e opcionais; fica oculta quando vazia', () => {
  const base = normalizeDetalhe(raw)!;
  const evento = normalizeDetalheAdministrativo({ ...administrativo, id: raw.id, show_on_site: true }, base, [])!;
  const { rerender } = render(<EventoDetalhe evento={evento} />);
  expect(screen.getByRole('heading', { name: 'Programação', level: 2 })).toBeInTheDocument();
  expect(screen.getByText('A sequência do dia, horário por horário')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: administrativo.event_schedule[0].title, level: 3 })).toBeInTheDocument();
  expect(screen.getByText('15h50')).toHaveAttribute('dateTime', '15:50');
  expect(screen.getByText('16h15')).toHaveAttribute('dateTime', '16:15');
  rerender(<EventoDetalhe evento={base} />);
  expect(screen.queryByText('Programação')).not.toBeInTheDocument();
});

it('vários dias e unidades são exibidos sem transformar o local físico em campus', () => {
  const primeiro = administrativo.event_schedule[0];
  const evento = normalizeDetalheAdministrativo({ ...administrativo, id: raw.id, show_on_site: true,
    units: [...administrativo.units, { id: 99, name: 'Santos', related_obj: { id: 31876, name: 'ADAI Santos', model: 'inradartertiarygroup' } }],
    event_schedule: [primeiro, { ...primeiro, id: 2, event_date: '2026-10-18T00:00:00', title: 'Atividade do segundo dia', description: '<p>Descrição da atividade</p>', venue: 'Auditório' }],
  }, normalizeDetalhe(raw)!, [])!;
  render(<EventoDetalhe evento={evento} />);
  expect(screen.getByText('ADAI CAMPESTRE, ADAI Santos')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '17 de outubro de 2026', level: 3 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '18 de outubro de 2026', level: 3 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Atividade do segundo dia', level: 4 })).toBeInTheDocument();
  expect(screen.getByText('Descrição da atividade')).toBeInTheDocument();
  expect(screen.getByText('Local: Auditório')).toBeInTheDocument();
});

it('exibe a unidade resolvida pela associação e oculta o campo sem vínculo', () => {
  const evento = { ...raw, responsible_church: null };
  const { rerender } = render(<EventoDetalhe evento={normalizeDetalhe(evento, { igrejaId: 30146, nome: 'ADAI Campestre' })!} />);
  expect(screen.getByText('Unidade')).toBeInTheDocument();
  expect(screen.getByText('ADAI Campestre')).toBeInTheDocument();
  rerender(<EventoDetalhe evento={normalizeDetalhe(evento, null)!} />);
  expect(screen.queryByText('Unidade')).not.toBeInTheDocument();
});

it('breadcrumb, único h1, descrição completa e informações reais', () => {
  const evento = normalizeDetalhe({ ...raw, description: '<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>', paid_event: false, event_url: 'https://example.com/evento', responsible_church: { id: 1, name: 'Campestre' } })!;
  render(<EventoDetalhe evento={evento} />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/agenda');
  expect(screen.getByText('Segundo parágrafo.')).toBeInTheDocument();
  expect(screen.queryByText('Investimento')).not.toBeInTheDocument();
  expect(screen.queryByText('Gratuito')).not.toBeInTheDocument();
  expect(screen.getByText('Campestre')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Acessar evento/ })).toHaveAttribute('href', 'https://example.com/evento');
});

it('sem opcionais, oculta unidade, preço, inscrição e programação', () => {
  render(<EventoDetalhe evento={normalizeDetalhe({ ...raw, description: null, image: null, image_webp: null, end_datetime: null, event_url: null, location: null, has_external_subscription: true, external_subscription_url: 'https://example.com/inscricao' })!} />);
  expect(screen.queryByText('Unidade')).not.toBeInTheDocument();
  expect(screen.queryByText('Investimento')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Acessar evento/ })).not.toBeInTheDocument();
  expect(screen.queryByText('Local')).not.toBeInTheDocument();
  expect(screen.queryByText('Programação')).not.toBeInTheDocument();
});

it('Zoom sem inscrição aparece como Acessar evento com proteção de nova aba', () => {
  const url = 'https://us06web.zoom.us/j/123';
  render(<EventoDetalhe evento={normalizeDetalhe({ ...raw, has_registrations: false, event_url: url, external_subscription_url: null })!} />);
  const cta = screen.getByRole('link', { name: /Acessar evento/ });
  expect(cta).toHaveAttribute('href', url);
  expect(cta).toHaveAttribute('target', '_blank');
  expect(cta).toHaveAttribute('rel', 'noopener noreferrer');
});

it('descrição preserva parágrafos e quebra de linha, cria links seguros sem executar HTML', () => {
  render(<EventoDetalhe evento={normalizeDetalhe({ ...raw, description: '<p>Primeiro\nsegunda linha: https://example.com/a?x=1&amp;y=2.</p><p>Outro https://example.com/path_(ok). &lt;img src=x onerror=alert(1)&gt; javascript:alert(1)</p>', paid_event: true })!} />);
  expect(screen.queryByText('Investimento')).not.toBeInTheDocument();
  expect(screen.queryByText('Evento pago')).not.toBeInTheDocument();
  const links = screen.getAllByRole('link', { name: /^https:\/\/example.com/ });
  expect(links[0]).toHaveAttribute('href', 'https://example.com/a?x=1&y=2');
  expect(links[1]).toHaveAttribute('href', 'https://example.com/path_(ok)');
  expect(links[0].closest('p')?.textContent).toContain('Primeiro\nsegunda linha:');
  expect(links[0].closest('p')).not.toBe(links[1].closest('p'));
  expect(document.querySelector('img[onerror]')).toBeNull();
});

it('Local exibe o endereço físico e Maps em nova aba, separado da unidade', () => {
  render(<EventoDetalhe evento={normalizeDetalhe({ ...raw, responsible_church: { id: 1, name: 'Campestre' }, location: { address_complement: 'Auditório Municipal', address: 'Rua Real', address_number: '123', neighborhood: 'Centro', city: 'Santos', state: 'SP', latitude: -23.96, longitude: -46.33 } })!} />);
  expect(screen.getByText('Local')).toBeInTheDocument();
  for (const texto of ['Auditório Municipal', 'Rua Real, 123', 'Centro', 'Santos - SP', 'Campestre']) expect(screen.getByText(texto)).toBeInTheDocument();
  const mapa = screen.getByRole('link', { name: /Ver no Google Maps/ });
  expect(new URL(mapa.getAttribute('href')!).searchParams.get('query')).toBe('-23.96,-46.33');
  expect(mapa).toHaveAttribute('target', '_blank');
  expect(mapa).toHaveAttribute('rel', 'noopener noreferrer');
});
