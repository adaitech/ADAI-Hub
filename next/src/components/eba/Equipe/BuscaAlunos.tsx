'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { AlunoDaBusca, buscarAlunosAcao } from '@/app/(restrito)/eba/equipe/acoes';
import { buttonClassName } from '@/components/ui/ButtonLink';
import campos from '../Questionario/Questionario.module.css';
import styles from './Equipe.module.css';
import { TabelaAlunos } from './TabelaAlunos';

export interface BuscaAlunosProps {
  acoes: { buscar: typeof buscarAlunosAcao };
}

const MENSAGENS = {
  invalido: 'Digite um e-mail ou parte do nome.',
  limite: 'Muitas buscas. Aguarde um minuto.',
  indisponivel: 'Não conseguimos buscar agora. Tente em alguns minutos.',
} as const;

/**
 * Busca de aluno por e-mail ou nome. O que se digita fica só na memória da tela: não vai para a URL, o
 * histórico, o `localStorage` nem o DataLayer. Sessão vencida → volta ao login.
 */
export function BuscaAlunos({ acoes }: BuscaAlunosProps) {
  const id = useId();
  const roteador = useRouter();
  const [consulta, setConsulta] = useState('');
  const [resultado, setResultado] = useState<AlunoDaBusca[] | null>(null);
  const [erro, setErro] = useState<keyof typeof MENSAGENS | null>(null);
  const [pendente, setPendente] = useState(false);

  async function buscar(evento: FormEvent) {
    evento.preventDefault();
    if (pendente) return;
    setPendente(true);
    setErro(null);
    try {
      const resposta = await acoes.buscar(consulta);
      if (resposta.ok) {
        setResultado(resposta.dados ?? []);
        return;
      }
      if (resposta.erro === 'sessao') {
        roteador.replace('/eba/equipe/login?motivo=sessao');
        return;
      }
      setResultado(null);
      setErro(resposta.erro in MENSAGENS ? (resposta.erro as keyof typeof MENSAGENS) : 'indisponivel');
    } catch {
      setResultado(null);
      setErro('indisponivel');
    } finally {
      setPendente(false);
    }
  }

  return (
    <section className={styles.secao} aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className={campos.subtitulo}>
        Buscar aluno
      </h2>
      <form className={campos.formulario} onSubmit={buscar} noValidate role="search">
        <div className={campos.grupo}>
          <label className={campos.rotulo} htmlFor={`${id}-consulta`}>
            E-mail ou nome
          </label>
          <input
            id={`${id}-consulta`}
            className={campos.campo}
            type="search"
            autoComplete="off"
            required
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
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
            {pendente ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </form>
      {resultado && (
        <div role="status" aria-live="polite">
          <TabelaAlunos alunos={resultado} legenda={`Resultado da busca: ${resultado.length} ${resultado.length === 1 ? 'aluno' : 'alunos'}`} />
        </div>
      )}
    </section>
  );
}
