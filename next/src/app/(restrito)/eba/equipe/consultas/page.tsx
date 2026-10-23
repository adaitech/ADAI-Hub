import { redirect } from 'next/navigation';
import { BuscaAlunos } from '@/components/eba/Equipe/BuscaAlunos';
import { Paginacao } from '@/components/eba/Equipe/Paginacao';
import { TabelaAlunos } from '@/components/eba/Equipe/TabelaAlunos';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { listarAlunos, listarTurmas, SessaoEncerrada } from '@/lib/eba-api/equipe';
import { buscarAlunosAcao } from '../acoes';

interface PageProps {
  searchParams: Promise<{ pagina?: string }>;
}

const POR_PAGINA = 20;

/** `?pagina=N` inteiro de 1 a 10000; qualquer outra coisa vira a página 1. */
const numeroDaPagina = (valor: string | undefined): number => {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
};

/**
 * /eba/equipe/consultas — busca por e-mail ou nome e lista de todos os alunos, paginada (o site atual
 * mostrava só os 10 primeiros). A busca roda numa Server Action: o que se digita não vai para a URL.
 */
export default async function ConsultasPage({ searchParams }: PageProps) {
  const sessao = await exigirSessaoDaEquipe();
  const pagina = numeroDaPagina((await searchParams).pagina);

  let lista: { linhas: Parameters<typeof TabelaAlunos>[0]['alunos']; totalPaginas: number; total: number } | null = null;
  try {
    const [alunos, turmas] = await Promise.all([listarAlunos(sessao.accessToken, { pagina, tamanho: POR_PAGINA }), listarTurmas(sessao.accessToken)]);
    const nomes = new Map(turmas.map((t) => [t.id, t.nome]));
    lista = {
      linhas: alunos.alunos.map((a) => ({ id: a.id, nome: a.nome, email: a.email, unidade: a.unidade, turma: nomes.get(a.idTurma) ?? 'Desconhecida' })),
      totalPaginas: alunos.totalPaginas,
      total: alunos.total,
    };
  } catch (erro) {
    if (erro instanceof SessaoEncerrada) redirect('/eba/equipe/login?motivo=sessao');
    // Só a classe do erro: nada de aluno, e-mail ou token no log.
    console.warn(`[eba-equipe] consultas: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }

  return (
    <section className={styles.secao} aria-labelledby="consultas-titulo" data-section="equipe-consultas">
      <h1 id="consultas-titulo" className={styles.titulo}>
        Consultas
      </h1>
      <BuscaAlunos acoes={{ buscar: buscarAlunosAcao }} />
      {lista ? (
        <>
          <TabelaAlunos alunos={lista.linhas} legenda={`Todos os alunos (${lista.total})`} />
          <Paginacao pagina={pagina} totalPaginas={lista.totalPaginas} base="/eba/equipe/consultas" />
        </>
      ) : (
        <p role="alert" className={styles.vazio}>
          Não conseguimos carregar a lista de alunos agora. Tente em alguns minutos.
        </p>
      )}
    </section>
  );
}
