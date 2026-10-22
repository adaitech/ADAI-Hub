import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent, type RefCallback } from 'react';
import { buttonClassName } from '@/components/ui/ButtonLink';
import type {
  cadastrar as cadastrarAcao,
  confirmarCodigo as confirmarCodigoAcao,
  pedirCodigo as pedirCodigoAcao,
  RespostaAcao,
  retomarCadastro as retomarCadastroAcao,
} from '@/app/(site)/eba/testes/[slug]/acoes';
import { UNIDADES } from '@/lib/eba-api/testes';
import type { Turma } from '@/lib/eba-api/turmas';
import { AvisoDeEspera } from './AvisoDeEspera';
import type { SessaoTela } from './estado';
import styles from './Questionario.module.css';

type CodigoErro = Extract<RespostaAcao, { ok: false }>['erro'];

const VERIFICAR_DEPOIS = 'Não conseguimos verificar agora. Tente em alguns minutos.';
/** Caracteres de controle (quebra de linha, tabulação, nulo…): o servidor também recusa. */
const CONTROLE = /\p{Cc}/u;

/** Mensagem de cada erro das ações de identificação (sessão/recusa não se aplicam aqui). */
const MENSAGENS: Record<CodigoErro, string> = {
  invalido: 'Confira os campos destacados.',
  limite: 'Muitas tentativas. Aguarde um minuto.',
  emails: 'Já enviamos códigos demais para este e-mail. Aguarde 15 minutos para pedir outro.',
  indisponivel: VERIFICAR_DEPOIS,
  sessao: VERIFICAR_DEPOIS,
  recusado: VERIFICAR_DEPOIS,
  verificacao: 'Confirme seu e-mail de novo.',
};

function Erro({ id, erro, mensagens = MENSAGENS }: { id: string; erro: CodigoErro | null; mensagens?: Record<CodigoErro, string> }) {
  if (!erro) return null;
  return (
    <p id={id} role="alert" className={styles.erro}>
      {mensagens[erro]}
    </p>
  );
}

/** Indisponível (API fora, turmas que não carregam): botão que refaz a identificação (spec §6). */
function TentarDeNovo({ visivel, pendente, onClick }: { visivel: boolean; pendente: boolean; onClick: () => void }) {
  if (!visivel) return null;
  return (
    <button type="button" className={buttonClassName({ estilo: 'contorno' })} disabled={pendente} onClick={onClick}>
      Tentar de novo
    </button>
  );
}

export interface IdentificacaoProps {
  pedirCodigo: typeof pedirCodigoAcao;
  /** Aparelho já verificado para este e-mail: segue direto. */
  onIdentificado: (sessao: SessaoTela) => void;
  /** E-mail não encontrado (aparelho já verificado): abre o Primeiro acesso com as turmas abertas. */
  onNovo: (email: string, turmas: Turma[]) => void;
  /** Código enviado ao e-mail: abre o passo do código. */
  onCodigoEnviado: (email: string, emailMascarado: string) => void;
  tituloRef: RefCallback<HTMLElement>;
}

