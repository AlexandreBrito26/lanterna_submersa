import { useEffect, useRef } from "react";
import { reduzMovimento } from "../game/fx";

type Cam = { c: HTMLCanvasElement; fator: number; drift: number };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// Cidade afundada em camadas, desenhada uma vez por camada
function camada(w: number, h: number, base: number, alt: number, cor: string, torres: boolean): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * 1.4); c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = cor;
  let x = 0;
  while (x < c.width) {
    const bw = rnd(26, 60), bh = rnd(alt * 0.3, alt);
    g.fillRect(x, base - bh, bw, bh + h);
    if (torres && Math.random() < 0.35) { // telhado pontudo
      g.beginPath(); g.moveTo(x - 3, base - bh); g.lineTo(x + bw / 2, base - bh - rnd(30, 70)); g.lineTo(x + bw + 3, base - bh); g.fill();
    } else if (torres && Math.random() < 0.15) { // cúpula
      g.beginPath(); g.ellipse(x + bw / 2, base - bh, bw / 2, bw * 0.55, 0, Math.PI, 0); g.fill();
    }
    x += bw + rnd(2, 14);
  }
  return c;
}

export default function CenaMenu() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const parado = reduzMovimento();
    let w = 0, h = 0, dpr = 1, raf = 0, camadas: Cam[] = [], janelas: { x: number; y: number; f: number }[] = [];
    const luz = { x: 0, y: 0, tx: 0, ty: 0 };
    const ptr = { x: 0.5 };
    type Bolha = { x: number; y: number; r: number; v: number; f: number };
    let bolhas: Bolha[] = [], plancton: Bolha[] = [], agua: { x: number; y: number; s: number; v: number; cor: string; f: number }[] = [], peixes: { x: number; y: number; v: number; s: number; f: number }[] = [];

    const montar = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      camadas = [
        { c: camada(w, h, h * 0.78, h * 0.16, "rgba(20,70,90,0.45)", true), fator: 12, drift: 4 },
        { c: camada(w, h, h * 0.86, h * 0.2, "rgba(10,36,52,0.8)", true), fator: 26, drift: 8 },
        { c: camada(w, h, h * 0.96, h * 0.14, "rgba(5,16,24,0.97)", false), fator: 46, drift: 14 },
      ];
      janelas = Array.from({ length: 34 }, () => ({ x: rnd(0, w * 1.3), y: rnd(h * 0.74, h * 0.93), f: rnd(0, 6) }));
      bolhas = Array.from({ length: 34 }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(1, 3.5), v: rnd(0.15, 0.6), f: rnd(0, 6) }));
      plancton = Array.from({ length: 70 }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(0.6, 1.6), v: rnd(0.03, 0.15), f: rnd(0, 6) }));
      const cores = ["224,122,95", "242,230,214", "61,139,122", "255,191,0"];
      agua = cores.map((cor, i) => ({ x: rnd(0, w), y: rnd(h * 0.2, h * 0.7), s: rnd(16, 28) - i, v: rnd(0.1, 0.25), cor, f: rnd(0, 6) }));
      peixes = Array.from({ length: 9 }, (_, i) => ({ x: rnd(-w, 0) - i * 20, y: h * 0.42 + rnd(-30, 30), v: rnd(0.35, 0.5), s: rnd(5, 8), f: rnd(0, 6) }));
      luz.x = luz.tx = w * 0.5; luz.y = luz.ty = h * 0.3;
    };

    const quadro = (ms: number) => {
      const t = parado ? 0 : ms;
      // água profunda
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#1b6a80"); bg.addColorStop(0.4, "#0f3347"); bg.addColorStop(1, "#06121b");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // raios de luz vindos da superfície
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 6; i++) {
        const x0 = w * (i / 5) + Math.sin(t * 0.0003 + i * 1.7) * 60;
        const lg = ctx.createLinearGradient(x0, 0, x0 + 90, h * 0.8);
        lg.addColorStop(0, "rgba(255,191,0,0.13)"); lg.addColorStop(1, "rgba(255,191,0,0)");
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(x0 - 20, 0); ctx.lineTo(x0 + 40, 0); ctx.lineTo(x0 + 220 + Math.sin(t * 0.0004 + i) * 40, h * 0.8); ctx.lineTo(x0 + 60, h * 0.8); ctx.fill();
      }

      // luz que segue o dedo
      luz.x += (luz.tx - luz.x) * 0.06; luz.y += (luz.ty - luz.y) * 0.06;
      const rl = 230 + Math.sin(t * 0.002) * 12;
      const lg2 = ctx.createRadialGradient(luz.x, luz.y, 0, luz.x, luz.y, rl);
      lg2.addColorStop(0, "rgba(255,191,0,0.28)"); lg2.addColorStop(1, "rgba(255,191,0,0)");
      ctx.fillStyle = lg2; ctx.fillRect(luz.x - rl, luz.y - rl, rl * 2, rl * 2);
      ctx.globalCompositeOperation = "source-over";

      // peixes ao fundo
      ctx.fillStyle = "rgba(10,36,52,0.7)";
      for (const p of peixes) {
        p.x += p.v * (parado ? 0 : 1); if (p.x > w + 40) p.x = -40;
        const y = p.y + Math.sin(t * 0.002 + p.f) * 6;
        ctx.beginPath(); ctx.ellipse(p.x, y, p.s * 1.6, p.s * 0.7, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x - p.s * 1.4, y); ctx.lineTo(p.x - p.s * 2.4, y - p.s * 0.8); ctx.lineTo(p.x - p.s * 2.4, y + p.s * 0.8); ctx.fill();
      }

      // cidade em paralaxe
      camadas.forEach((l, i) => {
        const off = -((ptr.x - 0.5) * l.fator) - ((t * 0.002 * l.drift) % 40);
        ctx.drawImage(l.c, off - 30, 0);
        if (i === 1) {
          ctx.globalCompositeOperation = "lighter";
          for (const j of janelas) {
            const a = 0.25 + 0.55 * Math.max(0, Math.sin(t * 0.0015 + j.f));
            ctx.fillStyle = `rgba(255,191,0,${a})`;
            ctx.fillRect(j.x + off - 30, j.y, 2.5, 3.5);
          }
          ctx.globalCompositeOperation = "source-over";
        }
      });

      // águas-vivas bioluminescentes
      ctx.globalCompositeOperation = "lighter";
      for (const m of agua) {
        m.y -= m.v * (parado ? 0 : 1); if (m.y < -60) { m.y = h + 60; m.x = rnd(0, w); }
        const x = m.x + Math.sin(t * 0.0008 + m.f) * 30, pulso = 1 + Math.sin(t * 0.003 + m.f) * 0.1;
        const gl = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.s * 3);
        gl.addColorStop(0, `rgba(${m.cor},0.35)`); gl.addColorStop(1, `rgba(${m.cor},0)`);
        ctx.fillStyle = gl; ctx.fillRect(x - m.s * 3, m.y - m.s * 3, m.s * 6, m.s * 6);
        ctx.fillStyle = `rgba(${m.cor},0.55)`;
        ctx.beginPath(); ctx.ellipse(x, m.y, m.s * pulso, m.s * 0.7 / pulso, 0, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = `rgba(${m.cor},0.35)`; ctx.lineWidth = 1.2;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(x + k * m.s * 0.35, m.y);
          for (let s = 1; s <= 6; s++) ctx.lineTo(x + k * m.s * 0.35 + Math.sin(t * 0.004 + s * 0.8 + k) * 4, m.y + s * m.s * 0.28);
          ctx.stroke();
        }
      }

      // plâncton luminoso
      for (const p of plancton) {
        p.y -= p.v * (parado ? 0 : 1); if (p.y < -5) { p.y = h + 5; p.x = rnd(0, w); }
        ctx.fillStyle = `rgba(255,191,0,${0.15 + 0.5 * Math.max(0, Math.sin(t * 0.002 + p.f))})`;
        ctx.beginPath(); ctx.arc(p.x + Math.sin(t * 0.001 + p.f) * 8, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // bolhas
      ctx.strokeStyle = "rgba(242,230,214,0.35)"; ctx.lineWidth = 1;
      for (const b of bolhas) {
        b.y -= b.v * (parado ? 0 : 1); if (b.y < -6) { b.y = h + 6; b.x = rnd(0, w); }
        ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 0.002 + b.f) * 7, b.y, b.r, 0, 7); ctx.stroke();
      }

      // vinheta
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
      vg.addColorStop(0, "rgba(6,18,27,0)"); vg.addColorStop(1, "rgba(6,18,27,0.7)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      if (!parado) raf = requestAnimationFrame(quadro);
    };

    const mover = (e: PointerEvent) => { ptr.x = e.clientX / w; luz.tx = e.clientX; luz.ty = e.clientY; };
    montar();
    raf = requestAnimationFrame(quadro);
    window.addEventListener("resize", montar);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerdown", mover);
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !parado) raf = requestAnimationFrame(quadro); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", montar);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", mover);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
