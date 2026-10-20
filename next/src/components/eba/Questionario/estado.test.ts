import { GRUPOS_TEMPERAMENTO, PARES_ESTILO } from '@/lib/eba-api/conteudo-local';
import type { Resultado } from '@/lib/eba-api/respostas';
import {
  chaveProgresso,
  criarEstado,
  lerProgresso,
  paginaTemperamento,
  parEstilo,
  podeEnviar,
  progressoDe,
  reducer,
  respondidas,
  respostasParaApi,
  temProgresso,
  type Acao,
  type EstadoQuestionario,
} from './estado';

const perguntas = [
  { numero: 1, texto: 'Primeira' },
  { numero: 2, texto: 'Segunda' },
  { numero: 3, texto: 'Terceira' },
];

const resultado: Resultado = { tipo: 'pontuacao', itens: [{ nome: 'Ensino', total: 22, mensagem: null }], maximo: 25 };

const aplicar = (estado: EstadoQuestionario, ...acoes: Acao[]) => acoes.reduce(reducer, estado);
const nota = (extra: Partial<EstadoQuestionario> = {}) => ({ ...criarEstado({ tipo: 'nota', perguntas, sessao: null }), ...extra });

describe('chaveProgresso', () => {
  it('uma chave por slug', () => {
    expect(chaveProgresso('dons-servico')).toBe('eba-teste:dons-servico');
  });
});

describe('criarEstado', () => {
  it('começa na abertura, sem respostas', () => {
    const e = nota();
    expect(e).toMatchObject({ estado: 'abertura', passo: 0, respostas: {}, marcadas: [], escolhidas: [], emailMascarado: null, carregado: false });
  });

  it.each([
    ['nota', 3],
    ['talentos', 2],
    ['estilo', PARES_ESTILO.motivacao.length + PARES_ESTILO.organizacao.length],
    ['temperamento', 20],
  ] as const)('%s tem %i telas', (tipo, total) => {
    expect(criarEstado({ tipo, perguntas, sessao: null }).total).toBe(total);
  });

  it('nota sem perguntas ainda tem 1 tela (sem divisão por zero)', () => {
    expect(criarEstado({ tipo: 'nota', perguntas: [], sessao: null }).total).toBe(1);
  });

  it('guarda o e-mail mascarado da sessão', () => {
    expect(criarEstado({ tipo: 'nota', perguntas, sessao: { emailMascarado: 'a***@x.com' } }).emailMascarado).toBe('a***@x.com');
  });
});

