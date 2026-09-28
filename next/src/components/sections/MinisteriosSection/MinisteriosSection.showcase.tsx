import { defineShowcase } from '@/lib/showcase/types';
import { MinisteriosSection } from './MinisteriosSection';
import mocks from './MinisteriosSection.mock.json';
import type { MinisteriosData } from './types';

const completo = mocks.completo as MinisteriosData;

export const ministeriosShowcase = defineShowcase<MinisteriosData>({
  slug: 'ministerios',
  nome: 'Lista de ministérios',
  categoria: 'secao',
  cmsKey: 'sections.ministerios',
  descricao: 'Convite para servir ao lado de uma lista vertical de ministérios e seus públicos. Os itens não deslizam: esta seção não é um carrossel.',
  quandoUsar: 'Na Home, para mostrar de uma vez todas as áreas em que alguém pode encontrar seu lugar e servir.',
  doc: 'docs/componentes/ministerios.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-230',
  render: (data) => <MinisteriosSection data={data} index={1} />,
  variantes: [
    { nome: 'completo', titulo: 'Encontre seu lugar', descricao: 'Oito ministérios, como no Figma.', data: completo },
    { nome: 'minimo', titulo: 'Mínimo', descricao: 'Um ministério sem público nem ação.', data: mocks.minimo as MinisteriosData },
    { nome: 'texto_longo', titulo: 'Texto longo', descricao: 'Verifica nomes e públicos extensos.', data: mocks.texto_longo as MinisteriosData },
  ],
  controles: [
    {
      id: 'apoio', tipo: 'alternar', rotulo: 'Texto de apoio',
      valor: (data) => Boolean(data.texto_apoio?.trim()),
      aplicar: (data, ligado) => ({ ...data, texto_apoio: ligado ? data.texto_apoio || completo.texto_apoio : null }),
    },
    {
      id: 'botao', tipo: 'alternar', rotulo: 'Botão Quero servir',
      valor: (data) => Boolean(data.botao),
      aplicar: (data, ligado) => ({ ...data, botao: ligado ? data.botao || completo.botao : null }),
    },
    {
      id: 'publicos', tipo: 'alternar', rotulo: 'Público de cada ministério',
      valor: (data) => Boolean(data.ministerios?.some((item) => item.publico)),
      aplicar: (data, ligado) => ({ ...data, ministerios: data.ministerios?.map((item, i) => ({
        ...item, publico: ligado ? item.publico || completo.ministerios?.[i]?.publico || 'Todas as idades' : null,
      })) }),
    },
  ],
});
