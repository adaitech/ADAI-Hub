import { redirect } from 'next/navigation';

/** /eba/equipe → consultas (a guarda manda ao login quando não há sessão). */
export default function EquipePage(): never {
  redirect('/eba/equipe/consultas');
}
