import { timingSafeEqual } from 'node:crypto';

/**
 * Regras do código por e-mail dos testes da EBA. Sem imports de `@strapi/*`: o Jest do Next testa este
 * arquivo (o CI do Next não instala o Strapi). O acesso ao banco fica no `repositorio.ts`.
 * Spec: docs/superpowers/specs/2026-10-21-migracao-eba-2-codigo-por-email-design.md §5.1.
 */

export const MAX_TENTATIVAS = 5;
export const MAX_EMISSOES = 3;
export const JANELA_EMISSOES_MS = 900_000;

export type RegistroVerificacao = { id: number; codigoHash: string; expiraEm: Date; tentativas: number; usado: boolean };

export type ResultadoConferencia = { resultado: 'ok' | 'errado' | 'esgotado' | 'vencido'; restantes: number };

export interface RepositorioVerificacao {
  /** Emissões do e-mail criadas depois de `desde` (a de exatamente 15 min atrás já não conta). */
  contarEmissoesDesde(emailHash: string, desde: Date): Promise<number>;
  invalidarAbertas(emailHash: string): Promise<void>;
  criar(r: { emailHash: string; codigoHash: string; expiraEm: Date; criadoEm: Date }): Promise<void>;
  /** Atômico: soma 1 na verificação aberta, não vencida e com tentativas < 5; devolve o registro já somado. */
  somarTentativa(emailHash: string, agora: Date): Promise<RegistroVerificacao | null>;
  /** O código é de uma verificação anterior (invalidada ou usada) do mesmo e-mail. */
  ehCodigoAntigo(emailHash: string, codigoHash: string): Promise<boolean>;
  ultima(emailHash: string): Promise<RegistroVerificacao | null>;
  /** true só se mudou de não usado para usado (dois acertos simultâneos: só um ganha). */
  marcarUsado(id: number): Promise<boolean>;
  apagarAntesDe(data: Date): Promise<number>;
}

const VENCIDO: ResultadoConferencia = { resultado: 'vencido', restantes: 0 };

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function emitir(
  repo: RepositorioVerificacao,
  dados: { emailHash: string; codigoHash: string; expiraEm: Date },
  agora: Date,
): Promise<'emitido' | 'limite'> {
  const desde = new Date(agora.getTime() - JANELA_EMISSOES_MS);
  if ((await repo.contarEmissoesDesde(dados.emailHash, desde)) >= MAX_EMISSOES) return 'limite';
  await repo.invalidarAbertas(dados.emailHash);
  await repo.criar({ ...dados, criadoEm: agora });
  return 'emitido';
}

export async function conferir(
  repo: RepositorioVerificacao,
  { emailHash, codigoHash }: { emailHash: string; codigoHash: string },
  agora: Date,
): Promise<ResultadoConferencia> {
  const registro = await repo.somarTentativa(emailHash, agora);
  if (!registro) {
    const ultima = await repo.ultima(emailHash);
    const esgotada = ultima && !ultima.usado && ultima.expiraEm > agora && ultima.tentativas >= MAX_TENTATIVAS;
    return esgotada ? { resultado: 'esgotado', restantes: 0 } : VENCIDO;
  }
  const restantes = MAX_TENTATIVAS - registro.tentativas;
  if (iguais(registro.codigoHash, codigoHash)) {
    return (await repo.marcarUsado(registro.id)) ? { resultado: 'ok', restantes } : VENCIDO;
  }
  if (await repo.ehCodigoAntigo(emailHash, codigoHash)) return VENCIDO;
  return { resultado: 'errado', restantes };
}
