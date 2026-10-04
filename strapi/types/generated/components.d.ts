import type { Schema, Struct } from '@strapi/strapi';

export interface ItemsCard extends Struct.ComponentSchema {
  collectionName: 'components_items_cards';
  info: {
    description: 'Card do carrossel: foto opcional, t\u00EDtulo, destaques (ex.: hor\u00E1rios), texto, a\u00E7\u00F5es e p\u00E1gina do card (card inteiro clic\u00E1vel).';
    displayName: 'Card';
    icon: 'dashboard';
  };
  attributes: {
    botao: Schema.Attribute.Component<'shared.botao', false>;
    cor: Schema.Attribute.Enumeration<
      ['cinza', 'branco', 'preto', 'azul', 'verde', 'laranja', 'vinho']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'cinza'>;
    destaques: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    imagem: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    texto: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 240;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ItemsColunaLinks extends Struct.ComponentSchema {
  collectionName: 'components_items_colunas_links';
  info: {
    description: 'Coluna do rodap\u00E9: t\u00EDtulo e lista de links.';
    displayName: 'Coluna de links';
    icon: 'bulletList';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
        },
        number
      >;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
  };
}

export interface ItemsDestaque extends Struct.ComponentSchema {
  collectionName: 'components_items_destaques';
  info: {
    description: 'Item da lista da se\u00E7\u00E3o Imagem e texto: t\u00EDtulo curto em negrito e explica\u00E7\u00E3o.';
    displayName: 'Destaque da lista';
    icon: 'bulletList';
  };
  attributes: {
    texto: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
  };
}

export interface ItemsMinisterio extends Struct.ComponentSchema {
  collectionName: 'components_items_ministerios';
  info: {
    description: 'Nome, p\u00FAblico e destino opcional de uma linha da lista de minist\u00E9rios.';
    displayName: 'Minist\u00E9rio da lista';
    icon: 'bulletList';
  };
  attributes: {
    nome: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    publico: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ItemsPerguntaFrequente extends Struct.ComponentSchema {
  collectionName: 'components_items_perguntas_frequentes';
  info: {
    description: 'Pergunta e resposta do FAQ.';
    displayName: 'Pergunta frequente';
    icon: 'question';
  };
  attributes: {
    pergunta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
    resposta: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
  };
}

export interface LayoutFooter extends Struct.ComponentSchema {
  collectionName: 'components_layout_footers';
  info: {
    description: 'Rodap\u00E9 de todas as p\u00E1ginas: frase da marca, colunas de links e linha final.';
    displayName: 'Rodap\u00E9';
    icon: 'layout';
  };
  attributes: {
    assinatura: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    colunas: Schema.Attribute.Component<'items.coluna-links', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
        },
        number
      >;
    copyright: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    texto_marca: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 140;
      }>;
  };
}

export interface LayoutHeader extends Struct.ComponentSchema {
  collectionName: 'components_layout_headers';
  info: {
    description: 'Menu principal e bot\u00F5es de destaque no topo de todas as p\u00E1ginas.';
    displayName: 'Cabe\u00E7alho';
    icon: 'layout';
  };
  attributes: {
    botoes: Schema.Attribute.Component<'shared.botao', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 2;
        },
        number
      >;
    links: Schema.Attribute.Component<'shared.link', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
        },
        number
      >;
  };
}

export interface SectionsCarrosselCards extends Struct.ComponentSchema {
  collectionName: 'components_sections_carrosseis_cards';
  info: {
    description: 'T\u00EDtulo, texto de apoio e uma fileira de cards que passa para o lado (ex.: Neste domingo / unidades).';
    displayName: 'Carrossel de cards';
    icon: 'apps';
  };
  attributes: {
    cards: Schema.Attribute.Component<'items.card', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    estilo_imagem: Schema.Attribute.Enumeration<['foto', 'arte']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'foto'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    posicao_imagem: Schema.Attribute.Enumeration<
      ['acima', 'apos_titulo', 'abaixo']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'acima'>;
    preto_e_branco: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Primeira faixa da p\u00E1gina: foto grande (preto e branco ou colorida), frase principal, texto abaixo dela e at\u00E9 dois bot\u00F5es.';
    displayName: 'Hero (abertura)';
    icon: 'picture';
  };
  attributes: {
    botoes: Schema.Attribute.Component<'shared.botao', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 2;
        },
        number
      >;
    imagem: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    preto_e_branco: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    subtitulo: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 220;
      }>;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 220;
      }>;
    titulo: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SectionsImagemTexto extends Struct.ComponentSchema {
  collectionName: 'components_sections_imagens_textos';
  info: {
    description: 'Foto grande de um lado e texto do outro: r\u00F3tulo, t\u00EDtulo grande, texto, lista, bot\u00E3o e link (ex.: Primeira vez na ADAI, Pastores l\u00EDderes).';
    displayName: 'Imagem e texto';
    icon: 'picture';
  };
  attributes: {
    botao: Schema.Attribute.Component<'shared.botao', false>;
    botoes_secundarios: Schema.Attribute.Component<'shared.botao', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 2;
        },
        number
      >;
    imagem: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    link: Schema.Attribute.Component<'shared.link', false>;
    lista: Schema.Attribute.Component<'items.destaque', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
        },
        number
      >;
    posicao_imagem: Schema.Attribute.Enumeration<['esquerda', 'direita']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'esquerda'>;
    preto_e_branco: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    rotulo: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    texto: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 400;
      }>;
    titulo: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
  };
}

