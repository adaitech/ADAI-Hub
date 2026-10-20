/**
 * Conteúdo dos testes do CDV copiado, como dados, do site atual da EBA
 * (eba-adai/src/utils/content/tests/). Sem lógica de tela e sem imagens.
 */

export interface ParEstilo {
  titulo: string;
  esquerda: string;
  direita: string;
}

export type NomeTemperamento = 'Sanguíneo' | 'Colérico' | 'Melancólico' | 'Fleumático';

export interface GrupoTemperamento {
  numero: 1 | 2 | 3 | 4;
  nome: NomeTemperamento;
  opcoes: string[];
}

/** Pares de afirmações do Estilo Pessoal: a pessoa dá nota de 1 a 5 entre a esquerda e a direita. */
export const PARES_ESTILO: {
  motivacao: ParEstilo[];
  organizacao: ParEstilo[];
} = {
  motivacao: [
    {
      titulo: 'Fico feliz',
      esquerda: 'Fazendo algo para as pessoas',
      direita: 'Conversando com as pessoas',
    },
    {
      titulo: 'Quando realizo tarefas',
      esquerda: 'Sou uma pessoa mais focada no que faço',
      direita: 'Sou uma pessoa mais focada nas pessoas',
    },
    {
      titulo: 'Fico empolgado com',
      esquerda: 'Uma meta alcançada',
      direita: 'Com as pessoas que estão envolvidas na causa',
    },
    {
      titulo: 'Sinto que realizei algo quando',
      esquerda: 'Termino uma tarefa',
      direita: 'Aprofundo uma amizade',
    },
    {
      titulo: 'É mais importante começar',
      esquerda: 'Na hora',
      direita: 'Esperar todos chegarem',
    },
    {
      titulo: 'Estou mais preocupado',
      esquerda: 'Em cumprir um prazo',
      direita: 'Manter a equipe',
    },
    { titulo: 'Valorizo mais', esquerda: 'A ação', direita: 'A comunicação' },
  ],
  organizacao: [
    {
      titulo: 'Nas férias prefiro',
      esquerda: 'Ser espontâneo',
      direita: 'Seguir um plano fixo',
    },
    {
      titulo: 'Prefiro traçar metas',
      esquerda: 'Gerais',
      direita: 'Específicas',
    },
    {
      titulo: 'Prefiro deixar opções',
      esquerda: 'Em aberto',
      direita: 'Resolver logo',
    },
    {
      titulo: 'Prefiro projetos que tenham',
      esquerda: 'Variedade',
      direita: 'Rotina',
    },
    { titulo: 'Gosto de', esquerda: 'Improvisar', direita: 'Seguir um plano' },
    {
      titulo: 'Acho a rotina',
      esquerda: 'Chata',
      direita: 'Segura (posso descansar)',
    },
    {
      titulo: 'Realizo melhor a tarefa quando',
      esquerda: 'Resolvo as coisas ao longo do projeto',
      direita: 'Sigo um plano',
    },
  ],
};

/** Descrição do resultado do Estilo Pessoal, por combinação devolvida pela API (`message`). */
const DESCRICOES_ESTILO: Record<string, string[]> = {
  'Tarefa Não Estruturado': [
    'Diretrizes gerais',
    'Versátil',
    'Aprecia ajudar quando for necessário',
    'Gosta de resultados concretos',
    'Considere o tipo de ministério que lhe possibilite cumprir uma ampla variedade de responsabilidades',
  ],
  'Tarefa Estruturado': [
    'Cumpre a tarefa até o fim',
    'Focaliza nos resultados',
    'Prefere seguir uma agenda',
    'Aprecia orientação clara',
    'Considere o tipo de ministério que lhe permita saber exatamente quais são os alvos e como a tarefa deve ser realizada',
  ],
  'Pessoas Não Estruturado': [
    'Situações espontâneas',
    'Gosta de conversar',
    'Relaciona-se bem com pessoas',
    'Tende a ser flexível',
    'Considere o tipo de ministério que lhe dê a liberdade de responder às pessoas espontaneamente',
  ],
  'Pessoas Estruturado': [
    'Relacionamentos definidos',
    'Ambiente conhecido',
    'Transmite calor humano',
    'Gosta de relacionamentos conhecidos',
    'Considere o tipo de ministério que lhe capacite a interagir com pessoas em situações mais estáveis ou definidas',
  ],
};

