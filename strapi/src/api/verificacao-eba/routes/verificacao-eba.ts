/**
 * verificacao-eba routes: só as duas rotas próprias (sem o CRUD padrão). Autenticação padrão do Strapi:
 * o servidor do Hub usa um API token "Custom" com permissão só em emitir, conferir e cancelar.
 */
export default {
  type: 'content-api',
  routes: [
    { method: 'POST', path: '/verificacoes-eba/emitir', handler: 'api::verificacao-eba.verificacao-eba.emitir', config: { policies: [] } },
    { method: 'POST', path: '/verificacoes-eba/conferir', handler: 'api::verificacao-eba.verificacao-eba.conferir', config: { policies: [] } },
    { method: 'POST', path: '/verificacoes-eba/cancelar', handler: 'api::verificacao-eba.verificacao-eba.cancelar', config: { policies: [] } },
  ],
};
