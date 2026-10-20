import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { applyEditorGuides } from './bootstrap/editor-guide';
import { ensurePublicPermissions } from './bootstrap/public-permissions';
import { seedInitialContent } from './bootstrap/seed';
import { createPixWriteGuard } from './security/pix-permissions';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(createPixWriteGuard(strapi, (message) => new errors.ForbiddenError(message)));
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await applyEditorGuides(strapi);
    await ensurePublicPermissions(strapi);
    await seedInitialContent(strapi);
  },
};
