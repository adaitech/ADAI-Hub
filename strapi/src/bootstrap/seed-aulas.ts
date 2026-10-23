/**
 * Aulas em vídeo do DNA e do Reset (área da equipe da EBA, entrega 4). Conteúdo do site atual
 * (`adaitech/eba-adai`, `utils/content/platform/aulas-dna.ts` e `aulas-reset.ts`): 17 aulas do DNA e 8 do Reset,
 * vídeos no Vimeo (não listados, com hash). Sem imports de `@strapi/*`: o typecheck do Next lê este arquivo.
 *
 * O tipo `aula` **não é público**: o Next lê com `STRAPI_API_TOKEN` (só servidor), para o endereço dos vídeos
 * não sair pela API aberta do Strapi.
 */

/** Documento devolvido pela Document Service (só o que o seed lê). */
type DocumentoSeed = { documentId: string } | null;

interface ColecaoDeAulas {
  findFirst(params: { filters: { curso: string; endereco: string } }): Promise<DocumentoSeed>;
  create(params: { data: never }): Promise<DocumentoSeed>;
  update(params: { documentId: string; data: never }): Promise<DocumentoSeed>;
  publish(params: { documentId: string }): Promise<unknown>;
}

/** O pedaço do Strapi que o seed das aulas usa. */
export interface StrapiSeedAulas {
  documents(uid: 'api::aula.aula'): ColecaoDeAulas;
  log: { info(mensagem: string): void };
}

/** Upload (ou reaproveitamento) de uma imagem de `strapi/seed/`; devolve o id da mídia. */
export type ImagemDeAula = (strapi: StrapiSeedAulas, arquivo: string, alt: string) => Promise<number>;

export interface AulaSeed {
  curso: 'dna' | 'reset';
  /** Parte final do endereço: `/eba/equipe/aulas/<curso>/<endereco>`. */
  endereco: string;
  ordem: number;
  titulo: string;
  autor: string;
  cargo_autor: string;
  descricao: string;
  video_url: string;
  /** Arquivo em `strapi/seed/` com a foto do autor. */
  foto: string;
}

const TEXTO_ALTERNATIVO: Record<string, string> = {
  'eba/avatar-adai.webp': 'Logo da ADAI.',
  'eba/avatar-rodrigo-soeiro.webp': 'Foto do Pr. Rodrigo Soeiro.',
  'eba/avatar-tati-soeiro.webp': 'Foto da Pra. Tati Soeiro.',
};

