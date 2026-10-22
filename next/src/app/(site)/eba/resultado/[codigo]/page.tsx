import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ConteudoResultado } from '@/components/eba/Questionario/Resultado';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { criarLimitador, ipDoCliente } from '@/lib/eba/limite';
import { lerLinkResultado, segredoDoResultado } from '@/lib/eba/link-resultado';
import { ebaApiConfigurada } from '@/lib/eba-api/client';
import { resultadosDoAluno, type ResultadoDoTeste } from '@/lib/eba-api/resultados';
import styles from '../resultado.module.css';

interface PageProps {
  params: Promise<{ codigo: string }>;
}

const agora = () => Date.now();

/** Aberturas por minuto e por IP, contadas antes de decifrar. Por instância do servidor, como nas ações dos testes. */
const limitarAberturas = criarLimitador(20, 60_000);

/**
 * Sem título, descrição nem canonical com o código: a URL é um segredo de quem recebeu o link.
 * `noindex`, `nofollow` e `no-referrer` (a URL não vai no `Referer` ao sair da página).
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Resultado dos testes — EBA | ADAI',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

/**
 * /eba/resultado/<codigo> — resultado salvo dos 5 testes do CDV (spec 2026-10-22, entrega 3).
 * Falha fechada: sem segredo, limite estourado, código inválido/expirado ou aluno sem resultado
 * dão o mesmo 404. Só os resultados na tela: nada de nome, e-mail, turma ou id.
 */
export default async function ResultadoEbaPage({ params }: PageProps) {
  const cabecalhos = await headers();
  const proxies = Number(process.env.EBA_PROXIES_CONFIAVEIS ?? 1);
  if (!limitarAberturas(ipDoCliente(cabecalhos.get('x-forwarded-for'), proxies), agora())) notFound();

  const segredo = segredoDoResultado();
  if (!segredo) notFound();
  const aluno = lerLinkResultado((await params).codigo, segredo, agora());
  if (!aluno) notFound();

  let resultados: ResultadoDoTeste[] | null = null;
  if (ebaApiConfigurada()) {
    try {
      resultados = await resultadosDoAluno(aluno.idStudent);
    } catch (erro) {
      // Só a classe do erro: nada de id, código, IP ou corpo da API no log.
      console.warn(`[eba-resultado] ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
    }
  }
  if (resultados && resultados.length === 0) notFound();

  return (
    <section className={styles.tela} aria-labelledby="resultado-titulo" data-section="resultado-eba">
      <div className={styles.caixa}>
        <h1 id="resultado-titulo" className={styles.titulo}>
          Seu resultado nos testes do CDV
        </h1>
        {resultados ? (
          resultados.map(({ teste, resultado }) => (
            <div key={teste.slug} className={styles.teste}>
              <h2 className={styles.nomeTeste}>{teste.nome}</h2>
              <ConteudoResultado teste={teste} resultado={resultado} />
            </div>
          ))
        ) : (
          <p className={styles.aviso} role="status">
            Resultado indisponível no momento. Tente de novo em alguns minutos.
          </p>
        )}
        <div>
          <ButtonLink href="/eba/testes" estilo="contorno">
            Ver todos os testes
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
