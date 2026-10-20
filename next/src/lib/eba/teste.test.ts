import fixture from './__fixtures__/testes.json';
import { linkDoTeste, normalizeTeste, ordenarTestes } from './teste';
import type { StrapiTeste, TesteView } from './types';

const [temperamento, dons, talentos] = fixture.data as StrapiTeste[];

describe('normalizeTeste', () => {
  it('teste completo → view com itens por linha (sem linhas vazias) e partes preenchidas', () => {
    const view = normalizeTeste(temperamento)!;
    expect(view).toMatchObject({
      slug: 'temperamento-pessoal',
      nome: 'Temperamento pessoal',
      aula: 'Aula 11',
      itensTitulo: 'Os 4 temperamentos',
      itens: ['Sanguíneo', 'Colérico', 'Melancólico', 'Fleumático'],
      perguntas: '4 listas de características',
      resposta: 'marcar as que descrevem você',
      link: 'https://eba.adai.com.br/teste/temperamento-pessoal',
      ordem: 50,
    });
    expect(view.oQueE).toMatch(/^O temperamento/);
  });

  it('campos opcionais vazios viram null (a parte não aparece) e a ordem padrão é 100', () => {
    expect(normalizeTeste(talentos)).toMatchObject({
      aula: null,
      oQueE: null,
      itensTitulo: null,
      itens: [],
      perguntas: null,
      comoResponder: null,
      comoLerResultado: null,
      link: null,
      ordem: 100,
    });
  });

  it('sem nome, sem resumo ou com endereço inválido → null (o teste não aparece)', () => {
    expect(normalizeTeste({ ...dons, nome: '  ' })).toBeNull();
    expect(normalizeTeste({ ...dons, resumo: null })).toBeNull();
    expect(normalizeTeste({ ...dons, slug: 'Dons Serviço' })).toBeNull();
  });
});

describe('linkDoTeste', () => {
  it.each([
    ['https://eba.adai.com.br/teste/dons-servico', 'https://eba.adai.com.br/teste/dons-servico'],
    ['  /eba/testes/dons  ', '/eba/testes/dons'],
    ['http://eba.adai.com.br/teste/x', null],
    ['//outro-site.com', null],
    ['javascript:alert(1)', null],
    ['mailto:eba@adai.com.br', null],
    ['', null],
    [null, null],
  ])('%p → %p', (entrada, esperado) => {
    expect(linkDoTeste(entrada)).toBe(esperado);
  });
});

describe('ordenarTestes', () => {
  it('ordem do Strapi, depois nome', () => {
    const lista = (fixture.data as StrapiTeste[]).map((t) => normalizeTeste(t) as TesteView);
    const empate = { ...lista[1], nome: 'Assistência', slug: 'assistencia' };
    expect(ordenarTestes([...lista, empate]).map((t) => t.slug)).toEqual(['assistencia', 'dons-servico', 'temperamento-pessoal', 'talentos-naturais']);
  });
});
