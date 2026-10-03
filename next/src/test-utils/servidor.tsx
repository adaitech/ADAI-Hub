import { TextDecoder, TextEncoder } from 'node:util';
import type { ReactNode } from 'react';

/**
 * Renderiza uma árvore de **Server Components** (inclusive `async`, como `page.tsx`, o layout e
 * as seções que buscam dados) do jeito que o Next faz no servidor, e coloca o HTML resultante no
 * `document` do jsdom para consultar com Testing Library (`screen`, `within`).
 *
 * O `render` do Testing Library não aceita componente `async`; este utilitário usa o
 * `prerender` do React (espera todos os dados) e devolve o HTML final.
 */
export async function renderizarServidor(arvore: ReactNode): Promise<{ html: string; container: HTMLElement }> {
  // O renderizador de servidor do React usa APIs do Node que o jsdom não expõe.
  Object.assign(globalThis, {
    TextEncoder,
    TextDecoder,
    setImmediate: globalThis.setImmediate ?? ((fn: () => void) => setTimeout(fn, 0)),
  });
  const { prerenderToNodeStream } = await import('react-dom/static');

  const { prelude } = await prerenderToNodeStream(<>{arvore}</>);
  let html = '';
  for await (const parte of prelude) html += parte.toString();

  document.body.innerHTML = `<div id="raiz-servidor">${html}</div>`;
  return { html, container: document.getElementById('raiz-servidor')! };
}

/** Fixa só o relógio (`Date`) — timers reais continuam, o render no servidor depende deles. */
export function fixarRelogio(iso: string) {
  jest.useFakeTimers({
    now: new Date(iso),
    doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'performance', 'hrtime', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback'],
  });
}