/** Os 4 grupos do Temperamento Pessoal, com 50 opções cada (páginas de 10). */
export const GRUPOS_TEMPERAMENTO: GrupoTemperamento[] = [
  {
    numero: 1,
    nome: 'Sanguíneo',
    opcoes: [
      'Cordial',
      'Alegre',
      'Contagiante',
      'Bem-humorado',
      'Extrovertido',
      'Estimulante',
      'Bondoso',
      'Emotivo',
      'Espontâneo',
      'Ingênuo',
      'Faz amizade com facilidade',
      'Tem relacionamento profundo com as pessoas',
      'Mais coração do que razão',
      'Relaciona-se bem',
      'Gosta de crianças',
      'Esquece as coisas desagradáveis facilmente',
      'Sincero',
      'Anima as pessoas',
      'Participa com entusiasmo de novos planos',
      'Barulhento',
      'Espalhafatoso',
      'Curiosidade infantil',
      'Sensível com as necessidades do próximo',
      'Desperta de bom humor',
      'Otimista',
      'Vive para o presente',
      'Não se sente temeroso pelo futuro',
      'Não gosta de estar só',
      'Fala antes de pensar',
      'Terno e compassivo',
      'Pouco prático e desorganizado',
      'Age sem pensar',
      'Tendência à lascívia',
      'Dificuldade para concentrar-se em leitura ou tarefas que exijam atenção',
      'Pouca produtividade',
      'Indisciplinado',
      'Começa e não termina seus planos',
      'Turbulento',
      'Não conhece suas limitações',
      'Responde e se compromete sem pensar',
      'Não cumpre horário ou compromisso',
      'Não é leal',
      'Pode alterar seus princípios morais, devido ao ambiente que o cerca',
      'Egoísta',
      'Dominador da conversa. Não dá vez aos outros',
      'Instável emocionalmente',
      'Desanima facilmente',
      'Tem explosões de ira e em seguida esquece, afetando outros',
      'Arrepende-se várias vezes pela mesma coisa',
      'Vontade fraca o faz ceder à tentação',
    ],
  },
  {
    numero: 2,
    nome: 'Colérico',
    opcoes: [
      'Temperamento ardente',
      'Ativo',
      'Prático',
      'Voluntarioso',
      'Suficiente',
      'Independente',
      'Decidido',
      'Facilidade de tomar decisões',
      'Vibra com muitas atividades',
      'Pouco influenciado',
      'Influenciador do meio',
      'Não se amedronta nas adversidades, torna as adversidades um desafio',
      'Não é dado a detalhes',
      'Esperto',
      'Não vacila sob pressão',
      'Seu sucesso resulta de determinação e persistência mais do que planejamento',
      'Objetivo',
      'Apresenta sugestões, ideias',
      'Líder nato',
      'Insistente',
      'Intuitivo',
      'Não liga muito para artes',
      'Mais razão do que coração',
      'Extrovertido',
      'Firme',
      'Não se abala facilmente com críticas',
      'Autodisciplinado',
      'Geralmente otimista',
      'Gosta do desafio do desconhecido',
      'Interessa-se pelo aspecto prático da vida',
      'Insensível',
      'Irado',
      'Bravo a ponto de causar danos',
      'Sem compaixão cristã',
      'Indiferente aos anseios das outras pessoas',
      'Agressivo',
      'Guarda rancor',
      'Vingativo',
      'Tende a ter úlcera',
      'Cruel',
      'Mete-se em apuros pela sua impetuosidade',
      'Infringe a lei ou direitos dos outros para atingir seus objetivos',
      'Dificilmente pede desculpas',
      'Profere declarações cruéis, sarcásticas',
      'Age tiranicamente sobre os sentimentos dos outros',
      'Orgulhoso',
      'Arrogante',
      'Tem dificuldade para se concentrar quando ora ou lê a Bíblia',
      'Frustra os outros porque nunca o satisfazem',
      'Prepotente',
    ],
  },
  {
    numero: 3,
    nome: 'Melancólico',
    opcoes: [
      'Analítico',
      'Abnegado (que não age por interesse)',
      'Perfeccionista',
      'Apreciador de artes',
      'Introvertido',
      'É todo coração',
      'Não desaponta os que dependem dele',
      'Não faz amigos com facilidade',
      'Amigo fiel',
      'Bom diagnosticador de problemas',
      'Pessoa de confiança',
      'Não procura as pessoas. Deixa que elas o procurem',
      'Consegue prever os obstáculos de um projeto',
      'Tem confiança em sua capacidade',
      'Sensibilidade e talento artístico',
      'Varia sua disposição de espírito conforme situação',
      'É correto na profissão',
      'Sacrifica-se pessoalmente',
      'Esquiva-se de conflito',
      'Não ocioso',
      'Criativo',
      'Sensível emocionalmente',
      'Pensador',
      'Revive acontecimentos e decisões passadas',
      'Cumpridor de suas responsabilidades',
      'Evita ficar em evidência',
      'Reservado quanto a expor suas ideias',
      'Fala pouco, mas é muito preciso no que diz',
      'Não se compromete a fazer mais do que pode',
      'Introspectivo (retraído)',
      'Egocêntrico (preocupa-se com si mesmo)',
      'Inclinado à autoanálise, complacente',
      'Interesse excessivo pela sua aparência física',
      'Fica alimentando desejos de vingança',
      'Hipocondríaco (sempre acha que está doente)',
      'Ofende-se muito facilmente',
      'Desconfiado',
      'Dado a suposições desfavoráveis',
      'Dificilmente perdoa',
      'Dotado de autocomiseração (se faz de "coitado")',
      'Pessimista',
      'Inseguro',
      'Temeroso',
      'Crítico inflexível',
      'Depressivo',
      'Foge da realidade e entra em devaneio',
      'Mal-humorado',
      'Deixa-se levar a mórbidas (doentias) condições mentais',
      'Acha que sempre estão conspirando contra ele',
      'Tudo que o afeta é algo capital',
    ],
  },
  {
    numero: 4,
    nome: 'Fleumático',
    opcoes: [
      'Calmo',
      'Frio',
      'Bem equilibrado',
      'É todo razão',
      'Mantém as emoções sob controle',
      'Racional',
      'Raramente explode em raiva ou riso',
      'Aprecia artes',
      'Fino gosto pelas coisas',
      'Controlado',
      'Gosta do convívio social',
      'Despreocupado com as circunstâncias ao redor',
      'Sente mais emoções do que demonstra',
      'Prático e eficiente',
      'Senso de humor mordaz (sarcástico, agressivo)',
      'Provoca gargalhada sem esboçar um sorriso',
      'Cérebro organizado',
      'Trabalha bem sob tensão',
      'Pouco se envolve com as atividades do próximo',
      'Vida regrada',
      'Tende à rotina',
      'Mais espectador que modificador de circunstâncias',
      'Metódico. Suas coisas estão sempre arrumadas',
      'É de bom coração, mas não deixa transparecer',
      'Capaz',
      'Cumpridor de suas obrigações e horários',
      'Conciliador',
      'Pacificador nato',
      'Sabe ouvir com paciência e atenção',
      'Bom conselheiro',
      'Preguiçoso',
      'Indiferente',
      'Sem motivação',
      'Provocador',
      'Distante e gélido (frio, insensível)',
      'Obstinado (persistente e teimoso)',
      'Egoísta',
      'Indeciso',
      'Resistente',
      'Avarento',
      'Descompromissado',
      'Quando se sente forçado, torna-se mais vagaroso',
      'Expectador da vida sem se envolver',
      'Acomodado',
      'Usa seu humor contra os outros',
      'Conservador por comodismo',
      'Disfarça sua obstinação com seu humor',
      'Não se envolve',
      'Vacila entre o desejo de fazer e de não fazer alguma coisa',
      'Procrastinador ("enrola", demora, adia)',
    ],
  },
];

