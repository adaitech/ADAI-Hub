import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Questionario, type QuestionarioProps } from '@/components/eba/Questionario';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import { schemaDaTrilha } from '@/lib/eba/dados-estruturados';
import { segredoDoResultado } from '@/lib/eba/link-resultado';
import { segredoDaSessao } from '@/lib/eba/sessao';
import { TIMEOUT_PAGINA_MS } from '@/lib/eba-api/client';
import { emailConfigurado } from '@/lib/email/mailersend';
import { verificacaoConfigurada } from '@/lib/strapi/verificacao';
import { perguntasDoTeste, type Pergunta } from '@/lib/eba-api/perguntas';
import { definicaoDoTeste, usaPerguntasDaApi, type DefinicaoTeste } from '@/lib/eba-api/testes';
import { buildMetadata } from '@/lib/metadata';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getTesteBySlug } from '@/lib/strapi/queries/testes';
import { aquecer, cadastrar, carregarPerguntas, confirmarCodigo, enviar, pedirCodigo, retomarCadastro, sair, sessaoAtual } from './acoes';
import estilosEba from '../../eba.module.css';
import styles from './page.module.css';

/**
 * Tempo máximo do segmento, em segundos; as Server Actions da página herdam. Com a API fria, as
 * ações esperam até 45 s (envio: 60 s): sem folga, a hospedagem poderia encerrar a função antes e,
 * no envio, a nova tentativa gravaria em dobro.
 */
export const maxDuration = 120;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Sem o teste no Strapi, a tela abre só com o nome (lista local) e esta orientação. */
const RESUMO_PADRAO = 'Responda com sinceridade, pensando em como você é hoje.';

const caminhoDoTeste = (slug: string) => `/eba/testes/${slug}`;

/**
 * Slug fora dos 5 testes → 404 sem chamar o Strapi nem a API. Abertura = tipo `teste` do Strapi
 * (o nome do Strapi vale no h1); sem o teste lá, nome local e resumo padrão. Erro do Strapi → lança (error.tsx).
 */
async function carregar(segmento: string): Promise<{ teste: DefinicaoTeste; abertura: QuestionarioProps['abertura'] }> {
  const definicao = definicaoDoTeste(segmento);
  if (!definicao) notFound();
  const doStrapi = await getTesteBySlug(definicao.slug);
  if (!doStrapi) {
    return { teste: definicao, abertura: { resumo: RESUMO_PADRAO, perguntas: null, resposta: null, comoResponder: null, aula: null } };
  }
  const { nome, resumo, perguntas, resposta, comoResponder, aula } = doStrapi;
  return { teste: { ...definicao, nome }, abertura: { resumo, perguntas, resposta, comoResponder, aula } };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teste, abertura } = await carregar((await params).slug);
  const global = await getGlobal();
  // Tela de ação, não de conteúdo: noindex, nofollow (e fora do sitemap).
  return buildMetadata(
    { id: 0, metaTitle: `${teste.nome} — Testes da EBA | ADAI`, metaDescription: abertura.resumo, metaRobots: 'noindex, nofollow' },
    global?.seo,
    caminhoDoTeste(teste.slug),
  );
}

/**
 * API ou APIM fora ao abrir (ou fria: o banco pausa e a 1ª chamada passa dos 10 s): a abertura
 * aparece e "Começar" busca de novo pela ação `carregarPerguntas` (nunca 404). A página não espera
 * mais que `TIMEOUT_PAGINA_MS`. Estilo e temperamento não usam perguntas da API: nem buscam.
 */
async function buscarPerguntas(teste: DefinicaoTeste): Promise<{ perguntas: Pergunta[]; indisponiveis: boolean }> {
  if (!usaPerguntasDaApi(teste)) return { perguntas: [], indisponiveis: false };
  try {
    return { perguntas: await perguntasDoTeste(teste.slug, { timeoutMs: TIMEOUT_PAGINA_MS }), indisponiveis: false };
  } catch (erro) {
    // Só a classe do erro: nada de URL, chave ou dado do aluno no log.
    console.warn(`[eba-testes] perguntas de ${teste.slug}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
    return { perguntas: [], indisponiveis: true };
  }
}

/** Nomes das variáveis de servidor que impedem os testes (ausentes, ou segredo da sessão curto demais). */
function variaveisFaltando(): string[] {
  const faltando: string[] = [];
  if (!process.env.EBA_API_URL?.trim()) faltando.push('EBA_API_URL');
  if (!process.env.EBA_API_KEY?.trim()) faltando.push('EBA_API_KEY');
  if (segredoDaSessao() === null) faltando.push('EBA_SESSAO_SEGREDO (ausente ou com menos de 32 caracteres)');
  if (!emailConfigurado()) faltando.push('MAILERSEND_API_TOKEN');
  if (!verificacaoConfigurada()) faltando.push('STRAPI_TOKEN_VERIFICACAO');
  return faltando;
}

/**
 * /eba/testes/<slug> — tela de um dos 5 testes do CDV. Dinâmica (lê o cookie de sessão).
 * Perguntas buscadas no servidor e entregues prontas à ilha do Questionário.
 * Sem variáveis da API ou sem segredo da sessão: "Testes indisponíveis no momento", sem o questionário.
 */
export default async function TesteEbaPage({ params }: PageProps) {
  const { teste, abertura } = await carregar((await params).slug);
  const trilha: TrilhaItem[] = [
    { texto: 'ADAI', href: '/' },
    { texto: 'EBA', href: '/eba' },
    { texto: 'Testes', href: '/eba/testes' },
    { texto: teste.nome },
  ];
  // Sem o envio do código (MailerSend) ou sem o token das verificações, ninguém consegue se identificar.
  const faltando = variaveisFaltando();
  const disponivel = faltando.length === 0;
  // Só os nomes das variáveis, nunca valores: é o que permite achar o ambiente mal configurado.
  if (!disponivel) console.warn(`[eba-testes] indisponível, configuração ausente ou inválida: ${faltando.join(', ')}`);

  let tela;
  if (!disponivel) {
    tela = (
      <section className={styles.tela} aria-labelledby="teste-indisponivel" data-section="teste-eba">
        <div className={styles.caixa}>
          <h1 id="teste-indisponivel" className={styles.nome}>
            {teste.nome}
          </h1>
          <p className={styles.corpo}>{abertura.resumo}</p>
          <p className={styles.aviso} role="status">
            Testes indisponíveis no momento
          </p>
          <div>
            <ButtonLink href="/eba/testes" estilo="contorno">
              Ver todos os testes
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  } else {
    const [{ perguntas, indisponiveis }, sessao] = await Promise.all([buscarPerguntas(teste), sessaoAtual()]);
    tela = (
      <Questionario
        teste={teste}
        abertura={abertura}
        perguntas={perguntas}
        perguntasIndisponiveis={indisponiveis}
        linkResultado={segredoDoResultado() !== null}
        sessao={sessao}
        acoes={{ pedirCodigo, confirmarCodigo, retomarCadastro, cadastrar, enviar, sair, carregarPerguntas, aquecer }}
      />
    );
  }

  return (
    <>
      <script type="application/ld+json">{jsonLdSeguro(schemaDaTrilha(trilha, origemDoSite()))}</script>
      <div className={estilosEba.trilha}>
        <Trilha itens={trilha} />
      </div>
      {tela}
    </>
  );
}
