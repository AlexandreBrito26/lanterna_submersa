import { useEffect, useRef, useState } from "react";
import { Graphics } from "pixi.js";
import { Gem, Wind } from "lucide-react";
import { palette } from "../game/theme";
import { useGame } from "../store/useGame";
import { audio } from "../game/audio";
import { vibrar, criarBolhas, criarMergulhador, criarRaios, criarRastro, desenharHalo, reduzMovimento } from "../game/fx";
import { configAtual } from "../game/dificuldade";
import { criarApp, criarControle, criarEscuridao, W, H } from "../game/pixiBase";
import Cabecalho from "../components/Cabecalho";
import Tela from "../components/Tela";

const VEL = 135, R = 8, LUZ = 105;
const INICIO = { x: 180, y: 600 };
// [x, y, largura, altura]: cascos e mastros de navios afundados
const cascos: ReadonlyArray<readonly [number, number, number, number]> = [
  [60, 380, 90, 24], [220, 250, 100, 24], [20, 150, 70, 24], [240, 470, 90, 24], [130, 530, 24, 70], [150, 200, 24, 80],
];
const fragmentosIniciais = [[300, 570], [40, 480], [180, 330], [310, 180], [60, 70], [200, 110]] as const;
// Águas-vivas que patrulham o recife e queimam o fôlego de quem encosta
const medusas = [
  { cx: 180, y: 300, amp: 120, f: 1.1, ph: 0 },
  { cx: 150, y: 430, amp: 110, f: 1.4, ph: 2 },
  { cx: 200, y: 90, amp: 140, f: 0.9, ph: 4 },
] as const;
const arIniciais = [[110, 450], [260, 360]] as const;

const bate = (x: number, y: number) =>
  cascos.some(([cx, cy, cw, ch]) => {
    const nx = Math.max(cx, Math.min(x, cx + cw));
    const ny = Math.max(cy, Math.min(y, cy + ch));
    return Math.hypot(x - nx, y - ny) < R;
  });

