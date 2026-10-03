/**
 * Permissions-Policy do CMS: mesmo padrão do site (next/src/lib/seguranca/cabecalhos.ts).
 * O helmet do `strapi::security` não envia este cabeçalho. Ver docs/seguranca/README.md.
 */
const PERMISSOES_DESLIGADAS = ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'serial', 'hid', 'midi', 'display-capture', 'browsing-topics'];
const VALOR = PERMISSOES_DESLIGADAS.map((recurso) => `${recurso}=()`).join(', ');

export default () => async (ctx, next) => {
  await next();
  ctx.set('Permissions-Policy', VALOR);
};