describe('reducer — transições', () => {
  it('abertura → e-mail sem sessão; → pergunta com sessão', () => {
    expect(reducer(nota(), { tipo: 'comecar' }).estado).toBe('email');
    expect(reducer(nota({ emailMascarado: 'a***@x.com' }), { tipo: 'comecar' }).estado).toBe('pergunta');
  });

  it('e-mail encontrado → volta para as perguntas, no mesmo passo', () => {
    const e = aplicar(nota({ estado: 'email', passo: 2 }), { tipo: 'identificado', emailMascarado: 'a***@x.com' });
    expect(e).toMatchObject({ estado: 'pergunta', passo: 2, emailMascarado: 'a***@x.com', cadastro: null });
  });

  it('e-mail novo → cadastro; "Usar outro e-mail" → e-mail', () => {
    const e = aplicar(nota({ estado: 'email' }), { tipo: 'novoAluno', email: 'ana@x.com', turmas: [{ id: 't1', nome: 'CDV' }] });
    expect(e).toMatchObject({ estado: 'cadastro', cadastro: { email: 'ana@x.com', turmas: [{ id: 't1', nome: 'CDV' }] } });
    expect(reducer(e, { tipo: 'voltarEmail' })).toMatchObject({ estado: 'email', cadastro: null });
  });

  it('responder só guarda a nota (quem avança é a tela); trocar a nota não duplica', () => {
    let e = nota({ estado: 'pergunta' });
    e = reducer(e, { tipo: 'responder', chave: 1, valor: 4 });
    expect(e).toMatchObject({ passo: 0, respostas: { 1: 4 } });
    e = aplicar(e, { tipo: 'responder', chave: 1, valor: 2 }, { tipo: 'avancar' }, { tipo: 'responder', chave: 2, valor: 0 });
    expect(e).toMatchObject({ passo: 1, respostas: { 1: 2, 2: 0 } });
  });

  it('voltar mantém a resposta marcada; no começo não volta', () => {
    const e = aplicar(nota({ estado: 'pergunta' }), { tipo: 'responder', chave: 1, valor: 3 }, { tipo: 'voltar' });
    expect(e).toMatchObject({ passo: 0, respostas: { 1: 3 } });
    expect(reducer(e, { tipo: 'voltar' }).passo).toBe(0);
  });

  it('avançar não passa da última tela', () => {
    const e = aplicar(nota({ estado: 'pergunta' }), { tipo: 'avancar' }, { tipo: 'avancar' }, { tipo: 'avancar' });
    expect(e.passo).toBe(2);
  });

  it('talentos: avançar da etapa 1 exige ao menos uma marcada', () => {
    const t = { ...criarEstado({ tipo: 'talentos', perguntas, sessao: null }), estado: 'pergunta' as const };
    expect(reducer(t, { tipo: 'avancar' }).passo).toBe(0);
    expect(aplicar(t, { tipo: 'marcar', id: 2 }, { tipo: 'avancar' }).passo).toBe(1);
  });

  it('marcar alterna; desmarcar tira também das escolhidas', () => {
    const t = { ...criarEstado({ tipo: 'talentos', perguntas, sessao: null }), estado: 'pergunta' as const };
    let e = aplicar(t, { tipo: 'marcar', id: 1 }, { tipo: 'marcar', id: 3 }, { tipo: 'escolher', id: 3 });
    expect(e).toMatchObject({ marcadas: [1, 3], escolhidas: [3] });
    e = reducer(e, { tipo: 'marcar', id: 3 });
    expect(e).toMatchObject({ marcadas: [1], escolhidas: [] });
  });

  it('escolher: até 3, só entre as marcadas; escolher de novo desfaz', () => {
    const t = { ...criarEstado({ tipo: 'talentos', perguntas: [...perguntas, { numero: 4, texto: 'Quarta' }], sessao: null }), estado: 'pergunta' as const };
    let e = aplicar(t, ...[1, 2, 3, 4].map((id) => ({ tipo: 'marcar', id }) as Acao));
    e = aplicar(e, ...[1, 2, 3, 4].map((id) => ({ tipo: 'escolher', id }) as Acao));
    expect(e.escolhidas).toEqual([1, 2, 3]);
    expect(reducer(e, { tipo: 'escolher', id: 9 }).escolhidas).toEqual([1, 2, 3]);
    expect(reducer(e, { tipo: 'escolher', id: 2 }).escolhidas).toEqual([1, 3]);
  });

  it('enviar → enviando; enviar de novo não muda nada', () => {
    const e = reducer(nota({ estado: 'pergunta' }), { tipo: 'enviar' });
    expect(e.estado).toBe('enviando');
    expect(reducer(e, { tipo: 'enviar' })).toBe(e);
  });

  it('enviado → resultado', () => {
    const e = aplicar(nota({ estado: 'pergunta' }), { tipo: 'enviar' }, { tipo: 'enviado', resultado });
    expect(e).toMatchObject({ estado: 'resultado', resultado, erroEnvio: null });
  });

  it('sessão encerrada → expirou, com as respostas mantidas e volta para o envio', () => {
    const e = aplicar(nota({ estado: 'pergunta', emailMascarado: 'a***@x.com' }), { tipo: 'responder', chave: 1, valor: 2 }, { tipo: 'enviar' }, { tipo: 'falhou', erro: 'sessao' });
    expect(e).toMatchObject({ estado: 'expirou', respostas: { 1: 2 }, emailMascarado: null, retorno: 'enviando' });
    const email = reducer(e, { tipo: 'informarEmail' });
    expect(email.estado).toBe('email');
    expect(reducer(email, { tipo: 'identificado', emailMascarado: 'b***@x.com' }).estado).toBe('enviando');
  });

  it.each(['indisponivel', 'recusado'] as const)('%s → erro, com as respostas mantidas', (erro) => {
    const e = aplicar(nota({ estado: 'pergunta' }), { tipo: 'responder', chave: 1, valor: 2 }, { tipo: 'enviar' }, { tipo: 'falhou', erro });
    expect(e).toMatchObject({ estado: 'erro', erroEnvio: erro, respostas: { 1: 2 } });
  });

  it('revisar volta para a primeira pergunta', () => {
    expect(reducer(nota({ estado: 'erro', passo: 2 }), { tipo: 'revisar' })).toMatchObject({ estado: 'pergunta', passo: 0, erroEnvio: null });
  });

  it('trocar e-mail esquece a sessão e volta às perguntas depois', () => {
    const e = reducer(nota({ estado: 'pergunta', emailMascarado: 'a***@x.com' }), { tipo: 'trocarEmail' });
    expect(e).toMatchObject({ estado: 'email', emailMascarado: null, retorno: 'pergunta' });
  });

  it('sair esquece a sessão', () => {
    expect(reducer(nota({ estado: 'resultado', emailMascarado: 'a***@x.com' }), { tipo: 'sair' })).toMatchObject({ emailMascarado: null, saiu: true });
  });

  it('restaurar aplica o progresso salvo e marca como carregado', () => {
    const e = reducer(nota(), { tipo: 'restaurar', progresso: { passo: 2, respostas: { 1: 3, 2: 1 }, marcadas: [], escolhidas: [] } });
    expect(e).toMatchObject({ carregado: true, passo: 2, respostas: { 1: 3, 2: 1 } });
    expect(reducer(nota(), { tipo: 'restaurar', progresso: null })).toMatchObject({ carregado: true, passo: 0 });
  });
});