export const AULAS_EBA: AulaSeed[] = [
  {
    curso: 'dna',
    endereco: 'boas-vindas',
    ordem: 1,
    titulo: 'Boas Vindas',
    autor: 'Pr. Rodrigo Soeiro e Pra. Tati Soeiro',
    cargo_autor: 'Pastores Líderes',
    descricao: 'Boas Vindas ao curso DNA da ADAI',
    video_url: 'https://player.vimeo.com/video/1047669656?h=aa973e5d4e&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-adai.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-01',
    ordem: 2,
    titulo: '01 - Fundamentos, Visão e Pilares',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 01 - Fundamentos, Visão e Pilares',
    video_url: 'https://player.vimeo.com/video/1047669729?h=5de9c9b90c&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-02',
    ordem: 3,
    titulo: '02 - Job',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 02 - Job',
    video_url: 'https://player.vimeo.com/video/1047669910?h=87f7d427a2&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-03',
    ordem: 4,
    titulo: '03 - Arrependimento e Santificação',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 03 - Arrependimento e Santificação',
    video_url: 'https://player.vimeo.com/video/1047670099?h=60b034cb2f&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-04',
    ordem: 5,
    titulo: '04 - Vivendo Cheio do Espírito Santo',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 04 - Vivendo Cheio do Espírito Santo',
    video_url: 'https://player.vimeo.com/video/1047670257?h=3cdef02635&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-05',
    ordem: 6,
    titulo: '05 - Família',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 05 - Família',
    video_url: 'https://player.vimeo.com/video/1047670431?h=9a0ba726b9&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-06',
    ordem: 7,
    titulo: '06 - Discipulado',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 06 - Discipulado',
    video_url: 'https://player.vimeo.com/video/1047670595?h=3de85e5c49&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-07',
    ordem: 8,
    titulo: '07 - O Dizimista e o Ofertante',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 07 - O Dizimista e o Ofertante',
    video_url: 'https://player.vimeo.com/video/1047670813?h=55b3609b8f&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-08',
    ordem: 9,
    titulo: '08 - Escatologia',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 08 - Escatologia',
    video_url: 'https://player.vimeo.com/video/1047671007?h=2bab077c81&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-09',
    ordem: 10,
    titulo: '09 - 5C\'s',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 09 - 5C\'s',
    video_url: 'https://player.vimeo.com/video/1047671178?h=b7a08688a1&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-10',
    ordem: 11,
    titulo: '10 - Os Dons de Serviço e a Igreja',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 10 - Os Dons de Serviço e a Igreja',
    video_url: 'https://player.vimeo.com/video/1047671318?h=7c2c4fdc16&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-11',
    ordem: 12,
    titulo: '11 - Os Dons de Governo',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 11 - Os Dons de Governo',
    video_url: 'https://player.vimeo.com/video/1047671512?h=8f3b5bae3a&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-12',
    ordem: 13,
    titulo: '12 - Talentos Naturais',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 12 - Talentos Naturais',
    video_url: 'https://player.vimeo.com/video/1047671686?h=443e200ff5&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-13',
    ordem: 14,
    titulo: '13 - Motivação',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 13 - Motivação',
    video_url: 'https://player.vimeo.com/video/1047671928?h=6cce89a70b&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-14',
    ordem: 15,
    titulo: '14 - Descobrindo Seu Estilo Pessoal',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 14 - Descobrindo Seu Estilo Pessoal',
    video_url: 'https://player.vimeo.com/video/1047672376?h=ac1bc8afb5&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-15',
    ordem: 16,
    titulo: '15 - Compreendendo o Temperamento Pessoal',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 15 - Compreendendo o Temperamento Pessoal',
    video_url: 'https://player.vimeo.com/video/1047672563?h=9e67cab413&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'dna',
    endereco: 'aula-16',
    ordem: 17,
    titulo: '16 - Qual é a Sua Missão',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 16 - Qual é a Sua Missão',
    video_url: 'https://player.vimeo.com/video/1047672723?h=c495addb65&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'boas-vindas',
    ordem: 1,
    titulo: 'Boas Vindas',
    autor: 'Pr. Rodrigo Soeiro e Pra. Tati Soeiro',
    cargo_autor: 'Pastores Líderes',
    descricao: 'Boas Vindas ao curso Reset da ADAI',
    video_url: 'https://player.vimeo.com/video/1048012876?h=5dd1ad522a&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-adai.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-01',
    ordem: 2,
    titulo: '01 - Reconhecendo a Jesus Como Senhor',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 01 - Reconhecendo a Jesus Como Senhor',
    video_url: 'https://player.vimeo.com/video/1048012899?h=4512d5ec28&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-02',
    ordem: 3,
    titulo: '02 - Identidade- Quem Sou Eu',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 02 - Identidade- Quem Sou Eu',
    video_url: 'https://player.vimeo.com/video/1048013053?h=7c6495c18a&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-03',
    ordem: 4,
    titulo: '03 - Tentação, o Pecado e o Vício',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 03 - Tentação, o Pecado e o Vício',
    video_url: 'https://player.vimeo.com/video/1048013169?h=c337f631cf&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-04',
    ordem: 5,
    titulo: '04 - Jugo Desigual',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 04 - Jugo Desigual',
    video_url: 'https://player.vimeo.com/video/1048013319?h=5934713249&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-05',
    ordem: 6,
    titulo: '05 - Justificação e Regeneração',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 05 - Justificação e Regeneração',
    video_url: 'https://player.vimeo.com/video/1048013444?h=7ff28dbe37&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-06',
    ordem: 7,
    titulo: '06 - Batismo',
    autor: 'Pra. Tati Soeiro',
    cargo_autor: 'Pastora Líder',
    descricao: 'Aula 06 - Batismo',
    video_url: 'https://player.vimeo.com/video/1048013777?h=110594ebef&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-tati-soeiro.webp',
  },
  {
    curso: 'reset',
    endereco: 'aula-07',
    ordem: 8,
    titulo: '07 - Ceia do Senhor',
    autor: 'Pr. Rodrigo Soeiro',
    cargo_autor: 'Pastor Líder',
    descricao: 'Aula 07 - Ceia do Senhor',
    video_url: 'https://player.vimeo.com/video/1048013925?h=9c9a9ec172&badge=0&autopause=0&player_id=0&app_id=58479',
    foto: 'eba/avatar-rodrigo-soeiro.webp',
  },
];

/** Cria ou atualiza (na subida de versão do seed) as aulas e publica. Idempotente por curso + endereço. */
export async function ensureAulas(strapi: StrapiSeedAulas, reconstruir: boolean, imagem: ImagemDeAula): Promise<void> {
  const aulas = strapi.documents('api::aula.aula');
  for (const { foto, ...dados } of AULAS_EBA) {
    const existente = await aulas.findFirst({ filters: { curso: dados.curso, endereco: dados.endereco } });
    if (existente && !reconstruir) continue;
    const foto_autor = await imagem(strapi, foto, TEXTO_ALTERNATIVO[foto] ?? '');
    const data = { ...dados, foto_autor } as never;
    const doc = existente ? await aulas.update({ documentId: existente.documentId, data }) : await aulas.create({ data });
    const documentId = existente?.documentId ?? doc?.documentId;
    if (!documentId) continue;
    await aulas.publish({ documentId });
    strapi.log.info(`[seed] Aula ${dados.curso}/${dados.endereco} ${existente ? 'reconstruída' : 'criada'} e publicada.`);
  }
}
