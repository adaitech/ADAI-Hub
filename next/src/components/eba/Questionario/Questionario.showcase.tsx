import { TESTES, type SlugTeste } from '@/lib/eba-api/testes';
import { defineShowcase } from '@/lib/showcase/types';
import { QuestionarioVitrine, type QuestionarioVitrineProps } from './QuestionarioVitrine';

export const questionarioShowcase = defineShowcase<QuestionarioVitrineProps>({
  slug: 'questionario-eba',
  nome: 'Questionário dos testes da EBA',
  categoria: 'secao',
  cmsKey: null,
  descricao:
    'Tela de um teste do CDV: abertura, identificação por e-mail, perguntas com progresso e foto, envio e resultado. Os textos da abertura vêm do Strapi; perguntas, turmas e resultado vêm da API da EBA.',
  quandoUsar: 'Só na página /eba/testes/<slug>, uma por página. Na vitrine as ações são de mentira (sem servidor).',
  doc: 'docs/componentes/questionario-eba.md',
  render: (data) => <QuestionarioVitrine {...data} />,
  variantes: [
    { nome: 'abertura', titulo: 'Abertura', data: { teste: 'dons-servico', tela: 'abertura' } },
    { nome: 'pergunta-nota', titulo: 'Pergunta (0 a 5)', data: { teste: 'dons-servico', tela: 'pergunta' } },
    { nome: 'estilo', titulo: 'Escala 1 a 5 (estilo)', data: { teste: 'estilo-pessoal', tela: 'pergunta' } },
    { nome: 'temperamento', titulo: 'Marcar itens (temperamento)', data: { teste: 'temperamento-pessoal', tela: 'pergunta' } },
    { nome: 'resultado', titulo: 'Resultado', data: { teste: 'dons-servico', tela: 'resultado' } },
    { nome: 'sem-resultado', titulo: 'Respostas enviadas, sem resultado', data: { teste: 'dons-servico', tela: 'sem-resultado' } },
    { nome: 'erro', titulo: 'Erro no envio', data: { teste: 'dons-servico', tela: 'erro' } },
  ],
  controles: [
    {
      id: 'teste',
      tipo: 'opcoes',
      rotulo: 'Tipo de teste',
      ajuda: 'Troca o teste mostrado no estado da aba (nota, talentos, estilo ou temperamento).',
      opcoes: TESTES.map((t) => ({ valor: t.slug, rotulo: t.nome })),
      valor: (data) => data.teste,
      aplicar: (data, valor) => ({ ...data, teste: valor as SlugTeste }),
    },
  ],
});
