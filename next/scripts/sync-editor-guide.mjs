// Copia o guia do editor (fonte única em strapi/src/editor-guide/*.json) para
// src/generated/editor-guide.json, lido pela vitrine /componentes e pelos testes.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '..', 'strapi', 'src', 'editor-guide');
const target = join(root, 'src', 'generated', 'editor-guide.json');

mkdirSync(dirname(target), { recursive: true });

if (!existsSync(source)) {
  if (!existsSync(target)) writeFileSync(target, '{}\n');
  console.warn(`[sync-editor-guide] ${source} não encontrado — mantendo cópia existente.`);
  process.exit(0);
}

const guides = {};
for (const file of readdirSync(source).filter((f) => f.endsWith('.json')).sort()) {
  const guide = JSON.parse(readFileSync(join(source, file), 'utf8'));
  guides[guide.uid] = guide;
}

writeFileSync(target, `${JSON.stringify(guides, null, 2)}\n`);
console.log(`[sync-editor-guide] ${Object.keys(guides).length} guias copiados.`);
