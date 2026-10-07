import { useEffect, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";
import { palette } from "../game/theme";
import { useGame } from "../store/useGame";
import { audio } from "../game/audio";
import { criarBolhas, reduzMovimento } from "../game/fx";
import { configAtual } from "../game/dificuldade";

const W = 360, H = 640, SPEED = 2.2, R = 8;
const INICIO = { x: 180, y: 600 };
const SAIDA = { x: 180, y: 50 };
const LUZ_ACESA = 120, LUZ_APAGADA = 42;
const VISAO_ACESA = 90;

// [x, y, largura, altura]: fileiras de coral com passagens alternadas
const corais: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 450, 200, 40], [160, 330, 200, 40], [0, 210, 200, 40], [160, 110, 200, 40],
];
const enguiasIniciais = [
  { x: 60, y: 540, v: 1.6, d: 1 },
  { x: 300, y: 410, v: 1.2, d: -1 },
  { x: 150, y: 290, v: 1.9, d: 1 },
  { x: 240, y: 180, v: 1.4, d: -1 },
];

const bate = (x: number, y: number) =>
  corais.some(([cx, cy, cw, ch]) => {
    const nx = Math.max(cx, Math.min(x, cx + cw));
    const ny = Math.max(cy, Math.min(y, cy + ch));
    return Math.hypot(x - nx, y - ny) < R;
  });

