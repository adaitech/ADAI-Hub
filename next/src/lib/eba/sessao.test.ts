import { createHmac } from 'node:crypto';

import {
  assinarSessao,
  COOKIE_SESSAO,
  donoDaSessao,
  lerSessao,
  mascararEmail,
  OPCOES_COOKIE,
  segredoDaSessao,
  TAMANHO_MINIMO_SEGREDO,
  VALIDADE_SESSAO_MS,
  type SessaoAluno,
} from './sessao';

const SEGREDO = 'segredo-de-teste-com-no-minimo-32-caracteres';
const AGORA = 1_800_000_000_000;
const sessao: SessaoAluno = {
  idStudent: 'aluno-1',
  idClass: 'turma-1',
  emailMascarado: 'a***@email.com',
  emitidoEm: AGORA,
};

function trocarUltimoCaractere(valor: string): string {
  const ultimo = valor.slice(-1);
  return valor.slice(0, -1) + (ultimo === 'A' ? 'B' : 'A');
}

describe('constantes', () => {
  it('usa o nome do cookie e a validade de 2 h', () => {
    expect(COOKIE_SESSAO).toBe('eba_sessao');
    expect(VALIDADE_SESSAO_MS).toBe(7_200_000);
  });
});

describe('mascararEmail', () => {
  it('mantém a primeira letra e o domínio', () => {
    expect(mascararEmail('ana@email.com')).toBe('a***@email.com');
  });

  it('funciona com usuário de 1 letra', () => {
    expect(mascararEmail('a@email.com')).toBe('a***@email.com');
  });
});

describe('assinarSessao / lerSessao', () => {
  it('assina e lê a mesma sessão', () => {
    const valor = assinarSessao(sessao, SEGREDO);
    expect(valor.split('.')).toHaveLength(2);
    expect(lerSessao(valor, SEGREDO, AGORA + 1000)).toEqual(sessao);
  });

  it('rejeita um caractere trocado no payload', () => {
    const [payload, assinatura] = assinarSessao(sessao, SEGREDO).split('.');
    expect(lerSessao(`${trocarUltimoCaractere(payload)}.${assinatura}`, SEGREDO, AGORA)).toBeNull();
  });

  it('rejeita um caractere trocado na assinatura', () => {
    const [payload, assinatura] = assinarSessao(sessao, SEGREDO).split('.');
    expect(lerSessao(`${payload}.${trocarUltimoCaractere(assinatura)}`, SEGREDO, AGORA)).toBeNull();
  });

  it('rejeita segredo diferente', () => {
    const valor = assinarSessao(sessao, SEGREDO);
    expect(lerSessao(valor, `${SEGREDO}-outro`, AGORA)).toBeNull();
  });

  it('aceita exatamente 2 h e rejeita depois disso', () => {
    const valor = assinarSessao(sessao, SEGREDO);
    expect(lerSessao(valor, SEGREDO, AGORA + 7_200_000)).toEqual(sessao);
    expect(lerSessao(valor, SEGREDO, AGORA + 7_200_001)).toBeNull();
  });

  it('rejeita emissão no futuro além de 60 s e tolera até 60 s', () => {
    const valor = assinarSessao(sessao, SEGREDO);
    expect(lerSessao(valor, SEGREDO, AGORA - 60_000)).toEqual(sessao);
    expect(lerSessao(valor, SEGREDO, AGORA - 60_001)).toBeNull();
  });

  it('assinatura com tamanho diferente devolve null sem lançar', () => {
    const [payload] = assinarSessao(sessao, SEGREDO).split('.');
    expect(() => lerSessao(`${payload}.abc`, SEGREDO, AGORA)).not.toThrow();
    expect(lerSessao(`${payload}.abc`, SEGREDO, AGORA)).toBeNull();
    expect(lerSessao(`${payload}.`, SEGREDO, AGORA)).toBeNull();
  });

  it.each([
    ['indefinido', undefined],
    ['vazio', ''],
    ['sem ponto', 'semponto'],
    ['três segmentos', 'a.b.c'],
    ['base64 inválido', '@@@.@@@'],
  ])('entrada malformada (%s) devolve null', (_nome, valor) => {
    expect(() => lerSessao(valor, SEGREDO, AGORA)).not.toThrow();
    expect(lerSessao(valor, SEGREDO, AGORA)).toBeNull();
  });

  it('devolve null para JSON inválido, campos ausentes ou tipos errados mesmo com assinatura válida', () => {
    const fabricar = (conteudo: string) => {
      const payload = Buffer.from(conteudo).toString('base64url');
      const assinatura = createHmac('sha256', SEGREDO).update(payload).digest('base64url');
      return `${payload}.${assinatura}`;
    };
    expect(lerSessao(fabricar('nao-e-json'), SEGREDO, AGORA)).toBeNull();
    expect(lerSessao(fabricar('null'), SEGREDO, AGORA)).toBeNull();
    expect(lerSessao(fabricar(JSON.stringify({ idStudent: 'x' })), SEGREDO, AGORA)).toBeNull();
    expect(
      lerSessao(fabricar(JSON.stringify({ ...sessao, emitidoEm: 'agora' })), SEGREDO, AGORA),
    ).toBeNull();
    expect(
      lerSessao(fabricar(JSON.stringify({ ...sessao, idClass: 7 })), SEGREDO, AGORA),
    ).toBeNull();
  });
});

