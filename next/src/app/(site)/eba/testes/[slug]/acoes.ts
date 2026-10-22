'use server';

import { createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { emailDoCodigo } from '@/lib/eba/codigo-email';
import {
  assinarMarca,
  COOKIE_APARELHO,
  COOKIE_EMAIL_VERIFICADO,
  lerMarca,
  opcoesCookieMarca,
  VALIDADE_APARELHO_MS,
  VALIDADE_EMAIL_VERIFICADO_MS,
} from '@/lib/eba/aparelho';
import { criarEnvioUnico } from '@/lib/eba/envio-unico';
import { criarLimitador, ipDoCliente } from '@/lib/eba/limite';
import {
  assinarSessao,
  COOKIE_SESSAO,
  donoDaSessao,
  lerSessao,
  mascararEmail,
  OPCOES_COOKIE,
  segredoDaSessao,
  type SessaoAluno,
} from '@/lib/eba/sessao';
import { alunoPorEmail, cadastrarAluno, normalizarEmail } from '@/lib/eba-api/alunos';
import {
  EbaApiError,
  EbaApiIndisponivel,
  EbaApiRespostaInvalida,
  ebaApiConfigurada,
  TIMEOUT_ACAO_MS,
  TIMEOUT_AQUECER_MS,
  TIMEOUT_ENVIO_MS,
} from '@/lib/eba-api/client';
import { perguntasDoTeste, type Pergunta } from '@/lib/eba-api/perguntas';
import { enviarRespostas, type Resultado } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, UNIDADES, usaPerguntasDaApi, type SlugTeste } from '@/lib/eba-api/testes';
import { aquecerApi, turmasAtivas, type Turma } from '@/lib/eba-api/turmas';
import { gerarCodigo, hashDoCodigo, hashDoEmail, soDigitos, VALIDADE_CODIGO_MS } from '@/lib/eba/verificacao';
import { emailConfigurado, enviarEmail } from '@/lib/email/mailersend';
import { cancelarVerificacao, conferirVerificacao, emitirVerificacao, verificacaoConfigurada, type ResultadoVerificacao } from '@/lib/strapi/verificacao';

/**
 * Únicas ações que ligam a tela dos testes à API da EBA. Regras de segurança:
 * - ids do aluno só vêm da sessão assinada (cookie httpOnly), nunca do cliente;
 * - sem `EBA_SESSAO_SEGREDO` válido, sem API, sem MailerSend ou sem o token das verificações, tudo
 *   falha fechado (`indisponivel`);
 * - sessão e cadastro só depois do código de 6 dígitos enviado ao e-mail (ou do aparelho já
 *   verificado para o mesmo e-mail); a resposta ao pedir o código não revela se o e-mail é de aluno;
 * - logs só com classe do erro/status/código: nunca e-mail, nome ou ids.
 *
 * API fria: o banco da API pausa quando fica ocioso e a primeira chamada leva de 10 a 45 s. Por
 * isso as chamadas daqui usam `TIMEOUT_ACAO_MS` (45 s), o envio `TIMEOUT_ENVIO_MS` (60 s) e o
 * aquecimento `TIMEOUT_AQUECER_MS` (8 s). A página declara `maxDuration` de 120 s (as ações herdam).
 */

export type RespostaAcao<T = undefined> =
  | { ok: true; dados?: T }
  | { ok: false; erro: 'invalido' | 'limite' | 'emails' | 'indisponivel' | 'sessao' | 'recusado' | 'verificacao'; codigoAceito?: true };

type Falha = { ok: false; erro: 'invalido' | 'limite' | 'emails' | 'indisponivel' | 'sessao' | 'recusado' | 'verificacao' };

/** Quem confirmou o código: sessão aberta (aluno cadastrado) ou turmas para o Primeiro acesso. */
export type Identificado = SessaoVisivel | { novo: true; turmas: Turma[] };

/** Código conferido e recusado: errado (com tentativas restantes), vencido ou esgotado. */
export type FalhaCodigo = { ok: false; erro: 'codigo'; resultado: Exclude<ResultadoVerificacao['resultado'], 'ok'>; restantes: number };

const falha = (erro: Falha['erro']): Falha => ({ ok: false, erro });

