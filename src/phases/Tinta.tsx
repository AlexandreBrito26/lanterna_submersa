import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Tinta de flor. A flor do canto superior esquerdo muda de cor e espalha a cor para toda a região conectada da mesma cor.
// Escolha uma das três cores de tinta. Pinte o jardim inteiro com uma cor só. OTIMOS é o mínimo de toques (busca em largura).
const TRECHOS = [
  [[0, 1, 2], [1, 1, 0], [2, 0, 1]],
  [[0, 0, 1], [2, 1, 1], [2, 2, 0]],
];
const CORES = ["#E07A5F", "#7FE0D0", "#FFBF00"];
function regiao(g: number[][], W: number, H: number): Set<number> {
  const cor = g[0][0]; const seen = new Set<number>([0]); const f = [0];
  for (let i = 0; i < f.length; i++) { const q = f[i], x = q % W, y = Math.floor(q / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const r = ny * W + nx; if (!seen.has(r) && g[ny][nx] === cor) { seen.add(r); f.push(r); } } }
  return seen;
}
function pinta(g: number[][], W: number, H: number, c: number): number[][] {
  const reg = regiao(g, W, H); return g.map((row, y) => row.map((v, x) => (reg.has(y * W + x) ? c : v)));
}
function minimo(g0: number[][]): number {
  const H = g0.length, W = g0[0].length; const key = (g: number[][]) => g.flat().join("");
  const fila: [number[][], number][] = [[g0, 0]]; const vist = new Set([key(g0)]);
  for (let i = 0; i < fila.length; i++) {
    const [g, d] = fila[i];
    if (g.flat().every((v) => v === g[0][0])) return d;
    for (let c = 0; c < 3; c++) { if (c === g[0][0]) continue; const n = pinta(g, W, H, c); const k = key(n); if (!vist.has(k)) { vist.add(k); fila.push([n, d + 1]); } }
  }
  return Infinity;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "A flor do canto espalha a cor para toda a região vizinha da mesma cor. Escolha a tinta com cuidado: o jardim precisa de uma cor só.",
  "Mais cores e regiões separadas. Às vezes vale pintar uma região que você nem está olhando.",
];

export default function TintaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const toquesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [g, setG] = useState<number[][]>(TRECHOS[0]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const H = g.length, W = g[0].length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const reg = regiao(g, W, H);

  const pintar = (c: number) => {
    if (fim.current || travado || c === g[0][0]) return;
    const n = pinta(g, W, H, c);
    toquesTotal.current++;
    setG(n); audio.sfx.tinta.pintar();
    if (n.flat().every((v) => v === n[0][0])) { concluir(toquesTotal.current); return; }
    setMsg("A tinta se espalha pela região.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.tinta.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de toques" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O jardim ficou de uma cor só com ${n} toques (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setG(TRECHOS[rodada + 1]); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("tinta-de-flor");
    const total = toquesTotal.current;
    setMsg(`As flores se pintam da mesma cor, e o jardim inteiro floresce (${nota}).`);
    agendar(() => complete("tinta", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Jardins refeitos: ${reinicios.current}` : "Nenhum jardim refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setG(TRECHOS[rodada]); audio.sfx.interagir(); setMsg("A tinta seca e o jardim volta às cores originais. Os toques já dados continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="tinta" /></div>
      <p className="font-narrativa italic text-espuma/80">Jardim {rodada + 1} de {TRECHOS.length}: pinte o jardim com uma cor só.</p>
      <div className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2" style={{ maxWidth: W * 72, gridTemplateColumns: `repeat(${W}, 1fr)` }}>
        {g.flatMap((row, y) => row.map((v, x) => (
          <div key={`${x}-${y}`} style={{ background: CORES[v] }} className={`aspect-square rounded-md ${reg.has(y * W + x) ? "ring-2 ring-espuma/70" : "opacity-90"}`} />
        )))}
      </div>
      <div className="mx-auto flex justify-center gap-3" role="group" aria-label="Escolher tinta">
        {CORES.map((cor, c) => (
          <button key={c} onClick={() => pintar(c)} disabled={travado || c === g[0][0]} aria-label={`Tinta ${c + 1}`}
            style={{ background: cor }} className="h-12 w-12 rounded-full border-2 border-espuma/40 disabled:opacity-30 active:scale-95" />
        ))}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toquesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Recomeçar as cores</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
