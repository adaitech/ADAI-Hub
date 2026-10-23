'use client';

import Image, { getImageProps } from 'next/image';
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { preload } from 'react-dom';
import { buttonClassName } from '@/components/ui/ButtonLink';
import type { aquecer, cadastrar, carregarPerguntas, confirmarCodigo, enviar, pedirCodigo, retomarCadastro, sair } from '@/app/(site)/eba/testes/[slug]/acoes';
import { registrarEvento } from '@/lib/analytics/datalayer';
import type { Pergunta } from '@/lib/eba-api/perguntas';
import { TESTES, type DefinicaoTeste } from '@/lib/eba-api/testes';
import { fotoDoTeste, type MomentoFoto } from '@/lib/eba/fotos-testes';
import {
  chaveProgresso,
  criarEstado,
  lerProgresso,
  MAXIMO_ESCOLHIDAS,
  paginaTemperamento,
  parEstilo,
  podeEnviar,
  progressoDe,
  progressoPertenceA,
  reducer,
  respondidas,
  respostasParaApi,
  telasDoTeste,
  temProgresso,
  type EstadoQuestionario,
  type SessaoTela,
} from './estado';
import { TextoEspera, useEsperaLonga } from './AvisoDeEspera';
import { Cadastro, ConfirmarCodigo, Identificacao } from './Identificacao';
import { PerguntaEstilo } from './PerguntaEstilo';
import { PerguntaMarcar } from './PerguntaMarcar';
import { PerguntaNota } from './PerguntaNota';
import { Resultado } from './Resultado';
import styles from './Questionario.module.css';

export type { Estado } from './estado';
export { chaveProgresso, reducer } from './estado';

export interface QuestionarioProps {
  teste: DefinicaoTeste;
  abertura: { resumo: string; perguntas: string | null; resposta: string | null; comoResponder: string | null; aula: string | null };
  perguntas: Pergunta[];
  sessao: SessaoTela | null;
  /**
   * A API falhou ao buscar as perguntas no servidor (API fria passa dos 10 s da página): a abertura
   * aparece e "Começar" tenta de novo pela ação `carregarPerguntas` (45 s).
   */
  perguntasIndisponiveis?: boolean;
  /** `EBA_RESULTADO_SEGREDO` configurado: o resultado oferece o link por e-mail. */
  linkResultado?: boolean;
  acoes: {
    pedirCodigo: typeof pedirCodigo;
    confirmarCodigo: typeof confirmarCodigo;
    retomarCadastro: typeof retomarCadastro;
    cadastrar: typeof cadastrar;
    enviar: typeof enviar;
    sair: typeof sair;
    carregarPerguntas: typeof carregarPerguntas;
    /** Acorda a API ao abrir (opcional: a vitrine não aquece). */
    aquecer?: typeof aquecer;
  };
  /**
   * Só para a vitrine: abre direto num estado. Nesse modo a tela não lê nem grava o
   * `sessionStorage` e não envia eventos ao DataLayer.
   */
  estadoInicial?: Partial<EstadoQuestionario>;
}

const ROTULO_TELA = { nota: 'Pergunta', estilo: 'Pergunta', talentos: 'Etapa', temperamento: 'Página' } as const;
const UNIDADE_TELA = { nota: 'perguntas', estilo: 'perguntas', talentos: 'etapas', temperamento: 'páginas' } as const;
/** Onde aparece "Respondendo como … · Trocar e-mail" (na abertura, antes de responder num aparelho emprestado). */
const COM_SESSAO_VISIVEL = new Set(['abertura', 'pergunta', 'erro']);
/** Largura da foto na tela: coluna de 45% no desktop, largura toda no celular (a foto da capa é o LCP). */
const TAMANHOS_FOTO = '(min-width: 1024px) 45vw, 100vw';

function Progresso({ atual, total, rotulo }: { atual: number; total: number; rotulo: string }) {
  const porcentagem = Math.round((atual / total) * 100);
  return (
    <div className={styles.progresso}>
      <p className={styles.progressoTexto}>
        <span>{`${rotulo} ${atual} de ${total}`}</span>
        <span>{`${porcentagem}%`}</span>
      </p>
      <div className={styles.barra} role="progressbar" aria-label="Progresso do teste" aria-valuemin={0} aria-valuemax={total} aria-valuenow={atual}>
        <span style={{ width: `${porcentagem}%` }} />
      </div>
    </div>
  );
}

