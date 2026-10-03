import { configuracaoSeo } from './site';

describe('configuracaoSeo', () => {
  it('produção: SITE_INDEXAVEL=true + URL do site → indexável, com a origem sem barra final', () => {
    expect(configuracaoSeo({ SITE_INDEXAVEL: 'true', NEXT_PUBLIC_SITE_URL: 'https://adai.com.br/' })).toEqual({
      indexavel: true,
      url: 'https://adai.com.br',
    });
  });

  it.each([
    ['sem SITE_INDEXAVEL (homologação, dev)', { NEXT_PUBLIC_SITE_URL: 'https://homologacao.adai.com.br' }],
    ['SITE_INDEXAVEL diferente de "true"', { SITE_INDEXAVEL: '1', NEXT_PUBLIC_SITE_URL: 'https://adai.com.br' }],
    ['indexável sem URL do site', { SITE_INDEXAVEL: 'true' }],
    ['indexável com URL inválida', { SITE_INDEXAVEL: 'true', NEXT_PUBLIC_SITE_URL: 'adai.com.br' }],
  ])('%s → bloqueado (na dúvida, fora do Google)', (_caso, ambiente) => {
    expect(configuracaoSeo(ambiente).indexavel).toBe(false);
  });

  it('aceita espaços e maiúsculas no valor da variável', () => {
    expect(configuracaoSeo({ SITE_INDEXAVEL: ' TRUE ', NEXT_PUBLIC_SITE_URL: 'https://adai.com.br' }).indexavel).toBe(true);
  });

  it('lê do process.env por padrão', () => {
    const original = { ...process.env };
    Object.assign(process.env, { SITE_INDEXAVEL: 'true', NEXT_PUBLIC_SITE_URL: 'https://adai.com.br' });
    expect(configuracaoSeo().indexavel).toBe(true);
    process.env = original;
  });
});
