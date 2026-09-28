'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { queryDosControles } from '@/lib/showcase/controles';
import type { ControleInfo, ValoresControles } from '@/lib/showcase/types';
import { ViewportFrame } from './ViewportFrame';
import styles from './vitrine-parts.module.css';

export interface VarianteInfo {
  nome: string;
  titulo: string;
  descricao?: string;
  data: unknown;
  /** Estado de cada controle nesta variação (valor inicial). */
  padrao: ValoresControles;
}

interface VariantesTabsProps {
  slug: string;
  nomeComponente: string;
  /** Texto do "ver JSON" (JSON do Strapi para seções; props para UI). */
  rotuloJson: string;
  variantes: VarianteInfo[];
  controles: ControleInfo[];
}

/**
 * Exemplos em abas + controles (liga/desliga e opções) que mudam o JSON como o editor faria
 * no Strapi. O preview no iframe recebe os controles pela URL.
 */
export function VariantesTabs({ slug, nomeComponente, rotuloJson, variantes, controles }: VariantesTabsProps) {
  const base = useId();
  const [ativa, setAtiva] = useState(0);
  const [valores, setValores] = useState<ValoresControles>(variantes[0]?.padrao ?? {});
  const [dados, setDados] = useState<{ src: string; json: unknown } | null>(null);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);

  const variante = variantes[ativa];
  const query = queryDosControles(valores, variante.padrao);
  const src = `/componentes/preview/${slug}?variante=${encodeURIComponent(variante.nome)}${query ? `&${query}` : ''}`;
  const alterado = query !== '';

  // O JSON recebido vale só para o src atual; ao trocar de aba/controle, mostra o original até o iframe responder.
  const jsonVisivel = dados && dados.src === src ? dados.json : alterado ? null : variante.data;

  const selecionar = (indice: number, focar = false) => {
    setAtiva(indice);
    setValores(variantes[indice].padrao);
    setDados(null);
    if (focar) abasRef.current[indice]?.focus();
  };

  const navegarAbas = (event: KeyboardEvent<HTMLButtonElement>) => {
    const ultimo = variantes.length - 1;
    const destino = {
      ArrowRight: ativa === ultimo ? 0 : ativa + 1,
      ArrowLeft: ativa === 0 ? ultimo : ativa - 1,
      Home: 0,
      End: ultimo,
    }[event.key];
    if (destino === undefined) return;
    event.preventDefault();
    selecionar(destino, true);
  };

  const mudar = (id: string, valor: string | boolean) => {
    setValores((atual) => ({ ...atual, [id]: valor }));
    setDados(null);
  };

  const idAba = (nome: string) => `${base}-aba-${nome}`;
  const idPainel = `${base}-painel`;

  return (
    <div className={styles.abas}>
      <div role="tablist" aria-label={`Exemplos de ${nomeComponente}`} className={styles.listaAbas}>
        {variantes.map((v, i) => (
          <button
            key={v.nome}
            ref={(el) => {
              abasRef.current[i] = el;
            }}
            id={idAba(v.nome)}
            type="button"
            role="tab"
            aria-selected={i === ativa}
            aria-controls={idPainel}
            tabIndex={i === ativa ? 0 : -1}
            className={styles.aba}
            onClick={() => selecionar(i)}
            onKeyDown={navegarAbas}
          >
            {v.titulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={idPainel} aria-labelledby={idAba(variante.nome)} className={styles.painel}>
        {variante.descricao && <p className={styles.painelDescricao}>{variante.descricao}</p>}

        {controles.length > 0 && (
          <fieldset className={styles.controlesComponente}>
            <legend className={styles.controlesTitulo}>Controles</legend>
            <div className={styles.controlesLista}>
              {controles.map((controle) =>
                controle.tipo === 'alternar' ? (
                  <div key={controle.id} className={styles.controle}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={valores[controle.id] === true}
                      aria-describedby={controle.ajuda ? `${base}-ajuda-${controle.id}` : undefined}
                      className={styles.interruptor}
                      onClick={() => mudar(controle.id, valores[controle.id] !== true)}
                    >
                      <span className={styles.trilhaInterruptor} aria-hidden="true" />
                      {controle.rotulo}
                    </button>
                    {controle.ajuda && (
                      <p id={`${base}-ajuda-${controle.id}`} className={styles.ajuda}>
                        {controle.ajuda}
                      </p>
                    )}
                  </div>
                ) : (
                  <fieldset
                    key={controle.id}
                    className={styles.controle}
                    aria-describedby={controle.ajuda ? `${base}-ajuda-${controle.id}` : undefined}
                  >
                    <legend className={styles.controleRotulo}>{controle.rotulo}</legend>
                    <div className={styles.opcoes}>
                      {controle.opcoes.map((opcao) => (
                        <label key={opcao.valor} className={styles.opcao}>
                          <input
                            type="radio"
                            name={`${base}-${controle.id}`}
                            value={opcao.valor}
                            checked={valores[controle.id] === opcao.valor}
                            onChange={() => mudar(controle.id, opcao.valor)}
                            className="visually-hidden"
                          />
                          <span>{opcao.rotulo}</span>
                        </label>
                      ))}
                    </div>
                    {controle.ajuda && (
                      <p id={`${base}-ajuda-${controle.id}`} className={styles.ajuda}>
                        {controle.ajuda}
                      </p>
                    )}
                  </fieldset>
                ),
              )}
            </div>
            {alterado && (
              <button type="button" className={styles.restaurar} onClick={() => selecionar(ativa)}>
                Voltar ao exemplo original
              </button>
            )}
          </fieldset>
        )}

        <ViewportFrame
          src={src}
          titulo={`${nomeComponente} — ${variante.titulo}`}
          onDados={(json) => setDados({ src, json })}
        />

        <details className={styles.json}>
          <summary>
            {rotuloJson}
            {alterado && ' (com os controles)'}
          </summary>
          <pre tabIndex={0} aria-label={rotuloJson}>
            <code>{jsonVisivel === null ? 'Carregando…' : JSON.stringify(jsonVisivel, null, 2)}</code>
          </pre>
        </details>
      </div>
    </div>
  );
}
