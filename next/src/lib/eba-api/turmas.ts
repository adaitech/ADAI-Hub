import 'server-only';
import { ebaFetch, type OpcoesChamada } from './client';
import type { EbaClassListApi } from './tipos';

export interface Turma {
  id: string;
  nome: string;
}

/** `codStatus` 3 = Completed. */
const STATUS_CONCLUIDA = 3;

/** Turmas em andamento ou futuras, ordenadas por nome. */
export async function turmasAtivas(opcoes: OpcoesChamada = {}): Promise<Turma[]> {
  const lista = await ebaFetch<EbaClassListApi>('ClassEBA?page-size=100', {
    cache: { revalidate: 600, tags: ['eba-testes'] },
    ...opcoes,
  });
  return lista.data
    .filter((c) => c.codStatus !== STATUS_CONCLUIDA)
    .map((c) => ({ id: c.id, nome: c.name }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Acorda o banco da API (ele pausa quando fica ocioso): um GET leve e sem cache, cujo resultado é
 * descartado. Lança como qualquer chamada; quem chama ignora o erro.
 */
export async function aquecerApi(opcoes: OpcoesChamada = {}): Promise<void> {
  await ebaFetch<unknown>('ClassEBA?page-size=1', { ...opcoes });
}
