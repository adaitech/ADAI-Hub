/**
 * Texto do e-mail com o código dos testes da EBA (HTML simples + texto). Sem links, imagens externas nem
 * dado pessoal: só o código, a validade e o aviso para quem não pediu.
 */

const VALIDADE = '10 minutos';

export function emailDoCodigo(codigo: string): { assunto: string; html: string; texto: string } {
  if (!/^\d{6}$/.test(codigo)) throw new Error('código precisa ter 6 dígitos');
  const aviso = 'Se não foi você, ignore este e-mail: ninguém consegue entrar sem este código.';
  return {
    assunto: `Seu código para os testes da EBA: ${codigo}`,
    texto: [
      'Olá!',
      '',
      `Seu código para começar os testes da EBA é: ${codigo}`,
      '',
      `Ele vale por ${VALIDADE}. Digite o código na tela do teste.`,
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
      <p style="margin:0 0 16px;font-size:16px">Seu código para começar os testes da EBA é:</p>
      <p style="margin:0 0 24px;font-size:36px;font-weight:bold;letter-spacing:8px">${codigo}</p>
      <p style="margin:0 0 16px;font-size:16px">Ele vale por ${VALIDADE}. Digite o código na tela do teste.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b">${aviso}</p>
      <p style="margin:0;font-size:14px;font-weight:bold">ADAI — Escola Bíblica</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
