export interface ConfiguracaoSeo {
  /** Só o site oficial vai para o Google. */
  indexavel: boolean;
  /** Origem do site (sem barra final), ou null se não configurada. */
  url: string | null;
}

/**
 * Se este ambiente pode ser indexado. Exige `SITE_INDEXAVEL=true` **e** `NEXT_PUBLIC_SITE_URL`
 * válida: na dúvida (homologação, dev, variável esquecida), fica fora do Google.
 * As duas são lidas no build — trocar exige rebuild.
 */
export function configuracaoSeo(
  ambiente: Readonly<Record<string, string | undefined>> = process.env,
): ConfiguracaoSeo {
  let url: string | null = null;
  try {
    const endereco = new URL(ambiente.NEXT_PUBLIC_SITE_URL?.trim() ?? '');
    if (/^https?:$/.test(endereco.protocol)) url = endereco.origin;
  } catch {
    url = null;
  }
  const ligado = ambiente.SITE_INDEXAVEL?.trim().toLowerCase() === 'true';
  return { indexavel: ligado && url !== null, url };
}
