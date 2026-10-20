import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { registrarEvento } from '@/lib/analytics/datalayer';
import type { Resultado } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, type SlugTeste } from '@/lib/eba-api/testes';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import mock from './Questionario.mock.json';
import { Questionario, type QuestionarioProps } from './Questionario';
import { chaveProgresso } from './estado';

jest.mock('@/lib/analytics/datalayer', () => ({ registrarEvento: jest.fn() }));

type Acoes = QuestionarioProps['acoes'];
type Testes = typeof mock.testes;

const perguntasCurtas = [
  { numero: 1, texto: 'Gosto de ajudar as pessoas fazendo pequenos serviços.' },
  { numero: 2, texto: 'Tenho alegria em receber pessoas em casa.' },
  { numero: 3, texto: 'Oro pelas pessoas com frequência.' },
];

const resultadoNota = mock.resultados.nota as Resultado;

function criarAcoes(extra: Partial<Record<keyof Acoes, jest.Mock>> = {}) {
  const acoes = {
    identificar: jest.fn(async () => ({ ok: true, dados: { emailMascarado: 'a***@email.com' } })),
    cadastrar: jest.fn(async () => ({ ok: true, dados: { emailMascarado: 'n***@email.com' } })),
    enviar: jest.fn(async () => ({ ok: true, dados: resultadoNota })),
    sair: jest.fn(async () => undefined),
    ...extra,
  };
  return acoes as typeof acoes & Acoes;
}

function montar(slug: SlugTeste = 'dons-servico', extra: Partial<QuestionarioProps> = {}) {
  const acoes = (extra.acoes as ReturnType<typeof criarAcoes>) ?? criarAcoes();
  const props: QuestionarioProps = {
    teste: definicaoDoTeste(slug)!,
    abertura: (mock.testes as Testes)[slug].abertura,
    perguntas: slug === 'dons-servico' ? perguntasCurtas : (mock.testes as Testes)[slug].perguntas,
    sessao: { emailMascarado: 'a***@email.com' },
    ...extra,
    acoes,
  };
  const utils = render(<Questionario {...props} />);
  return { ...utils, acoes, props };
}

const botao = (nome: string | RegExp) => screen.getByRole('button', { name: nome });
const comecar = () => fireEvent.click(botao(/começar o teste|continuar o teste/i));
/** Escolha com mouse (clique com detail 1), que avança. */
const escolherNota = (rotulo: string) => fireEvent.click(screen.getByRole('radio', { name: rotulo }), { detail: 1 });
/** Escolha pelo teclado: as setas marcam o radio e geram change + clique com detail 0. */
const escolherPeloTeclado = (rotulo: string) => fireEvent.click(screen.getByRole('radio', { name: rotulo }), { detail: 0 });
const foto = (container: HTMLElement) => container.querySelector('img')!;
/** Deixa as promessas das ações (fakes) resolverem dentro do act. */
const esperarAcoes = () => act(async () => {});

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
});

