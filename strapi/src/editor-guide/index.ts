import apiGlobal from './api.global.json';
import apiPage from './api.page.json';
import apiUnidade from './api.unidade.json';
import itemsCard from './items.card.json';
import itemsColunaLinks from './items.coluna-links.json';
import itemsDestaque from './items.destaque.json';
import itemsMinisterio from './items.ministerio.json';
import itemsPerguntaFrequente from './items.pergunta-frequente.json';
import layoutFooter from './layout.footer.json';
import layoutHeader from './layout.header.json';
import sectionsCarrosselCards from './sections.carrossel-cards.json';
import sectionsHero from './sections.hero.json';
import sectionsImagemTexto from './sections.imagem-texto.json';
import sectionsMinisterios from './sections.ministerios.json';
import sectionsPerguntasFrequentes from './sections.perguntas-frequentes.json';
import sectionsTextoBotoes from './sections.texto-botoes.json';
import sectionsProximosEventos from './sections.proximos-eventos.json';
import sectionsSerieAtual from './sections.serie-atual.json';
import sectionsTextoRico from './sections.texto-rico.json';
import sharedBotao from './shared.botao.json';
import sharedLink from './shared.link.json';
import sharedSeo from './shared.seo.json';

export interface EditorGuideField {
  campo: string;
  label: string;
  descricao: string;
  placeholder: string;
  ondeAparece: string;
  obrigatorio: boolean;
  limite: string;
  exemplo: string;
  componente?: string;
}

export interface EditorGuide {
  uid: string;
  nome: string;
  resumo: string;
  ondeAparece: string;
  boasPraticas: string[];
  campos: EditorGuideField[];
}

export const editorGuides: EditorGuide[] = [
  apiPage,
  apiGlobal,
  apiUnidade,
  sectionsHero,
  sectionsCarrosselCards,
  sectionsSerieAtual,
  sectionsProximosEventos,
  sectionsImagemTexto,
  sectionsMinisterios,
  sectionsTextoBotoes,
  sectionsPerguntasFrequentes,
  sectionsTextoRico,
  layoutHeader,
  layoutFooter,
  itemsCard,
  itemsColunaLinks,
  itemsDestaque,
  itemsMinisterio,
  itemsPerguntaFrequente,
  sharedBotao,
  sharedLink,
  sharedSeo,
];

/** Campo principal (título de itens repetíveis e da listagem) por UID. */
export const mainFields: Record<string, string> = {
  'api::page.page': 'titulo',
  'api::unidade.unidade': 'nome',
  'shared.botao': 'texto',
  'shared.link': 'texto',
  'items.coluna-links': 'titulo',
  'items.card': 'titulo',
  'items.destaque': 'titulo',
  'items.ministerio': 'nome',
  'items.pergunta-frequente': 'pergunta',
};
