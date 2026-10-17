import { notFound } from 'next/navigation';
import { EventoDetalhe } from '@/components/sections/AgendaEventosSection/EventoDetalhe';
import { ProximosEventosSection } from '@/components/sections/ProximosEventosSection';
import { getEventoDetalhe } from '@/lib/inchurch/eventos-cache';
import { idDoSlug, metadataDoEvento, schemaDoEvento } from '@/lib/inchurch/detalhes';

type Props = { params: Promise<{ slug: string }> };

async function carregar(slug: string) {
  const id = idDoSlug(slug);
  if (!id) notFound();
  const resultado = await getEventoDetalhe(id);
  if (resultado.estado === 'nao-encontrado') notFound();
  // Erro transitório chega ao error boundary; nunca gera uma página 404 cacheável.
  if (resultado.estado !== 'ok') throw new Error('Não foi possível carregar o evento. Tente novamente em instantes.');
  return resultado;
}

export async function generateMetadata({ params }: Props) {
  const { evento } = await carregar((await params).slug);
  return metadataDoEvento(evento);
}

export default async function EventoPage({ params }: Props) {
  const { evento, relacionados } = await carregar((await params).slug);
  const schema = schemaDoEvento(evento);
  return <>
    {schema && <script type="application/ld+json">{JSON.stringify(schema).replace(/</g, '\\u003c')}</script>}
    <EventoDetalhe evento={evento} />
    <ProximosEventosSection index={1} data={{ __component: 'sections.proximos-eventos', id: evento.id, titulo: 'Outros eventos', quantidade: 3 }} eventosExternos={relacionados} excluirId={evento.id} priorizarIgrejaId={evento.igrejaId} detalhes />
  </>;
}