describe('lerProgresso (sessionStorage)', () => {
  const ctxNota = { tipo: 'nota' as const, total: 3, perguntas };
  const salvo = (dado: object) => JSON.stringify({ passo: 0, ...dado });

  it.each([null, '', 'não é json', '[]', '{"passo":"x"}', 'null'])('valor inválido %p → null', (texto) => {
    expect(lerProgresso(texto, ctxNota)).toBeNull();
  });

  it('nota: passo dentro do teste, só perguntas que existem e notas inteiras de 0 a 5', () => {
    const texto = salvo({ passo: 99, respostas: { 1: 3, 2: 'x', 3: 2.5, 4: 1, 0: 0 }, marcadas: [1], escolhidas: [1] });
    expect(lerProgresso(texto, ctxNota)).toEqual({ passo: 2, respostas: { 1: 3 }, marcadas: [], escolhidas: [] });
    expect(lerProgresso(salvo({ respostas: { 1: 6, 2: -1, 3: 5 } }), ctxNota)?.respostas).toEqual({ 3: 5 });
  });

  it('adulterado não infla as respondidas nem libera o envio', () => {
    const texto = salvo({ respostas: { 1: 9, 2: 9, 3: 9, 50: 1 } });
    const e = reducer(nota(), { tipo: 'restaurar', progresso: lerProgresso(texto, ctxNota) });
    expect(respondidas(e)).toBe(0);
    expect(podeEnviar(e, perguntas)).toBe(false);
  });

  it('estilo: telas 1–14, notas de 1 a 5', () => {
    const ctx = { tipo: 'estilo' as const, total: 14, perguntas: [] };
    expect(lerProgresso(salvo({ respostas: { 1: 1, 2: 0, 14: 5, 15: 3 } }), ctx)?.respostas).toEqual({ 1: 1, 14: 5 });
  });

  it('talentos: marcadas só entre as perguntas, escolhidas entre as marcadas e até 3', () => {
    const ctx = { tipo: 'talentos' as const, total: 2, perguntas: [...perguntas, { numero: 4, texto: 'Quarta' }] };
    const texto = salvo({ respostas: { 1: 1 }, marcadas: [2, 2, 'a', 1, 3, 4, 99], escolhidas: [1, 1, 2, 3, 4, 7] });
    expect(lerProgresso(texto, ctx)).toEqual({ passo: 0, respostas: {}, marcadas: [1, 2, 3, 4], escolhidas: [1, 2, 3] });
  });

  it('temperamento: ids de 0 a 199, sem escolhidas', () => {
    const ctx = { tipo: 'temperamento' as const, total: 20, perguntas: [] };
    expect(lerProgresso(salvo({ marcadas: [-1, 0, 199, 200], escolhidas: [0] }), ctx)).toEqual({ passo: 0, respostas: {}, marcadas: [0, 199], escolhidas: [] });
  });

  it('campos ausentes viram vazios', () => {
    expect(lerProgresso('{"passo":1}', ctxNota)).toEqual({ passo: 1, respostas: {}, marcadas: [], escolhidas: [] });
  });

  it('progressoDe e temProgresso', () => {
    const e = aplicar(nota({ estado: 'pergunta' }), { tipo: 'responder', chave: 1, valor: 0 }, { tipo: 'avancar' });
    expect(progressoDe(e)).toEqual({ passo: 1, respostas: { 1: 0 }, marcadas: [], escolhidas: [] });
    expect(temProgresso(e)).toBe(true);
    expect(temProgresso(nota())).toBe(false);
  });
});

