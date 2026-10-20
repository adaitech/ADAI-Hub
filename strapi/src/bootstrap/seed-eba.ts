import type { Core } from '@strapi/strapi';

/**
 * Conteúdo de desenvolvimento da EBA (Escola Bíblica ADAI) — entrega 1 da migração.
 * Textos do site atual (eba.adai.com.br), revisados no protótipo aprovado (docs/prototipo/eba/).
 * Perguntas frequentes do Start, do CDV e da home foram escritas a partir dos textos dos cursos:
 * a equipe da EBA precisa validar antes da produção.
 */

/** Upload (ou reaproveitamento) de uma imagem de `strapi/seed/`; devolve o id da mídia. */
export type Imagem = (strapi: Core.Strapi, arquivo: string, alt: string) => Promise<number>;

const SITE_ATUAL = 'https://eba.adai.com.br';
const CONTATO = 'mailto:contato@adai.com.br';

const TESTES = [
  ['Temperamento pessoal', 'temperamento-pessoal'],
  ['Talentos naturais', 'talentos-naturais'],
  ['Estilo pessoal', 'estilo-pessoal'],
  ['Dons de serviço prático', 'dons-servico'],
  ['Dons ministeriais', 'dons-ministerio'],
] as const;

const listaDeTestes = TESTES.map(([nome, slug]) => `- [${nome}](${SITE_ATUAL}/teste/${slug})`).join('\n');

type Pergunta = [pergunta: string, resposta: string];
const faq = (titulo: string, perguntas: Pergunta[]) => ({
  __component: 'sections.perguntas-frequentes',
  titulo,
  perguntas: perguntas.map(([pergunta, resposta]) => ({ pergunta, resposta })),
});

interface CursoSeed {
  slug: string;
  nome: string;
  resumo: string;
  ordem: number;
  publico_alvo: string;
  duracao: string;
  formato: 'presencial_ou_online';
  entrada?: string;
  capa: [arquivo: string, alt: string];
  info: [arquivo: string, alt: string];
  /** Primeiro parágrafo (Imagem e texto, até 400 caracteres). */
  intro: string;
  /** Markdown: demais parágrafos, objetivos, quem pode fazer e como funciona. */
  detalhes: string;
  inscricao: { texto: string; url: string; nova_aba: boolean };
  perguntas: Pergunta[];
  testes?: boolean;
}

const lista = (itens: string[]) => itens.map((i) => `- ${i}`).join('\n');

