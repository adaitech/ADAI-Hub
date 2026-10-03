# Specs e planos (método superpowers)

Artefatos do método de trabalho do projeto — [`.agents/rules/Metodo-Superpowers.md`](../../.agents/rules/Metodo-Superpowers.md). Ficam versionados para que qualquer dev ou agente de IA continue de onde o outro parou.

| Pasta | O que vai | Gerado por | Nome |
| --- | --- | --- | --- |
| `specs/` | Desenho aprovado de um trabalho *architectural* (objetivo, restrições, abordagem escolhida, componentes, dados, erros, testes) | skill `brainstorming` | `AAAA-MM-DD-<tema>-design.md` |
| `plans/` | Plano de implementação em tarefas pequenas, com arquivos, testes e verificação de cada uma | skill `writing-plans` | `AAAA-MM-DD-<tema>.md` |

As pastas são criadas quando o primeiro arquivo for salvo.

Regras:

- Escrever em **português**.
- Spec só é implementada depois de **aprovada pelo usuário**; plano só é executado depois de **revisado**.
- Trabalho *bounded* (mudança pequena em código que já existe) não precisa de spec nem de plano: o desenho curto fica no chat e na descrição do PR.
- Todo plano inclui os testes exigidos em [`Testes.md`](../../.agents/rules/Testes.md) §2 e termina no checklist [`Pull-Request.md`](../../.agents/rules/Pull-Request.md).
