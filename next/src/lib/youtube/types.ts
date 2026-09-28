/** Tipos crus da YouTube Data API v3 (só os campos que a integração usa). */

export interface YoutubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export type YoutubeThumbnails = Partial<Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', YoutubeThumbnail>>;

export interface YoutubeListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number; resultsPerPage?: number };
}

export interface YoutubeChannel {
  id: string;
  snippet?: { title?: string };
}

export interface YoutubePlaylist {
  id: string;
  snippet?: { title?: string; publishedAt?: string; thumbnails?: YoutubeThumbnails };
  contentDetails?: { itemCount?: number };
}

export interface YoutubePlaylistItem {
  id: string;
  snippet?: {
    title?: string;
    position?: number;
    publishedAt?: string;
    thumbnails?: YoutubeThumbnails;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  status?: { privacyStatus?: string };
}

export interface YoutubeVideo {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: YoutubeThumbnails;
    /** `live` = transmitindo agora; `upcoming` = agendada; `none` = vídeo normal ou live encerrada. */
    liveBroadcastContent?: 'live' | 'upcoming' | 'none';
  };
  status?: { privacyStatus?: string; embeddable?: boolean; uploadStatus?: string };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
  };
}
