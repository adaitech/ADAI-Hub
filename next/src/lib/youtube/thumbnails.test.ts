import { getBestYoutubeThumbnail } from './thumbnails';

describe('getBestYoutubeThumbnail', () => {
  const t = (nome: string) => ({ url: `https://i.ytimg.com/vi/x/${nome}.jpg`, width: 1, height: 1 });

  it('prefere maxres', () => {
    expect(getBestYoutubeThumbnail({ default: t('default'), high: t('high'), maxres: t('maxres') })?.url).toContain('maxres');
  });

  it('cenário 9: sem maxres usa o próximo disponível (standard → high → medium → default)', () => {
    expect(getBestYoutubeThumbnail({ default: t('default'), high: t('high'), standard: t('standard') })?.url).toContain('standard');
    expect(getBestYoutubeThumbnail({ default: t('default'), medium: t('medium') })?.url).toContain('medium');
    expect(getBestYoutubeThumbnail({ default: t('default') })?.url).toContain('default');
  });

  it('sem thumbnail → null', () => {
    expect(getBestYoutubeThumbnail(undefined)).toBeNull();
    expect(getBestYoutubeThumbnail({ maxres: { url: '' } })).toBeNull();
  });
});
