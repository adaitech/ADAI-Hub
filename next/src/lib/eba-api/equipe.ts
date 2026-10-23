import 'server-only';
import { z } from 'zod';
import { ebaFetch, EbaApiError, EbaApiRespostaInvalida, TIMEOUT_ACAO_MS } from './client';
import { normalizarEmail } from './alunos';

/**
 * Chamadas da área da equipe (spec 2026-10-22, entrega 4): login do Identity e consulta de alunos e
 * turmas, sempre com o bearer da sessão. Só servidor. 401 da API = sessão vencida (`SessaoEncerrada`).
 * Nunca registra e-mail, nome, senha nem bearer.
 */

/** O bearer venceu ou foi recusado: quem chama encerra a sessão e volta ao login. */
export class SessaoEncerrada extends Error {
  constructor() {
    super('[eba-equipe] sessão encerrada');
    this.name = 'SessaoEncerrada';
  }
}

/** E-mail ou senha não aceitos (4xx do login). A mensagem é a mesma para qualquer motivo. */
export class CredenciaisInvalidas extends Error {
  constructor() {
    super('[eba-equipe] credenciais inválidas');
    this.name = 'CredenciaisInvalidas';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACAO = { timeoutMs: TIMEOUT_ACAO_MS };
const TAMANHO_PAGINA_TURMAS = 100;
const MAX_PAGINAS = 50;

/** UUID da API (alunos e turmas), para validar antes de chamar. */
export const idValido = (id: string): boolean => UUID.test(id);

const exigirId = (id: string): string => {
  if (!idValido(id)) throw new Error('[eba-equipe] id inválido');
  return id;
};

/** Chamada com o bearer: 401 vira `SessaoEncerrada`. */
async function chamar<T>(bearer: string, caminho: string, init: { metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'; corpo?: unknown } = {}): Promise<T> {
  try {
    return await ebaFetch<T>(caminho, { ...init, bearer, ...ACAO });
  } catch (erro) {
    if (erro instanceof EbaApiError && erro.status === 401) throw new SessaoEncerrada();
    throw erro;
  }
}

const invalida = (onde: string) => new EbaApiRespostaInvalida(`${onde} fora do formato`);

// --- login -----------------------------------------------------------------

const esquemaLogin = z.object({ accessToken: z.string().min(1), expiresIn: z.number().positive() });

/** `POST /login` (Identity, na raiz do APIM). Devolve só o token e a validade em segundos. */
export async function entrar(email: string, senha: string): Promise<{ accessToken: string; expiresIn: number }> {
  let corpo: unknown;
  try {
    corpo = await ebaFetch<unknown>('login', { metodo: 'POST', raiz: true, corpo: { email, password: senha }, ...ACAO });
  } catch (erro) {
    if (erro instanceof EbaApiError && erro.status >= 400 && erro.status < 500) throw new CredenciaisInvalidas();
    throw erro;
  }
  const valido = esquemaLogin.safeParse(corpo);
  if (!valido.success) throw invalida('login');
  return { accessToken: valido.data.accessToken, expiresIn: valido.data.expiresIn };
}

// --- alunos ----------------------------------------------------------------

export interface AlunoEquipe {
  id: string;
  nome: string;
  email: string;
  unidade: string;
  idTurma: string;
  criadoEm: string;
}

const esquemaAluno = z.object({
  id: z.string().min(1),
  name: z.string().nullish(),
  email: z.string().nullish(),
  room: z.string().nullish(),
  idClass: z.string().nullish(),
  dateCreated: z.string().nullish(),
});

const aluno = (a: z.infer<typeof esquemaAluno>): AlunoEquipe => ({
  id: a.id,
  nome: a.name ?? '',
  email: a.email ?? '',
  unidade: a.room ?? '',
  idTurma: a.idClass ?? '',
  criadoEm: a.dateCreated ?? '',
});

const esquemaPaginado = z.object({
  data: z.array(esquemaAluno),
  pages: z.object({ totalPages: z.number().int().min(0), totalRecords: z.number().int().min(0) }),
});

export interface PaginaDeAlunos {
  alunos: AlunoEquipe[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

/** `GET Student?page=N&page-size=M`: a API é paginada (10 por página por padrão); a tela mostra todas as páginas. */
export async function listarAlunos(bearer: string, { pagina, tamanho, idTurma }: { pagina: number; tamanho: number; idTurma?: string }): Promise<PaginaDeAlunos> {
  if (!Number.isInteger(pagina) || pagina < 1) throw new Error('[eba-equipe] página inválida');
  if (!Number.isInteger(tamanho) || tamanho < 1 || tamanho > 100) throw new Error('[eba-equipe] tamanho inválido');
  const filtro = idTurma === undefined ? '' : `&IdClass=${exigirId(idTurma)}`;
  const valido = esquemaPaginado.safeParse(await chamar<unknown>(bearer, `Student?page=${pagina}&page-size=${tamanho}${filtro}`));
  if (!valido.success) throw invalida('Student');
  return { alunos: valido.data.data.map(aluno), pagina, totalPaginas: valido.data.pages.totalPages, total: valido.data.pages.totalRecords };
}

/** Busca por e-mail (tem `@`: `Student/email/{e-mail}`, um aluno) ou por nome (`Student/name/{nome}`, lista). Não encontrado → `[]`. */
export async function buscarAlunos(bearer: string, consulta: string): Promise<AlunoEquipe[]> {
  const q = consulta.trim();
  if (q === '' || q.length > 100) throw new Error('[eba-equipe] consulta inválida');
  const porEmail = q.includes('@');
  const caminho = porEmail ? `Student/email/${encodeURIComponent(normalizarEmail(q))}` : `Student/name/${encodeURIComponent(q)}`;
  try {
    const resposta = await chamar<unknown>(bearer, caminho);
    const valido = z.union([z.array(esquemaAluno), esquemaAluno]).safeParse(resposta);
    if (!valido.success) throw invalida('Student');
    return (Array.isArray(valido.data) ? valido.data : [valido.data]).map(aluno);
  } catch (erro) {
    if (erro instanceof EbaApiError && erro.status === 404) return [];
    throw erro;
  }
}

/** `GET Student/{id}`; 404 → null. */
export async function alunoDaEquipe(bearer: string, id: string): Promise<AlunoEquipe | null> {
  const seguro = exigirId(id);
  try {
    const valido = esquemaAluno.safeParse(await chamar<unknown>(bearer, `Student/${seguro}`));
    if (!valido.success) throw invalida('Student');
    return aluno(valido.data);
  } catch (erro) {
    if (erro instanceof EbaApiError && erro.status === 404) return null;
    throw erro;
  }
}

// --- turmas ----------------------------------------------------------------

export type StatusTurma = 1 | 2 | 3;

export interface TurmaEquipe {
  id: string;
  nome: string;
  status: StatusTurma;
  inicio: string;
  fim: string;
}

const esquemaTurma = z.object({
  id: z.string().min(1),
  name: z.string(),
  codStatus: z.number().int().min(1).max(3),
  initialDate: z.string(),
  endDate: z.string(),
});
const esquemaTurmas = z.object({ data: z.array(esquemaTurma), pages: z.object({ totalPages: z.number().int().min(0) }) });

/** Todas as turmas (percorre as páginas de 100), com filtro opcional de status. */
export async function listarTurmas(bearer: string, { status }: { status?: StatusTurma } = {}): Promise<TurmaEquipe[]> {
  const turmas: TurmaEquipe[] = [];
  let totalPaginas = 1;
  for (let pagina = 1; pagina <= totalPaginas && pagina <= MAX_PAGINAS; pagina += 1) {
    const filtro = status ? `&Status=${status}` : '';
    const valido = esquemaTurmas.safeParse(await chamar<unknown>(bearer, `ClassEBA?page=${pagina}&page-size=${TAMANHO_PAGINA_TURMAS}${filtro}`));
    if (!valido.success) throw invalida('ClassEBA');
    totalPaginas = valido.data.pages.totalPages;
    for (const t of valido.data.data) turmas.push({ id: t.id, nome: t.name, status: t.codStatus as StatusTurma, inicio: t.initialDate, fim: t.endDate });
  }
  return turmas;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
/** Mesmas regras da API: nome de 3 a 200 caracteres, status 1 a 3, término depois do início. Sem caractere de controle no nome. */
const esquemaDadosTurma = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .refine((nome) => !/\p{Cc}/u.test(nome)),
    status: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    inicio: z.string().regex(DATA),
    fim: z.string().regex(DATA),
  })
  .refine((d) => !Number.isNaN(Date.parse(d.inicio)) && !Number.isNaN(Date.parse(d.fim)) && d.fim > d.inicio);

export interface DadosTurma {
  nome: string;
  status: number;
  inicio: string;
  fim: string;
}

/** As regras da API para turma, para a tela validar antes de chamar. */
export const turmaValida = (dados: DadosTurma): boolean => esquemaDadosTurma.safeParse(dados).success;

function validarTurma(dados: DadosTurma) {
  const valido = esquemaDadosTurma.safeParse(dados);
  if (!valido.success) throw new Error('[eba-equipe] dados da turma inválidos');
  return valido.data;
}

export async function criarTurma(bearer: string, dados: DadosTurma): Promise<void> {
  const d = validarTurma(dados);
  await chamar<unknown>(bearer, 'ClassEBA', { metodo: 'POST', corpo: { name: d.nome, status: d.status, initialDate: d.inicio, endDate: d.fim } });
}

export async function editarTurma(bearer: string, dados: DadosTurma & { id: string }): Promise<void> {
  const id = exigirId(dados.id);
  const d = validarTurma(dados);
  await chamar<unknown>(bearer, 'ClassEBA', { metodo: 'PUT', corpo: { id, name: d.nome, status: d.status, initialDate: d.inicio, endDate: d.fim } });
}

export async function apagarTurma(bearer: string, id: string): Promise<void> {
  await chamar<unknown>(bearer, `ClassEBA/${exigirId(id)}`, { metodo: 'DELETE' });
}
