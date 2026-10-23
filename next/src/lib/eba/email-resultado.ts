/**
 * Texto do e-mail com o link do resultado dos testes da EBA (HTML simples + texto). O corpo não leva
 * nome nem resultado: só o botão com o link particular, a validade e o aviso para quem não pediu.
 */

const CAMINHO = '/eba/resultado/';
const ASSUNTO = 'Seu resultado nos testes da EBA';

function validarLink(link: string): void {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error('link do resultado inválido');
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) throw new Error('link do resultado inválido');
  if (!url.pathname.startsWith(CAMINHO) || !/^[A-Za-z0-9._-]+$/.test(url.pathname.slice(CAMINHO.length)) || url.search || url.hash) {
    throw new Error('link do resultado inválido');
  }
}

export function emailDoLinkResultado(link: string, dias: number): { assunto: string; html: string; texto: string } {
  validarLink(link);
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) throw new Error('validade em dias inválida');
  const validade = dias === 1 ? '1 dia' : `${dias} dias`;
  const aviso = 'Não pediu este e-mail? Pode ignorar: nenhum dado foi alterado.';
  const particular = 'O link é só seu: não encaminhe nem publique.';
  return {
    assunto: ASSUNTO,
    texto: [
      'Olá!',
      '',
      'Use o link abaixo para ver o resultado dos testes que você fez na EBA:',
      link,
      '',
      `${particular} Ele vale por ${validade}.`,
      '',
      aviso,
      '',
      'ADAI — Escola Bíblica',
    ].join('\n'),
    html: `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:14px">
    <tr><td style="padding:32px">
      <p style="margin:0 0 16px;font-size:16px">Olá!</p>
      <p style="margin:0 0 24px;font-size:16px">Use o botão abaixo para ver o resultado dos testes que você fez na EBA.</p>
      <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#000000;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none">Ver meu resultado</a></p>
      <p style="margin:0 0 16px;font-size:16px">${particular} Ele vale por ${validade}.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b">${aviso}</p>
      <p style="margin:0;font-size:14px;font-weight:bold">ADAI — Escola Bíblica</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
