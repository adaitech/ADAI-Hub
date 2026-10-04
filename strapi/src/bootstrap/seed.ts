import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';

/**
 * Suba este número sempre que a Home de desenvolvimento ganhar seções novas no seed.
 * Com a versão maior, as seções da Home e de /exemplos são reconstruídas a partir deste arquivo (só em dev).
 */
const SEED_VERSION = 17;
const SEED_DIR = path.join(process.cwd(), 'seed');
const STORE = { type: 'core', name: 'adai', key: 'seed_version' } as const;

type Upload = { id: number };

/** Reaproveita a imagem se já estiver na Biblioteca de Mídia; senão, faz o upload. */
async function image(strapi: Core.Strapi, fileName: string, alternativeText: string): Promise<number> {
  const existing = (await strapi.db
    .query('plugin::upload.file')
    .findOne({ where: { name: fileName } })) as Upload | null;
  if (existing) return existing.id;

  const filepath = path.join(SEED_DIR, fileName);
  const [file] = (await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: fileName, alternativeText, caption: alternativeText } },
    files: { filepath, originalFilename: fileName, mimetype: 'image/jpeg', size: fs.statSync(filepath).size },
  })) as Upload[];
  return file.id;
}

// Fotos do Figma: 1:108 (fill original) e 6:14 (export 2x do que aparece no layout; é colorida).
const ALT_CULTO = 'Culto na ADAI: pessoas sentadas diante do palco, com o telão exibindo "Bem-vindos, voluntários"';
const ALT_LIDERANCA = 'Pastores Rodrigo e Tati Soeiro sorrindo, abraçados, em frente a uma parede de mármore';

const YOUTUBE_ADAI = 'https://www.youtube.com/@ADAIOficial';

