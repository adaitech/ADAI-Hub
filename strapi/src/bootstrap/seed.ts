import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';

/**
 * Suba este número sempre que a Home de desenvolvimento ganhar seções novas no seed.
 * Com a versão maior, as seções da Home e de /exemplos são reconstruídas a partir deste arquivo (só em dev).
 */
const SEED_VERSION = 14;
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
        { texto: 'Nossa história', url: '/nossa-historia' },
        { texto: 'A igreja que vemos', url: '/a-igreja-que-vemos' },
        { texto: 'No que acreditamos', url: '/no-que-acreditamos' },
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
        { texto: 'E-mail', url: '/contato' },
        { texto: 'WhatsApp', url: '/contato' },
        { texto: 'Instagram', url: 'https://www.instagram.com/', nova_aba: true },
        { texto: 'YouTube', url: 'https://www.youtube.com/', nova_aba: true },
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

/** Home conforme o Figma `adai.com.br`, incluindo a lista de ministérios e Contribua. */
async function homeSections(strapi: Core.Strapi) {
  const hero = await image(
    strapi,
    'hero-adai.jpg',
    'Voluntária sorri na entrada da igreja segurando uma placa com as palavras Amar, Servir e Influenciar',
  );
  const primeiraVez = await image(strapi, 'primeira-vez-culto.jpg', ALT_CULTO);
  const lideranca = await image(strapi, 'lideranca-rodrigo-tati-soeiro.jpg', ALT_LIDERANCA);

  const unidade = (titulo: string, destaques: string, texto: string, endereco: string) => ({
    titulo,
    destaques,
    texto,
    link: { texto: 'Como chegar', url: mapa(endereco), nova_aba: true },
  });

  return [
    {
      __component: 'sections.hero',
      titulo: 'Amar.\nServir.\nInfluenciar.',
      texto_apoio:
        'Uma igreja que ama, serve e influencia em cinco localidades, com as portas abertas todo domingo.\nTem um lugar pra você aqui.',
      imagem: hero,
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
      cards: [
        unidade('Campestre', '9h\n11h\n18h', 'Av. Dom Pedro II, 3405\nSanto André', 'Av. Dom Pedro II, 3405, Santo André'),
        unidade(
          'Anália Franco',
          '9h\n11h',
          'R. Eleonora Cintra, 960\nJardim Anália Franco, São Paulo',
          'R. Eleonora Cintra, 960, São Paulo',
        ),
        unidade(
          'São Bernardo',
          '9h\n11h\n18h',
          'R. Cabral da Câmara, 315\nPlanalto, São Bernardo do Campo',
          'R. Cabral da Câmara, 315, São Bernardo do Campo',
        ),
        unidade('Santos', '9h30\n11h30', 'R. Campos Mello, 197\nVila Matias, Santos', 'R. Campos Mello, 197, Santos'),
        {
          titulo: 'ADAI On',
          destaques: '11h\n15h',
          texto: '11h no YouTube\n15h no Zoom',
          link: { texto: 'Assistir', url: 'https://www.youtube.com/', nova_aba: true },
        },
      ],
    },
    {
      __component: 'sections.imagem-texto',
      imagem: primeiraVez,
      posicao_imagem: 'esquerda',
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
      preto_e_branco: true,
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

  if (!(await strapi.documents('api::global.global').findFirst())) {
    await strapi.documents('api::global.global').create({ data: { header, footer, seo } as never });
    strapi.log.info('[seed] Configurações do site (cabeçalho e rodapé) criadas.');
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

  if (storedVersion < SEED_VERSION) await strapi.store.set({ ...STORE, value: SEED_VERSION });
}