export const CURSOS_EBA: CursoSeed[] = [
  {
    slug: 'reset',
    nome: 'Reset',
    resumo: 'Um passo de fé e obediência, transformação interior e início de uma nova caminhada com Jesus.',
    ordem: 10,
    publico_alvo: 'A partir de 16 anos',
    duracao: '7 aulas de 1 hora, semanais',
    formato: 'presencial_ou_online',
    entrada: 'A qualquer momento',
    capa: ['eba/reset-capa.webp', 'Pastor fala ao microfone, com a mão levantada, ao lado do tanque de batismo da ADAI.'],
    info: ['eba/reset-info.webp', 'Momento do curso Reset na ADAI.'],
    intro:
      'O curso Reset foi desenvolvido para preparar aqueles que desejam dar um passo de fé e obediência por meio do batismo nas águas. O batismo representa publicamente uma transformação interior e o início de uma nova caminhada com Deus.',
    detalhes: [
      'Jesus nos ensinou a importância desse ato ao ordenar que seus seguidores fossem batizados e ao nos dar o exemplo, sendo Ele mesmo batizado. Mais do que um ritual, o batismo simboliza arrependimento, nova vida e um compromisso sincero com Cristo.',
      'O batismo é um testemunho público de fé e uma expressão de entrega total ao Senhor, marcando o início de uma jornada de crescimento espiritual, comunhão e propósito.',
      '### Objetivos',
      lista([
        'Compreender os princípios fundamentais da fé cristã e o significado do batismo.',
        'Levar o aluno a assumir um compromisso público com Cristo.',
        'Confirmar a fé pessoal em Jesus Cristo.',
        'Orientar sobre a vida cristã após o batismo.',
      ]),
      '### Quem pode fazer',
      lista([
        'Novos convertidos.',
        'Cristãos que nunca foram batizados.',
        'Pessoas acima de 16 anos.',
        'Solteiros, casados no civil, divorciados, separados judicialmente ou viúvos.',
        'Casais em união estável devem procurar a coordenação do curso.',
      ]),
      '### Como funciona',
      lista([
        '7 aulas de aproximadamente 1 hora, uma vez por semana. É preciso participar de todas as aulas para ser batizado.',
        'O curso é cíclico: você pode começar a qualquer momento, sem prejuízo do conteúdo.',
        'As aulas podem ser presenciais ou on-line, conforme a orientação da EBA da sua unidade.',
      ]),
    ].join('\n\n'),
    inscricao: {
      texto: 'Quero me inscrever',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLScBEgcusa3AwOVT_o6-wiM3xKYIqx0ASbM5LHqoNewYe-oayA/viewform',
      nova_aba: true,
    },
    perguntas: [
      ['O curso é gratuito?', 'Sim, o curso é completamente gratuito.'],
      ['Preciso participar de todas as aulas?', 'Sim. São 7 aulas, uma por semana, e é preciso participar de todas para ser batizado.'],
      ['Posso começar a qualquer momento?', 'Sim. O Reset é cíclico: você entra na próxima aula e completa as que faltarem nas semanas seguintes, sem prejuízo do conteúdo.'],
      ['Qual é a idade mínima?', 'O Reset é para pessoas acima de 16 anos. Adolescentes de 12 a 15 anos fazem o Talmidim.'],
      ['Vivo em união estável. Posso fazer o curso?', 'Sim. Procure a coordenação do curso antes da inscrição para conversar sobre o batismo.'],
      [
        'Quais temas o curso aborda?',
        'Entre os temas estão: reconhecendo Jesus como Senhor; identidade (quem sou eu?); tentação, pecado e vício; jugo desigual; justificação e regeneração; batismo; e Ceia do Senhor.',
      ],
    ],
  },
  {
    slug: 'start',
    nome: 'Start',
    resumo: 'Porta de entrada para a vida cristã na igreja local.',
    ordem: 20,
    publico_alvo: 'Novos membros e novos convertidos batizados',
    duracao: '8 aulas',
    formato: 'presencial_ou_online',
    entrada: 'A qualquer momento',
    capa: ['eba/start-capa.webp', 'Quatro voluntários sorriem na recepção da ADAI Campestre segurando placas de boas-vindas.'],
    info: ['eba/start-info.webp', 'Alunos durante uma aula do Start.'],
    intro:
      'O Start é um curso formativo, desenvolvido para apresentar os fundamentos da fé cristã, a visão da igreja local e os princípios que orientam a vida cristã em comunidade.',
    detalhes: [
      'Sua importância é estratégica, pois contribui para o despertar espiritual do aluno e para a compreensão do seu propósito cristão.',
      '### Objetivos',
      lista([
        'Fazer o aluno compreender, de forma clara, seu papel na fé, na igreja e no serviço cristão.',
        'Estabelecer as bases para uma caminhada cristã consciente, responsável e alinhada à vida comunitária, preparando para os próximos níveis da Escola Bíblica.',
      ]),
      '### Quem pode fazer',
      lista([
        'Novos convertidos batizados.',
        'Novos membros da Igreja ADAI.',
        'Pessoas que desejam conhecer melhor a fé cristã.',
        'Pessoas que desejam integrar-se à vida da igreja local.',
      ]),
      '### Como funciona',
      lista([
        'O curso tem 8 aulas.',
        'As aulas podem ser presenciais ou on-line, conforme a orientação da EBA da sua unidade.',
        'O curso é cíclico: você pode começar a qualquer momento, sem prejuízo do conteúdo.',
      ]),
    ].join('\n\n'),
    inscricao: { texto: 'Falar com a EBA', url: CONTATO, nova_aba: false },
    perguntas: [
      [
        'Preciso ser batizado para fazer o Start?',
        'O Start é para novos convertidos já batizados e para novos membros da ADAI, e também recebe quem deseja conhecer melhor a fé cristã. Se você ainda não foi batizado, comece pelo Reset.',
      ],
      ['Posso começar a qualquer momento?', 'Sim. O Start é cíclico: você pode entrar em qualquer aula, sem prejuízo do conteúdo.'],
      ['Como faço minha inscrição?', 'Converse com um líder da EBA da sua unidade ou envie um e-mail para contato@adai.com.br.'],
      ['O que vem depois do Start?', 'Quem conclui o Start pode fazer o CDV, o curso que ajuda a descobrir seus dons e talentos para servir.'],
    ],
  },
  {
    slug: 'cdv',
    nome: 'CDV',
    resumo: 'Conhecendo os seus dons e talentos para servir a Deus.',
    ordem: 30,
    publico_alvo: 'Quem concluiu o Start',
    duracao: '8 aulas',
    formato: 'presencial_ou_online',
    entrada: 'Só no início de cada turma',
    capa: ['eba/cdv-capa.webp', 'Porta de sala com a placa “EBA CDV”; ao fundo, alunos e uma professora em aula.'],
    info: ['eba/cdv-info.webp', 'Alunos durante uma aula do CDV.'],
    intro:
      'O CDV tem como finalidade ajudar o aluno a identificar seus dons, talentos e características pessoais, compreendendo como eles podem servir de maneira consciente e eficaz na igreja.',
    detalhes: [
      'A Palavra de Deus nos ensina que Deus concede dons a cada cristão com um propósito definido: para o aperfeiçoamento dos santos, para a obra do ministério, para a edificação do Corpo de Cristo (1 Coríntios 12:4; Romanos 12:6; Efésios 4:7; 1 Pedro 4:10).',
      '### Objetivos',
      lista([
        'Promover o autoconhecimento cristão e vocacional.',
        'Identificar dons espirituais e talentos naturais.',
        'Compreender motivações, temperamento e estilo pessoal.',
        'Fortalecer a vida espiritual, familiar, profissional e relacional.',
        'Orientar o aluno quanto ao seu possível campo de atuação ministerial.',
      ]),
      '### Quem pode fazer',
      lista(['Membros da ADAI que já concluíram o curso Start.', 'Pessoas que entendem que existe um chamado de Deus para servir em algum ministério.']),
      '### Como funciona',
      lista([
        'O curso tem 8 aulas.',
        'As aulas podem ser presenciais ou on-line, conforme a orientação da EBA da sua unidade.',
        'O curso não é cíclico: a entrada acontece só no início de uma nova turma.',
      ]),
    ].join('\n\n'),
    inscricao: { texto: 'Falar com a EBA', url: CONTATO, nova_aba: false },
    perguntas: [
      ['Preciso ter feito o Start?', 'Sim. O CDV é para membros da ADAI que já concluíram o Start.'],
      [
        'Posso entrar com a turma já começada?',
        'Não. O CDV não é cíclico: a entrada acontece só no início de uma nova turma. Fale com a EBA da sua unidade para saber a próxima data.',
      ],
      [
        'Para que servem os testes?',
        'Os testes de temperamento, estilo pessoal, talentos naturais e dons ajudam você a se conhecer melhor e a encontrar o seu lugar para servir. Eles são feitos durante o curso, pelo celular.',
      ],
      ['Como faço minha inscrição?', 'Converse com um líder da EBA da sua unidade ou envie um e-mail para contato@adai.com.br.'],
    ],
    testes: true,
  },
  {
    slug: 'talmidim',
    nome: 'Talmidim',
    resumo: 'Acompanhamento do adolescente no início de uma nova caminhada com Jesus.',
    ordem: 40,
    publico_alvo: 'Adolescentes de 12 a 15 anos',
    duracao: '13 aulas de 1 hora, semanais',
    formato: 'presencial_ou_online',
    capa: ['eba/talmidim-capa.webp', 'Adolescentes sentados conversam e sorriem durante um encontro na ADAI.'],
    info: ['eba/talmidim-info.webp', 'Adolescentes durante um encontro do Talmidim.'],
    intro:
      'Este curso foi preparado com carinho para orientar adolescentes nos princípios fundamentais da fé cristã, no significado do batismo e na importância de servir ao Senhor.',
    detalhes: [
      'Nossa oração é que, ao final desta jornada, o aluno compreenda o valor dessa decisão e esteja pronto para dar esse passo importante de fé e obediência ao Senhor Jesus Cristo.',
      '### Objetivos',
      lista([
        'Conduzir os adolescentes a uma compreensão sólida da fé cristã, preparando-os para o batismo como um compromisso consciente com Cristo.',
        'Assumir publicamente o compromisso com Jesus Cristo, entendendo o batismo como uma decisão pessoal, consciente e transformadora.',
        'Iniciar e desenvolver um relacionamento profundo e contínuo com Deus, por meio da oração, da leitura da Palavra e da vida em comunidade.',
        'Reconhecer o chamado para servir no Reino de Deus, com dons e talentos, dedicação, amor e responsabilidade na igreja local.',
      ]),
      '### Quem pode fazer',
      lista(['Adolescentes entre 12 e 15 anos que já aceitaram Jesus como Salvador e Senhor.']),
      '### Como funciona',
      lista(['13 aulas de, em média, 1 hora.', 'Um encontro por semana.', 'Presencial ou on-line, conforme a orientação da coordenação.']),
    ].join('\n\n'),
    inscricao: { texto: 'Quero me inscrever', url: 'https://forms.gle/BtMpykm2Gs6zM1Mm6', nova_aba: true },
    perguntas: [
      [
        'O que é o curso Talmidim?',
        'O Talmidim é voltado para adolescentes e oferece conteúdo sobre batismo e fundamentos da fé, além de ferramentas para que os jovens possam servir a Jesus usando seus dons e talentos da melhor forma possível.',
      ],
      ['O curso é gratuito?', 'Sim, o curso é completamente gratuito.'],
      ['Quais temas o curso aborda?', 'Entre os temas estão: identidade (quem sou eu?); tentação, pecado e vício; temperamentos; e diferentes e influentes.'],
      [
        'Como são as aulas?',
        'Cada encontro começa com uma introdução do professor e um momento de oração. Depois, um vídeo apresenta o tema, e o professor retoma com os alunos para aprofundar o assunto e responder às dúvidas.',
      ],
      [
        'Existe suporte durante o curso?',
        'Sim. Há um grupo de WhatsApp para perguntas e conversa entre os alunos, e os professores também ajudam por e-mail ou mensagem.',
      ],
      ['Vou receber certificado?', 'Sim. Ao completar todas as lições e atividades, o aluno recebe um certificado digital de conclusão.'],
    ],
  },
];

