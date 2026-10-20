import fs from 'node:fs';
import path from 'node:path';

const paginas = JSON.parse(fs.readFileSync(path.join(process.cwd(), '../strapi/seed/institucionais.json'), 'utf8')) as Array<{slug: string; apresentacao: string; seo: {metaTitle: string; metaDescription: string}; sections: Array<{__component: string; titulo?: string; conteudo?: string; cards?: Array<{url: string}>}>}>;

describe('páginas institucionais aprovadas', () => {
  it('preserva as três rotas, conteúdo no CMS, metadados e navegação relacionada', () => {
    expect(paginas.map(p => p.slug)).toEqual(['sobre-nos-nossa-historia', 'sobre-nos-no-que-acreditamos', 'jesus']);
    for (const p of paginas) {
      expect(p.apresentacao).toBe('institucional');
      expect(p.seo.metaTitle).toContain('ADAI');
      expect(p.seo.metaDescription.length).toBeGreaterThan(40);
      expect(p.sections.find(s => s.__component === 'sections.texto-rico')?.titulo).toBeTruthy();
      expect(p.sections.find(s => s.__component === 'sections.carrossel-cards')?.cards).toHaveLength(3);
    }
  });
  it('fala na voz da igreja e preserva os fatos históricos e os nove temas do Figma', () => {
    const historia = paginas[0].sections.map(s => s.conteudo ?? '').join('\n');
    expect(historia).toContain('1º de maio de 2003');
    expect(historia).toContain('Paulo Silas');
    expect(historia).toContain('Mara Soeiro');
    expect(historia).toContain('Em 2010');
    expect(JSON.stringify(paginas)).not.toMatch(/O site da igreja menciona|A história publicada pela ADAI|O site da ADAI destaca/);
    expect(JSON.stringify(paginas)).not.toMatch(/\]\([^)]*\.html\)|Na Bíblia[^:]/);
    expect(JSON.stringify(paginas)).toContain('](/jesus)');
    expect(paginas[1].sections.filter(s => /^\d+\. /.test(s.titulo ?? ''))).toHaveLength(9);
  });
});
