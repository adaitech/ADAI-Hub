import { EmailIndisponivel, emailConfigurado, enviarEmail } from './mailersend';

const fetchMock = jest.fn();
const tokenOriginal = process.env.MAILERSEND_API_TOKEN;
const TOKEN = 'token-mailersend-de-teste';
const EMAIL = { para: 'ana.silva@exemplo.com', assunto: 'Seu código', html: '<p>042137</p>', texto: '042137' };

const resposta = (status: number) => ({ ok: status >= 200 && status < 300, status, text: async () => '' }) as Response;

let log: jest.SpyInstance[];

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.MAILERSEND_API_TOKEN = TOKEN;
  log = (['log', 'warn', 'error', 'info'] as const).map((n) => jest.spyOn(console, n).mockImplementation(() => undefined));
});
afterEach(() => log.forEach((s) => s.mockRestore()));
afterAll(() => {
  if (tokenOriginal === undefined) delete process.env.MAILERSEND_API_TOKEN;
  else process.env.MAILERSEND_API_TOKEN = tokenOriginal;
});

describe('enviarEmail (MailerSend)', () => {
  it('POST na API v1 com o token no header e o remetente da ADAI; 202 com corpo vazio é sucesso', async () => {
    fetchMock.mockResolvedValue(resposta(202));
    await expect(enviarEmail(EMAIL)).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.mailersend.com/v1/email');
    expect(init).toMatchObject({ method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
    expect(JSON.parse(init.body)).toEqual({
      from: { email: 'no-reply@adai.com.br', name: 'ADAI' },
      to: [{ email: 'ana.silva@exemplo.com' }],
      subject: 'Seu código',
      html: '<p>042137</p>',
      text: '042137',
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([401, 422, 429, 500])('%s → EmailIndisponivel', async (status) => {
    fetchMock.mockResolvedValue(resposta(status));
    await expect(enviarEmail(EMAIL)).rejects.toBeInstanceOf(EmailIndisponivel);
  });

  it('rede ou timeout → EmailIndisponivel, sem o destinatário em log nem na mensagem do erro', async () => {
    fetchMock.mockRejectedValue(new DOMException('tempo esgotado', 'TimeoutError'));
    const erro = await enviarEmail(EMAIL).catch((e: Error) => e);
    expect(erro).toBeInstanceOf(EmailIndisponivel);
    expect((erro as Error).message).not.toContain('ana.silva');
    expect(JSON.stringify(log.map((s) => s.mock.calls))).not.toContain('ana.silva');
  });

  it('sem MAILERSEND_API_TOKEN: emailConfigurado() é false e nada é enviado', async () => {
    delete process.env.MAILERSEND_API_TOKEN;
    expect(emailConfigurado()).toBe(false);
    await expect(enviarEmail(EMAIL)).rejects.toBeInstanceOf(EmailIndisponivel);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