async function dadosDoCurso(strapi: Core.Strapi, c: CursoSeed, imagem: Imagem) {
  const capa = await imagem(strapi, ...c.capa);
  const info = await imagem(strapi, ...c.info);
  const testes = c.testes
    ? [
        {
          __component: 'sections.texto-rico',
          titulo: 'Os testes do CDV',
          conteudo: `Durante o curso você faz os testes de temperamento, estilo pessoal, talentos naturais e dons. Eles podem ser feitos pelo celular, a partir do QR code da sala.\n\n${listaDeTestes}`,
        },
      ]
    : [];
  return {
    nome: c.nome,
    slug: c.slug,
    resumo: c.resumo,
    capa,
    vertente: 'integracao',
    publico_alvo: c.publico_alvo,
    duracao: c.duracao,
    formato: c.formato,
    entrada: c.entrada ?? null,
    inscricao: { ...c.inscricao, estilo: 'solido' },
    ordem: c.ordem,
    seo: { metaTitle: `${c.nome} — Cursos da EBA | ADAI`, metaDescription: c.resumo },
    secoes: [
      { __component: 'sections.imagem-texto', imagem: info, posicao_imagem: 'esquerda', preto_e_branco: true, titulo: 'Sobre o curso', texto: c.intro },
      { __component: 'sections.texto-rico', titulo: 'Como é o curso', conteudo: c.detalhes },
      ...testes,
      faq('Perguntas frequentes', c.perguntas),
    ],
  };
}

