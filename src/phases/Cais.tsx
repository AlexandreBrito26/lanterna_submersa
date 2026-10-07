import { useEffect, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";
import { resolucaoIdeal } from "../game/pixiBase";
import { palette } from "../game/theme";
import { useGame } from "../store/useGame";
import { audio } from "../game/audio";
import { criarBolhas, criarMergulhador, criarRaios, criarRastro, desenharHalo, reduzMovimento } from "../game/fx";
import Cabecalho from "../components/Cabecalho";
import Tela from "../components/Tela";

const W = 360, H = 640, SPEED = 2.4, LUZ = 120, ALCANCE = 36;

type Objeto = { id: "poste" | "caixa" | "porta"; x: number; y: number; cor: number };
const objetos: Objeto[] = [
  { id: "poste", x: 70, y: 470, cor: palette.coral },
  { id: "caixa", x: 280, y: 300, cor: palette.alga },
  { id: "porta", x: 180, y: 90, cor: palette.mare },
];

const conchasIniciais = [[40, 560], [310, 450], [60, 200]] as const;

export default function Cais() {
  const host = useRef<HTMLDivElement>(null);
  const escuro = useRef<HTMLCanvasElement>(null);
  const [msg, setMsg] = useState("Toque ou arraste para andar. Chegue perto de algo e use Interagir. Longe de tudo, Interagir emite um eco que revela as conchas.");
  const { inventory, giveItem, complete } = useGame();
  const acaoRef = useRef<() => void>();
  const [conchasN, setConchasN] = useState(0);
  const inv = useRef(inventory);
  inv.current = inventory;

  useEffect(() => {
    const app = new Application();
    const pos = { x: 180, y: 560 };
    const alvo = { x: 180, y: 560 };
    const teclas = new Set<string>();
    let morto = false;
    const inicioT = performance.now();
    const conchas = conchasIniciais.map(([x, y]) => ({ x, y, ok: false }));
    let ping = -9999;
    const pingPos = { x: 0, y: 0 };

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
        if (inv.current.includes("chave-do-cais")) { audio.sfx.porta(); audio.sfx.vitoria();
          const achadas = conchas.filter((c) => c.ok).length;
          if (achadas === conchas.length) giveItem("conchas-todas");
          const tempo = Math.round((performance.now() - inicioT) / 1000);
          complete("cais", {
            estrelas: 1 + (achadas === conchas.length ? 1 : 0) + (tempo <= 75 ? 1 : 0),
            tempo,
            detalhes: [`Conchas: ${achadas} de ${conchas.length}`],
          });
        }
        else { audio.sfx.erro(); setMsg("A porta está trancada. Procure uma chave."); }
      }
    };

    const agir = () => {
      const o = objetos.find((o) => Math.hypot(o.x - pos.x, o.y - pos.y) < ALCANCE);
      if (o) interagir(o); else { ping = performance.now(); pingPos.x = pos.x; pingPos.y = pos.y; audio.sfx.pista(); setMsg("Você ergue a lanterna e o eco volta: o brilho das conchas aparece por um instante."); }
    };
    acaoRef.current = agir;
    const onAct = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === " ") agir();
    };
    window.addEventListener("keydown", onAct);

    (async () => {
      await app.init({ width: W, height: H, background: palette.abismo, antialias: true, resolution: resolucaoIdeal(host.current), autoDensity: true });
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
      const raios = criarRaios(app, W, H);
      const ondas = new Graphics();
      app.stage.addChild(ondas);
      const bolhas = criarBolhas(app, W, H, 16, palette.espuma);

      const extras = new Graphics();
      app.stage.addChild(extras);
      const halo = new Graphics();
      app.stage.addChild(halo);
      const rastro = criarRastro(app, palette.espuma);
      const jogador = criarMergulhador();
      app.stage.addChild(jogador);

      const ctx = escuro.current!.getContext("2d")!;

      app.ticker.add(() => {
        if (useGame.getState().pausado) return;
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
        raios(t);
        desenharHalo(halo, pos.x, pos.y, 36, t);
        rastro(pos.x, pos.y);
        extras.clear();
        for (const c of conchas) {
          if (c.ok) continue;
          if (Math.hypot(c.x - pos.x, c.y - pos.y) < 18) {
            c.ok = true; audio.sfx.pista();
            const n = conchas.filter((k) => k.ok).length;
            setConchasN(n);
            setMsg(`Uma concha brilhante. ${n} de ${conchas.length}. Valem uma estrela.`);
            continue;
          }
          extras.circle(c.x, c.y, 6).fill({ color: palette.lanterna, alpha: 0.75 + 0.25 * Math.sin(t * 0.006 + c.x) * mov });
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(10,26,31,0.94)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "destination-out";
        const g = ctx.createRadialGradient(pos.x, pos.y, 8, pos.x, pos.y, LUZ + Math.sin(t * 0.006) * 5 * mov);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        for (const c of conchas) {
          if (c.ok) continue;
          const h = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, 22);
          h.addColorStop(0, "rgba(0,0,0,0.7)");
          h.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = h;
          ctx.fillRect(c.x - 22, c.y - 22, 44, 44);
        }
        const kp = (t - ping) / 1800;
        if (kp >= 0 && kp < 1) {
          for (const c of conchas) {
            if (c.ok || Math.hypot(c.x - pingPos.x, c.y - pingPos.y) > 80 + kp * 260) continue;
            const h = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, 60);
            h.addColorStop(0, `rgba(0,0,0,${1 - kp})`);
            h.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = h;
            ctx.fillRect(c.x - 60, c.y - 60, 120, 120);
          }
          ctx.beginPath(); ctx.arc(pingPos.x, pingPos.y, 20 + kp * 340, 0, 7);
          ctx.strokeStyle = `rgba(0,0,0,${0.5 * (1 - kp)})`; ctx.lineWidth = 3; ctx.stroke();
        }
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
    <div className="fase-layout">
      <Cabecalho id="cais">
        <p className="text-sm text-espuma/70">Conchas opcionais: {conchasN}/3 · Termine em até 75s para a 3ª estrela</p>
      </Cabecalho>
      <Tela>
        <div ref={host} className="absolute inset-0" />
        <canvas ref={escuro} width={W} height={H} className="pointer-events-none absolute inset-0 h-full w-full" />
        <p className="legenda-jogo" role="status">{msg}</p>
      </Tela>
      <button onClick={() => acaoRef.current?.()} className="rounded-lg border border-lanterna px-6 py-2 text-lanterna">Interagir</button>
    </div>
  );
}
