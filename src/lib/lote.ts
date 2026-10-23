// Animação "do alto" da seção de plantas: o condomínio aproxima até o lote 21, o lote gira e
// vira a planta, e a planta pousa no quadro. render(p) recebe o progresso de 0 a 1.

// centro e altura do lote 21 em fração da implantação (content/plantas.json, mapa)
const FX = 0.303;
const FY = 0.29;
const LOTE = 0.14;

export type Rect = { x: number; y: number; w: number; h: number };

const cl = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => cl((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Onde a planta fica dentro do quadro (object-fit: contain, alinhada embaixo à esquerda). */
export function contain(fig: HTMLElement, c: { w: number; h: number }): Rect {
  const k = Math.min(fig.clientWidth / c.w, fig.clientHeight / c.h);
  const w = c.w * k;
  const h = c.h * k;
  return { x: 0, y: fig.clientHeight - h, w, h };
}

type Opts = { box: HTMLElement; map: HTMLElement; fly: HTMLElement; mapRatio: number; target: () => Rect };

export function engine({ box, map, fly, mapRatio, target }: Opts) {
  return (p: number) => {
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    const T = target();
    const W = Math.min(bw * 0.92, (bh * 0.86) / mapRatio);
    const H = W * mapRatio;
    // altura do lote na tela no fim do zoom = altura da planta girada no começo do pouso
    const T0 = Math.min(bh * 0.62, bw * 0.55);
    const t = ease(seg(p, 0, 0.42));
    const s = Math.pow(Math.max(1, T0 / (LOTE * H)), t);
    const px = lerp((bw - W) / 2 + FX * W, bw / 2, t);
    const py = lerp((bh - H) / 2 + FY * H, bh / 2, t);
    map.style.width = `${W}px`;
    map.style.transform = `translate(${px - FX * W * s}px,${py - FY * H * s}px) scale(${s})`;

    const f = seg(p, 0.36, 0.5);
    const g = ease(seg(p, 0.45, 0.88));
    map.style.opacity = String(1 - f);
    fly.style.opacity = String(f);
    const cx = lerp(bw / 2, T.x + T.w / 2, g);
    const cy = lerp(bh / 2, T.y + T.h / 2, g);
    fly.style.width = `${T.w}px`;
    fly.style.transform = `translate(${cx - T.w / 2}px,${cy - T.h / 2}px) rotate(${-90 * (1 - g)}deg) scale(${lerp(T0 / T.w, 1, g)})`;
  };
}

/** Toca o progresso no tempo. Devolve a função que cancela. */
export function play(render: (p: number) => void, de: number, ate: number, ms: number, done?: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ms = 1;
  const t0 = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const k = cl((now - t0) / ms);
    render(lerp(de, ate, k));
    if (k < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