/** Cria ou atualiza (na subida de versão do seed) os 4 cursos e publica. Idempotente pelo slug. */
export async function ensureCursos(strapi: Core.Strapi, imagem: Imagem, reconstruir: boolean): Promise<void> {
  const cursos = strapi.documents('api::curso.curso');
  for (const c of CURSOS_EBA) {
    const existente = await cursos.findFirst({ filters: { slug: c.slug } });
    if (existente && !reconstruir) continue;
    const data = (await dadosDoCurso(strapi, c, imagem)) as never;
    const doc = existente ? await cursos.update({ documentId: existente.documentId, data }) : await cursos.create({ data });
    const documentId = existente?.documentId ?? doc?.documentId;
    if (!documentId) continue;
    await cursos.publish({ documentId });
    strapi.log.info(`[seed] Curso da EBA "${c.slug}" ${existente ? 'reconstruído' : 'criado'} e publicado.`);
  }
}

/** Página `eba` (/eba): home da Escola Bíblica. */
export async function ebaSections(strapi: Core.Strapi, imagem: Imagem) {
  const hero = await imagem(strapi, 'eba/eba-hero.webp', 'Professora da EBA sorri no palco diante dos alunos.');
  const biblia = await imagem(strapi, 'eba/eba-biblia.webp', 'Mão segura uma Bíblia aberta no Evangelho de João, capítulo 3.');
  // Logo da EBA (branco, fundo transparente) fica na Biblioteca de Mídia para o time usar.
  await imagem(strapi, 'eba/logo-eba.webp', 'EBA — Escola Bíblica ADAI');
  return [
    {
      __component: 'sections.hero',
      titulo: 'Escola Bíblica ADAI',
      texto_apoio: 'Transformando vidas através da Palavra de Deus: cursos para cada fase da caminhada, do batismo ao serviço.',
      imagem: hero,
      preto_e_branco: false,
      botoes: [
        { texto: 'Ver cursos', url: '/eba/cursos', estilo: 'solido' },
        { texto: 'Fazer um teste', url: `${SITE_ATUAL}/teste/temperamento-pessoal`, estilo: 'contorno' },
      ],
    },
    {
      __component: 'sections.imagem-texto',
      imagem: biblia,
      posicao_imagem: 'esquerda',
      preto_e_branco: true,
      rotulo: 'Escola Bíblica ADAI',
      titulo: 'Formar discípulos maduros',
      texto:
        'A EBA é o centro de formação e desenvolvimento espiritual da igreja. Ela existe para conduzir ao batismo de forma consciente e formar discípulos maduros, preparados para viver o chamado de Deus de maneira prática.',
      lista: [
        { titulo: 'Integração', texto: 'Para novos membros e para quem quer reforçar as bases da fé: Reset, Start, CDV e Talmidim.' },
        { titulo: 'Consolidação', texto: 'Para quem está numa fase mais avançada: aprofunda o conhecimento bíblico e fortalece a liderança espiritual.' },
      ],
    },
    {
      __component: 'sections.catalogo-cursos',
      titulo: 'Cursos',
      texto_apoio: 'Escolha o próximo passo da sua caminhada. Cada curso acompanha uma fase da vida cristã.',
      vertente: 'todas',
      link_ver_todos: true,
    },
    {
      __component: 'sections.texto-rico',
      titulo: 'Descubra seus dons e talentos',
      conteudo: `Os testes da EBA ajudam você a entender seu temperamento, seu estilo pessoal, seus talentos naturais e seus dons para servir na igreja.\n\n${listaDeTestes}`,
    },
    faq('Perguntas frequentes', [
      [
        'Por qual curso eu começo?',
        'Se você ainda não foi batizado, comece pelo Reset. Se já é batizado ou chegou agora à ADAI, faça o Start. Depois dele vem o CDV. Adolescentes de 12 a 15 anos fazem o Talmidim.',
      ],
      ['Os cursos são presenciais ou on-line?', 'Os dois formatos existem. A EBA de cada unidade orienta qual vale para a sua turma.'],
      ['Os cursos são gratuitos?', 'Sim, os cursos da EBA são gratuitos.'],
      [
        'Como faço minha inscrição?',
        'Reset e Talmidim têm formulário de inscrição na página de cada curso. Para Start e CDV, converse com um líder da EBA da sua unidade ou escreva para contato@adai.com.br.',
      ],
      [
        'Para que servem os testes?',
        'Os testes de temperamento, estilo pessoal, talentos naturais e dons fazem parte do CDV e ajudam você a encontrar o seu lugar para servir.',
      ],
    ]),
    {
      __component: 'sections.texto-botoes',
      titulo: 'Área do aluno e da equipe',
      texto_apoio: 'Alunos assistem às aulas gravadas e a equipe da EBA acompanha as turmas.',
      botoes: [{ texto: 'Entrar', url: `${SITE_ATUAL}/login`, estilo: 'contorno' }],
    },
  ];
}