const DESCRICOES_TEMPERAMENTO: Record<NomeTemperamento, string> = {
  Colérico:
    'A pessoa com temperamento colérico é caracterizada por sua assertividade, determinação e natureza dominante. São indivíduos decisivos, diretos e práticos, frequentemente vistos como líderes naturais. Eles possuem uma grande capacidade de organização e são eficientes em tarefas que exigem controle e disciplina. No entanto, podem ser impacientes, irritáveis e às vezes agressivos, especialmente quando as coisas não saem conforme o planejado. Sua natureza impetuosa pode levar a conflitos, mas sua habilidade de tomar decisões rápidas é inestimável em situações de crise.',
  Melancólico:
    'O temperamento melancólico é marcado por uma personalidade introvertida e analítica. As pessoas melancólicas são detalhistas, pensativas e ponderadas, muitas vezes perfeccionistas em suas abordagens. Elas são altamente sensíveis, empáticas e leais, valorizando relacionamentos profundos e significativos. Apesar de sua natureza cuidadosa e meticulosa, podem ser pessimistas, críticas e propensas a episódios de depressão. Sua habilidade de planejar e analisar situações em profundidade é uma grande força, embora possam lutar contra a tendência de se preocupar excessivamente.',
  Sanguíneo:
    'Pessoas com temperamento sanguíneo são extrovertidas, otimistas e sociáveis. Elas são alegres, calorosas e amáveis, trazendo energia e entusiasmo a qualquer ambiente. Os sanguíneos são conhecidos por sua habilidade de fazer amigos facilmente e por serem comunicadores naturais. No entanto, sua natureza impulsiva e emocionalmente instável pode levá-los a ser explosivos e egoístas. Eles muitas vezes têm dificuldades em manter a atenção em tarefas a longo prazo, preferindo a excitação de novas experiências. Sua capacidade de animar e inspirar os outros é uma de suas maiores forças.',
  Fleumático:
    'O temperamento fleumático é caracterizado por uma personalidade calma, confiável e pacífica. Pessoas fleumáticas são diplomáticas, pacientes e possuem uma habilidade natural para mediar conflitos. Elas são estáveis e equilibradas, raramente se deixando levar por emoções intensas. No entanto, essa natureza tranquila pode se manifestar como passividade ou indecisão. Fleumáticos tendem a procrastinar e evitar confrontos, preferindo manter a harmonia a qualquer custo. Sua confiabilidade e habilidade de permanecer calmo sob pressão fazem deles grandes suportes em situações desafiadoras.',
};

/** Descrição do resultado do Estilo Pessoal (`message` da API); null se a combinação não existe. */
export function descricaoDoEstilo(mensagem: string): string | null {
  const linhas = Object.hasOwn(DESCRICOES_ESTILO, mensagem) ? DESCRICOES_ESTILO[mensagem] : null;
  return linhas ? linhas.join('. ') + '.' : null;
}

/** Descrição do temperamento predominante; null se o nome não existe. */
export function descricaoDoTemperamento(nome: string): string | null {
  return Object.hasOwn(DESCRICOES_TEMPERAMENTO, nome)
    ? DESCRICOES_TEMPERAMENTO[nome as NomeTemperamento]
    : null;
}
