import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Compass, RotateCcw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Bússola girada. Cada passo que você dá gira a bússola 90° no sentido horário, então a direção que você aperta
// vira outra direção no mapa. Bater numa parede não gira a bússola. Chegue à saída (E). OTIMOS é o mínimo de passos (busca em largura).
const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const NOMES = ["direita", "baixo", "esquerda", "cima"];
const MAPAS = [
  ["S..#.", ".#...", "...#.", "#...E"],
  ["S...", ".##.", "...E"],
];
type Trecho = { W: number; H: number; celulas: string[]; ini: number; saida: number };
function ler(m: string[]): Trecho { const c = m.flatMap((l) => [...l]); return { W: m[0].length, H: m.length, celulas: c, ini: c.indexOf("S"), saida: c.indexOf("E") }; }
const TRE = MAPAS.map(ler);
function minimo(t: Trecho): number {
  const fila: [number, number, number][] = [[t.ini, 0, 0]]; const vist = new Set([`${t.ini}:0`]);
  for (let i = 0; i < fila.length; i++) {
    const [p, r, d] = fila[i];
    if (p === t.saida) return d;
    for (let k = 0; k < 4; k++) {
      const [dx, dy] = DIRS[(k + r) % 4];
      const x = (p % t.W) + dx, y = Math.floor(p / t.W) + dy;
      if (x < 0 || y < 0 || x >= t.W || y >= t.H) continue;
      const q = y * t.W + x; if (t.celulas[q] === "#") continue;
      const r2 = (r + 1) % 4, key = `${q}:${r2}`;
      if (vist.has(key)) continue; vist.add(key); fila.push([q, r2, d + 1]);
    }
  }
  return Infinity;
}
const OTIMOS = TRE.map(minimo);
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const INTROS = [
  "A bússola gira a cada passo. Se você apertar para a direita, nem sempre vai para a direita. Descubra o padrão antes de andar.",
  "Mapa menor, mas a bússola continua girando do mesmo jeito. Conte os passos e confira para onde cada tecla está levando.",
];

export default function BussolaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const desfazeres = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(TRE[0].ini);
  const [rot, setRot] = useState(0);
  const [hist, setHist] = useState<{ pos: number; rot: number }[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRE[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const apertar = (k: number) => {
    if (fim.current || travado) return;
    const [dx, dy] = DIRS[(k + rot) % 4];
    const x = (pos % t.W) + dx, y = Math.floor(pos / t.W) + dy;
    if (x < 0 || y < 0 || x >= t.W || y >= t.H || t.celulas[y * t.W + x] === "#") {
      audio.sfx.bussola.bate(); setMsg(`A bússola manda ir para ${NOMES[(k + rot) % 4]}, mas há uma parede.`); return;
    }
    const q = y * t.W + x, r2 = (rot + 1) % 4;
    setHist([...hist, { pos, rot }]);
    passosTotal.current++;
    setPos(q); setRot(r2);
    audio.sfx.bussola.passo();
    if (q === t.saida) { concluir(passosTotal.current); return; }
    setMsg(`Você foi para ${NOMES[(k + rot) % 4]}. A bússola girou.`);
  };

  const desfazer = () => {
    if (fim.current || travado || hist.length === 0) return;
    const ant = hist[hist.length - 1];
    desfazeres.current++;
    setPos(ant.pos); setRot(ant.rot); setHist(hist.slice(0, -1));
    audio.sfx.interagir(); setMsg("Você volta um passo, e a bússola volta ao que era.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.bussola.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de passos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRE.length - 1) {
      setMsg(`A bússola para no norte e você chega à saída (${nota}).`);
      agendar(() => { setRodada(rodada + 1); setPos(TRE[rodada + 1].ini); setRot(0); setHist([]); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("bussola-girada");
    const total = passosTotal.current;
    setMsg(`O caminho se mostra por inteiro, e a bússola aponta para a luz (${nota}).`);
    agendar(() => complete("bussola", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Bússolas refeitas: ${reinicios.current}` : "Nenhuma bússola refeita"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setPos(t.ini); setRot(0); setHist([]); audio.sfx.interagir(); setMsg("Você volta ao início e a bússola zera. Os passos já dados continuam contando."); };

  const seta = (rotulo: string, Icone: typeof ArrowUp, k: number) => (
    <button onClick={() => apertar(k)} aria-label={`Apertar ${rotulo}`} disabled={travado} className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40"><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="bussola" /></div>
      <p className="font-narrativa italic text-espuma/80">Mar {rodada + 1} de {TRE.length}: a bússola gira a cada passo. Chegue à saída.</p>
      <div className="mx-auto flex items-center gap-3 text-sm text-espuma/70" aria-live="polite">
        <Compass size={18} aria-hidden style={{ transform: `rotate(${rot * 90}deg)`, transition: "transform 0.4s" }} />
        <span>A bússola está apontando para: {NOMES[rot]} (o próximo passo gira a bússola)</span>
      </div>
      <div role="img" aria-label={`Mar de ${t.W} por ${t.H}. Passos: ${passosTotal.current}`} className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}>
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44]" />;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {c === "E" && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {pos === p && <span className="absolute inset-[18%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>
      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Apertar direções">
        <span />{seta("para cima", ArrowUp, 3)}<span />
        {seta("para a esquerda", ArrowLeft, 2)}{seta("para baixo", ArrowDown, 1)}{seta("para a direita", ArrowRight, 0)}
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passosTotal.current}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={!hist.length || travado} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Desfazer</button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Reiniciar</button>
        </span>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
