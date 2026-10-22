import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MenuEquipe } from '@/components/eba/Equipe/MenuEquipe';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { segredoDaEquipe } from '@/lib/eba/equipe/sessao';
import { sessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { sairDaEquipe } from './acoes';

/** Área restrita: nunca indexada nem no sitemap. Dados pessoais só aqui, e a resposta é dinâmica (lê o cookie), sem cache compartilhado. */
export const metadata: Metadata = {
  title: 'Área da equipe — EBA | ADAI',
  robots: { index: false, follow: false },
};

/** Sem `EBA_EQUIPE_SEGREDO` a área inteira responde 404. Com sessão, mostra o menu; sem, só a página (o login). */
export default async function EquipeLayout({ children }: { children: React.ReactNode }) {
  if (!segredoDaEquipe()) notFound();
  const sessao = await sessaoDaEquipe();
  return (
    <div className={styles.area}>
      {sessao && <MenuEquipe email={sessao.email} acoes={{ sair: sairDaEquipe }} />}
      {children}
    </div>
  );
}
