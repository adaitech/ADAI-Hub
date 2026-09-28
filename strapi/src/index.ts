import type { Core } from '@strapi/strapi';
import { applyEditorGuides } from './bootstrap/editor-guide';
import { ensurePublicPermissions } from './bootstrap/public-permissions';
import { seedInitialContent } from './bootstrap/seed';

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await applyEditorGuides(strapi);
    await ensurePublicPermissions(strapi);
    await seedInitialContent(strapi);
  },
};
