import { jsonLdSeguro } from './json-ld';

/** Barra invertida + "u003c": o escape JSON de "<". */
const ESCAPE_MENOR = `${String.fromCharCode(92)}u003c`;

describe('jsonLdSeguro', () => {
  it('serializa e troca "<" para não fechar o <script> no HTML', () => {
    const json = jsonLdSeguro({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(json.split(ESCAPE_MENOR)).toHaveLength(4);
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
