import { redirect } from 'next/navigation';
import { GerenciarTurmas } from '@/components/eba/Equipe/GerenciarTurmas';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { listarTurmas, SessaoEncerrada, type TurmaEquipe } from '@/lib/eba-api/equipe';
import { apagarTurmaAcao, criarTurmaAcao, editarTurmaAcao } from '../acoes';

/** /eba/equipe/turmas — listar, criar, editar e apagar turmas (apagar pede confirmação e não vale para turma com alunos). */
export default async function TurmasPage() {
  const sessao = await exigirSessaoDaEquipe();
  let turmas: TurmaEquipe[] | null = null;
  try {
    turmas = await listarTurmas(sessao.accessToken);
  } catch (erro) {
    if (erro instanceof SessaoEncerrada) redirect('/eba/equipe/login?motivo=sessao');
    console.warn(`[eba-equipe] turmas: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
  return (
    <section className={styles.secao} aria-labelledby="turmas-titulo" data-section="equipe-turmas">
      <h1 id="turmas-titulo" className={styles.titulo}>
        Turmas
      </h1>
      {turmas ? (
        <GerenciarTurmas turmas={turmas} acoes={{ criar: criarTurmaAcao, editar: editarTurmaAcao, apagar: apagarTurmaAcao }} />
      ) : (
        <p role="alert" className={styles.vazio}>
          Não conseguimos carregar as turmas agora. Tente em alguns minutos.
        </p>
      )}
    </section>
  );
}
