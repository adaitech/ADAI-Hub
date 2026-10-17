import fixture from './__fixtures__/eventos.json';
import { idDoSlug, metadataDoEvento, normalizeDetalhe, normalizeDetalheAdministrativo, normalizarConvidados, normalizarGaleria, normalizarProgramacao, normalizarUnidadesAdministrativas, partesDaDescricao, schemaDoEvento, textoDaDescricao, urlDoEvento } from './detalhes';
import administrativo from './__fixtures__/evento-admin.json';
import type { InchurchEvento } from './types';

const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))! as InchurchEvento;

describe('galeria administrativa', () => {
  it('usa a fonte maior no grid em vez do thumbnail de baixa resolução, preservando IDs, ordem e filtros', () => {
    const fotos = normalizarGaleria([
      { id: 2, image_webp: 'https://example.com/2.webp', image: 'https://example.com/2.jpg', thumbnail: 'https://example.com/mini.jpg' },
      { id: 1, image: 'https://example.com/1.jpg', app_image: 'https://example.com/app.jpg' },
      { id: 3, image: 'https://example.com/oculta.jpg', on_blacklist: true },
      { id: 4, image: 'javascript:alert(1)' }, { id: 0, image: 'https://example.com/0.jpg' },
      { id: 2, image: 'https://example.com/duplicada.jpg' }, { id: 5, thumbnail: 'https://example.com/so-thumb.jpg' },
      { id: 6, image_webp: 'data:image/png,a', image: 'https://example.com/6.jpg', thumbnail: 'javascript:alert(1)' },
    ]);
    expect(fotos).toEqual([
      { id: 2, imagem: 'https://example.com/2.webp', miniatura: 'https://example.com/2.webp' },
      { id: 1, imagem: 'https://example.com/1.jpg', miniatura: 'https://example.com/1.jpg' },
      { id: 5, imagem: 'https://example.com/so-thumb.jpg', miniatura: 'https://example.com/so-thumb.jpg' },
      { id: 6, imagem: 'https://example.com/6.jpg', miniatura: 'https://example.com/6.jpg' },
    ]);
  });
  it.each([undefined, null, []])('galeria ausente %j fica vazia e não copia a imagem do Hero', (event_images) => {
    expect(normalizarGaleria(event_images)).toEqual([]);
    expect(normalizeDetalheAdministrativo({ id: raw.id, event_images }, normalizeDetalhe(raw)!, [])?.galeria).toEqual([]);
  });
});

describe('convidados administrativos', () => {
  const convidado = { id: 17639, name: 'Diogo Mour', title: 'Software Development Manager', description: '<p>Biografia do convidado</p><p>Segundo parágrafo<br>Nova linha</p><script>alert(1)</script>', photo: 'https://storage.googleapis.com/convidado.jpg', url: 'https://www.linkedin.com/in/diogomoura/' };
  it('projeta um convidado com segurança e preserva parágrafos sem campos internos', () => {
    const view = normalizeDetalheAdministrativo({ id: raw.id, event_attractions: [{ ...convidado, ...{ internal_token: 'nao-expor' } }] }, normalizeDetalhe(raw)!, [])!;
    expect(view.convidados).toEqual([{ nome: convidado.name, cargo: convidado.title, biografia: 'Biografia do convidado\n\nSegundo parágrafo\nNova linha', foto: convidado.photo, url: convidado.url }]);
    expect(JSON.stringify(view)).not.toContain('nao-expor');
  });
  it('preserva a ordem, ignora nomes vazios e aceita opcionais ausentes', () => {
    expect(normalizarConvidados([convidado, { name: ' ' }, { name: 'Convidada de teste', photo: 'javascript:alert(1)', url: 'data:text/html,teste' }])).toEqual([
      expect.objectContaining({ nome: 'Diogo Mour' }), { nome: 'Convidada de teste', cargo: '', biografia: '', foto: null, url: null },
    ]);
  });
  it.each([null, undefined, [], [{ name: '' }]])('sem convidados válidos resulta em lista vazia: %j', (valor) => {
    expect(normalizarConvidados(valor)).toEqual([]);
    expect(normalizeDetalhe(raw)?.convidados).toEqual([]);
  });
});

