import { slugDoCurso } from '@/lib/paginas/caminho';
import { sanitizeHref } from '@/lib/strapi/links';
import type { StrapiTeste, TesteView } from './types';

const ORDEM_PADRAO = 100;
/** O teste abre em https (site atual da EBA) ou numa página do próprio site. */
const LINK_DE_TESTE = /^(https:\/\/|\/(?!\/))/i;

const texto = (valor: string | null | undefined) => valor?.trim() || null;

/** Link do botão "Fazer o teste": só https ou caminho interno; o resto (http, mailto, javascript:) → null. */
export function linkDoTeste(url: string | null | undefined): string | null {
  const href = sanitizeHref(url);
  return href && LINK_DE_TESTE.test(href) ? href : null;
}

/** Teste do CDV. Sem nome, resumo ou endereço válido (vira âncora) → null (o teste não aparece). */
export function normalizeTeste(teste: StrapiTeste): TesteView | null {
  const nome = texto(teste.nome);
  const resumo = texto(teste.resumo);
  // Mesmo padrão de endereço do curso: só minúsculas, números e hífen.
  const slug = slugDoCurso(teste.slug?.trim() ?? '');
  if (!nome || !resumo || !slug) return null;

  return {
    slug,
    nome,
    resumo,
    aula: texto(teste.aula),
    oQueE: texto(teste.o_que_e),
    itensTitulo: texto(teste.itens_titulo),
    itens: (teste.itens ?? '')
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean),
    perguntas: texto(teste.perguntas),
    resposta: texto(teste.resposta),
    comoResponder: texto(teste.como_responder),
    comoLerResultado: texto(teste.como_ler_resultado),
    link: linkDoTeste(teste.link_teste),
    ordem: typeof teste.ordem === 'number' ? teste.ordem : ORDEM_PADRAO,
  };
}

/** Ordem do Strapi (menor primeiro), depois nome. */
export function ordenarTestes(testes: TesteView[]): TesteView[] {
  return [...testes].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
}
