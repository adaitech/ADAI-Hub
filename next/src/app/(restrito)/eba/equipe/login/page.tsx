import { redirect } from 'next/navigation';
import { FormLoginEquipe } from '@/components/eba/Equipe/FormLoginEquipe';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { sessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { entrarNaEquipe } from '../acoes';

interface PageProps {
  searchParams: Promise<{ motivo?: string }>;
}

/** /eba/equipe/login — quem já tem sessão vai direto às consultas. `?motivo=sessao` avisa que a sessão terminou. */
export default async function LoginEquipePage({ searchParams }: PageProps) {
  if (await sessaoDaEquipe()) redirect('/eba/equipe/consultas');
  const { motivo } = await searchParams;
  return (
    <section className={styles.caixa} aria-labelledby="login-equipe-titulo" data-section="equipe-login">
      <h1 id="login-equipe-titulo" className={styles.titulo}>
        Entrar na área da equipe
      </h1>
      <FormLoginEquipe acoes={{ entrar: entrarNaEquipe }} sessaoVencida={motivo === 'sessao'} />
    </section>
  );
}
