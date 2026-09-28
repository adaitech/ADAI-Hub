import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { getEditorGuide } from '@/lib/editor-guide';
import { sectionRegistry } from '@/lib/registry/sectionRegistry';
import { showcaseCatalog } from './catalog';
import { aplicarControles, valoresPadrao } from './controles';

const repoRoot = join(process.cwd(), '..');

describe('vitrine /componentes', () => {
  it('toda seção do registry tem entrada na vitrine', () => {
    const cmsKeys = showcaseCatalog.map((entry) => entry.cmsKey);
    for (const key of Object.keys(sectionRegistry)) {
      expect(cmsKeys).toContain(key);
    }
  });

  it('slugs são únicos', () => {
    const slugs = showcaseCatalog.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(showcaseCatalog.map((entry) => [entry.slug, entry] as const))('%s', (_slug, entry) => {
    it('tem descrição, "quando usar" e doc existente', () => {
      expect(entry.descricao.length).toBeGreaterThan(20);
      expect(entry.quandoUsar.length).toBeGreaterThan(10);
      expect(existsSync(join(repoRoot, entry.doc))).toBe(true);
    });

    it('componentes do CMS têm variantes completo e minimo', () => {
      if (!entry.cmsKey) return;
      const nomes = entry.variantes.map((v) => v.nome);
      expect(nomes).toEqual(expect.arrayContaining(['completo', 'minimo']));
    });

    it('todas as variantes renderizam sem erro', () => {
      for (const variante of entry.variantes) {
        const { unmount } = render(<>{entry.render(variante.data)}</>);
        unmount();
      }
    });

    it('cada opção de cada controle renderiza em todas as variantes', () => {
      for (const variante of entry.variantes) {
        const padrao = valoresPadrao(entry, variante.data);
        for (const controle of entry.controles ?? []) {
          const valores = controle.tipo === 'alternar' ? [true, false] : controle.opcoes.map((o) => o.valor);
          for (const valor of valores) {
            const dados = aplicarControles(entry, variante.data, { ...padrao, [controle.id]: valor });
            const { unmount } = render(<>{entry.render(dados)}</>);
            unmount();
          }
        }
      }
    });

    it('guia do editor existe e cobre todos os campos do JSON completo', () => {
      if (!entry.cmsKey) return;
      const guide = getEditorGuide(entry.cmsKey);
      expect(guide).not.toBeNull();

      const dados = entry.variantes.find((v) => v.nome === 'completo')?.data;
      const completo = (entry.cms ? entry.cms(dados) : dados) as Record<string, unknown>;
      const camposDoJson = Object.keys(completo).filter((k) => k !== '__component' && k !== 'id');
      const camposDoGuia = guide!.campos.map((c) => c.campo);
      expect(camposDoGuia.sort()).toEqual(camposDoJson.sort());

      for (const campo of guide!.campos) {
        expect(campo.label.trim()).not.toBe('');
        expect(campo.descricao.length).toBeLessThanOrEqual(140);
        if (campo.componente) expect(getEditorGuide(campo.componente)).not.toBeNull();
      }
    });
  });
});
