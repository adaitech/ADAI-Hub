import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import type { StrapiSection } from '@/lib/strapi/types';

const conteudo = JSON.parse(readFileSync(join(process.cwd(), '../strapi/seed/contribua.json'), 'utf8'));

describe('Contribua aprovado', () => {
  it('renderiza o conteúdo do CMS com um h1, âncoras válidas, Pix e contato', () => {
    const sections = conteudo.sections.map((section: StrapiSection, i: number) => ({ ...section, id: i + 1 }));
    const { container } = render(<main><SectionRenderer sections={sections} apresentacao={conteudo.apresentacao} /></main>);
    expect(container.querySelector('[data-page-layout="editorial"]')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Generosidade');
    expect(screen.getByRole('heading', { name: 'Dízimo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Oferta' })).toBeInTheDocument();
    expect(screen.getByText('nossacasa@adai.com.br', { exact: true })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Falar com a equipe/ })).toHaveLength(2);
    for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(container.querySelector(link.getAttribute('href')!)).not.toBeNull();
    }
    expect(container.querySelectorAll('details')).toHaveLength(5);
    expect(container.querySelectorAll('ul[data-exibicao="grade"]')).toHaveLength(2);
  });

  it('respeita limites e componentes permitidos nos schemas reais do Strapi', () => {
    const validar = (uid: string, data: Record<string, unknown>) => {
      const schema = JSON.parse(readFileSync(join(process.cwd(), '../strapi/src/components', uid.replace('.', '/') + '.json'), 'utf8'));
      for (const [nome, valor] of Object.entries(data)) {
        if (nome === '__component') continue;
        const campo = schema.attributes[nome];
        expect(campo).toBeDefined();
        if (typeof valor === 'string' && campo.maxLength) expect(valor.length).toBeLessThanOrEqual(campo.maxLength);
        if (campo.enum && valor) expect(campo.enum).toContain(valor);
        if (campo.component && valor) {
          for (const item of Array.isArray(valor) ? valor : [valor]) validar(campo.component, item);
        }
      }
    };
    for (const section of conteudo.sections) validar(section.__component, section);
  });
});
