import { eventosDaAgenda } from '@/lib/inchurch/eventos';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { getUnidadesInchurch } from '@/lib/strapi/queries/unidades';
import type { SectionProps } from '@/types/sections';
import { AgendaEventosListaClient } from './AgendaEventosListaClient';
import { normalizeAgendaEventos } from './normalize';
import type { AgendaEventosData, AgendaEventosView } from './types';
import styles from './AgendaEventosSection.module.css';

interface AgendaEventosProps {
  view: AgendaEventosView;
  index: number;
  id: number;
}

/** Apresentação da agenda: recebe apenas um view model já combinado no servidor. */
export function AgendaEventos({ view, index, id }: AgendaEventosProps) {
  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `agenda-eventos-${id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="agenda-eventos">
      <div className={styles.intro}>
        <Titulo id={tituloId} className={styles.tituloSecao}>
          {view.titulo}
        </Titulo>
      </div>
      {view.cards.length > 0 ? (
        <AgendaEventosListaClient view={view} sectionId={`agenda-eventos-${id}`} />
      ) : (
        <p className={styles.vazio}>{view.mensagemVazia}</p>
      )}
    </section>
  );
}

/**
 * Strapi define os textos; inChurch define eventos; Unidades do Strapi associam as badges.
 * Falha sem cache da inChurch oculta a seção; resposta válida vazia mostra a cópia editorial.
 */
export async function AgendaEventosSection({ data, index }: SectionProps<AgendaEventosData>) {
  const unidades = await getUnidadesInchurch();
  const dados = await getEventosInchurch(unidades.map((unidade) => unidade.igrejaId));
  if (!dados) return null;

  const view = normalizeAgendaEventos(data, eventosDaAgenda(dados), unidades);
  return <AgendaEventos view={view} index={index} id={data.id} />;
}