const mapa = (endereco: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

const header = {
  links: [
    { texto: 'Localidades', url: '/localidades' },
    { texto: 'Sermões', url: '/sermoes' },
    { texto: 'Agenda', url: '/agenda' },
    { texto: 'Ministérios', url: '/ministerios' },
    { texto: 'Contribua', url: '/contribua' },
  ],
  botoes: [
    { texto: 'Ao vivo', url: '/ao-vivo', estilo: 'contorno' },
    { texto: 'Planeje sua visita', url: '/planeje-sua-visita', estilo: 'solido' },
  ],
};

const footer = {
  texto_marca: 'Somos uma igreja que ama a Deus, serve as pessoas e influencia o mundo.',
  colunas: [
    {
      titulo: 'Igreja',
      links: [
        { texto: 'Nossa história', url: '/sobre-nos/nossa-historia' },
        { texto: 'A igreja que vemos', url: '/sobre-nos/a-igreja-que-vemos' },
        { texto: 'No que acreditamos', url: '/sobre-nos/no-que-acreditamos' },
        { texto: 'Jesus', url: '/jesus' },
      ],
    },
    {
      titulo: 'Participe',
      links: [
        { texto: 'Unidades', url: '/unidades' },
        { texto: 'Agenda', url: '/agenda' },
        { texto: 'Ministérios', url: '/ministerios' },
        { texto: 'Contribua', url: '/contribua' },
      ],
    },
    {
      titulo: 'Contato',
      links: [
        { texto: 'E-mail', url: 'mailto:contato@adai.com.br' },
        { texto: 'WhatsApp', url: 'https://api.whatsapp.com/send?phone=5511959879085', nova_aba: true },
        { texto: 'Instagram', url: 'https://www.instagram.com/', nova_aba: true },
        { texto: 'YouTube', url: YOUTUBE_ADAI, nova_aba: true },
      ],
    },
  ],
  copyright: '© 2026 ADAI. Todos os direitos reservados.',
  assinatura: 'Amar · Servir · Influenciar.',
};

const seo = {
  metaTitle: 'ADAI — Amar. Servir. Influenciar.',
  metaDescription:
    'Uma igreja que ama, serve e influencia em cinco localidades, com as portas abertas todo domingo. Tem um lugar pra você aqui.',
};

interface UnidadeSite {
  /** Nome no site (título do card e do Hero). */
  nome: string;
  /** Nome no tipo Unidades (como na inChurch). */
  nomeInchurch: string;
  slug: string;
  /** "No Campestre", "Em Santos"… */
  em: string;
  igrejaInchurchId: number;
  horarios: string;
  /** Linhas do endereço (ou, na ADAI On, onde assistir). */
  endereco: string;
  /** Endereço para o Google Maps; `null` na ADAI On. */
  mapa: string | null;
  cidade: string;
}

/** Unidades da ADAI (IDs da lista de igrejas da inChurch, 03/10/2026). */
const UNIDADES_SITE: UnidadeSite[] = [
  {
    nome: 'Campestre',
    nomeInchurch: 'ADAI Campestre',
    slug: 'campestre',
    em: 'No Campestre',
    igrejaInchurchId: 30146,
    horarios: '9h\n11h\n18h',
    endereco: 'Av. Dom Pedro II, 3405\nSanto André',
    mapa: 'Av. Dom Pedro II, 3405, Santo André',
    cidade: 'Santo André',
  },
  {
    nome: 'Anália Franco',
    nomeInchurch: 'ADAI Anália Franco',
    slug: 'analia-franco',
    em: 'Na Anália Franco',
    igrejaInchurchId: 31875,
    horarios: '9h\n11h',
    endereco: 'R. Eleonora Cintra, 960\nJardim Anália Franco, São Paulo',
    mapa: 'R. Eleonora Cintra, 960, São Paulo',
    cidade: 'São Paulo',
  },
  {
    nome: 'São Bernardo',
    nomeInchurch: 'ADAI São Bernardo do Campo',
    slug: 'sao-bernardo',
    em: 'Em São Bernardo',
    igrejaInchurchId: 31874,
    horarios: '9h\n11h\n18h',
    endereco: 'R. Cabral da Câmara, 315\nPlanalto, São Bernardo do Campo',
    mapa: 'R. Cabral da Câmara, 315, São Bernardo do Campo',
    cidade: 'São Bernardo do Campo',
  },
  {
    nome: 'Santos',
    nomeInchurch: 'ADAI Santos',
    slug: 'santos',
    em: 'Em Santos',
    igrejaInchurchId: 31876,
    horarios: '9h30\n11h30',
    endereco: 'R. Campos Mello, 197\nVila Matias, Santos',
    mapa: 'R. Campos Mello, 197, Santos',
    cidade: 'Santos',
  },
  {
    nome: 'ADAI On',
    nomeInchurch: 'ADAI On',
    slug: 'adai-on',
    em: 'Na ADAI On',
    igrejaInchurchId: 31879,
    horarios: '11h\n15h',
    endereco: '11h no YouTube\n15h no Zoom',
    mapa: null,
    cidade: '',
  },
];


/** Ação principal do card da unidade: mapa nas presenciais, YouTube na ADAI On. */
const acaoUnidade = (u: UnidadeSite) =>
  u.mapa
    ? { texto: 'Como chegar', url: mapa(u.mapa), nova_aba: true }
    : { texto: 'Assistir', url: YOUTUBE_ADAI, nova_aba: true };

/** Card de unidade: o card inteiro leva à página da unidade (Home com horários; "Outras unidades" sem). */
function cardUnidade(u: UnidadeSite, comHorarios: boolean) {
  return {
    titulo: u.nome,
    ...(comHorarios ? { destaques: u.horarios } : {}),
    texto: u.endereco,
    url: `/${u.slug}`,
    link: acaoUnidade(u),
  };
}

/**
 * Página da unidade — Figma "Unidade / Campestre / Desktop" (4:270). Campestre com os textos do
 * Figma; as outras unidades seguem o mesmo modelo (🟡 rascunho para o time revisar no Strapi).
 */
function unidadeSections(u: UnidadeSite, foto: number, unidadeDocumentId: string) {
  const online = u.mapa === null;
  const campestre = u.slug === 'campestre';
  const subtitulo = online
    ? 'A ADAI On leva o culto até você: participe ao vivo pelo YouTube ou pelo Zoom, de onde estiver.'
    : `A unidade ${u.nome} reúne cultos, ministérios e momentos de conexão em ${u.cidade}, com uma presença acolhedora e familiar.`;

  const oQueEsperar = online
    ? [
        {
          titulo: 'Como participar',
          texto: `${u.endereco}\nAcompanhe ao vivo e participe com a gente, de casa ou de onde estiver.`,
          link: { texto: 'Assistir', url: YOUTUBE_ADAI, nova_aba: true },
        },
        {
          titulo: 'Como é o culto',
          texto:
            'Louvor, mensagem da Bíblia pra vida real e uma comunidade que te recebe bem, mesmo à distância.\nO ritmo é acolhedor, familiar e fácil de acompanhar, mesmo que seja sua primeira vez.',
          link: { texto: 'Planeje sua visita', url: '/planeje-sua-visita' },
        },
      ]
    : [
        {
          titulo: 'Como chegar',
          texto: campestre
            ? `${u.endereco}\nTerreno plano, acesso fácil e espaço pra estacionar. Se quiser, avise que vem e alguém te ajuda na chegada.`
            : `${u.endereco}\nSe quiser, avise que vem e alguém te ajuda na chegada.`,
          link: { texto: 'Ver no mapa', url: mapa(u.mapa!), nova_aba: true },
        },
        {
          titulo: 'Como é o culto',
          texto:
            'Louvor, mensagem da Bíblia pra vida real e uma recepção calorosa desde a entrada.\nO ritmo é acolhedor, familiar e fácil de acompanhar, mesmo que seja sua primeira vez.',
          link: { texto: 'Planeje sua visita', url: '/planeje-sua-visita' },
        },
        {
          titulo: 'Seus filhos',
          texto:
            'O ADAI Kids cuida das crianças com segurança, carinho e atividades pensadas pra cada faixa etária.\nVocê participa do culto tranquilo(a) sabendo que seus filhos estão em boas mãos.',
          link: { texto: 'Conheça o ADAI Kids', url: '/kids' },
        },
      ];

  return [
    {
      __component: 'sections.hero',
      titulo: u.nome,
      subtitulo,
      texto_apoio: online
        ? 'Participe do culto ao vivo e encontre pessoas prontas para caminhar com você.\nTem lugar pra você e sua família aqui.'
        : 'Venha conhecer a unidade, participar do culto e encontrar pessoas prontas para te receber bem.\nTem lugar pra você e sua família aqui.',
      imagem: foto,
      preto_e_branco: false,
      botoes: [
        { texto: 'Planeje sua visita', url: '/planeje-sua-visita', estilo: 'solido' },
        { ...acaoUnidade(u), estilo: 'contorno' },
      ],
    },
    {
      __component: 'sections.carrossel-cards',
      titulo: 'O que esperar',
      texto_apoio: online
        ? 'Antes de participar, veja como acompanhar o culto e como a ADAI On funciona.'
        : `Antes de vir, dá pra já se organizar. Veja como chegar, como é o culto e como seus filhos vão ser bem cuidados ${u.em.replace(/^(No|Na|Em) /, (p) => p.toLowerCase())}.`,
      cards: oQueEsperar,
    },
    ...(online
      ? []
      : [
          {
            __component: 'sections.ministerios',
            titulo: 'Pra todas as idades',
            texto_apoio: `${u.em}, tem espaço pra família inteira. Veja alguns dos ministérios que fazem parte da rotina da unidade.`,
            exibicao: 'cards',
            ministerios: [
              { nome: 'ADAI KIDS', publico: 'Crianças' },
              { nome: 'INPULSE', publico: 'Adolescentes' },
              { nome: 'PULSE', publico: 'Jovens' },
              { nome: '50+', publico: '50 anos ou mais' },
            ],
          },
        ]),
    {
      __component: 'sections.carrossel-cards',
      titulo: 'Seu próximo passo',
      texto_apoio: 'Cada pessoa chega em um momento diferente. Escolha por onde você quer começar e a gente te acompanha.',
      cards: [
        { titulo: 'Sou novo na fé', texto: 'Quer entender melhor sobre Deus, a Bíblia e a igreja? Comece por aqui.' },
        { titulo: 'Quero me batizar', texto: 'Se você quer dar esse passo público, conversamos sobre significado, processo e data.' },
        { titulo: 'Quero me conectar', texto: 'Busca comunidade, amizade e um lugar pra pertencer? A gente te apresenta o caminho.' },
        { titulo: 'Quero servir', texto: 'Quer usar seus dons pra fazer parte do time? Temos áreas e ministérios pra você.' },
        { titulo: 'Quero crescer na fé', texto: 'Procura aprofundamento, grupos, leitura e acompanhamento? Vamos indicar o próximo passo.' },
      ],
    },
    {
      __component: 'sections.proximos-eventos',
      titulo: u.em,
      texto_apoio: 'Confira alguns dos momentos e encontros que fazem parte da vida da unidade.',
      quantidade: 8,
      cor_cards: 'cinza',
      unidade: unidadeDocumentId,
    },
    {
      __component: 'sections.carrossel-cards',
      titulo: 'Outras unidades',
      texto_apoio: 'Se você mora em outra região, confira as demais unidades da ADAI e participe perto de você.',
      cards: UNIDADES_SITE.filter((outra) => outra.slug !== u.slug).map((outra) => cardUnidade(outra, false)),
    },
  ];
}

/**
 * Páginas institucionais com o conteúdo do site atual (adai.com.br), no mesmo endereço:
 * Hero (foto do site atual, colorida) + Texto sem título. "sobre-nos-…" vira /sobre-nos/… no Next.
 */
const PAGINAS_INSTITUCIONAIS = [
  { slug: 'sobre-nos-nossa-historia', titulo: 'Nossa história', alt: 'Pastores Rodrigo e Tati Soeiro no palco durante a ceia, com a igreja reunida' },
  { slug: 'sobre-nos-a-igreja-que-vemos', titulo: 'A igreja que vemos', alt: 'Igreja reunida no auditório, com o telão exibindo "Bem-vindos"' },
  { slug: 'sobre-nos-no-que-acreditamos', titulo: 'No que acreditamos', alt: 'Pastor pregando no palco diante da igreja reunida no auditório' },
  { slug: 'jesus', titulo: 'Jesus', alt: 'Mão estendida, com manga de túnica de linho, diante de um lago' },
];

/** Primeiro parágrafo, até ~155 caracteres, sem cortar palavra (descrição do Google). */
function resumoSeo(markdown: string): string {
  const primeiro = markdown.split(/\n\s*\n/)[0].trim();
  return primeiro.length <= 155 ? primeiro : `${primeiro.slice(0, 152).replace(/\s+\S*$/, '')}…`;
}

async function paginaInstitucional(strapi: Core.Strapi, p: (typeof PAGINAS_INSTITUCIONAIS)[number]) {
  const conteudo = fs.readFileSync(path.join(SEED_DIR, 'paginas', `${p.slug}.md`), 'utf8');
  const foto = await image(strapi, `${p.slug}.jpg`, p.alt);
  return {
    seo: { metaTitle: `${p.titulo} | ADAI`, metaDescription: resumoSeo(conteudo) },
    sections: [
      { __component: 'sections.hero', titulo: p.titulo, imagem: foto, preto_e_branco: false },
      { __component: 'sections.texto-rico', conteudo },
    ],
  };
}

/** Garante as Unidades (por ID da inChurch) e devolve o documentId de cada uma. */
async function ensureUnidades(strapi: Core.Strapi): Promise<Map<number, string>> {
  const unidades = strapi.documents('api::unidade.unidade');
  const ids = new Map<number, string>();
  for (const u of UNIDADES_SITE) {
    const existente = await unidades.findFirst({ filters: { igreja_inchurch_id: u.igrejaInchurchId } });
    const doc =
      existente ?? (await unidades.create({ data: { nome: u.nomeInchurch, igreja_inchurch_id: u.igrejaInchurchId } as never }));
    if (!existente) strapi.log.info(`[seed] Unidade "${u.nomeInchurch}" (inChurch ${u.igrejaInchurchId}) criada.`);
    ids.set(u.igrejaInchurchId, doc.documentId);
  }
  return ids;
}

/** Home conforme o Figma `adai.com.br`, incluindo a lista de ministérios e Contribua. */
async function homeSections(strapi: Core.Strapi) {
  const hero = await image(
    strapi,
    'hero-adai.jpg',
    'Voluntária sorri na entrada da igreja segurando uma placa com as palavras Amar, Servir e Influenciar',
  );
  const primeiraVez = await image(strapi, 'primeira-vez-culto.jpg', ALT_CULTO);
  const lideranca = await image(strapi, 'lideranca-rodrigo-tati-soeiro.jpg', ALT_LIDERANCA);

  return [
    {
      __component: 'sections.hero',
      titulo: 'Amar.\nServir.\nInfluenciar.',
      texto_apoio:
        'Uma igreja que ama, serve e influencia em cinco localidades, com as portas abertas todo domingo.\nTem um lugar pra você aqui.',
      imagem: hero,
      preto_e_branco: false,
      botoes: [
        { texto: 'Planeje sua visita', url: '/planeje-sua-visita', estilo: 'solido' },
        { texto: 'Unidades', url: '/unidades', estilo: 'contorno' },
      ],
    },
    {
      __component: 'sections.carrossel-cards',
      titulo: 'Neste domingo',
      texto_apoio: 'Escolha a unidade mais perto de você ou participe de casa pela ADAI On.',
      posicao_imagem: 'acima',
      cards: UNIDADES_SITE.map((u) => cardUnidade(u, true)),
    },
    {
      __component: 'sections.imagem-texto',
      imagem: primeiraVez,
      posicao_imagem: 'esquerda',
      preto_e_branco: false,
      titulo: 'Primeira vez na\nADAI?',
      texto: 'Chegar num lugar novo pode ser estranho. Por isso, vale saber um pouco antes de ir.',
      lista: [
        { titulo: 'Como é o culto', texto: 'Louvor, uma mensagem da Bíblia pra vida real e gente disposta a te receber bem.' },
        { titulo: 'Seus filhos', texto: 'O ADAI Kids cuida das crianças enquanto você participa do culto.' },
        { titulo: 'Fale com a gente', texto: 'Avise que vai e alguém do nosso time te espera na entrada.' },
      ],
      botao: { texto: 'Planeje sua visita', url: '/planeje-sua-visita', estilo: 'solido' },
    },
    {
      __component: 'sections.imagem-texto',
      imagem: lideranca,
      posicao_imagem: 'direita',
      preto_e_branco: false,
      rotulo: 'Pastores Líderes',
      titulo: 'Rodrigo &\nTati Soeiro',
      texto:
        'Rodrigo Soeiro é pastor líder da ADAI e lidera a igreja com uma visão apaixonada por pessoas. Tati Soeiro co-lidera ao seu lado, com foco especial no ministério feminino.',
      botao: { texto: 'Nossa liderança', url: '/lideranca', estilo: 'solido' },
    },
    {
      // Conteúdo vem do YouTube; aqui só a configuração editorial (tudo automático).
      __component: 'sections.serie-atual',
      exibir: true,
      titulo_personalizado: null,
      playlist_url: null,
    },
    {
      // Eventos vêm da inChurch; aqui só a apresentação.
      __component: 'sections.proximos-eventos',
      titulo: 'Próximos eventos',
      quantidade: 8,
      cor_cards: 'cinza',
    },
    {
      __component: 'sections.ministerios',
      titulo: 'Encontre seu lugar',
      texto_apoio: 'Tem espaço pra todas as idades e fases da vida.\nEscolha por onde começar.',
      botao: { texto: 'Quero servir', url: 'https://forms.gle/4wAWu99WyUVR8BcU7', estilo: 'solido', nova_aba: true },
      ministerios: [
        { nome: 'KIDS', publico: 'Crianças' },
        { nome: 'INPULSE', publico: 'Adolescentes' },
        { nome: 'PULSE', publico: 'Jovens' },
        { nome: 'FLORES', publico: 'Mulheres' },
        { nome: 'ENRAIZADOS', publico: 'Homens' },
        { nome: 'ESPORTE', publico: 'Esporte e comunidade' },
        { nome: 'MUSIC', publico: 'Louvor e adoração' },
        { nome: 'CRTV', publico: 'Criativo' },
      ],
    },
    {
      __component: 'sections.imagem-texto',
      imagem: hero,
      posicao_imagem: 'esquerda',
      preto_e_branco: false,
      titulo: 'Contribua',
      texto: 'Dizimar e ofertar não é obrigação. É um ato de fidelidade e gratidão, e o privilégio de participar do que Deus está fazendo aqui na terra.',
      botao: { texto: 'Contribuir agora', url: '/contribua', estilo: 'solido' },
      botoes_secundarios: [
        { texto: 'Projeto Nossa Casa', url: 'https://www.adai.com.br/nossacasa', estilo: 'contorno', nova_aba: true },
        { texto: 'Outras formas de contribuir', url: '/contribua', estilo: 'contorno' },
      ],
    },
    {
      __component: 'sections.texto-botoes',
      titulo: 'A igreja no seu bolso',
      texto_apoio: 'Bíblia, planos de leitura, agenda, inscrições, pedidos de oração e cultos ao vivo no app da ADAI.',
      botoes: [
        { texto: 'Baixar na App Store', url: 'https://apps.apple.com/mw/app/igreja-adai/id6736497082', estilo: 'solido', nova_aba: true },
        { texto: 'Baixar no Google Play', url: 'https://play.google.com/store/apps/details?id=br.com.inchurch.adaltoipiranga&hl=pt_BR&pli=1', estilo: 'contorno', nova_aba: true },
      ],
    },
    {
      __component: 'sections.perguntas-frequentes',
      titulo: 'Perguntas frequentes',
      texto_apoio: 'Separamos algumas dúvidas comuns de quem está chegando pela primeira vez à ADAI.',
      perguntas: [
        {
          pergunta: 'Posso ir sozinho(a)?',
          resposta: 'Claro. Muitas pessoas vêm pela primeira vez sozinhas e são recebidas com muita naturalidade. Se quiser, avise antes e alguém te espera na entrada.',
        },
        {
          pergunta: 'Como funciona o ADAI Kids?',
          resposta: 'O ADAI Kids cuida das crianças com segurança e carinho, com atividades pensadas por faixa etária. Você participa do culto tranquilo(a) sabendo que elas estão sendo bem acompanhadas.',
        },
        {
          pergunta: 'Tem estacionamento?',
          resposta: 'Sim, a unidade possui espaço pra estacionamento e acesso facilitado. Também é possível chegar por transporte público, dependendo da sua região.',
        },
        {
          pergunta: 'Como me conectar com a igreja depois do culto?',
          resposta: 'Você pode conversar com a equipe, participar de grupos, eventos e ministérios. O importante é começar, e a gente te ajuda a encontrar o melhor caminho.',
        },
      ],
    },
  ];
}

/** Página /exemplos: variações dos componentes montadas no Strapi (conteúdo ilustrativo). */
async function exemplosSections(strapi: Core.Strapi) {
  const fotos = await Promise.all([
    image(strapi, 'card-1.jpg', 'Carros estacionados e pessoas chegando à igreja em um dia de sol'),
    image(strapi, 'card-2.jpg', 'Voluntária segura placa com as palavras Amar, Servir e Influenciar'),
    image(strapi, 'card-3.jpg', 'Voluntária de camiseta verde sorri na entrada da igreja'),
  ]);
  const culto = await image(strapi, 'primeira-vez-culto.jpg', ALT_CULTO);

  const cores = ['azul', 'verde', 'laranja', 'vinho', 'preto', 'branco', 'cinza', 'azul'];
  const ministerio = (titulo: string, i: number) => ({
    cor: cores[i % cores.length],
    imagem: fotos[i % fotos.length],
    titulo,
    destaques: 'Domingos\n9h e 11h',
    texto: 'Conteúdo de exemplo: apresente o ministério em uma frase.',
    botao: { texto: 'Quero participar', url: `/ministerios/${titulo.toLowerCase()}`, estilo: 'solido' },
    link: { texto: 'Falar com a liderança', url: '/contato' },
  });

  return [
    {
      __component: 'sections.carrossel-cards',
      titulo: 'Cards de ministérios (exemplo)',
      texto_apoio:
        'Exemplo com fotos, cores, botão e link de contato. Com mais cards do que cabem na tela, as setas aparecem.',
      posicao_imagem: 'acima',
      cards: ['KIDS', 'INPULSE', 'PULSE', 'FLORES', 'ENRAIZADOS', 'ESPORTE', 'MUSIC', 'CRTV'].map(ministerio),
      link: { texto: 'Ver todos os ministérios', url: '/ministerios' },
    },
    {
      __component: 'sections.carrossel-cards',
      titulo: 'Eventos com foto abaixo',
      texto_apoio: 'Exemplo com a foto abaixo do texto e só link em cada card.',
      posicao_imagem: 'abaixo',
      cards: [
        { titulo: 'Conferência de Mulheres', cor: 'vinho', destaques: '12 e 13 de outubro', texto: 'Campestre · Santo André', imagem: fotos[1], link: { texto: 'Inscreva-se', url: '/eventos/mulheres' } },
        { titulo: 'Batismo', cor: 'branco', destaques: '26 de outubro', texto: 'Todas as unidades', imagem: fotos[2], link: { texto: 'Quero me batizar', url: '/eventos/batismo' } },
        { titulo: 'Noite de louvor', cor: 'preto', destaques: '8 de novembro, 19h', texto: 'São Bernardo do Campo', imagem: fotos[0], link: { texto: 'Saiba mais', url: '/eventos/louvor' } },
      ],
    },
    {
      __component: 'sections.imagem-texto',
      imagem: culto,
      posicao_imagem: 'direita',
      rotulo: 'Exemplo',
      titulo: 'Foto à direita\ncom botão e link',
      texto: 'Variação sem lista: título grande, parágrafo, botão principal e link secundário.',
      botao: { texto: 'Planeje sua visita', url: '/planeje-sua-visita', estilo: 'solido' },
      link: { texto: 'Falar no WhatsApp', url: '/contato' },
    },
    {
      // Exemplo de override editorial: playlist fixada (série de agosto) + título personalizado.
      __component: 'sections.serie-atual',
      exibir: true,
      titulo_personalizado: 'Ele Prometeu — agosto',
      playlist_url: 'https://www.youtube.com/playlist?list=PLQfoGbsdZPXo',
    },
    {
      __component: 'sections.proximos-eventos',
      titulo: 'Agenda da ADAI',
      texto_apoio: 'Exemplo com 4 eventos e cards pretos. Os eventos vêm da inChurch.',
      quantidade: 4,
      cor_cards: 'preto',
    },
    {
      // Texto (documento) no meio da página: o título vira h2 e os "##" do texto viram h3.
      __component: 'sections.texto-rico',
      titulo: 'Exemplo de texto (documento)',
      conteudo: [
        'Parágrafo com **negrito** e um [link para Contribua](/contribua).',
        '## Subtítulo',
        '- Primeiro item\n- Segundo item',
        '| Coluna | Descrição |\n| --- | --- |\n| A | Tabela curta, rola para o lado no celular |',
      ].join('\n\n'),
    },
  ];
}

/**
 * Política de Privacidade e Cookies. Texto público de `docs/conteudo/politica-de-privacidade.md`
 * (entre INICIO/FIM_CONTEUDO_PUBLICO), copiado para `seed/politica-de-privacidade.md`.
 * Minuta: revisar com o jurídico antes de publicar em produção.
 */
function politicaSections() {
  return [
    {
      __component: 'sections.texto-rico',
      titulo: 'Política de Privacidade e Cookies',
      atualizado_em: '2026-10-02',
      conteudo: fs.readFileSync(path.join(SEED_DIR, 'politica-de-privacidade.md'), 'utf8'),
    },
  ];
}

async function publishPage(strapi: Core.Strapi, documentId: string) {
  await strapi.documents('api::page.page').publish({ documentId });
}

/**
 * Conteúdo inicial para desenvolvimento. Roda fora de produção (ou com SEED_INITIAL_CONTENT=true).
 * - Configurações do site e páginas são criadas se não existirem.
 * - Se SEED_VERSION subiu, as seções da Home são reconstruídas a partir deste arquivo.
 */
export async function seedInitialContent(strapi: Core.Strapi) {
  const enabled =
    process.env.SEED_INITIAL_CONTENT === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.SEED_INITIAL_CONTENT !== 'false');
  if (!enabled) return;

  const storedVersion = ((await strapi.store.get(STORE)) as number | null) ?? 1;
  const pages = strapi.documents('api::page.page');

  const global = await strapi.documents('api::global.global').findFirst();
  if (!global) {
    await strapi.documents('api::global.global').create({ data: { header, footer, seo } as never });
    strapi.log.info('[seed] Configurações do site (cabeçalho e rodapé) criadas.');
  } else if (storedVersion < SEED_VERSION) {
    await strapi.documents('api::global.global').update({ documentId: global.documentId, data: { footer } as never });
    strapi.log.warn(`[seed] Rodapé reconstruído (seed v${storedVersion} → v${SEED_VERSION}).`);
  }

  const home = await pages.findFirst({ filters: { slug: 'home' } });
  if (!home) {
    const created = await pages.create({
      data: { titulo: 'Página inicial', slug: 'home', seo, sections: await homeSections(strapi) } as never,
    });
    await publishPage(strapi, created.documentId);
    strapi.log.info('[seed] Página "home" criada e publicada.');
  } else if (storedVersion < SEED_VERSION) {
    await pages.update({ documentId: home.documentId, data: { sections: await homeSections(strapi) } as never });
    await publishPage(strapi, home.documentId);
    strapi.log.warn(`[seed] Seções da Home reconstruídas (seed v${storedVersion} → v${SEED_VERSION}).`);
  }

  const exemplos = await pages.findFirst({ filters: { slug: 'exemplos' } });
  if (exemplos && storedVersion < SEED_VERSION) {
    await pages.update({ documentId: exemplos.documentId, data: { sections: await exemplosSections(strapi) } as never });
    await publishPage(strapi, exemplos.documentId);
    strapi.log.warn(`[seed] Seções de "exemplos" reconstruídas (seed v${storedVersion} → v${SEED_VERSION}).`);
  }
  if (!exemplos) {
    const created = await pages.create({
      data: {
        titulo: 'Exemplos de componentes',
        slug: 'exemplos',
        seo: {
          metaTitle: 'Exemplos de componentes | ADAI',
          metaDescription: 'Página de desenvolvimento com variações dos componentes montadas no Strapi.',
          metaRobots: 'noindex, nofollow',
        },
        sections: await exemplosSections(strapi),
      } as never,
    });
    await publishPage(strapi, created.documentId);
    strapi.log.info('[seed] Página "exemplos" criada e publicada.');
  }

  const politica = await pages.findFirst({ filters: { slug: 'politica-de-privacidade' } });
  if (!politica) {
    const created = await pages.create({
      data: {
        titulo: 'Política de Privacidade e Cookies',
        slug: 'politica-de-privacidade',
        seo: {
          metaTitle: 'Política de Privacidade e Cookies | ADAI',
          metaDescription:
            'Saiba como a ADAI trata seus dados pessoais, utiliza cookies e respeita suas escolhas. Conheça seus direitos e nossos canais de contato.',
        },
        sections: politicaSections(),
      } as never,
    });
    await publishPage(strapi, created.documentId);
    strapi.log.info('[seed] Página "politica-de-privacidade" criada e publicada.');
  } else if (storedVersion < SEED_VERSION) {
    await pages.update({ documentId: politica.documentId, data: { sections: politicaSections() } as never });
    await publishPage(strapi, politica.documentId);
    strapi.log.warn(`[seed] Política de Privacidade reconstruída (seed v${storedVersion} → v${SEED_VERSION}).`);
  }

  for (const p of PAGINAS_INSTITUCIONAIS) {
    const existente = await pages.findFirst({ filters: { slug: p.slug } });
    if (!existente) {
      const created = await pages.create({ data: { titulo: p.titulo, slug: p.slug, ...(await paginaInstitucional(strapi, p)) } as never });
      await publishPage(strapi, created.documentId);
      strapi.log.info(`[seed] Página "${p.slug}" criada e publicada.`);
    } else if (storedVersion < SEED_VERSION) {
      await pages.update({ documentId: existente.documentId, data: await paginaInstitucional(strapi, p) } as never);
      await publishPage(strapi, existente.documentId);
      strapi.log.warn(`[seed] Página "${p.slug}" reconstruída (seed v${storedVersion} → v${SEED_VERSION}).`);
    }
  }

  const idsUnidades = await ensureUnidades(strapi);
  const fotoCampestre = await image(strapi, 'unidade-campestre.jpg', 'Fachada da ADAI Campestre: prédio de tijolos com o logo da ADAI no alto, sob céu azul');
  // 🟡 Foto provisória das outras unidades até o time enviar as reais.
  const fotoProvisoria = await image(
    strapi,
    'hero-adai.jpg',
    'Voluntária sorri na entrada da igreja segurando uma placa com as palavras Amar, Servir e Influenciar',
  );
  for (const u of UNIDADES_SITE) {
    const sections = unidadeSections(u, u.slug === 'campestre' ? fotoCampestre : fotoProvisoria, idsUnidades.get(u.igrejaInchurchId)!);
    const pagina = await pages.findFirst({ filters: { slug: u.slug } });
    if (!pagina) {
      const created = await pages.create({
        data: {
          titulo: u.nome,
          slug: u.slug,
          seo: { metaTitle: `${u.nome} | ADAI`, metaDescription: (sections[0] as { subtitulo: string }).subtitulo },
          sections,
        } as never,
      });
      await publishPage(strapi, created.documentId);
      strapi.log.info(`[seed] Página "${u.slug}" criada e publicada.`);
    } else if (storedVersion < SEED_VERSION) {
      await pages.update({ documentId: pagina.documentId, data: { sections } as never });
      await publishPage(strapi, pagina.documentId);
      strapi.log.warn(`[seed] Seções de "${u.slug}" reconstruídas (seed v${storedVersion} → v${SEED_VERSION}).`);
    }
  }

  if (storedVersion < SEED_VERSION) await strapi.store.set({ ...STORE, value: SEED_VERSION });
}
