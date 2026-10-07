import { Application } from "pixi.js";
import { palette } from "./theme";

export const W = 360, H = 640;

export async function criarApp(host: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    width: W, height: H, background: palette.abismo, antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
  });
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  app.canvas.style.touchAction = "none";
  host.appendChild(app.canvas);
  return app;
}

// Teclado + toque/arraste. Devolve o vetor de movimento desejado a cada quadro.
export function criarControle(canvas: HTMLCanvasElement, inicio: { x: number; y: number }, extra?: (k: string) => void) {
  const teclas = new Set<string>();
  const alvo = { ...inicio };
  const kd = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); teclas.add(k); extra?.(k); };
  const ku = (e: KeyboardEvent) => teclas.delete(e.key.toLowerCase());
  const ponto = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    alvo.x = ((e.clientX - r.left) / r.width) * W;
    alvo.y = ((e.clientY - r.top) / r.height) * H;
  };
  const down = (e: PointerEvent) => ponto(e);
  const move = (e: PointerEvent) => { if (e.buttons) ponto(e); };
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);

  return {
    alvo,
    /** Retorna [vx, vy] para a velocidade dada e mantém o alvo sincronizado com o teclado. */
    vetor(pos: { x: number; y: number }, vel: number): [number, number] {
      let dx = 0, dy = 0;
      if (teclas.has("arrowleft") || teclas.has("a")) dx -= 1;
      if (teclas.has("arrowright") || teclas.has("d")) dx += 1;
      if (teclas.has("arrowup") || teclas.has("w")) dy -= 1;
      if (teclas.has("arrowdown") || teclas.has("s")) dy += 1;
      if (dx || dy) {
        const n = Math.hypot(dx, dy);
        alvo.x = pos.x; alvo.y = pos.y;
        return [(dx / n) * vel, (dy / n) * vel];
      }
      const ax = alvo.x - pos.x, ay = alvo.y - pos.y, d = Math.hypot(ax, ay);
      return d > vel ? [(ax / d) * vel, (ay / d) * vel] : [0, 0];
    },
    destruir() {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
    },
  };
}

// Camada de escuridão com furos de luz (Canvas 2D sobre o Pixi)
export function criarEscuridao(canvas: HTMLCanvasElement, opacidade = 0.95) {
  const ctx = canvas.getContext("2d")!;
  return {
    limpar() {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(10,26,31,${opacidade})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "destination-out";
    },
    furo(x: number, y: number, raio: number, forca = 1) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, raio);
      g.addColorStop(0, `rgba(0,0,0,${forca})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2);
    },
  };
}
