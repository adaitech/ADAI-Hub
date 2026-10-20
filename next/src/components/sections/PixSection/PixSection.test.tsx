import { render, screen } from '@testing-library/react';
import { PixSection } from './PixSection';
import { normalizePix } from './normalize';
import type { PixData } from './types';

const base: PixData = { __component: 'sections.pix', id: 1, titulo: 'Como contribuir pelo Pix.', chave_pix: ' nossacasa@adai.com.br ', favorecido: 'Igreja Evangélica Assembleia de Deus Ministério Alto do Ipiranga', cnpj: '08.020.296/0001-14', passos: 'Copie a chave.\nAbra seu banco.\nConfira o favorecido.', contato: { id: 2, texto: 'Falar com a equipe', url: 'mailto:contato@adai.com.br' }, ancora: 'como-contribuir' };

describe('PixSection', () => {
  it('mostra chave, passos numerados, contato e âncora com hierarquia correta', () => {
    const { container } = render(<PixSection data={base} index={3} />);
    expect(screen.getByRole('heading', { level: 2, name: base.titulo! })).toBeInTheDocument();
    expect(screen.getByText('nossacasa@adai.com.br')).toBeInTheDocument();
    expect(screen.getByText(base.favorecido!)).toBeInTheDocument();
    expect(screen.getByText(base.cnpj!)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Falar com a equipe' })).toHaveAttribute('href', 'mailto:contato@adai.com.br');
    expect(container.querySelector('#como-contribuir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar chave Pix' })).toBeInTheDocument();
  });
  it('omite seção incompleta, descarta contato inseguro e âncora inválida', () => {
    expect(normalizePix({ ...base, chave_pix: ' ' })).toBeNull();
    expect(normalizePix({ ...base, titulo: '' })).toBeNull();
    expect(normalizePix({ ...base, favorecido: '' })).toBeNull();
    expect(normalizePix({ ...base, cnpj: '' })).toBeNull();
    expect(normalizePix({ ...base, ancora: 'inválida com espaço', contato: { id: 2, texto: 'Contato', url: 'javascript:alert(1)' } })).toMatchObject({ ancora: undefined, contato: null });
    const { container } = render(<PixSection data={{ ...base, chave_pix: null }} index={0} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('aceita só os campos obrigatórios e pode abrir a página', () => {
    render(<PixSection data={{ ...base, id: 2, titulo: 'Pix', passos: null, contato: null }} index={0} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Pix' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
