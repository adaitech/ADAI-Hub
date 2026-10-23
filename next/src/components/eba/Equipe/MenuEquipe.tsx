'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { sairDaEquipe } from '@/app/(restrito)/eba/equipe/acoes';
import { buttonClassName } from '@/components/ui/ButtonLink';
import styles from './Equipe.module.css';

export interface MenuEquipeProps {
  email: string;
  acoes: { sair: typeof sairDaEquipe };
}

const ITENS = [
  { href: '/eba/equipe/consultas', texto: 'Consultas' },
  { href: '/eba/equipe/turmas', texto: 'Turmas' },
  { href: '/eba/equipe/aulas/reset', texto: 'Aulas / Reset' },
  { href: '/eba/equipe/aulas/dna', texto: 'Aulas / DNA' },
  { href: '/eba/equipe/qr-codes', texto: 'QR codes' },
] as const;

/** Menu da área da equipe: seções, e-mail de quem entrou e "Sair" (apaga a sessão e volta ao login). */
export function MenuEquipe({ email, acoes }: MenuEquipeProps) {
  const caminho = usePathname();
  const roteador = useRouter();

  async function sair() {
    await acoes.sair();
    roteador.replace('/eba/equipe/login');
  }

  return (
    <div className={styles.menu}>
      <nav aria-label="Área da equipe">
        <ul role="list" className={styles.menuLista}>
          {ITENS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.menuLink} aria-current={caminho.startsWith(item.href) ? 'page' : undefined}>
                {item.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className={styles.usuario}>
        <span>{email}</span>
        <button type="button" className={buttonClassName({ estilo: 'contorno' })} onClick={() => void sair()}>
          Sair
        </button>
      </p>
    </div>
  );
}
