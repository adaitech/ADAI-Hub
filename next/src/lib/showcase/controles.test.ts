import { carrosselCardsShowcase } from '@/components/sections/CarrosselCardsSection/CarrosselCardsSection.showcase';
import type { CarrosselCardsData } from '@/components/sections/CarrosselCardsSection/types';
import { aplicarControles, controlesInfo, lerValores, queryDosControles, valoresPadrao } from './controles';

const entry = carrosselCardsShowcase;
const variante = (nome: string) => entry.variantes.find((v) => v.nome === nome)!.data as CarrosselCardsData;

describe('controles da vitrine', () => {
  it('valores padrão refletem o JSON da variação', () => {
    expect(valoresPadrao(entry, variante('completo'))).toMatchObject({
      cor: 'cinza',
      foto: false,
      posicao: 'acima',
      acao: 'link',
      link: false,
    });
    expect(valoresPadrao(entry, variante('com_imagem'))).toMatchObject({ cor: 'variadas', foto: true, acao: 'botao_link' });
  });

  it('lê só valores válidos da URL', () => {
    expect(lerValores(entry, { cor: 'azul', foto: '1', posicao: 'lado', acao: ['botao', 'link'] })).toEqual({
      cor: 'azul',
      foto: true,
      acao: 'botao',
    });
  });

  it('aplica cor, foto abaixo e ação sem mutar o JSON original', () => {
    const original = variante('completo');
    const copia = JSON.parse(JSON.stringify(original));
    const dados = aplicarControles(entry, original, { cor: 'verde', foto: true, posicao: 'abaixo', acao: 'botao' }) as CarrosselCardsData;

    expect(dados.posicao_imagem).toBe('abaixo');
    for (const card of dados.cards ?? []) {
      expect(card.cor).toBe('verde');
      expect(card.imagem).toBeTruthy();
      expect(card.botao).toBeTruthy();
      expect(card.link).toBeNull();
    }
    expect(original).toEqual(copia);
  });

  it('"variadas" pinta cada card com uma cor', () => {
    const dados = aplicarControles(entry, variante('completo'), { cor: 'variadas' }) as CarrosselCardsData;
    expect(new Set(dados.cards?.map((c) => c.cor)).size).toBeGreaterThan(1);
  });

  it('a query só leva o que mudou', () => {
    const padrao = valoresPadrao(entry, variante('completo'));
    expect(queryDosControles(padrao, padrao)).toBe('');
    expect(queryDosControles({ ...padrao, cor: 'azul', foto: true }, padrao)).toBe('cor=azul&foto=1');
  });

  it('metadados não levam funções (vão para o componente cliente)', () => {
    const info = controlesInfo(entry);
    expect(info.length).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(info))).toEqual(info);
  });
});
