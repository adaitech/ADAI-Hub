/**
 * Limitador de tentativas em memória (janela deslizante por chave, ex.: IP).
 * Devolve `true` quando a tentativa é permitida. Tentativas negadas não contam.
 * Por instância do servidor: é uma proteção básica, não um limite global.
 */
export function criarLimitador(
  max: number,
  janelaMs: number,
  maxChaves = 10_000,
): (chave: string, agora: number) => boolean {
  const tentativas = new Map<string, number[]>();

  return (chave, agora) => {
    const vigentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < janelaMs);

    if (vigentes.length >= max) {
      tentativas.set(chave, vigentes);
      return false;
    }

    vigentes.push(agora);
    // reinsere para a chave ativa ir ao fim; a mais antiga fica no começo do Map
    tentativas.delete(chave);
    tentativas.set(chave, vigentes);

    if (tentativas.size > maxChaves) {
      const maisAntiga = tentativas.keys().next().value;
      if (maisAntiga !== undefined) tentativas.delete(maisAntiga);
    }
    return true;
  };
}

/**
 * IP do cliente para a chave do limitador, a partir do `x-forwarded-for`. Lê da direita para a
 * esquerda: cada proxy confiável (ingress, Front Door…) acrescenta um item no fim, e o que vem antes
 * deles pode ter sido escrito pelo próprio cliente. Com `proxiesConfiaveis` = 1 (padrão), usa o último
 * item. Isso vale tanto se o proxy substitui o cabeçalho quanto se ele acrescenta.
 */
export function ipDoCliente(xff: string | null | undefined, proxiesConfiaveis: number): string {
  const itens = (xff ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (itens.length === 0) return 'local';
  const saltos = Number.isInteger(proxiesConfiaveis) && proxiesConfiaveis >= 1 ? proxiesConfiaveis : 1;
  return itens[Math.max(itens.length - saltos, 0)];
}

/** Proxies confiáveis na frente do Next (`EBA_PROXIES_CONFIAVEIS`, padrão 1: o ingress). Valor inválido → 1. */
export function proxiesConfiaveis(env: NodeJS.ProcessEnv = process.env): number {
  const bruto = env.EBA_PROXIES_CONFIAVEIS;
  const valor = bruto === undefined || bruto.trim() === '' ? 1 : Number(bruto);
  return Number.isInteger(valor) && valor >= 1 ? valor : 1;
}

let avisouProxies = false;
let avisouSemIp = false;

/** Só para os testes: o aviso é uma vez por processo. */
export function reiniciarAvisosDoLimite(): void {
  avisouProxies = false;
  avisouSemIp = false;
}

/**
 * Chave do limite por IP a partir do `x-forwarded-for`, com `EBA_PROXIES_CONFIAVEIS`. Em produção, avisa
 * uma vez (sem IP nem dado pessoal) quando a configuração provavelmente está errada: variável ausente
 * (atrás de Front Door + ingress, o valor certo é 2; com 1 todos os visitantes dividiriam o IP do Front
 * Door) ou sem `x-forwarded-for` (todos cairiam na mesma chave).
 */
export function ipParaLimite(xff: string | null | undefined): string {
  const producao = process.env.NODE_ENV === 'production';
  if (producao && process.env.EBA_PROXIES_CONFIAVEIS === undefined && !avisouProxies) {
    avisouProxies = true;
    console.warn('[eba-limite] EBA_PROXIES_CONFIAVEIS ausente: usando 1 proxy confiável (confira o valor atrás de Front Door + ingress)');
  }
  if (producao && !xff && !avisouSemIp) {
    avisouSemIp = true;
    console.warn('[eba-limite] requisição sem x-forwarded-for: o limite por IP vira uma chave única para todos');
  }
  return ipDoCliente(xff, proxiesConfiaveis());
}
