'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { assinarMarca, COOKIE_RESULTADO_VERIFICADO, lerMarca, opcoesCookieResultado, VALIDADE_EMAIL_VERIFICADO_MS } from '@/lib/eba/aparelho';
import { emailDoCodigo } from '@/lib/eba/codigo-email';
import { emailDoLinkResultado } from '@/lib/eba/email-resultado';
import { criarLimitador, ipDoCliente } from '@/lib/eba/limite';
import { emitirLinkResultado, segredoDoResultado } from '@/lib/eba/link-resultado';
import { mascararEmail, segredoDaSessao } from '@/lib/eba/sessao';
import { gerarCodigo, hashDoCodigo, hashDoEmail, soDigitos, VALIDADE_CODIGO_MS } from '@/lib/eba/verificacao';
import { alunoPorEmail, normalizarEmail } from '@/lib/eba-api/alunos';
import { ebaApiConfigurada, TIMEOUT_ACAO_MS } from '@/lib/eba-api/client';
import { emailConfigurado, enviarEmail } from '@/lib/email/mailersend';
import { DIAS_VALIDADE_LINK } from './validade';
import { origemDoSite } from '@/lib/seo/json-ld';
import { cancelarVerificacao, conferirVerificacao, emitirVerificacao, verificacaoConfigurada, type ResultadoVerificacao } from '@/lib/strapi/verificacao';

/**
 * Pedido do link do resultado (spec 2026-10-22, entrega 3): e-mail → código de 6 dígitos → link
 * particular enviado SÓ por e-mail. Regras de segurança:
 * - o link nunca volta na resposta nem aparece na tela;
 * - a resposta é a mesma para e-mail de aluno ou não (o pedido do código nem consulta a API);
 * - sem `EBA_RESULTADO_SEGREDO`, API, MailerSend ou Strapi das verificações, tudo falha fechado;
 * - logs só com a classe do erro: nunca e-mail, código, id ou link.
 */

export type RespostaPedido<T = undefined> =
  | { ok: true; dados?: T }
  /** `codigoAceito`: o código já foi gasto e a falha veio depois (API ou e-mail): a tela oferece "Tentar de novo". */
  | { ok: false; erro: 'invalido' | 'limite' | 'emails' | 'indisponivel' | 'verificacao'; codigoAceito?: true }
  | { ok: false; erro: 'codigo'; resultado: Exclude<ResultadoVerificacao['resultado'], 'ok'>; restantes: number };

const limitarTentativas = criarLimitador(10, 60_000);
const esquemaEmail = z.string().trim().max(254).pipe(z.email());
const ACAO = { timeoutMs: TIMEOUT_ACAO_MS };

const falha = (erro: 'invalido' | 'limite' | 'emails' | 'indisponivel' | 'verificacao') => ({ ok: false, erro }) as const;

async function dentroDoLimite(): Promise<boolean> {
  const cabecalhos = await headers();
  const proxies = Number(process.env.EBA_PROXIES_CONFIAVEIS ?? 1);
  return limitarTentativas(ipDoCliente(cabecalhos.get('x-forwarded-for'), proxies), Date.now());
}

function configuracao(): { segredo: string; segredoResultado: string } | null {
  const segredo = segredoDaSessao();
  const segredoResultado = segredoDoResultado();
  return segredo && segredoResultado && ebaApiConfigurada() && emailConfigurado() && verificacaoConfigurada() ? { segredo, segredoResultado } : null;
}

