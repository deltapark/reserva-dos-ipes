"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copy, plantas, site, type Casa } from "@/lib/content";
import { useMode } from "@/lib/mode";
import { contain, engine, play } from "@/lib/lote";
import { Planta, plantaSrc } from "@/components/ui/Planta";
import { Close } from "@/components/ui/icons";

const t = plantas;
// só o decorado tem gourmet: sem o tipo, o JSON vira uma união e o campo some
const casas = t.casas as Casa[];
const alt = (c: Casa) =>
  `Planta humanizada do ${c.tipo}: três quartos, um deles suíte, sala e cozinha integradas, dois banheiros, área de serviço e garagem descoberta`;
const quintal = (c: Casa) => `Quintal de ${c.quintal} m²${c.gourmet ? `, espaço gourmet de ${c.gourmet} m²` : ""}`;
const fine = () => window.matchMedia("(hover:hover) and (pointer:fine)").matches;

type Zoom = { titulo: string; legenda: string; src: string; alt: string };

/** Plantas: a planta é a mesma nas 62 casas, muda a implantação no lote.
 *  Desktop: o quadro abre no condomínio e escolher uma implantação desce até o lote (Desktop).
 *  Celular: lista das seis implantações, uma aberta por vez (Celular). */
export function Plantas() {
  const sol = useMode() === "dia";
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const ampliar = (c: Casa) => setZoom({ titulo: c.tipo, legenda: quintal(c), src: plantaSrc(c.id, sol, 2200), alt: alt(c) });
  const ampliarMapa = () => setZoom({ titulo: t.mapaLegenda, legenda: t.mapaNota, src: plantaSrc(t.mapa.img, false, 1500), alt: t.mapaAlt });

  return (
    <section className="sec pl" id="plantas" aria-labelledby="pl-h" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="casa__head">
          <h2 className="h2" id="pl-h">{t.titulo}</h2>
          <p className="body">{t.texto}</p>
        </div>
        <Desktop sol={sol} onAmpliar={ampliar} />
        <Celular sol={sol} onAmpliar={ampliar} onMapa={ampliarMapa} />
        <div className="pl__foot">
          <p className="pl__legal">
            {t.legal} <span className="pl__ex">{t.exemplo}</span> {copy.rodape.legal}
          </p>
          <a className="btn" href={site.simuladorUrl} target="_blank" rel="noopener">
            {t.cta}
          </a>
        </div>
      </div>
      <PlantaCheia zoom={zoom} onFechar={() => setZoom(null)} />
    </section>
  );
}

type Fase = "mapa" | "indo" | "casa" | "voltando";

