/**
 * Característica: toda foto que `fotoDoTeste` pode devolver existe em `public/` e é leve
 * (até 120 KB). Se falhar por foto ausente, rode `node scripts/converter-fotos-testes.mjs`;
 * se falhar por peso, reconverta com qualidade menor.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { fotoDoTeste } from '@/lib/eba/fotos-testes';
import type { SlugTeste } from '@/lib/eba-api/testes';

const SLUGS: SlugTeste[] = [
  'dons-servico',
  'dons-ministerio',
  'talentos-naturais',
  'estilo-pessoal',
  'temperamento-pessoal',
];
const LIMITE_BYTES = 120 * 1024;

const caminhos = new Set<string>();
for (const slug of SLUGS) {
  caminhos.add(fotoDoTeste(slug, 'capa'));
  caminhos.add(fotoDoTeste(slug, 'resultado'));
  caminhos.add(fotoDoTeste(slug, 'identificacao'));
  for (let pergunta = 1; pergunta <= 60; pergunta++) caminhos.add(fotoDoTeste(slug, { pergunta }));
}

describe('fotos dos testes', () => {
  it('cobre todas as fotos esperadas', () => {
    // 5 capas + 5 resultados + 1 identificação + 55 + 25 + 14 + 20 por pergunta
    expect(caminhos.size).toBe(5 + 5 + 1 + 55 + 25 + 14 + 20);
  });

  it.each([...caminhos])('%s existe em public/ e pesa até 120 KB', (caminho) => {
    const arquivo = path.join(process.cwd(), 'public', caminho);
    expect(existsSync(arquivo)).toBe(true);
    expect(statSync(arquivo).size).toBeLessThanOrEqual(LIMITE_BYTES);
  });
});
