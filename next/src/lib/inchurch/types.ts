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
  /** Campo legado da API; não participa dos critérios de exibição. */
  show_on_site?: boolean | null;
  /** Modelo de uma recorrência (as datas vêm como eventos próprios). */
  recurrence_model?: boolean | null;
  highlighted?: boolean | null;
  image?: string | null;
  image_webp?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  /** Link externo do evento (reunião, inscrição, ingressos ou página relacionada). */
  event_url?: string | null;
  has_external_subscription?: boolean | null;
  has_registrations?: boolean | null;
  external_subscription_url?: string | null;
  paid_event?: boolean | null;
  has_paid_tickets?: boolean | null;
  responsible_church?: { id: number; name?: string | null } | null;
  location?: {
    address_complement?: string | null;
    address?: string | null;
    address_number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

/** Campos administrativos usados nos detalhes. A resposta crua nunca segue para componentes. */
export interface InchurchEventoAdministrativo extends Partial<Omit<InchurchEvento, 'location'>> {
  id: number;
  location?: Omit<NonNullable<InchurchEvento['location']>, 'address_number' | 'city' | 'state' | 'country'> & {
    address_number?: string | number | null;
    city?: string | { name?: string | null } | null;
    state?: string | { name?: string | null } | null;
    country?: string | { name?: string | null } | null;
  } | null;
  is_enabled?: boolean | null;
  is_active?: boolean | null;
  is_public?: boolean | null;
  tertiarygroup?: { id: number; name?: string | null } | null;
  units?: {
    id: number;
    name?: string | null;
    related_obj?: { id: number; model?: string | null; name?: string | null } | null;
  }[] | null;
  event_schedule?: InchurchAtividade[] | null;
  event_attractions?: InchurchConvidado[] | null;
  event_images?: InchurchImagemEvento[] | null;
}

export interface InchurchImagemEvento {
  id?: number;
  image?: string | null;
  image_webp?: string | null;
  thumbnail?: string | null;
  app_image?: string | null;
  on_blacklist?: boolean | null;
}

export interface FotoEvento {
  id: number;
  imagem: string;
  miniatura: string;
}

export interface InchurchConvidado {
  id?: number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  photo?: string | null;
  url?: string | null;
}

export interface ConvidadoEvento {
  nome: string;
  cargo: string;
  biografia: string;
  foto: string | null;
  url: string | null;
}

export interface InchurchAtividade {
  id?: number;
  event_date?: string | null;
  start?: string | null;
  end?: string | null;
  title?: string | null;
  description?: string | null;
  venue?: string | null;
}

export interface ProgramacaoDia {
  data: string;
  atividades: { inicio: string; fim: string | null; titulo: string; descricao: string; local: string }[];
}
