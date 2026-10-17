import { screen } from '@testing-library/react';
import EventoPage, { generateMetadata } from '@/app/(site)/agenda/[slug]/page';
import { getEventoDetalhe } from '@/lib/inchurch/eventos-cache';
import { normalizeDetalhe, normalizeDetalheAdministrativo } from '@/lib/inchurch/detalhes';
import administrativo from '@/lib/inchurch/__fixtures__/evento-admin.json';
import fixture from '@/lib/inchurch/__fixtures__/eventos.json';
import type { InchurchEvento } from '@/lib/inchurch/types';
import { renderizarServidor } from '@/test-utils/servidor';

jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventoDetalhe: jest.fn() }));
jest.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
const getDetalhe = jest.mocked(getEventoDetalhe);
const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))! as InchurchEvento;
const props = { params: Promise.resolve({ slug: `titulo-antigo-${raw.id}` }) };

it('evento de referência usa SEO e JSON-LD normais, sem prévia local', async () => {
  const evento = normalizeDetalhe({ ...raw, location: { address: 'Rua Real', city: 'Santo André' } })!;
  getDetalhe.mockResolvedValue({ estado: 'ok', evento, relacionados: { eventos: [], atualizadoEm: '' } });
  expect(await generateMetadata(props)).toMatchObject({ title: { absolute: `${raw.name} | ADAI` } });
  const { container } = await renderizarServidor(await EventoPage(props));
  expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  expect(screen.getByRole('heading', { level: 1, name: raw.name! })).toBeInTheDocument();
});

it('detalhes e metadata encontram o evento pelo ID com título antigo', async () => {
  const evento = normalizeDetalhe(raw)!;
  getDetalhe.mockResolvedValue({ estado: 'ok', evento, relacionados: { eventos: [], atualizadoEm: '' } });
  await renderizarServidor(await EventoPage(props));
  expect(screen.getByRole('heading', { level: 1, name: raw.name! })).toBeInTheDocument();
  expect(screen.queryByText('Outros eventos')).not.toBeInTheDocument();
  expect(await generateMetadata(props)).toMatchObject({ title: { absolute: `${raw.name} | ADAI` } });
  expect(getDetalhe).toHaveBeenCalledWith(raw.id);
});

it('ID inexistente ou slug inválido → 404; indisponibilidade → erro recuperável', async () => {
  getDetalhe.mockResolvedValue({ estado: 'nao-encontrado' });
  await expect(EventoPage(props)).rejects.toThrow('NOT_FOUND');
  await expect(generateMetadata(props)).rejects.toThrow('NOT_FOUND');
  await expect(EventoPage({ params: Promise.resolve({ slug: 'invalido' }) })).rejects.toThrow('NOT_FOUND');
  getDetalhe.mockResolvedValue({ estado: 'indisponivel' });
  await expect(EventoPage(props)).rejects.toThrow('Não foi possível carregar');
  await expect(generateMetadata(props)).rejects.toThrow('Não foi possível carregar');
});

it('conteúdo administrativo normalizado aparece no HTML e no SEO sem campos internos', async () => {
  const evento = normalizeDetalheAdministrativo({ ...administrativo, id: raw.id, name: raw.name, show_on_site: true, description: 'Descrição completa administrativa.', event_attractions: [{ name: 'Diogo Mour' }] }, normalizeDetalhe(raw)!, [{ igrejaId: 30146, nome: 'ADAI Campestre' }])!;
  getDetalhe.mockResolvedValue({ estado: 'ok', evento, relacionados: { eventos: [], atualizadoEm: '' } });
  const { html } = await renderizarServidor(await EventoPage(props));
  expect(screen.getByRole('heading', { name: 'Programação', level: 2 })).toBeInTheDocument();
  expect(screen.getByText('ADAI Campestre')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Convidados', level: 2 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Diogo Mour', level: 3 })).toBeInTheDocument();
  expect(await generateMetadata(props)).toMatchObject({ description: 'Descrição completa administrativa.', title: { absolute: `${raw.name} | ADAI` } });
  expect(html).not.toMatch(/related_obj|published_for|INCHURCH_ADMIN_API_KEY|ApiKey/);
});

it('JSON-LD renderizado no servidor é JSON válido e não permite fechar o script', async () => {
  const evento = normalizeDetalhe({ ...raw, name: 'Evento </script><script>alert(1)</script>', description: '<p>Descrição</p>', location: { address: 'Rua Real', city: 'Santo André' } })!;
  getDetalhe.mockResolvedValue({ estado: 'ok', evento, relacionados: { eventos: [], atualizadoEm: '' } });
  const { container } = await renderizarServidor(await EventoPage(props));
  const scripts = container.querySelectorAll('script');
  expect(scripts).toHaveLength(1);
  expect(JSON.parse(scripts[0].textContent!)).toMatchObject({ '@type': 'Event', name: evento.nome });
});
