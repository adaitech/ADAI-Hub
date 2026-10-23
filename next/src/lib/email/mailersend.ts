/**
 * Envio de e-mail transacional pelo MailerSend (mesmo serviço e remetente do site atual, `adaitech/adai`).
 * Só servidor: token exclusivo do Hub em `MAILERSEND_API_TOKEN`, só com permissão de envio. Nunca loga o
 * destinatário. A API responde 202 com corpo vazio quando aceita o e-mail.
 */

const URL_API = 'https://api.mailersend.com/v1/email';
const REMETENTE = { email: 'no-reply@adai.com.br', name: 'ADAI' } as const;
const TIMEOUT_MS = 10_000;

/** MailerSend fora, token recusado, limite ou timeout. A mensagem nunca leva o destinatário. */
export class EmailIndisponivel extends Error {
  constructor(readonly status?: number) {
    super(status ? `MailerSend respondeu ${status}` : 'MailerSend indisponível');
    this.name = 'EmailIndisponivel';
  }
}

export function emailConfigurado(): boolean {
  return Boolean(process.env.MAILERSEND_API_TOKEN);
}

export async function enviarEmail({ para, assunto, html, texto }: { para: string; assunto: string; html: string; texto: string }): Promise<void> {
  const token = process.env.MAILERSEND_API_TOKEN;
  if (!token) throw new EmailIndisponivel();
  let resposta: Response;
  try {
    resposta = await fetch(URL_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMETENTE, to: [{ email: para }], subject: assunto, html, text: texto }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EmailIndisponivel();
  }
  if (!resposta.ok) throw new EmailIndisponivel(resposta.status);
}
