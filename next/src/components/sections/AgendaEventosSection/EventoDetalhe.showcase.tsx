import { alternarCampo } from '@/lib/showcase/acoes';
import { defineShowcase } from '@/lib/showcase/types';
import { normalizeDetalhe, normalizeDetalheAdministrativo } from '@/lib/inchurch/detalhes';
import type { InchurchEvento, InchurchEventoAdministrativo } from '@/lib/inchurch/types';
import { EventoDetalhe } from './EventoDetalhe';
import mock from './EventoDetalhe.mock.json';

type Exemplo = InchurchEvento & Pick<InchurchEventoAdministrativo, 'event_attractions' | 'event_images'>;
const completo = mock as Exemplo;
// Exemplo fornecido para o contrato, sem dados lidos do evento administrativo privado.
const convidados = [{ name: 'Diogo Mour', title: 'Software Development Manager', description: 'Biografia do convidado', url: 'https://www.linkedin.com/in/diogomoura/' }];
// Arte já pública, utilizada apenas para demonstrar o comportamento da galeria na vitrine.
const fotos = [1, 2, 3].map((id) => ({ id, image: mock.image, thumbnail: mock.image_webp }));

/** Apenas conteúdo já público. A fixture administrativa do evento oculto fica só nos testes. */
export const eventoDetalheShowcase = defineShowcase<Exemplo>({
  slug: 'evento-detalhe', nome: 'Detalhes do evento', categoria: 'secao', cmsKey: null,
  descricao: 'Página de evento da inChurch, com informações, programação, convidados e galeria opcionais.',
  quandoUsar: 'Na rota de detalhes da Agenda. Não é uma seção editorial cadastrada no CMS.',
  doc: 'docs/componentes/agenda-eventos.md',
  render: (data) => { const base = normalizeDetalhe(data); const evento = base && normalizeDetalheAdministrativo({ id: data.id, event_attractions: data.event_attractions, event_images: data.event_images }, base, []); return evento ? <EventoDetalhe evento={evento} /> : null; },
  variantes: [
    { nome: 'completo', titulo: 'Evento público sem programação', data: completo, descricao: 'Somente dados públicos; nenhum conteúdo do HACKATHON oculto é exposto na vitrine.' },
    { nome: 'encerrado', titulo: 'Evento encerrado', data: { ...completo, start_datetime: '2020-01-01T10:00:00', end_datetime: '2020-01-01T11:00:00' }, descricao: 'Conteúdo preservado, aviso de encerramento e CTA oculto.' },
    { nome: 'minimo', titulo: 'Sem opcionais', data: { ...completo, description: null, image: null, image_webp: null, event_url: null } },
    { nome: 'convidados', titulo: 'Convidados — exemplo do contrato', data: { ...completo, event_attractions: convidados }, descricao: 'Demonstração do contrato fornecido, com iniciais na ausência de foto; não representa participação confirmada neste evento.' },
    { nome: 'galeria', titulo: 'Galeria com várias imagens', data: { ...completo, event_images: fotos }, descricao: 'Demonstração do grid e lightbox com arte já pública, sem copiar conteúdo administrativo privado.' },
    { nome: 'galeria-unica', titulo: 'Galeria com uma imagem', data: { ...completo, event_images: fotos.slice(0, 1) } },
  ],
  controles: [alternarCampo<Exemplo, 'description'>('description', 'Descrição', completo.description ?? null), alternarCampo<Exemplo, 'event_attractions'>('event_attractions', 'Convidados (exemplo)', convidados), alternarCampo<Exemplo, 'event_images'>('event_images', 'Galeria (exemplo)', fotos)],
});
