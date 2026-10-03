import { defineShowcase } from '@/lib/showcase/types';
import { BannerCookies } from './BannerCookies';

export const bannerCookiesShowcase = defineShowcase<Record<string, never>>({
  slug: 'banner-cookies',
  nome: 'Aviso de cookies',
  categoria: 'layout',
  cmsKey: null,
  descricao:
    'Aviso próprio de cookies (LGPD): Aceitar ou Recusar os cookies de análise. Sem aceite, o GA4 não grava cookies (Consent Mode v2). Reabre pelo "Preferências de cookies" do rodapé.',
  quandoUsar: 'Automático em todas as páginas do site. Texto fixo no código (não vem do Strapi). Aqui aparece fora da posição fixa e sem gravar a escolha.',
  doc: 'docs/componentes/banner-cookies.md',
  render: () => (
    <div style={{ padding: 24 }}>
      <BannerCookies demonstracao />
    </div>
  ),
  variantes: [{ nome: 'padrao', titulo: 'Padrão', descricao: 'Primeira visita (sem escolha salva).', data: {} }],
});
