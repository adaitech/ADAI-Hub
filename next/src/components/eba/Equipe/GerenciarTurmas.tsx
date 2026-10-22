'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type FormEvent } from 'react';
import type { apagarTurmaAcao, criarTurmaAcao, editarTurmaAcao } from '@/app/(restrito)/eba/equipe/acoes';
import { buttonClassName } from '@/components/ui/ButtonLink';
import { dataCurta, paraCampoDeData, ROTULOS_STATUS } from '@/lib/eba/equipe/formato';
import campos from '../Questionario/Questionario.module.css';
import styles from './Equipe.module.css';

export interface TurmaDaTela {
  id: string;
  nome: string;
  status: 1 | 2 | 3;
  inicio: string;
  fim: string;
}

export interface GerenciarTurmasProps {
  turmas: TurmaDaTela[];
  acoes: { criar: typeof criarTurmaAcao; editar: typeof editarTurmaAcao; apagar: typeof apagarTurmaAcao };
}

const MENSAGENS: Record<string, string> = {
  invalido: 'Confira os campos: nome de 3 a 200 caracteres e término depois do início.',
  recusado: 'A API recusou os dados. Confira os campos.',
  limite: 'Muitas ações seguidas. Aguarde um minuto.',
  indisponivel: 'Não conseguimos concluir agora. Tente em alguns minutos.',
  'turma-com-alunos': 'Esta turma tem alunos e não pode ser apagada.',
};

const VAZIO = { id: '', nome: '', status: 1 as 1 | 2 | 3, inicio: '', fim: '' };

/** Turmas: listar, criar, editar e apagar (com confirmação; a ação recusa apagar turma com alunos). */
export function GerenciarTurmas({ turmas, acoes }: GerenciarTurmasProps) {
  const id = useId();
  const roteador = useRouter();
  const titulo = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState(VAZIO);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const editando = form.id !== '';

  /** Resposta de uma ação: sessão vencida volta ao login; erro mostra a mensagem; sucesso atualiza a lista. */
  async function executar(fazer: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string) {
    if (pendente) return;
    setPendente(true);
    setErro(null);
    setAviso(null);
    try {
      const resposta = await fazer();
      if (resposta.ok) {
        setAviso(sucesso);
        setForm(VAZIO);
        setConfirmando(null);
        roteador.refresh();
        return;
      }
      if (resposta.erro === 'sessao') {
        roteador.replace('/eba/equipe/login?motivo=sessao');
        return;
      }
      setErro(MENSAGENS[resposta.erro ?? ''] ?? MENSAGENS.indisponivel);
    } catch {
      setErro(MENSAGENS.indisponivel);
    } finally {
      setPendente(false);
    }
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const dados = { nome: form.nome, status: form.status, inicio: form.inicio, fim: form.fim };
    if (editando) void executar(() => acoes.editar({ ...dados, id: form.id }), 'Turma atualizada.');
    else void executar(() => acoes.criar(dados), 'Turma criada.');
  }

  function editar(turma: TurmaDaTela) {
    setErro(null);
    setAviso(null);
    setConfirmando(null);
    setForm({ id: turma.id, nome: turma.nome, status: turma.status, inicio: paraCampoDeData(turma.inicio), fim: paraCampoDeData(turma.fim) });
    titulo.current?.focus();
  }

  return (
    <div className={styles.secao}>
      <section className={styles.caixa} aria-labelledby={`${id}-form`}>
        <h2 id={`${id}-form`} ref={titulo} tabIndex={-1} className={campos.subtitulo}>
          {editando ? 'Editar turma' : 'Nova turma'}
        </h2>
        <form className={campos.formulario} onSubmit={salvar} noValidate>
          <div className={campos.grupo}>
            <label className={campos.rotulo} htmlFor={`${id}-nome`}>
              Nome da turma
            </label>
            <input id={`${id}-nome`} className={campos.campo} required maxLength={200} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className={campos.grupo}>
            <label className={campos.rotulo} htmlFor={`${id}-status`}>
              Status
            </label>
            <select id={`${id}-status`} className={campos.campo} value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) as 1 | 2 | 3 })}>
              {([1, 2, 3] as const).map((valor) => (
                <option key={valor} value={valor}>
                  {ROTULOS_STATUS[valor]}
                </option>
              ))}
            </select>
          </div>
          <div className={campos.grupo}>
            <label className={campos.rotulo} htmlFor={`${id}-inicio`}>
              Início
            </label>
            <input id={`${id}-inicio`} className={campos.campo} type="date" required value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
          </div>
          <div className={campos.grupo}>
            <label className={campos.rotulo} htmlFor={`${id}-fim`}>
              Término
            </label>
            <input id={`${id}-fim`} className={campos.campo} type="date" required value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
          </div>
          {erro && (
            <p role="alert" className={campos.erro}>
              {erro}
            </p>
          )}
          {aviso && (
            <p role="status" className={campos.texto}>
              {aviso}
            </p>
          )}
          <div className={campos.botoes}>
            <button type="submit" className={buttonClassName()} disabled={pendente}>
              {editando ? 'Salvar alterações' : 'Criar turma'}
            </button>
            {editando && (
              <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => setForm(VAZIO)}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      {turmas.length === 0 ? (
        <p className={styles.vazio}>Nenhuma turma cadastrada.</p>
      ) : (
        <div className={styles.rolagem}>
          <table className={styles.tabela}>
            <caption>Turmas ({turmas.length})</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Status</th>
                <th scope="col">Início</th>
                <th scope="col">Término</th>
                <th scope="col">
                  <span className="visually-hidden">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => (
                <tr key={turma.id}>
                  <th scope="row">{turma.nome}</th>
                  <td>{ROTULOS_STATUS[turma.status]}</td>
                  <td>{dataCurta(turma.inicio)}</td>
                  <td>{dataCurta(turma.fim)}</td>
                  <td>
                    {confirmando === turma.id ? (
                      <div className={styles.confirmar} role="group" aria-label={`Confirmar exclusão de ${turma.nome}`}>
                        <p className={campos.texto}>Apagar a turma “{turma.nome}”? Não dá para desfazer.</p>
                        <div className={styles.acoes}>
                          <button type="button" className={buttonClassName()} disabled={pendente} onClick={() => void executar(() => acoes.apagar(turma.id), 'Turma apagada.')}>
                            Confirmar exclusão
                          </button>
                          <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => setConfirmando(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.acoes}>
                        <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => editar(turma)}>
                          Editar<span className="visually-hidden"> {turma.nome}</span>
                        </button>
                        <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => setConfirmando(turma.id)}>
                          Apagar<span className="visually-hidden"> {turma.nome}</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
