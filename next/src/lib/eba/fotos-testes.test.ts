import { fotoDoTeste } from './fotos-testes';

describe('fotoDoTeste', () => {
  it('devolve capa, resultado e identificação', () => {
    expect(fotoDoTeste('dons-servico', 'capa')).toBe('/eba/testes/dons-servico/capa.webp');
    expect(fotoDoTeste('estilo-pessoal', 'resultado')).toBe('/eba/testes/estilo-pessoal/resultado.webp');
    expect(fotoDoTeste('temperamento-pessoal', 'identificacao')).toBe('/eba/testes/identificacao.webp');
    expect(fotoDoTeste('talentos-naturais', 'identificacao')).toBe('/eba/testes/identificacao.webp');
  });

  it('devolve a foto da pergunta dentro do intervalo de cada teste', () => {
    expect(fotoDoTeste('dons-servico', { pergunta: 12 })).toBe('/eba/testes/dons-servico/12.webp');
    expect(fotoDoTeste('dons-servico', { pergunta: 55 })).toBe('/eba/testes/dons-servico/55.webp');
    expect(fotoDoTeste('dons-ministerio', { pergunta: 25 })).toBe('/eba/testes/dons-ministerio/25.webp');
    expect(fotoDoTeste('estilo-pessoal', { pergunta: 14 })).toBe('/eba/testes/estilo-pessoal/14.webp');
    expect(fotoDoTeste('temperamento-pessoal', { pergunta: 20 })).toBe('/eba/testes/temperamento-pessoal/20.webp');
  });

  it('cai na capa quando a pergunta não tem foto', () => {
    expect(fotoDoTeste('dons-servico', { pergunta: 56 })).toBe('/eba/testes/dons-servico/capa.webp');
    expect(fotoDoTeste('dons-servico', { pergunta: 0 })).toBe('/eba/testes/dons-servico/capa.webp');
    expect(fotoDoTeste('dons-servico', { pergunta: 1.5 })).toBe('/eba/testes/dons-servico/capa.webp');
    expect(fotoDoTeste('dons-servico', { pergunta: Number.NaN })).toBe('/eba/testes/dons-servico/capa.webp');
    expect(fotoDoTeste('talentos-naturais', { pergunta: 1 })).toBe('/eba/testes/talentos-naturais/capa.webp');
  });
});
