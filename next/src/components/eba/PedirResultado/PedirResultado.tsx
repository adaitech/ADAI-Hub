'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { confirmarLinkResultado, pedirCodigoResultado, reenviarLinkResultado } from '@/app/(restrito)/eba/resultado/acoes';
import { DIAS_VALIDADE_LINK } from '@/app/(restrito)/eba/resultado/validade';
import { buttonClassName, ButtonLink } from '@/components/ui/ButtonLink';
import styles from '../Questionario/Questionario.module.css';

export interface PedirResultadoProps {
  acoes: { pedirCodigo: typeof pedirCodigoResultado; confirmar: typeof confirmarLinkResultado; reenviar: typeof reenviarLinkResultado };
}

type Passo = 'email' | 'codigo' | 'enviado';
type Falha = 'invalido' | 'limite' | 'emails' | 'indisponivel';
type ErroCodigo = { tipo: 'aceito' } | { tipo: 'errado'; restantes: number } | { tipo: 'vencido' } | { tipo: 'incompleto' } | { tipo: 'acao'; erro: Falha };

const SEGUNDOS_REENVIO = 60;
const MENSAGENS: Record<Falha, string> = {
  invalido: 'Confira o e-mail digitado.',
  limite: 'Muitas tentativas. Aguarde um minuto.',
  emails: 'Já enviamos códigos demais para este e-mail. Aguarde 15 minutos para pedir outro.',
  indisponivel: 'Não conseguimos enviar agora. Tente em alguns minutos.',
};

