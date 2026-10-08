import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · . lama firme · ~ lodo mole (cede depois que você passa) · * boia · @ você
// Cada mapa foi resolvido por busca em largura: todos têm solução, e OTIMOS é o mínimo de deslizes.
const MAPAS = [
  ["######", "#.@.~#", "#..*.#", "#~~~.#", "#....#", "######"],
  ["######", "##...#", "#*.~.#", "#~~..#", "#~.@.#", "######"],
  ["######", "#....#", "#...~#", "#.~*.#", "#..~@#", "######"],
];
const OTIMOS = [5, 8, 6];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Você desliza pela lama e só para quando bate em algo. Descubra a parada certa antes de cada movimento.",
  "O lodo mole não segura quem para sobre ele. Deslize sempre até uma parada firme.",
  "A última raiz do manguezal. Cada deslize fica para trás, então pense antes de sair do lugar.",
];

type Estado = { p: number; m: number }; // m: bits do lodo que já cedeu
type Campo = { W: number; H: number; rochas: Set<number>; lodo: Map<number, number>; alvo: number; ini: number };
type Passo = { e: Estado; cedeu: number; win: boolean } | "parede" | "afunda";

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const rochas = new Set<number>(), lodo = new Map<number, number>();
  let alvo = -1, ini = 0;
  mapa.forEach((linha, y) => [...linha].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") rochas.add(p);
    if (c === "~") lodo.set(p, lodo.size);
    if (c === "*") alvo = p;
    if (c === "@") ini = p;
  }));
  return { W, H, rochas, lodo, alvo, ini };
}
const CAMPOS = MAPAS.map(ler);

// Quantos trechos de lodo passaram de firmes a cedidos neste deslize
function contar(f: Campo, antes: number, depois: number): number {
  let n = 0;
  f.lodo.forEach((i) => { if (((depois >> i) & 1) && !((antes >> i) & 1)) n++; });
  return n;
}

// Desliza na direção (dx, dy) até bater em rocha ou em lodo já cedido. Só para em chão firme ou na boia.
function deslizar(f: Campo, e: Estado, dx: number, dy: number): Passo {
  const cedido = (p: number, m: number) => { const i = f.lodo.get(p); return i !== undefined && ((m >> i) & 1) === 1; };
  let x = e.p % f.W, y = Math.floor(e.p / f.W);
  let c = e.p, m = e.m, andou = false;
  for (;;) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H) break;
    const n = ny * f.W + nx;
    if (f.rochas.has(n) || cedido(n, m)) break;
    x = nx; y = ny; c = n; andou = true;
    const i = f.lodo.get(c);
    if (i !== undefined) m |= 1 << i;
    if (c === f.alvo) return { e: { p: c, m }, cedeu: contar(f, e.m, m), win: true };
  }
  if (!andou) return "parede";
  if (f.lodo.has(c)) return "afunda";
  return { e: { p: c, m }, cedeu: contar(f, e.m, m), win: false };
}

export default function MangueFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const movsTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [estado, setEstado] = useState<Estado>({ p: CAMPOS[0].ini, m: 0 });
  const [historico, setHistorico] = useState<Estado[]>([]);
  const [movs, setMovs] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (m: number) => {
    setTravado(true);
    const nota = m === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você chega à boia em ${m} deslizes (${nota}). Uma tábua de madeira aparece, e o trecho seguinte se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEstado({ p: CAMPOS[prox].ini, m: 0 });
        setHistorico([]); setMovs(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    audio.sfx.lama.boia();
    giveItem("boia-do-manguezal");
    setMsg(`A boia acende e a luz aponta a margem firme (${nota}). Do outro lado, alguém responde com um sinal.`);
    const total = movsTotal.current;
    agendar(() => complete("mangue", {
      estrelas: total <= SOMA_OTIMOS * 1.5 ? 3 : total <= SOMA_OTIMOS * 2.5 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Deslizes: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos reiniciados: ${reinicios.current}` : "Nenhum reinício"],
    }), 3000);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const r = deslizar(f, estado, dx, dy);
    if (r === "parede") { audio.sfx.lama.bater(); setMsg("Rocha na frente: a lama para antes dela. Escolha outra direção."); return; }
    if (r === "afunda") { audio.sfx.lama.afunda(); setMsg("O lodo mole não segura quem para nele. Escolha um lugar firme para parar."); return; }
    const m = movs + 1;
    movsTotal.current++;
    setHistorico((h) => [...h, estado]);
    setEstado(r.e);
    setMovs(m);
    audio.sfx.lama.deslizar();
    if (r.cedeu) audio.sfx.lama.afunda();
    if (r.win) { concluir(m); return; }
    if (r.cedeu) setMsg("O lodo cede atrás de você e vira água.");
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setEstado(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.passo();
    setMsg("Você volta ao ponto anterior. Os deslizes já feitos continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEstado({ p: f.ini, m: 0 }); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O trecho volta ao começo. Os deslizes já feitos continuam contando.");
  };

  // Teclado: setas ou WASD para deslizar, Z para desfazer
  const acoes = useRef({ mover, desfazer });
  acoes.current = { mover, desfazer };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (d[e.key]) { e.preventDefault(); acoes.current.mover(...d[e.key]); }
      else if (e.key === "z" || e.key === "Z") acoes.current.desfazer();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const cedido = (p: number) => { const i = f.lodo.get(p); return i !== undefined && ((estado.m >> i) & 1) === 1; };

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button
      onClick={() => mover(dx, dy)}
      aria-label={rotulo}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95"
    ><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="mangue" />
      <div className="flex justify-center"><Cabecalho id="mangue" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: deslize até a boia sem parar no lodo mole.</p>

      <div
        role="img"
        aria-label={`Manguezal com a boia no fim do trecho. Use as setas para deslizar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.rochas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const lodo = f.lodo.has(p), agua = cedido(p), alvo = f.alvo === p, eu = estado.p === p;
          const fundo = agua ? "bg-mare/80" : lodo ? "bg-[#5a3d2b]/80" : "bg-mare/25";
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-300 ${fundo}`}>
              {lodo && !agua && <span className="absolute inset-[15%] rounded-full bg-[#3b2a1e]/60" />}
              {agua && <span className="absolute inset-[20%] rounded-full border border-mare/60" />}
              {alvo && <span className="absolute inset-[18%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.55)]" />}
              {eu && <span className="absolute inset-[24%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Deslizes: {movs}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <Undo2 size={14} aria-hidden /> Desfazer (Z)
          </button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <RotateCcw size={14} aria-hidden /> Reiniciar
          </button>
        </span>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Deslizar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
