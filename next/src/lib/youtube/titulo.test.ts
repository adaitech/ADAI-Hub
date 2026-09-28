import { isAdaiLiveService, parseSermonTitle } from './titulo';

describe('parseSermonTitle', () => {
  it.each([
    ['Não compre essa briga | Batalhas morais | Pr. Rodrigo Soeiro', null, ['Não compre essa briga', 'Batalhas morais', 'Pr. Rodrigo Soeiro']],
    ['Inimigos Adoráveis - Palavra Torpe | Pra. Tati Soeiro', null, ['Inimigos Adoráveis', 'Palavra Torpe', 'Pra. Tati Soeiro']],
    ['Você leu isso errado - A letra mata, o Espírito vivifica | Pr. Kalebe OIiveira', null, ['Você leu isso errado', 'A letra mata, o Espírito vivifica', 'Pr. Kalebe OIiveira']],
    ['Ele Prometeu Provisão | Pr. Eduardo Isidio', 'Ele Prometeu', ['Ele Prometeu', 'Provisão', 'Pr. Eduardo Isidio']],
    ['ELE PROMETEU paz | Pr. Rodrigo Soeiro', 'Ele Prometeu', ['ELE PROMETEU', 'paz', 'Pr. Rodrigo Soeiro']],
    ['Boa Terra | Pra. Carla Hobo', null, ['Boa Terra', null, 'Pra. Carla Hobo']],
    ['Conferência Flores 2026 | Sessão 04', null, ['Conferência Flores 2026', 'Sessão 04', null]],
    ['  Não compre   essa briga  |Batalhas morais|   Pr. Rodrigo Soeiro ', null, ['Não compre essa briga', 'Batalhas morais', 'Pr. Rodrigo Soeiro']],
  ])('%s', (titulo, dica, [seriesTitle, topic, speaker]) => {
    expect(parseSermonTitle(titulo, dica)).toEqual({ seriesTitle, topic, speaker });
  });

  it('cenário 7: título fora do padrão ou vazio não quebra', () => {
    expect(parseSermonTitle('Mensagem especial')).toEqual({ seriesTitle: 'Mensagem especial', topic: null, speaker: null });
    expect(parseSermonTitle('')).toEqual({ seriesTitle: null, topic: null, speaker: null });
    expect(parseSermonTitle(undefined)).toEqual({ seriesTitle: null, topic: null, speaker: null });
    expect(parseSermonTitle(' | | ')).toEqual({ seriesTitle: null, topic: null, speaker: null });
  });

  it('não confunde tema que começa com "Pr" com pregador', () => {
    expect(parseSermonTitle('Inimigos Adoráveis | Preguiça').speaker).toBeNull();
  });
});

describe('isAdaiLiveService', () => {
  it.each(['Culto ao vivo | ADAI On', 'CULTO AO VIVO | adai on', '  culto  ao   vivo|ADAI On', 'Culto ao vivo'])('"%s" é culto ao vivo', (t) => {
    expect(isAdaiLiveService(t)).toBe(true);
  });

  it.each(['Não compre essa briga | Batalhas morais | Pr. Rodrigo Soeiro', 'Culto Enraizados | ADAI On', '', null])('"%s" não é', (t) => {
    expect(isAdaiLiveService(t)).toBe(false);
  });
});
