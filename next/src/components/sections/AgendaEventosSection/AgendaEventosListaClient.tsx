'use client';

import { useEffect, useMemo, useState } from 'react';
import { registrarEvento } from '@/lib/analytics/datalayer';
import { AgendaEventoCard } from './AgendaEventoCard';
import styles from './AgendaEventosSection.module.css';
import type { AgendaEventoCardView, AgendaEventosView } from './types';

function textoParaBusca(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

/** Filtros locais: título e descrição sem diferenciar caixa ou acentos. */
export function filtrarEventosDaAgenda(
  cards: AgendaEventoCardView[],
  { unidadeId, busca }: { unidadeId: number | null; busca: string },
): AgendaEventoCardView[] {
  const termo = textoParaBusca(busca);
  return cards.filter((card) => {
    const ids = card.unidadeIds ?? (card.unidadeId === null ? [] : [card.unidadeId]);
    const correspondeUnidade = unidadeId === null || ids.length === 0 || ids.includes(unidadeId);
    const conteudo = textoParaBusca(`${card.titulo} ${card.descricao ?? ''}`);
    return correspondeUnidade && (!termo || conteudo.includes(termo));
  });
}

interface AgendaEventosListaClientProps {
  view: AgendaEventosView;
  sectionId: string;
}

/** Interação local dos filtros; eventos chegam completos do Server Component, sem nova requisição. */
export function AgendaEventosListaClient({ view, sectionId }: AgendaEventosListaClientProps) {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [busca, setBusca] = useState('');
  const unidadeId = unidadeSelecionada ? Number(unidadeSelecionada) : null;
  const cards = useMemo(() => filtrarEventosDaAgenda(view.cards, { unidadeId, busca }), [busca, unidadeId, view.cards]);
  const filtrosAtivos = Boolean(unidadeSelecionada || busca.trim());

  useEffect(() => {
    const termo = textoParaBusca(busca);
    if (termo.length < 3) return;
    const timer = setTimeout(() => registrarEvento('buscar_evento', { caracteres: Math.min(termo.length, 100), resultados: cards.length }), 1000);
    return () => clearTimeout(timer);
  }, [busca, cards.length]);

  function selecionarUnidade(valor: string) {
    setUnidadeSelecionada(valor);
    registrarEvento('filtrar_agenda', { filtro: 'unidade', valor_filtro: view.unidades.find((u) => String(u.igrejaId) === valor)?.nome ?? 'Todas as unidades',
      resultados: filtrarEventosDaAgenda(view.cards, { unidadeId: valor ? Number(valor) : null, busca }).length });
  }

  function limparFiltros() {
    setUnidadeSelecionada('');
    setBusca('');
    registrarEvento('filtrar_agenda', { filtro: 'unidade', valor_filtro: 'Todas as unidades', resultados: view.cards.length });
  }

  return (
    <>
      <form className={styles.filtros} aria-label="Filtros de eventos" onSubmit={(event) => event.preventDefault()}>
        <div className={styles.campoFiltro}>
          <label className={styles.rotuloFiltro} htmlFor={`${sectionId}-unidade`}>
            Unidade
          </label>
          <select
            id={`${sectionId}-unidade`}
            className={styles.controleFiltro}
            value={unidadeSelecionada}
            onChange={(event) => selecionarUnidade(event.target.value)}
          >
            <option value="">Todas as unidades</option>
            {view.unidades.map((unidade) => (
              <option key={unidade.igrejaId} value={unidade.igrejaId}>
                {unidade.nome}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.campoFiltro}>
          <label className={styles.rotuloFiltro} htmlFor={`${sectionId}-busca`}>
            Buscar eventos
          </label>
          <input
            id={`${sectionId}-busca`}
            className={styles.controleFiltro}
            type="search"
            placeholder="Buscar eventos..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
      </form>

      {cards.length > 0 ? (
        <ul role="list" className={styles.lista} aria-label={`${view.titulo}: ${cards.length} ${cards.length === 1 ? 'evento' : 'eventos'}`}>
          {cards.map((card) => (
            <li key={card.id}>
              <AgendaEventoCard card={card} tituloId={`${sectionId}-evento-${card.id}-titulo`} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.vazioFiltros} role="status">
          <p>Nenhum evento encontrado com estes filtros.</p>
          {filtrosAtivos && (
            <button type="button" className={styles.limparFiltros} onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </>
  );
}
