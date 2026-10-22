import { criarEnvioUnico } from './envio-unico';

const MINUTO = 60_000;

describe('criarEnvioUnico', () => {
  it('chamadas iguais em andamento compartilham uma única execução', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    let liberar!: (valor: string) => void;
    const fazer = jest.fn(() => new Promise<string>((ok) => (liberar = ok)));

    const a = enviarUnico('aluno-1:dons', 0, fazer);
    const b = enviarUnico('aluno-1:dons', 1, fazer);
    liberar('resultado');

    await expect(a).resolves.toBe('resultado');
    await expect(b).resolves.toBe('resultado');
    expect(fazer).toHaveBeenCalledTimes(1);
  });

  it('depois do sucesso, devolve o mesmo resultado sem executar de novo dentro da validade', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    const fazer = jest.fn(async () => 'resultado');
    await enviarUnico('k', 0, fazer);
    await expect(enviarUnico('k', 10 * MINUTO - 1, fazer)).resolves.toBe('resultado');
    expect(fazer).toHaveBeenCalledTimes(1);
  });

  it('a validade conta a partir do fim de uma execução lenta (API fria), não do começo', async () => {
    const agoraDoRelogio = jest.spyOn(performance, 'now');
    agoraDoRelogio.mockReturnValueOnce(0).mockReturnValue(50_000);
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    const fazer = jest.fn(async () => 'resultado');
    await enviarUnico('lenta', 0, fazer);
    // 10 min depois do começo, mas só 9 min e 10 s depois do fim: ainda vale.
    await expect(enviarUnico('lenta', 10 * MINUTO, fazer)).resolves.toBe('resultado');
    expect(fazer).toHaveBeenCalledTimes(1);
    agoraDoRelogio.mockRestore();
  });

  it('passada a validade, executa de novo', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    const fazer = jest.fn(async () => 'resultado');
    await enviarUnico('k', 0, fazer);
    await enviarUnico('k', 10 * MINUTO + 1_000, fazer);
    expect(fazer).toHaveBeenCalledTimes(2);
  });

  it('falha não fica guardada: a próxima chamada tenta de novo', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    const fazer = jest.fn().mockRejectedValueOnce(new Error('API fora')).mockResolvedValueOnce('resultado');
    await expect(enviarUnico('k', 0, fazer)).rejects.toThrow('API fora');
    await expect(enviarUnico('k', 1, fazer)).resolves.toBe('resultado');
    expect(fazer).toHaveBeenCalledTimes(2);
  });

  it('chaves diferentes não se misturam', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO);
    await enviarUnico('aluno-1', 0, async () => 'um');
    await expect(enviarUnico('aluno-2', 0, async () => 'dois')).resolves.toBe('dois');
  });

  it('guarda no máximo maxChaves resultados (descarta o mais antigo)', async () => {
    const enviarUnico = criarEnvioUnico<string>(10 * MINUTO, 2);
    const fazer = jest.fn(async () => 'r');
    await enviarUnico('a', 0, fazer);
    await enviarUnico('b', 0, fazer);
    await enviarUnico('c', 0, fazer);
    await enviarUnico('a', 1, fazer);
    expect(fazer).toHaveBeenCalledTimes(4);
  });
});
