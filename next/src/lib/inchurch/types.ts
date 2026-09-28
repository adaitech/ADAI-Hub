/** Tipos crus da inChurch Public API (só os campos usados). Contrato: https://docs.inchurch.com.br/openapi.json */

export interface InchurchLista<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

/** `GET /v1/event/`. Datas sem fuso (horário local da igreja, America/Sao_Paulo). */
export interface InchurchEvento {
  id: number;
  name?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  active?: boolean | null;
  enabled?: boolean | null;
  /** "Mostrar no site" no painel da inChurch. */
  show_on_site?: boolean | null;
  /** Modelo de uma recorrência (as datas vêm como eventos próprios). */
  recurrence_model?: boolean | null;
  highlighted?: boolean | null;
  image?: string | null;
  image_webp?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  /** Link online do evento (ex.: Zoom aberto de oração). */
  event_url?: string | null;
  has_external_subscription?: boolean | null;
  external_subscription_url?: string | null;
}
