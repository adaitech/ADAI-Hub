import type { TesteView } from '@/lib/eba/types';
import { listarTestesPublicados } from '@/lib/strapi/queries/testes';
import type { SectionProps } from '@/types/sections';
import { ListaTestes } from './ListaTestes';
import { normalizeListaTestes } from './normalize';
import type { ListaTestesData } from './types';

/**
 * Lista de testes da EBA (página /eba/testes). Server Component: Strapi = título/apoio/atalhos;
 * tipo Testes da EBA = os testes publicados. Falha do Strapi → a seção some (ou, abrindo a página, erro).
 */
export async function ListaTestesSection({ data, index }: SectionProps<ListaTestesData>) {
  const view = normalizeListaTestes(data);
  if (!view) return null;

  let testes: TesteView[];
  try {
    testes = await listarTestesPublicados();
  } catch (erro) {
    // Abrindo a página, a lista é o conteúdo principal: o erro vai para o error.tsx.
    if (index === 0) throw erro;
    console.warn('[lista-testes] falha ao listar testes', erro instanceof Error ? erro.message : erro);
    return null;
  }

  return (
    <ListaTestes
      id={String(data.id)}
      titulo={view.titulo}
      textoApoio={view.textoApoio}
      atalhos={view.atalhos}
      testes={testes}
      nivelTitulo={index === 0 ? 1 : 2}
    />
  );
}
