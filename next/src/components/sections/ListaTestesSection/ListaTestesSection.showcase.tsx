import fixture from '@/lib/eba/__fixtures__/testes.json';
import { normalizeTeste, ordenarTestes } from '@/lib/eba/teste';
import type { StrapiTeste, TesteView } from '@/lib/eba/types';
import { defineShowcase } from '@/lib/showcase/types';
import { ListaTestes } from './ListaTestes';
import mocks from './ListaTestesSection.mock.json';
import { normalizeListaTestes } from './normalize';
import type { ListaTestesData, ListaTestesExemplo } from './types';

/** Testes da fixture (formato da API), já normalizados e em ordem. */
const testes = ordenarTestes((fixture.data as StrapiTeste[]).map((t) => normalizeTeste(t) as TesteView));

const comStrapi = (data: ListaTestesExemplo, mudanca: Partial<ListaTestesData>): ListaTestesExemplo => ({
  ...data,
  strapi: { ...data.strapi, ...mudanca },
});

export const listaTestesShowcase = defineShowcase<ListaTestesExemplo>({
  slug: 'lista-testes',
  nome: 'Lista de testes (EBA)',
  categoria: 'secao',
  cmsKey: 'sections.lista-testes',
  descricao: 'Os testes do CDV publicados no Strapi, em ordem: cada um com abertura (nome, resumo, perguntas, botão) e as partes "O que é", itens avaliados, "Como responder" e "Como ler o resultado".',
  quandoUsar: 'Na página /eba/testes, uma vez por página. Sem testes publicados, a seção some.',
  doc: 'docs/componentes/lista-testes.md',
  cms: (data) => data.strapi,
  render: ({ strapi: data, testes: lista, index }) => {
    const view = normalizeListaTestes(data);
    if (!view) return null;
    return (
      <ListaTestes
        id={String(data.id)}
        titulo={view.titulo}
        textoApoio={view.textoApoio}
        atalhos={view.atalhos}
        testes={lista}
        nivelTitulo={index === 0 ? 1 : 2}
      />
    );
  },
  variantes: [
    { nome: 'completo', titulo: 'Página de testes', data: { strapi: mocks.completo as ListaTestesData, testes, index: 2 } },
    { nome: 'minimo', titulo: 'Abrindo a página', descricao: 'Título em h1, testes em h2.', data: { strapi: mocks.minimo as ListaTestesData, testes, index: 0 } },
    { nome: 'texto_longo', titulo: 'Texto longo, sem atalhos', data: { strapi: mocks.texto_longo as ListaTestesData, testes, index: 2 } },
    { nome: 'um_teste', titulo: 'Só um teste, sem partes', descricao: 'Teste só com nome e resumo: sem caixas e sem botão.', data: { strapi: mocks.completo as ListaTestesData, testes: testes.slice(-1), index: 2 } },
  ],
  controles: [
    {
      id: 'atalhos',
      tipo: 'alternar',
      rotulo: 'Mostrar atalhos',
      valor: (data) => data.strapi.mostrar_atalhos !== false,
      aplicar: (data, ligado) => comStrapi(data, { mostrar_atalhos: ligado }),
    },
  ],
});
