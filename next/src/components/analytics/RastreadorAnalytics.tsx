'use client';

import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';
import { eventosDoClique } from '@/lib/analytics/cliques';
import { registrarEvento } from '@/lib/analytics/datalayer';

/** Texto acessível do elemento, sem os avisos para leitor de tela ("(abre em nova aba)"). */
function textoDe(el: Element): string {
  const texto = el.getAttribute('aria-label') ?? el.textContent ?? '';
  return texto.replace(/\(abre[^)]*\)/gi, '').replace(/\s+/g, ' ').trim();
}

function secaoDe(el: Element): string {
  return el.closest<HTMLElement>('[data-section]')?.dataset.section ?? 'pagina';
}

/** Título do card/item onde o clique aconteceu (unidade, evento, ministério). */
function cardDe(el: Element): string | null {
  const titulo = el.closest('li')?.querySelector('h2, h3, h4, strong');
  return titulo?.textContent?.replace(/\s+/g, ' ').trim() || null;
}

/**
 * Medição do site num único Client Component (montado no layout do site):
 * - cliques em links/botões → `eventosDoClique` (as seções seguem Server Components);
 * - perguntas da FAQ abertas → `ver_faq`;
 * - seções que aparecem na tela → `ver_secao` (uma vez por página);
 * - Core Web Vitals → `web_vitals`.
 * Elementos com `data-analytics="manual"` disparam o próprio evento (ex.: player da Série atual).
 */
export function RastreadorAnalytics() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    registrarEvento('web_vitals', {
      metrica: metric.name,
      valor: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      avaliacao: metric.rating,
    });
  });

  useEffect(() => {
    const aoClicar = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest('a[href], button');
      if (!el || el.closest('[data-analytics="manual"]')) return;
      const href = el instanceof HTMLAnchorElement ? el.href : '';
      const pagina = document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim() || null;
      for (const [nome, parametros] of eventosDoClique({ secao: secaoDe(el), texto: textoDe(el), destino: href, card: cardDe(el), pagina })) {
        registrarEvento(nome, parametros as never);
      }
    };

    // `toggle` não borbulha: escuta na fase de captura.
    const aoAbrirDetalhe = (event: Event) => {
      const detalhe = event.target;
      if (!(detalhe instanceof HTMLDetailsElement) || !detalhe.open) return;
      if (secaoDe(detalhe) !== 'perguntas-frequentes') return;
      const pergunta = detalhe.querySelector('summary')?.textContent?.trim();
      if (pergunta) registrarEvento('ver_faq', { pergunta });
    };

    document.addEventListener('click', aoClicar, true);
    document.addEventListener('toggle', aoAbrirDetalhe, true);
    return () => {
      document.removeEventListener('click', aoClicar, true);
      document.removeEventListener('toggle', aoAbrirDetalhe, true);
    };
  }, []);

  useEffect(() => {
    const secoes = Array.from(document.querySelectorAll<HTMLElement>('main [data-section]'));
    if (secoes.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const vistas = new Set<Element>();
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          // 25% da seção visível, ou metade da tela ocupada por ela (texto longo nunca chega a 25%).
          const vista = entrada.intersectionRatio >= 0.25 || entrada.intersectionRect.height >= window.innerHeight * 0.5;
          if (!entrada.isIntersecting || !vista || vistas.has(entrada.target)) continue;
          vistas.add(entrada.target);
          observer.unobserve(entrada.target);
          const el = entrada.target as HTMLElement;
          registrarEvento('ver_secao', { secao: el.dataset.section ?? 'desconhecida', posicao: secoes.indexOf(el) + 1 });
        }
      },
      { threshold: [0, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25] },
    );
    secoes.forEach((secao) => observer.observe(secao));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
