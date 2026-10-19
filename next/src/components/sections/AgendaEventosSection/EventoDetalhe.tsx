import Image from 'next/image';
import { HeroSection } from '@/components/sections/HeroSection';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SmartLink } from '@/components/ui/SmartLink';
import { TextLink } from '@/components/ui/TextLink';
import type { EventoDetalhe as Evento } from '@/lib/inchurch/detalhes';
import { eventoEncerrado, partesDaDescricao } from '@/lib/inchurch/detalhes';
import styles from './EventoDetalhe.module.css';
import { GaleriaEvento } from './GaleriaEvento';

const data = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long' }).format(new Date(iso));
const hora = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const horarioLocal = (horario: string) => horario.replace(':', 'h').replace(/h00$/, 'h');
const diaProgramacao = (dia: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'long' }).format(new Date(`${dia}T12:00:00Z`));

/** Detalhes vindos exclusivamente da inChurch; não é uma seção editorial do CMS. */
export function EventoDetalhe({ evento }: { evento: Evento }) {
  const inicio = evento.ocorrencias[0].inicio;
  const encerrado = eventoEncerrado(evento);
  const itens = [
    ['Data', evento.fim && data(evento.fim) !== data(inicio) ? `${data(inicio)} a ${data(evento.fim)}` : data(inicio)],
    ['Horário', evento.fim ? `${hora(inicio)} às ${hora(evento.fim)}` : hora(inicio)],
    ['Unidade', evento.unidade],
  ].filter(([, valor]) => valor);
  return (
    <>
      <HeroSection index={0} somenteImagem data={{ __component: 'sections.hero', id: evento.id, imagem: evento.imagem ? { ...evento.imagem, id: evento.id, alternativeText: '' } : null }} />
      <section className={styles.conteudo} aria-labelledby="evento-titulo" data-section="evento-detalhe" data-evento={evento.nome} data-evento-id={evento.id} data-unidade={evento.unidade ?? ''} data-local={evento.localizacao?.linhas.join(', ') ?? ''}>
        <div className={styles.principal}>
          <nav aria-label="Breadcrumb"><ol className={styles.breadcrumb} role="list"><li><SmartLink href="/agenda">Agenda</SmartLink></li><li aria-current="page">{evento.nome}</li></ol></nav>
          <h1 id="evento-titulo" className={styles.titulo}>{evento.nome}</h1>
          {encerrado && <div className={styles.aviso}><p>Este evento já aconteceu.</p><SmartLink href="/agenda">Confira os próximos eventos na Agenda</SmartLink></div>}
          {evento.descricaoCompleta && <div className={styles.descricao}>{evento.descricaoCompleta.split(/\n\s*\n/).map((paragrafo, i) => <p key={i}>{partesDaDescricao(paragrafo).map((parte, j) => parte.url ? <SmartLink key={j} href={parte.url} novaAba>{parte.texto}</SmartLink> : parte.texto)}</p>)}</div>}
        </div>
        <aside className={styles.informacoes} aria-label="Informações do evento">
          <dl className={styles.lista}>
            {itens.map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}
            {evento.localizacao && <div><dt>Local</dt><dd className={styles.local}>
              {evento.localizacao.linhas.map((linha, i) => <span key={i}>{linha}</span>)}
              <SmartLink href={evento.localizacao.urlMapa} novaAba>Ver no Google Maps</SmartLink>
            </dd></div>}
          </dl>
          {!encerrado && evento.cta && <div data-acao-evento="acessar"><ButtonLink href={evento.cta.url} novaAba>{evento.cta.texto}</ButtonLink></div>}
        </aside>
      </section>
      {evento.programacao.length > 0 && <section className={styles.programacao} aria-labelledby="evento-programacao-titulo" data-section="programacao-evento">
        <div className={styles.programacaoConteudo}>
          <h2 id="evento-programacao-titulo" className={styles.titulo}>Programação</h2>
          <p className={styles.subtitulo}>A sequência do dia, horário por horário</p>
          {evento.programacao.map((dia) => {
            const variosDias = evento.programacao.length > 1;
            const TituloAtividade = variosDias ? 'h4' : 'h3';
            return <div key={dia.data} className={styles.dia}>
              {variosDias && <h3 className={styles.tituloDia}>{diaProgramacao(dia.data)}</h3>}
              <ol role="list" className={styles.atividades}>
                {dia.atividades.map((atividade, i) => <li key={`${atividade.inicio}-${i}`} className={styles.atividade}>
                  <p className={styles.horario}><time dateTime={atividade.inicio}>{horarioLocal(atividade.inicio)}</time>{atividade.fim && <> às <time dateTime={atividade.fim}>{horarioLocal(atividade.fim)}</time></>}</p>
                  <div className={styles.atividadeConteudo}>
                    <TituloAtividade className={styles.atividadeTitulo}>{atividade.titulo}</TituloAtividade>
                    {atividade.descricao && <p className={styles.atividadeDescricao}>{partesDaDescricao(atividade.descricao).map((parte, j) => parte.url ? <SmartLink key={j} href={parte.url} novaAba>{parte.texto}</SmartLink> : parte.texto)}</p>}
                    {atividade.local && <p className={styles.atividadeDescricao}>Local: {atividade.local}</p>}
                  </div>
                </li>)}
              </ol>
            </div>;
          })}
        </div>
      </section>}
      {evento.convidados.length > 0 && <section className={styles.convidados} aria-labelledby="evento-convidados-titulo" data-section="convidados-evento">
        <h2 id="evento-convidados-titulo" className={styles.titulo}>Convidados</h2>
        <ul role="list" className={styles.convidadosLista}>
          {evento.convidados.map((convidado, i) => <li key={`${convidado.nome}-${i}`} className={styles.convidado}>
            {convidado.foto
              ? <Image className={styles.avatar} src={convidado.foto} alt={`Foto de ${convidado.nome}`} width={96} height={96} unoptimized />
              : <span className={styles.avatar} aria-hidden="true">{convidado.nome.split(/\s+/).filter(Boolean).filter((_, index, partes) => index === 0 || index === partes.length - 1).map((parte) => Array.from(parte)[0]).join('').toLocaleUpperCase('pt-BR')}</span>}
            <div className={styles.convidadoConteudo}>
              <h3 className={styles.tituloDia}>{convidado.nome}</h3>
              {convidado.cargo && <p className={styles.cargo}>{convidado.cargo}</p>}
              {convidado.biografia && <div className={styles.biografia}>{convidado.biografia.split(/\n\s*\n/).map((paragrafo, j) => <p key={j}>{partesDaDescricao(paragrafo).map((parte, k) => parte.url ? <SmartLink key={k} href={parte.url} novaAba>{parte.texto}</SmartLink> : parte.texto)}</p>)}</div>}
              {convidado.url && <TextLink href={convidado.url} novaAba>Saiba mais sobre {convidado.nome}</TextLink>}
            </div>
          </li>)}
        </ul>
      </section>}
      <GaleriaEvento imagens={evento.galeria} nomeEvento={evento.nome} />
    </>
  );
}
