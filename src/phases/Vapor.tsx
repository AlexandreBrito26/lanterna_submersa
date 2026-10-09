import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Clock, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Coluna de vapor. A cada turno, uma coluna solta vapor quente: a coluna c está quente no turno t quando (t + c) % 3 == 0.
// Você não pode estar numa coluna quente. Ande ou espere (⏸). Chegue à saída (E). OTIMOS é o menor número de turnos (busca em largura).
type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho { const c = m.flatMap((l) => [...l]); return { W: m[0].length, H: m.length, celulas: c, ini: c.indexOf("S"), saida: c.indexOf("E") }; }
const TRECHOS = [
  ler([".S..E", ".....", "....."]),
  ler([".S..#E", "..#...", "......"]),
];
const quente = (t: Trecho, p: number, turno: number) => (turno + (p % t.W)) % 3 === 0;
function minimo(t: Trecho): number {
  const fila: [number, number, number][] = [[t.ini, 0, 0]], vist = new Set([`${t.ini}:0`]);
  for (let i = 0; i < fila.length; i++) {
    const [p, turno, d] = fila[i];
    if (p === t.saida) return d;
    const x = p % t.W, y = Math.floor(p / t.W);
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= t.W || ny >= t.H) continue;
      const q = ny * t.W + nx; if (t.celulas[q] === "#" || quente(t, q, turno + 1)) continue;
      const key = `${q}:${(turno + 1) % 3}`; if (vist.has(key)) continue; vist.add(key); fila.push([q, turno + 1, d + 1]);
    }
  }
  return Infinity;
}
const OTIMOS = TRECHOS.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "Uma coluna solta vapor quente a cada turno, e a de vapor muda de lugar. Só pise numa coluna quando ela estiver fria.",
  "O mar tem uma parede no meio. Espere quando precisar: esperar também conta como turno.",
];

export default function VaporFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const turnosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRECHOS[0].ini);
  const [turno, setTurno] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const andar = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H) return;
    const q = y * t.W + x;
    if (t.celulas[q] === "#") { audio.sfx.vaporFase.bate(); setMsg("Parede. Esse caminho está fechado."); return; }
    if (quente(t, q, turno + 1)) { audio.sfx.vaporFase.bate(); setMsg("A coluna está quente agora. Espere ou procure outra."); return; }
    avanca(q);
  };
  const esperar = () => { if (fim.current || travado) return; if (quente(t, pos, turno + 1)) { audio.sfx.vaporFase.bate(); setMsg("Essa coluna vai esquentar. Saia daqui."); return; } avanca(pos); };
  const avanca = (q: number) => {
    turnosTotal.current++;
    setPos(q); setTurno(turno + 1);
    audio.sfx.vaporFase.passo();
    if (q === t.saida) { concluir(turnosTotal.current); return; }
    setMsg("O vapor sobe e a coluna muda de lugar.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.vaporFase.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de turnos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Você atravessa o vapor em ${n} turnos (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPos(TRECHOS[rodada + 1].ini); setTurno(0); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("coluna-de-vapor");
    setMsg(`Você sai do vapor pela outra margem (${nota}).`);
    agendar(() => complete("vapor", {
      estrelas: turnosTotal.current <= SOMA_OTIMOS ? 3 : turnosTotal.current <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Turnos: ${turnosTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Travessias refeitas: ${reinicios.current}` : "Nenhuma travessia refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPos(t.ini); setTurno(0); audio.sfx.interagir(); setMsg("Você volta à margem. Os turnos já passados continuam contando."); };

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button onClick={() => andar(dx, dy)} aria-label={rotulo} disabled={travado} className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40"><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="vapor" /></div>
      <p className="font-narrativa italic text-espuma/80">Travessia {rodada + 1} de {TRECHOS.length}: atravesse o vapor sem pisar numa coluna quente.</p>
      <div role="img" aria-label={`Travessia de ${t.W} por ${t.H}. Turno ${turno}.`} className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          const x = p % t.W;
          const q = quente(t, p, turno);
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44]" />;
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-500 ${q ? "bg-coral/35" : "bg-mare/25"}`}>
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {pos === p && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
              {x >= 0 && q && <span className="absolute bottom-0 left-0.5 text-sm font-bold text-coral" aria-hidden>≈</span>}
            </div>
          );
        })}
      </div>
      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={esperar} disabled={travado} className="flex items-center gap-2 rounded-xl border border-mare bg-mare/25 px-5 py-2 font-narrativa text-espuma/80 disabled:opacity-40"><Clock size={16} aria-hidden /> Esperar um turno</button>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 text-sm underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Voltar</button>
      </div>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
