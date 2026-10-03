import { CHAVE_CONSENTIMENTO, GTM_HOMOLOGACAO, GTM_PRODUCAO, VERSAO_CONSENTIMENTO, getAmbiente, getGtmId, getScriptGtm } from './gtm';

describe('gtm', () => {
  it('aceita só IDs válidos de container', () => {
    expect(getGtmId(' gtm-5945v9dq ')).toBe('GTM-5945V9DQ');
    expect(getGtmId('')).toBeNull();
    expect(getGtmId("GTM-1');alert(1)//")).toBeNull();
  });

  it('ambiente: só o container de produção é produção', () => {
    expect(getAmbiente(GTM_PRODUCAO)).toBe('producao');
    expect(getAmbiente(GTM_HOMOLOGACAO)).toBe('homologacao');
    expect(getAmbiente(null)).toBe('homologacao');
  });

  describe('nada vai ao Google antes do aceite (Política de Privacidade)', () => {
    const executar = () => new Function(getScriptGtm(GTM_HOMOLOGACAO))();
    const scriptsGtm = () => document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').length;

    beforeEach(() => {
      localStorage.clear();
      document.head.innerHTML = '<script></script>';
      window.dataLayer = [];
      delete (window as Window & { adaiGtmCarregado?: boolean }).adaiGtmCarregado;
    });

    it('sem escolha ou com recusa: GTM não carrega', () => {
      executar();
      expect(scriptsGtm()).toBe(0);
      localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ analytics: false, versao: VERSAO_CONSENTIMENTO }));
      executar();
      expect(scriptsGtm()).toBe(0);
    });

    it('aceite salvo (mesma versão do aviso): libera analytics e carrega o GTM uma vez', () => {
      localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ analytics: true, versao: VERSAO_CONSENTIMENTO }));
      executar();
      window.adaiCarregarGtm?.();
      expect(scriptsGtm()).toBe(1);
      const update = window.dataLayer!.map((e) => Array.from(e as unknown as ArrayLike<unknown>)).find((e) => e[1] === 'update');
      expect(update?.[2]).toEqual({ analytics_storage: 'granted' });
    });

    it('aceite de uma versão antiga do aviso não carrega', () => {
      localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ analytics: true, versao: VERSAO_CONSENTIMENTO - 1 }));
      executar();
      expect(scriptsGtm()).toBe(0);
    });
  });

  it('Consent Mode (negado por padrão) vem antes do GTM no mesmo script', () => {
    const script = getScriptGtm(GTM_PRODUCAO);
    expect(script.indexOf("gtag('consent','default'")).toBeGreaterThan(-1);
    expect(script.indexOf("gtag('consent','default'")).toBeLessThan(script.indexOf('gtm.js'));
    expect(script).toContain("ad_storage:'denied'");
    expect(script).toContain(GTM_PRODUCAO);
  });
});
