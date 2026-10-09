import { useEffect, useRef, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Volta pelo mar. Trace dois caminhos do início (S) até a saída (E) que não se cruzem: nenhuma casa pode estar
// nos dois, exceto S e E. Primeiro trace o caminho de ida, até E; depois o caminho de volta. Toque numa casa vizinha
// para estender o caminho atual. OTIMOS é a soma mínima dos dois caminhos (enumeração exaustiva).
const MAPAS = [
  ["S..#", ".#..", "...E"],
  ["S..", ".#.", "..E"],
];
type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho { const c = m.flatMap((l) => [...l]); return { W: m[0].length, H: m.length, celulas: c, ini: c.indexOf("S"), saida: c.indexOf("E") }; }
const TRE = MAPAS.map(ler);
function minimo(t: Trecho): number {
  const res: number[][] = [];
  const dfs = (p: number, vis: Set<number>, cam: number[]) => {
    if (p === t.saida) { res.push([...cam]); return; }
    const x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue;
      const q = ny * t.W + nx; if (t.celulas[q] === "#" || vis.has(q)) continue;
      vis.add(q); cam.push(q); dfs(q, vis, cam); cam.pop(); vis.delete(q);
    }
  };
  dfs(t.ini, new Set([t.ini]), [t.ini]);
  let best = Infinity;
  for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++) {
    const a = new Set(res[i].slice(1, -1));
    if (res[j].slice(1, -1).every((q) => !a.has(q))) best = Math.min(best, res[i].length - 1 + res[j].length - 1);
  }
  return best;
}
const OTIMOS = TRE.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Ida e volta pelo mar. Os dois caminhos não podem se cruzar, nem passar pela mesma casa: só o início e a saída são compartilhados.",
  "Um mar menor, mas com a cerca escondendo a volta. Trace a ida com cuidado para não bloquear a volta.",
];

export default function VoltaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const desfazeres = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [ida, setIda] = useState<number[]>([TRE[0].ini]);
  const [volta, setVolta] = useState<number[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRE[rodada];
  const idaCompleta = ida.length > 0 && ida[ida.length - 1] === t.saida;
  const construindoVolta = idaCompleta;
  const atual = construindoVolta ? volta : ida;
  const ponta = atual.length ? atual[atual.length - 1] : t.ini;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const usadoPelaIda = new Set(ida.slice(1, -1));

  const estender = (q: number) => {
    if (fim.current || travado) return;
    const x = ponta % t.W, y = Math.floor(ponta / t.W), qx = q % t.W, qy = Math.floor(q / t.W);
    if (Math.abs(x - qx) + Math.abs(y - qy) !== 1) return;
    if (t.celulas[q] === "#") { audio.sfx.volta.bate(); setMsg("Uma cerca. Esse caminho está fechado."); return; }
    if (atual.includes(q) && q !== t.ini) { audio.sfx.volta.bate(); setMsg("Você já passou por essa casa neste caminho."); return; }
    if (construindoVolta && usadoPelaIda.has(q)) { audio.sfx.volta.bate(); setMsg("A ida já passou por essa casa. A volta não pode cruzá-la."); return; }
    passosTotal.current++;
    if (!construindoVolta) {
      const novo = [...ida, q]; setIda(novo); audio.sfx.volta.passo();
      if (q === t.saida) { setMsg("Você chega à saída. Agora trace a volta por outro caminho."); return; }
      setMsg("A ida avança pelo mar.");
    } else {
      const novo = [...volta, q]; setVolta(novo); audio.sfx.volta.passo();
      if (q === t.saida) { concluir(); return; }
      setMsg("A volta avança. Não cruze a ida.");
    }
  };

  const desfazer = () => {
    if (fim.current || travado) return;
    if (construindoVolta) { if (volta.length === 0) return; desfazeres.current++; setVolta(volta.slice(0, -1)); }
    else { if (ida.length <= 1 || idaCompleta) return; desfazeres.current++; setIda(ida.slice(0, -1)); }
    audio.sfx.interagir(); setMsg("Você volta uma casa.");
  };

  const concluir = () => {
    setTravado(true);
    audio.sfx.volta.completo();
    const total = ida.length - 1 + volta.length;
    const nota = total === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRE.length - 1) {
      setMsg(`Ida e volta feitas, sem cruzar o caminho (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setIda([TRE[rodada + 1].ini]); setVolta([]); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("volta-pelo-mar");
    setMsg(`Os dois caminhos se encontram na luz, e a volta fica completa (${nota}).`);
    const totalFinal = passosTotal.current;
    agendar(() => complete("volta", {
      estrelas: totalFinal <= SOMA_OTIMOS ? 3 : totalFinal <= SOMA_OTIMOS + 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${totalFinal} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Voltas refeitas: ${reinicios.current}` : "Nenhuma volta refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setIda([t.ini]); setVolta([]); audio.sfx.interagir(); setMsg("O mar se fecha, e a ida começa de novo. Os passos já dados continuam contando."); };

  const caminhoIda = new Set(ida), caminhoVolta = new Set(volta);
  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="volta" /></div>
      <p className="font-narrativa italic text-espuma/80">Mar {rodada + 1} de {TRE.length}: {construindoVolta ? "trace a volta" : "trace a ida"} até a saída.</p>
      <div role="grid" aria-label={`Mar ${t.W} por ${t.H}`} className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2"
        style={{ maxWidth: t.W * 72, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44]" />;
          const naIda = caminhoIda.has(p) && p !== t.ini && p !== t.saida, naVolta = caminhoVolta.has(p) && p !== t.saida;
          return (
            <button key={p} onClick={() => estender(p)} disabled={travado}
              aria-label={c === "S" ? "Início" : c === "E" ? "Saída" : naIda ? "Casa da ida" : naVolta ? "Casa da volta" : "Mar livre"}
              className={`relative flex aspect-square items-center justify-center rounded-md border transition-colors duration-300 ${naIda ? "border-lanterna bg-lanterna/40" : naVolta ? "border-alga bg-alga/40" : "border-latao/50 bg-mare/25"} disabled:cursor-default`}>
              {c === "S" && <span className="font-narrativa text-sm">S</span>}
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {ponta === p && <span className="absolute inset-[30%] rounded-full bg-espuma" />}
            </button>
          );
        })}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Ida: {Math.max(0, ida.length - 1)} passos · Volta: {volta.length} passos</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Voltar uma casa</button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Recomeçar</button>
        </span>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
