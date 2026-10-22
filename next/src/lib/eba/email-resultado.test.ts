import { emailDoLinkResultado } from './email-resultado';

const URL = 'https://adai.com.br/eba/resultado/v1.AbC_d-123';

describe('emailDoLinkResultado', () => {
  const email = emailDoLinkResultado(URL, 7);

  it('assunto fixo, sem nome nem resultado', () => {
    expect(email.assunto).toBe('Seu resultado nos testes da EBA');
  });

  it.each(['html', 'texto'] as const)('%s traz o link, a validade e o aviso de link particular', (parte) => {
    expect(email[parte]).toContain(URL);
    expect(email[parte]).toContain('7 dias');
    expect(email[parte]).toContain('não encaminhe');
    expect(email[parte]).toContain('Não pediu este e-mail? Pode ignorar');
  });

  it('1 dia no singular', () => {
    expect(emailDoLinkResultado(URL, 1).texto).toContain('1 dia');
    expect(emailDoLinkResultado(URL, 1).texto).not.toContain('1 dias');
  });

  it('sem imagens externas e sem nenhum resultado no corpo', () => {
    expect(email.html).not.toMatch(/<img/i);
    expect(email.texto).not.toMatch(/Ajuda|Colérico|Misericórdia/);
  });

  it('só aceita link https do próprio caminho de resultado (nada vira HTML)', () => {
    for (const ruim of ['javascript:alert(1)', 'https://x.com/"><script>', 'http://adai.com.br/eba/resultado/v1.a', 'https://adai.com.br/outra/rota', '']) {
      expect(() => emailDoLinkResultado(ruim, 7)).toThrow();
    }
  });

  it('dias fora de 1 a 30 → lança', () => {
    for (const ruim of [0, 31, 1.5, Number.NaN]) expect(() => emailDoLinkResultado(URL, ruim)).toThrow();
  });
});
