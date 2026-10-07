import { Application, Graphics } from "pixi.js";

export const reduzMovimento = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Bolhas que sobem devagar. Devolve a função que deve ser chamada a cada quadro.
export function criarBolhas(app: Application, W: number, H: number, qtd: number, cor: number) {
  const g = new Graphics();
  app.stage.addChild(g);
  const bolhas = Array.from({ length: qtd }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 1 + Math.random() * 2.5, v: 0.2 + Math.random() * 0.5, f: Math.random() * 6,
  }));
  return (t: number) => {
    const mov = !reduzMovimento();
    g.clear();
    for (const b of bolhas) {
      if (mov) {
        b.y -= b.v;
        if (b.y < -5) { b.y = H + 5; b.x = Math.random() * W; }
      }
      const x = b.x + (mov ? Math.sin(t * 0.002 + b.f) * 6 : 0);
      g.circle(x, b.y, b.r).stroke({ color: cor, width: 1, alpha: 0.35 });
    }
  };
}
