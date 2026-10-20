import Link from 'next/link';
import { useId, useState, type FormEvent, type RefCallback } from 'react';
import { buttonClassName } from '@/components/ui/ButtonLink';
import type { cadastrar as cadastrarAcao, identificar as identificarAcao, RespostaAcao } from '@/app/(site)/eba/testes/[slug]/acoes';
import { UNIDADES } from '@/lib/eba-api/testes';
import type { Turma } from '@/lib/eba-api/turmas';
import styles from './Questionario.module.css';

type CodigoErro = Extract<RespostaAcao, { ok: false }>['erro'];

const VERIFICAR_DEPOIS = 'Não conseguimos verificar agora. Tente em alguns minutos.';

/** Mensagem de cada erro das ações de identificação (sessão/recusa não se aplicam aqui). */
const MENSAGENS: Record<CodigoErro, string> = {
  invalido: 'Confira os campos destacados.',
  limite: 'Muitas tentativas. Aguarde um minuto.',
  indisponivel: VERIFICAR_DEPOIS,
  sessao: VERIFICAR_DEPOIS,
  recusado: VERIFICAR_DEPOIS,
};

function Erro({ id, erro }: { id: string; erro: CodigoErro | null }) {
  if (!erro) return null;
  return (
    <p id={id} role="alert" className={styles.erro}>
      {MENSAGENS[erro]}
    </p>
  );
}

export interface IdentificacaoProps {
  identificar: typeof identificarAcao;
  onIdentificado: (emailMascarado: string) => void;
  /** E-mail não encontrado: abre o Primeiro acesso com as turmas abertas. */
  onNovo: (email: string, turmas: Turma[]) => void;
  tituloRef: RefCallback<HTMLElement>;
}

/** Pede o e-mail. O e-mail digitado fica só na memória da tela (nunca no storage nem no DataLayer). */
export function Identificacao({ identificar, onIdentificado, onNovo, tituloRef }: IdentificacaoProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<CodigoErro | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const valor = email.trim();
    if (!valor.includes('@')) {
      setErro('invalido');
      return;
    }
    setPendente(true);
    setErro(null);
    try {
      const resposta = await identificar(valor);
      if (resposta.ok && resposta.dados) {
        if ('novo' in resposta.dados) onNovo(valor, resposta.dados.turmas);
        else onIdentificado(resposta.dados.emailMascarado);
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
        <div className={styles.botoes}>
          <button type="submit" className={buttonClassName()} disabled={pendente}>
            Continuar
          </button>
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
  onIdentificado: (emailMascarado: string) => void;
  onOutroEmail: () => void;
  tituloRef: RefCallback<HTMLElement>;
}

/** Primeiro acesso: nome, unidade e turma (uma vez só; nos próximos testes basta o e-mail). */
export function Cadastro({ email, turmas, cadastrar, onIdentificado, onOutroEmail, tituloRef }: CadastroProps) {
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

  const invalido = { nome: nome.trim().length < 3, unidade: !unidade, turma: !idTurma };
  const marcar = (campo: keyof typeof invalido) => (destacar && invalido[campo]) || undefined;

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
        onIdentificado(resposta.dados.emailMascarado);
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
          />
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
          <select id={`${id}-turma`} className={styles.campo} required value={idTurma} onChange={(e) => setIdTurma(e.target.value)} aria-invalid={marcar('turma')}>
            <option value="">Selecione sua turma</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <Erro id={`${id}-erro`} erro={erro} />
        <div className={styles.botoes}>
          <button type="submit" className={buttonClassName()} disabled={pendente}>
            Cadastrar e começar
          </button>
          {outroEmail}
        </div>
      </form>
    </>
  );
}
