import type { NextConfig } from 'next';

const strapiUrl = new URL(process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337');

const nextConfig: NextConfig = {
  // O repositório tem yarn.lock na raiz (scripts de orquestração) e em next/; a raiz do app é next/.
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: strapiUrl.hostname,
        port: strapiUrl.port,
        pathname: '/uploads/**',
      },
      // Thumbnails dos vídeos da Série atual (YouTube Data API).
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
      // Artes dos eventos da inChurch (Próximos eventos).
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/media_files_prod/**' },
    ],
    // Next 16 bloqueia otimização de imagens vindas de IP local. Liberar só no ambiente local
    // (Strapi em localhost) via NEXT_IMAGE_ALLOW_LOCAL_IP=true no .env.
    dangerouslyAllowLocalIP: process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === 'true',
  },
};

export default nextConfig;
