import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DetalheAluno, type DetalheAlunoProps } from '@/components/eba/Equipe/DetalheAluno';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { alunoDaEquipe, idValido, listarTurmas, SessaoEncerrada } from '@/lib/eba-api/equipe';
import { resultadosDoAluno } from '@/lib/eba-api/resultados';

interface PageProps {
  params: Promise<{ idStudent: string }>;
}

/**
 * /eba/equipe/consultas/<id> — cadastro do aluno e o resultado dos testes já feitos. O `<id>` é o
 * identificador do aluno na API (não o e-mail nem o nome). Id que não é UUID ou aluno inexistente → 404.
 */
export default async function DetalheAlunoPage({ params }: PageProps) {
  const sessao = await exigirSessaoDaEquipe();
  const { idStudent } = await params;
  if (!idValido(idStudent)) notFound();

  let dados: DetalheAlunoProps | null = null;
  let inexistente = false;
  try {
    const aluno = await alunoDaEquipe(sessao.accessToken, idStudent);
    if (aluno) {
      const [turmas, resultados] = await Promise.all([listarTurmas(sessao.accessToken), resultadosDoAluno(idStudent, { bearer: sessao.accessToken })]);
      const turma = turmas.find((t) => t.id === aluno.idTurma)?.nome ?? 'Desconhecida';
      dados = { aluno: { nome: aluno.nome, email: aluno.email, unidade: aluno.unidade, turma }, resultados };
    } else {
      inexistente = true;
    }
  } catch (erro) {
    if (erro instanceof SessaoEncerrada) redirect('/eba/equipe/login?motivo=sessao');
    // Só a classe do erro: nada de aluno, e-mail ou token no log.
    console.warn(`[eba-equipe] detalhe: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
  if (inexistente) notFound();

  return (
    <section className={styles.secao} data-section="equipe-aluno">
      <p>
        <Link href="/eba/equipe/consultas">‹ Voltar às consultas</Link>
      </p>
      {dados ? (
        <DetalheAluno aluno={dados.aluno} resultados={dados.resultados} />
      ) : (
        <>
          <h1 className={styles.titulo}>Aluno</h1>
          <p role="alert" className={styles.vazio}>
            Não conseguimos carregar este aluno agora. Tente em alguns minutos.
          </p>
        </>
      )}
    </section>
  );
}
