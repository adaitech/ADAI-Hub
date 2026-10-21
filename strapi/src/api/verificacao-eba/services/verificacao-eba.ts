/**
 * verificacao-eba service: liga as regras (regras.ts) ao banco (repositorio.ts).
 */
import type { Core } from '@strapi/strapi';
import { conferir, emitir } from '../regras';
import { criarRepositorio } from '../repositorio';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  emitir(dados: { emailHash: string; codigoHash: string; expiraEm: Date }) {
    return emitir(criarRepositorio(strapi), dados, new Date());
  },
  conferir(dados: { emailHash: string; codigoHash: string }) {
    return conferir(criarRepositorio(strapi), dados, new Date());
  },
  apagarAntigas(antesDe: Date) {
    return criarRepositorio(strapi).apagarAntesDe(antesDe);
  },
});
