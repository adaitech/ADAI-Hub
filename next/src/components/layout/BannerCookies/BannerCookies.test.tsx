import { act, fireEvent, render, screen } from '@testing-library/react';
import { lerConsentimento, salvarConsentimento } from '@/lib/analytics/consentimento';
import { BannerCookies } from './BannerCookies';
import { BotaoPreferenciasCookies } from './BotaoPreferenciasCookies';

describe('BannerCookies', () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it('aparece sem escolha salva e não é modal (região com título)', () => {
    render(<BannerCookies />);
    expect(screen.getByRole('region', { name: 'Sua privacidade' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('tem o link para a Política de Privacidade e Cookies', () => {
    render(<BannerCookies />);
    expect(screen.getByRole('link', { name: 'Política de Privacidade e Cookies' })).toHaveAttribute('href', '/politica-de-privacidade');
  });

  it('Aceitar: salva, libera analytics no Consent Mode e registra a escolha', () => {
    render(<BannerCookies />);
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    expect(lerConsentimento()?.analytics).toBe(true);
    expect(Array.from(window.dataLayer![0] as unknown as ArrayLike<unknown>)).toEqual(['consent', 'update', { analytics_storage: 'granted' }]);
    expect(window.dataLayer![1]).toMatchObject({ event: 'consentimento_cookies', escolha: 'aceito' });
    expect(screen.queryByRole('region', { name: 'Sua privacidade' })).toBeNull();
  });

  it('Recusar mantém analytics negado', () => {
    render(<BannerCookies />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(lerConsentimento()?.analytics).toBe(false);
  });

  it('com escolha salva não aparece; "Preferências de cookies" reabre', () => {
    salvarConsentimento(false);
    render(
      <>
        <BannerCookies />
        <BotaoPreferenciasCookies />
      </>,
    );
    expect(screen.queryByRole('region', { name: 'Sua privacidade' })).toBeNull();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Preferências de cookies' }));
    });
    expect(screen.getByRole('region', { name: 'Sua privacidade' })).toBeInTheDocument();
  });

  it('demonstração (vitrine) não lê nem grava nada', () => {
    salvarConsentimento(true);
    render(<BannerCookies demonstracao />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(lerConsentimento()?.analytics).toBe(true);
  });
});