describe('projeção administrativa pública', () => {
  const cadastro = [{ igrejaId: 30146, nome: 'ADAI Campestre' }];
  it.each([[], null, undefined])('evento público com is_public=false e opcionais %j permanece válido', (opcionais) => {
    const view = normalizeDetalheAdministrativo({ id: raw.id, is_enabled: true, is_public: false, event_schedule: opcionais, event_attractions: opcionais }, normalizeDetalhe(raw)!, [])!;
    expect(view).toMatchObject({ id: raw.id, convidados: [], programacao: [] });
    expect(metadataDoEvento(view)).toMatchObject({ title: { absolute: `${raw.name} | ADAI` } });
  });
  it('HACKATHON: normaliza unidades e programação sem depender de show_on_site', () => {
    expect(normalizarUnidadesAdministrativas(administrativo, cadastro)).toEqual(cadastro);
    expect(normalizarProgramacao(administrativo.event_schedule)[0]).toMatchObject({ data: '2026-10-17', atividades: [{ inicio: '15:50', fim: '16:15', titulo: administrativo.event_schedule[0].title }] });
    expect(normalizeDetalheAdministrativo({ ...administrativo, id: raw.id }, normalizeDetalhe(raw)!, cadastro)).toMatchObject({ unidade: 'ADAI Campestre' });
  });
  it('usa related_obj.id, preserva várias igrejas e ignora IDs das unidades administrativas', () => {
    const units = [...administrativo.units, { id: 88, name: 'Santos', related_obj: { id: 31876, model: 'inradartertiarygroup', name: 'ADAI Santos' } }, administrativo.units[0]];
    expect(normalizarUnidadesAdministrativas({ units }, cadastro)).toEqual([...cadastro, { igrejaId: 31876, nome: 'ADAI Santos' }]);
    expect(normalizarUnidadesAdministrativas({ units: [{ id: 30146, name: 'Região', related_obj: { id: 1, model: 'regional', name: 'Região' } }] }, cadastro)).toEqual([]);
    expect(normalizarUnidadesAdministrativas({ tertiarygroup: administrativo.tertiarygroup }, cadastro)).toEqual(cadastro);
    expect(normalizarUnidadesAdministrativas({}, cadastro)).toEqual([]);
  });
  it('ordena por dia e horário local, agrupa dias e omite atividades inválidas', () => {
    const original = administrativo.event_schedule[0];
    const dias = normalizarProgramacao([{ ...original, id: 2, event_date: '2026-10-18T00:00:00', start: '09:00:00', end: null, description: '<b>Texto</b>', venue: 'Auditório' }, original, { ...original, id: 3, start: '08:00:00' }, { ...original, event_date: '2026-02-30', start: '99:00:00' }]);
    expect(dias.map((d) => d.data)).toEqual(['2026-10-17', '2026-10-18']);
    expect(dias[0].atividades.map((a) => a.inicio)).toEqual(['08:00', '15:50']);
    expect(dias[1].atividades[0]).toMatchObject({ inicio: '09:00', fim: null, descricao: 'Texto', local: 'Auditório' });
    expect(normalizarProgramacao(null)).toEqual([]);
  });
  it('seleciona somente campos usados, sem usuários ou dados administrativos internos', () => {
    const view = normalizeDetalheAdministrativo({ ...administrativo, id: raw.id, show_on_site: true, is_enabled: true, description: '<p>Descrição completa</p>', ...{ owner: { email: 'privado-de-teste@example.com' }, internal_token: 'segredo-de-teste' } }, normalizeDetalhe(raw)!, cadastro)!;
    expect(view).toMatchObject({ unidade: 'ADAI Campestre', igrejaId: 30146, unidades: cadastro, descricaoCompleta: 'Descrição completa' });
    expect(JSON.stringify(view)).not.toMatch(/owner|internal_token|privado-de-teste|segredo-de-teste|published_for|related_obj/);
    expect(view.programacao).toHaveLength(1);
    expect(normalizeDetalheAdministrativo({ id: raw.id }, normalizeDetalhe(raw)!, [])).toMatchObject({ unidade: null, unidades: [], programacao: [] });
    expect(normalizeDetalheAdministrativo({ id: raw.id, is_enabled: false }, normalizeDetalhe(raw)!, [])).toBeNull();
  });
  it.each(['is_enabled', 'enabled', 'is_active', 'active'] as const)('restrição administrativa %s prevalece sobre publicação pública anterior', (campo) => {
    expect(normalizeDetalheAdministrativo({ id: raw.id, [campo]: false }, normalizeDetalhe(raw)!, [])).toBeNull();
    expect(normalizeDetalheAdministrativo({ id: raw.id, [campo]: null }, normalizeDetalhe(raw)!, [])).toBeNull();
  });
  it('normaliza cidade, estado e país como objetos e número do endereço numérico', () => {
    const view = normalizeDetalheAdministrativo({ id: raw.id, location: { address: 'Rua Real', address_number: 123, city: { name: 'Santo André' }, state: { name: 'São Paulo' }, country: { name: 'Brasil' } } }, normalizeDetalhe({ ...raw, location: null })!, [])!;
    expect(view.local).toMatchObject({ address_number: '123', city: 'Santo André', state: 'São Paulo', country: 'Brasil' });
    expect(view.localizacao?.linhas).toContain('Santo André - São Paulo');
    expect(schemaDoEvento(view)).toMatchObject({ location: { address: { addressLocality: 'Santo André' } } });
  });
  it('endereço administrativo preenche dados físicos ausentes e unidades não viram localização', () => {
    const view = normalizeDetalheAdministrativo({ id: raw.id, tertiarygroup: administrativo.tertiarygroup, location: { address: 'Rua Real', address_number: '123', city: 'Santo André', latitude: 0, longitude: 0 } }, normalizeDetalhe({ ...raw, location: null })!, [])!;
    expect(view.localizacao?.linhas).toEqual(['Rua Real, 123', 'Santo André']);
    expect(new URL(view.localizacao!.urlMapa).searchParams.get('query')).toBe('0,0');
    expect(view.localizacao?.linhas).not.toContain('ADAI CAMPESTRE');
  });
});

