import type { ResultadoDoTeste } from '@/lib/eba-api/resultados';
import { ConteudoResultado } from '../Questionario/Resultado';
import styles from './Equipe.module.css';

export interface DetalheAlunoProps {
  aluno: { nome: string; email: string; unidade: string; turma: string };
  resultados: ResultadoDoTeste[];
}

/** Consulta interna de um aluno: dados do cadastro e o resultado dos testes já feitos (mesmo miolo da tela do aluno). */
export function DetalheAluno({ aluno, resultados }: DetalheAlunoProps) {
  return (
    <div className={styles.secao}>
      <h1 className={styles.titulo}>{aluno.nome || 'Aluno sem nome'}</h1>
      <dl className={styles.dados}>
        <div>
          <dt>E-mail</dt>
          <dd>{aluno.email || '—'}</dd>
        </div>
        <div>
          <dt>Turma</dt>
          <dd>{aluno.turma}</dd>
        </div>
        <div>
          <dt>Unidade</dt>
          <dd>{aluno.unidade || '—'}</dd>
        </div>
      </dl>
      {resultados.length === 0 ? (
        <p className={styles.vazio}>Este aluno ainda não fez nenhum teste.</p>
      ) : (
        resultados.map(({ teste, resultado }) => (
          <section key={teste.slug} className={styles.secao} aria-labelledby={`teste-${teste.slug}`}>
            <h2 id={`teste-${teste.slug}`} className={styles.linha}>
              {teste.nome}
            </h2>
            <ConteudoResultado teste={teste} resultado={resultado} />
          </section>
        ))
      )}
    </div>
  );
}
