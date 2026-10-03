import { getEditorGuide } from './editor-guide';

describe('getEditorGuide', () => {
  it('devolve o guia copiado do Strapi pelo nome técnico', () => {
    const guia = getEditorGuide('sections.hero');
    expect(guia?.uid).toBe('sections.hero');
    expect(guia?.campos.length).toBeGreaterThan(0);
  });

  it('nome desconhecido → null (a vitrine não quebra)', () => {
    expect(getEditorGuide('sections.nao-existe')).toBeNull();
  });
});