describe('respondidas', () => {
  it('nota e estilo contam respostas distintas; marcar conta as telas concluídas', () => {
    expect(respondidas(nota({ respostas: { 1: 2, 3: 0 } }))).toBe(2);
    expect(respondidas({ ...criarEstado({ tipo: 'temperamento', perguntas: [], sessao: null }), passo: 4 })).toBe(4);
  });
});

describe('telas locais', () => {
  it('estilo: motivação 1–7, depois organização 8–14', () => {
    expect(parEstilo(0)).toBe(PARES_ESTILO.motivacao[0]);
    expect(parEstilo(7)).toBe(PARES_ESTILO.organizacao[0]);
    expect(parEstilo(13)).toBe(PARES_ESTILO.organizacao[6]);
  });

  it('temperamento: páginas de 10, cada uma dentro de um grupo', () => {
    const primeira = paginaTemperamento(0);
    expect(primeira.grupo.nome).toBe('Sanguíneo');
    expect(primeira.opcoes).toHaveLength(10);
    expect(primeira.opcoes[0]).toEqual({ id: 0, texto: GRUPOS_TEMPERAMENTO[0].opcoes[0] });
    const sexta = paginaTemperamento(5);
    expect(sexta.grupo.nome).toBe('Colérico');
    expect(sexta.opcoes[0].id).toBe(50);
    expect(paginaTemperamento(19).opcoes.at(-1)?.id).toBe(199);
  });
});

describe('respostasParaApi e podeEnviar', () => {
  it('nota: uma resposta 0–5 por pergunta', () => {
    const e = nota({ respostas: { 1: 0, 2: 5, 3: 3 } });
    expect(respostasParaApi(e, perguntas)).toEqual([
      { numero: 1, nota: 0 },
      { numero: 2, nota: 5 },
      { numero: 3, nota: 3 },
    ]);
    expect(podeEnviar(e, perguntas)).toBe(true);
    expect(podeEnviar(nota({ respostas: { 1: 0, 2: 5 } }), perguntas)).toBe(false);
  });

  it('talentos: 1 para as escolhidas, 0 para as demais', () => {
    const e = { ...criarEstado({ tipo: 'talentos', perguntas, sessao: null }), marcadas: [1, 2], escolhidas: [2] };
    expect(respostasParaApi(e, perguntas)).toEqual([
      { numero: 1, nota: 0 },
      { numero: 2, nota: 1 },
      { numero: 3, nota: 0 },
    ]);
    expect(podeEnviar(e, perguntas)).toBe(true);
    expect(podeEnviar({ ...e, escolhidas: [] }, perguntas)).toBe(false);
  });

  it('estilo: soma da motivação (telas 1–7) e da organização (8–14)', () => {
    const respostas = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [i + 1, i < 7 ? 2 : 5]));
    const e = { ...criarEstado({ tipo: 'estilo', perguntas: [], sessao: null }), respostas };
    expect(respostasParaApi(e, [])).toEqual([
      { numero: 1, nota: 14 },
      { numero: 2, nota: 35 },
    ]);
    expect(podeEnviar(e, [])).toBe(true);
    const incompletas = { ...respostas };
    delete incompletas[14];
    expect(podeEnviar({ ...e, respostas: incompletas }, [])).toBe(false);
  });

  it('temperamento: quantas marcadas em cada grupo (zero vale)', () => {
    const e = { ...criarEstado({ tipo: 'temperamento', perguntas: [], sessao: null }), marcadas: [0, 1, 49, 50, 199] };
    expect(respostasParaApi(e, [])).toEqual([
      { numero: 1, nota: 3 },
      { numero: 2, nota: 1 },
      { numero: 3, nota: 0 },
      { numero: 4, nota: 1 },
    ]);
    expect(podeEnviar({ ...e, marcadas: [] }, [])).toBe(true);
  });
});
