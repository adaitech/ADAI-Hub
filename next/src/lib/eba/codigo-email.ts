/**
 * Texto do e-mail com o código dos testes da EBA (HTML simples + texto). Sem links, imagens externas nem
 * dado pessoal: só o código, a validade e o aviso para quem não pediu.
 */

import { VALIDADE_CODIGO_MS } from './verificacao';

const VALIDADE = `${VALIDADE_CODIGO_MS / 60_000} minutos`;

/** `teste` (padrão): começar os testes. `resultado`: receber o link do resultado dos testes. */
export function emailDoCodigo(codigo: string, finalidade: 'teste' | 'resultado' = 'teste'): { assunto: string; html: string; texto: string } {
  if (!/^\d{6}$/.test(codigo)) throw new Error('código precisa ter 6 dígitos');
  const resultado = finalidade === 'resultado';
  const motivo = resultado ? 'receber o link do seu resultado' : 'começar os testes da EBA';
  const onde = resultado ? 'na tela de pedido do resultado' : 'na tela do teste';
  const aviso = 'Se não foi você, ignore este e-mail: ninguém consegue entrar sem este código.';
  return {
    assunto: resultado ? `Seu código para ver o resultado dos testes da EBA: ${codigo}` : `Seu código para os testes da EBA: ${codigo}`,
    texto: [
      'Olá!',
      '',
      `Seu código para ${motivo} é: ${codigo}`,
      '',
      `Ele vale por ${VALIDADE}. Digite o código ${onde}.`,
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
      <p style="margin:0 0 16px;font-size:16px">Seu código para ${motivo} é:</p>
      <p style="margin:0 0 24px;font-size:36px;font-weight:bold;letter-spacing:8px">${codigo}</p>
      <p style="margin:0 0 16px;font-size:16px">Ele vale por ${VALIDADE}. Digite o código ${onde}.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b">${aviso}</p>
      <p style="margin:0;font-size:14px;font-weight:bold">ADAI — Escola Bíblica</p>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
