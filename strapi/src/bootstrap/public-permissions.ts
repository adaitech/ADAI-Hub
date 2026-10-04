import type { Core } from '@strapi/strapi';

/** Conteúdo publicado do site é público: o Next lê page, global e unidades sem token. */
const PUBLIC_ACTIONS = [
  'api::page.page.find',
  'api::page.page.findOne',
  'api::global.global.find',
  'api::unidade.unidade.find',
  'api::unidade.unidade.findOne',
];

export async function ensurePublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .db.query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[permissions] Papel "public" não encontrado.');
    return;
  }

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi
      .db.query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });

    if (!existing) {
      await strapi
        .db.query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } });
      strapi.log.info(`[permissions] Leitura pública liberada: ${action}`);
    }
  }
}
