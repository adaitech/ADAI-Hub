/**
 * @jest-environment node
 *
 * Integração das rotas da API com o Next (draftMode, redirect, revalidateTag): o mesmo caminho
 * que o Strapi percorre ao chamar o webhook de revalidação e o botão "Pré-visualizar".
 */
import { revalidateTag } from 'next/cache';
import { draftMode } from 'next/headers';
import { GET as preview } from '@/app/api/preview/route';
import { POST as revalidar } from '@/app/api/revalidate/route';

jest.mock('next/headers', () => ({ draftMode: jest.fn() }));

const rascunho = { isEnabled: false, enable: jest.fn(), disable: jest.fn() };
const ambienteOriginal = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  (draftMode as jest.Mock).mockResolvedValue(rascunho);
  process.env.PREVIEW_SECRET = 'segredo-preview-teste';
  process.env.REVALIDATE_SECRET = 'segredo-revalidate-teste';
});

afterAll(() => {
  process.env = ambienteOriginal;
});

/** `redirect()` do Next lança um erro com o destino no `digest` (NEXT_REDIRECT;tipo;url;status). */
async function destinoDoRedirect(chamada: Promise<unknown>): Promise<string> {
  const erro = (await chamada.catch((e: unknown) => e)) as { digest?: string };
  expect(erro.digest).toMatch(/^NEXT_REDIRECT;/);
  return erro.digest!.split(';')[2];
}

describe('POST /api/revalidate (webhook do Strapi)', () => {
  const chamar = (headers: Record<string, string> = {}) =>
    revalidar(new Request('http://localhost/api/revalidate', { method: 'POST', headers }));

  it('segredo correto → marca todo o conteúdo do Strapi como desatualizado', async () => {
    const resposta = await chamar({ 'x-revalidate-secret': 'segredo-revalidate-teste' });
    expect(resposta.status).toBe(200);
    await expect(resposta.json()).resolves.toEqual({ revalidado: true });
    expect(revalidateTag).toHaveBeenCalledWith('strapi', 'max');
  });

  it('sem segredo ou segredo errado → 401 e nada é revalidado', async () => {
    for (const headers of [{}, { 'x-revalidate-secret': 'errado' }] as Record<string, string>[]) {
      const resposta = await chamar(headers);
      expect(resposta.status).toBe(401);
      await expect(resposta.json()).resolves.toEqual({ revalidado: false, erro: 'Token inválido' });
    }
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('servidor sem REVALIDATE_SECRET configurado → sempre 401 (nunca aberto)', async () => {
    delete process.env.REVALIDATE_SECRET;
    const resposta = await chamar({ 'x-revalidate-secret': '' });
    expect(resposta.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe('GET /api/preview (botão "Pré-visualizar" do Strapi)', () => {
  const chamar = (query: string) => preview(new Request(`http://localhost/api/preview?${query}`));

  it('rascunho de uma página → liga o draft mode e abre a página', async () => {
    const destino = await destinoDoRedirect(chamar('secret=segredo-preview-teste&slug=kids&status=draft'));
    expect(destino).toBe('/kids');
    expect(rascunho.enable).toHaveBeenCalled();
    expect(rascunho.disable).not.toHaveBeenCalled();
  });

  it('versão publicada → desliga o draft mode; slug "home" (ou ausente) abre "/"', async () => {
    expect(await destinoDoRedirect(chamar('secret=segredo-preview-teste&slug=home&status=published'))).toBe('/');
    expect(await destinoDoRedirect(chamar('secret=segredo-preview-teste'))).toBe('/');
    expect(rascunho.disable).toHaveBeenCalledTimes(2);
    expect(rascunho.enable).not.toHaveBeenCalled();
  });

  it('segredo errado → 401 sem mexer no draft mode', async () => {
    const resposta = (await chamar('secret=errado&slug=kids&status=draft')) as Response;
    expect(resposta.status).toBe(401);
    expect(rascunho.enable).not.toHaveBeenCalled();
  });

  it.each([['../admin'], ['https://site-malicioso.com'], ['Kids'], ['kids/../x']])('slug inválido %p → 400 (sem open redirect)', async (slug) => {
    const resposta = (await chamar(`secret=segredo-preview-teste&slug=${encodeURIComponent(slug)}`)) as Response;
    expect(resposta.status).toBe(400);
  });

  it('servidor sem PREVIEW_SECRET → 401 mesmo com segredo vazio', async () => {
    delete process.env.PREVIEW_SECRET;
    const resposta = (await chamar('secret=&slug=kids')) as Response;
    expect(resposta.status).toBe(401);
  });
});
