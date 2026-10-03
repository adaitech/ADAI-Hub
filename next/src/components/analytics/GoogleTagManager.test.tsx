import { isValidElement, type ReactElement } from 'react';
import { GoogleTagManager } from './GoogleTagManager';

const original = process.env.NEXT_PUBLIC_GTM_ID;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_GTM_ID;
  else process.env.NEXT_PUBLIC_GTM_ID = original;
});

/** O <Script> do Next é o único filho do fragmento. */
function scriptDe(saida: ReturnType<typeof GoogleTagManager>) {
  const fragmento = saida as ReactElement<{ children: ReactElement<{ id: string; strategy: string; dangerouslySetInnerHTML: { __html: string } }> }>;
  return fragmento.props.children;
}

describe('GoogleTagManager', () => {
  it('sem NEXT_PUBLIC_GTM_ID (dev local, testes, vitrine) → nenhuma tag', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;
    expect(GoogleTagManager()).toBeNull();
  });

  it('ID inválido → nenhuma tag (nunca injeta texto arbitrário no script)', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-123");alert(1)//';
    expect(GoogleTagManager()).toBeNull();
  });

  it('com o container de homologação → script depois da hidratação, que espera o aceite de cookies', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-5945V9DQ';
    const script = scriptDe(GoogleTagManager());
    expect(isValidElement(script)).toBe(true);
    expect(script.props.id).toBe('google-tag-manager');
    expect(script.props.strategy).toBe('afterInteractive');
    const codigo = script.props.dangerouslySetInnerHTML.__html;
    expect(codigo).toContain('GTM-5945V9DQ');
    expect(codigo).toContain("'default'");
    expect(codigo).toContain('adaiCarregarGtm');
  });
});
