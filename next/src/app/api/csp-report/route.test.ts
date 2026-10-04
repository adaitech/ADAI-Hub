/**
 * @jest-environment node
 */
import { POST } from '@/app/api/csp-report/route';

const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
afterEach(() => aviso.mockClear());
afterAll(() => aviso.mockRestore());

const enviar = (corpo: string, tipo = 'application/csp-report') =>
  POST(new Request('http://localhost:3000/api/csp-report', { method: 'POST', headers: { 'content-type': tipo }, body: corpo }));

/** Objeto registrado na última chamada de console.warn. */
const registrado = () => JSON.parse(aviso.mock.calls.at(-1)![1] as string);

describe('POST /api/csp-report', () => {
  it('formato antigo (report-uri): registra diretiva e endereços, responde 204', async () => {
    const resposta = await enviar(
      JSON.stringify({
        'csp-report': {
          'document-uri': 'https://adai.com.br/eventos?utm_source=x',
          'blocked-uri': 'https://malicioso.example/x.js?token=segredo',
          'effective-directive': 'script-src-elem',
          disposition: 'enforce',
        },
      }),
    );

    expect(resposta.status).toBe(204);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(registrado()).toEqual({
      pagina: 'https://adai.com.br/eventos',
      bloqueado: 'https://malicioso.example/x.js',
      diretiva: 'script-src-elem',
      modo: 'enforce',
    });
  });

  it('formato novo (report-to / Reporting API): lista de relatórios', async () => {
    const resposta = await enviar(
      JSON.stringify([
        { type: 'csp-violation', body: { documentURL: 'https://adai.com.br/', blockedURL: 'inline', effectiveDirective: 'style-src-elem', disposition: 'report' } },
        { type: 'deprecation', body: {} },
      ]),
      'application/reports+json',
    );

    expect(resposta.status).toBe(204);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(registrado()).toEqual({ pagina: 'https://adai.com.br/', bloqueado: 'inline', diretiva: 'style-src-elem', modo: 'report' });
  });

  it('corpo inválido, vazio ou de outro tipo: 204 sem registrar nada', async () => {
    for (const corpo of ['', 'não é json', '{"outra":"coisa"}', '[1,2,3]']) {
      expect((await enviar(corpo)).status).toBe(204);
    }
    expect((await enviar('{}', 'text/html')).status).toBe(415);
    expect(aviso).not.toHaveBeenCalled();
  });

  it('corpo grande demais é recusado sem ser lido por inteiro (413)', async () => {
    const resposta = await enviar(JSON.stringify({ 'csp-report': { 'document-uri': 'x'.repeat(70_000) } }));
    expect(resposta.status).toBe(413);
    expect(aviso).not.toHaveBeenCalled();
  });

  it('limita relatórios por envio e corta textos longos (log não vira depósito de lixo)', async () => {
    const um = { type: 'csp-violation', body: { documentURL: 'https://adai.com.br/', blockedURL: 'eval', effectiveDirective: 'd'.repeat(500) } };
    await enviar(JSON.stringify(Array.from({ length: 30 }, () => um)), 'application/reports+json');
    expect(aviso).toHaveBeenCalledTimes(10);
    expect(registrado().diretiva).toHaveLength(100);
  });
});