/** Página `eba-cursos` (/eba/cursos): catálogo completo. */
export function ebaCursosSections() {
  return [
    {
      __component: 'sections.catalogo-cursos',
      titulo: 'Cursos da EBA',
      texto_apoio: 'Formação bíblica para cada fase da caminhada com Jesus. Os cursos são presenciais ou on-line, conforme a unidade.',
      vertente: 'todas',
      link_ver_todos: false,
    },
    {
      __component: 'sections.texto-rico',
      titulo: 'Por onde começar',
      conteudo: [
        'Os cursos de integração seguem uma ordem. Adolescentes de 12 a 15 anos começam pelo [Talmidim](/eba/cursos/talmidim).',
        '',
        '1. **[Reset](/eba/cursos/reset)** — para quem ainda não foi batizado. Prepara para o batismo nas águas.',
        '2. **[Start](/eba/cursos/start)** — para quem já é batizado: fundamentos da fé e a vida na igreja local.',
        '3. **[CDV](/eba/cursos/cdv)** — depois do Start: descubra seus dons e talentos para servir.',
      ].join('\n'),
    },
    {
      __component: 'sections.texto-botoes',
      titulo: 'Ficou com dúvida?',
      texto_apoio: 'Fale com a equipe da EBA da sua unidade ou escreva para a gente.',
      botoes: [{ texto: 'Escrever para a EBA', url: CONTATO, estilo: 'solido' }],
    },
  ];
}

