import { notFound } from 'next/navigation';
import { getShowcase } from '@/lib/showcase/catalog';
import { aplicarControles, lerValores } from '@/lib/showcase/controles';
import { PreviewHeight } from '../../_vitrine/PreviewHeight';

interface PreviewProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Renderiza só o componente (sem cabeçalho da vitrine), para o iframe de largura 375/768/1440.
 * `?variante=` escolhe o exemplo; os demais parâmetros são os controles (`&cor=azul&foto=0`).
 */
export default async function PreviewPage({ params, searchParams }: PreviewProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const entry = getShowcase(slug);
  const nomeVariante = Array.isArray(query.variante) ? query.variante[0] : query.variante;
  const variante = entry?.variantes.find((v) => v.nome === nomeVariante) ?? entry?.variantes[0];
  if (!entry || !variante) notFound();

  const dados = aplicarControles(entry, variante.data, lerValores(entry, query));

  return (
    <main id="conteudo" style={{ background: entry.fundo === 'escuro' ? 'var(--color-bg-inverse)' : undefined }}>
      <h1 className="visually-hidden">
        Pré-visualização: {entry.nome} — {variante.titulo}
      </h1>
      {entry.render(dados)}
      <PreviewHeight dados={dados} />
    </main>
  );
}
