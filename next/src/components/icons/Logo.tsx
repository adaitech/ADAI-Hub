interface LogoProps {
  className?: string;
  /**
   * `frame` (padrão): caixa do frame do Figma (99,21 × 32,6), com o respiro à esquerda usado no Header.
   * `justo`: caixa recortada no desenho, para alinhar o símbolo à margem (ex.: Footer).
   */
  enquadramento?: 'frame' | 'justo';
}

const VIEWBOX = {
  frame: { x: 0, y: 0, width: 99.21, height: 32.6 },
  justo: { x: 19.455, y: 3.289, width: 60.307, height: 26.02 },
};

/**
 * Logo ADAI (Figma: frame "LOGO ADAI 2", 99,21 × 32,6).
 * Paths copiados sem alteração dos assets "Camada 1-2" (símbolo) e "Group" (palavra),
 * posicionados pelas mesmas proporções do frame no Figma. Decorativo: o nome acessível
 * fica no link que envolve o logo.
 */
export function Logo({ className, enquadramento = 'frame' }: LogoProps) {
  const box = VIEWBOX[enquadramento];
  return (
    <svg
      className={className}
      width={box.width}
      height={box.height}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(19.455 3.289)">
        <path
          d="M13.01 0C5.82 0 0 5.83 0 13.01C0 20.19 5.83 26.02 13.01 26.02C20.19 26.02 26.02 20.19 26.02 13.01C26.02 5.83 20.19 0 13.01 0ZM14.27 18.35L14.25 15.75H16.31L13.02 10.12L9.76 15.75H11.7V18.35H5.12L9.06 11.53L13 4.71L16.94 11.53L20.88 18.35H14.26H14.27Z"
          fill="black"
        />
      </g>
      <g transform="translate(48.712 7.149)">
        <path
          d="M5.93 17.09L5.49 13.75H3L2.49 17.09H0L2.85 0H5.85L8.7 17.09H5.93ZM4.34 4.49L3.34 11.47H5.19L4.34 4.49Z"
          fill="black"
        />
        <path
          d="M13.91 17.09H9.75V0H13.91C16.37 0 17.81 1.54 17.81 4.08V13.11C17.81 15.68 16.37 17.09 13.91 17.09ZM15.09 4.06C15.09 2.98 14.68 2.44 13.73 2.44H12.47V14.68H13.73C14.68 14.68 15.09 14.12 15.09 13.06V4.05V4.06Z"
          fill="black"
        />
        <path
          d="M24.5 17.09L24.06 13.75H21.57L21.06 17.09H18.57L21.42 0H24.42L27.27 17.09H24.5ZM22.91 4.49L21.91 11.47H23.76L22.91 4.49Z"
          fill="black"
        />
        <path d="M28.33 17.09V0H31.05V17.09H28.33Z" fill="black" />
      </g>
    </svg>
  );
}