function Desktop({ sol, onAmpliar }: { sol: boolean; onAmpliar: (c: Casa) => void }) {
  const fig = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLImageElement>(null);
  const [fase, setFase] = useState<Fase>("mapa");
  const [cur, setCur] = useState(-1);
  const [voo, setVoo] = useState(0);
  // só monta as plantas já pedidas: evita baixar as seis de uma vez
  const [vistas, setVistas] = useState<Set<number>>(() => new Set());
  const faseRef = useRef<Fase>("mapa");
  const last = useRef(0);
  const cancel = useRef<() => void>(undefined);
  faseRef.current = fase;

  const ver = (k: number) => setVistas((s) => (s.has(k) ? s : new Set(s).add(k)));

  const draw = useCallback(
    (p: number) => {
      if (!fig.current || !map.current || !fly.current) return;
      last.current = p;
      const box = fig.current;
      engine({ box, map: map.current, fly: fly.current, mapRatio: t.mapa.h / t.mapa.w, target: () => contain(box, casas[voo]) })(p);
    },
    [voo],
  );

  useEffect(() => {
    if (faseRef.current === "mapa") draw(last.current);
    const onResize = () => faseRef.current !== "casa" && draw(last.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);
  useEffect(() => () => cancel.current?.(), []);

  const pick = (k: number) => {
    if (fase === "casa") {
      setCur(k);
      ver(k);
      return;
    }
    if (fase !== "mapa") return;
    ver(k);
    setVoo(k);
    setFase("indo");
  };

  const voltar = () => {
    setVoo(cur);
    setFase("voltando");
  };

  // a animação roda depois que o React trocou a imagem do voo
  useEffect(() => {
    if (fase === "indo")
      cancel.current = play(draw, 0, 1, 2600, () => {
        setCur(voo);
        setFase("casa");
      });
    if (fase === "voltando") {
      draw(1);
      cancel.current = play(draw, 1, 0, 2000, () => {
        setCur(-1);
        setFase("mapa");
      });
    }
  }, [fase]);

  const casa = cur >= 0 ? casas[cur] : null;

  return (
    <div className={`pl__d${fase === "indo" || fase === "voltando" ? " is-busy" : ""}`}>
      <div className="pl__row">
        <div
          ref={fig}
          className="pl__fig"
          data-fase={fase}
          onClick={() => casa && fase === "casa" && onAmpliar(casa)}
        >
          {casas.map((c, k) =>
            vistas.has(k) ? (
              <Planta
                key={`${c.id}-${sol}`}
                id={c.id}
                sol={sol}
                w={c.w}
                h={c.h}
                alt={k === cur ? alt(c) : ""}
                sizes="(min-width:1360px) 1000px, 70vw"
                className={`pl__pi${k === cur ? " on" : ""}`}
                loading="lazy"
              />
            ) : null,
          )}
          <div ref={map} className="pl__map">
            <Planta id={t.mapa.img} w={t.mapa.w} h={t.mapa.h} alt={t.mapaAlt} sizes="(min-width:1360px) 1000px, 70vw" loading="lazy" />
          </div>
          <img ref={fly} className="pl__fly" src={plantaSrc(casas[voo].id, sol, 1500)} alt="" aria-hidden />
        </div>

        <div className="pl__info" aria-live="polite">
          {casa ? (
            <>
              <p className="pl__t">{casa.tipo}</p>
              <dl className="pl__dl">
                <div><dt>Casa</dt><dd>70,27 m²</dd></div>
                <div><dt>Quintal</dt><dd>{casa.quintal} m²</dd></div>
                {casa.gourmet && <div><dt>Espaço gourmet</dt><dd>{casa.gourmet} m²</dd></div>}
                <div><dt>Lote</dt><dd>180 m²</dd></div>
              </dl>
              <div className="pl__acts">
                <button className="pl__link" type="button" onClick={() => onAmpliar(casa)}>{t.ampliar}</button>
                <button className="pl__link" type="button" onClick={voltar}>{t.voltar}</button>
              </div>
            </>
          ) : (
            <>
              <p className="pl__t">62 casas</p>
              <dl className="pl__dl">
                <div><dt>Ruas de ipê</dt><dd>4</dd></div>
                <div><dt>Implantações</dt><dd>6</dd></div>
                <div><dt>Lote</dt><dd>180 m²</dd></div>
              </dl>
            </>
          )}
        </div>
      </div>

      <ul className="pl__thumbs">
        {casas.map((c, k) => (
          <li key={c.id}>
            <button
              type="button"
              className="pl__th"
              aria-pressed={k === cur}
              onClick={() => pick(k)}
              onMouseEnter={() => fase === "casa" && fine() && pick(k)}
            >
              <Planta id={c.id} sol={sol} w={c.w} h={c.h} alt="" sizes="16vw" loading="lazy" />
              <span>
                {c.tipo}
                <small>Quintal de {c.quintal} m²</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Celular({ sol, onAmpliar, onMapa }: { sol: boolean; onAmpliar: (c: Casa) => void; onMapa: () => void }) {
  const [aberto, setAberto] = useState(0);
  const [vistas, setVistas] = useState<Set<number>>(() => new Set([0]));
  const itens = useRef<(HTMLLIElement | null)[]>([]);

  const toggle = (k: number) => {
    const abre = aberto !== k;
    setAberto(abre ? k : -1);
    if (!abre) return;
    setVistas((s) => (s.has(k) ? s : new Set(s).add(k)));
    // se a que fecha está acima, a página encolhe: só rola depois que ela terminar de fechar
    const rolar = () => itens.current[k]?.scrollIntoView({ behavior: "smooth", block: "start" });
    const fecha = aberto >= 0 && aberto < k ? itens.current[aberto]?.querySelector(".pl__ib") : null;
    if (!fecha) return void requestAnimationFrame(rolar);
    let feito = false;
    const uma = () => {
      if (feito) return;
      feito = true;
      fecha.removeEventListener("transitionend", uma);
      rolar();
    };
    fecha.addEventListener("transitionend", uma);
    setTimeout(uma, 700);
  };

  return (
    <div className="pl__m">
      <figure className="pl__mapa">
        <button type="button" onClick={onMapa} aria-label={`${t.mapaLegenda} Ampliar`}>
          <Planta id={t.mapa.img} w={t.mapa.w} h={t.mapa.h} alt={t.mapaAlt} sizes="100vw" loading="lazy" />
        </button>
        <figcaption>{t.mapaLegenda}</figcaption>
      </figure>
      <ul className="pl__acc">
        {casas.map((c, k) => {
          const on = k === aberto;
          return (
            <li key={c.id} ref={(el) => { itens.current[k] = el; }} className={`pl__it${on ? " open" : ""}`}>
              <button className="pl__ih" type="button" aria-expanded={on} aria-controls={`pl-b-${k}`} onClick={() => toggle(k)}>
                <Planta id={c.id} sol={sol} w={c.w} h={c.h} alt="" sizes="80px" loading="lazy" />
                <span>
                  <b>{c.tipo}</b>
                  <small>Quintal de {c.quintal} m²</small>
                </span>
                <i className="pl__pm" aria-hidden />
              </button>
              <div className="pl__ib" id={`pl-b-${k}`}>
                <div>
                  {vistas.has(k) && (
                    <button className="pl__ipl" type="button" onClick={() => onAmpliar(c)} tabIndex={on ? 0 : -1}>
                      <Planta id={c.id} sol={sol} w={c.w} h={c.h} alt={alt(c)} sizes="100vw" />
                    </button>
                  )}
                  <dl className="pl__dados">
                    <div><dt>Casa</dt><dd>70,27 m²</dd></div>
                    <div><dt>Quintal</dt><dd>{c.quintal} m²</dd></div>
                    {c.gourmet && <div><dt>Gourmet</dt><dd>{c.gourmet} m²</dd></div>}
                    <div><dt>Lote</dt><dd>180 m²</dd></div>
                  </dl>
                  <button className="pl__link" type="button" onClick={() => onAmpliar(c)} tabIndex={on ? 0 : -1}>
                    {t.ampliar}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A planta inteira sobre um véu escuro. Fecha no X, no Esc e clicando fora. */
function PlantaCheia({ zoom, onFechar }: { zoom: Zoom | null; onFechar: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    else if (!zoom && d.open) d.close();
  }, [zoom]);

  return (
    <dialog
      ref={dlg}
      className="lbx pl__cheia"
      aria-label={zoom?.titulo}
      onClose={onFechar}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("img,button")) dlg.current?.close();
      }}
    >
      <div className="lbx__top">
        <p className="lbx__name">{zoom?.titulo}</p>
        <button className="lbx__btn" type="button" aria-label="Fechar" onClick={() => dlg.current?.close()}>
          <Close />
        </button>
      </div>
      <div className="lbx__stage">
        <figure className="lbx__fig" tabIndex={-1}>
          {zoom && (
            <img
              src={zoom.src}
              alt={zoom.alt}
              onLoad={(e) => {
                // no celular a planta é mais larga que a tela: abre centrada na casa
                const st = e.currentTarget.closest(".lbx__stage");
                if (st) st.scrollLeft = (st.scrollWidth - st.clientWidth) / 2;
              }}
            />
          )}
          <figcaption className="lbx__cap">{zoom?.legenda}</figcaption>
        </figure>
      </div>
    </dialog>
  );
}
