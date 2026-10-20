import { ButtonLink } from '@/components/ui/ButtonLink';
import type { TesteView } from '@/lib/eba/types';
import styles from './ListaTestesSection.module.css';

export interface ListaTestesProps {
  id: string;
  titulo: string;
  textoApoio?: string;
  atalhos: boolean;
  testes: TesteView[];
  /** 1 quando a seção abre a página: testes em h2 e partes em h3. */
  nivelTitulo: 1 | 2;
}

/** Apresentação da lista (sem fetch): cabeçalho, atalhos e um bloco por teste. Sem testes → nada. */
export function ListaTestes({ id, titulo, textoApoio, atalhos, testes, nivelTitulo }: ListaTestesProps) {
  if (testes.length === 0) return null;
  const Titulo = nivelTitulo === 1 ? 'h1' : 'h2';
  const tituloId = `lista-testes-${id}-titulo`;

  return (
    // Uma lista por página: `os-testes` é a âncora do botão "Ver os testes".
    <section id="os-testes" className={styles.secao} aria-labelledby={tituloId} data-section="lista-testes">
      <div className={styles.intro}>
        <Titulo id={tituloId} className={styles.titulo}>
          {titulo}
        </Titulo>
        {textoApoio && <p className={styles.apoio}>{textoApoio}</p>}
        {atalhos && (
          <nav aria-label="Ir para o teste">
            <ul role="list" className={styles.atalhos}>
              {testes.map((teste) => (
                <li key={teste.slug}>
                  <a href={`#${teste.slug}`} className={styles.atalho}>
                    {teste.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <div className={styles.testes}>
        {testes.map((teste, i) => (
          <BlocoTeste key={teste.slug} teste={teste} posicao={i + 1} total={testes.length} nivel={nivelTitulo === 1 ? 2 : 3} />
        ))}
      </div>
    </section>
  );
}

/** Bloco de um teste. `nivel` = título do teste (2 ou 3); as partes ficam um nível abaixo. */
function BlocoTeste({ teste, posicao, total, nivel }: { teste: TesteView; posicao: number; total: number; nivel: 2 | 3 }) {
  const Nome = nivel === 2 ? 'h2' : 'h3';
  const Parte = nivel === 2 ? 'h3' : 'h4';
  const nomeId = `teste-${teste.slug}-titulo`;
  const formato = [
    ['Perguntas', teste.perguntas],
    ['Resposta', teste.resposta],
  ].filter((par): par is [string, string] => Boolean(par[1]));
  const partes = [
    { titulo: 'O que é', texto: teste.oQueE },
    { titulo: teste.itensTitulo ?? 'O que o teste avalia', itens: teste.itens },
    { titulo: 'Como responder', texto: teste.comoResponder },
    { titulo: 'Como ler o resultado', texto: teste.comoLerResultado },
  ].filter((parte) => parte.texto || (parte.itens && parte.itens.length > 0));

  return (
    <article id={teste.slug} className={styles.teste} aria-labelledby={nomeId}>
      <div className={styles.abertura}>
        <p className={styles.numero}>
          <span>
            Teste {posicao} de {total}
          </span>
          {teste.aula && <span>{teste.aula} do CDV</span>}
        </p>
        <Nome id={nomeId} className={styles.nome}>
          {teste.nome}
        </Nome>
        <p className={styles.resumo}>{teste.resumo}</p>
        {formato.length > 0 && (
          <dl className={styles.formato}>
            {formato.map(([rotulo, valor]) => (
              <div key={rotulo} className={styles.formatoItem}>
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        )}
        {teste.link && (
          <div className={styles.acoes}>
            <ButtonLink href={teste.link}>
              Fazer o teste<span className="visually-hidden"> de {teste.nome}</span>
            </ButtonLink>
          </div>
        )}
      </div>
      {partes.length > 0 && (
        <div className={styles.partes}>
          {partes.map((parte) => (
            <div key={parte.titulo} className={styles.parte}>
              <Parte className={styles.parteTitulo}>{parte.titulo}</Parte>
              {parte.texto && <p className={styles.parteTexto}>{parte.texto}</p>}
              {parte.itens && (
                <ul role="list" className={styles.etiquetas}>
                  {parte.itens.map((item, i) => (
                    <li key={`${i}-${item}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
