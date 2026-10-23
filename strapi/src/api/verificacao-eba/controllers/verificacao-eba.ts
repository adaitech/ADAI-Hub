/**
 * verificacao-eba controller: só `emitir`, `conferir` e `cancelar`, chamados pelo servidor do Hub com um API token
 * "Custom" (nada público). Recebe e devolve só hashes: o Strapi nunca vê o e-mail nem o código.
 */
import type { Core } from '@strapi/strapi';

const UID = 'api::verificacao-eba.verificacao-eba';

type Corpo = Record<string, unknown>;

const hash = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 100;

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async emitir(ctx) {
    const { emailHash, codigoHash, expiraEm } = (ctx.request.body ?? {}) as Corpo;
    const validade = typeof expiraEm === 'string' ? new Date(expiraEm) : null;
    if (!hash(emailHash) || !hash(codigoHash) || !validade || Number.isNaN(validade.getTime())) return ctx.badRequest();
    const resultado = await strapi.service(UID).emitir({ emailHash, codigoHash, expiraEm: validade });
    ctx.status = resultado === 'limite' ? 429 : 201;
    ctx.body = {};
  },

  async conferir(ctx) {
    const { emailHash, codigoHash } = (ctx.request.body ?? {}) as Corpo;
    if (!hash(emailHash) || !hash(codigoHash)) return ctx.badRequest();
    ctx.body = await strapi.service(UID).conferir({ emailHash, codigoHash });
  },

  async cancelar(ctx) {
    const { emailHash, codigoHash } = (ctx.request.body ?? {}) as Corpo;
    if (!hash(emailHash) || !hash(codigoHash)) return ctx.badRequest();
    await strapi.service(UID).cancelar({ emailHash, codigoHash });
    // Sempre 204: não revela se a emissão existia.
    ctx.status = 204;
  },
});
