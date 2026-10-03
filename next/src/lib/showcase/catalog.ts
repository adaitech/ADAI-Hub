import { bannerCookiesShowcase } from '@/components/layout/BannerCookies/BannerCookies.showcase';
import { footerShowcase } from '@/components/layout/Footer/Footer.showcase';
import { headerShowcase } from '@/components/layout/Header/Header.showcase';
import { carrosselCardsShowcase } from '@/components/sections/CarrosselCardsSection/CarrosselCardsSection.showcase';
import { heroShowcase } from '@/components/sections/HeroSection/HeroSection.showcase';
import { imagemTextoShowcase } from '@/components/sections/ImagemTextoSection/ImagemTextoSection.showcase';
import { ministeriosShowcase } from '@/components/sections/MinisteriosSection/MinisteriosSection.showcase';
import { perguntasFrequentesShowcase } from '@/components/sections/PerguntasFrequentesSection/PerguntasFrequentesSection.showcase';
import { proximosEventosShowcase } from '@/components/sections/ProximosEventosSection/ProximosEventosSection.showcase';
import { serieAtualShowcase } from '@/components/sections/SerieAtualSection/SerieAtualSection.showcase';
import { textoBotoesShowcase } from '@/components/sections/TextoBotoesSection/TextoBotoesSection.showcase';
import { textoRicoShowcase } from '@/components/sections/TextoRicoSection/TextoRicoSection.showcase';
import { buttonLinkShowcase } from '@/components/ui/ButtonLink/ButtonLink.showcase';
import { textLinkShowcase } from '@/components/ui/TextLink/TextLink.showcase';
import type { ShowcaseCategoria, ShowcaseEntry } from './types';

/** Todo componente criado ou alterado entra aqui (ver .agents/rules/Vitrine-de-Componentes.md). */
export const showcaseCatalog: ShowcaseEntry[] = [
  headerShowcase,
  heroShowcase,
  carrosselCardsShowcase,
  imagemTextoShowcase,
  ministeriosShowcase,
  textoBotoesShowcase,
  perguntasFrequentesShowcase,
  serieAtualShowcase,
  proximosEventosShowcase,
  textoRicoShowcase,
  footerShowcase,
  bannerCookiesShowcase,
  buttonLinkShowcase,
  textLinkShowcase,
];

export const categoriaLabel: Record<ShowcaseCategoria, string> = {
  secao: 'Seções (páginas no Strapi)',
  layout: 'Layout (todas as páginas)',
  ui: 'UI (átomos)',
};

export function getShowcase(slug: string): ShowcaseEntry | null {
  return showcaseCatalog.find((entry) => entry.slug === slug) ?? null;
}
