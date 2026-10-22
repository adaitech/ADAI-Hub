import { render, screen, within } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { QR_CODES } from '@/lib/eba/qr-codes';
import { TESTES } from '@/lib/eba-api/testes';
import { QrCodes } from './QrCodes';

const ORIGEM = 'https://adai.com.br';

describe('QrCodes', () => {
  it('um cartão por teste, com h2 (nome do teste), imagem com texto alternativo e os dois endereços', () => {
    const { container } = render(<QrCodes qrCodes={QR_CODES} origemDoHub={ORIGEM} />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(TESTES.map((t) => t.nome));
    const primeiro = screen.getAllByRole('listitem')[0];
    expect(within(primeiro).getByRole('img', { name: `QR code do teste ${TESTES[0].nome}` })).toBeInTheDocument();
    expect(within(primeiro).getByText('https://eba.adai.com.br/teste/dons-servico')).toBeInTheDocument();
    expect(within(primeiro).getByText('https://adai.com.br/eba/testes/dons-servico')).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('cada cartão tem "Copiar link do Hub" e o link para abrir a imagem original em nova aba, com aviso e noopener', () => {
    render(<QrCodes qrCodes={QR_CODES} origemDoHub={ORIGEM} />);
    expect(screen.getAllByRole('button', { name: 'Copiar link do Hub' })).toHaveLength(5);
    const abrir = screen.getAllByRole('link', { name: /Abrir a imagem do QR code/ })[0];
    expect(abrir).toHaveAttribute('href', '/eba/qr/dons-servico.jpeg');
    expect(abrir).toHaveAttribute('target', '_blank');
    expect(abrir.getAttribute('rel')).toContain('noopener');
    expect(abrir).toHaveAccessibleName(expect.stringContaining('nova aba'));
  });

  it('explica que o QR impresso aponta para o site atual e continua valendo depois da virada', () => {
    render(<QrCodes qrCodes={QR_CODES} origemDoHub={ORIGEM} />);
    expect(screen.getByText(/redireciona para o Hub/)).toBeInTheDocument();
  });
});