const limitarTentativas = criarLimitador(10, 60_000);
/** `enviar` busca perguntas na API e grava respostas: limite próprio, mais baixo (mesma chave: IP). */
const limitarEnvios = criarLimitador(6, 60_000);
/** Mesmo aluno, teste e respostas em 10 min: uma gravação só na API (duas abas, reenvio após sucesso). */
const enviarUmaVez = criarEnvioUnico<Resultado>(600_000);
/** Aquecimento: limite próprio (não gasta as tentativas do identificar), mesma chave (IP). */
const limitarAquecimento = criarLimitador(5, 60_000);
const ACAO = { timeoutMs: TIMEOUT_ACAO_MS };
const ENVIO = { timeoutMs: TIMEOUT_ENVIO_MS };

/** Segredo válido e API configurada; senão as ações falham fechado. */
function configuracao(): { segredo: string } | null {
  const s = segredoDaSessao();
  return s && ebaApiConfigurada() && emailConfigurado() && verificacaoConfigurada() ? { segredo: s } : null;
}

function registrarFalha(acao: string, erro: unknown): void {
  if (erro instanceof EbaApiError) {
    console.warn(`[eba-testes] ${acao}: EbaApiError status=${erro.status} codigo=${erro.codigo ?? '-'}`);
  } else if (erro instanceof EbaApiIndisponivel || erro instanceof EbaApiRespostaInvalida) {
    console.warn(`[eba-testes] ${acao}: ${erro.name}`);
  } else {
    console.warn(`[eba-testes] ${acao}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
}

/** Proxies confiáveis na frente do Next (padrão 1: o ingress). Ver `ipDoCliente`. */
function proxiesConfiaveis(): number {
  return Number(process.env.EBA_PROXIES_CONFIAVEIS ?? 1);
}

async function dentroDoLimite(limitar = limitarTentativas): Promise<boolean> {
  const cabecalhos = await headers();
  return limitar(ipDoCliente(cabecalhos.get('x-forwarded-for'), proxiesConfiaveis()), Date.now());
}

/** O que a tela recebe da sessão: o e-mail mascarado (para mostrar) e o dono opaco (para comparar). */
export type SessaoVisivel = { emailMascarado: string; dono: string };

async function abrirSessao(aluno: { idStudent: string; idClass: string }, email: string, chave: string): Promise<SessaoVisivel> {
  const emailMascarado = mascararEmail(email);
  const sessao: SessaoAluno = { ...aluno, emailMascarado, emitidoEm: Date.now() };
  const cofre = await cookies();
  cofre.set(COOKIE_SESSAO, assinarSessao(sessao, chave), OPCOES_COOKIE);
  cofre.set(COOKIE_APARELHO, assinarMarca(hashDoEmail(email, chave), chave, Date.now()), opcoesCookieMarca(VALIDADE_APARELHO_MS));
  cofre.delete({ name: COOKIE_EMAIL_VERIFICADO, path: OPCOES_COOKIE.path });
  return { emailMascarado, dono: donoDaSessao(aluno.idStudent, chave) };
}

/** Marca assinada do cookie `nome`, se for do mesmo e-mail e estiver na validade. */
async function marcaDoEmail(nome: string, validadeMs: number, emailHash: string, segredo: string): Promise<boolean> {
  const marca = lerMarca((await cookies()).get(nome)?.value, segredo, Date.now(), validadeMs);
  return marca?.emailHash === emailHash;
}

/**
 * E-mail comprovado (código certo, aparelho lembrado ou e-mail verificado): aluno cadastrado → sessão;
 * sem cadastro → turmas do Primeiro acesso e a marca `eba_email_verificado` (15 min) para o `cadastrar`.
 */
async function seguirVerificado(email: string, segredo: string): Promise<Identificado> {
  const aluno = await alunoPorEmail(email, ACAO);
  if (aluno) return abrirSessao(aluno, email, segredo);
  const turmas = await turmasAtivas(ACAO);
  (await cookies()).set(COOKIE_EMAIL_VERIFICADO, assinarMarca(hashDoEmail(email, segredo), segredo, Date.now()), opcoesCookieMarca(VALIDADE_EMAIL_VERIFICADO_MS));
  return { novo: true, turmas };
}

const esquemaEmail = z.string().trim().max(254).pipe(z.email());

/**
 * Sessão do cookie, ou null. Cookie presente mas vencido ou adulterado é apagado (spec §5.3).
 * Na renderização do Server Component o cookie é só leitura: a tentativa é ignorada e o
 * próximo `enviar` (Server Action) apaga.
 */
async function sessaoDoCookie(segredo: string): Promise<SessaoAluno | null> {
  const cofre = await cookies();
  const valor = cofre.get(COOKIE_SESSAO)?.value;
  const sessao = lerSessao(valor, segredo, Date.now());
  if (!sessao && valor) {
    try {
      cofre.delete({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
    } catch {
      // Renderização (cookies só leitura): fica para a próxima Server Action.
    }
  }
  return sessao;
}

/**
 * Primeiro passo da identificação. Aparelho já verificado para este e-mail → segue direto (sessão ou
 * Primeiro acesso). Senão, gera o código, guarda só os hashes no Strapi e manda o e-mail; a resposta é
 * a mesma para e-mail de aluno ou não, e também quando o limite de envios do e-mail já foi atingido.
 */
export async function pedirCodigo(
  email: string,
): Promise<RespostaAcao<Identificado | { codigoEnviado: true; emailMascarado: string }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  if (!valido.success) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);
  const emailHash = hashDoEmail(emailNormalizado, config.segredo);

  try {
    if (await marcaDoEmail(COOKIE_APARELHO, VALIDADE_APARELHO_MS, emailHash, config.segredo)) {
      return { ok: true, dados: await seguirVerificado(emailNormalizado, config.segredo) };
    }
    const codigo = gerarCodigo();
    const codigoHash = hashDoCodigo(emailHash, codigo, config.segredo);
    const emitido = await emitirVerificacao({ emailHash, codigoHash, expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MS) });
    // Limite de envios do e-mail: avisa, em vez de mostrar "código enviado" para um e-mail que não sai.
    // A resposta vale para qualquer e-mail (aluno ou não), então não revela nada do cadastro.
    if (emitido === 'limite') return falha('emails');
    try {
      await enviarEmail({ para: emailNormalizado, ...emailDoCodigo(codigo) });
    } catch (erro) {
      // O e-mail não saiu: devolve a cota de envios para a próxima tentativa.
      await cancelarVerificacao({ emailHash, codigoHash });
      throw erro;
    }
    return { ok: true, dados: { codigoEnviado: true, emailMascarado: mascararEmail(emailNormalizado) } };
  } catch (erro) {
    registrarFalha('pedirCodigo', erro);
    return falha('indisponivel');
  }
}

/** Confere o código digitado (só os 6 dígitos contam). Certo → sessão ou Primeiro acesso. */
export async function confirmarCodigo(email: string, codigo: string): Promise<RespostaAcao<Identificado> | FalhaCodigo> {
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
    registrarFalha('confirmarCodigo', erro);
    return falha('indisponivel');
  }

  // Código aceito (já gasto no Strapi, uso único). Marca o e-mail como verificado antes das chamadas à API da
  // EBA: se elas falharem (API fria), o "Tentar de novo" (`retomarCadastro`) segue sem pedir outro código.
  (await cookies()).set(COOKIE_EMAIL_VERIFICADO, assinarMarca(emailHash, config.segredo, Date.now()), opcoesCookieMarca(VALIDADE_EMAIL_VERIFICADO_MS));
  try {
    return { ok: true, dados: await seguirVerificado(emailNormalizado, config.segredo) };
  } catch (erro) {
    registrarFalha('confirmarCodigo', erro);
    return { ok: false, erro: 'indisponivel', codigoAceito: true };
  }
}

/** "Tentar de novo" do Primeiro acesso: exige o e-mail verificado (marca de 15 min). */
export async function retomarCadastro(email: string): Promise<RespostaAcao<Identificado>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  if (!valido.success) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);
  if (!(await marcaDoEmail(COOKIE_EMAIL_VERIFICADO, VALIDADE_EMAIL_VERIFICADO_MS, hashDoEmail(emailNormalizado, config.segredo), config.segredo))) {
    return falha('verificacao');
  }

  try {
    return { ok: true, dados: await seguirVerificado(emailNormalizado, config.segredo) };
  } catch (erro) {
    registrarFalha('retomarCadastro', erro);
    return falha('indisponivel');
  }
}

const esquemaCadastro = z.object({
  email: esquemaEmail,
  // Sem caracteres de controle (quebra de linha, tabulação, nulo…): o nome vai para o painel da EBA.
  nome: z.string().trim().min(3).max(100).refine((nome) => !/\p{Cc}/u.test(nome)),
  unidade: z.enum(UNIDADES.map((u) => u.valor) as [string, ...string[]]),
  idTurma: z.string().min(1).max(100),
});

export async function cadastrar(dados: {
  email: string;
  nome: string;
  unidade: string;
  idTurma: string;
}): Promise<RespostaAcao<SessaoVisivel>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaCadastro.safeParse(dados);
  if (!valido.success) return falha('invalido');
  const { nome, unidade, idTurma } = valido.data;
  const email = normalizarEmail(valido.data.email);
  if (!(await marcaDoEmail(COOKIE_EMAIL_VERIFICADO, VALIDADE_EMAIL_VERIFICADO_MS, hashDoEmail(email, config.segredo), config.segredo))) {
    return falha('verificacao');
  }

  try {
    // E-mail já cadastrado (outra aba, clique duplo, cadastro feito em outro aparelho): abre a
    // sessão como no `identificar`, sem criar um aluno duplicado.
    const existente = await alunoPorEmail(email, ACAO);
    if (existente) {
      return { ok: true, dados: await abrirSessao(existente, email, config.segredo) };
    }
    const turmas = await turmasAtivas(ACAO);
    if (!turmas.some((t) => t.id === idTurma)) return falha('invalido');
    const aluno = await cadastrarAluno({ nome, email, unidade, idTurma }, ACAO);
    return { ok: true, dados: await abrirSessao(aluno, email, config.segredo) };
  } catch (erro) {
    registrarFalha('cadastrar', erro);
    return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
  }
}

const esquemaResposta = z.object({ numero: z.number().int(), nota: z.number().int() });

type RespostaTeste = { numero: number; nota: number };

function numerosUnicos(respostas: RespostaTeste[]): Set<number> | null {
  const numeros = new Set(respostas.map((r) => r.numero));
  return numeros.size === respostas.length ? numeros : null;
}

/** Uma resposta para cada número esperado, sem repetição nem extras. */
function cobreExatamente(respostas: RespostaTeste[], esperados: number[]): boolean {
  const numeros = numerosUnicos(respostas);
  return (
    numeros !== null && numeros.size === esperados.length && esperados.every((n) => numeros.has(n))
  );
}

const entre = (nota: number, min: number, max: number) => nota >= min && nota <= max;

/** Valida as respostas já agregadas, no formato da API, conforme o tipo do teste. */
async function respostasValidas(slug: SlugTeste, respostas: RespostaTeste[]): Promise<boolean> {
  const tipo = definicaoDoTeste(slug)?.tipo;
  switch (tipo) {
    case 'nota': {
      const perguntas = await perguntasDoTeste(slug, ACAO);
      return (
        cobreExatamente(respostas, perguntas.map((p) => p.numero)) &&
        respostas.every((r) => entre(r.nota, 0, 5))
      );
    }
    case 'talentos': {
      const perguntas = await perguntasDoTeste(slug, ACAO);
      if (!cobreExatamente(respostas, perguntas.map((p) => p.numero))) return false;
      if (!respostas.every((r) => r.nota === 0 || r.nota === 1)) return false;
      const marcados = respostas.filter((r) => r.nota === 1).length;
      return marcados >= 1 && marcados <= 3;
    }
    case 'estilo':
      return cobreExatamente(respostas, [1, 2]) && respostas.every((r) => entre(r.nota, 7, 35));
    case 'temperamento':
      return cobreExatamente(respostas, [1, 2, 3, 4]) && respostas.every((r) => entre(r.nota, 0, 50));
    default:
      return false;
  }
}

/** Dono opaco das respostas (`donoDaSessao`), como o cliente guardou no progresso. */
const esquemaRespondidoComo = z.string().max(260).refine((v) => v.trim() !== '');

/**
 * Envia as respostas com os ids da sessão. `respondidoComo` é o dono opaco da sessão em que as
 * respostas foram dadas: se a sessão do cookie for de outra pessoa (trocada em outra aba, mesmo com a
 * mesma máscara de e-mail), devolve `sessao` sem chamar a API, para as respostas de uma pessoa não
 * serem gravadas como de outra.
 */
export async function enviar(
  slug: string,
  respostas: { numero: number; nota: number }[],
  respondidoComo: string,
): Promise<RespostaAcao<Resultado>> {
  const config = configuracao();
  if (!config) return falha('indisponivel');
  if (!(await dentroDoLimite(limitarEnvios))) return falha('limite');

  const sessao = await sessaoDoCookie(config.segredo);
  if (!sessao) return falha('sessao');

  const dono = esquemaRespondidoComo.safeParse(respondidoComo);
  if (!dono.success) return falha('invalido');
  if (dono.data !== donoDaSessao(sessao.idStudent, config.segredo)) return falha('sessao');

  const teste = definicaoDoTeste(typeof slug === 'string' ? slug : '');
  const lista = z.array(esquemaResposta).safeParse(respostas);
  if (!teste || !lista.success) return falha('invalido');

  try {
    if (!(await respostasValidas(teste.slug, lista.data))) return falha('invalido');
    const envio = { slug: teste.slug, idStudent: sessao.idStudent, idClass: sessao.idClass, respostas: lista.data };
    // Chave sem dado pessoal em claro: hash do aluno, turma, teste e respostas.
    const chave = createHash('sha256').update(JSON.stringify(envio)).digest('base64url');
    const resultado = await enviarUmaVez(chave, Date.now(), () =>
      // 2xx com corpo fora do formato: a API já gravou. Fica guardado como "sem resultado" para o
      // reenvio das mesmas respostas não gravar de novo.
      enviarRespostas(envio, ENVIO).catch((erro: unknown): Resultado => {
        if (erro instanceof EbaApiRespostaInvalida) {
          registrarFalha('enviar', erro);
          return { tipo: 'sem-resultado' };
        }
        throw erro;
      }),
    );
    return { ok: true, dados: resultado };
  } catch (erro) {
    registrarFalha('enviar', erro);
    // 2xx com corpo fora do formato: a API já gravou as respostas. Sucesso sem resultado, para a
    // tela não oferecer "Tentar de novo" (reenviar duplicaria a gravação).
    if (erro instanceof EbaApiRespostaInvalida) return { ok: true, dados: { tipo: 'sem-resultado' } };
    return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
  }
}

/**
 * Acorda o banco da API (ele pausa quando fica ocioso) enquanto a pessoa lê a abertura: um GET leve
 * e sem cache, com timeout curto (8 s: o banco acorda com a tentativa de conexão, e a fila de Server
 * Actions não fica presa). Nunca lança e nunca devolve dados. Não chama a API acima de 5 por minuto por IP nem
 * sem configuração ou segredo (falha fechado).
 */
export async function aquecer(): Promise<void> {
  try {
    if (!(await dentroDoLimite(limitarAquecimento))) return;
    if (!configuracao()) return;
    await aquecerApi({ timeoutMs: TIMEOUT_AQUECER_MS });
  } catch (erro) {
    // Só a classe do erro: o aquecimento é uma tentativa, e a próxima ação mostra a falha real.
    console.warn(`[eba-testes] aquecer: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
}

/**
 * Perguntas do teste quando a busca na renderização falhou (API fria passa dos 10 s da página):
 * "Começar" tenta de novo com 45 s. Estilo e temperamento não usam perguntas da API (`[]`).
 */
export async function carregarPerguntas(slug: string): Promise<RespostaAcao<Pergunta[]>> {
  const teste = definicaoDoTeste(typeof slug === 'string' ? slug : '');
  if (!teste) return falha('invalido');
  if (!(await dentroDoLimite())) return falha('limite');
  if (!configuracao()) return falha('indisponivel');
  if (!usaPerguntasDaApi(teste)) return { ok: true, dados: [] };

  try {
    return { ok: true, dados: await perguntasDoTeste(teste.slug, ACAO) };
  } catch (erro) {
    registrarFalha('carregarPerguntas', erro);
    return falha('indisponivel');
  }
}

/** Encerra a sessão e esquece o aparelho e o e-mail verificado ("Não é você?" e "Sair"; celular compartilhado). */
export async function sair(): Promise<void> {
  const cofre = await cookies();
  cofre.delete({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
  cofre.delete({ name: COOKIE_APARELHO, path: OPCOES_COOKIE.path });
  cofre.delete({ name: COOKIE_EMAIL_VERIFICADO, path: OPCOES_COOKIE.path });
}

export async function sessaoAtual(): Promise<SessaoVisivel | null> {
  const config = configuracao();
  if (!config) return null;
  const sessao = await sessaoDoCookie(config.segredo);
  return sessao ? { emailMascarado: sessao.emailMascarado, dono: donoDaSessao(sessao.idStudent, config.segredo) } : null;
}
