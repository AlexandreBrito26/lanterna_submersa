import { useRef, useState } from "react";
import { RotateCcw, RotateCw, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

const GLIFOS = ["Estrela", "Lua", "Vela", "Janela", "Gema", "Cruz", "Colmeia", "Aro"];
const ANEIS = [
  { nome: "Anel externo", raio: 118, arrasta: "arrasta o anel do meio" },
  { nome: "Anel do meio", raio: 80, arrasta: "arrasta o anel interno" },
  { nome: "Anel interno", raio: 43, arrasta: "gira sozinho" },
];
const LANCES_EMBARALHO = 9;

type Giros = [number, number, number];

// Cada anel arrasta o seguinte no mesmo sentido: externo move o do meio, o do meio move o interno
function aplicar(g: Giros, anel: number, dir: number): Giros {
  const n: Giros = [...g];
  n[anel] += dir;
  if (anel < 2) n[anel + 1] += dir;
  return n;
}
const pos = (v: number) => ((v % 8) + 8) % 8;
const resolvido = (g: Giros) => g.every((v) => pos(v) === 0);

// Parte do estado resolvido e embaralha com lances de verdade, então sempre há solução
function embaralhar(): Giros {
  let g: Giros = [0, 0, 0];
  do {
    g = [0, 0, 0];
    for (let i = 0; i < LANCES_EMBARALHO; i++) g = aplicar(g, Math.floor(Math.random() * 3), Math.random() < 0.5 ? 1 : -1);
  } while (resolvido(g));
  return g;
}

function estrela(cx: number, cy: number, R: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r : R;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");
}

function Glifo({ i, x, y, cor }: { i: number; x: number; y: number; cor: string }) {
  switch (i) {
    case 0: return <polygon points={estrela(x, y, 11, 4.6)} fill={cor} />;
    case 1: return <circle cx={x} cy={y} r="7" fill={cor} />;
    case 2: return <polygon points={`${x},${y - 8} ${x + 8},${y + 7} ${x - 8},${y + 7}`} fill={cor} />;
    case 3: return <rect x={x - 7} y={y - 7} width="14" height="14" fill={cor} />;
    case 4: return <polygon points={`${x},${y - 9} ${x + 7},${y} ${x},${y + 9} ${x - 7},${y}`} fill={cor} />;
    case 5: return <path d={`M${x - 8} ${y} H${x + 8} M${x} ${y - 8} V${y + 8}`} stroke={cor} strokeWidth="4" />;
    case 6: return <polygon points={`${x - 4},${y - 8} ${x + 4},${y - 8} ${x + 9},${y} ${x + 4},${y + 8} ${x - 4},${y + 8} ${x - 9},${y}`} fill={cor} />;
    default: return <circle cx={x} cy={y} r="7" fill="none" stroke={cor} strokeWidth="3" />;
  }
}

export default function Observatorio() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const [giros, setGiros] = useState<Giros>(embaralhar);
  const [historico, setHistorico] = useState<{ anel: number; dir: number }[]>([]);
  const [lances, setLances] = useState(0);
  const [msg, setMsg] = useState("Leve a Estrela ao topo dos três anéis. Atenção: girar um anel também arrasta o seguinte.");

  const alinhados = giros.filter((v) => pos(v) === 0).length;

  const mover = (anel: number, dir: number, desfazendo = false) => {
    if (fim.current) return;
    const novo = aplicar(giros, anel, dir);
    const antes = alinhados, depois = novo.filter((v) => pos(v) === 0).length;
    setGiros(novo);
    setLances((l) => l + 1);
    if (!desfazendo) setHistorico((h) => [...h, { anel, dir }]);
    audio.sfx.anel();
    if (resolvido(novo)) {
      fim.current = true;
      audio.sfx.constelacao();
      audio.sfx.porta();
      audio.sfx.vitoria();
      giveItem("carta-celeste");
      setMsg("Os três anéis travam juntos. No vidro da cúpula, a Estrela aparece inteira, e uma linha de luz sobe até a superfície.");
      const total = lances + 1;
      window.setTimeout(() => complete("observatorio", {
        estrelas: total <= LANCES_EMBARALHO + 3 ? 3 : total <= 22 ? 2 : 1,
        tempo: Math.round((performance.now() - inicio.current) / 1000),
        detalhes: [`Lances: ${total}`],
      }), 1900);
      return;
    }
    if (depois > antes) { audio.sfx.sonar(); setMsg(`${depois} de 3 anéis com a Estrela no topo.`); }
    else if (depois < antes) setMsg("Esse lance desalinhou um anel que já estava certo.");
    else setMsg(`${depois} de 3 anéis alinhados.`);
  };

  const desfazer = () => {
    const ult = historico[historico.length - 1];
    if (!ult || fim.current) return;
    setHistorico(historico.slice(0, -1));
    mover(ult.anel, -ult.dir, true);
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coracao" />
      <div className="flex justify-center"><Cabecalho id="observatorio" /></div>

      <p className="font-narrativa italic text-espuma/80">Bronze frio, vidro trincado e, lá em cima, um pedaço de céu.</p>

      <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-xs" role="img" aria-label={`Três anéis de bronze. ${alinhados} de 3 com a Estrela no topo.`}>
        <circle cx="150" cy="150" r="140" fill="#0A1A1F" stroke="#A67C52" strokeWidth="2" opacity="0.8" />
        <line x1="150" y1="14" x2="150" y2="150" stroke="#F2E6D6" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
        {ANEIS.map((a, k) => {
          const ok = pos(giros[k]) === 0;
          return (
            <g key={a.nome}>
              <circle cx="150" cy="150" r={a.raio} fill="none" stroke={ok ? "#FFBF00" : "#A67C52"} strokeWidth="1.5" opacity={ok ? 0.9 : 0.5} style={{ transition: "stroke .4s" }} />
              <g style={{ transform: `rotate(${-giros[k] * 45}deg)`, transformOrigin: "150px 150px", transition: "transform 0.5s ease" }}>
                {GLIFOS.map((_, j) => (
                  <g key={j} transform={`rotate(${j * 45} 150 150)`}>
                    <Glifo i={j} x={150} y={150 - a.raio} cor={j === 0 ? "#FFBF00" : "#F2E6D6"} />
                  </g>
                ))}
              </g>
            </g>
          );
        })}
        <polygon points="142,2 158,2 150,16" fill="#FFBF00" />
        <circle cx="150" cy="150" r="5" fill="#FFBF00" opacity={alinhados === 3 ? 1 : 0.3} />
      </svg>

      <section className="flex flex-col gap-3" aria-label="Controles dos anéis">
        {ANEIS.map((a, k) => (
          <div key={a.nome} className="flex items-center gap-3 rounded-xl border border-mare bg-mare/30 px-3 py-2 backdrop-blur-sm">
            <div className="flex-1">
              <span className={`block font-narrativa text-lg ${pos(giros[k]) === 0 ? "text-lanterna" : ""}`}>{a.nome}</span>
              <span className="block text-xs text-espuma/60">No topo: {GLIFOS[pos(giros[k])]} · {a.arrasta}</span>
            </div>
            <button onClick={() => mover(k, 1)} aria-label={`Girar ${a.nome} no sentido anti-horário`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-lanterna/60 text-lanterna active:scale-95"><RotateCcw size={18} aria-hidden /></button>
            <button onClick={() => mover(k, -1)} aria-label={`Girar ${a.nome} no sentido horário`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-lanterna/60 text-lanterna active:scale-95"><RotateCw size={18} aria-hidden /></button>
          </div>
        ))}
      </section>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Lances: {lances} · Alinhados: {alinhados}/3</span>
        <button onClick={desfazer} disabled={!historico.length} className="flex items-center gap-1 underline disabled:opacity-40"><Undo2 size={14} aria-hidden /> Desfazer (conta como lance)</button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
