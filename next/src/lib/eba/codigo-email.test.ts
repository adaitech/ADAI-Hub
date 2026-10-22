import { emailDoCodigo } from './codigo-email';

describe('emailDoCodigo', () => {
  const email = emailDoCodigo('042137');

  it('assunto com o código', () => {
    expect(email.assunto).toBe('Seu código para os testes da EBA: 042137');
  });

  it.each(['html', 'texto'] as const)('%s traz o código, a validade e o aviso para quem não pediu', (parte) => {
    expect(email[parte]).toContain('042137');
    expect(email[parte]).toContain('10 minutos');
    expect(email[parte]).toContain('Se não foi você, ignore este e-mail');
  });

  it('sem links nem imagens externas (menos chance de cair no spam e nada para clicar)', () => {
    expect(email.html).not.toMatch(/https?:\/\//);
    expect(email.texto).not.toMatch(/https?:\/\//);
    expect(email.html).not.toMatch(/<img/i);
  });

  it('só aceita 6 dígitos (nada vira HTML)', () => {
    expect(() => emailDoCodigo('<b>')).toThrow();
    expect(() => emailDoCodigo('12345')).toThrow();
  });

  describe('para o link do resultado', () => {
    const resultado = emailDoCodigo('042137', 'resultado');

    it('assunto e texto falam do resultado, não de começar o teste', () => {
      expect(resultado.assunto).toBe('Seu código para ver o resultado dos testes da EBA: 042137');
      expect(resultado.texto).toContain('receber o link do seu resultado');
      expect(resultado.texto).not.toContain('começar os testes');
      expect(resultado.html).toContain('042137');
      expect(resultado.html).toContain('10 minutos');
    });

    it('continua sem links nem imagens', () => {
      expect(resultado.html).not.toMatch(/https?:\/\/|<img/i);
      expect(resultado.texto).not.toMatch(/https?:\/\//);
    });
  });
});
