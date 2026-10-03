/**
 * Recebe os relatórios de violação da CSP (`report-uri` e `report-to` em `lib/seguranca/cabecalhos.ts`)
 * e os registra no log do servidor. Rota pública (o navegador do visitante envia): corpo limitado,
 * só os campos úteis e sem query string (pode ter dado pessoal); sempre 204 para não dar pistas.
 */
const TIPOS_ACEITOS = ['application/csp-report', 'application/reports+json', 'application/json'];
const LIMITE_BYTES = 64 * 1024;
const LIMITE_RELATORIOS = 10;

type Dados = Record<string, unknown>;

const cortar = (valor: unknown, limite: number) => (typeof valor === 'string' ? valor.slice(0, limite) : undefined);

/** URL sem query/fragmento; valores como "inline" e "eval" passam como estão. */
function semQuery(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  try {
    const url = new URL(valor);
    return cortar(`${url.origin}${url.pathname}`, 200);
  } catch {
    return cortar(valor, 200);
  }
}

/** Normaliza o formato antigo (`csp-report`, kebab-case) e o novo (Reporting API, camelCase). */
function resumir(corpo: Dados) {
  return {
    pagina: semQuery(corpo['document-uri'] ?? corpo.documentURL),
    bloqueado: semQuery(corpo['blocked-uri'] ?? corpo.blockedURL),
    diretiva: cortar(corpo['effective-directive'] ?? corpo.effectiveDirective ?? corpo['violated-directive'], 100),
    modo: cortar(corpo.disposition, 20),
  };
}

const ehObjeto = (valor: unknown): valor is Dados => typeof valor === 'object' && valor !== null && !Array.isArray(valor);

function extrair(json: unknown): Dados[] {
  if (Array.isArray(json)) {
    return json.filter((r): r is Dados => ehObjeto(r) && r.type === 'csp-violation' && ehObjeto(r.body)).map((r) => r.body as Dados);
  }
  return ehObjeto(json) && ehObjeto(json['csp-report']) ? [json['csp-report']] : [];
}

/** Lê o corpo até o limite; `null` se passar (não guarda corpo gigante na memória). */
async function lerLimitado(request: Request): Promise<string | null> {
  if (Number(request.headers.get('content-length') ?? 0) > LIMITE_BYTES) return null;
  if (!request.body) return '';
  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > LIMITE_BYTES) {
      await leitor.cancel();
      return null;
    }
    partes.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(partes));
}

export async function POST(request: Request) {
  const tipo = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  if (!TIPOS_ACEITOS.includes(tipo)) return new Response(null, { status: 415 });

  const texto = await lerLimitado(request);
  if (texto === null) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return new Response(null, { status: 204 });
  }

  for (const relatorio of extrair(json).slice(0, LIMITE_RELATORIOS)) {
    console.warn('[csp] violação', JSON.stringify(resumir(relatorio)));
  }
  return new Response(null, { status: 204 });
}