function momentoDaFoto(s: EstadoQuestionario): MomentoFoto {
  switch (s.estado) {
    case 'abertura':
      return 'capa';
    case 'email':
    case 'codigo':
    case 'cadastro':
    case 'expirou':
      return 'identificacao';
    case 'pergunta':
      return { pergunta: s.passo + 1 };
    default:
      return 'resultado';
  }
}

/**
 * Tela de um teste do CDV (ilha cliente): abertura → identificação → perguntas → envio → resultado.
 * Progresso no `sessionStorage` (só respostas, por slug); dados pessoais só no servidor.
 */
export function Questionario({
  teste,
  abertura,
  perguntas: perguntasIniciais,
  sessao,
  perguntasIndisponiveis = false,
  linkResultado = false,
  acoes,
  estadoInicial,
}: QuestionarioProps) {
  const id = useId();
  const demonstracao = estadoInicial !== undefined;
  const [s, dispatch] = useReducer(reducer, undefined, () => ({ ...criarEstado({ tipo: teste.tipo, perguntas: perguntasIniciais, sessao }), ...estadoInicial }));
  const [semPerguntas, setSemPerguntas] = useState(false);
  // Perguntas da renderização ou, se a API estava fria, as que `carregarPerguntas` trouxe depois.
  const [perguntas, setPerguntas] = useState(perguntasIniciais);
  const [indisponiveis, setIndisponiveis] = useState(perguntasIndisponiveis);
  const [preparando, setPreparando] = useState(false);
  const esperaLonga = useEsperaLonga(preparando || s.estado === 'enviando');
  const chave = chaveProgresso(teste.slug);

  // Foco: vai para o enunciado (ou o título do estado) a cada troca de pergunta ou de estado.
  const foco = useRef<HTMLElement | null>(null);
  const focar = useCallback((el: HTMLElement | null) => {
    foco.current = el;
  }, []);
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    foco.current?.focus();
  }, [s.estado, s.passo]);

  // Progresso: lê uma vez a chave deste teste; depois grava a cada resposta e apaga no resultado
  // ou quando não há mais progresso (trocar e-mail, respostas de outra pessoa descartadas).
  function restaurarProgresso(lista: Pergunta[]) {
    let salvo: string | null = null;
    try {
      salvo = sessionStorage.getItem(chave);
    } catch {
      // Storage bloqueado (modo privado, política do navegador): segue sem restaurar.
    }
    const total = telasDoTeste(teste.tipo, lista);
    dispatch({ tipo: 'restaurar', progresso: lerProgresso(salvo, { tipo: teste.tipo, total, perguntas: lista }) });
  }
  useEffect(() => {
    // Sem as perguntas, o progresso salvo seria descartado (números que "não existem"): espera
    // `carregarPerguntas`. Até restaurar, a tela também não grava (não apaga o que está salvo).
    if (demonstracao || perguntasIndisponiveis) return;
    restaurarProgresso(perguntasIniciais);
    // Só na montagem: restaurar depois apagaria respostas novas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, demonstracao]);

  // Aquecimento: o banco da API pausa quando fica ocioso; acorda enquanto a pessoa lê a abertura.
  // Uma vez, sem esperar a resposta; nunca na vitrine.
  const aqueceu = useRef(false);
  useEffect(() => {
    if (demonstracao || aqueceu.current || s.estado !== 'abertura' || !acoes.aquecer) return;
    aqueceu.current = true;
    acoes.aquecer().catch(() => {
      // Só uma tentativa: a próxima ação mostra a falha real.
    });
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (demonstracao || !s.carregado) return;
    try {
      if (s.estado === 'resultado') sessionStorage.removeItem(chave);
      else if (temProgresso(s)) sessionStorage.setItem(chave, JSON.stringify(progressoDe(s)));
      else sessionStorage.removeItem(chave);
    } catch {
      // Sem storage, o teste continua; só não sobrevive a um recarregamento.
    }
  }, [s, chave, demonstracao]);

  // Medição: iniciar_teste na primeira pergunta; concluir_teste quando o resultado aparece.
  const iniciou = useRef(demonstracao);
  const concluiu = useRef(demonstracao);
  useEffect(() => {
    if (s.estado === 'pergunta' && !iniciou.current) {
      iniciou.current = true;
      registrarEvento('iniciar_teste', { teste: teste.slug });
    }
    if (s.estado === 'resultado' && !concluiu.current) {
      concluiu.current = true;
      registrarEvento('concluir_teste', { teste: teste.slug });
    }
  }, [s.estado, teste.slug]);

  // Envio: uma chamada por vez (dois cliques rápidos não duplicam).
  const enviandoAgora = useRef(false);
  async function enviarRespostas(dono: string | null = s.respondidoComo ?? s.dono) {
    if (enviandoAgora.current) return;
    enviandoAgora.current = true;
    dispatch({ tipo: 'enviar' });
    try {
      // O dono das respostas vai junto: se o cookie for de outra pessoa (trocada em outra aba), o
      // servidor devolve `sessao` sem gravar, e a identificação seguinte descarta o que não é dela.
      const resposta = await acoes.enviar(teste.slug, respostasParaApi(s, perguntas), dono ?? '');
      if (resposta.ok && resposta.dados) dispatch({ tipo: 'enviado', resultado: resposta.dados });
      else if (!resposta.ok && resposta.erro === 'sessao') dispatch({ tipo: 'falhou', erro: 'sessao' });
      else if (!resposta.ok && (resposta.erro === 'recusado' || resposta.erro === 'invalido')) dispatch({ tipo: 'falhou', erro: 'recusado' });
      else dispatch({ tipo: 'falhou', erro: 'indisponivel' });
    } catch {
      dispatch({ tipo: 'falhou', erro: 'indisponivel' });
    } finally {
      enviandoAgora.current = false;
    }
  }

  function aoIdentificar(sessao: SessaoTela) {
    // Só reenvia as respostas da própria pessoa; de outra, o reducer descarta e recomeça.
    const reenviar = s.retorno === 'enviando' && progressoPertenceA(s, sessao.dono);
    dispatch({ tipo: 'identificado', sessao });
    if (reenviar) void enviarRespostas(s.respondidoComo ?? sessao.dono);
  }

  const precisaDePerguntas = teste.tipo === 'nota' || teste.tipo === 'talentos';

  // Perguntas que não vieram na renderização: uma chamada por vez (sem clique duplo).
  const preparandoAgora = useRef(false);
  async function prepararTeste() {
    if (preparandoAgora.current) return;
    preparandoAgora.current = true;
    setPreparando(true);
    setSemPerguntas(false);
    try {
      const resposta = await acoes.carregarPerguntas(teste.slug);
      const lista = resposta.ok ? (resposta.dados ?? []) : null;
      if (!lista || (precisaDePerguntas && lista.length === 0)) {
        setSemPerguntas(true);
        return;
      }
      setPerguntas(lista);
      setIndisponiveis(false);
      dispatch({ tipo: 'perguntas', perguntas: lista });
      if (!demonstracao) restaurarProgresso(lista);
      dispatch({ tipo: 'comecar' });
    } catch {
      setSemPerguntas(true);
    } finally {
      preparandoAgora.current = false;
      setPreparando(false);
    }
  }

  function comecar() {
    if (indisponiveis) {
      void prepararTeste();
      return;
    }
    if (precisaDePerguntas && perguntas.length === 0) {
      setSemPerguntas(true);
      return;
    }
    dispatch({ tipo: 'comecar' });
  }

  /** "Não é você?": encerra a sessão e apaga o progresso (estado e storage); o teste recomeça. */
  async function trocarEmail() {
    dispatch({ tipo: 'trocarEmail' });
    if (!demonstracao) {
      try {
        sessionStorage.removeItem(chave);
      } catch {
        // Sem storage não há o que apagar.
      }
    }
    try {
      await acoes.sair();
    } catch {
      // O cookie expira sozinho; a próxima identificação o substitui.
    }
  }

  async function sairDaSessao() {
    try {
      await acoes.sair();
    } catch {
      // Idem: sem rede, o cookie de sessão some ao fechar o navegador.
    }
    dispatch({ tipo: 'sair' });
  }

  const foto = fotoDoTeste(teste.slug, momentoDaFoto(s));
  const proximaFoto = s.estado === 'pergunta' && s.passo + 1 < s.total ? fotoDoTeste(teste.slug, { pergunta: s.passo + 2 }) : null;
  if (proximaFoto && proximaFoto !== foto) {
    // Mesmo srcset/sizes da <Image>: o navegador baixa a largura certa e reaproveita na troca.
    const { props } = getImageProps({ src: proximaFoto, alt: '', fill: true, sizes: TAMANHOS_FOTO });
    preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes });
  }

  const idTitulo = `${id}-titulo`;
  const rotuloEnviar = teste.tipo === 'talentos' ? 'Concluir' : 'Enviar respostas';
  const botaoEnviar = (
    <button type="button" className={buttonClassName()} disabled={s.estado === 'enviando' || !podeEnviar(s, perguntas)} onClick={() => void enviarRespostas()}>
      {rotuloEnviar}
    </button>
  );
  const voltar = (rotulo: string) =>
    s.passo > 0 && (
      <button type="button" className={styles.voltar} onClick={() => dispatch({ tipo: 'voltar' })}>
        {rotulo}
      </button>
    );
  const proximo = (desabilitado = false) => (
    <button type="button" className={buttonClassName()} disabled={desabilitado} onClick={() => dispatch({ tipo: 'avancar' })}>
      Próximo
    </button>
  );
  const ultimaTela = s.passo === s.total - 1;

  function telaDePergunta() {
    const nome = `${id}-resposta-${s.passo + 1}`;
    switch (teste.tipo) {
      case 'nota':
      case 'estilo': {
        // Sem perguntas a tela não sai da abertura (ver `comecar`); aqui é só defesa.
        if (teste.tipo === 'nota' && !perguntas[s.passo]) return null;
        const chaveResposta = teste.tipo === 'nota' ? perguntas[s.passo].numero : s.passo + 1;
        const valor = s.respostas[chaveResposta];
        const responder = (nota: number) => dispatch({ tipo: 'responder', chave: chaveResposta, valor: nota });
        const avancar = () => dispatch({ tipo: 'avancar' });
        return (
          <>
            {teste.tipo === 'nota' ? (
              <PerguntaNota key={nome} nome={nome} texto={perguntas[s.passo].texto} valor={valor} onEscolher={responder} onAvancar={avancar} legendaRef={focar} />
            ) : (
              <PerguntaEstilo key={nome} nome={nome} par={parEstilo(s.passo)} valor={valor} onEscolher={responder} onAvancar={avancar} legendaRef={focar} />
            )}
            <div className={styles.navegacao}>
              {voltar('Pergunta anterior')}
              {ultimaTela ? (
                botaoEnviar
              ) : valor !== undefined ? (
                <button type="button" className={styles.voltar} data-sentido="avancar" onClick={() => dispatch({ tipo: 'avancar' })}>
                  Próxima pergunta
                </button>
              ) : (
                <span className={styles.dica}>Ao clicar numa opção, vai para a próxima</span>
              )}
            </div>
          </>
        );
      }
      case 'talentos':
        return s.passo === 0 ? (
          <>
            <PerguntaMarcar
              key={nome}
              nome={nome}
              legenda="Marque as habilidades que você tem"
              ajuda={`Marque quantas quiser. ${s.marcadas.length} marcadas.`}
              opcoes={perguntas.map((p) => ({ id: p.numero, texto: p.texto }))}
              marcadas={s.marcadas}
              onAlternar={(idOpcao) => dispatch({ tipo: 'marcar', id: idOpcao })}
              legendaRef={focar}
            />
            <div className={styles.navegacao}>
              <span />
              {proximo(s.marcadas.length === 0)}
            </div>
          </>
        ) : (
          <>
            <PerguntaMarcar
              key={nome}
              nome={nome}
              legenda={`Escolha até ${MAXIMO_ESCOLHIDAS} habilidades que mais combinam com você`}
              ajuda={`${s.escolhidas.length} de ${MAXIMO_ESCOLHIDAS} escolhidas.`}
              opcoes={perguntas.filter((p) => s.marcadas.includes(p.numero)).map((p) => ({ id: p.numero, texto: p.texto }))}
              marcadas={s.escolhidas}
              onAlternar={(idOpcao) => dispatch({ tipo: 'escolher', id: idOpcao })}
              bloqueada={() => s.escolhidas.length >= MAXIMO_ESCOLHIDAS}
              legendaRef={focar}
            />
            <div className={styles.navegacao}>
              {voltar('Anterior')}
              {botaoEnviar}
            </div>
          </>
        );
      case 'temperamento': {
        const pagina = paginaTemperamento(s.passo);
        const naPagina = pagina.opcoes.filter((o) => s.marcadas.includes(o.id)).length;
        return (
          <>
            <PerguntaMarcar
              key={nome}
              nome={nome}
              legenda={`${pagina.grupo.nome}: marque as características que descrevem você`}
              ajuda={`Marque quantas quiser, inclusive as fraquezas. ${naPagina} marcadas nesta página.`}
              opcoes={pagina.opcoes}
              marcadas={s.marcadas}
              onAlternar={(idOpcao) => dispatch({ tipo: 'marcar', id: idOpcao })}
              legendaRef={focar}
            />
            <div className={styles.navegacao}>
              {voltar('Anterior') || <span />}
              {ultimaTela ? botaoEnviar : proximo()}
            </div>
          </>
        );
      }
    }
  }

  function conteudo() {
    switch (s.estado) {
      case 'abertura': {
        const feitas = respondidas(s);
        return (
          <>
            <p className={styles.corpo}>{abertura.resumo}</p>
            {(abertura.perguntas || abertura.resposta) && (
              <dl className={styles.formato}>
                {abertura.perguntas && (
                  <div>
                    <dt>Perguntas</dt>
                    <dd>{abertura.perguntas}</dd>
                  </div>
                )}
                {abertura.resposta && (
                  <div>
                    <dt>Resposta</dt>
                    <dd>{abertura.resposta}</dd>
                  </div>
                )}
              </dl>
            )}
            {abertura.comoResponder && (
              <div className={styles.parte}>
                <h2 className={styles.titulo4}>Como responder</h2>
                <p className={styles.texto}>{abertura.comoResponder}</p>
              </div>
            )}
            {temProgresso(s) && <p className={styles.texto}>{`Você já respondeu ${feitas} de ${s.total} ${UNIDADE_TELA[teste.tipo]} nesta aba.`}</p>}
            {semPerguntas && (
              <p role="alert" className={styles.erro}>
                Não conseguimos carregar as perguntas agora. Tente em alguns minutos.
              </p>
            )}
            {/* Região já montada (vazia) para o leitor de tela anunciar quando o texto entra. */}
            {indisponiveis && (
              <div className={styles.preparando} role="status">
                {preparando && (
                  <>
                    <p className={styles.texto}>Preparando o teste…</p>
                    <TextoEspera visivel={esperaLonga} />
                  </>
                )}
              </div>
            )}
            <div className={styles.botoes}>
              {/* aria-disabled (não disabled): o foco fica no botão; a trava é o ref de `prepararTeste`. */}
              <button type="button" className={buttonClassName()} aria-disabled={preparando || undefined} onClick={comecar}>
                {indisponiveis && semPerguntas ? 'Tentar de novo' : temProgresso(s) ? 'Continuar o teste' : 'Começar o teste'}
              </button>
            </div>
          </>
        );
      }
      case 'email':
        return (
          <Identificacao
            pedirCodigo={acoes.pedirCodigo}
            onIdentificado={aoIdentificar}
            onNovo={(email, turmas) => dispatch({ tipo: 'novoAluno', email, turmas })}
            onCodigoEnviado={(email, emailMascarado) => dispatch({ tipo: 'codigoEnviado', email, emailMascarado })}
            tituloRef={focar}
          />
        );
      case 'codigo':
        return (
          <ConfirmarCodigo
            email={s.verificacao?.email ?? ''}
            emailMascarado={s.verificacao?.emailMascarado ?? ''}
            confirmar={acoes.confirmarCodigo}
            reenviar={acoes.pedirCodigo}
            retomar={acoes.retomarCadastro}
            onIdentificado={aoIdentificar}
            onNovo={(email, turmas) => dispatch({ tipo: 'novoAluno', email, turmas })}
            onOutroEmail={() => dispatch({ tipo: 'outroEmail' })}
            onResultado={(resultado) => {
              if (!demonstracao) registrarEvento('confirmar_codigo', { teste: teste.slug, resultado });
            }}
            tituloRef={focar}
          />
        );
      case 'cadastro':
        return (
          <Cadastro
            email={s.cadastro?.email ?? ''}
            turmas={s.cadastro?.turmas ?? []}
            cadastrar={acoes.cadastrar}
            retomarCadastro={acoes.retomarCadastro}
            onIdentificado={aoIdentificar}
            onNovo={(email, turmas) => dispatch({ tipo: 'novoAluno', email, turmas })}
            onOutroEmail={() => dispatch({ tipo: 'voltarEmail' })}
            tituloRef={focar}
          />
        );
      case 'pergunta':
        return (
          <>
            <Progresso atual={s.passo + 1} total={s.total} rotulo={ROTULO_TELA[teste.tipo]} />
            {telaDePergunta()}
          </>
        );
      case 'enviando':
        return (
          <>
            <Progresso atual={s.total} total={s.total} rotulo={ROTULO_TELA[teste.tipo]} />
            <div ref={focar} tabIndex={-1} className={styles.aviso} role="status">
              <span className={styles.girando} aria-hidden="true" />
              <p className={styles.corpo}>Calculando seu resultado…</p>
              <TextoEspera visivel={esperaLonga} />
            </div>
            <div className={styles.botoes}>{botaoEnviar}</div>
          </>
        );
      case 'resultado':
        return s.resultado ? <Resultado teste={teste} resultado={s.resultado} emailMascarado={s.emailMascarado} saiu={s.saiu} onSair={() => void sairDaSessao()} linkResultado={linkResultado} tituloRef={focar} /> : null;
      case 'erro':
        return (
          <div className={`${styles.aviso} ${styles.avisoErro}`} role="alert">
            <h2 ref={focar} tabIndex={-1} className={styles.subtitulo}>
              {s.erroEnvio === 'recusado' ? 'Algumas respostas não foram aceitas.' : 'Não conseguimos enviar suas respostas'}
            </h2>
            <p className={styles.texto}>
              {s.erroEnvio === 'recusado'
                ? 'Suas respostas continuam guardadas nesta aba. Confira as respostas e envie de novo.'
                : 'Suas respostas continuam guardadas nesta aba. Verifique a internet e tente de novo.'}
            </p>
            <div className={styles.botoes}>
              <button type="button" className={buttonClassName()} onClick={() => void enviarRespostas()}>
                Tentar de novo
              </button>
              {s.erroEnvio === 'recusado' && (
                <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => dispatch({ tipo: 'revisar' })}>
                  Revisar respostas
                </button>
              )}
            </div>
          </div>
        );
      case 'expirou':
        return (
          <div className={styles.aviso} role="status">
            <h2 ref={focar} tabIndex={-1} className={styles.subtitulo}>
              Sua sessão foi encerrada
            </h2>
            <p className={styles.texto}>Por segurança, a identificação vale até fechar o navegador ou por 2 horas. Informe seu e-mail para continuar.</p>
            <div className={styles.botoes}>
              <button type="button" className={buttonClassName()} onClick={() => dispatch({ tipo: 'informarEmail' })}>
                Informar e-mail
              </button>
            </div>
          </div>
        );
    }
  }

  const aula = abertura.aula?.trim();

  return (
    <section className={styles.tela} aria-labelledby={idTitulo} data-section="teste-eba">
      <div className={styles.grade}>
        <div className={styles.caixa}>
          <p className={styles.numero}>
            <span>{`Teste ${teste.ordem} de ${TESTES.length}`}</span>
            {aula && <span>{`${aula} do CDV`}</span>}
          </p>
          <h1 id={idTitulo} className={styles.nome}>
            {teste.nome}
          </h1>
          {conteudo()}
          {s.emailMascarado && COM_SESSAO_VISIVEL.has(s.estado) && (
            <p className={styles.trocar}>
              Respondendo como <strong>{s.emailMascarado}</strong> ·{' '}
              <button type="button" className={styles.link} onClick={() => void trocarEmail()}>
                Não é você? Trocar e-mail
              </button>
            </p>
          )}
        </div>
        <div className={styles.midia}>
          <Image
            src={foto}
            alt=""
            fill
            sizes={TAMANHOS_FOTO}
            loading="eager"
            fetchPriority={s.estado === 'abertura' ? 'high' : undefined}
            className={styles.foto}
          />
        </div>
      </div>
    </section>
  );
}
