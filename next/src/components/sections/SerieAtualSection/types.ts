import type { SerieYoutube } from '@/lib/youtube/serie';

/**
 * JSON cru de `sections.serie-atual`. Só configuração editorial: o conteúdo (vídeos, temas,
 * pregadores, datas) vem do YouTube e nunca é cadastrado no Strapi.
 */
export interface SerieAtualData {
  __component: 'sections.serie-atual';
  id: number;
  /** Padrão true. */
  exibir?: boolean | null;
  /** Muda só o título exibido; não interfere em qual série é escolhida. */
  titulo_personalizado?: string | null;
  /** URL de playlist do YouTube. Vazio = série mais recente do canal. */
  playlist_url?: string | null;
}

export interface SerieAtualConfig {
  exibir: boolean;
  tituloPersonalizado: string | null;
  /** ID extraído de `playlist_url`, ou null (automático). */
  playlistId: string | null;
  /** `playlist_url` preenchida mas impossível de ler: o site segue no automático e avisa no log. */
  playlistUrlInvalida: boolean;
}

/** Exemplo da vitrine: configuração do Strapi + resultado normalizado do YouTube + "hoje". */
export interface SerieAtualExemplo {
  strapi: SerieAtualData;
  youtube: SerieYoutube;
  /** ISO do instante simulado (define "Culto de hoje" e as partes futuras). */
  agora: string;
}
