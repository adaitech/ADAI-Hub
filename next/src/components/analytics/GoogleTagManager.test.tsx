import { isValidElement, type ReactElement } from 'react';
import { headers } from 'next/headers';
import { GoogleTagManager } from './GoogleTagManager';

jest.mock('next/headers', () => ({ headers: jest.fn() }));
beforeEach(() => jest.mocked(headers).mockResolvedValue(new Headers({ 'x-nonce': 'nonce-da-requisicao' }) as never));

const original = process.env.NEXT_PUBLIC_GTM_ID;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_GTM_ID;
  else process.env.NEXT_PUBLIC_GTM_ID = original;
});

/** O <Script> do Next é o único filho do fragmento. */
function scriptDe(saida: Awaited<ReturnType<typeof GoogleTagManager>>) {
  const fragmento = saida as ReactElement<{ children: ReactElement<{ id: string; strategy: string; nonce?: string; dangerouslySetInnerHTML: { __html: string } }> }>;
  return fragmento.props.children;
}

describe('GoogleTagManager', () => {
  it('sem NEXT_PUBLIC_GTM_ID (dev local, testes, vitrine) → nenhuma tag', async () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    expect(await GoogleTagManager()).toBeNull();
  });

  it('ID inválido → nenhuma tag (nunca injeta texto arbitrário no script)', async () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-123");alert(1)//';
    expect(await GoogleTagManager()).toBeNull();
  });

  it('com o container de homologação → script depois da hidratação, que espera o aceite de cookies', async () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-5945V9DQ';
    const script = scriptDe(await GoogleTagManager());
    expect(isValidElement(script)).toBe(true);
    expect(script.props.id).toBe('google-tag-manager');
    expect(script.props.strategy).toBe('afterInteractive');
    // CSP estrita: o script inline só roda com o nonce da requisição (proxy.ts).
    expect(script.props.nonce).toBe('nonce-da-requisicao');
    const codigo = script.props.dangerouslySetInnerHTML.__html;
    expect(codigo).toContain('GTM-5945V9DQ');
    expect(codigo).toContain("'default'");
    expect(codigo).toContain('adaiCarregarGtm');
  });
});
