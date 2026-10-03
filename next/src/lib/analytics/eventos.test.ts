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
});
