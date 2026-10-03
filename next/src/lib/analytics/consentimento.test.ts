import { lerConsentimento, salvarConsentimento, VERSAO_CONSENTIMENTO } from './consentimento';
import { CHAVE_CONSENTIMENTO } from './gtm';

describe('consentimento', () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it('sem escolha → null; depois de salvar → lê a escolha', () => {
    expect(lerConsentimento()).toBeNull();
    salvarConsentimento(true);
    expect(lerConsentimento()).toMatchObject({ analytics: true, versao: VERSAO_CONSENTIMENTO });
  });

  it('aceitar carrega o GTM; recusar não', () => {
    const carregar = jest.fn();
    window.adaiCarregarGtm = carregar;
    salvarConsentimento(false);
    expect(carregar).not.toHaveBeenCalled();
    salvarConsentimento(true);
    expect(carregar).toHaveBeenCalledTimes(1);
    delete window.adaiCarregarGtm;
  });

  it('avisa o GTM no formato do gtag (objeto arguments)', () => {
    salvarConsentimento(false);
    const comando = Array.from(window.dataLayer![0] as unknown as ArrayLike<unknown>);
    expect(comando).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
  });

  it('recusar apaga os cookies do Google Analytics (_ga e _ga_<id>)', () => {
    document.cookie = '_ga=GA1.1.1.1; path=/';
    document.cookie = '_ga_SCG09PWV8B=GS1.1; path=/';
    document.cookie = 'outro=1; path=/';
    salvarConsentimento(false);
    expect(document.cookie).not.toMatch(/_ga/);
    expect(document.cookie).toContain('outro=1');
  });

  it('versão antiga ou valor inválido pedem a escolha de novo', () => {
    localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ analytics: true, versao: 0 }));
    expect(lerConsentimento()).toBeNull();
    localStorage.setItem(CHAVE_CONSENTIMENTO, '{quebrado');
    expect(lerConsentimento()).toBeNull();
  });
});
