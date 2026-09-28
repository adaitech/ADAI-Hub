import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Chamado pelo botão "Pré-visualizar" do Strapi (config/admin.ts). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug') ?? 'home';
  const status = searchParams.get('status');

  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) {
    return new Response('Token inválido', { status: 401 });
  }
  if (!SLUG_PATTERN.test(slug)) {
    return new Response('Slug inválido', { status: 400 });
  }

  const draft = await draftMode();
  if (status === 'draft') draft.enable();
  else draft.disable();

  redirect(slug === 'home' ? '/' : `/${slug}`);
}
