"use client";

import { useEffect, useRef, useState } from "react";
import { copy, plantas, site, type Casa } from "@/lib/content";
import { useMode } from "@/lib/mode";
import { Planta, plantaSrc } from "@/components/ui/Planta";
import { Close, Expand } from "@/components/ui/icons";

const COR: Record<string, string> = {
  rosa: "var(--ipe-rosa)",
  amarelo: "var(--ipe-amarelo)",
  branco: "#CDBE93",
  roxo: "var(--ipe-roxo)",
};

const fine = () => typeof window !== "undefined" && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
const alt = (nome: string) => `Planta humanizada: ${nome.toLowerCase()}, com três quartos, suíte, sala, cozinha e garagem descoberta`;

/** Plantas: a lista escolhe a planta e o desenho troca no lugar, numa coluna mais estreita que o
 *  resto da página. Embaixo, a implantação: passar por uma rua acende os lotes dela. */
export function Plantas() {
  const t = plantas;
  // só o decorado tem gourmet: sem o tipo, o JSON vira uma união e o campo some
  const casas = t.casas as Casa[];
  const [cur, setCur] = useState(0);
  // só monta as plantas já pedidas: evita baixar as doze de uma vez
  const [vistas, setVistas] = useState<Set<number>>(() => new Set([0]));
  const [rua, setRua] = useState<string | null>(null);
  const [zoom, setZoom] = useState<"planta" | "mapa" | null>(null);
  const mode = useMode();
  const sol = mode === "dia";
  const casa = casas[cur];

  const pick = (k: number) => {
    setCur(k);
    setVistas((s) => (s.has(k) ? s : new Set(s).add(k)));
  };

  return (
    <section className="sec pl" id="plantas" aria-labelledby="pl-h" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="pl__col">
          <div className="casa__head" style={{ marginBottom: 32 }}>
            <h2 className="h2" id="pl-h">{t.titulo}</h2>
            <p className="body">{t.texto}</p>
          </div>

          <ul className="pl__sel">
            {casas.map((c, k) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={k === cur}
                  onClick={() => pick(k)}
                  onMouseEnter={() => fine() && pick(k)}
                  onFocus={() => pick(k)}
                >
                  <i>{c.tipo}</i>
                  <b>{c.nome}</b>
                </button>
              </li>
            ))}
          </ul>

          <figure className="pl__quadro" style={{ aspectRatio: `${casa.w}/${casa.h}` }}>
            {casas.map((c, k) => {
              if (!vistas.has(k)) return null;
              return (
                <Planta
                  key={`${c.id}-${sol}`}
                  id={c.id}
                  sol={sol}
                  w={c.w}
                  h={c.h}
                  alt={alt(c.nome)}
                  sizes="(min-width:1180px) 1120px, 92vw"
                  className={k === cur ? "on" : ""}
                  loading="lazy"
                />
              );
            })}
            <span className="pl__tipo">{casa.tipo}</span>
            <button className="pl__lupa" type="button" onClick={() => setZoom("planta")}>
              <Expand />
              {t.ampliar}
            </button>
          </figure>
          <p className="cap">{casa.texto}</p>

          <ul className="specs pl__med">
            {t.ambientes.map((a) => (
              <li className="spec" key={a.nome}>
                <b>
                  {a.m2}
                  <small>m²</small>
                </b>
                <span>de {a.nome.toLowerCase()}</span>
              </li>
            ))}
            <li className={`spec${casa.gourmet ? " spec--lamp" : ""}`}>
              <b>
                {casa.gourmet ?? casa.quintal}
                <small>m²</small>
              </b>
              <span>{casa.gourmet ? "de espaço gourmet" : "de quintal"}</span>
            </li>
          </ul>

          <div className="cond pl__mapa">
            <figure className={`pl__impl${rua ? ` is-focus on-${rua}` : ""}`}>
              <Planta id={t.mapa.img} w={t.mapa.w} h={t.mapa.h} alt={t.mapaAlt} sizes="(min-width:960px) 56vw, 92vw" loading="lazy" />
              <button className="pl__lupa" type="button" onClick={() => setZoom("mapa")}>
                <Expand />
                {t.ampliar}
              </button>
              <span className="pl__ov" aria-hidden>
                {t.ruas.map((r) =>
                  r.areas.map(([x, y, w, h], i) => (
                    <b
                      key={`${r.id}-${i}`}
                      data-rua={r.id}
                      style={{
                        ["--c" as string]: COR[r.id],
                        left: `${x * 100}%`,
                        top: `${y * 100}%`,
                        width: `${w * 100}%`,
                        height: `${h * 100}%`,
                      }}
                    />
                  )),
                )}
              </span>
            </figure>
            <div style={{ display: "grid", gap: 24, alignContent: "center" }}>
              <h3 className="h2" id="pl-mapa-h">{t.mapaTitulo}</h3>
              <p className="body">{t.mapaTexto}</p>
              <ul className="pl__ruas" onMouseLeave={() => setRua(null)}>
                {t.ruas.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      aria-pressed={rua === r.id}
                      onMouseEnter={() => setRua(r.id)}
                      onFocus={() => setRua(r.id)}
                      onClick={() => setRua(r.id)}
                    >
                      <b>{r.nome}</b>
                      <em>{r.lotes}</em>
                      <span>{r.casas}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="cap" style={{ marginTop: 0 }}>{t.mapaNota}</p>
              <div>
                <a className="btn btn--line" href={site.simuladorUrl} target="_blank" rel="noopener">
                  {t.cta}
                </a>
              </div>
            </div>
          </div>

          <p className="pl__legal">{t.legal} {copy.rodape.legal}</p>
        </div>
      </div>

      <PlantaCheia
        aberto={zoom !== null}
        onFechar={() => setZoom(null)}
        titulo={zoom === "mapa" ? t.mapaTitulo : casa.nome}
        legenda={zoom === "mapa" ? t.mapaNota : casa.texto}
        src={zoom === "mapa" ? plantaSrc(t.mapa.img, false, 1500) : plantaSrc(casa.id, sol, 2200)}
        alt={zoom === "mapa" ? t.mapaAlt : alt(casa.nome)}
      />
    </section>
  );
}

type CheiaProps = { aberto: boolean; onFechar: () => void; titulo: string; legenda: string; src: string; alt: string };

/** A planta inteira sobre um véu escuro. Fecha no X, no Esc e clicando fora. */
function PlantaCheia({ aberto, onFechar, titulo, legenda, src, alt }: CheiaProps) {
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    else if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={dlg}
      className="lbx pl__cheia"
      aria-label={titulo}
      onClose={onFechar}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("img,button")) dlg.current?.close();
      }}
    >
      <div className="lbx__top">
        <p className="lbx__name">{titulo}</p>
        <button className="lbx__btn" type="button" aria-label="Fechar" onClick={() => dlg.current?.close()}>
          <Close />
        </button>
      </div>
      <div className="lbx__stage">
        <figure className="lbx__fig" tabIndex={-1}>
          {aberto && <img src={src} alt={alt} />}
          <figcaption className="lbx__cap">{legenda}</figcaption>
        </figure>
      </div>
    </dialog>
  );
}
