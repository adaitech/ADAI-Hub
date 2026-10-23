import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NOMES_EVENTOS } from './eventos';

const repoRoot = join(process.cwd(), '..');

describe('catálogo de eventos × GTM × plano de medição', () => {
  it('nomes válidos no GA4 (snake_case, até 40 caracteres) e sem repetição', () => {
    for (const nome of NOMES_EVENTOS) expect(nome).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
    expect(new Set(NOMES_EVENTOS).size).toBe(NOMES_EVENTOS.length);
  });

  it('o gatilho do container importável do GTM cobre exatamente o catálogo', () => {
    const json = JSON.parse(readFileSync(join(repoRoot, 'docs/analytics/gtm-container-adai.json'), 'utf8'));
    const regex: string = json.containerVersion.trigger[0].customEventFilter[0].parameter[1].value;
    expect(regex).toBe(`^(${NOMES_EVENTOS.join('|')})$`);
  });

  it('todo evento está documentado no plano de medição', () => {
    const plano = readFileSync(join(repoRoot, 'docs/analytics/README.md'), 'utf8');
    for (const nome of NOMES_EVENTOS) expect(plano).toContain(`\`${nome}\``);
  });
  it('os eventos dos testes do CDV estão no contrato, no gatilho e na tabela', () => {
    expect(NOMES_EVENTOS).toEqual(expect.arrayContaining(['iniciar_teste', 'concluir_teste']));
    const json = JSON.parse(readFileSync(join(repoRoot, 'docs/analytics/gtm-container-adai.json'), 'utf8'));
    const regex: string = json.containerVersion.trigger[0].customEventFilter[0].parameter[1].value;
    expect(regex).toContain('iniciar_teste');
    expect(regex).toContain('concluir_teste');
    const variavel = json.containerVersion.variable.find((v: { name: string }) => v.name === 'DLV - teste');
    expect(variavel).toBeDefined();
    expect(variavel.parameter.find((p: { key: string }) => p.key === 'name').value).toBe('teste');
    const tag = json.containerVersion.tag.find((t: { type: string }) => t.type === 'gaawe');
    expect(JSON.stringify(tag)).toContain('{{DLV - teste}}');
    const plano = readFileSync(join(repoRoot, 'docs/analytics/README.md'), 'utf8');
    expect(plano).toMatch(/\| `iniciar_teste` \|/);
    expect(plano).toMatch(/\| `concluir_teste` \|.*\*\*Sim\*\*/);
  });

  it('confirmar_codigo (código por e-mail dos testes) está no contrato, no gatilho, na tabela e leva o resultado ao GA4', () => {
    expect(NOMES_EVENTOS).toContain('confirmar_codigo');
    const json = JSON.parse(readFileSync(join(repoRoot, 'docs/analytics/gtm-container-adai.json'), 'utf8'));
    const variavel = json.containerVersion.variable.find((v: { name: string }) => v.name === 'DLV - resultado');
    expect(variavel).toBeDefined();
    expect(variavel.parameter.find((p: { key: string }) => p.key === 'name').value).toBe('resultado');
    const tag = json.containerVersion.tag.find((t: { type: string }) => t.type === 'gaawe');
    expect(JSON.stringify(tag)).toContain('{{DLV - resultado}}');
    const plano = readFileSync(join(repoRoot, 'docs/analytics/README.md'), 'utf8');
    expect(plano).toMatch(/\| `confirmar_codigo` \|.*`resultado`/);
  });
});
