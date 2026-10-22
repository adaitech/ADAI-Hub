/**
 * Regras do tipo privado `verificacao-eba` do Strapi (strapi/src/api/verificacao-eba/regras.ts) com um
 * repositório em memória: emitir (limite de 3 em 15 min, invalida os anteriores) e conferir (5 tentativas,
 * 10 min, uso único).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  cancelar,
  conferir,
  emitir,
  MAX_TENTATIVAS,
  type RegistroVerificacao,
  type RepositorioVerificacao,
} from '../../../../strapi/src/api/verificacao-eba/regras';

type Linha = RegistroVerificacao & { emailHash: string; criadoEm: Date };

function repoEmMemoria() {
  const linhas: Linha[] = [];
  const aberta = (emailHash: string) => linhas.filter((l) => l.emailHash === emailHash && !l.usado).at(-1);
  const repo: RepositorioVerificacao = {
    async contarEmissoesDesde(emailHash, desde) {
      return linhas.filter((l) => l.emailHash === emailHash && l.criadoEm > desde).length;
    },
    async invalidarAbertas(emailHash) {
      for (const l of linhas) if (l.emailHash === emailHash) l.usado = true;
    },
    async criar({ emailHash, codigoHash, expiraEm, criadoEm }) {
      linhas.push({ id: linhas.length + 1, emailHash, codigoHash, expiraEm, criadoEm, tentativas: 0, usado: false });
    },
    async somarTentativa(emailHash, agora) {
      const l = aberta(emailHash);
      if (!l || l.expiraEm <= agora || l.tentativas >= MAX_TENTATIVAS) return null;
      l.tentativas += 1;
      return { ...l };
    },
    async ehCodigoAntigo(emailHash, codigoHash) {
      return linhas.some((l) => l.emailHash === emailHash && l.codigoHash === codigoHash && l.usado);
    },
    async ultima(emailHash) {
      const l = linhas.filter((x) => x.emailHash === emailHash).at(-1);
      return l ? { ...l } : null;
    },
    async marcarUsado(id) {
      const l = linhas.find((x) => x.id === id);
      if (!l || l.usado) return false;
      l.usado = true;
      return true;
    },
    async apagarEmitida(emailHash, codigoHash) {
      const i = linhas.findIndex((l) => l.emailHash === emailHash && l.codigoHash === codigoHash && !l.usado && l.tentativas === 0);
      if (i < 0) return false;
      linhas.splice(i, 1);
      return true;
    },
    async apagarAntesDe(data) {
      const antes = linhas.length;
      for (let i = linhas.length - 1; i >= 0; i--) if (linhas[i].criadoEm < data) linhas.splice(i, 1);
      return antes - linhas.length;
    },
  };
  return { repo, linhas };
}

const T0 = new Date('2026-10-21T12:00:00Z');
const min = (n: number) => new Date(T0.getTime() + n * 60_000);
const emissao = (codigoHash = 'c1', agora = T0) => ({ emailHash: 'e1', codigoHash, expiraEm: new Date(agora.getTime() + 600_000) });
const tentar = (repo: RepositorioVerificacao, codigoHash: string, agora: Date) => conferir(repo, { emailHash: 'e1', codigoHash }, agora);

describe('verificacao-eba: emitir', () => {
  it('no máximo 3 emissões por e-mail em 15 min; a 4ª é "limite" e não cria nada', async () => {
    const { repo, linhas } = repoEmMemoria();
    for (let i = 0; i < 3; i++) expect(await emitir(repo, emissao(`c${i}`), min(i))).toBe('emitido');
    expect(await emitir(repo, emissao('c4'), min(3))).toBe('limite');
    expect(linhas).toHaveLength(3);
    expect(await emitir(repo, emissao('c5', min(15)), min(15))).toBe('emitido');
  });

  it('emitir um novo invalida o anterior: o código antigo responde "vencido" (não vale mais)', async () => {
    const { repo } = repoEmMemoria();
    await emitir(repo, emissao('c1'), T0);
    await emitir(repo, emissao('c2', min(1)), min(1));
    expect(await tentar(repo, 'c1', min(2))).toEqual({ resultado: 'vencido', restantes: 0 });
    expect(await tentar(repo, 'c2', min(2))).toEqual({ resultado: 'ok', restantes: 3 });
  });
});

describe('verificacao-eba: conferir', () => {
  it('código certo vale uma vez só (uso único)', async () => {
    const { repo } = repoEmMemoria();
    await emitir(repo, emissao(), T0);
    expect(await tentar(repo, 'c1', min(1))).toEqual({ resultado: 'ok', restantes: 4 });
    expect(await tentar(repo, 'c1', min(2))).toEqual({ resultado: 'vencido', restantes: 0 });
  });

  it('código errado desconta; na 5ª errada fica sem tentativas e o certo vira "esgotado"', async () => {
    const { repo } = repoEmMemoria();
    await emitir(repo, emissao(), T0);
    const restantes = [];
    for (let i = 0; i < 5; i++) {
      const r = await tentar(repo, 'errado', min(1));
      expect(r.resultado).toBe('errado');
      restantes.push(r.restantes);
    }
    expect(restantes).toEqual([4, 3, 2, 1, 0]);
    expect(await tentar(repo, 'c1', min(2))).toEqual({ resultado: 'esgotado', restantes: 0 });
  });

  it('vencido depois de 10 min', async () => {
    const { repo } = repoEmMemoria();
    await emitir(repo, emissao(), T0);
    expect(await tentar(repo, 'c1', min(10))).toEqual({ resultado: 'vencido', restantes: 0 });
  });

  it('sem verificação nenhuma → vencido', async () => {
    const { repo } = repoEmMemoria();
    expect(await tentar(repo, 'c1', T0)).toEqual({ resultado: 'vencido', restantes: 0 });
  });

  it('dois acertos ao mesmo tempo: só um abre (marcarUsado decide)', async () => {
    const { repo } = repoEmMemoria();
    await emitir(repo, emissao(), T0);
    const [a, b] = await Promise.all([tentar(repo, 'c1', min(1)), tentar(repo, 'c1', min(1))]);
    expect([a.resultado, b.resultado].sort()).toEqual(['ok', 'vencido']);
  });
});

describe('verificacao-eba: tipo privado', () => {
  const raiz = join(process.cwd(), '..');
  const ler = (arquivo: string) => readFileSync(join(raiz, arquivo), 'utf8');

  it('regras.ts não importa pacotes do Strapi (o CI do Next não instala o Strapi)', () => {
    expect(ler('strapi/src/api/verificacao-eba/regras.ts')).not.toMatch(/from ['"]@strapi\//);
  });

  it('fora das permissões públicas e oculto no painel', () => {
    expect(ler('strapi/src/bootstrap/public-permissions.ts')).not.toContain('verificacao-eba');
    const schema = JSON.parse(ler('strapi/src/api/verificacao-eba/content-types/verificacao-eba/schema.json'));
    expect(schema.pluginOptions['content-manager'].visible).toBe(false);
    expect(schema.options.draftAndPublish).toBe(false);
  });

  it('as rotas exigem autenticação (nenhuma com auth: false)', () => {
    expect(ler('strapi/src/api/verificacao-eba/routes/verificacao-eba.ts')).not.toMatch(/auth:\s*false/);
  });
});

describe('verificacao-eba: cancelar (o e-mail do código não saiu)', () => {
  it('apaga a emissão e devolve a cota: depois de 3 envios que falharam, ainda dá para emitir', async () => {
    const { repo, linhas } = repoEmMemoria();
    for (let i = 0; i < 3; i++) {
      expect(await emitir(repo, emissao(`c${i}`), min(i))).toBe('emitido');
      expect(await cancelar(repo, { emailHash: 'e1', codigoHash: `c${i}` })).toBe(true);
    }
    expect(linhas).toHaveLength(0);
    expect(await emitir(repo, emissao('c9'), min(4))).toBe('emitido');
  });

  it('não cancela código já usado, com tentativa registrada, de outro e-mail ou inexistente', async () => {
    const { repo, linhas } = repoEmMemoria();
    await emitir(repo, emissao('c1'), T0);
    await tentar(repo, 'errado', min(1));
    expect(await cancelar(repo, { emailHash: 'e1', codigoHash: 'c1' })).toBe(false);
    expect(await cancelar(repo, { emailHash: 'outro', codigoHash: 'c1' })).toBe(false);
    expect(await cancelar(repo, { emailHash: 'e1', codigoHash: 'nao-existe' })).toBe(false);
    expect(linhas).toHaveLength(1);
  });
});