function registrarFalha(acao: string, erro: unknown): void {
  console.warn(`[eba-resultado] ${acao}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
}

/** Passo 1: manda o código de 6 dígitos para o e-mail (a resposta não revela se ele é de aluno). */
export async function pedirCodigoResultado(email: string): Promise<RespostaPedido<{ emailMascarado: string }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  if (!valido.success) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);
  const emailHash = hashDoEmail(emailNormalizado, config.segredo);

  try {
    const codigo = gerarCodigo();
    const codigoHash = hashDoCodigo(emailHash, codigo, config.segredo);
    const emitido = await emitirVerificacao({ emailHash, codigoHash, expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MS) });
    // Limite de envios do e-mail: avisa, em vez de mostrar "código enviado" para um e-mail que não sai.
    if (emitido === 'limite') return falha('emails');
    try {
      await enviarEmail({ para: emailNormalizado, ...emailDoCodigo(codigo, 'resultado') });
    } catch (erro) {
      // O e-mail não saiu: devolve a cota de envios para a próxima tentativa.
      await cancelarVerificacao({ emailHash, codigoHash });
      throw erro;
    }
    return { ok: true, dados: { emailMascarado: mascararEmail(emailNormalizado) } };
  } catch (erro) {
    registrarFalha('pedirCodigoResultado', erro);
    return falha('indisponivel');
  }
}

/**
 * Passo 2: confere o código (só os 6 dígitos contam). Certo e aluno cadastrado → envia o link por
 * e-mail. Certo e sem cadastro → a mesma resposta, sem e-mail.
 */
export async function confirmarLinkResultado(email: string, codigo: string): Promise<RespostaPedido<{ emailMascarado: string }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  const digitos = soDigitos(codigo);
  if (!valido.success || !digitos) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);
  const emailHash = hashDoEmail(emailNormalizado, config.segredo);

  try {
    const conferido = await conferirVerificacao({ emailHash, codigoHash: hashDoCodigo(emailHash, digitos, config.segredo) });
    if (conferido.resultado !== 'ok') return { ok: false, erro: 'codigo', resultado: conferido.resultado, restantes: conferido.restantes };
  } catch (erro) {
    registrarFalha('confirmarLinkResultado', erro);
    return falha('indisponivel');
  }

  // Código aceito (já gasto no Strapi, uso único). Grava a marca antes das chamadas à API e ao MailerSend:
  // se falharem, o "Tentar de novo" (`reenviarLinkResultado`) segue sem pedir outro código.
  (await cookies()).set(COOKIE_RESULTADO_VERIFICADO, assinarMarca(emailHash, config.segredo, Date.now()), opcoesCookieResultado());
  return enviarLink(emailNormalizado, config.segredoResultado, 'confirmarLinkResultado');
}

/**
 * "Tentar de novo" depois de o código ser aceito e a API ou o e-mail falharem: exige a marca de 15 min do
 * mesmo e-mail (gravada ao aceitar o código) e envia o link, sem pedir outro código.
 */
export async function reenviarLinkResultado(email: string): Promise<RespostaPedido<{ emailMascarado: string }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  if (!valido.success) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);
  const marca = lerMarca((await cookies()).get(COOKIE_RESULTADO_VERIFICADO)?.value, config.segredo, Date.now(), VALIDADE_EMAIL_VERIFICADO_MS);
  if (marca?.emailHash !== hashDoEmail(emailNormalizado, config.segredo)) return falha('verificacao');

  return enviarLink(emailNormalizado, config.segredoResultado, 'reenviarLinkResultado');
}

/**
 * Busca o aluno pelo e-mail e envia o link por e-mail. Sem cadastro: a mesma resposta de sucesso, sem
 * e-mail. Falha (API ou e-mail) com a marca já gravada: `codigoAceito`, para a tela oferecer "Tentar de novo".
 */
async function enviarLink(email: string, segredoResultado: string, acao: string): Promise<RespostaPedido<{ emailMascarado: string }>> {
  try {
    const aluno = await alunoPorEmail(email, ACAO);
    if (aluno) {
      const codigoDoLink = emitirLinkResultado(aluno.idStudent, {
        segredo: segredoResultado,
        validadeMs: DIAS_VALIDADE_LINK * 86_400_000,
        agora: Date.now(),
      });
      await enviarEmail({ para: email, ...emailDoLinkResultado(`${origemDoSite()}/eba/resultado/${codigoDoLink}`, DIAS_VALIDADE_LINK) });
    }
    (await cookies()).delete({ name: COOKIE_RESULTADO_VERIFICADO, path: '/eba/resultado' });
    return { ok: true, dados: { emailMascarado: mascararEmail(email) } };
  } catch (erro) {
    registrarFalha(acao, erro);
    return { ok: false, erro: 'indisponivel', codigoAceito: true };
  }
}
