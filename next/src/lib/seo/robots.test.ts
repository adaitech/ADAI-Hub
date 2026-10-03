import { CAMINHOS_FORA_DO_GOOGLE, montarRobots } from './robots';

describe('montarRobots', () => {
  it('produção: libera o site, bloqueia só as áreas internas e aponta o sitemap', () => {
    expect(montarRobots({ indexavel: true, url: 'https://adai.com.br' })).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/componentes', '/exemplos'] },
      sitemap: 'https://adai.com.br/sitemap.xml',
    });
  });

  it('fora de produção: bloqueia tudo e não divulga sitemap', () => {
    expect(montarRobots({ indexavel: false, url: null })).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });

  it('áreas internas: API, vitrine e página de exemplos de desenvolvimento', () => {
    expect(CAMINHOS_FORA_DO_GOOGLE).toEqual(['/api/', '/componentes', '/exemplos']);
  });
});
