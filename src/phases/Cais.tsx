import { useEffect, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";
import { palette } from "../game/theme";
import { useGame } from "../store/useGame";
import { audio } from "../game/audio";
import { criarBolhas, reduzMovimento } from "../game/fx";

const W = 360, H = 640, SPEED = 2.4, LUZ = 120, ALCANCE = 36;

type Objeto = { id: "poste" | "caixa" | "porta"; x: number; y: number; cor: number };
const objetos: Objeto[] = [
  { id: "poste", x: 70, y: 470, cor: palette.coral },
  { id: "caixa", x: 280, y: 300, cor: palette.alga },
  { id: "porta", x: 180, y: 90, cor: palette.mare },
];

export default function Cais() {
  const host = useRef<HTMLDivElement>(null);
  const escuro = useRef<HTMLCanvasElement>(null);
  const [msg, setMsg] = useState("Toque ou arraste para andar. Chegue perto de algo e use Interagir.");
  const { inventory, giveItem, complete, leave } = useGame();
  const acaoRef = useRef<() => void>();
  const inv = useRef(inventory);
  inv.current = inventory;

  useEffect(() => {
    const app = new Application();
    const pos = { x: 180, y: 560 };
    const alvo = { x: 180, y: 560 };
    const teclas = new Set<string>();
    let morto = false;

    const kd = (e: KeyboardEvent) => teclas.add(e.key.toLowerCase());
    const ku = (e: KeyboardEvent) => teclas.delete(e.key.toLowerCase());
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const interagir = (o: Objeto) => {
      if (o.id === "poste") { audio.sfx.interagir(); setMsg("O poste ainda guarda um resto de calor. Algo se acende em você."); }
      if (o.id === "caixa") {
        if (!inv.current.includes("chave-do-cais")) audio.sfx.coletar();
        giveItem("chave-do-cais");
        setMsg("Dentro da caixa há uma chave coberta de sal.");
      }
      if (o.id === "porta") {
        if (inv.current.includes("chave-do-cais")) { audio.sfx.porta(); audio.sfx.vitoria(); complete("cais"); }
        else { audio.sfx.erro(); setMsg("A porta está trancada. Procure uma chave."); }
      }
    };

    const agir = () => {
      const o = objetos.find((o) => Math.hypot(o.x - pos.x, o.y - pos.y) < ALCANCE);
      if (o) interagir(o); else setMsg("Nada ao alcance. Chegue mais perto de algo.");
    };
    acaoRef.current = agir;
    const onAct = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === " ") agir();
    };
    window.addEventListener("keydown", onAct);

    (async () => {
      await app.init({ width: W, height: H, background: palette.abismo, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
      if (morto) { app.destroy(true); return; }
      host.current!.appendChild(app.canvas);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.touchAction = "none";

      const cenario = new Graphics();
      cenario.rect(0, 0, W, H).fill(palette.mare).rect(0, 380, W, 260).fill(palette.abismo);
      objetos.forEach((o) => {
        if (o.id === "poste") {
          cenario.rect(o.x - 3, o.y - 26, 6, 48).fill(palette.coral);
          cenario.circle(o.x, o.y - 30, 9).fill(palette.lanterna);
        }
        if (o.id === "caixa") {
          cenario.roundRect(o.x - 17, o.y - 12, 34, 26, 4).fill(palette.alga);
          cenario.rect(o.x - 17, o.y - 2, 34, 3).fill(palette.abismo);
          cenario.circle(o.x, o.y + 2, 3).fill(palette.lanterna);
        }
        if (o.id === "porta") {
          cenario.roundRect(o.x - 20, o.y - 30, 40, 56, 18).fill(palette.abismo).stroke({ color: palette.lanterna, width: 2, alpha: 0.7 });
          cenario.circle(o.x + 10, o.y, 2.5).fill(palette.lanterna);
        }
      });
      app.stage.addChild(cenario);
      const ondas = new Graphics();
      app.stage.addChild(ondas);
      const bolhas = criarBolhas(app, W, H, 16, palette.espuma);

      const jogador = new Graphics().circle(0, 0, 10).fill(palette.espuma);
      app.stage.addChild(jogador);

      const ctx = escuro.current!.getContext("2d")!;

      app.ticker.add(() => {
        const t = performance.now();
        const mov = reduzMovimento() ? 0 : 1;
        bolhas(t);
        ondas.clear();
        for (const [y, a] of [[380, 0.5], [396, 0.3]] as const) {
          ondas.moveTo(0, y);
          for (let x = 0; x <= W; x += 12) ondas.lineTo(x, y + Math.sin(x * 0.04 + t * 0.002) * 3 * mov);
          ondas.stroke({ color: palette.espuma, width: 1.5, alpha: a });
        }
        let dx = 0, dy = 0;
        if (teclas.has("arrowleft") || teclas.has("a")) dx -= 1;
        if (teclas.has("arrowright") || teclas.has("d")) dx += 1;
        if (teclas.has("arrowup") || teclas.has("w")) dy -= 1;
        if (teclas.has("arrowdown") || teclas.has("s")) dy += 1;
        if (dx || dy) {
          pos.x += dx * SPEED; pos.y += dy * SPEED;
          alvo.x = pos.x; alvo.y = pos.y;
        } else {
          const vx = alvo.x - pos.x, vy = alvo.y - pos.y, d = Math.hypot(vx, vy);
          if (d > SPEED) { pos.x += (vx / d) * SPEED; pos.y += (vy / d) * SPEED; }
        }
        pos.x = Math.max(10, Math.min(W - 10, pos.x));
        pos.y = Math.max(10, Math.min(H - 10, pos.y));
        jogador.position.set(pos.x, pos.y);

        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(11,29,42,0.94)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "destination-out";
        const g = ctx.createRadialGradient(pos.x, pos.y, 8, pos.x, pos.y, LUZ + Math.sin(t * 0.006) * 5 * mov);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        for (const o of objetos) {
          const h = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 34);
          h.addColorStop(0, "rgba(0,0,0,0.55)");
          h.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = h;
          ctx.fillRect(o.x - 34, o.y - 34, 68, 68);
        }
      });

      app.canvas.addEventListener("pointerdown", (e) => {
        const r = app.canvas.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * W;
        const y = ((e.clientY - r.top) / r.height) * H;
        alvo.x = x; alvo.y = y;
        const o = objetos.find((o) => Math.hypot(o.x - x, o.y - y) < 28);
        if (o && Math.hypot(o.x - pos.x, o.y - pos.y) < ALCANCE + 20) interagir(o);
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
      window.removeEventListener("keydown", onAct);
      if (app.renderer) app.destroy(true);
    };
  }, [giveItem, complete]);

  return (
    <div className="flex h-full flex-col items-center gap-3 p-3">
      <div className="flex w-full max-w-sm items-center justify-between">
        <h2 className="font-narrativa text-2xl text-lanterna">Cais Afundado</h2>
        <button onClick={leave} className="text-sm text-espuma/70 underline">Voltar</button>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-mare" style={{ width: "min(100%, calc(60dvh * 9 / 16))", aspectRatio: "9 / 16" }}>
        <div ref={host} className="absolute inset-0" />
        <canvas ref={escuro} width={W} height={H} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
      <button onClick={() => acaoRef.current?.()} className="rounded-lg border border-lanterna px-6 py-2 text-lanterna">Interagir</button>
      <p className="max-w-sm text-center font-narrativa text-base text-espuma/90" role="status">{msg}</p>
    </div>
  );
}
