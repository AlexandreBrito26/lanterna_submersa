import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Travessia dos quatro pontos. Cada marco (A, B, C, D) vem de um dos ramos do passado. Visite os quatro, em qualquer ordem,
// e chegue à saída (E) com o menor número de passos. OTIMOS é o mínimo de cada trecho, por busca em largura.
const MAPAS = [
  ["S..A.", ".#...", "B..#.", "...C.", "..D.E"],
  ["S.B.#", ".#...", "A..C.", "....D", "...#E"],
];
type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number; marcos: number[] };
function ler(m: string[]): Trecho {
  const c = m.flatMap((l) => [...l]);
  return { W: m[0].length, H: m.length, celulas: c, ini: c.indexOf("S"), saida: c.indexOf("E"), marcos: ["A", "B", "C", "D"].map((k) => c.indexOf(k)) };
}
const TRE = MAPAS.map(ler);
function minimo(t: Trecho): number {
  const fila: [number, number, number][] = [[t.ini, 0, 0]]; const vist = new Set([`${t.ini}:0`]);
  for (let i = 0; i < fila.length; i++) {
    const [p, mk, d] = fila[i];
    if (p === t.saida && mk === 15) return d;
    const x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue;
      const q = ny * t.W + nx; if (t.celulas[q] === "#") continue;
      let m2 = mk; t.marcos.forEach((mp, b) => { if (mp === q) m2 |= 1 << b; });
      const k = `${q}:${m2}`; if (vist.has(k)) continue; vist.add(k); fila.push([q, m2, d + 1]);
    }
  }
  return Infinity;
}
const OTIMOS = TRE.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Você carrega um pedaço de cada ramo. Passe por A, B, C e D, em qualquer ordem, e só então chegue à saída.",
  "Os marcos estão mais espalhados, e há uma cerca no caminho. Planeje a ordem antes de sair.",
];

export default function TravessiaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRE[0].ini);
  const [mk, setMk] = useState(0);
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
    const q = y * t.W + x;
    if (t.celulas[q] === "#") { audio.sfx.travessia.bate(); setMsg("Uma cerca. Esse caminho está fechado."); return; }
    let m2 = mk; t.marcos.forEach((mp, b) => { if (mp === q) m2 |= 1 << b; });
    const n = passos + 1;
    passosTotal.current++;
    setPos(q); setMk(m2); setPassos(n);
    if (q === t.saida && m2 === 15) { concluir(n); return; }
    if (m2 !== mk) { audio.sfx.travessia.marco(); setMsg(`Você passa pelo marco ${["A", "B", "C", "D"][t.marcos.findIndex((mp) => mp === q)]}.`); return; }
    audio.sfx.travessia.passo();
    setMsg(q === t.saida && m2 !== 15 ? "A saída está aqui, mas ainda faltam marcos." : "Você segue pelo caminho.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.travessia.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRE.length - 1) {
      setMsg(`Os quatro marcos estão com você, e a saída se abre (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPos(TRE[rodada + 1].ini); setMk(0); setPassos(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("travessia-dos-quatro-pontos");
    const total = passosTotal.current;
    setMsg(`Os caminhos do passado se juntam na saída (${nota}).`);
    agendar(() => complete("travessia", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Travessias refeitas: ${reinicios.current}` : "Nenhuma travessia refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPos(t.ini); setMk(0); setPassos(0); audio.sfx.interagir(); setMsg("Você volta ao início, sem os marcos. Os passos já dados continuam contando."); };

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button onClick={() => mover(dx, dy)} aria-label={rotulo} disabled={travado} className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40"><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="travessia" /></div>
      <p className="font-narrativa italic text-espuma/80">Travessia {rodada + 1} de {TRE.length}: passe pelos quatro marcos e chegue à saída.</p>
      <div role="img" aria-label={`Mapa de ${t.W} por ${t.H}. Marcos: ${(mk & 1 ? "A " : "")}${(mk & 2 ? "B " : "")}${(mk & 4 ? "C " : "")}${(mk & 8 ? "D" : "")}`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44]" />;
          const marcoIdx = ["A", "B", "C", "D"].indexOf(c);
          const coletado = marcoIdx >= 0 && (mk & (1 << marcoIdx)) !== 0;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {marcoIdx >= 0 && <span className={`absolute inset-[24%] flex items-center justify-center rounded-full font-narrativa text-xs ${coletado ? "bg-alga/60 text-espuma" : "border border-lanterna/70 text-lanterna"}`}>{c}</span>}
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {pos === p && <span className="absolute inset-[18%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
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
