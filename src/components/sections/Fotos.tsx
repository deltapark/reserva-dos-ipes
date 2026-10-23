"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fotos } from "@/lib/content";
import { Lightbox, type LightboxPhoto } from "@/components/ui/Lightbox";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";

const t = fotos;
const src = (n: number, tam: "640" | "g") => `/images/fotos/casa-${String(n).padStart(2, "0")}-${tam}.webp`;
const lista: LightboxPhoto[] = t.fotos.map((f) => ({
  img: `casa-${f.n}`,
  legenda: f.legenda,
  alt: `Casa decorada: ${f.legenda.toLowerCase()}`,
  src: src(f.n, "g"),
  srcSet: `${src(f.n, "640")} 640w, ${src(f.n, "g")} ${f.w}w`,
  thumb: src(f.n, "640"),
  w: f.w,
  h: f.h,
}));

/** Fotos da casa decorada. Desktop (Faixa): todas na mesma altura, cada uma na sua proporção,
 *  passando de ponta a ponta; o ambiente acende conforme rola. Celular (Pilha): fotos empilhadas,
 *  arrastar a de cima revela a próxima. As duas abrem a foto em tela cheia. */
export function Fotos() {
  const [aberta, setAberta] = useState<number | null>(null);
  return (
    <section className="sec ft" id="fotos" aria-labelledby="ft-h" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="casa__head">
          <h2 className="h2" id="ft-h">{t.titulo}</h2>
          <p className="body">{t.texto}</p>
        </div>
      </div>
      <Faixa onAbrir={setAberta} />
      <Pilha onAbrir={setAberta} />
      <Lightbox
        open={aberta !== null}
        title={t.titulo.replace(/\.$/, "")}
        color="var(--lamp)"
        photos={lista}
        start={aberta ?? 0}
        onClose={() => setAberta(null)}
      />
    </section>
  );
}

function Faixa({ onAbrir }: { onAbrir: (i: number) => void }) {
  const tr = useRef<HTMLDivElement>(null);
  const [amb, setAmb] = useState(t.fotos[0].amb);
  const [pontas, setPontas] = useState({ ini: true, fim: false });
  const drag = useRef({ x: 0, s: 0, ativo: false, moveu: false });

  const medir = useCallback(() => {
    const el = tr.current;
    if (!el) return;
    const pad = parseFloat(getComputedStyle(el).paddingLeft);
    const x = el.scrollLeft + el.clientWidth * 0.25;
    let k = 0;
    Array.from(el.children).forEach((c, i) => {
      if ((c as HTMLElement).offsetLeft - pad <= x && i < t.fotos.length) k = i;
    });
    setAmb(t.fotos[k].amb);
    setPontas({ ini: el.scrollLeft < 4, fim: el.scrollLeft > el.scrollWidth - el.clientWidth - 4 });
  }, []);

  useEffect(() => {
    medir();
    // arrastar com o mouse; no toque a rolagem já é nativa
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const el = tr.current;
      if (!d.ativo || !el) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 5) {
        d.moveu = true;
        el.classList.add("is-drag");
      }
      el.scrollLeft = d.s - dx;
    };
    const up = () => {
      const d = drag.current;
      if (!d.ativo) return;
      d.ativo = false;
      tr.current?.classList.remove("is-drag");
      setTimeout(() => (d.moveu = false), 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [medir]);

  const ir = (id: string) => {
    const el = tr.current;
    const k = t.fotos.findIndex((f) => f.amb === id);
    const s = el?.children[k] as HTMLElement | undefined;
    if (el && s) el.scrollTo({ left: s.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  };
  const passo = (d: number) => tr.current?.scrollBy({ left: d * tr.current.clientWidth * 0.75, behavior: "smooth" });

  return (
    <div className="ft__d">
      <div className="wrap ft__bar">
        <nav className="ft__ambs" aria-label="Ambientes da casa decorada">
          {t.ambientes.map((a) => (
            <button key={a.id} type="button" aria-current={a.id === amb} onClick={() => ir(a.id)}>
              {a.nome}
            </button>
          ))}
        </nav>
        <div className="ft__arws">
          <button className="ft__arw" type="button" aria-label="Voltar" disabled={pontas.ini} onClick={() => passo(-1)}>
            <ChevronLeft />
          </button>
          <button className="ft__arw" type="button" aria-label="Avançar" disabled={pontas.fim} onClick={() => passo(1)}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div
        ref={tr}
        className="ft__tr"
        onScroll={medir}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !tr.current) return;
          drag.current = { x: e.clientX, s: tr.current.scrollLeft, ativo: true, moveu: false };
        }}
      >
        {t.fotos.map((f, i) => (
          <figure className="ft__sl" key={f.n}>
            <button type="button" aria-label={`${f.legenda}, ampliar`} onClick={() => !drag.current.moveu && onAbrir(i)}>
              <img
                src={src(f.n, "g")}
                srcSet={`${src(f.n, "640")} 640w, ${src(f.n, "g")} ${f.w}w`}
                sizes={`${Math.round((62 * f.w) / f.h)}vh`}
                width={f.w}
                height={f.h}
                alt={lista[i].alt}
                loading={i < 4 ? "eager" : "lazy"}
                draggable={false}
              />
            </button>
            <figcaption>{f.legenda}</figcaption>
          </figure>
        ))}
        <span className="ft__fim" aria-hidden />
      </div>
    </div>
  );
}

