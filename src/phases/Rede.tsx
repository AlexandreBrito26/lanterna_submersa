import { useEffect, useRef, useState } from "react";
import { Undo2, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # pedra (a rede não passa) · . água livre · * peixe (tem que ficar preso dentro) · @ onde a rede começa.
// A rede é um laço fechado: células vizinhas, sem repetir, voltando ao começo. OTIMOS foi achado por busca exaustiva.
const MAPAS = [
  ["......", ".*..*.", ".@....", "......", "......"],
  ["#.....", "..*...", ".@..*.", "......", "....#."],
  ["......", ".*....", "..@*..", "....*.", "......"],
];
const OTIMOS = [14, 14, 18];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Toque nas águas vizinhas para tecer a rede. Para fechá-la, volte ao ponto de partida com pelo menos quatro células.",
  "Agora há pedras no porto. A rede não atravessa pedras nem a si mesma, e os peixes precisam ficar presos lá dentro.",
  "A última rede do porto, com peixes espalhados. Um laço bem traçado prende todos de uma vez.",
];

type Campo = { W: number; H: number; pedras: Set<number>; peixes: number[]; inicio: number };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const pedras = new Set<number>(), peixes: number[] = [];
  let inicio = 0;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") pedras.add(p);
    if (c === "*") peixes.push(p);
    if (c === "@") inicio = p;
  }));
  return { W, H, pedras, peixes, inicio };
}
const CAMPOS = MAPAS.map(ler);

const centro = (f: Campo, p: number): [number, number] => [p % f.W + 0.5, Math.floor(p / f.W) + 0.5];

// Ray casting: o ponto está dentro do polígono formado pelo caminho?
function dentro(px: number, py: number, poli: [number, number][]): boolean {
  let c = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function presos(f: Campo, caminho: number[]): number {
  if (caminho.length < 3) return 0;
  const poli = caminho.map((p) => centro(f, p));
  return f.peixes.filter((q) => { const [x, y] = centro(f, q); return dentro(x, y, poli); }).length;
}

function vizinhos(f: Campo, a: number, b: number): boolean {
  const ax = a % f.W, ay = Math.floor(a / f.W), bx = b % f.W, by = Math.floor(b / f.W);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export default function RedeFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const cellsTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [caminho, setCaminho] = useState<number[]>([CAMPOS[0].inicio]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const dentroAgora = presos(f, caminho);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (tamanho: number) => {
    setTravado(true);
    audio.sfx.rede.fechar();
    const nota = tamanho === OTIMOS[rodada] ? "o laço mais curto" : `o laço mais curto tinha ${OTIMOS[rodada]} células`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`A rede fecha e prende todos os peixes (${nota}). O próximo trecho do porto se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setCaminho([CAMPOS[prox].inicio]);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2400);
      return;
    }
    fim.current = true;
    giveItem("rede-do-porto");
    const total = cellsTotal.current;
    setMsg(`Todos os peixes ficam presos, e a rede segue para a maré (${nota}).`);
    agendar(() => complete("rede", {
      estrelas: total <= SOMA_OTIMOS + 3 ? 3 : total <= SOMA_OTIMOS + 10 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Células na rede: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Redes refeitas: ${reinicios.current}` : "Nenhuma rede refeita"],
    }), 2800);
  };

  const tocar = (p: number) => {
    if (fim.current || travado) return;
    if (f.pedras.has(p) || f.peixes.includes(p)) { audio.sfx.rede.falha(); setMsg("A rede não passa por ali."); return; }
    if (caminho.length >= 4 && p === caminho[0]) {
      if (presos(f, caminho) === f.peixes.length) {
        cellsTotal.current += caminho.length;
        concluir(caminho.length);
        return;
      }
      audio.sfx.rede.falha();
      setMsg("A rede fecha, mas algum peixe ficou de fora. Desfaça um trecho e tente de novo.");
      return;
    }
    if (caminho.includes(p)) { audio.sfx.rede.falha(); setMsg("A rede não pode cruzar a si mesma."); return; }
    if (!vizinhos(f, caminho[caminho.length - 1], p)) { audio.sfx.rede.falha(); setMsg("Só dá para tecer a rede em células vizinhas."); return; }
    const novo = [...caminho, p];
    setCaminho(novo);
    audio.sfx.rede.tecer();
    const n = presos(f, novo);
    setMsg(n ? `${n} de ${f.peixes.length} peixes presos até agora.` : "A rede cresce. Feche voltando ao ponto de partida.");
  };

  const desfazer = () => {
    if (fim.current || travado || caminho.length < 2) return;
    setCaminho(caminho.slice(0, -1));
    audio.sfx.rede.desfazer();
    setMsg("Você desfaz o último trecho da rede.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setCaminho([f.inicio]);
    audio.sfx.interagir();
    setMsg("A rede volta ao ponto de partida. Os trechos já tecidos continuam contando.");
  };

  const pontos = caminho.map((p) => centro(f, p).join(",")).join(" ");
  const sobreAberto = caminho.length >= 4 && dentroAgora === f.peixes.length;

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="rede" />
      <div className="flex justify-center"><Cabecalho id="rede" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: prenda os {f.peixes.length} peixes dentro do laço.</p>

      <div className="mx-auto w-full pl-0" style={{ maxWidth: f.W * 60 }}>
        <div className="relative w-full" style={{ aspectRatio: `${f.W} / ${f.H}` }}>
          <div
            className="absolute inset-0 grid rounded-lg border border-latao/60 bg-abismo/50 backdrop-blur-sm"
            style={{ gridTemplateColumns: `repeat(${f.W}, 1fr)`, gridTemplateRows: `repeat(${f.H}, 1fr)` }}
          >
            {Array.from({ length: f.W * f.H }, (_, p) => {
              const x = p % f.W, y = Math.floor(p / f.W);
              if (f.pedras.has(p)) return <div key={p} role="img" aria-label="Pedra" className="border border-espuma/10 bg-[#2a3d44] shadow-inner" />;
              if (f.peixes.includes(p)) {
                return (
                  <div key={p} role="img" aria-label="Peixe" className="flex items-center justify-center border border-espuma/10">
                    <span className="h-3/5 w-3/5 rounded-full bg-coral shadow-[0_0_10px_2px_rgba(224,122,95,0.45)]" />
                  </div>
                );
              }
              const naRede = caminho.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => tocar(p)}
                  aria-label={`Linha ${y + 1}, coluna ${x + 1}${naRede ? ", parte da rede" : ""}${p === caminho[0] ? ", ponto de partida" : ""}`}
                  className={`border border-espuma/10 transition-colors ${naRede ? "bg-lanterna/15" : "bg-mare/25 hover:bg-mare/45"}`}
                />
              );
            })}
          </div>

          {caminho.length >= 2 && (
            <svg viewBox={`0 0 ${f.W} ${f.H}`} preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <polyline points={pontos} fill={sobreAberto ? "rgba(255,191,0,0.12)" : "none"} stroke="#FFBF00" strokeWidth="0.08" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px rgba(255,191,0,0.7))" }} />
            </svg>
          )}
        </div>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Células: {caminho.length} · Presos: {dentroAgora}/{f.peixes.length}</span>
        <span className="flex items-center gap-4">
          <button onClick={desfazer} disabled={caminho.length < 2 || travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <Undo2 size={14} aria-hidden /> Desfazer
          </button>
          <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
            <RotateCcw size={14} aria-hidden /> Refazer
          </button>
        </span>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
