import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import styles from './PreviewBanner.module.css';

async function sairDoRascunho() {
  'use server';
  const draft = await draftMode();
  draft.disable();
  redirect('/');
}

/** Aviso visível quando o editor abre a pré-visualização de rascunho do Strapi. */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <aside role="status" className={styles.banner}>
      <span>Você está vendo o rascunho (ainda não publicado).</span>
      <form action={sairDoRascunho}>
        <button type="submit" className={styles.botao}>
          Sair da pré-visualização
        </button>
      </form>
    </aside>
  );
}