/** Pede o e-mail. O e-mail digitado fica só na memória da tela (nunca no storage nem no DataLayer). */
export function Identificacao({ pedirCodigo, onIdentificado, onNovo, onCodigoEnviado, tituloRef }: IdentificacaoProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<CodigoErro | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    await verificar();
  }

  async function verificar() {
    const valor = email.trim();
    if (!valor.includes('@')) {
      setErro('invalido');
      return;
    }
    setPendente(true);
    setErro(null);
    try {
      const resposta = await pedirCodigo(valor);
      if (resposta.ok && resposta.dados) {
        if ('codigoEnviado' in resposta.dados) onCodigoEnviado(valor, resposta.dados.emailMascarado);
        else if ('novo' in resposta.dados) onNovo(valor, resposta.dados.turmas);
        else onIdentificado(resposta.dados);
        return;
      }
      setErro(resposta.ok ? 'indisponivel' : resposta.erro);
    } catch {
      setErro('indisponivel');
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <h2 ref={tituloRef} tabIndex={-1} className={styles.subtitulo}>
        Antes de começar
      </h2>
      <p className={styles.texto}>Informe seu e-mail para a equipe da EBA receber seu resultado. Se você já fez outro teste, use o mesmo e-mail.</p>
      <form className={styles.formulario} onSubmit={enviar} noValidate>
        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor={`${id}-email`}>
            E-mail
          </label>
          <input
            id={`${id}-email`}
            className={styles.campo}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={erro === 'invalido' || undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
          />
        </div>
        <Erro id={`${id}-erro`} erro={erro} />
        <AvisoDeEspera ativo={pendente} />
        <div className={styles.botoes}>
          <button type="submit" className={buttonClassName()} disabled={pendente}>
            Continuar
          </button>
          <TentarDeNovo visivel={erro === 'indisponivel'} pendente={pendente} onClick={() => void verificar()} />
        </div>
        <p className={styles.legal}>
          Usamos seu e-mail só para ligar suas respostas à sua turma. <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
        </p>
      </form>
    </>
  );
}

export interface CadastroProps {
  email: string;
  turmas: Turma[];
  cadastrar: typeof cadastrarAcao;
  /** "Tentar de novo" refaz a identificação do e-mail já verificado (turmas atualizadas ou e-mail já cadastrado). */
  retomarCadastro: typeof retomarCadastroAcao;
  onIdentificado: (sessao: SessaoTela) => void;
  onNovo: (email: string, turmas: Turma[]) => void;
  onOutroEmail: () => void;
  tituloRef: RefCallback<HTMLElement>;
}

/** No cadastro, a recusa da API (400) pede para conferir os dados. */
const MENSAGENS_CADASTRO: Record<CodigoErro, string> = {
  ...MENSAGENS,
  recusado: 'Não conseguimos concluir o cadastro com esses dados. Confira os campos ou fale com a equipe da EBA.',
};

/** Primeiro acesso: nome, unidade e turma (uma vez só; nos próximos testes basta o e-mail). */
export function Cadastro({ email, turmas, cadastrar, retomarCadastro, onIdentificado, onNovo, onOutroEmail, tituloRef }: CadastroProps) {
  const id = useId();
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('');
  const [idTurma, setIdTurma] = useState('');
  const [erro, setErro] = useState<CodigoErro | null>(null);
  const [destacar, setDestacar] = useState(false);
  const [pendente, setPendente] = useState(false);

  const titulo = (
    <h2 ref={tituloRef} tabIndex={-1} className={styles.subtitulo}>
      Primeiro acesso
    </h2>
  );
  const outroEmail = (
    <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={onOutroEmail}>
      Usar outro e-mail
    </button>
  );

  if (turmas.length === 0) {
    return (
      <>
        {titulo}
        <p className={styles.texto}>Nenhuma turma aberta no momento. Fale com a equipe da EBA.</p>
        <div className={styles.botoes}>{outroEmail}</div>
      </>
    );
  }

  const nomeLimpo = nome.trim();
  const invalido = { nome: nomeLimpo.length < 3 || nomeLimpo.length > 100 || CONTROLE.test(nomeLimpo), unidade: !unidade, turma: !idTurma };
  const marcar = (campo: keyof typeof invalido) => (destacar && invalido[campo]) || undefined;
  const idErroCampo = (campo: keyof typeof invalido) => (marcar(campo) ? `${id}-${campo}-erro` : undefined);

  /** Refaz a identificação: o e-mail pode já existir, ou as turmas voltaram. */
  async function tentarDeNovo() {
    setPendente(true);
    setErro(null);
    try {
      const resposta = await retomarCadastro(email);
      if (resposta.ok && resposta.dados) {
        if ('novo' in resposta.dados) onNovo(email, resposta.dados.turmas);
        else onIdentificado(resposta.dados);
        return;
      }
      if (!resposta.ok && resposta.erro === 'verificacao') return onOutroEmail();
      setErro(resposta.ok ? 'indisponivel' : resposta.erro);
    } catch {
      setErro('indisponivel');
    } finally {
      setPendente(false);
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (invalido.nome || invalido.unidade || invalido.turma) {
      setDestacar(true);
      setErro('invalido');
      return;
    }
    setPendente(true);
    setErro(null);
    try {
      const resposta = await cadastrar({ email, nome: nome.trim(), unidade, idTurma });
      if (resposta.ok && resposta.dados) {
        onIdentificado(resposta.dados);
        return;
      }
      // A verificação do e-mail venceu (15 min): volta ao e-mail para pedir um código novo.
      if (!resposta.ok && resposta.erro === 'verificacao') return onOutroEmail();
      setErro(resposta.ok ? 'indisponivel' : resposta.erro);
    } catch {
      setErro('indisponivel');
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      {titulo}
      <p className={styles.texto}>
        Não encontramos o e-mail <strong>{email}</strong>. Complete seu cadastro uma vez; nos próximos testes basta o e-mail.
      </p>
      <form className={styles.formulario} onSubmit={enviar} noValidate>
        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor={`${id}-nome`}>
            Nome completo
          </label>
          <input
            id={`${id}-nome`}
            className={styles.campo}
            autoComplete="name"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            aria-invalid={marcar('nome')}
            aria-describedby={idErroCampo('nome')}
          />
          {marcar('nome') && (
            <p id={`${id}-nome-erro`} className={styles.erroCampo}>
              Informe seu nome completo.
            </p>
          )}
        </div>
        <fieldset
          className={marcar('unidade') ? `${styles.grupo} ${styles.grupoInvalido}` : styles.grupo}
          data-invalido={marcar('unidade')}
          aria-describedby={marcar('unidade') ? `${id}-unidade-erro` : undefined}
        >
          <legend className={styles.rotulo}>Unidade</legend>
          <p className={styles.ajuda}>De qual ADAI você é? Se é de outra igreja ou está visitando, escolha a opção correspondente.</p>
          {marcar('unidade') && (
            <p id={`${id}-unidade-erro`} className={styles.erroCampo}>
              Escolha sua unidade.
            </p>
          )}
          <ul role="list" className={`${styles.listaMarcar} ${styles.duasColunas}`}>
            {UNIDADES.map((u) => (
              <li key={u.valor}>
                <label className={styles.marcar}>
                  <input
                    type="radio"
                    name={`${id}-unidade`}
                    value={u.valor}
                    checked={unidade === u.valor}
                    onChange={() => setUnidade(u.valor)}
                  />
                  <span>{u.rotulo}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor={`${id}-turma`}>
            Turma
          </label>
          <select
            id={`${id}-turma`}
            className={styles.campo}
            required
            value={idTurma}
            onChange={(e) => setIdTurma(e.target.value)}
            aria-invalid={marcar('turma')}
            aria-describedby={idErroCampo('turma')}
          >
            <option value="">Selecione sua turma</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
          {marcar('turma') && (
            <p id={`${id}-turma-erro`} className={styles.erroCampo}>
              Escolha sua turma.
            </p>
          )}
        </div>
        <Erro id={`${id}-erro`} erro={erro} mensagens={MENSAGENS_CADASTRO} />
        <AvisoDeEspera ativo={pendente} />
        <div className={styles.botoes}>
          <button type="submit" className={buttonClassName()} disabled={pendente}>
            Cadastrar e começar
          </button>
          <TentarDeNovo visivel={erro === 'indisponivel'} pendente={pendente} onClick={() => void tentarDeNovo()} />
          {outroEmail}
        </div>
      </form>
    </>
  );
}

const SEGUNDOS_REENVIO = 60;

type ErroCodigo =
  | { tipo: 'errado'; restantes: number }
  | { tipo: 'vencido' }
  | { tipo: 'incompleto' }
  | { tipo: 'acao'; erro: CodigoErro };

function mensagemDoCodigo(erro: ErroCodigo): string {
  switch (erro.tipo) {
    case 'errado':
      return `Código incorreto. Você tem mais ${erro.restantes} ${erro.restantes === 1 ? 'tentativa' : 'tentativas'}.`;
    case 'vencido':
      return 'Este código não vale mais. Enviamos um novo?';
    case 'incompleto':
      return 'Digite os 6 dígitos do código.';
    case 'acao':
      return MENSAGENS[erro.erro];
  }
}

export interface ConfirmarCodigoProps {
  email: string;
  emailMascarado: string;
  confirmar: typeof confirmarCodigoAcao;
  /** Reenvio do código (a mesma ação do passo do e-mail). */
  reenviar: typeof pedirCodigoAcao;
  onIdentificado: (sessao: SessaoTela) => void;
  onNovo: (email: string, turmas: Turma[]) => void;
  onOutroEmail: () => void;
  /** Resultado de cada conferência (medição `confirmar_codigo`, sem dado pessoal). */
  onResultado: (resultado: 'ok' | 'errado' | 'esgotado' | 'vencido') => void;
  tituloRef: RefCallback<HTMLElement>;
}

/**
 * Passo do código de 6 dígitos enviado ao e-mail. O campo aceita o código colado com espaço ou traço
 * (fica só com os dígitos); "Reenviar código" só depois de 60 s; uma conferência por vez.
 */
export function ConfirmarCodigo({ email, emailMascarado, confirmar, reenviar, onIdentificado, onNovo, onOutroEmail, onResultado, tituloRef }: ConfirmarCodigoProps) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const conferindo = useRef(false);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<ErroCodigo | null>(null);
  const [pendente, setPendente] = useState(false);
  const [espera, setEspera] = useState(SEGUNDOS_REENVIO);

  useEffect(() => {
    if (espera <= 0) return;
    const relogio = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(relogio);
  }, [espera]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (conferindo.current) return;
    if (codigo.length !== 6) {
      setErro({ tipo: 'incompleto' });
      return;
    }
    conferindo.current = true;
    setPendente(true);
    setErro(null);
    try {
      const resposta = await confirmar(email, codigo);
      if (resposta.ok && resposta.dados) {
        onResultado('ok');
        if ('novo' in resposta.dados) onNovo(email, resposta.dados.turmas);
        else onIdentificado(resposta.dados);
        return;
      }
      if (!resposta.ok && resposta.erro === 'codigo') {
        onResultado(resposta.resultado);
        setCodigo('');
        // Errado sem tentativas restantes (5ª errada): o código já morreu, como no "esgotado".
        setErro(resposta.resultado === 'errado' && resposta.restantes > 0 ? { tipo: 'errado', restantes: resposta.restantes } : { tipo: 'vencido' });
        campo.current?.focus();
        return;
      }
      setErro({ tipo: 'acao', erro: resposta.ok ? 'indisponivel' : resposta.erro });
    } catch {
      setErro({ tipo: 'acao', erro: 'indisponivel' });
    } finally {
      conferindo.current = false;
      setPendente(false);
    }
  }

  async function pedirNovo() {
    setPendente(true);
    setErro(null);
    try {
      const resposta = await reenviar(email);
      if (resposta.ok && resposta.dados) {
        if ('codigoEnviado' in resposta.dados) {
          setCodigo('');
          setEspera(SEGUNDOS_REENVIO);
          campo.current?.focus();
        } else if ('novo' in resposta.dados) onNovo(email, resposta.dados.turmas);
        else onIdentificado(resposta.dados);
        return;
      }
      setErro({ tipo: 'acao', erro: resposta.ok ? 'indisponivel' : resposta.erro });
    } catch {
      setErro({ tipo: 'acao', erro: 'indisponivel' });
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <h2 ref={tituloRef} tabIndex={-1} className={styles.subtitulo}>
        Digite o código
      </h2>
      <p className={styles.texto}>Enviamos um código de 6 dígitos para {emailMascarado}.</p>
      <form className={styles.formulario} onSubmit={enviar} noValidate>
        <div className={styles.grupo}>
          <label className={styles.rotulo} htmlFor={`${id}-codigo`}>
            Código de 6 dígitos
          </label>
          <input
            ref={campo}
            id={`${id}-codigo`}
            className={styles.campo}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={erro?.tipo === 'errado' || erro?.tipo === 'incompleto' || undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
          />
        </div>
        {erro && (
          <p id={`${id}-erro`} role="alert" className={styles.erro}>
            {mensagemDoCodigo(erro)}
          </p>
        )}
        <AvisoDeEspera ativo={pendente} />
        <div className={styles.botoes}>
          {erro?.tipo === 'vencido' ? (
            <button type="button" className={buttonClassName()} disabled={pendente} onClick={() => void pedirNovo()}>
              Enviar novo código
            </button>
          ) : (
            <button type="submit" className={buttonClassName()} disabled={pendente}>
              Confirmar
            </button>
          )}
          <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={onOutroEmail}>
            Usar outro e-mail
          </button>
        </div>
        <p className={styles.legal} aria-live="polite">
          {espera > 0 ? (
            <>Não chegou? Confira o spam ou reenvie em {espera} s.</>
          ) : (
            <>
              Não chegou? Confira o spam.{' '}
              <button type="button" className={styles.link} disabled={pendente} onClick={() => void pedirNovo()}>
                Reenviar código
              </button>
            </>
          )}
        </p>
      </form>
    </>
  );
}
