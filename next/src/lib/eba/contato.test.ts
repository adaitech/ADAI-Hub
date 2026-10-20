import { EMAIL_EBA } from './contato';

describe('EMAIL_EBA', () => {
  it('é um e-mail válido para o link mailto', () => {
    expect(EMAIL_EBA).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
