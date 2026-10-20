import type { RefCallback } from 'react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PARES_ESTILO } from '@/lib/eba-api/conteudo-local';
import type { ItemResultado, Resultado as ResultadoApi } from '@/lib/eba-api/respostas';
import { proximoTeste, type DefinicaoTeste } from '@/lib/eba-api/testes';
import styles from './Questionario.module.css';

export interface ResultadoProps {
  teste: DefinicaoTeste;
  resultado: ResultadoApi;
  emailMascarado: string | null;
  saiu: boolean;
  onSair: () => void;
  tituloRef?: RefCallback<HTMLElement>;
}

/** Proporção 0–100 do total sobre o máximo do teste; máximo 0 (nada marcado) → 0. */
const proporcao = (total: number, maximo: number) => (maximo > 0 ? Math.round((total / maximo) * 100) : 0);

/** Nota de 1 a 5 em 7 pares: a soma de cada eixo vai de 7 a 35. */
const MAXIMO_EIXO = PARES_ESTILO.motivacao.length * 5;

function Mensagem({ item }: { item: ItemResultado | undefined }) {
  if (!item?.mensagem) return null;
  return (
    <div className={styles.parte}>
      <h3 className={styles.titulo4}>{item.nome}</h3>
      <p className={styles.texto}>{item.mensagem}</p>
    </div>
  );
}

function Pontuacao({ itens, maximo, porcentagem }: { itens: ItemResultado[]; maximo: number; porcentagem: boolean }) {
  return (
    <>
      <p className={styles.texto}>
        {porcentagem
          ? 'A porcentagem mostra quanto de cada temperamento aparece em você. O primeiro é o seu temperamento predominante.'
          : `Cada dom vai de 0 a ${maximo}. Os três primeiros são os seus pontos de partida para a consultoria do CDV.`}
      </p>
      <ol role="list" className={styles.resultado}>
        {itens.map((item, i) => {
          const largura = proporcao(item.total, maximo);
          return (
            <li key={item.nome} data-destaque={i < 3} className={i < 3 ? styles.destaque : undefined}>
              <span className={styles.resultadoNome}>{item.nome}</span>
              <span className={styles.resultadoBarra} aria-hidden="true">
                <span data-barra style={{ width: `${largura}%` }} />
              </span>
              <span className={styles.resultadoValor}>
                {porcentagem ? (
                  `${largura}%`
                ) : (
                  <>
                    {item.total}
                    <span className="visually-hidden"> de {maximo}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <Mensagem item={itens[0]} />
    </>
  );
}

function Talentos({ itens }: { itens: ItemResultado[] }) {
  const escolhidos = itens.filter((item) => item.total > 0);
  return (
    <>
      <p className={styles.texto}>Estas são as habilidades que você escolheu como as mais fortes.</p>
      <ul role="list" className={styles.talentos}>
        {escolhidos.map((item) => (
          <li key={item.nome}>{item.nome}</li>
        ))}
      </ul>
      <Mensagem item={escolhidos[0]} />
    </>
  );
}

function Estilo({ resultado }: { resultado: Extract<ResultadoApi, { tipo: 'estilo' }> }) {
  return (
    <>
      <div className={styles.parte}>
        <h3 className={styles.titulo4}>{resultado.combinacao}</h3>
        {resultado.descricao && <p className={styles.texto}>{resultado.descricao}</p>}
      </div>
      <dl className={styles.formato}>
        <div>
          <dt>Motivação</dt>
          <dd>
            {resultado.motivacao} de {MAXIMO_EIXO}
          </dd>
        </div>
        <div>
          <dt>Organização</dt>
          <dd>
            {resultado.organizacao} de {MAXIMO_EIXO}
          </dd>
        </div>
      </dl>
    </>
  );
}

function Conteudo({ teste, resultado }: { teste: DefinicaoTeste; resultado: Exclude<ResultadoApi, { tipo: 'sem-resultado' }> }) {
  if (resultado.tipo === 'estilo') return <Estilo resultado={resultado} />;
  if (teste.tipo === 'talentos') return <Talentos itens={resultado.itens} />;
  return <Pontuacao itens={resultado.itens} maximo={resultado.maximo} porcentagem={teste.tipo === 'temperamento'} />;
}

/**
 * Resultado do teste: itens em ordem (já vêm ordenados), próximo teste e "Sair".
 * `sem-resultado`: a API gravou as respostas, mas o resultado não pôde ser lido; sem "Tentar de novo".
 */
export function Resultado({ teste, resultado, emailMascarado, saiu, onSair, tituloRef }: ResultadoProps) {
  const proximo = proximoTeste(teste.slug);
  const semResultado = resultado.tipo === 'sem-resultado';
  return (
    <>
      <h2 ref={tituloRef} tabIndex={-1} className={styles.subtitulo}>
        {semResultado ? 'Respostas enviadas' : 'Seu resultado'}
      </h2>
      {semResultado ? (
        <p className={styles.texto}>Suas respostas foram enviadas para a equipe da EBA. Não conseguimos mostrar o resultado agora.</p>
      ) : (
        <>
          <Conteudo teste={teste} resultado={resultado} />
          <p className={styles.texto}>Seu resultado foi enviado para a equipe da EBA.</p>
        </>
      )}
      <div className={styles.botoes}>
        {proximo && <ButtonLink href={`/eba/testes/${proximo.slug}`}>{`Próximo teste: ${proximo.nome}`}</ButtonLink>}
        <ButtonLink href="/eba/testes" estilo="contorno">
          Ver todos os testes
        </ButtonLink>
      </div>
      {saiu ? (
        <p role="status" className={styles.sair}>
          Você saiu. Para fazer outro teste, informe seu e-mail de novo.
        </p>
      ) : (
        emailMascarado && (
          <p className={styles.sair}>
            Usou um aparelho emprestado?{' '}
            <button type="button" className={styles.link} onClick={onSair}>
              Sair
            </button>
          </p>
        )
      )}
    </>
  );
}