const PAGINAS_EBA = [
  {
    slug: 'eba',
    titulo: 'EBA — Escola Bíblica ADAI',
    descricao: 'Cursos e testes da Escola Bíblica ADAI: formação para cada fase da caminhada cristã.',
    secoes: (strapi: Core.Strapi, imagem: Imagem) => ebaSections(strapi, imagem),
  },
  {
    slug: 'eba-cursos',
    titulo: 'Cursos da EBA',
    descricao: 'Reset, Start, CDV e Talmidim: conheça os cursos da Escola Bíblica ADAI.',
    secoes: async () => ebaCursosSections(),
  },
];

/**
 * Cria (banco novo) ou reconstrói (versão nova do seed) as páginas `eba` e `eba-cursos` e publica.
 * Fora desses casos não monta nada: as imagens só são buscadas quando a página vai ser gravada.
 */
export async function ensurePaginasEba(strapi: Core.Strapi, imagem: Imagem, reconstruir: boolean): Promise<void> {
  const pages = strapi.documents('api::page.page');
  for (const p of PAGINAS_EBA) {
    const existente = await pages.findFirst({ filters: { slug: p.slug } });
    if (existente && !reconstruir) continue;
    const data = { seo: { metaTitle: `${p.titulo} | ADAI`, metaDescription: p.descricao }, sections: await p.secoes(strapi, imagem) };
    const doc = existente
      ? await pages.update({ documentId: existente.documentId, data: data as never })
      : await pages.create({ data: { titulo: p.titulo, slug: p.slug, ...data } as never });
    const documentId = existente?.documentId ?? doc?.documentId;
    if (!documentId) continue;
    await pages.publish({ documentId });
    strapi.log.info(`[seed] Página "${p.slug}" ${existente ? 'reconstruída' : 'criada'} e publicada.`);
  }
}
