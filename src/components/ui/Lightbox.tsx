"use client";

import { useEffect, useRef, useState } from "react";
import { Img } from "./Img";
import { ChevronLeft, ChevronRight, Close } from "./icons";

// img é o nome de um render (Img, quadro 1920x1071). Fotos em outra proporção mandam src/srcSet/w/h e thumb.
export type LightboxPhoto = {
  img: string;
  legenda: string;
  alt: string;
  src?: string;
  srcSet?: string;
  thumb?: string;
  w?: number;
  h?: number;
};

type Props = {
  open: boolean;
  title: string;
  color: string;
  photos: LightboxPhoto[];
  start?: number;
  onClose: () => void;
};

/** Lightbox: véu escuro sobre a página e a foto inteira (object-fit: contain). Fecha no X, no Esc e clicando fora. */
export function Lightbox({ open, title, color, photos, start = 0, onClose }: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const swipe = useRef<{ x: number | null; done: boolean }>({ x: null, done: false });

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      setI(start);
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, start]);

  const n = photos.length;
  const go = (k: number) => n && setI(((k % n) + n) % n);
  const photo = photos[i];

  return (
    <dialog
      ref={dlg}
      className="lbx"
      aria-label={`Fotos da ${title}`}
      style={{ ["--c" as string]: color }}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      onClick={(e) => {
        if (swipe.current.done) {
          swipe.current.done = false;
          return;
        }
        if (!(e.target as HTMLElement).closest("img,button,.lbx__cap,.lbx__name,.lbx__count")) dlg.current?.close();
      }}
    >
      <div className="lbx__top">
        <p className="lbx__name">{title}</p>
        <p className="lbx__count">{n ? `${i + 1} de ${n}` : ""}</p>
        <button className="lbx__btn" type="button" aria-label="Fechar" onClick={() => dlg.current?.close()}>
          <Close />
        </button>
      </div>
      <div
        className="lbx__stage"
        onPointerDown={(e) => (swipe.current.x = (e.target as HTMLElement).closest("button") ? null : e.clientX)}
        onPointerUp={(e) => {
          const x0 = swipe.current.x;
          swipe.current.x = null;
          if (x0 === null) return;
          const dx = e.clientX - x0;
          if (Math.abs(dx) > 50) {
            swipe.current.done = true;
            go(i + (dx < 0 ? 1 : -1));
          }
        }}
      >
        <button className="lbx__btn lbx__side lbx__side--prev" type="button" aria-label="Foto anterior" onClick={() => go(i - 1)}>
          <ChevronLeft />
        </button>
        {/* tabIndex + autoFocus: ao abrir, o foco vai para a foto, não para o X */}
        <figure className="lbx__fig" tabIndex={-1} autoFocus>
          {photo &&
            open &&
            (photo.src ? (
              <img key={photo.img} src={photo.src} srcSet={photo.srcSet} sizes="(max-width:700px) 100vw, 86vw" width={photo.w} height={photo.h} alt={photo.alt} />
            ) : (
              <Img key={photo.img} name={photo.img} alt={photo.alt} sizes="(max-width:700px) 100vw, 86vw" loading="eager" />
            ))}
          <figcaption className="lbx__cap">{photo?.legenda}</figcaption>
        </figure>
        <button className="lbx__btn lbx__side lbx__side--next" type="button" aria-label="Próxima foto" onClick={() => go(i + 1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="lbx__thumbs">
        {open &&
          photos.map((p, k) => (
            <button key={p.img} type="button" className="lbx__thumb" aria-label={`Ver ${p.legenda}`} aria-current={k === i} onClick={() => go(k)}>
              {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <Img name={p.img} alt="" sizes="84px" />}
            </button>
          ))}
      </div>
    </dialog>
  );
}
