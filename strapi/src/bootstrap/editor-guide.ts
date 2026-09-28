import type { Core } from '@strapi/strapi';
import { editorGuides, mainFields } from '../editor-guide';

interface EditMetadata {
  label?: string;
  description?: string;
  placeholder?: string;
  [key: string]: unknown;
}

interface ModelConfiguration {
  settings: Record<string, unknown>;
  metadatas: Record<string, { edit: EditMetadata; list: Record<string, unknown> }>;
  layouts: Record<string, unknown>;
}

/**
 * Aplica os textos de `src/editor-guide/*.json` ao painel do Strapi
 * (label, descrição e placeholder de cada campo). O JSON é a fonte única:
 * edições manuais em "Configurar a visualização" são sobrescritas no próximo boot.
 */
export async function applyEditorGuides(strapi: Core.Strapi) {
  const contentManager = strapi.plugin('content-manager');

  for (const guide of editorGuides) {
    const isContentType = guide.uid.startsWith('api::');
    const service = contentManager.service(isContentType ? 'content-types' : 'components');
    const model = isContentType
      ? service.findContentType(guide.uid)
      : service.findComponent(guide.uid);

    if (!model) {
      strapi.log.warn(`[editor-guide] "${guide.uid}" não existe no Strapi — guia ignorado.`);
      continue;
    }

    const configuration: ModelConfiguration = await service.findConfiguration(model);
    const metadatas = { ...configuration.metadatas };

    for (const campo of guide.campos) {
      const current = metadatas[campo.campo];
      if (!current) {
        strapi.log.warn(`[editor-guide] Campo "${campo.campo}" não existe em "${guide.uid}".`);
        continue;
      }
      metadatas[campo.campo] = {
        ...current,
        edit: {
          ...current.edit,
          label: campo.label,
          description: campo.descricao,
          placeholder: campo.placeholder,
        },
        list: { ...current.list, label: campo.label },
      };
    }

    const mainField = mainFields[guide.uid];
    const settings = mainField
      ? { ...configuration.settings, mainField, defaultSortBy: isContentType ? mainField : configuration.settings.defaultSortBy }
      : configuration.settings;

    await service.updateConfiguration(model, {
      settings,
      metadatas,
      layouts: configuration.layouts,
    });
  }

  strapi.log.info(`[editor-guide] ${editorGuides.length} guias aplicados ao painel.`);
}