export default function Recife() {
  const host = useRef<HTMLDivElement>(null);
  const escuro = useRef<HTMLCanvasElement>(null);
  const { giveItem, complete } = useGame();
  const seg = useRef(false);
  const [hud, setHud] = useState({ ar: 1, frag: 0 });
  const [msg, setMsg] = useState("Fragmentos brilham no escuro, bolhas dão fôlego. Fuja das águas-vivas vermelhas.");

  useEffect(() => {
    const cfg = configAtual();
    const pos = { ...INICIO };
    let frags = fragmentosIniciais.map(([x, y]) => ({ x, y, ok: false }));
    let ares = arIniciais.map(([x, y]) => ({ x, y, ok: false }));
    let ar = cfg.oxigenio, tempo = 0, imune = 0, falhas = 0, acabou = false, morto = false, quadros = 0;
    let limpar: (() => void) | null = null;
    const kd = (e: KeyboardEvent) => { if (e.key === " ") { e.preventDefault(); seg.current = true; } };
    const ku = (e: KeyboardEvent) => { if (e.key === " ") seg.current = false; };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    (async () => {
      const app = await criarApp(host.current!);
      if (morto) { app.destroy(true); return; }
      const ctrl = criarControle(app.canvas, INICIO);
      const dark = criarEscuridao(escuro.current!, 0.96);

      const cenario = new Graphics();
      cenario.rect(0, 0, W, H).fill(palette.mare).rect(0, 0, W, 90).fill({ color: palette.abismo, alpha: 0.25 });
      cascos.forEach(([x, y, w, h]) => {
        cenario.roundRect(x, y, w, h, 6).fill({ color: 0x5a3d33, alpha: 0.95 });
        cenario.rect(x + 4, y + 4, w - 8, 3).fill({ color: palette.coral, alpha: 0.4 });
      });
      app.stage.addChild(cenario);
      const raios = criarRaios(app, W, H);
      const bolhas = criarBolhas(app, W, H, 16, palette.espuma);
      const itens = new Graphics();
      app.stage.addChild(itens);
      const halo = new Graphics();
      app.stage.addChild(halo);
      const rastro = criarRastro(app, palette.espuma);
      const jogador = criarMergulhador();
      app.stage.addChild(jogador);

      app.ticker.add((tk) => {
        if (acabou || useGame.getState().pausado) return;
        const dt = Math.min(tk.deltaMS / 1000, 0.05);
        const t = performance.now();
        const mov = reduzMovimento() ? 0 : 1;
        bolhas(t);
        tempo += dt; ar -= dt * (seg.current ? 0.4 : 1); quadros++;

        const [vx, vy] = ctrl.vetor(pos, VEL * (seg.current ? 0.5 : 1));
        if (!bate(pos.x + vx * dt, pos.y)) pos.x += vx * dt;
        if (!bate(pos.x, pos.y + vy * dt)) pos.y += vy * dt;
        pos.x = Math.max(R, Math.min(W - R, pos.x));
        pos.y = Math.max(R, Math.min(H - R, pos.y));
        jogador.position.set(pos.x, pos.y);
        raios(t);
        desenharHalo(halo, pos.x, pos.y, 36, t);
        rastro(pos.x, pos.y);

        for (const f of frags) if (!f.ok && Math.hypot(f.x - pos.x, f.y - pos.y) < 20) {
          f.ok = true; audio.sfx.coletar();
          const n = frags.filter((x) => x.ok).length;
          setMsg(n < frags.length ? `Fragmento ${n} de ${frags.length}. Ainda há luz espalhada.` : "A lanterna está completa de novo.");
        }
        for (const a of ares) if (!a.ok && Math.hypot(a.x - pos.x, a.y - pos.y) < 20) {
          a.ok = true; ar = Math.min(cfg.oxigenio, ar + 12); audio.sfx.bolha(); setMsg("Uma bolha de ar. Respire fundo.");
        }

        if (frags.every((f) => f.ok)) {
          acabou = true;
          audio.sfx.porta(); audio.sfx.vitoria(); giveItem("fragmentos-de-luz");
          const sobra = ar / cfg.oxigenio;
          const base = sobra > 0.5 ? 3 : sobra > 0.25 ? 2 : 1;
          complete("recife", {
            estrelas: falhas ? Math.min(base, 2) : base, tempo: Math.round(tempo),
            detalhes: [`Ar restante: ${Math.max(0, Math.round(ar))}s`, falhas ? `Faltou ar ${falhas}x` : "Sem faltar ar"],
          });
          return;
        }
        if (ar <= 0) {
          falhas++; audio.sfx.erro();
          setMsg("O ar acabou. Os fragmentos voltam ao fundo e você recomeça.");
          frags = fragmentosIniciais.map(([x, y]) => ({ x, y, ok: false }));
          ares = arIniciais.map(([x, y]) => ({ x, y, ok: false }));
          pos.x = ctrl.alvo.x = INICIO.x; pos.y = ctrl.alvo.y = INICIO.y; ar = cfg.oxigenio;
        }

        itens.clear();
        for (const f of frags) if (!f.ok) {
          const p = 0.6 + 0.4 * Math.sin(t * 0.005 + f.x) * (mov || 0.5);
          itens.poly([f.x, f.y - 9, f.x + 7, f.y, f.x, f.y + 9, f.x - 7, f.y]).fill({ color: palette.lanterna, alpha: p });
        }
        for (const a of ares) if (!a.ok) itens.circle(a.x, a.y, 7).stroke({ color: palette.espuma, width: 2, alpha: 0.9 });

        if (imune > 0) imune -= dt;
        jogador.alpha = imune > 0 ? 0.4 + 0.4 * Math.sin(t * 0.03) : 1;
        const meds = medusas.map((j) => ({ x: j.cx + Math.sin(tempo * j.f + j.ph) * j.amp, y: j.y + Math.sin(tempo * 2 + j.ph) * 10 }));
        for (const m of meds) {
          itens.circle(m.x, m.y, 20).fill({ color: palette.coral, alpha: 0.12 });
          itens.circle(m.x, m.y, 11).fill({ color: palette.coral, alpha: 0.85 });
          for (let k = -1; k <= 1; k++) itens.moveTo(m.x + k * 5, m.y + 8).lineTo(m.x + k * 6 + Math.sin(t * 0.006 + k) * 3, m.y + 22).stroke({ color: palette.coral, width: 1.5, alpha: 0.6 });
          if (imune <= 0 && Math.hypot(m.x - pos.x, m.y - pos.y) < 17) {
            ar -= 6; imune = 1.5; audio.sfx.pancada(); vibrar(90);
            setMsg("Uma água-viva queimou seu fôlego. Desvie das luzes vermelhas.");
          }
        }
        dark.limpar();
        dark.furo(pos.x, pos.y, LUZ * (0.55 + 0.45 * Math.min(1, ar / 12)));
        for (const m of meds) dark.furo(m.x, m.y, 36, 0.85);
        for (const f of frags) if (!f.ok) dark.furo(f.x, f.y, 26, 0.7);
        for (const a of ares) if (!a.ok) dark.furo(a.x, a.y, 20, 0.6);
        if (quadros % 6 === 0) setHud({ ar: Math.max(0, ar / cfg.oxigenio), frag: frags.filter((f) => f.ok).length });
      });
      limpar = () => { ctrl.destruir(); app.destroy(true); };
    })();

    return () => { morto = true; window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); limpar?.(); };
  }, [giveItem, complete]);

  const critico = hud.ar < 0.25;
  return (
    <div className="fase-layout">
      <Cabecalho id="recife">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-lanterna"><Gem size={16} aria-hidden /> {hud.frag}/6</span>
          <div className="flex flex-1 items-center gap-2">
            <Wind size={16} className={critico ? "text-coral" : "text-espuma/70"} aria-hidden />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-mare" role="progressbar" aria-label="Ar restante" aria-valuenow={Math.round(hud.ar * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full transition-[width] ${critico ? "bg-coral" : "bg-lanterna"}`} style={{ width: `${hud.ar * 100}%` }} />
            </div>
          </div>
        </div>
      </Cabecalho>
      <Tela>
        <div ref={host} className="absolute inset-0" />
        <canvas ref={escuro} width={W} height={H} className="pointer-events-none absolute inset-0 h-full w-full" />
        <p className="legenda-jogo" role="status">{msg}</p>
      </Tela>
      <button
        onPointerDown={() => { seg.current = true; }} onPointerUp={() => { seg.current = false; }} onPointerLeave={() => { seg.current = false; }}
        className="select-none rounded-lg border border-lanterna px-5 py-2 text-lanterna" style={{ touchAction: "none" }}
      >Prender o fôlego (segure ou Espaço)</button>
    </div>
  );
}