// giros fixos das fotos de baixo: cara de fotos impressas soltas na mesa
const GIRO = [0, -3, 2.5, -1.5];

function Pilha({ onAbrir }: { onAbrir: (i: number) => void }) {
  const N = t.fotos.length;
  const [cur, setCur] = useState(0);
  const topo = useRef<HTMLDivElement>(null);
  const arr = useRef<{ x: number | null; dx: number }>({ x: null, dx: 0 });

  const sai = (dir: number) => {
    const el = topo.current;
    if (el) el.style.transform = `translateX(${dir * 120}%) rotate(${dir * 18}deg)`;
    setTimeout(() => setCur((c) => (c + 1) % N), 300);
  };

  // a de cima volta ao lugar quando vira a de baixo
  useEffect(() => {
    if (topo.current) topo.current.style.transform = "";
  }, [cur]);

  const f0 = t.fotos[cur];
  return (
    <div className="ft__m wrap">
      <p className="ft__dica">{t.dica}</p>
      <div className="ft__pk">
        {[3, 2, 1, 0].map((j) => {
          const k = (cur + j) % N;
          const f = t.fotos[k];
          const em = j === 0;
          return (
            <div
              key={f.n}
              ref={em ? topo : undefined}
              className={`ft__cd${em ? " is-top" : ""}`}
              style={em ? { zIndex: 10 } : { zIndex: 10 - j, transform: `rotate(${GIRO[j]}deg) translateY(${j * 6}px)` }}
              role={em ? "button" : undefined}
              tabIndex={em ? 0 : -1}
              aria-label={em ? `${f.legenda}. Arraste para o lado para ver a próxima; toque para ampliar` : undefined}
              aria-hidden={em ? undefined : true}
              onKeyDown={(e) => {
                if (!em) return;
                if (e.key === "Enter") onAbrir(k);
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") sai(e.key === "ArrowRight" ? 1 : -1);
              }}
              onPointerDown={(e) => {
                if (!em) return;
                arr.current = { x: e.clientX, dx: 0 };
                e.currentTarget.setPointerCapture(e.pointerId);
                e.currentTarget.classList.add("is-drag");
              }}
              onPointerMove={(e) => {
                const a = arr.current;
                if (!em || a.x === null) return;
                a.dx = e.clientX - a.x;
                e.currentTarget.style.transform = `translateX(${a.dx}px) rotate(${a.dx / 18}deg)`;
              }}
              onPointerUp={(e) => {
                const a = arr.current;
                if (!em || a.x === null) return;
                a.x = null;
                e.currentTarget.classList.remove("is-drag");
                if (Math.abs(a.dx) > 80) sai(a.dx < 0 ? -1 : 1);
                else if (Math.abs(a.dx) < 6) onAbrir(k);
                else e.currentTarget.style.transform = "";
              }}
              onPointerCancel={(e) => {
                arr.current.x = null;
                e.currentTarget.classList.remove("is-drag");
                e.currentTarget.style.transform = "";
              }}
            >
              <img src={src(f.n, "640")} srcSet={`${src(f.n, "640")} 640w, ${src(f.n, "g")} ${f.w}w`} sizes="92vw" alt={em ? lista[k].alt : ""} draggable={false} loading={j < 2 ? undefined : "lazy"} />
            </div>
          );
        })}
      </div>
      <div className="ft__leg" aria-live="polite">
        <b>{f0.legenda}</b>
        <span>
          {cur + 1} de {N}
        </span>
      </div>
      <div className="ft__acts">
        <button className="pl__link" type="button" onClick={() => setCur((c) => (c - 1 + N) % N)}>
          {t.voltar}
        </button>
        <button className="pl__link" type="button" onClick={() => onAbrir(cur)}>
          {t.cheia}
        </button>
      </div>
    </div>
  );
}