describe('segredo mínimo', () => {
  const curto = 'x'.repeat(31);

  it('exige 32 caracteres ou mais', () => {
    expect(TAMANHO_MINIMO_SEGREDO).toBe(32);
  });

  it.each([['vazio', ''], ['31 caracteres', curto]])(
    'segredo %s: assinar lança sem vazar o segredo e ler devolve null',
    (_nome, segredo) => {
      expect(() => assinarSessao(sessao, segredo)).toThrow('segredo da sessão ausente ou curto');
      const payload = Buffer.from(JSON.stringify(sessao)).toString('base64url');
      const forjado = `${payload}.${createHmac('sha256', segredo).update(payload).digest('base64url')}`;
      expect(lerSessao(forjado, segredo, AGORA)).toBeNull();
    },
  );

  it('segredo de 32 caracteres funciona', () => {
    const segredo = 'x'.repeat(32);
    expect(lerSessao(assinarSessao(sessao, segredo), segredo, AGORA)).toEqual(sessao);
  });
});

describe('forma da sessão lida', () => {
  const fabricar = (obj: unknown) => {
    const payload = Buffer.from(JSON.stringify(obj)).toString('base64url');
    return `${payload}.${createHmac('sha256', SEGREDO).update(payload).digest('base64url')}`;
  };

  it('não devolve propriedades extras', () => {
    const lida = lerSessao(fabricar({ ...sessao, extra: 'x' }), SEGREDO, AGORA);
    expect(lida).toEqual(sessao);
    expect(lida).not.toHaveProperty('extra');
  });

  it('rejeita idStudent ou idClass vazios', () => {
    expect(lerSessao(fabricar({ ...sessao, idStudent: '' }), SEGREDO, AGORA)).toBeNull();
    expect(lerSessao(fabricar({ ...sessao, idClass: '' }), SEGREDO, AGORA)).toBeNull();
  });
});

describe('OPCOES_COOKIE', () => {
  it('é de sessão (sem maxAge nem expires) e restrita ao caminho dos testes', () => {
    expect(OPCOES_COOKIE).not.toHaveProperty('maxAge');
    expect(OPCOES_COOKIE).not.toHaveProperty('expires');
    expect(OPCOES_COOKIE.httpOnly).toBe(true);
    expect(OPCOES_COOKIE.sameSite).toBe('lax');
    expect(OPCOES_COOKIE.path).toBe('/eba/testes');
    expect(typeof OPCOES_COOKIE.secure).toBe('boolean');
  });
});

describe('segredoDaSessao', () => {
  const original = process.env.EBA_SESSAO_SEGREDO;
  afterAll(() => {
    process.env.EBA_SESSAO_SEGREDO = original;
  });

  it('devolve EBA_SESSAO_SEGREDO com 32+ caracteres; ausente ou curto → null', () => {
    process.env.EBA_SESSAO_SEGREDO = SEGREDO;
    expect(segredoDaSessao()).toBe(SEGREDO);
    process.env.EBA_SESSAO_SEGREDO = 'x'.repeat(TAMANHO_MINIMO_SEGREDO - 1);
    expect(segredoDaSessao()).toBeNull();
    delete process.env.EBA_SESSAO_SEGREDO;
    expect(segredoDaSessao()).toBeNull();
  });
});

describe('donoDaSessao', () => {
  const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

  it('é estável para o mesmo aluno e diferente entre alunos com a mesma máscara de e-mail', () => {
    expect(donoDaSessao('aluno-1', SEGREDO)).toBe(donoDaSessao('aluno-1', SEGREDO));
    expect(donoDaSessao('aluno-1', SEGREDO)).not.toBe(donoDaSessao('aluno-2', SEGREDO));
  });

  it('não revela o idStudent e depende do segredo', () => {
    const dono = donoDaSessao('aluno-1', SEGREDO);
    expect(dono).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(dono).not.toContain('aluno');
    expect(donoDaSessao('aluno-1', `${SEGREDO}-outro`)).not.toBe(dono);
  });
});
