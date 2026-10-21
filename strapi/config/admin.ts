export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: [env('CLIENT_URL')],
      async handler(uid, { documentId, status }) {
        // Páginas e cursos da EBA têm pré-visualização; o Next decide o endereço pelo tipo.
        if (uid !== 'api::page.page' && uid !== 'api::curso.curso') return null;

        const document = await strapi.documents(uid).findOne({ documentId, fields: ['slug'] });
        const params = new URLSearchParams({
          secret: env('PREVIEW_SECRET'),
          slug: document?.slug ?? 'home',
          status,
          ...(uid === 'api::curso.curso' ? { tipo: 'curso' } : {}),
        });
        return `${env('CLIENT_URL')}/api/preview?${params}`;
      },
    },
  },
});
