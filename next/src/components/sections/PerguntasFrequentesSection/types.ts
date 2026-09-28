/** JSON cru de `items.pergunta-frequente`. */
export interface PerguntaFrequenteData {
  id: number;
  pergunta?: string | null;
  resposta?: string | null;
}

/** JSON cru de `sections.perguntas-frequentes`. */
export interface PerguntasFrequentesData {
  __component: 'sections.perguntas-frequentes';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  perguntas?: PerguntaFrequenteData[] | null;
}

export interface PerguntasFrequentesView {
  titulo: string;
  textoApoio: string | null;
  perguntas: { id: number; pergunta: string; resposta: string }[];
}
