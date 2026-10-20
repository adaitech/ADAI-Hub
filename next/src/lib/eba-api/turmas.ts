import 'server-only';
import { ebaFetch } from './client';
import type { EbaClassListApi } from './tipos';

export interface Turma {
  id: string;
  nome: string;
}

/** `codStatus` 3 = Completed. */
const STATUS_CONCLUIDA = 3;

/** Turmas em andamento ou futuras, ordenadas por nome. */
export async function turmasAtivas(): Promise<Turma[]> {
  const lista = await ebaFetch<EbaClassListApi>('ClassEBA?page-size=100', {
    cache: { revalidate: 600, tags: ['eba-testes'] },
  });
  return lista.data
    .filter((c) => c.codStatus !== STATUS_CONCLUIDA)
    .map((c) => ({ id: c.id, nome: c.name }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
