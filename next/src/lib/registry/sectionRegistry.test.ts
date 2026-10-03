import { getSection, sectionRegistry, sectionsPopulate } from './sectionRegistry';

describe('sectionRegistry', () => {
  it('chaves seguem o nome técnico do Strapi (sections.<nome-em-kebab>)', () => {
    for (const chave of Object.keys(sectionRegistry)) expect(chave).toMatch(/^sections\.[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('getSection: seção conhecida → componente + populate; desconhecida → null', () => {
    expect(getSection('sections.hero')).toEqual({ component: expect.any(Function), populate: expect.anything() });
    expect(getSection('sections.nao-existe')).toBeNull();
    expect(getSection('__proto__')).toBeNull();
    expect(getSection('constructor')).toBeNull();
  });

  it('sectionsPopulate: um fragmento `on` por seção (o Strapi 5 omite seções fora do `on`)', () => {
    const on = sectionsPopulate();
    expect(Object.keys(on).sort()).toEqual(Object.keys(sectionRegistry).sort());
    for (const fragmento of Object.values(on)) {
      expect(fragmento === true || typeof fragmento.populate === 'object').toBe(true);
    }
  });
});
