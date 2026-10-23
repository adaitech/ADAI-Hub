import { notFound, redirect } from 'next/navigation';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { curso, type AulaView } from '@/lib/eba/aula';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { listarAulasDoCurso } from '@/lib/strapi/queries/aulas';

interface PageProps {
  params: Promise<{ curso: string }>;
}

/** /eba/equipe/aulas/<curso> — abre a primeira aula do curso (como o menu do site atual). Curso desconhecido → 404. */
export default async function AulasDoCursoPage({ params }: PageProps) {
  await exigirSessaoDaEquipe();
  const cursoDaPagina = curso((await params).curso);
  if (!cursoDaPagina) notFound();

  let aulas: AulaView[] | null = null;
  try {
    aulas = await listarAulasDoCurso(cursoDaPagina.slug);
  } catch (erro) {
    // Só a classe do erro. Sem `STRAPI_API_TOKEN` o Strapi recusa o tipo privado `aula`.
    console.warn(`[eba-equipe] aulas: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
  if (aulas && aulas.length > 0) redirect(`/eba/equipe/aulas/${cursoDaPagina.slug}/${aulas[0].endereco}`);

  return (
    <section className={styles.secao} aria-labelledby="aulas-titulo" data-section="equipe-aulas">
      <h1 id="aulas-titulo" className={styles.titulo}>
        {cursoDaPagina.rotulo}
      </h1>
      {aulas ? (
        <p className={styles.vazio}>Nenhuma aula publicada neste curso ainda.</p>
      ) : (
        <p role="alert" className={styles.vazio}>
          Não conseguimos carregar as aulas agora. Tente em alguns minutos.
        </p>
      )}
    </section>
  );
}
