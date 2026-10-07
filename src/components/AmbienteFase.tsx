import { useEffect, useRef } from "react";
import { reduzMovimento } from "../game/fx";

export type TipoAmbiente = "biblioteca" | "catedral" | "coracao";

const temas: Record<TipoAmbiente, { fundo: [string, string, string]; motas: string[]; paginas: boolean }> = {
  biblioteca: { fundo: ["#16505f", "#0f3347", "#06121b"], motas: ["255,191,0", "242,230,214"], paginas: true },
  catedral:   { fundo: ["#123552", "#0b2236", "#050f18"], motas: ["224,122,95", "255,191,0", "61,139,122", "242,230,214"], paginas: false },
  coracao:    { fundo: ["#1b4a5c", "#0d2a3b", "#05101a"], motas: ["255,191,0", "255,191,0", "224,122,95"], paginas: false },
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// Fundo vivo para as fases que não usam Pixi: raios, partículas, bolhas e, por tema, páginas ao vento ou pulso de luz
export default function AmbienteFase({ tipo }: { tipo: TipoAmbiente }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const tema = temas[tipo];
    const parado = reduzMovimento();
    let w = 0, h = 0, raf = 0;
    type P = { x: number; y: number; r: number; v: number; f: number; cor: string; rot: number };
    let motas: P[] = [], bolhas: P[] = [], paginas: P[] = [];

    const montar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mk = (n: number, r: [number, number], v: [number, number]) =>
        Array.from({ length: n }, (): P => ({
          x: rnd(0, w), y: rnd(0, h), r: rnd(...r), v: rnd(...v), f: rnd(0, 6), rot: rnd(0, 6),
          cor: tema.motas[Math.floor(Math.random() * tema.motas.length)],
        }));
      motas = mk(60, [0.6, 1.8], [0.03, 0.18]);
      bolhas = mk(22, [1, 3.5], [0.2, 0.6]);
      paginas = tema.paginas ? mk(9, [9, 16], [0.1, 0.3]) : [];
    };

    const quadro = (ms: number) => {
      const t = parado ? 0 : ms;
      const mov = parado ? 0 : 1;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, tema.fundo[0]); bg.addColorStop(0.45, tema.fundo[1]); bg.addColorStop(1, tema.fundo[2]);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      // raios vindos de cima
      for (let i = 0; i < 5; i++) {
        const x0 = w * (i / 4) + Math.sin(t * 0.00035 + i * 1.7) * 50;
        const g = ctx.createLinearGradient(x0, 0, x0 + 80, h * 0.75);
        g.addColorStop(0, `rgba(${tema.motas[i % tema.motas.length]},0.1)`); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x0 - 18, 0); ctx.lineTo(x0 + 34, 0); ctx.lineTo(x0 + 210, h * 0.75); ctx.lineTo(x0 + 50, h * 0.75); ctx.fill();
      }
      // pulso de luz no fundo (Coração)
      if (tipo === "coracao") {
        const k = 0.5 + 0.5 * Math.sin(t * 0.0022);
        const r = Math.min(w, h) * (0.55 + k * 0.1);
        const g = ctx.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.62, r);
        g.addColorStop(0, `rgba(255,191,0,${0.2 + k * 0.12})`); g.addColorStop(1, "rgba(255,191,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      // partículas luminosas
      for (const p of motas) {
        p.y -= p.v * mov; if (p.y < -5) { p.y = h + 5; p.x = rnd(0, w); }
        ctx.fillStyle = `rgba(${p.cor},${0.15 + 0.5 * Math.max(0, Math.sin(t * 0.002 + p.f))})`;
        ctx.beginPath(); ctx.arc(p.x + Math.sin(t * 0.001 + p.f) * 9, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // páginas flutuando (Biblioteca)
      for (const p of paginas) {
        p.y -= p.v * mov; if (p.y < -30) { p.y = h + 30; p.x = rnd(0, w); }
        const x = p.x + Math.sin(t * 0.0007 + p.f) * 40;
        ctx.save(); ctx.translate(x, p.y); ctx.rotate(Math.sin(t * 0.0008 + p.rot) * 0.8);
        ctx.fillStyle = "rgba(242,230,214,0.16)"; ctx.fillRect(-p.r * 0.7, -p.r, p.r * 1.4, p.r * 2);
        ctx.strokeStyle = "rgba(255,191,0,0.28)"; ctx.lineWidth = 1;
        for (let l = -2; l <= 2; l++) { ctx.beginPath(); ctx.moveTo(-p.r * 0.45, l * p.r * 0.3); ctx.lineTo(p.r * 0.45, l * p.r * 0.3); ctx.stroke(); }
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(242,230,214,0.3)"; ctx.lineWidth = 1;
      for (const b of bolhas) {
        b.y -= b.v * mov; if (b.y < -6) { b.y = h + 6; b.x = rnd(0, w); }
        ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 0.002 + b.f) * 6, b.y, b.r, 0, 7); ctx.stroke();
      }
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(6,18,27,0)"); vg.addColorStop(1, "rgba(6,18,27,0.65)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      if (!parado) raf = requestAnimationFrame(quadro);
    };

    montar();
    raf = requestAnimationFrame(quadro);
    window.addEventListener("resize", montar);
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !parado) raf = requestAnimationFrame(quadro); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", montar);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [tipo]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
