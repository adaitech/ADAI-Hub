'use client';

import type { Resultado } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, type SlugTeste } from '@/lib/eba-api/testes';
import { descricaoDoTemperamento } from '@/lib/eba-api/conteudo-local';
import type { EstadoQuestionario } from './estado';
import mock from './Questionario.mock.json';
import { Questionario, type QuestionarioProps } from './Questionario';

export type TelaVitrine = 'abertura' | 'pergunta' | 'resultado' | 'sem-resultado' | 'erro';

export interface QuestionarioVitrineProps {
  teste: SlugTeste;
  tela: TelaVitrine;
}

/** Resultado de exemplo (fixtures reais da API) para o tipo do teste. */
function resultadoDe(slug: SlugTeste): Resultado {
  const tipo = definicaoDoTeste(slug)!.tipo;
  if (tipo === 'temperamento') {
    const { itens, maximo } = mock.resultados.temperamento;
    return { tipo: 'pontuacao', maximo, itens: itens.map((i) => ({ ...i, mensagem: descricaoDoTemperamento(i.nome) })) };
  }
  return mock.resultados[tipo] as Resultado;
}

const sessao = mock.sessao;

/**
 * A vitrine é renderizada pelo servidor e não pode passar funções ao componente cliente: este
 * invólucro (cliente) monta as ações de mentira, sem servidor nem API, e o estado inicial.
 */
export function QuestionarioVitrine({ teste, tela }: QuestionarioVitrineProps) {
  const resultado = resultadoDe(teste);
  const acoes = {
    identificar: async () => ({ ok: true, dados: sessao }),
    cadastrar: async () => ({ ok: true, dados: sessao }),
    enviar: async () => ({ ok: true, dados: resultado }),
    sair: async () => undefined,
    carregarPerguntas: async () => ({ ok: true, dados: mock.testes[teste].perguntas }),
    aquecer: async () => undefined,
  } as unknown as QuestionarioProps['acoes'];
  const iniciais: Record<TelaVitrine, Partial<EstadoQuestionario>> = {
    abertura: {},
    pergunta: { estado: 'pergunta' },
    resultado: { estado: 'resultado', resultado },
    'sem-resultado': { estado: 'resultado', resultado: { tipo: 'sem-resultado' } },
    erro: { estado: 'erro', erroEnvio: 'indisponivel' },
  };
  const dados = mock.testes[teste];
  return (
    <Questionario
      key={`${teste}-${tela}`}
      teste={definicaoDoTeste(teste)!}
      abertura={dados.abertura}
      perguntas={dados.perguntas}
      sessao={sessao}
      acoes={acoes}
      estadoInicial={iniciais[tela]}
    />
  );
}
