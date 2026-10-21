import fs from 'node:fs';
import path from 'node:path';

const paginas = JSON.parse(fs.readFileSync(path.join(process.cwd(), '../strapi/seed/institucionais.json'), 'utf8')) as Array<{slug: string; apresentacao: string; seo: {metaTitle: string; metaDescription: string}; sections: Array<{__component: string; titulo?: string; ancora?: string; conteudo?: string; cards?: Array<{url: string}>}>}>;

describe('páginas institucionais aprovadas', () => {
  it('visão apresenta dez declarações, missão e dez valores de alinhamento', () => {
    const visao = paginas.find(p => p.slug === 'sobre-nos-a-igreja-que-vemos');
    expect(visao).toBeDefined();
    expect(visao?.apresentacao).toBe('institucional-grade');
    expect(visao?.sections.filter(s => /^\d+\. /.test(s.titulo ?? ''))).toHaveLength(20);
    expect(visao?.sections.find(s => s.__component === 'sections.texto-botoes')?.titulo).toBe('Amar a Deus, servir as pessoas e influenciar o mundo.');
  });
  it('índice oferece nove destinos válidos e cada crença permite voltar aos temas', () => {
    const secoes = paginas[1].sections;
    const intro = secoes.find(s => s.ancora === 'temas-da-fe');
    expect(intro).toBeDefined();
    const destinos = [...(intro?.conteudo ?? '').matchAll(/\]\(#([a-z0-9-]+)\)/g)].map(m => m[1]);
    expect(destinos).toHaveLength(9);
    expect(new Set(destinos).size).toBe(9);
    for (const destino of destinos) {
      const tema = secoes.filter(s => s.ancora === destino);
      expect(tema).toHaveLength(1);
      expect(tema[0].conteudo).toContain('[Voltar aos temas](#temas-da-fe)');
    }
  });
  it('preserva as três rotas, conteúdo no CMS, metadados e navegação relacionada', () => {
    expect(paginas.map(p => p.slug)).toEqual(['sobre-nos-nossa-historia', 'sobre-nos-no-que-acreditamos', 'jesus', 'sobre-nos-a-igreja-que-vemos']);
    for (const p of paginas) {
      expect(['institucional', 'institucional-grade']).toContain(p.apresentacao);
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