it('URL amigável mantém o ID mesmo após mudar o título', () => {
  expect(urlDoEvento({ id: 12345, nome: 'Conexão & Fé!' })).toBe('/agenda/conexao-fe-12345');
  expect(idDoSlug('titulo-antigo-12345')).toBe(12345);
  for (const slug of ['evento', 'evento-0', 'evento--1x', 'evento-9007199254740992']) expect(idDoSlug(slug)).toBeNull();
});

it('preserva descrição completa, parágrafos e entidades sem renderizar HTML', () => {
  expect(textoDaDescricao('<p>Um &amp; dois</p><p>Três<br>quatro &#233; &#xE9;</p><script>alert(1)</script>')).toBe('Um & dois\n\nTrês\nquatro é é');
  const longo = 'Conteúdo completo. '.repeat(40);
  expect(normalizeDetalhe({ ...raw, description: longo })?.descricaoCompleta).toBe(longo.trim());
  expect(textoDaDescricao(null)).toBe('');
});

it('opcionais ausentes e URL perigosa não criam conteúdo ou inscrição', () => {
  const evento = normalizeDetalhe({ ...raw, image: null, image_webp: null, description: null, end_datetime: null, has_external_subscription: true, external_subscription_url: 'javascript:alert(1)' })!;
  expect(evento).toMatchObject({ imagem: null, descricaoCompleta: '', fim: null, unidade: null, localizacao: null });
  expect(schemaDoEvento(evento)).toBeNull();
  expect(normalizeDetalhe({ ...raw, show_on_site: false })).not.toBeNull();
  expect(normalizeDetalhe({ ...raw, show_on_site: undefined })).not.toBeNull();
});

it('preserva a unidade e não calcula investimento ou inscrição a partir de flags', () => {
  const evento = normalizeDetalhe({ ...raw, paid_event: false, responsible_church: { id: 30146, name: 'Campestre' }, has_external_subscription: true, external_subscription_url: 'https://example.com/inscricao' })!;
  expect(evento).toMatchObject({ unidade: 'Campestre', igrejaId: 30146 });
  expect(evento).not.toHaveProperty('investimento');
  expect(evento).not.toHaveProperty('inscricao');
});

it('associação normalizada resolve o cadastro da unidade mesmo com responsible_church nulo', () => {
  expect(normalizeDetalhe({ ...raw, responsible_church: null }, { igrejaId: 30146, nome: 'ADAI Campestre' })).toMatchObject({ igrejaId: 30146, unidade: 'ADAI Campestre' });
  expect(normalizeDetalhe({ ...raw, responsible_church: null }, null)).toMatchObject({ igrejaId: null, unidade: null });
  expect(normalizeDetalhe({ ...raw, id: 1646183, name: 'HACKATHON ADAI HUB', show_on_site: false, responsible_church: null }, { igrejaId: 30146, nome: 'ADAI Campestre' })).toMatchObject({ igrejaId: 30146, unidade: 'ADAI Campestre' });
});

