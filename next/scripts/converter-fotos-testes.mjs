/**
 * Converte as fotos dos testes do site antigo da EBA para WebP (lado maior <= 1200 px, qualidade 72,
 * sem metadados) em public/eba/testes. Idempotente: rodar de novo sobrescreve com o mesmo resultado.
 *
 * Uso (a partir de next/): node scripts/converter-fotos-testes.mjs [pasta-de-origem]
 * Origem padrão: C:/ADAI/eba-adai/public/assets/testes
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const ORIGEM = path.resolve(process.argv[2] ?? 'C:/ADAI/eba-adai/public/assets/testes');
const DESTINO = path.resolve('public/eba/testes');
const LADO_MAXIMO = 1200;
const QUALIDADE = 72;

/** pasta de origem -> slug do teste */
const PASTAS = {
  dons: 'dons-servico',
  'dons-ministerio': 'dons-ministerio',
  'estilo-pessoal': 'estilo-pessoal',
  'temperamento-pessoal': 'temperamento-pessoal',
};

const LIMITE_BYTES = 120 * 1024;
const trabalhos = new Map(); // destino -> origem

function adicionar(de, para) {
  const atual = trabalhos.get(para);
  // Origem duplicada (ex.: resultado.jpg e resultado.webp): prefere a .webp, de forma determinística.
  if (atual && path.extname(atual).toLowerCase() === '.webp') return;
  trabalhos.set(para, de);
}

function achar(pasta, base) {
  const arquivo = readdirSync(pasta).find((nome) => {
    const { name, ext } = path.parse(nome);
    return name.toLowerCase() === base.toLowerCase() && /^\.(jpe?g|png|webp)$/i.test(ext);
  });
  return arquivo ? path.join(pasta, arquivo) : null;
}

for (const [pasta, slug] of Object.entries(PASTAS)) {
  const dir = path.join(ORIGEM, pasta);
  for (const nome of readdirSync(dir)) {
    const { name } = path.parse(nome);
    const ehNumero = /^\d+$/.test(name);
    const especial = ['capa', 'resultado'].includes(name.toLowerCase());
    if (!ehNumero && !especial) continue;
    adicionar(path.join(dir, nome), path.join(DESTINO, slug, `${name.toLowerCase()}.webp`));
  }
}

const foto = achar(path.join(ORIGEM, 'teste-talentos-naturais'), 'foto');
if (!foto) throw new Error('teste-talentos-naturais/foto não encontrada');
adicionar(foto, path.join(DESTINO, 'talentos-naturais', 'capa.webp'));
adicionar(foto, path.join(DESTINO, 'talentos-naturais', 'resultado.webp'));

const login = achar(ORIGEM, 'login-student');
if (!login) throw new Error('login-student não encontrada');
adicionar(login, path.join(DESTINO, 'identificacao.webp'));

let total = 0;
let reduzidas = 0;
let maior = { bytes: 0, arquivo: '' };
for (const [para, de] of [...trabalhos].sort(([a], [b]) => a.localeCompare(b))) {
  mkdirSync(path.dirname(para), { recursive: true });
  // sharp remove metadados por padrão (não chamamos withMetadata); rotate() aplica a orientação EXIF.
  const base = sharp(de)
    .rotate()
    .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true });
  // Qualidade 72; só se passar de 120 KB (limite do teste de característica) baixa de 4 em 4.
  let qualidade = QUALIDADE;
  let buffer = await base.clone().webp({ quality: qualidade }).toBuffer();
  while (buffer.length > LIMITE_BYTES && qualidade > 40) {
    qualidade -= 4;
    buffer = await base.clone().webp({ quality: qualidade }).toBuffer();
  }
  if (qualidade !== QUALIDADE) reduzidas++;
  writeFileSync(para, buffer);
  total += buffer.length;
  if (buffer.length > maior.bytes) maior = { bytes: buffer.length, arquivo: path.relative(DESTINO, para) };
}

console.log(`${trabalhos.size} arquivos, ${(total / 1024 / 1024).toFixed(2)} MB em ${path.relative(process.cwd(), DESTINO)}`);
console.log(`maior: ${maior.arquivo} (${(maior.bytes / 1024).toFixed(1)} KB); ${reduzidas} com qualidade reduzida`);
