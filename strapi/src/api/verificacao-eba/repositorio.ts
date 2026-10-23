import type { Core } from '@strapi/strapi';
import type { RegistroVerificacao, RepositorioVerificacao } from './regras';
import { MAX_TENTATIVAS } from './regras';

const UID = 'api::verificacao-eba.verificacao-eba';
const TABELA = 'verificacoes_eba';

type Linha = { id: number; codigo_hash: string; expira_em: number | string | Date; tentativas: number; usado: number | boolean };

const registro = (l: Linha): RegistroVerificacao => ({
  id: l.id,
  codigoHash: l.codigo_hash,
  expiraEm: new Date(l.expira_em),
  tentativas: Number(l.tentativas),
  usado: Boolean(l.usado),
});

/**
 * Banco do `verificacao-eba`. Criação pelo Document Service (preenche `document_id` e datas do Strapi);
 * leitura e atualização por knex, com a soma de tentativas e o uso em um único `UPDATE … WHERE`
 * (duas conferências simultâneas não passam do limite nem abrem duas sessões). O knex converte `Date`
 * e booleanos para o SQLite (ms e 0/1), igual ao que o Strapi grava.
 */
export function criarRepositorio(strapi: Core.Strapi): RepositorioVerificacao {
  const db = () => strapi.db.connection(TABELA);

  return {
    async contarEmissoesDesde(emailHash, desde) {
      const [{ total }] = await db().where({ email_hash: emailHash }).andWhere('criado_em', '>', desde).count({ total: '*' });
      return Number(total);
    },
    async invalidarAbertas(emailHash) {
      await db().where({ email_hash: emailHash, usado: false }).update({ usado: true });
    },
    async criar({ emailHash, codigoHash, expiraEm, criadoEm }) {
      await strapi.documents(UID).create({
        data: { email_hash: emailHash, codigo_hash: codigoHash, expira_em: expiraEm, criado_em: criadoEm, tentativas: 0, usado: false } as never,
      });
    },
    async somarTentativa(emailHash, agora) {
      const aberta = await db()
        .where({ email_hash: emailHash, usado: false })
        .andWhere('expira_em', '>', agora)
        .orderBy('id', 'desc')
        .first<Linha | undefined>();
      if (!aberta) return null;
      // UPDATE … RETURNING: o registro volta já somado, sem reler a linha (uma segunda leitura veria a soma de outra tentativa simultânea).
      const somadas = (await db()
        .where({ id: aberta.id, usado: false })
        .andWhere('tentativas', '<', MAX_TENTATIVAS)
        .increment('tentativas', 1)
        .returning(['id', 'codigo_hash', 'expira_em', 'tentativas', 'usado'])) as unknown as Linha[];
      return somadas.length === 1 ? registro(somadas[0]) : null;
    },
    async ehCodigoAntigo(emailHash, codigoHash) {
      const linha = await db().where({ email_hash: emailHash, codigo_hash: codigoHash, usado: true }).first('id');
      return Boolean(linha);
    },
    async ultima(emailHash) {
      const linha = await db().where({ email_hash: emailHash }).orderBy('id', 'desc').first<Linha | undefined>();
      return linha ? registro(linha) : null;
    },
    async marcarUsado(id) {
      return Number(await db().where({ id, usado: false }).update({ usado: true })) === 1;
    },
    async apagarEmitida(emailHash, codigoHash) {
      return Number(await db().where({ email_hash: emailHash, codigo_hash: codigoHash, usado: false, tentativas: 0 }).delete()) === 1;
    },
    async apagarAntesDe(data) {
      return Number(await db().where('criado_em', '<', data).delete());
    },
  };
}
