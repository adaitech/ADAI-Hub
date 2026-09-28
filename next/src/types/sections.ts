/** Props que o SectionRenderer passa para toda seção do CMS. */
export interface SectionProps<TData> {
  /** JSON cru do bloco, exatamente como a API do Strapi entrega. */
  data: TData;
  /** Posição da seção na página (0 = primeira). Usada para `priority` de imagem e hierarquia de títulos. */
  index: number;
}
