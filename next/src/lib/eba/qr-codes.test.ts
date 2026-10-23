/** @jest-environment node */
import { readFileSync } from 'fs';
import { join } from 'path';
import { TESTES } from '@/lib/eba-api/testes';
import { enderecoDoHub, ORIGEM_DO_SITE_ATUAL, QR_CODES } from './qr-codes';

const PUBLIC = join(__dirname, '../../../public');

describe('QR codes dos testes (imagens do site atual, `adaitech/eba-adai`)', () => {
  it('um QR para cada um dos 5 testes do CDV, na ordem da apostila', () => {
    expect(QR_CODES.map((q) => q.slug)).toEqual(TESTES.map((t) => t.slug));
  });

  it('o endereço que o QR impresso leva é o do site atual (`/teste/<slug>`), o mesmo dos QR decodificados', () => {
    expect(ORIGEM_DO_SITE_ATUAL).toBe('https://eba.adai.com.br');
    for (const qr of QR_CODES) expect(qr.enderecoDoQr).toBe(`https://eba.adai.com.br/teste/${qr.slug}`);
  });

  it.each(QR_CODES.map((q) => [q.slug, q.imagem]))('%s: a imagem existe em public e é um JPEG', (_slug, imagem) => {
    expect(imagem).toBe(`/eba/qr/${_slug}.jpeg`);
    const bytes = readFileSync(join(PUBLIC, imagem));
    expect(bytes.length).toBeGreaterThan(1_000);
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]);
  });

  it('enderecoDoHub: origem do site + /eba/testes/<slug>, sem barra dupla', () => {
    expect(enderecoDoHub('dons-servico', 'https://adai.com.br')).toBe('https://adai.com.br/eba/testes/dons-servico');
    expect(enderecoDoHub('dons-servico', 'https://adai.com.br/')).toBe('https://adai.com.br/eba/testes/dons-servico');
  });
});
