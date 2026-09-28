import { getEditorGuide, type EditorGuide } from '@/lib/editor-guide';
import styles from './vitrine-parts.module.css';

interface EditorGuidePanelProps {
  guia: EditorGuide;
}

function TabelaCampos({ guia, nivel }: { guia: EditorGuide; nivel: number }) {
  return (
    <div className={styles.tabelaWrapper}>
      <table className={styles.tabela}>
        <caption className="visually-hidden">Campos de {guia.nome}</caption>
        <thead>
          <tr>
            <th scope="col">Campo no Strapi</th>
            <th scope="col">Onde aparece</th>
            <th scope="col">Como preencher</th>
            <th scope="col">Obrigatório</th>
            <th scope="col">Limite</th>
            <th scope="col">Exemplo</th>
          </tr>
        </thead>
        <tbody>
          {guia.campos.map((campo) => {
            const sub = campo.componente && nivel < 3 ? getEditorGuide(campo.componente) : null;
            return (
              <tr key={campo.campo}>
                <th scope="row">
                  {campo.label}
                  <code className={styles.uid}>{campo.campo}</code>
                </th>
                <td>{campo.ondeAparece}</td>
                <td>
                  {campo.descricao}
                  {sub && (
                    <details className={styles.sub}>
                      <summary>Campos de cada item ({sub.nome})</summary>
                      <TabelaCampos guia={sub} nivel={nivel + 1} />
                    </details>
                  )}
                </td>
                <td>{campo.obrigatorio ? 'Sim' : 'Não'}</td>
                <td>{campo.limite}</td>
                <td className={styles.exemplo}>{campo.exemplo || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** "Guia do editor": como preencher o componente no Strapi (fonte: strapi/src/editor-guide). */
export function EditorGuidePanel({ guia }: EditorGuidePanelProps) {
  return (
    <section aria-labelledby="guia-editor" className={styles.guia}>
      <h2 id="guia-editor" className={styles.guiaTitulo}>
        Guia do editor — {guia.nome}
      </h2>
      <p>{guia.resumo}</p>
      <p>
        <strong>Onde aparece:</strong> {guia.ondeAparece}
      </p>
      {guia.boasPraticas.length > 0 && (
        <>
          <h3 className={styles.guiaSubtitulo}>Boas práticas</h3>
          <ul className={styles.praticas}>
            {guia.boasPraticas.map((pratica) => (
              <li key={pratica}>{pratica}</li>
            ))}
          </ul>
        </>
      )}
      <h3 className={styles.guiaSubtitulo}>Campos</h3>
      <TabelaCampos guia={guia} nivel={1} />
    </section>
  );
}
