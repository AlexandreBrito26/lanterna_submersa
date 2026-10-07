import { useEffect, useState } from "react";
import { useRef } from "react";
import { Graphics } from "pixi.js";
import { Heart, Timer } from "lucide-react";
import { palette } from "../game/theme";
import { useGame } from "../store/useGame";
import { audio } from "../game/audio";
import { vibrar, criarBolhas, criarMergulhador, criarRaios, criarRastro, desenharHalo, reduzMovimento } from "../game/fx";
import { configAtual } from "../game/dificuldade";
import { criarApp, criarControle, criarEscuridao, W, H } from "../game/pixiBase";
import Cabecalho from "../components/Cabecalho";
import Tela from "../components/Tela";

const VEL = 150, R = 8, LUZ = 150, VIDAS = 3;
const INICIO = { x: 180, y: 540 };

type Destroco = { x: number; y: number; vx: number; vy: number; r: number };
type Aviso = { x: number; quando: number; r: number };

export default function Abismo() {
  const host = useRef<HTMLDivElement>(null);
  const escuro = useRef<HTMLCanvasElement>(null);
  const { giveItem, complete } = useGame();
  const ancora = useRef(false);
  const infinito = useGame.getState().infinito;
  const recorde = useGame.getState().recordeInfinito;
  const cfg0 = configAtual();
  const [hud, setHud] = useState({ resta: infinito ? 0 : cfg0.resistir, vidas: VIDAS });
  const [msg, setMsg] = useState(infinito
    ? "Maré Infinita: não há fim. Os destroços aceleram com o tempo. Aguente o máximo que puder."
    : "Setas ou arraste para fugir. Um triângulo no topo avisa de onde cai o próximo destroço. A âncora segura você por poucos segundos.");

  useEffect(() => {
    const cfg = configAtual();
    const modoInfinito = useGame.getState().infinito;
    const pos = { ...INICIO };
    let destrocos: Destroco[] = [];
    let avisos: Aviso[] = [];
    let tempo = 0, proximo = 1, vidas = VIDAS, imune = 0, quedas = 0, acabou = false, morto = false, quadros = 0;
    let tremor = 0;
    let limpar: (() => void) | null = null;
    let folego = 2.5;
    const kd = (e: KeyboardEvent) => { if (e.key === " ") { e.preventDefault(); ancora.current = true; } };
    const ku = (e: KeyboardEvent) => { if (e.key === " ") ancora.current = false; };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);

    (async () => {
      const app = await criarApp(host.current!);
      if (morto) { app.destroy(true); return; }
      const ctrl = criarControle(app.canvas, INICIO);
      const dark = criarEscuridao(escuro.current!, 0.9);

      const fundo = new Graphics().rect(0, 0, W, H).fill(palette.mare).rect(0, 0, W, H).fill({ color: palette.abismo, alpha: 0.35 });
      app.stage.addChild(fundo);
      const raios = criarRaios(app, W, H);
      const bolhas = criarBolhas(app, W, H, 22, palette.espuma);
      const correntes = new Graphics();
      app.stage.addChild(correntes);
      const objetos = new Graphics();
      app.stage.addChild(objetos);
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
        tempo += dt; quadros++;
        if (imune > 0) imune -= dt;
        bolhas(t);

        // A corrente empurra de lado e muda de direção com o tempo
        const preso = ancora.current && folego > 0;
        folego = preso ? folego - dt : Math.min(2.5, folego + dt * 0.5);
        const corrente = preso ? 0 : Math.sin(tempo * 0.7) * 38;
        const [vx, vy]: [number, number] = preso ? [0, 0] : ctrl.vetor(pos, VEL);
        pos.x = Math.max(R, Math.min(W - R, pos.x + (vx + corrente) * dt));
        pos.y = Math.max(R, Math.min(H - R, pos.y + vy * dt));
        jogador.position.set(pos.x, pos.y);
        raios(t);
        desenharHalo(halo, pos.x, pos.y, 36, t);
        rastro(pos.x, pos.y);
        app.stage.position.set(mov ? (Math.random() - 0.5) * tremor : 0, mov ? (Math.random() - 0.5) * tremor : 0);
        tremor *= 0.88;
        jogador.alpha = imune > 0 ? 0.4 + 0.4 * Math.sin(t * 0.03) : 1;

        // Destroços ficam mais frequentes com o tempo
        const rampa = modoInfinito ? 1 + tempo / 70 : 1;
        const intervalo = Math.max(0.2, (0.95 - tempo * 0.008) / (cfg.correnteVel * rampa));
        if (tempo >= proximo) {
          avisos.push({ x: 20 + Math.random() * (W - 40), quando: tempo + 0.8, r: 9 + Math.random() * 9 });
          proximo = tempo + intervalo;
        }
        avisos = avisos.filter((a) => {
          if (tempo < a.quando) return true;
          destrocos.push({ x: a.x, y: -20, vx: corrente * 0.5, vy: (150 + Math.random() * 90) * cfg.correnteVel * rampa, r: a.r });
          return false;
        });
        destrocos = destrocos.filter((d) => {
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (imune <= 0 && Math.hypot(d.x - pos.x, d.y - pos.y) < d.r + R - 2) {
            vidas--; quedas++; imune = 1.2; tremor = 9; audio.sfx.pancada(); vibrar(120);
            setMsg(vidas > 0 ? "Pancada! Proteja o casco e continue." : infinito ? "O casco cedeu." : "O casco cedeu. A corrente leva você de volta ao começo.");
            return false;
          }
          return d.y < H + 30;
        });

        if (vidas <= 0 && modoInfinito) {
          acabou = true;
          useGame.getState().fimInfinito(Math.round(tempo));
          return;
        }
        if (vidas <= 0) {
          vidas = VIDAS; tempo = 0; proximo = 1; destrocos = []; avisos = []; imune = 1.5;
          pos.x = ctrl.alvo.x = INICIO.x; pos.y = ctrl.alvo.y = INICIO.y;
        }

        if (!modoInfinito && tempo >= cfg.resistir) {
          acabou = true;
          audio.sfx.porta(); audio.sfx.vitoria(); giveItem("calma-da-mare");
          complete("abismo", {
            estrelas: vidas, tempo: Math.round(tempo),
            detalhes: [`Casco restante: ${vidas} de ${VIDAS}`, `Pancadas sofridas: ${quedas}`],
          });
          return;
        }

        correntes.clear();
        for (let i = 0; i < 6; i++) {
          const y = ((t * 0.08 * (1 + i * 0.1) + i * 110) % (H + 40)) - 20;
          const x = 30 + i * 58;
          correntes.moveTo(x, y).lineTo(x + corrente * 0.5, y + 28).stroke({ color: palette.espuma, width: 1, alpha: 0.12 + 0.08 * mov });
        }
        objetos.clear();
        for (const a of avisos) {
          const k = 1 - (a.quando - tempo) / 0.8;
          objetos.poly([a.x - 8, 6, a.x + 8, 6, a.x, 20]).fill({ color: palette.coral, alpha: 0.3 + 0.7 * k });
        }
        for (const d of destrocos) {
          objetos.circle(d.x, d.y, d.r).fill({ color: 0x5a3d33 }).stroke({ color: palette.coral, width: 2, alpha: 0.8 });
        }

        dark.limpar();
        dark.furo(pos.x, pos.y, LUZ);
        for (const d of destrocos) dark.furo(d.x, d.y, d.r + 24, 0.8);
        if (quadros % 6 === 0) setHud({ resta: modoInfinito ? Math.floor(tempo) : Math.max(0, Math.ceil(cfg.resistir - tempo)), vidas });
      });
      limpar = () => { ctrl.destruir(); app.destroy(true); };
    })();

    return () => { morto = true; window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); limpar?.(); };
  }, [giveItem, complete]);

  return (
    <div className="flex h-full flex-col items-center gap-2 p-2">
      <Cabecalho id="abismo">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-lanterna"><Timer size={16} aria-hidden /> {hud.resta}s{infinito && recorde > 0 && <span className="ml-2 text-espuma/60">recorde {recorde}s</span>}</span>
          <span className="flex gap-1" role="img" aria-label={`Casco: ${hud.vidas} de ${VIDAS}`}>
            {Array.from({ length: VIDAS }, (_, i) => (
              <Heart key={i} size={18} className={i < hud.vidas ? "fill-coral text-coral" : "text-espuma/25"} aria-hidden />
            ))}
          </span>
        </div>
      </Cabecalho>
      <Tela>
        <div ref={host} className="absolute inset-0" />
        <canvas ref={escuro} width={W} height={H} className="pointer-events-none absolute inset-0 h-full w-full" />
      </Tela>
      <button
        onPointerDown={() => { ancora.current = true; }} onPointerUp={() => { ancora.current = false; }} onPointerLeave={() => { ancora.current = false; }}
        className="select-none rounded-lg border border-lanterna px-5 py-2 text-lanterna" style={{ touchAction: "none" }}
      >Lançar âncora (segure ou Espaço)</button>
      <p className="max-w-sm text-center font-narrativa text-base text-espuma/90" role="status">{msg}</p>
    </div>
  );
}
