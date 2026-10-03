/**
 * Padrão de cabeçalhos e CORS do CMS (docs/seguranca/README.md → "Cabeçalhos, CSP e CORS").
 * - Sem `strapi::poweredBy`: não anunciar a tecnologia.
 * - CORS fechado: o padrão do Strapi (qualquer origem + credenciais) devolvia a origem de quem pedia,
 *   liberando qualquer site. O site lê a API pelo servidor (sem CORS) e o painel é da mesma origem.
 */
export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      // CSP do painel: a padrão do Strapi (já estrita; o frame-src do preview vem de admin.ts).
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      // Lista separada por vírgula. Sem ela, só o site (CLIENT_URL).
      origin: env.array('CORS_ORIGINS', [env('CLIENT_URL', 'http://localhost:3000')]),
      methods: ['GET', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Accept'],
      credentials: false,
      maxAge: 600,
    },
  },
  'global::permissions-policy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