export default function Jardins() {
  const host = useRef<HTMLDivElement>(null);
  const escuro = useRef<HTMLCanvasElement>(null);
  const acesa = useRef(true);
  const [aceso, setAceso] = useState(true);
  const [msg, setMsg] = useState("Apague a lanterna perto das enguias. Sem luz, elas quase não notam você.");
  const { giveItem, complete, leave } = useGame();

  const alternar = () => {
    acesa.current = !acesa.current;
    setAceso(acesa.current);
    audio.sfx.interagir();
  };

  useEffect(() => {
    const app = new Application();
    const pos = { ...INICIO };
    const alvo = { ...INICIO };
    const teclas = new Set<string>();
    const cfg = configAtual();
    const enguias = enguiasIniciais.map((e) => ({ ...e, v: e.v * cfg.enguiaVel }));
    let luz = LUZ_ACESA;
    let graca = 0;
    let fim = false;
    let morto = false;

    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "l") { acesa.current = !acesa.current; setAceso(acesa.current); audio.sfx.interagir(); }
      teclas.add(k);
    };
    const ku = (e: KeyboardEvent) => teclas.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    (async () => {
      await app.init({ width: W, height: H, background: palette.abismo, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
      if (morto) { app.destroy(true); return; }
      host.current!.appendChild(app.canvas);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.touchAction = "none";

      const cenario = new Graphics();
      cenario.rect(0, 0, W, H).fill(palette.mare);
      corais.forEach(([x, y, w, h]) => cenario.roundRect(x, y, w, h, 12).fill({ color: palette.alga, alpha: 0.75 }));
      cenario.circle(SAIDA.x, SAIDA.y, 20).fill(palette.lanterna);
      app.stage.addChild(cenario);
      const ramos = new Graphics();
      app.stage.addChild(ramos);
      const bolhas = criarBolhas(app, W, H, 18, palette.espuma);

      const aneis = new Graphics();
      app.stage.addChild(aneis);
      const corpos = enguias.map(() => {
        const g = new Graphics().ellipse(0, 0, 22, 7).fill(palette.coral);
        app.stage.addChild(g);
        return g;
      });
      const jogador = new Graphics().circle(0, 0, R).fill(palette.espuma);
      app.stage.addChild(jogador);

      const ctx = escuro.current!.getContext("2d")!;
      const furo = (x: number, y: number, raio: number, forca = 1) => {
        const g = ctx.createRadialGradient(x, y, 2, x, y, raio);
        g.addColorStop(0, `rgba(0,0,0,${forca})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - raio, y - raio, raio * 2, raio * 2);
      };

      app.ticker.add(() => {
        if (fim) return;
        const t = performance.now();
        const mov = reduzMovimento() ? 0 : 1;
        bolhas(t);
        ramos.clear();
        for (const [cx, cy, cw] of corais) {
          for (let x = cx + 10; x < cx + cw; x += 14) {
            const bal = Math.sin(t * 0.002 + x * 0.1) * 4 * mov;
            ramos.moveTo(x, cy + 4).lineTo(x + bal, cy - 12).stroke({ color: palette.alga, width: 3, alpha: 0.7 });
          }
        }
        let dx = 0, dy = 0;
        if (teclas.has("arrowleft") || teclas.has("a")) dx -= 1;
        if (teclas.has("arrowright") || teclas.has("d")) dx += 1;
        if (teclas.has("arrowup") || teclas.has("w")) dy -= 1;
        if (teclas.has("arrowdown") || teclas.has("s")) dy += 1;
        let vx = dx * SPEED, vy = dy * SPEED;
        if (!dx && !dy) {
          const ax = alvo.x - pos.x, ay = alvo.y - pos.y, d = Math.hypot(ax, ay);
          if (d > SPEED) { vx = (ax / d) * SPEED; vy = (ay / d) * SPEED; }
        } else { alvo.x = pos.x; alvo.y = pos.y; }
        if (!bate(pos.x + vx, pos.y)) pos.x += vx;
        if (!bate(pos.x, pos.y + vy)) pos.y += vy;
        pos.x = Math.max(R, Math.min(W - R, pos.x));
        pos.y = Math.max(R, Math.min(H - R, pos.y));
        jogador.position.set(pos.x, pos.y);

        const visao = acesa.current ? VISAO_ACESA : cfg.visaoApagada;
        aneis.clear();
        enguias.forEach((e, i) => {
          e.x += e.v * e.d;
          if (e.x < 25 || e.x > W - 25) e.d *= -1;
          corpos[i].position.set(e.x, e.y);
          corpos[i].scale.x = e.d;
          corpos[i].scale.y = 1 + 0.18 * Math.sin(t * 0.01 + i) * mov;
          corpos[i].rotation = 0.12 * Math.sin(t * 0.004 + i) * mov;
          aneis.circle(e.x, e.y, visao).stroke({ color: palette.coral, width: 1, alpha: 0.3 });
          if (graca <= 0 && Math.hypot(e.x - pos.x, e.y - pos.y) < visao) {
            audio.sfx.erro();
            setMsg("Uma enguia viu você. Volte ao início e tente com a lanterna apagada.");
            pos.x = alvo.x = INICIO.x; pos.y = alvo.y = INICIO.y;
            graca = 90;
          }
        });
        if (graca > 0) graca--;

        if (Math.hypot(SAIDA.x - pos.x, SAIDA.y - pos.y) < 24) {
          fim = true;
          audio.sfx.porta();
          audio.sfx.vitoria();
          giveItem("perola-de-coral");
          setMsg("O arco se abre. Uma pérola de coral brilha na entrada.");
          setTimeout(() => complete("jardins"), 1600);
        }

        luz += ((acesa.current ? LUZ_ACESA : LUZ_APAGADA) - luz) * 0.12;
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(11,29,42,0.95)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "destination-out";
        furo(pos.x, pos.y, luz);
        enguias.forEach((e) => furo(e.x, e.y, 34, 0.9));
        furo(SAIDA.x, SAIDA.y, 56 + Math.sin(t * 0.004) * 6 * mov, 0.9);
      });

      app.canvas.addEventListener("pointerdown", (e) => {
        const r = app.canvas.getBoundingClientRect();
        alvo.x = ((e.clientX - r.left) / r.width) * W;
        alvo.y = ((e.clientY - r.top) / r.height) * H;
      });
      app.canvas.addEventListener("pointermove", (e) => {
        if (!e.buttons) return;
        const r = app.canvas.getBoundingClientRect();
        alvo.x = ((e.clientX - r.left) / r.width) * W;
        alvo.y = ((e.clientY - r.top) / r.height) * H;
      });
    })();

    return () => {
      morto = true;
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      if (app.renderer) app.destroy(true);
    };
  }, [giveItem, complete]);

  return (
    <div className="flex h-full flex-col items-center gap-3 p-3">
      <div className="flex w-full max-w-sm items-center justify-between">
        <h2 className="font-narrativa text-2xl text-lanterna">Jardins de Coral</h2>
        <button onClick={leave} className="text-sm text-espuma/70 underline">Voltar</button>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-mare" style={{ width: "min(100%, calc(56dvh * 9 / 16))", aspectRatio: "9 / 16" }}>
        <div ref={host} className="absolute inset-0" />
        <canvas ref={escuro} width={W} height={H} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
      <button
        onClick={alternar}
        aria-pressed={!aceso}
        className="rounded-lg border border-lanterna px-5 py-2 text-lanterna"
      >
        {aceso ? "Apagar lanterna (L)" : "Acender lanterna (L)"}
      </button>
      <p className="max-w-sm text-center font-narrativa text-base text-espuma/90" role="status">{msg}</p>
    </div>
  );
}
