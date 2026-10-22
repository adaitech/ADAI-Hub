import type { Metadata } from 'next';
import { ConsultarResultado } from '@/components/eba/PedirResultado/ConsultarResultado';
import { segredoDoResultado } from '@/lib/eba/link-resultado';
import { metadataDaPaginaEba, paginaEba } from '../pagina-eba';

/** Página "eba-testes" do Strapi (Lista de testes). */
const SLUG = 'eba-testes';

export async function generateMetadata(): Promise<Metadata> {
  return metadataDaPaginaEba(SLUG);
}

/**
 * /eba/testes — a pasta `testes/` (com a tela `/eba/testes/[slug]`) tem precedência sobre `/eba/[slug]`,
 * então esta page monta a mesma página do Strapi que `/eba/[slug]` montaria. Com o recurso ligado
 * (`EBA_RESULTADO_SEGREDO`), a faixa "Consultar meus resultados" aparece logo depois da trilha.
 */
export default async function TestesEbaPage() {
  return paginaEba(SLUG, segredoDoResultado() ? <ConsultarResultado /> : null);
}
