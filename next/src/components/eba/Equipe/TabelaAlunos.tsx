import Link from 'next/link';
import styles from './Equipe.module.css';

export interface LinhaDeAluno {
  id: string;
  nome: string;
  email: string;
  unidade: string;
  turma: string;
}

/**
 * Tabela de alunos (busca e lista): só apresenta. O detalhe abre por id do aluno (identificador da API), nunca
 * por e-mail ou nome, para a URL não carregar dado pessoal.
 */
export function TabelaAlunos({ alunos, legenda }: { alunos: LinhaDeAluno[]; legenda: string }) {
  if (alunos.length === 0) return <p className={styles.vazio}>Nenhum aluno encontrado.</p>;
  return (
    <div className={styles.rolagem}>
      <table className={styles.tabela}>
        <caption>{legenda}</caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Turma</th>
            <th scope="col">Unidade</th>
            <th scope="col">
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id}>
              <th scope="row">{aluno.nome || '—'}</th>
              <td>{aluno.email || '—'}</td>
              <td>{aluno.turma}</td>
              <td>{aluno.unidade || '—'}</td>
              <td>
                <Link href={`/eba/equipe/consultas/${aluno.id}`}>
                  Ver resultado<span className="visually-hidden"> de {aluno.nome || 'aluno sem nome'}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
