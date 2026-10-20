/**
 * Estado do questionário dos testes do CDV: reducer puro + regras de tela (quantas telas, o que
 * cada uma mostra) + agregação das respostas no formato da API. Sem React e sem navegador.
 *
 * Telas por tipo:
 * - `nota`: uma por pergunta (0 a 5); `respostas[numero da pergunta]`.
 * - `talentos`: 2 (marcar as habilidades; escolher até 3 entre as marcadas).
 * - `estilo`: 14 pares (motivação 1–7, organização 8–14), escala 1 a 5; `respostas[tela]`.
 * - `temperamento`: páginas de 10 opções (4 grupos × 50 = 20 páginas); `marcadas` = id da opção.
 */
import { GRUPOS_TEMPERAMENTO, PARES_ESTILO, type GrupoTemperamento, type ParEstilo } from '@/lib/eba-api/conteudo-local';
import type { Pergunta } from '@/lib/eba-api/perguntas';
import type { Resultado } from '@/lib/eba-api/respostas';
import type { SlugTeste, TipoTeste } from '@/lib/eba-api/testes';
import type { Turma } from '@/lib/eba-api/turmas';

export type Estado = 'abertura' | 'email' | 'cadastro' | 'pergunta' | 'enviando' | 'resultado' | 'erro' | 'expirou';

/** Erros de envio que mantêm a pessoa na tela de erro (sessão encerrada vira `expirou`). */
export type ErroEnvio = 'indisponivel' | 'recusado';

/** O que fica no `sessionStorage`: só respostas, nunca dado pessoal. */
export interface Progresso {
  passo: number;
  respostas: Record<number, number>;
  marcadas: number[];
  escolhidas: number[];
}

export interface EstadoQuestionario extends Progresso {
  estado: Estado;
  tipo: TipoTeste;
  /** Quantidade de telas de pergunta do teste. */
  total: number;
  emailMascarado: string | null;
  /** E-mail não encontrado: dados do Primeiro acesso. O e-mail fica só na memória da tela. */
  cadastro: { email: string; turmas: Turma[] } | null;
  /** Para onde ir depois de se identificar: de volta às perguntas ou direto para o envio. */
  retorno: 'pergunta' | 'enviando';
  resultado: Resultado | null;
  erroEnvio: ErroEnvio | null;
  /** A pessoa clicou em "Sair" no resultado. */
  saiu: boolean;
  /** O progresso salvo já foi lido (só então a tela passa a salvar). */
  carregado: boolean;
}

export type Acao =
  | { tipo: 'restaurar'; progresso: Progresso | null }
  | { tipo: 'comecar' }
  | { tipo: 'identificado'; emailMascarado: string }
  | { tipo: 'novoAluno'; email: string; turmas: Turma[] }
  | { tipo: 'voltarEmail' }
  | { tipo: 'trocarEmail' }
  | { tipo: 'informarEmail' }
  | { tipo: 'responder'; chave: number; valor: number }
  | { tipo: 'marcar'; id: number }
  | { tipo: 'escolher'; id: number }
  | { tipo: 'avancar' }
  | { tipo: 'voltar' }
  | { tipo: 'enviar' }
  | { tipo: 'enviado'; resultado: Resultado }
  | { tipo: 'falhou'; erro: 'sessao' | ErroEnvio }
  | { tipo: 'revisar' }
  | { tipo: 'sair' };

export const chaveProgresso = (slug: SlugTeste) => `eba-teste:${slug}`;

export const OPCOES_POR_PAGINA = 10;
export const MAXIMO_ESCOLHIDAS = 3;

const PARES = [...PARES_ESTILO.motivacao, ...PARES_ESTILO.organizacao];
/** Opções dos 4 grupos em sequência; o id é a posição (0–199). */
const OPCOES_TEMPERAMENTO = GRUPOS_TEMPERAMENTO.flatMap((grupo) => grupo.opcoes.map((texto) => ({ texto, grupo }))).map(
  (opcao, id) => ({ id, ...opcao }),
);

/** Par de frases da tela `passo` (0–13) do Estilo pessoal. */
export function parEstilo(passo: number): ParEstilo {
  return PARES[passo];
}

