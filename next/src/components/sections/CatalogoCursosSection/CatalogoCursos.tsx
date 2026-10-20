import { CardCurso } from '@/components/ui/CardCurso';
import { TextLink } from '@/components/ui/TextLink';
import { EMAIL_EBA } from '@/lib/eba/contato';
import type { CursoResumoView } from '@/lib/eba/types';
import styles from './CatalogoCursosSection.module.css';

export interface CatalogoCursosProps {
  id: string;
  titulo: string;
  textoApoio?: string;
  cursos: CursoResumoView[];
  verTodos: boolean;
  /** 1 quando a seção abre a página (os cards viram h2). */
  nivelTitulo: 1 | 2;
  /** Sem cursos: mostra "Novos cursos em breve" em vez de sumir. */
  mostrarVazio: boolean;
  /** E-mail do estado vazio (padrão: o da EBA). */
  contato?: string;
}

/** Apresentação do catálogo (sem fetch): título, apoio, "Ver todos" e a grade de cards. */
export function CatalogoCursos({ id, titulo, textoApoio, cursos, verTodos, nivelTitulo, mostrarVazio, contato = EMAIL_EBA }: CatalogoCursosProps) {
  if (cursos.length === 0 && !mostrarVazio) return null;
  const Titulo = nivelTitulo === 1 ? 'h1' : 'h2';
  const tituloId = `catalogo-cursos-${id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="catalogo-cursos">
      <div className={styles.topo}>
        <div className={styles.intro}>
          <Titulo id={tituloId} className={styles.titulo}>
            {titulo}
          </Titulo>
          {textoApoio && <p className={styles.apoio}>{textoApoio}</p>}
        </div>
        {verTodos && cursos.length > 0 && <TextLink href="/eba/cursos">Ver todos os cursos</TextLink>}
      </div>
      {cursos.length > 0 ? (
        <ul role="list" className={styles.grade}>
          {cursos.map((curso) => (
            <li key={curso.slug}>
              <CardCurso curso={curso} nivelTitulo={nivelTitulo === 1 ? 2 : 3} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.vazio}>
          <p className={styles.vazioTitulo}>Novos cursos em breve</p>
          <p>
            Enquanto isso, fale com a equipe da EBA da sua unidade ou escreva para{' '}
            <a href={`mailto:${contato}`}>{contato}</a>.
          </p>
        </div>
      )}
    </section>
  );
}
