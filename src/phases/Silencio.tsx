import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · . chão · @ você · * saída.
// Mar sem luz: você não enxerga as paredes. Ao tentar andar para uma parede, ela se revela e você
// fica no lugar (isso conta como batida). Vence chegando à saída. Batidas valem estrela.
const MAPAS = [
  ["@..#..", ".#...#", "...#..", "#...#.", "..#..*"],
  ["@.#.....", "..#.##..", "....#...", ".##...#.", "...#..#.", "#.....*."],
];
const OTIMOS = [9, 11];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "O mar do Apagar não tem luz. As paredes só aparecem quando você bate nelas. Ande devagar e guarde o que sentir.",
  "O mar é mais fundo e as paredes se espalham. Cada batida é uma lembrança a menos, então escolha bem para onde ir.",
];

type Campo = { W: number; H: number; paredes: Set<number>; ini: number; alvo: number };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const paredes = new Set<number>();
  let ini = 0, alvo = 0;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") paredes.add(p);
    if (c === "@") ini = p;
    if (c === "*") alvo = p;
  }));
  return { W, H, paredes, ini, alvo };
}
const CAMPOS = MAPAS.map(ler);

export default function SilencioFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const batidasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(CAMPOS[0].ini);
  const [reveladas, setReveladas] = useState<Set<number>>(() => new Set());
  const [visitadas, setVisitadas] = useState<Set<number>>(() => new Set([CAMPOS[0].ini]));
  const [passos, setPassos] = useState(0);
  const [batidas, setBatidas] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.silencio.achou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você sente a saída em ${n} passos (${nota}). A correnteza empurra para o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(CAMPOS[prox].ini);
        setReveladas(new Set());
        setVisitadas(new Set([CAMPOS[prox].ini]));
        setPassos(0); setBatidas(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("mar-sem-luz");
    const total = batidasTotal.current;
    setMsg(`Você chega à saída no escuro. A luz não precisava estar acesa para que você soubesse onde estava (${nota}).`);
    agendar(() => complete("silencio", {
      estrelas: total === 0 ? 3 : total <= 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Batidas: ${total}`, `Passos: ${passosTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x;
    if (reveladas.has(q)) { audio.sfx.silencio.passo(); setMsg("Você já conhece essa parede e não tenta de novo."); return; }
    if (f.paredes.has(q)) {
      batidasTotal.current++;
      setReveladas(new Set([...reveladas, q]));
      setBatidas(batidas + 1);
      audio.sfx.silencio.bate();
      setMsg("Uma parede no escuro. Você fica no lugar e guarda a posição dela.");
      return;
    }
    passosTotal.current++;
    setPos(q);
    setPassos(passos + 1);
    setVisitadas(new Set([...visitadas, q]));
    if (q === f.alvo) { concluir(passos + 1); return; }
    audio.sfx.silencio.passo();
    setMsg("Você avança no escuro, com a mão estendida.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(f.ini);
    setVisitadas(new Set([f.ini]));
    audio.sfx.interagir();
    setMsg("Você volta ao começo do trecho. As paredes já conhecidas continuam guardadas.");
  };

  const acoes = useRef({ mover });
  acoes.current = { mover };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (d[e.key]) { e.preventDefault(); acoes.current.mover(...d[e.key]); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button
      onClick={() => mover(dx, dy)}
      aria-label={rotulo}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95"
    ><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="silencio" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: chegue à saída sem luz.</p>

      <div
        role="img"
        aria-label={`Mar escuro. ${reveladas.size} paredes conhecidas. Use as setas para andar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (reveladas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const eu = pos === p, saida = f.alvo === p, visto = visitadas.has(p);
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-500 ${visto ? "bg-mare/30" : "bg-[#06121a]"}`}>
              {saida && <span className="absolute inset-[24%] rounded-full bg-lanterna/60" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma/80 shadow-[0_0_10px_2px_rgba(242,230,214,0.35)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · Batidas: {batidas}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Voltar ao começo
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar no escuro">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
