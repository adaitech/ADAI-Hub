/** Tipos do JSON cru da API da EBA (via API Management). Não renomear campos: refletem a API. */

/** Item de `GET Question/{id}` (a API devolve um array, um item por pergunta). */
export interface EbaQuestionApi {
  id: string;
  name: string;
  numberQuestion: number;
  text: string;
  imageURL: string | null;
  dateCreated: string;
  dateUpdated: string;
}

/** `GET Student/email/{email}` e retorno de `POST Student`. */
export interface EbaStudentApi {
  id: string;
  idClass: string;
  name: string;
  email: string;
  room: string;
  dateCreated?: string;
  dateUpdated?: string;
}

export interface EbaStudentNovoApi {
  name: string;
  email: string;
  room: string;
  idClass: string;
}

export interface EbaClassApi {
  id: string;
  name: string;
  codStatus: number;
  status: string;
  initialDate: string;
  endDate: string;
  dateCreated: string;
  dateUpdated: string;
}

/** `GET ClassEBA` (paginado). */
export interface EbaClassListApi {
  data: EbaClassApi[];
  pages: { totalPages: number; totalRecords: number; requestDate: string | null };
  links: { self: string | null; first: string | null; next: string | null; prev: string | null; last: string | null };
}

export interface EbaRespostaApi {
  idStudent: string;
  idClass: string;
  idQuestion: string;
  numberQuestion: number;
  rate: number;
}

/** Corpo de `POST SurveyResponse`. */
export interface EbaSurveyResponseEnvioApi {
  responseQuestionList: EbaRespostaApi[];
}

/** Item do resultado de um teste de nota/talentos/temperamento. */
export interface EbaResultadoItemApi {
  name: string;
  totalRate: number;
  message: string;
}

/** Resultado do teste de estilo pessoal. */
export interface EbaResultadoEstiloApi {
  message: string;
}

/** Corpo de erro da API: `Erros[0].Code` identifica o motivo. */
export interface EbaErroApi {
  Erros?: { Code?: string; Message?: string }[];
}
