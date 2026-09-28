import type { StrapiBotao, StrapiLink } from '@/lib/strapi/types';
import type { ControleAlternar, ControleOpcoes } from './types';

/** Helpers de controles reaproveitados pelas seções que têm botão (`shared.botao`) e link (`shared.link`). */

export type Acao = 'botao_link' | 'botao' | 'link' | 'nenhuma';

export const OPCOES_ACAO: ControleOpcoes<unknown>['opcoes'] = [
  { valor: 'botao_link', rotulo: 'Botão + link' },
  { valor: 'botao', rotulo: 'Só botão' },
  { valor: 'link', rotulo: 'Só link' },
  { valor: 'nenhuma', rotulo: 'Nenhuma' },
];

export const OPCOES_ESTILO_BOTAO: ControleOpcoes<unknown>['opcoes'] = [
  { valor: 'solido', rotulo: 'Sólido' },
  { valor: 'contorno', rotulo: 'Contorno' },
];

interface ComAcao {
  botao?: StrapiBotao | null;
  link?: StrapiLink | null;
}

export const BOTAO_EXEMPLO: StrapiBotao = { id: 9001, texto: 'Quero participar', url: '/contato', estilo: 'solido', nova_aba: false };
export const LINK_EXEMPLO: StrapiLink = { id: 9002, texto: 'Saiba mais', url: '/contato', nova_aba: false };

export function acaoDe(item: ComAcao | undefined): Acao {
  if (item?.botao && item.link) return 'botao_link';
  if (item?.botao) return 'botao';
  if (item?.link) return 'link';
  return 'nenhuma';
}

/** Mantém o botão/link que já existe; cria um de exemplo quando a ação pede e ele não existe. */
export function comAcao<T extends ComAcao>(item: T, acao: string): T {
  const querBotao = acao === 'botao_link' || acao === 'botao';
  const querLink = acao === 'botao_link' || acao === 'link';
  return {
    ...item,
    botao: querBotao ? (item.botao ?? BOTAO_EXEMPLO) : null,
    link: querLink ? (item.link ?? LINK_EXEMPLO) : null,
  };
}

export function comEstiloBotao<T extends ComAcao>(item: T, estilo: string): T {
  return item.botao ? { ...item, botao: { ...item.botao, estilo: estilo === 'contorno' ? 'contorno' : 'solido' } } : item;
}

/** Controle liga/desliga de um campo opcional: desligado = `null`; ligado = valor original ou o de exemplo. */
export function alternarCampo<TData, K extends keyof TData>(
  campo: K,
  rotulo: string,
  exemplo: TData[K],
  ajuda?: string,
): ControleAlternar<TData> {
  const vazio = (valor: unknown) => valor == null || valor === '' || (Array.isArray(valor) && valor.length === 0);
  return {
    id: String(campo),
    tipo: 'alternar',
    rotulo,
    ajuda,
    valor: (data) => !vazio(data[campo]),
    aplicar: (data, ligado) => ({ ...data, [campo]: ligado ? (vazio(data[campo]) ? exemplo : data[campo]) : null }),
  };
}