export interface SectionsMinisterios extends Struct.ComponentSchema {
  collectionName: 'components_sections_ministerios';
  info: {
    description: 'T\u00EDtulo e convite ao lado de uma lista de minist\u00E9rios com seu p\u00FAblico.';
    displayName: 'Lista de minist\u00E9rios';
    icon: 'bulletList';
  };
  attributes: {
    botao: Schema.Attribute.Component<'shared.botao', false>;
    exibicao: Schema.Attribute.Enumeration<['lista', 'cards']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'lista'>;
    ministerios: Schema.Attribute.Component<'items.ministerio', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }> &
      Schema.Attribute.DefaultTo<'Encontre seu lugar'>;
  };
}

export interface SectionsPerguntasFrequentes extends Struct.ComponentSchema {
  collectionName: 'components_sections_perguntas_frequentes';
  info: {
    description: 'Lista de perguntas com respostas expans\u00EDveis.';
    displayName: 'Perguntas frequentes';
    icon: 'question';
  };
  attributes: {
    perguntas: Schema.Attribute.Component<'items.pergunta-frequente', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
  };
}

export interface SectionsProximosEventos extends Struct.ComponentSchema {
  collectionName: 'components_sections_proximos_eventos';
  info: {
    description: 'Eventos da ADAI vindos automaticamente da inChurch, em cards que passam para o lado. Aqui s\u00F3 t\u00EDtulo, texto, quantidade e (nas p\u00E1ginas de unidade) a unidade.';
    displayName: 'Pr\u00F3ximos eventos (inChurch)';
    icon: 'calendar';
  };
  attributes: {
    cor_cards: Schema.Attribute.Enumeration<
      ['cinza', 'branco', 'preto', 'azul', 'verde', 'laranja', 'vinho']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'cinza'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    quantidade: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<8>;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }> &
      Schema.Attribute.DefaultTo<'Pr\u00F3ximos eventos'>;
    unidade: Schema.Attribute.Relation<'oneToOne', 'api::unidade.unidade'>;
  };
}

export interface SectionsSerieAtual extends Struct.ComponentSchema {
  collectionName: 'components_sections_series_atuais';
  info: {
    description: 'S\u00E9rie de mensagens atual, montada automaticamente a partir do YouTube da ADAI. S\u00F3 tem configura\u00E7\u00F5es opcionais.';
    displayName: 'S\u00E9rie atual (mensagens do YouTube)';
    icon: 'play';
  };
  attributes: {
    exibir: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    playlist_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    titulo_personalizado: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SectionsTextoBotoes extends Struct.ComponentSchema {
  collectionName: 'components_sections_textos_botoes';
  info: {
    description: 'Chamada centralizada com t\u00EDtulo, texto de apoio e at\u00E9 dois bot\u00F5es.';
    displayName: 'Texto e bot\u00F5es';
    icon: 'bulletList';
  };
  attributes: {
    botoes: Schema.Attribute.Component<'shared.botao', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 2;
        },
        number
      >;
    texto_apoio: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    titulo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
  };
}

export interface SectionsTextoRico extends Struct.ComponentSchema {
  collectionName: 'components_sections_textos_ricos';
  info: {
    description: 'Texto longo com t\u00EDtulos, listas, tabelas e links (ex.: Pol\u00EDtica de Privacidade, termos, regulamentos).';
    displayName: 'Texto (documento)';
    icon: 'file';
  };
  attributes: {
    atualizado_em: Schema.Attribute.Date;
    conteudo: Schema.Attribute.RichText & Schema.Attribute.Required;
    titulo: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
  };
}

export interface SharedBotao extends Struct.ComponentSchema {
  collectionName: 'components_shared_botoes';
  info: {
    description: 'Bot\u00E3o de a\u00E7\u00E3o (CTA) com estilo definido pelo design.';
    displayName: 'Bot\u00E3o';
    icon: 'cursor';
  };
  attributes: {
    estilo: Schema.Attribute.Enumeration<['solido', 'contorno']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'solido'>;
    nova_aba: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    texto: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    url: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'Link de texto simples (menu, rodap\u00E9).';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    nova_aba: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    texto: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    url: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 50;
      }>;
    metaImage: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    metaRobots: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    metaViewport: Schema.Attribute.String;
    structuredData: Schema.Attribute.JSON;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'items.card': ItemsCard;
      'items.coluna-links': ItemsColunaLinks;
      'items.destaque': ItemsDestaque;
      'items.ministerio': ItemsMinisterio;
      'items.pergunta-frequente': ItemsPerguntaFrequente;
      'layout.footer': LayoutFooter;
      'layout.header': LayoutHeader;
      'sections.carrossel-cards': SectionsCarrosselCards;
      'sections.hero': SectionsHero;
      'sections.imagem-texto': SectionsImagemTexto;
      'sections.ministerios': SectionsMinisterios;
      'sections.perguntas-frequentes': SectionsPerguntasFrequentes;
      'sections.proximos-eventos': SectionsProximosEventos;
      'sections.serie-atual': SectionsSerieAtual;
      'sections.texto-botoes': SectionsTextoBotoes;
      'sections.texto-rico': SectionsTextoRico;
      'shared.botao': SharedBotao;
      'shared.link': SharedLink;
      'shared.seo': SharedSeo;
    }
  }
}
