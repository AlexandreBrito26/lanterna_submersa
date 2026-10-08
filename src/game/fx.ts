import { Application, Graphics } from "pixi.js";
import { palette } from "./theme";

import { reduzMovimento } from "./acessibilidade";
export { reduzMovimento };

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

// Feixes de luz que descem da superfície
export function criarRaios(app: Application, W: number, H: number) {
  const g = new Graphics();
  app.stage.addChild(g);
  return (t: number) => {
    const mov = reduzMovimento() ? 0 : 1;
    g.clear();
    for (let i = 0; i < 4; i++) {
      const x = (W * (i + 0.5)) / 4 + Math.sin(t * 0.0004 + i * 1.7) * 30 * mov;
      g.poly([x - 14, 0, x + 14, 0, x + 90 + Math.sin(t * 0.0006 + i) * 20 * mov, H, x + 30, H])
        .fill({ color: palette.lanterna, alpha: 0.045 });
    }
  };
}

// Rastro de bolhas que o jogador deixa ao nadar
export function criarRastro(app: Application, cor: number, n = 14) {
  const g = new Graphics();
  app.stage.addChild(g);
  const pts: { x: number; y: number }[] = [];
  return (x: number, y: number) => {
    pts.push({ x, y });
    if (pts.length > n) pts.shift();
    g.clear();
    pts.forEach((p, i) => {
      const k = i / pts.length;
      g.circle(p.x, p.y, 2 + k * 5).fill({ color: cor, alpha: k * 0.25 });
    });
  };
}

// Halo quente e pulsante ao redor da lanterna
export function desenharHalo(g: Graphics, x: number, y: number, r: number, t: number) {
  const mov = reduzMovimento() ? 0 : 1;
  g.clear();
  for (let i = 5; i >= 1; i--) {
    g.circle(x, y, ((r * i) / 5) * (1 + 0.06 * Math.sin(t * 0.004) * mov)).fill({ color: palette.lanterna, alpha: 0.055 });
  }
}

// Vibração curta no celular (ignorada onde não existe ou com movimento reduzido)
export function vibrar(ms: number | number[]) {
  if (reduzMovimento()) return;
  try { navigator.vibrate?.(ms); } catch { /* sem suporte */ }
}

// Mergulhador em pixel art (capacete de latão, traje cinza, lanterna âmbar na mão)
const grade = [
  "..HHHHHH..",
  ".HhhhhhhH.",
  ".HhwwwwhH.",
  ".HhwwwwhH.",
  ".HhhhhhhH.",
  "..HHHHHH..",
  "..ssssss..",
  ".dssssssdl",
  ".dssssssdL",
  "..ssssss.L",
  "..ss..ss..",
  "..bb..bb..",
];
const coresGrade: Record<string, number> = {
  H: 0xa67c52, h: 0xbf9b30, w: 0x6fd6d0, s: 0x8c9ca0, d: 0x4b5a5e, b: 0x2a3539, l: 0xe0ac69, L: 0xffbf00,
};
export function criarMergulhador(px = 2.2): Graphics {
  const g = new Graphics();
  grade.forEach((linha, y) => [...linha].forEach((c, x) => {
    const cor = coresGrade[c];
    if (cor !== undefined) g.rect((x - 5) * px, (y - 6) * px, px, px).fill(cor);
  }));
  return g;
}