it.each([true, false, undefined])('CTA usa somente event_url, independentemente das flags (%s)', (flag) => {
  const evento = { ...raw, paid_event: flag, has_registrations: flag, has_external_subscription: flag, external_subscription_url: 'https://inscricao.example/1' };
  expect(normalizeDetalhe({ ...evento, event_url: 'https://zoom.us/j/1' })?.cta).toEqual({ url: 'https://zoom.us/j/1', texto: 'Acessar evento' });
  expect(normalizeDetalhe({ ...evento, event_url: null })?.cta).toBeNull();
  expect(normalizeDetalhe({ ...evento, event_url: 'javascript:alert(1)' })?.cta).toBeNull();
  expect(normalizeDetalhe(evento)).not.toHaveProperty('investimento');
});

it('local físico usa complemento, endereço, bairro e cidade sem inferir o campus', () => {
  const evento = normalizeDetalhe({ ...raw, responsible_church: { id: 1, name: 'Campus diferente' }, location: { address_complement: 'Centro de Convenções', address: 'Rua Real', address_number: '123', neighborhood: 'Centro', city: 'Santo André', state: 'SP' } })!;
  expect(evento.localizacao?.linhas).toEqual(['Centro de Convenções', 'Rua Real, 123', 'Centro', 'Santo André - SP']);
  const mapa = new URL(evento.localizacao!.urlMapa);
  expect(mapa.searchParams.get('query')).toBe('Centro de Convenções, Rua Real, 123, Centro, Santo André - SP');
  expect(schemaDoEvento(evento)?.location).not.toHaveProperty('name', 'Campus diferente');
});

it('Maps prefere coordenadas válidas, aceita zero e usa endereço quando inválidas', () => {
  const location = { address: 'Rua Real', city: 'Santo André', latitude: -23.66, longitude: -46.53 };
  const mapa = (local: typeof location) => new URL(normalizeDetalhe({ ...raw, location: local })!.localizacao!.urlMapa).searchParams.get('query');
  expect(mapa(location)).toBe('-23.66,-46.53');
  expect(mapa({ ...location, latitude: 0, longitude: 0 })).toBe('0,0');
  expect(mapa({ ...location, latitude: 91 })).toBe('Rua Real, Santo André');
  expect(mapa({ ...location, longitude: NaN })).toBe('Rua Real, Santo André');
});

it('localização nula ou vazia fica oculta; dados parciais e coordenadas isoladas são aceitos', () => {
  for (const location of [null, {}, { latitude: null, longitude: null }]) expect(normalizeDetalhe({ ...raw, location })?.localizacao).toBeNull();
  expect(normalizeDetalhe({ ...raw, location: { city: 'Santos' } })?.localizacao?.linhas).toEqual(['Santos']);
  expect(normalizeDetalhe({ ...raw, location: { latitude: 0, longitude: 0 } })?.localizacao?.linhas).toEqual([]);
});

it('links da descrição preservam texto e pontuação; somente HTTP(S) válido recebe href', () => {
  const texto = 'Veja (https://example.com/a).\nhttps://example.com/path_(ok)! https:// javascript:alert(1)';
  const partes = partesDaDescricao(texto);
  expect(partes.map((p) => p.texto).join('')).toBe(texto);
  expect(partes.filter((p) => p.url).map((p) => p.url)).toEqual(['https://example.com/a', 'https://example.com/path_(ok)']);
});

it.each([
  ['https://us06web.zoom.us/j/123', 'Acessar evento'],
  ['https://meet.google.com/abc-defg-hij', 'Acessar evento'],
  ['https://ingressos.example/evento/123', 'Acessar evento'],
  ['http://formularios.example/1', 'Acessar evento'],
  ['https://adaicollege.com.br/', 'Acessar evento'],
  ['javascript:alert(1)', null], ['https://', null], ['mailto:evento@example.com', null],
])('CTA sem inscrição para %s', (event_url, texto) => {
  const cta = normalizeDetalhe({ ...raw, has_registrations: false, external_subscription_url: null, event_url })?.cta;
  expect(cta?.texto ?? null).toBe(texto);
});

it('metadata e JSON-LD só usam informações reais', () => {
  const evento = normalizeDetalhe({ ...raw, description: '<p>Descrição real.</p>', location: { address: 'Rua Real', city: 'Santo André', country: 'BR' } })!;
  expect(metadataDoEvento(evento)).toMatchObject({ title: { absolute: `${raw.name} | ADAI` }, description: 'Descrição real.', alternates: { canonical: expect.stringContaining(urlDoEvento(evento)) } });
  expect(schemaDoEvento(evento)).toMatchObject({ '@type': 'Event', location: { address: { streetAddress: 'Rua Real' } } });
  expect(schemaDoEvento(evento)).not.toHaveProperty('offers');
});