describe('Questionario — abertura', () => {
  it('mostra o teste, a posição na apostila, a aula e a foto de capa (decorativa)', () => {
    const { container } = montar('dons-servico', { sessao: null });
    expect(screen.getByRole('heading', { level: 1, name: 'Dons de serviço prático' })).toBeInTheDocument();
    expect(screen.getByText('Teste 1 de 5')).toBeInTheDocument();
    expect(screen.getByText('Aula 5 do CDV')).toBeInTheDocument();
    expect(screen.getByText('55 afirmações')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Como responder' })).toBeInTheDocument();
    expect(container.querySelector('[data-section="teste-eba"]')).toHaveAttribute('aria-labelledby');
    expect(foto(container)).toHaveAttribute('alt', '');
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/dons-servico/capa.webp');
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('sem aula nem textos opcionais, mostra só o resumo', () => {
    montar('dons-servico', { abertura: { resumo: 'Resumo.', perguntas: null, resposta: null, comoResponder: null, aula: null } });
    expect(screen.queryByText(/do CDV/)).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.getByText('Resumo.')).toBeInTheDocument();
  });

  it('sem sessão, "Começar" pede o e-mail; com sessão, vai direto para a primeira pergunta', () => {
    const { unmount } = montar('dons-servico', { sessao: null });
    comecar();
    expect(screen.getByRole('heading', { level: 2, name: 'Antes de começar' })).toHaveFocus();
    unmount();
    montar();
    comecar();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  it('com sessão, a abertura já mostra "Respondendo como" com "Trocar e-mail"; sem sessão, não', () => {
    const { unmount } = montar();
    expect(screen.getByText('a***@email.com')).toBeInTheDocument();
    expect(botao('Não é você? Trocar e-mail')).toBeInTheDocument();
    unmount();
    montar('dons-servico', { sessao: null });
    expect(screen.queryByText(/Respondendo como/)).toBeNull();
  });

  it('"Trocar e-mail" na abertura apaga o progresso salvo e pede o e-mail', async () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), JSON.stringify({ passo: 1, respostas: { 1: 3 }, marcadas: [], escolhidas: [], respondidoComo: 'a***@email.com' }));
    const { acoes } = montar();
    expect(screen.getByText('Você já respondeu 1 de 3 perguntas nesta aba.')).toBeInTheDocument();
    fireEvent.click(botao('Não é você? Trocar e-mail'));
    await esperarAcoes();
    expect(acoes.sair).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('API fora (sem perguntas) → mensagem, sem sair da abertura', () => {
    montar('dons-servico', { perguntas: [] });
    comecar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar as perguntas agora. Tente em alguns minutos.');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it.each<SlugTeste>(['temperamento-pessoal', 'dons-servico'])('perguntasIndisponiveis (%s, API fora ao abrir) → mensagem, sem sair da abertura', (slug) => {
    montar(slug, { perguntasIndisponiveis: true });
    expect(screen.queryByRole('alert')).toBeNull();
    comecar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar as perguntas agora. Tente em alguns minutos.');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('Questionario — perguntas de nota (0 a 5)', () => {
  it('nome acessível de cada opção é "N — Rótulo"; o foco vai para o enunciado', () => {
    montar();
    comecar();
    for (const nome of ['0 — Nunca', '1 — Raramente', '2 — Às vezes', '3 — Frequentemente', '4 — Muito', '5 — Eu brilho nisso!']) {
      expect(screen.getByRole('radio', { name: nome })).toBeInTheDocument();
    }
    const legenda = screen.getByText(perguntasCurtas[0].texto);
    expect(legenda.tagName).toBe('LEGEND');
    expect(legenda).toHaveFocus();
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
  });

  it('escolher avança; voltar mantém a resposta marcada', () => {
    montar();
    comecar();
    escolherNota('4 — Muito');
    expect(screen.getByText(perguntasCurtas[1].texto)).toHaveFocus();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    fireEvent.click(botao('Pergunta anterior'));
    expect(screen.getByRole('radio', { name: '4 — Muito' })).toBeChecked();
    fireEvent.click(botao('Próxima pergunta'));
    expect(screen.getByText(perguntasCurtas[1].texto)).toBeInTheDocument();
  });

  it('teclado: as setas só marcam (não pulam de pergunta); "Próxima pergunta" segue', () => {
    montar();
    comecar();
    escolherPeloTeclado('0 — Nunca');
    escolherPeloTeclado('1 — Raramente');
    escolherPeloTeclado('2 — Às vezes');
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2 — Às vezes' })).toBeChecked();
    fireEvent.click(botao('Próxima pergunta'));
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
    fireEvent.click(botao('Pergunta anterior'));
    expect(screen.getByRole('radio', { name: '2 — Às vezes' })).toBeChecked();
  });

  it('toque/mouse: pointerdown no rótulo + clique avança, mesmo se o navegador mandar detail 0', () => {
    montar();
    comecar();
    const opcao = screen.getByRole('radio', { name: '3 — Frequentemente' });
    fireEvent.pointerDown(opcao.closest('label')!);
    fireEvent.click(opcao, { detail: 0 });
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
    // O pointerdown não "vaza" para a próxima escolha pelo teclado.
    escolherPeloTeclado('1 — Raramente');
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
  });

  it('clicar de novo na opção já marcada avança', () => {
    montar();
    comecar();
    escolherNota('4 — Muito');
    fireEvent.click(botao('Pergunta anterior'));
    escolherNota('4 — Muito');
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
  });

  it('a foto troca com a pergunta e a da próxima é pré-carregada', () => {
    const { container } = montar();
    comecar();
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/dons-servico/1.webp');
    expect(document.head.querySelector('link[rel="preload"][href="/eba/testes/dons-servico/2.webp"]')).not.toBeNull();
    escolherNota('2 — Às vezes');
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/dons-servico/2.webp');
  });

  it('"Respondendo como" mostra o e-mail mascarado; "Trocar e-mail" sai da sessão e pede o e-mail', async () => {
    const { acoes } = montar();
    comecar();
    expect(screen.getByText('a***@email.com')).toBeInTheDocument();
    fireEvent.click(botao('Não é você? Trocar e-mail'));
    await esperarAcoes();
    expect(acoes.sair).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('"Trocar e-mail" apaga as respostas (estado e sessionStorage): a outra pessoa recomeça da primeira pergunta', async () => {
    const identificar = jest.fn(async () => ({ ok: true, dados: { emailMascarado: 'b***@outro.com' } }));
    const { acoes } = montar('dons-servico', { acoes: criarAcoes({ identificar }) });
    comecar();
    escolherNota('3 — Frequentemente');
    escolherNota('4 — Muito');
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).not.toBeNull();
    fireEvent.click(botao('Não é você? Trocar e-mail'));
    await esperarAcoes();
    expect(acoes.sair).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'bruno@outro.com' } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('b***@outro.com')).toBeInTheDocument();
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    escolherNota('1 — Raramente');
    expect(JSON.parse(sessionStorage.getItem(chaveProgresso('dons-servico'))!)).toEqual({
      passo: 1,
      respostas: { 1: 1 },
      marcadas: [],
      escolhidas: [],
      respondidoComo: 'b***@outro.com',
    });
  });

  it('iniciar_teste dispara uma vez, na primeira pergunta', () => {
    montar();
    comecar();
    escolherNota('1 — Raramente');
    fireEvent.click(botao('Pergunta anterior'));
    expect(registrarEvento).toHaveBeenCalledTimes(1);
    expect(registrarEvento).toHaveBeenCalledWith('iniciar_teste', { teste: 'dons-servico' });
  });
});

describe('Questionario — progresso no sessionStorage (Foco 2)', () => {
  it('salva só as respostas e o e-mail mascarado da sessão (nunca o e-mail inteiro) na chave do slug', async () => {
    const { unmount } = montar();
    comecar();
    escolherNota('3 — Frequentemente');
    const salvo = sessionStorage.getItem(chaveProgresso('dons-servico'))!;
    expect(JSON.parse(salvo)).toEqual({ passo: 1, respostas: { 1: 3 }, marcadas: [], escolhidas: [], respondidoComo: 'a***@email.com' });
    unmount();
    sessionStorage.clear();
    montar('dons-servico', { sessao: null });
    comecar();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana.completo@email.com' } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
    escolherNota('2 — Às vezes');
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).not.toContain('ana.completo');
  });

  it('progresso de outra pessoa (outro e-mail mascarado) é descartado ao abrir', () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), JSON.stringify({ passo: 2, respostas: { 1: 3, 2: 5 }, marcadas: [], escolhidas: [], respondidoComo: 'x***@outro.com' }));
    montar();
    expect(botao('Começar o teste')).toBeInTheDocument();
    expect(screen.queryByText(/Você já respondeu/)).toBeNull();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
  });

  it('sem sessão, o progresso salvo espera a identificação: outra pessoa recomeça do zero', async () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), JSON.stringify({ passo: 2, respostas: { 1: 3, 2: 5 }, marcadas: [], escolhidas: [], respondidoComo: 'x***@outro.com' }));
    montar('dons-servico', { sessao: null });
    expect(screen.getByText('Você já respondeu 2 de 3 perguntas nesta aba.')).toBeInTheDocument();
    comecar();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@email.com' } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
  });

  it('recarregar restaura só a chave do próprio slug, sem duplicar as respondidas', () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), JSON.stringify({ passo: 2, respostas: { 1: 3, 2: 5 }, marcadas: [], escolhidas: [], respondidoComo: 'a***@email.com' }));
    sessionStorage.setItem(chaveProgresso('dons-ministerio'), JSON.stringify({ passo: 1, respostas: { 1: 0, 2: 0, 3: 0 }, marcadas: [], escolhidas: [], respondidoComo: 'a***@email.com' }));
    montar();
    expect(screen.getByText('Você já respondeu 2 de 3 perguntas nesta aba.')).toBeInTheDocument();
    comecar();
    expect(screen.getByText(perguntasCurtas[2].texto)).toBeInTheDocument();
    fireEvent.click(botao('Pergunta anterior'));
    expect(screen.getByRole('radio', { name: '5 — Eu brilho nisso!' })).toBeChecked();
    // Responder de novo a mesma pergunta troca a nota, sem contar duas vezes.
    escolherNota('1 — Raramente');
    escolherNota('4 — Muito');
    expect(JSON.parse(sessionStorage.getItem(chaveProgresso('dons-servico'))!).respostas).toEqual({ 1: 3, 2: 1, 3: 4 });
    expect(JSON.parse(sessionStorage.getItem(chaveProgresso('dons-ministerio'))!).respostas).toEqual({ 1: 0, 2: 0, 3: 0 });
  });

  it('progresso corrompido é ignorado', () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), '{quebrado');
    montar();
    expect(botao('Começar o teste')).toBeInTheDocument();
  });

  it('sessionStorage indisponível não quebra a tela', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    try {
      montar();
      comecar();
      escolherNota('0 — Nunca');
      expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});

