import type { Metadata } from 'next';
import { metadataDaPaginaEba, paginaEba } from '../pagina-eba';

/** Página "eba-testes" do Strapi (Lista de testes). */
const SLUG = 'eba-testes';

export async function generateMetadata(): Promise<Metadata> {
  return metadataDaPaginaEba(SLUG);
}

/**
 * /eba/testes — a pasta `testes/` (com a tela `/eba/testes/[slug]`) tem precedência sobre `/eba/[slug]`,
 * então esta page monta a mesma página do Strapi que `/eba/[slug]` montaria.
 */
export default async function TestesEbaPage() {
  return paginaEba(SLUG);
}
