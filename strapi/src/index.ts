import type { Core } from '@strapi/strapi';
import { applyEditorGuides } from './bootstrap/editor-guide';
import { ensurePublicPermissions } from './bootstrap/public-permissions';
import { seedInitialContent } from './bootstrap/seed';
import { createPixWriteGuard } from './security/pix-permissions';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(createPixWriteGuard(strapi));
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await applyEditorGuides(strapi);
    await ensurePublicPermissions(strapi);
    await seedInitialContent(strapi);
  },
};