function mensagemDoCodigo(erro: ErroCodigo): string {
  switch (erro.tipo) {
    case 'aceito':
      return 'Código confirmado, mas não conseguimos enviar o link agora. Tente de novo.';
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

/**
 * Pedido do link do resultado: e-mail → código de 6 dígitos → "Confira seu e-mail". O link nunca
 * aparece na tela (só chega ao e-mail de quem digitou o código) e a resposta é a mesma para qualquer
 * e-mail. O e-mail digitado fica só na memória da tela.
 */
export function PedirResultado({ acoes }: PedirResultadoProps) {
  const id = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);
  const conferindo = useRef(false);
  const passoAnterior = useRef<Passo>('email');
  const [passo, setPasso] = useState<Passo>('email');
  const [email, setEmail] = useState('');
  const [mascarado, setMascarado] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erroEmail, setErroEmail] = useState<Falha | null>(null);
  const [erroCodigo, setErroCodigo] = useState<ErroCodigo | null>(null);
  const [pendente, setPendente] = useState(false);
  const [espera, setEspera] = useState(SEGUNDOS_REENVIO);

  // Foco no título de cada passo novo (não na carga da página, nem na repetição do efeito no modo estrito).
  useEffect(() => {
    if (passoAnterior.current === passo) return;
    passoAnterior.current = passo;
    titulo.current?.focus();
  }, [passo]);

  useEffect(() => {
    if (passo !== 'codigo' || espera <= 0) return;
    const relogio = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(relogio);
  }, [passo, espera]);

  /** Pede (ou reenvia) o código. `true` quando o código foi enviado. */
  async function pedir(): Promise<boolean> {
    const valor = email.trim();
    if (!valor.includes('@')) {
      setErroEmail('invalido');
      return false;
    }
    setPendente(true);
    setErroEmail(null);
    setErroCodigo(null);
    try {
      const resposta = await acoes.pedirCodigo(valor);
      if (resposta.ok && resposta.dados) {
        setMascarado(resposta.dados.emailMascarado);
        setCodigo('');
        setEspera(SEGUNDOS_REENVIO);
        return true;
      }
      const erro: Falha = resposta.ok || resposta.erro === 'codigo' || resposta.erro === 'verificacao' ? 'indisponivel' : resposta.erro;
      if (passo === 'email') setErroEmail(erro);
      else setErroCodigo({ tipo: 'acao', erro });
    } catch {
      if (passo === 'email') setErroEmail('indisponivel');
      else setErroCodigo({ tipo: 'acao', erro: 'indisponivel' });
    } finally {
      setPendente(false);
    }
    return false;
  }

  async function enviarEmail(evento: FormEvent) {
    evento.preventDefault();
    if (await pedir()) setPasso('codigo');
  }

  async function reenviar() {
    if (await pedir()) campoCodigo.current?.focus();
  }

  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    if (conferindo.current) return;
    if (codigo.length !== 6) {
      setErroCodigo({ tipo: 'incompleto' });
      return;
    }
    conferindo.current = true;
    setPendente(true);
    setErroCodigo(null);
    try {
      const resposta = await acoes.confirmar(email.trim(), codigo);
      if (resposta.ok && resposta.dados) {
        setMascarado(resposta.dados.emailMascarado);
        setPasso('enviado');
        return;
      }
      if (!resposta.ok && resposta.erro === 'codigo') {
        setCodigo('');
        // Errado sem tentativas restantes (5ª errada): o código já morreu, como no "vencido".
        setErroCodigo(resposta.resultado === 'errado' && resposta.restantes > 0 ? { tipo: 'errado', restantes: resposta.restantes } : { tipo: 'vencido' });
        campoCodigo.current?.focus();
        return;
      }
      if (!resposta.ok && resposta.erro === 'indisponivel' && resposta.codigoAceito) {
        setErroCodigo({ tipo: 'aceito' });
        return;
      }
      setErroCodigo({ tipo: 'acao', erro: resposta.ok || resposta.erro === 'verificacao' ? 'indisponivel' : resposta.erro });
    } catch {
      setErroCodigo({ tipo: 'acao', erro: 'indisponivel' });
    } finally {
      conferindo.current = false;
      setPendente(false);
    }
  }

  /** "Tentar de novo" depois do código aceito: reenvia o link sem pedir outro código (o e-mail já está verificado). */
  async function tentarDeNovo() {
    setPendente(true);
    setErroCodigo(null);
    try {
      const resposta = await acoes.reenviar(email.trim());
      if (resposta.ok && resposta.dados) {
        setMascarado(resposta.dados.emailMascarado);
        setPasso('enviado');
        return;
      }
      // A verificação venceu (15 min): volta ao e-mail para pedir um código novo.
      if (!resposta.ok && resposta.erro === 'verificacao') {
        voltarAoEmail();
        return;
      }
      setErroCodigo(!resposta.ok && resposta.erro === 'limite' ? { tipo: 'acao', erro: 'limite' } : { tipo: 'aceito' });
    } catch {
      setErroCodigo({ tipo: 'aceito' });
    } finally {
      setPendente(false);
    }
  }

  function voltarAoEmail() {
    setCodigo('');
    setErroCodigo(null);
    setPasso('email');
  }

  return (
    <>
      <h1 className={styles.nome}>Receber meu resultado</h1>
      {passo === 'email' && (
        <>
          <h2 ref={titulo} tabIndex={-1} className={styles.subtitulo}>
            Informe seu e-mail
          </h2>
          <p className={styles.texto}>Use o e-mail que você usou nos testes. Vamos enviar um link particular com o seu resultado.</p>
          <form className={styles.formulario} onSubmit={enviarEmail} noValidate>
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
                aria-invalid={erroEmail === 'invalido' || undefined}
                aria-describedby={erroEmail ? `${id}-erro` : undefined}
              />
            </div>
            {erroEmail && (
              <p id={`${id}-erro`} role="alert" className={styles.erro}>
                {MENSAGENS[erroEmail]}
              </p>
            )}
            <div className={styles.botoes}>
              <button type="submit" className={buttonClassName()} disabled={pendente}>
                Continuar
              </button>
            </div>
            <p className={styles.legal}>
              Usamos seu e-mail só para enviar o link. <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
            </p>
          </form>
        </>
      )}
      {passo === 'codigo' && (
        <>
          <h2 ref={titulo} tabIndex={-1} className={styles.subtitulo}>
            Digite o código
          </h2>
          <p className={styles.texto}>Enviamos um código de 6 dígitos para {mascarado}.</p>
          <form className={styles.formulario} onSubmit={confirmarCodigo} noValidate>
            <div className={styles.grupo}>
              <label className={styles.rotulo} htmlFor={`${id}-codigo`}>
                Código de 6 dígitos
              </label>
              <input
                ref={campoCodigo}
                id={`${id}-codigo`}
                className={styles.campo}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-invalid={erroCodigo?.tipo === 'errado' || erroCodigo?.tipo === 'incompleto' || undefined}
                aria-describedby={erroCodigo ? `${id}-erro-codigo` : undefined}
              />
            </div>
            {erroCodigo && (
              <p id={`${id}-erro-codigo`} role="alert" className={styles.erro}>
                {mensagemDoCodigo(erroCodigo)}
              </p>
            )}
            <div className={styles.botoes}>
              {erroCodigo?.tipo === 'aceito' ? (
                <button type="button" className={buttonClassName()} disabled={pendente} onClick={() => void tentarDeNovo()}>
                  Tentar de novo
                </button>
              ) : erroCodigo?.tipo === 'vencido' ? (
                <button type="button" className={buttonClassName()} disabled={pendente} onClick={() => void reenviar()}>
                  Enviar novo código
                </button>
              ) : (
                <button type="submit" className={buttonClassName()} disabled={pendente}>
                  Confirmar
                </button>
              )}
              <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={voltarAoEmail}>
                Usar outro e-mail
              </button>
            </div>
            <p className={styles.legal} aria-live="polite">
              {espera > 0 ? (
                <>Não chegou? Confira o spam ou reenvie em {espera} s.</>
              ) : (
                <>
                  Não chegou? Confira o spam.{' '}
                  <button type="button" className={styles.link} disabled={pendente} onClick={() => void reenviar()}>
                    Reenviar código
                  </button>
                </>
              )}
            </p>
          </form>
        </>
      )}
      {passo === 'enviado' && (
        <>
          <h2 ref={titulo} tabIndex={-1} className={styles.subtitulo}>
            Confira seu e-mail
          </h2>
          <div className={styles.aviso} role="status">
            <p className={styles.texto}>
              Se existir resultado para este e-mail, enviamos o link para {mascarado}. Ele vale por {DIAS_VALIDADE_LINK} dias.
            </p>
          </div>
          <div className={styles.botoes}>
            <ButtonLink href="/eba/testes" estilo="contorno">
              Ver todos os testes
            </ButtonLink>
          </div>
        </>
      )}
    </>
  );
}
