import type { ImgHTMLAttributes } from "react";

// As plantas saem de scripts/plantas.mjs em 900/1500/2200 px, cada uma no seu quadro
// (a tarja preta do render é cortada), por isso w/h vêm do content/plantas.json.
const LARGURAS = [900, 1500, 2200] as const;

export function plantaSrc(id: string, sol: boolean, w: number) {
  return `/images/plantas-web/${id}${sol ? "-sol" : ""}-${w}.webp`;
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height"> & {
  id: string;
  w: number;
  h: number;
  alt: string;
  /** no modo Dia a planta usa o render com sol batendo */
  sol?: boolean;
};

export function Planta({ id, w, h, alt, sol = false, sizes = "100vw", ...rest }: Props) {
  // a implantação é menor que 2200px: pedir esse tamanho traria um arquivo que não existe
  const larguras = LARGURAS.filter((l) => l <= w * 1.3);
  return (
    <img
      src={plantaSrc(id, sol, larguras.includes(1500) ? 1500 : larguras[0])}
      srcSet={larguras.map((l) => `${plantaSrc(id, sol, l)} ${l}w`).join(", ")}
      sizes={sizes}
      width={w}
      height={h}
      alt={alt}
      decoding="async"
      {...rest}
    />
  );
}
