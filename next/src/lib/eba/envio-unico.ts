/**
 * Envio idempotente por instância do servidor (mesma ideia do limitador: proteção local, não global).
 * Chamadas com a mesma chave enquanto uma está em andamento compartilham a mesma execução, e o
 * resultado de sucesso fica guardado por `validadeMs`: duas abas ou um reenvio logo depois do sucesso
 * não gravam as respostas de novo na API. Falhas não ficam guardadas (a próxima chamada tenta de novo).
 */
export function criarEnvioUnico<T>(
  validadeMs: number,
  maxChaves = 1_000,
): (chave: string, agora: number, fazer: () => Promise<T>) => Promise<T> {
  const emAndamento = new Map<string, Promise<T>>();
  const feitos = new Map<string, { em: number; valor: T }>();

  return (chave, agora, fazer) => {
    const feito = feitos.get(chave);
    if (feito && agora - feito.em < validadeMs) return Promise.resolve(feito.valor);

    const andamento = emAndamento.get(chave);
    if (andamento) return andamento;

    const execucao = fazer()
      .then((valor) => {
        feitos.delete(chave);
        feitos.set(chave, { em: agora, valor });
        if (feitos.size > maxChaves) {
          const maisAntigo = feitos.keys().next().value;
          if (maisAntigo !== undefined) feitos.delete(maisAntigo);
        }
        return valor;
      })
      .finally(() => emAndamento.delete(chave));
    emAndamento.set(chave, execucao);
    return execucao;
  };
}