/** Opções da página `passo` (0–19) do Temperamento; todas do mesmo grupo. */
export function paginaTemperamento(passo: number): { grupo: GrupoTemperamento; opcoes: { id: number; texto: string }[] } {
  const pagina = OPCOES_TEMPERAMENTO.slice(passo * OPCOES_POR_PAGINA, (passo + 1) * OPCOES_POR_PAGINA);
  return { grupo: pagina[0].grupo, opcoes: pagina.map(({ id, texto }) => ({ id, texto })) };
}

function telasDoTeste(tipo: TipoTeste, perguntas: Pergunta[]): number {
  switch (tipo) {
    case 'talentos':
      return 2;
    case 'estilo':
      return PARES.length;
    case 'temperamento':
      return Math.ceil(OPCOES_TEMPERAMENTO.length / OPCOES_POR_PAGINA);
    default:
      return Math.max(1, perguntas.length);
  }
}

export function criarEstado({ tipo, perguntas, sessao }: { tipo: TipoTeste; perguntas: Pergunta[]; sessao: { emailMascarado: string } | null }): EstadoQuestionario {
  return {
    estado: 'abertura',
    tipo,
    total: telasDoTeste(tipo, perguntas),
    passo: 0,
    respostas: {},
    marcadas: [],
    escolhidas: [],
    emailMascarado: sessao?.emailMascarado ?? null,
    cadastro: null,
    retorno: 'pergunta',
    resultado: null,
    erroEnvio: null,
    saiu: false,
    carregado: false,
  };
}

const ordenados = (lista: number[]) => [...new Set(lista)].sort((a, b) => a - b);
const alternar = (lista: number[], id: number) => (lista.includes(id) ? lista.filter((x) => x !== id) : ordenados([...lista, id]));

export function reducer(s: EstadoQuestionario, a: Acao): EstadoQuestionario {
  switch (a.tipo) {
    case 'restaurar':
      return { ...s, ...(a.progresso ?? {}), carregado: true };
    case 'comecar':
      return { ...s, estado: s.emailMascarado ? 'pergunta' : 'email' };
    case 'identificado':
      return { ...s, estado: s.retorno, emailMascarado: a.emailMascarado, cadastro: null, saiu: false };
    case 'novoAluno':
      return { ...s, estado: 'cadastro', cadastro: { email: a.email, turmas: a.turmas } };
    case 'voltarEmail':
      return { ...s, estado: 'email', cadastro: null };
    case 'trocarEmail':
      return { ...s, estado: 'email', emailMascarado: null, retorno: 'pergunta' };
    case 'informarEmail':
      return { ...s, estado: 'email' };
    case 'responder': {
      const respostas = { ...s.respostas, [a.chave]: a.valor };
      return { ...s, respostas, passo: Math.min(s.passo + 1, s.total - 1) };
    }
    case 'marcar': {
      const marcadas = alternar(s.marcadas, a.id);
      return { ...s, marcadas, escolhidas: s.escolhidas.filter((id) => marcadas.includes(id)) };
    }
    case 'escolher': {
      if (s.escolhidas.includes(a.id)) return { ...s, escolhidas: s.escolhidas.filter((id) => id !== a.id) };
      if (!s.marcadas.includes(a.id) || s.escolhidas.length >= MAXIMO_ESCOLHIDAS) return s;
      return { ...s, escolhidas: ordenados([...s.escolhidas, a.id]) };
    }
    case 'avancar':
      if (s.tipo === 'talentos' && s.passo === 0 && s.marcadas.length === 0) return s;
      return { ...s, passo: Math.min(s.passo + 1, s.total - 1) };
    case 'voltar':
      return { ...s, passo: Math.max(s.passo - 1, 0) };
    case 'enviar':
      return s.estado === 'enviando' ? s : { ...s, estado: 'enviando', erroEnvio: null };
    case 'enviado':
      return { ...s, estado: 'resultado', resultado: a.resultado, erroEnvio: null };
    case 'falhou':
      return a.erro === 'sessao'
        ? { ...s, estado: 'expirou', emailMascarado: null, retorno: 'enviando' }
        : { ...s, estado: 'erro', erroEnvio: a.erro };
    case 'revisar':
      return { ...s, estado: 'pergunta', passo: 0, erroEnvio: null };
    case 'sair':
      return { ...s, emailMascarado: null, saiu: true };
  }
}

