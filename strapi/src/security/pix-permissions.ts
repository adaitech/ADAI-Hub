const PAGE_UID = 'api::page.page';
const MUTATIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'clone', 'discardDraft']);

type GuardContext = { uid: string; action: string; params: unknown };
type GuardDependencies = {
  requestContext: { get(): unknown };
  db: {
    query(uid: typeof PAGE_UID): {
      findMany(params: { where: { documentId: string }; populate: string[] }): Promise<unknown[]>;
    };
  };
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function containsPix(value: unknown): boolean {
  const sections = record(value).sections;
  return Array.isArray(sections) && sections.some((section: unknown) => record(section).__component === 'sections.pix');
}

function isSuperAdmin(request: unknown): boolean {
  const state = record(record(request).state);
  if (record(record(state.auth).strategy).name !== 'admin') return false;
  const roles = record(state.user).roles;
  return Array.isArray(roles) && roles.some((role: unknown) => record(role).code === 'strapi-super-admin');
}

/** Additional restriction only: existing Strapi route/RBAC permissions still apply. */
export function createPixWriteGuard(strapi: GuardDependencies, forbidden: (message: string) => Error) {
  return async function guard<T>(context: GuardContext, next: () => Promise<T>): Promise<T> {
    if (context.uid !== PAGE_UID || !MUTATIONS.has(context.action)) return next();
    const request = strapi.requestContext.get();
    // Bootstrap and trusted backend jobs do not run in an HTTP request context.
    if (request === undefined || isSuperAdmin(request)) return next();

    const params = record(context.params);
    let protectedPage = containsPix(params.data);
    if (!protectedPage && typeof params.documentId === 'string') {
      // Query all persisted variants, without caller-controlled status/locale/filters.
      // This also catches removal of Pix and slug changes, and published-only Pix.
      const entries = await strapi.db.query(PAGE_UID).findMany({
        where: { documentId: params.documentId },
        populate: ['sections'],
      });
      protectedPage = entries.some(containsPix);
    }
    if (protectedPage) {
      throw forbidden('Somente Super Admin pode alterar páginas com a seção Pix.');
    }
    return next();
  };
}
