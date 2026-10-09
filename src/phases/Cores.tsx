import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Cores que não se repetem. Cada casa tem uma cor (a, b ou c). Você não pode pisar numa casa da mesma cor
// da casa em que acabou de estar. Chegue à saída (E). OTIMOS é o mínimo de passos (busca em largura sobre posição e cor anterior).
const MAPAS = [
  ["Sab.c", "a#bca", "bcaab", "..#.E"],
  ["Sab", "b#a", "aba", "bcE"],
];
const COR: Record<string, string> = { a: "#E07A5F", b: "#7FE0D0", c: "#FFBF00", ".": "#2a3d44" };
type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho { const c = m.flatMap((l) => [...l]); return { W: m[0].length, H: m.length, celulas: c, ini: c.indexOf("S"), saida: c.indexOf("E") }; }
const TRE = MAPAS.map(ler);
const corDe = (t: Trecho, p: number) => (t.celulas[p] === "S" || t.celulas[p] === "E" ? "" : t.celulas[p]);
function minimo(t: Trecho): number {
  const fila: [number, string, number][] = [[t.ini, "", 0]]; const vist = new Set([`${t.ini}:`]);
  for (let i = 0; i < fila.length; i++) {
    const [p, ant, d] = fila[i];
    if (p === t.saida) return d;
    const x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue;
      const q = ny * t.W + nx, c = t.celulas[q]; if (c === "#" || corDe(t, q) === ant && corDe(t, q) !== "") continue;
      const key = `${q}:${corDe(t, q)}`; if (vist.has(key)) continue; vist.add(key); fila.push([q, corDe(t, q), d + 1]);
    }
  }
  return Infinity;
}
const OTIMOS = TRE.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Cada casa tem uma cor. Você não pode pisar em duas casas seguidas da mesma cor. Planeje o caminho antes de andar.",
  "Mais cores espalhadas, e algumas casas funcionam como ponte. Confira a cor da casa em que você está antes de cada passo.",
];

export default function CoresFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRE[0].ini);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRE[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x, c = t.celulas[q];
    if (c === "#") { audio.sfx.cores.bate(); setMsg("Uma parede. Esse caminho está fechado."); return; }
    const corAtual = corDe(t, pos), corNova = corDe(t, q);
    if (corNova !== "" && corNova === corAtual) { audio.sfx.cores.bate(); setMsg(`A casa é da mesma cor (${corNova}) que a anterior. Escolha outra.`); return; }
    const n = passos + 1;
    passosTotal.current++;
    setPos(q); setPassos(n);
    if (q === t.saida) { concluir(n); return; }
    audio.sfx.cores.passo();
    setMsg(`Você pisa numa casa ${corNova === "a" ? "vermelha" : corNova === "b" ? "azul-clara" : corNova === "c" ? "dourada" : "escura"}.`);
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.cores.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRE.length - 1) {
      setMsg(`Você alcança a saída com ${n} passos (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPos(TRE[rodada + 1].ini); setPassos(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("cores-que-nao-se-repetem");
    const total = passosTotal.current;
    setMsg(`As cores se alternam até a luz final (${nota}).`);
    agendar(() => complete("cores", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Caminhos refeitos: ${reinicios.current}` : "Nenhum caminho refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPos(t.ini); setPassos(0); audio.sfx.interagir(); setMsg("Você volta ao início. Os passos já dados continuam contando."); };

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button onClick={() => mover(dx, dy)} aria-label={rotulo} disabled={travado} className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40"><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="cores" /></div>
      <p className="font-narrativa italic text-espuma/80">Caminho {rodada + 1} de {TRE.length}: não pise em duas casas seguidas da mesma cor.</p>
      <div role="img" aria-label={`Caminho de ${t.W} por ${t.H}, passos: ${passos}`} className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44]" />;
          const cor = COR[c] ?? "#2a3d44";
          return (
            <div key={p} className="relative aspect-square rounded-sm opacity-90" style={{ background: c === "S" || c === "E" ? "#2a3d44" : cor }}>
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {c === "S" && <span className="absolute inset-[30%] flex items-center justify-center font-narrativa text-xs text-espuma/80">S</span>}
              {pos === p && <span className="absolute inset-[22%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>
      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Voltar ao início</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