export function progressoDe(s: EstadoQuestionario): Progresso {
  return { passo: s.passo, respostas: s.respostas, marcadas: s.marcadas, escolhidas: s.escolhidas };
}

export function temProgresso(s: EstadoQuestionario): boolean {
  return s.passo > 0 || Object.keys(s.respostas).length > 0 || s.marcadas.length > 0;
}

const inteiro = (valor: unknown): valor is number => typeof valor === 'number' && Number.isInteger(valor);
const listaDeInteiros = (valor: unknown) => ordenados(Array.isArray(valor) ? valor.filter(inteiro) : []);

/** Lê o progresso salvo; qualquer coisa fora do formato é descartada (nunca quebra a tela). */
export function lerProgresso(texto: string | null, total: number): Progresso | null {
  if (!texto) return null;
  let dado: unknown;
  try {
    dado = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!dado || typeof dado !== 'object' || Array.isArray(dado)) return null;
  const { passo, respostas, marcadas, escolhidas } = dado as Record<string, unknown>;
  if (!inteiro(passo)) return null;
  const notas = respostas && typeof respostas === 'object' ? Object.entries(respostas) : [];
  return {
    passo: Math.min(Math.max(passo, 0), total - 1),
    respostas: Object.fromEntries(notas.filter(([chave, nota]) => inteiro(Number(chave)) && inteiro(nota)).map(([chave, nota]) => [Number(chave), nota as number])),
    marcadas: listaDeInteiros(marcadas),
    escolhidas: listaDeInteiros(escolhidas),
  };
}

/** Quanto já foi feito: respostas (nota/estilo) ou telas concluídas (marcar). */
export function respondidas(s: EstadoQuestionario): number {
  return s.tipo === 'nota' || s.tipo === 'estilo' ? Object.keys(s.respostas).length : s.passo;
}

const respondida = (s: EstadoQuestionario, chave: number) => s.respostas[chave] !== undefined;

/** Pode enviar: todas as perguntas respondidas (nota/estilo) ou de 1 a 3 talentos escolhidos. */
export function podeEnviar(s: EstadoQuestionario, perguntas: Pergunta[]): boolean {
  switch (s.tipo) {
    case 'nota':
      return perguntas.length > 0 && perguntas.every((p) => respondida(s, p.numero));
    case 'talentos':
      return s.escolhidas.length >= 1 && s.escolhidas.length <= MAXIMO_ESCOLHIDAS;
    case 'estilo':
      return PARES.every((_, i) => respondida(s, i + 1));
    case 'temperamento':
      return true;
  }
}

const soma = (valores: number[]) => valores.reduce((total, v) => total + v, 0);

/** Respostas no formato da API (`{ numero, nota }`), conforme o tipo do teste. */
export function respostasParaApi(s: EstadoQuestionario, perguntas: Pergunta[]): { numero: number; nota: number }[] {
  switch (s.tipo) {
    case 'nota':
      return perguntas.map((p) => ({ numero: p.numero, nota: s.respostas[p.numero] }));
    case 'talentos':
      return perguntas.map((p) => ({ numero: p.numero, nota: s.escolhidas.includes(p.numero) ? 1 : 0 }));
    case 'estilo': {
      const motivacao = PARES_ESTILO.motivacao.length;
      const nota = (de: number, ate: number) => soma(PARES.slice(de, ate).map((_, i) => s.respostas[de + i + 1] ?? 0));
      return [
        { numero: 1, nota: nota(0, motivacao) },
        { numero: 2, nota: nota(motivacao, PARES.length) },
      ];
    }
    case 'temperamento':
      return GRUPOS_TEMPERAMENTO.map((grupo) => ({
        numero: grupo.numero,
        nota: s.marcadas.filter((id) => OPCOES_TEMPERAMENTO[id]?.grupo === grupo).length,
      }));
  }
}
