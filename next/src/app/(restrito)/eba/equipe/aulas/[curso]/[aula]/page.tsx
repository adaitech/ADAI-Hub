import { notFound } from 'next/navigation';
import { AulasDoCurso } from '@/components/eba/Equipe/AulasDoCurso';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { curso, type AulaView } from '@/lib/eba/aula';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { listarAulasDoCurso } from '@/lib/strapi/queries/aulas';

interface PageProps {
  params: Promise<{ curso: string; aula: string }>;
}

/**
 * /eba/equipe/aulas/<curso>/<aula> — o vídeo da aula e a lista de aulas do curso. Curso ou aula que não
 * existem (ou não estão publicados) → 404. As aulas vêm do Strapi (tipo privado, lido com token).
 */
export default async function AulaPage({ params }: PageProps) {
  await exigirSessaoDaEquipe();
  const { curso: slugDoCurso, aula: endereco } = await params;
  const cursoDaPagina = curso(slugDoCurso);
  if (!cursoDaPagina) notFound();

  let aulas: AulaView[] | null = null;
  try {
    aulas = await listarAulasDoCurso(cursoDaPagina.slug);
  } catch (erro) {
    console.warn(`[eba-equipe] aulas: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
  const atual = aulas?.find((a) => a.endereco === endereco) ?? null;
  if (aulas && !atual) notFound();

  return (
    <section className={styles.secao} aria-labelledby="aula-titulo" data-section="equipe-aulas">
      <h1 id="aula-titulo" className={styles.titulo}>
        {cursoDaPagina.rotulo}
      </h1>
      {aulas && atual ? (
        <AulasDoCurso nomeDoCurso={cursoDaPagina.nome} aulas={aulas} atual={atual} />
      ) : (
        <p role="alert" className={styles.vazio}>
          Não conseguimos carregar as aulas agora. Tente em alguns minutos.
        </p>
      )}
    </section>
  );
}
