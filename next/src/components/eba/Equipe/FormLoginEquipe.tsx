'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { entrarNaEquipe } from '@/app/(restrito)/eba/equipe/acoes';
import { buttonClassName } from '@/components/ui/ButtonLink';
import campos from '../Questionario/Questionario.module.css';

export interface FormLoginEquipeProps {
  acoes: { entrar: typeof entrarNaEquipe };
  /** Para onde ir depois de entrar. */
  destino?: string;
  /** A sessão anterior venceu: avisa na tela. */
  sessaoVencida?: boolean;
}

const MENSAGENS = {
  credenciais: 'E-mail ou senha incorretos.',
  invalido: 'Confira o e-mail e a senha digitados.',
  limite: 'Muitas tentativas. Aguarde um minuto.',
  indisponivel: 'Não conseguimos entrar agora. Tente em alguns minutos.',
} as const;

type Erro = keyof typeof MENSAGENS;

/** Login da equipe. A senha só existe na memória da tela e vai direto à Server Action (nunca ao storage). */
export function FormLoginEquipe({ acoes, destino = '/eba/equipe/consultas', sessaoVencida = false }: FormLoginEquipeProps) {
  const id = useId();
  const roteador = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<Erro | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (pendente) return;
    setPendente(true);
    setErro(null);
    try {
      const resposta = await acoes.entrar(email, senha);
      if (resposta.ok) {
        setSenha('');
        roteador.replace(destino);
        return;
      }
      setSenha('');
      setErro(resposta.erro in MENSAGENS ? (resposta.erro as Erro) : 'indisponivel');
    } catch {
      setSenha('');
      setErro('indisponivel');
    } finally {
      setPendente(false);
    }
  }

  return (
    <form className={campos.formulario} onSubmit={enviar} noValidate>
      {sessaoVencida && (
        <p role="status" className={campos.texto}>
          Sua sessão terminou. Entre de novo.
        </p>
      )}
      <div className={campos.grupo}>
        <label className={campos.rotulo} htmlFor={`${id}-email`}>
          E-mail
        </label>
        <input
          id={`${id}-email`}
          className={campos.campo}
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={erro === 'invalido' || undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
      </div>
      <div className={campos.grupo}>
        <label className={campos.rotulo} htmlFor={`${id}-senha`}>
          Senha
        </label>
        <input
          id={`${id}-senha`}
          className={campos.campo}
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          aria-invalid={erro === 'invalido' || undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
      </div>
      {erro && (
        <p id={`${id}-erro`} role="alert" className={campos.erro}>
          {MENSAGENS[erro]}
        </p>
      )}
      <div className={campos.botoes}>
        <button type="submit" className={buttonClassName()} disabled={pendente}>
          {pendente ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
      <p className={campos.legal}>Área restrita à equipe da EBA. As contas são criadas pela coordenação.</p>
    </form>
  );
}
