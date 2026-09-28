import mocks from './HeroSection.mock.json';
import { normalizeHero } from './normalize';
import type { HeroData } from './types';

const completo = mocks.completo as HeroData;

describe('normalizeHero', () => {
  it('quebra a frase principal e o texto de apoio por linha', () => {
    const view = normalizeHero(completo);
    expect(view?.linhas).toEqual(['Amar.', 'Servir.', 'Influenciar.']);
    expect(view?.paragrafos).toHaveLength(2);
    expect(view?.botoes.map((b) => b.estilo)).toEqual(['solido', 'contorno']);
  });

  it('não exibe o Hero sem frase principal', () => {
    expect(normalizeHero({ ...completo, titulo: '   \n ' })).toBeNull();
    expect(normalizeHero({ ...completo, titulo: null })).toBeNull();
  });

  it('limita a 3 linhas e 2 botões', () => {
    const view = normalizeHero({
      ...completo,
      titulo: 'Um\nDois\nTrês\nQuatro',
      botoes: [...(completo.botoes ?? []), { id: 99, texto: 'Extra', url: '/extra', estilo: 'solido' }],
    });
    expect(view?.linhas).toEqual(['Um', 'Dois', 'Três']);
    expect(view?.botoes).toHaveLength(2);
  });

  it('descarta botão sem texto, sem link ou com link inseguro', () => {
    const view = normalizeHero({
      ...completo,
      botoes: [
        { id: 1, texto: '', url: '/a' },
        { id: 2, texto: 'Sem link', url: '' },
        { id: 3, texto: 'Perigoso', url: 'javascript:alert(1)' },
        { id: 4, texto: 'Ok', url: '/ok', estilo: null },
      ],
    });
    expect(view?.botoes).toEqual([{ label: 'Ok', href: '/ok', novaAba: false, estilo: 'solido' }]);
  });

  it('aceita Hero sem foto e sem texto de apoio', () => {
    const view = normalizeHero({ ...completo, imagem: null, texto_apoio: null });
    expect(view?.imagem).toBeNull();
    expect(view?.paragrafos).toEqual([]);
  });

  it('usa alt vazio quando a foto não tem texto alternativo', () => {
    const view = normalizeHero({
      ...completo,
      imagem: { id: 1, url: '/uploads/x.jpg', alternativeText: null, width: 10, height: 10 },
    });
    expect(view?.imagem?.alt).toBe('');
    expect(view?.imagem?.url).toBe('http://localhost:1337/uploads/x.jpg');
  });
});
