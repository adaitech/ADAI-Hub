import type { Core } from '@strapi/strapi';

/** Tarefas agendadas do Strapi (`config/server.ts` → `cron`). */
export default {
  /** Todo dia às 3h: apaga as verificações de e-mail da EBA com mais de 24 h (são só hashes temporários). */
  apagarVerificacoesEba: {
    task: async ({ strapi }: { strapi: Core.Strapi }) => {
      await strapi.service('api::verificacao-eba.verificacao-eba').apagarAntigas(new Date(Date.now() - 86_400_000));
    },
    options: { rule: '0 3 * * *' },
  },
};
