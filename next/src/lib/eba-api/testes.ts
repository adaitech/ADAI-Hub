/** Definição dos 5 testes do CDV como dados (ordem da apostila). Sem lógica de tela. */

export type TipoTeste = 'nota' | 'talentos' | 'estilo' | 'temperamento';

export type SlugTeste =
  'dons-servico' | 'dons-ministerio' | 'talentos-naturais' | 'estilo-pessoal' | 'temperamento-pessoal';

export interface DefinicaoTeste {
  slug: SlugTeste;
  nome: string;
  /** Identificador da pergunta na API da EBA (`GET Question/{id}`). */
  idQuestion: string;
  tipo: TipoTeste;
  /** Posição na apostila (1 a 5): "Teste N de 5" e "Próximo teste". */
  ordem: number;
}

export const TESTES: readonly DefinicaoTeste[] = [
  {
    slug: 'dons-servico',
    nome: 'Dons de serviço prático',
    idQuestion: '80cd890e-e0c2-45f2-84ac-2447185e85c3',
    tipo: 'nota',
    ordem: 1,
  },
  {
    slug: 'dons-ministerio',
    nome: 'Dons ministeriais',
    idQuestion: 'f055b0b0-c5e4-46bf-a778-93ea00c02826',
    tipo: 'nota',
    ordem: 2,
  },
  {
    slug: 'talentos-naturais',
    nome: 'Talentos naturais',
    idQuestion: '49850007-06ae-49ad-ac22-6d2527404059',
    tipo: 'talentos',
    ordem: 3,
  },
  {
    slug: 'estilo-pessoal',
    nome: 'Estilo pessoal',
    idQuestion: 'e6bb31ca-7151-4c1f-8815-7f794e0c5bb4',
    tipo: 'estilo',
    ordem: 4,
  },
  {
    slug: 'temperamento-pessoal',
    nome: 'Temperamento pessoal',
    idQuestion: '8699a220-0588-4c3f-8609-e1be453d2edd',
    tipo: 'temperamento',
    ordem: 5,
  },
];

/** Teste do slug, ou null se o slug não é um dos 5 testes. */
export function definicaoDoTeste(slug: string): DefinicaoTeste | null {
  return TESTES.find((t) => t.slug === slug) ?? null;
}

/** Teste seguinte na apostila; null no último. */
export function proximoTeste(slug: SlugTeste): DefinicaoTeste | null {
  const indice = TESTES.findIndex((t) => t.slug === slug);
  return indice >= 0 ? (TESTES[indice + 1] ?? null) : null;
}

/** Escala de 0 a 5 dos testes de dons. O nome acessível de cada opção é "N — Rótulo". */
export const ESCALA_NOTA: readonly {
  valor: 0 | 1 | 2 | 3 | 4 | 5;
  rotulo: string;
}[] = [
  { valor: 0, rotulo: 'Nunca' },
  { valor: 1, rotulo: 'Raramente' },
  { valor: 2, rotulo: 'Às vezes' },
  { valor: 3, rotulo: 'Frequentemente' },
  { valor: 4, rotulo: 'Muito' },
  { valor: 5, rotulo: 'Eu brilho nisso!' },
];

/**
 * Unidades do campo `room` do aluno. Anália Franco grava `colorado`: o valor antigo é mantido
 * para os alunos já cadastrados e o painel continuarem consistentes.
 */
export const UNIDADES: readonly { valor: string; rotulo: string }[] = [
  { valor: 'campestre', rotulo: 'Campestre' },
  { valor: 'colorado', rotulo: 'Anália Franco' },
  { valor: 'sbc', rotulo: 'São Bernardo do Campo' },
  { valor: 'santos', rotulo: 'Santos' },
  { valor: 'adai-on', rotulo: 'ADAI On' },
  { valor: 'outra-igreja', rotulo: 'Outra igreja' },
  { valor: 'visitante', rotulo: 'Visitante' },
];
