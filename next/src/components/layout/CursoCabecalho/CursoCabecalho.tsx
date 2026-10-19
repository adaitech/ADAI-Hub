import Image from 'next/image';
import { AssistirVideo } from '@/components/sections/SerieAtualSection/AssistirVideo';
import { ButtonLink, buttonClassName } from '@/components/ui/ButtonLink';
import { Chips } from '@/components/ui/Chips';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import type { CursoView } from '@/lib/eba/types';
import styles from './CursoCabecalho.module.css';

export interface CursoCabecalhoProps {
  curso: CursoView;
  trilha: TrilhaItem[];
}

/** Âncora da seção Perguntas frequentes no corpo do curso. */
export const ANCORA_PERGUNTAS = 'perguntas-frequentes';

/**
 * Topo da página do curso (protótipo da EBA): trilha, vertente, h1, resumo, informações,
 * inscrição e capa. Montado pelos campos fixos do curso; não entra na dynamic zone.
 */
export function CursoCabecalho({ curso, trilha }: CursoCabecalhoProps) {
  const { inscricao, video } = curso;
  return (
    <div className={styles.cabecalho} data-section="curso-cabecalho">
      <Trilha itens={trilha} />
      <div className={styles.grade}>
        <div className={styles.texto}>
          <p className={styles.vertente}>{curso.rotuloVertente}</p>
          <h1 className={styles.titulo}>{curso.nome}</h1>
          <p className={styles.resumo}>{curso.resumo}</p>
          <Chips itens={curso.chips} />
          {(inscricao || curso.temPerguntasFrequentes || video) && (
            <div className={styles.acoes}>
              {inscricao && (
                <ButtonLink href={inscricao.href} novaAba={inscricao.novaAba} curso={curso.slug}>
                  {inscricao.label}
                </ButtonLink>
              )}
              {curso.temPerguntasFrequentes && (
                <ButtonLink href={`#${ANCORA_PERGUNTAS}`} estilo="contorno">
                  Perguntas frequentes
                </ButtonLink>
              )}
              {video && (
                <AssistirVideo video={video} titulo={`Apresentação do ${curso.nome}`} className={buttonClassName({ estilo: 'contorno' })}>
                  Assistir à apresentação<span className="visually-hidden"> do {curso.nome}</span>
                </AssistirVideo>
              )}
            </div>
          )}
          {inscricao?.novaAba && <p className={styles.aviso}>A inscrição abre em nova aba.</p>}
        </div>
        {curso.capa && (
          <Image
            className={styles.foto}
            src={curso.capa.url}
            alt={curso.capa.alt}
            width={curso.capa.width || 1600}
            height={curso.capa.height || 1066}
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading="eager"
            fetchPriority="high"
          />
        )}
      </div>
    </div>
  );
}

/** Bloco final "Pronto para começar?": repete a inscrição do curso. Sem inscrição → nada. */
export function CursoInscricao({ curso }: { curso: CursoView }) {
  const { inscricao } = curso;
  if (!inscricao) return null;
  const tituloId = `curso-inscricao-${curso.slug}-titulo`;
  return (
    <section className={styles.inscricao} aria-labelledby={tituloId} data-section="curso-inscricao">
      <div className={styles.inscricaoCaixa}>
        <h2 id={tituloId} className={styles.inscricaoTitulo}>
          Pronto para começar?
        </h2>
        <p className={styles.resumo}>Faça sua inscrição e a equipe da EBA entra em contato com os próximos passos.</p>
        <div className={styles.acoes}>
          <ButtonLink href={inscricao.href} novaAba={inscricao.novaAba} curso={curso.slug}>
            {inscricao.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
