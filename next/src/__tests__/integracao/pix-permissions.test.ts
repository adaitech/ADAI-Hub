/** @jest-environment node */
import { createPixWriteGuard } from '../../../../strapi/src/security/pix-permissions';

const pix = { sections: [{ __component: 'sections.pix' }] };
const ordinary = { sections: [{ __component: 'sections.hero' }] };
const admin = { state: { auth: { strategy: { name: 'admin' } }, user: { roles: [{ code: 'strapi-super-admin' }] } } };
const forbidden = (message: string) => Object.assign(new Error(message), { name: 'ForbiddenError' });

function setup(request: unknown = { state: {} }, entries: unknown[] = []) {
  const findMany = jest.fn(async () => entries);
  const guard = createPixWriteGuard({ requestContext: { get: () => request }, db: { query: () => ({ findMany }) } }, forbidden);
  const next = jest.fn(async () => 'executado');
  return { guard, next, findMany };
}

describe('proteção de escrita do Pix no Document Service', () => {
  it('usa o erro fornecido pelo servidor sem depender do runtime do Strapi', async () => {
    const erro = forbidden('Acesso restrito');
    const guard = createPixWriteGuard({ requestContext: { get: () => ({ state: {} }) }, db: { query: () => ({ findMany: async () => [] }) } }, () => erro);
    await expect(guard({ uid: 'api::page.page', action: 'create', params: { data: pix } }, async () => 'não deve executar')).rejects.toBe(erro);
  });
  it.each(['create', 'update', 'clone'])('nega %s com Pix recebido por editor, author ou token', async (action) => {
    for (const request of [{ state: {} }, { state: { user: { roles: [{ code: 'strapi-editor' }] } } }, { state: { user: { roles: [{ code: 'strapi-author' }] } } }]) {
      const { guard, next } = setup(request);
      await expect(guard({ uid: 'api::page.page', action, params: { data: pix } }, next)).rejects.toMatchObject({ name: 'ForbiddenError' });
      expect(next).not.toHaveBeenCalled();
    }
  });

  it.each(['update', 'publish', 'unpublish', 'delete', 'clone', 'discardDraft'])('nega %s em documento que já contém Pix', async (action) => {
    const { guard, next, findMany } = setup(undefined, [ordinary, pix]);
    await expect(guard({ uid: 'api::page.page', action, params: { documentId: 'documento', data: { slug: 'renomeado', sections: [] }, locale: '*' } }, next)).rejects.toMatchObject({ name: 'ForbiddenError' });
    expect(next).not.toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledWith({ where: { documentId: 'documento' }, populate: ['sections'] });
  });

  it('permite Super Admin autenticado no painel e execução interna sem request', async () => {
    for (const request of [admin, undefined]) {
      const { guard, next } = setup(request);
      // undefined explicitly represents bootstrap rather than the default HTTP fixture.
      if (request === undefined) {
        const internal = createPixWriteGuard({ requestContext: { get: () => undefined }, db: { query: () => ({ findMany: async () => [pix] }) } }, forbidden);
        await expect(internal({ uid: 'api::page.page', action: 'create', params: { data: pix } }, next)).resolves.toBe('executado');
      } else {
        await expect(guard({ uid: 'api::page.page', action: 'delete', params: { documentId: 'documento' } }, next)).resolves.toBe('executado');
      }
    }
  });

  it('não aceita papel super admin fornecido por outra estratégia', async () => {
    const { guard, next } = setup({ state: { ...admin.state, auth: { strategy: { name: 'api-token' } } } });
    await expect(guard({ uid: 'api::page.page', action: 'create', params: { data: pix } }, next)).rejects.toMatchObject({ name: 'ForbiddenError' });
  });

  it.each(['findMany', 'findOne', 'count', 'findFirst'])('preserva leitura %s do Pix', async (action) => {
    const { guard, next, findMany } = setup();
    await expect(guard({ uid: 'api::page.page', action, params: {} }, next)).resolves.toBe('executado');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('preserva escrita sem Pix e outros tipos de conteúdo', async () => {
    const { guard, next } = setup(undefined, [ordinary]);
    await expect(guard({ uid: 'api::page.page', action: 'update', params: { documentId: 'outro', data: ordinary } }, next)).resolves.toBe('executado');
    await expect(guard({ uid: 'api::unidade.unidade', action: 'create', params: { data: pix } }, next)).resolves.toBe('executado');
  });

  it('falha fechada quando a consulta do documento falha', async () => {
    const { guard, next, findMany } = setup();
    findMany.mockRejectedValueOnce(new Error('banco indisponível'));
    await expect(guard({ uid: 'api::page.page', action: 'publish', params: { documentId: 'documento' } }, next)).rejects.toThrow('banco indisponível');
    expect(next).not.toHaveBeenCalled();
  });
});