/** Responde as 3 perguntas curtas e fica na última. */
function responderTudo() {
  comecar();
  escolherNota('1 — Raramente');
  escolherNota('2 — Às vezes');
  escolherNota('3 — Frequentemente');
}

describe('Questionario — envio (Foco 4)', () => {
  it('"Enviar respostas" só habilita com todas respondidas', () => {
    montar();
    comecar();
    escolherNota('1 — Raramente');
    escolherNota('2 — Às vezes');
    expect(botao('Enviar respostas')).toBeDisabled();
    escolherNota('3 — Frequentemente');
    expect(botao('Enviar respostas')).toBeEnabled();
  });

  it('dois cliques em "Enviar" → uma chamada, com o botão desabilitado enquanto envia', async () => {
    let concluir: (r: unknown) => void = () => {};
    const enviar = jest.fn(() => new Promise((resolve) => (concluir = resolve)));
    const { acoes } = montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    fireEvent.click(botao('Enviar respostas'));
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(acoes.enviar).toHaveBeenCalledWith('dons-servico', [
      { numero: 1, nota: 1 },
      { numero: 2, nota: 2 },
      { numero: 3, nota: 3 },
    ]);
    expect(botao('Enviar respostas')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Calculando seu resultado…');
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Não é você? Trocar e-mail' })).toBeNull();
    await act(async () => concluir({ ok: true, dados: resultadoNota }));
    expect(screen.getByRole('heading', { level: 2, name: 'Seu resultado' })).toBeInTheDocument();
  });

  it('ao concluir: limpa o sessionStorage, dispara concluir_teste e mostra a foto do resultado', async () => {
    const { container } = montar();
    responderTudo();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).not.toBeNull();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
    expect(registrarEvento).toHaveBeenLastCalledWith('concluir_teste', { teste: 'dons-servico' });
    expect(registrarEvento).toHaveBeenCalledTimes(2);
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/dons-servico/resultado.webp');
  });

  it('sessão encerrada → "expirou" com as respostas mantidas; depois do e-mail, reenvia', async () => {
    const enviar = jest.fn().mockResolvedValueOnce({ ok: false, erro: 'sessao' }).mockResolvedValueOnce({ ok: true, dados: resultadoNota });
    const { acoes } = montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(screen.getByRole('heading', { level: 2, name: 'Sua sessão foi encerrada' })).toHaveFocus();
    expect(JSON.parse(sessionStorage.getItem(chaveProgresso('dons-servico'))!).respostas).toEqual({ 1: 1, 2: 2, 3: 3 });
    fireEvent.click(botao('Informar e-mail'));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@email.com' } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
    expect(acoes.identificar).toHaveBeenCalledWith('ana@email.com');
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(enviar.mock.calls[1]).toEqual(enviar.mock.calls[0]);
    expect(screen.getByRole('heading', { level: 2, name: 'Seu resultado' })).toBeInTheDocument();
  });

  it('sessão encerrada e outra pessoa se identifica: não reenvia as respostas de quem saiu e recomeça', async () => {
    const enviar = jest.fn().mockResolvedValueOnce({ ok: false, erro: 'sessao' });
    const identificar = jest.fn(async () => ({ ok: true, dados: { emailMascarado: 'b***@outro.com' } }));
    montar('dons-servico', { acoes: criarAcoes({ enviar, identificar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    fireEvent.click(botao('Informar e-mail'));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'bruno@outro.com' } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
  });

  it('respostas gravadas sem resultado: avisa o envio, sem "Tentar de novo"; limpa o progresso e dispara concluir_teste', async () => {
    const enviar = jest.fn(async () => ({ ok: true, dados: { tipo: 'sem-resultado' } }));
    montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(screen.getByText('Suas respostas foram enviadas para a equipe da EBA. Não conseguimos mostrar o resultado agora.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(sessionStorage.getItem(chaveProgresso('dons-servico'))).toBeNull();
    expect(registrarEvento).toHaveBeenLastCalledWith('concluir_teste', { teste: 'dons-servico' });
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('API indisponível → "erro" com "Tentar de novo", que reenvia', async () => {
    const enviar = jest.fn().mockResolvedValueOnce({ ok: false, erro: 'indisponivel' }).mockResolvedValueOnce({ ok: true, dados: resultadoNota });
    montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos enviar suas respostas');
    fireEvent.click(botao('Tentar de novo'));
    await esperarAcoes();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { level: 2, name: 'Seu resultado' })).toBeInTheDocument();
  });

  it('falha de rede (a ação lança) também vira "erro"', async () => {
    const enviar = jest.fn().mockRejectedValue(new Error('rede'));
    montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(botao('Tentar de novo')).toBeInTheDocument();
  });

  it('API recusa → "Algumas respostas não foram aceitas." e dá para revisar', async () => {
    const enviar = jest.fn().mockResolvedValue({ ok: false, erro: 'recusado' });
    montar('dons-servico', { acoes: criarAcoes({ enviar }) });
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(screen.getByRole('alert')).toHaveTextContent('Algumas respostas não foram aceitas.');
    fireEvent.click(botao('Revisar respostas'));
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1 — Raramente' })).toBeChecked();
  });

  it('"Sair" no resultado encerra a sessão no servidor', async () => {
    const { acoes } = montar();
    responderTudo();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    fireEvent.click(botao('Sair'));
    await esperarAcoes();
    expect(acoes.sair).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Você saiu.');
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  });
});

describe('Questionario — talentos (Foco 5)', () => {
  const perguntas = (mock.testes as Testes)['talentos-naturais'].perguntas;

  it('marca, depois escolhe até 3: a 4ª fica desabilitada; "Concluir" exige uma escolha', async () => {
    const { acoes } = montar('talentos-naturais');
    comecar();
    expect(screen.getByText('Etapa 1 de 2')).toBeInTheDocument();
    expect(botao('Próximo')).toBeDisabled();
    const quatro = perguntas.slice(0, 4);
    for (const p of quatro) fireEvent.click(screen.getByRole('checkbox', { name: p.texto }));
    expect(screen.getByText('Marque quantas quiser. 4 marcadas.')).toBeInTheDocument();
    fireEvent.click(botao('Próximo'));
    expect(screen.getByText('Etapa 2 de 2')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(botao('Concluir')).toBeDisabled();
    for (const p of quatro.slice(0, 3)) fireEvent.click(screen.getByRole('checkbox', { name: p.texto }));
    expect(screen.getByRole('checkbox', { name: quatro[3].texto })).toBeDisabled();
    expect(screen.getByText('3 de 3 escolhidas.')).toBeInTheDocument();
    fireEvent.click(botao('Concluir'));
    await esperarAcoes();
    const enviadas = (acoes.enviar.mock.calls[0] as unknown[])[1] as { numero: number; nota: number }[];
    expect(enviadas).toHaveLength(perguntas.length);
    expect(enviadas.filter((r) => r.nota === 1).map((r) => r.numero)).toEqual(quatro.slice(0, 3).map((p) => p.numero));
  });

  it('voltar para a etapa 1 mantém as marcadas', () => {
    montar('talentos-naturais');
    comecar();
    fireEvent.click(screen.getByRole('checkbox', { name: perguntas[0].texto }));
    fireEvent.click(botao('Próximo'));
    fireEvent.click(botao('Anterior'));
    expect(screen.getByRole('checkbox', { name: perguntas[0].texto })).toBeChecked();
  });
});

describe('Questionario — estilo pessoal (1 a 5)', () => {
  it('nome acessível de cada opção diz de que frase está mais perto; 14 telas, soma enviada', async () => {
    const { acoes } = montar('estilo-pessoal');
    comecar();
    expect(screen.getByText('Pergunta 1 de 14')).toBeInTheDocument();
    expect(screen.getByText('Fico feliz…')).toHaveFocus();
    expect(screen.getByRole('radio', { name: '1 — mais perto de: Fazendo algo para as pessoas' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3 — entre as duas' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '5 — mais perto de: Conversando com as pessoas' })).toBeInTheDocument();
    escolherPeloTeclado('5 — mais perto de: Conversando com as pessoas');
    expect(screen.getByText('Pergunta 1 de 14')).toBeInTheDocument();
    for (let i = 0; i < 14; i++) fireEvent.click(screen.getByRole('radio', { name: i < 7 ? /^2 —/ : /^4 —/ }), { detail: 1 });
    expect(screen.getByText('Pergunta 14 de 14')).toBeInTheDocument();
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(acoes.enviar).toHaveBeenCalledWith('estilo-pessoal', [
      { numero: 1, nota: 14 },
      { numero: 2, nota: 28 },
    ]);
  });
});

describe('Questionario — temperamento (páginas de 10)', () => {
  it('20 páginas com "Próximo"; envia a contagem por grupo', async () => {
    const { acoes, container } = montar('temperamento-pessoal');
    comecar();
    expect(screen.getByText('Página 1 de 20')).toBeInTheDocument();
    expect(screen.getByText('Sanguíneo: marque as características que descrevem você')).toHaveFocus();
    expect(screen.getAllByRole('checkbox')).toHaveLength(10);
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/temperamento-pessoal/1.webp');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(screen.getByText('Marque quantas quiser, inclusive as fraquezas. 2 marcadas nesta página.')).toBeInTheDocument();
    for (let i = 0; i < 19; i++) fireEvent.click(botao('Próximo'));
    expect(screen.getByText('Página 20 de 20')).toBeInTheDocument();
    expect(screen.getByText('Fleumático: marque as características que descrevem você')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('checkbox')[9]);
    fireEvent.click(botao('Enviar respostas'));
    await esperarAcoes();
    expect(acoes.enviar).toHaveBeenCalledWith('temperamento-pessoal', [
      { numero: 1, nota: 2 },
      { numero: 2, nota: 0 },
      { numero: 3, nota: 0 },
      { numero: 4, nota: 1 },
    ]);
  });
});

describe('Questionario — identificação', () => {
  const irParaEmail = (extra: Partial<QuestionarioProps> = {}) => {
    const r = montar('dons-servico', { sessao: null, ...extra });
    comecar();
    return r;
  };
  const informar = async (email: string) => {
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
    fireEvent.click(botao('Continuar'));
    await esperarAcoes();
  };

  it('aviso de privacidade com link e campo de e-mail do celular; foto da identificação', () => {
    const { container } = irParaEmail();
    expect(screen.getByText(/Usamos seu e-mail só para ligar suas respostas à sua turma\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/politica-de-privacidade');
    const campo = screen.getByLabelText('E-mail');
    expect(campo).toHaveAttribute('autocomplete', 'email');
    expect(campo).toHaveAttribute('inputmode', 'email');
    expect(foto(container).getAttribute('src')).toBe('/eba/testes/identificacao.webp');
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('e-mail encontrado → primeira pergunta, com "Respondendo como"', async () => {
    const { acoes } = irParaEmail();
    await informar('  ana@email.com ');
    expect(acoes.identificar).toHaveBeenCalledWith('ana@email.com');
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('a***@email.com')).toBeInTheDocument();
  });

  it('e-mail vazio ou sem @ → "Confira os campos destacados." sem chamar a ação', async () => {
    const { acoes } = irParaEmail();
    await informar('ana');
    expect(acoes.identificar).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it.each([
    ['invalido', 'Confira os campos destacados.'],
    ['limite', 'Muitas tentativas. Aguarde um minuto.'],
    ['indisponivel', 'Não conseguimos verificar agora. Tente em alguns minutos.'],
    ['sessao', 'Não conseguimos verificar agora. Tente em alguns minutos.'],
  ])('erro %s → %s', async (erro, mensagem) => {
    irParaEmail({ acoes: criarAcoes({ identificar: jest.fn().mockResolvedValue({ ok: false, erro }) }) });
    await informar('ana@email.com');
    expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
  });

  it('indisponível (ex.: turmas que não carregam para um e-mail novo) → "Tentar de novo" refaz a identificação', async () => {
    const identificar = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, erro: 'indisponivel' })
      .mockResolvedValueOnce({ ok: true, dados: { novo: true, turmas: [{ id: 't1', nome: 'Turma 1' }] } });
    irParaEmail({ acoes: criarAcoes({ identificar }) });
    await informar('nova@email.com');
    fireEvent.click(botao('Tentar de novo'));
    await esperarAcoes();
    expect(identificar).toHaveBeenCalledTimes(2);
    expect(identificar).toHaveBeenLastCalledWith('nova@email.com');
    expect(screen.getByRole('heading', { level: 2, name: 'Primeiro acesso' })).toBeInTheDocument();
  });

  it.each(['limite', 'invalido'])('erro %s não mostra "Tentar de novo"', async (erro) => {
    irParaEmail({ acoes: criarAcoes({ identificar: jest.fn().mockResolvedValue({ ok: false, erro }) }) });
    await informar('ana@email.com');
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('a ação lança (rede) → indisponível; resposta sem dados também', async () => {
    const identificar = jest.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce({ ok: true });
    irParaEmail({ acoes: criarAcoes({ identificar }) });
    await informar('ana@email.com');
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos verificar agora.');
    await informar('ana@email.com');
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos verificar agora.');
  });

  it('enquanto verifica, o botão fica desabilitado', async () => {
    let concluir: (r: unknown) => void = () => {};
    const identificar = jest.fn(() => new Promise((resolve) => (concluir = resolve)));
    irParaEmail({ acoes: criarAcoes({ identificar }) });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@email.com' } });
    fireEvent.click(botao('Continuar'));
    expect(botao('Continuar')).toBeDisabled();
    await act(async () => concluir({ ok: true, dados: { emailMascarado: 'a***@email.com' } }));
  });

  describe('primeiro acesso', () => {
    const turmas = [
      { id: 't1', nome: 'CDV · Campestre · quinta 20h' },
      { id: 't2', nome: 'CDV · On-line · sábado 9h' },
    ];
    const novo = (lista = turmas) => jest.fn().mockResolvedValue({ ok: true, dados: { novo: true, turmas: lista } });

    it('e-mail novo → cadastro com nome, unidade e turma; cadastra e começa', async () => {
      const { acoes, container } = irParaEmail({ acoes: criarAcoes({ identificar: novo() }) });
      await informar('nova@email.com');
      expect(screen.getByRole('heading', { level: 2, name: 'Primeiro acesso' })).toHaveFocus();
      expect(screen.getByText('nova@email.com')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(7);
      expect(auditarAcessibilidade(container)).toEqual([]);
      fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Anália Franco' }));
      fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 't2' } });
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(acoes.cadastrar).toHaveBeenCalledWith({ email: 'nova@email.com', nome: 'Ana Souza', unidade: 'colorado', idTurma: 't2' });
      expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
      expect(screen.getByText('n***@email.com')).toBeInTheDocument();
    });

    it('campos faltando → destacados, sem chamar a ação', async () => {
      const { acoes } = irParaEmail({ acoes: criarAcoes({ identificar: novo() }) });
      await informar('nova@email.com');
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(acoes.cadastrar).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados.');
      expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Turma')).toHaveAttribute('aria-invalid', 'true');
      const unidade = screen.getByRole('group', { name: 'Unidade' });
      expect(unidade).toHaveAttribute('data-invalido', 'true');
      expect(unidade).toHaveAccessibleDescription('Escolha sua unidade.');
      fireEvent.click(screen.getByRole('radio', { name: 'Santos' }));
      expect(unidade).not.toHaveAttribute('data-invalido');
    });

    it.each([
      ['limite', 'Muitas tentativas. Aguarde um minuto.'],
      ['indisponivel', 'Não conseguimos verificar agora. Tente em alguns minutos.'],
    ])('erro %s no cadastro → %s', async (erro, mensagem) => {
      irParaEmail({ acoes: criarAcoes({ identificar: novo(), cadastrar: jest.fn().mockResolvedValue({ ok: false, erro }) }) });
      await informar('nova@email.com');
      fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Campestre' }));
      fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 't1' } });
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
    });

    const preencher = () => {
      fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Campestre' }));
      fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 't1' } });
      fireEvent.click(botao('Cadastrar e começar'));
    };

    it('nome e turma inválidos apontam (aria-describedby) para a mensagem de erro de cada campo', async () => {
      irParaEmail({ acoes: criarAcoes({ identificar: novo() }) });
      await informar('nova@email.com');
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(screen.getByLabelText('Nome completo')).toHaveAccessibleDescription('Informe seu nome completo.');
      expect(screen.getByLabelText('Turma')).toHaveAccessibleDescription('Escolha sua turma.');
      fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Souza' } });
      expect(screen.getByLabelText('Nome completo')).not.toHaveAttribute('aria-describedby');
    });

    it('nome com caractere de controle é destacado sem chamar a ação', async () => {
      const { acoes } = irParaEmail({ acoes: criarAcoes({ identificar: novo() }) });
      await informar('nova@email.com');
      fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana' + String.fromCharCode(0) + 'Souza' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Campestre' }));
      fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 't1' } });
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(acoes.cadastrar).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    });

    it('cadastro indisponível (turmas não carregam) → "Tentar de novo" refaz a identificação e mantém o formulário', async () => {
      const identificar = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, dados: { novo: true, turmas } })
        .mockResolvedValueOnce({ ok: true, dados: { novo: true, turmas: [...turmas, { id: 't3', nome: 'Nova turma' }] } });
      const cadastrar = jest.fn().mockResolvedValueOnce({ ok: false, erro: 'indisponivel' }).mockResolvedValueOnce({ ok: true, dados: { emailMascarado: 'n***@email.com' } });
      irParaEmail({ acoes: criarAcoes({ identificar, cadastrar }) });
      await informar('nova@email.com');
      preencher();
      await esperarAcoes();
      fireEvent.click(botao('Tentar de novo'));
      await esperarAcoes();
      expect(identificar).toHaveBeenCalledTimes(2);
      expect(identificar).toHaveBeenLastCalledWith('nova@email.com');
      expect(screen.getByRole('option', { name: 'Nova turma' })).toBeInTheDocument();
      expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Souza');
      expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
      fireEvent.click(botao('Cadastrar e começar'));
      await esperarAcoes();
      expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    });

    it('"Tentar de novo" no cadastro com o e-mail já encontrado → segue para as perguntas', async () => {
      const identificar = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, dados: { novo: true, turmas } })
        .mockResolvedValueOnce({ ok: true, dados: { emailMascarado: 'n***@email.com' } });
      irParaEmail({ acoes: criarAcoes({ identificar, cadastrar: jest.fn().mockResolvedValue({ ok: false, erro: 'indisponivel' }) }) });
      await informar('nova@email.com');
      preencher();
      await esperarAcoes();
      fireEvent.click(botao('Tentar de novo'));
      await esperarAcoes();
      expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    });

    it('cadastro recusado pela API → mensagem própria, sem "Tentar de novo"', async () => {
      irParaEmail({ acoes: criarAcoes({ identificar: novo(), cadastrar: jest.fn().mockResolvedValue({ ok: false, erro: 'recusado' }) }) });
      await informar('nova@email.com');
      preencher();
      await esperarAcoes();
      expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos concluir o cadastro com esses dados. Confira os campos ou fale com a equipe da EBA.');
      expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    });

    it('sem turma aberta → aviso, sem formulário; "Usar outro e-mail" volta', async () => {
      irParaEmail({ acoes: criarAcoes({ identificar: novo([]) }) });
      await informar('nova@email.com');
      expect(screen.getByText('Nenhuma turma aberta no momento. Fale com a equipe da EBA.')).toBeInTheDocument();
      expect(screen.queryByLabelText('Nome completo')).toBeNull();
      fireEvent.click(botao('Usar outro e-mail'));
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    });
  });
});

describe('Questionario — estado inicial (vitrine)', () => {
  it('abre no estado pedido, sem ler nem gravar o sessionStorage e sem eventos', () => {
    sessionStorage.setItem(chaveProgresso('dons-servico'), JSON.stringify({ passo: 2, respostas: { 1: 3, 2: 5 }, marcadas: [], escolhidas: [] }));
    montar('dons-servico', { estadoInicial: { estado: 'pergunta' } });
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    escolherNota('0 — Nunca');
    expect(JSON.parse(sessionStorage.getItem(chaveProgresso('dons-servico'))!).respostas).toEqual({ 1: 3, 2: 5 });
    expect(registrarEvento).not.toHaveBeenCalled();
  });

  it('erro de envio como estado inicial mostra "Tentar de novo"', () => {
    montar('dons-servico', { estadoInicial: { estado: 'erro', erroEnvio: 'indisponivel' } });
    expect(within(screen.getByRole('alert')).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
