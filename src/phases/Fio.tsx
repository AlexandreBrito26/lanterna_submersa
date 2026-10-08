import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · . chão · @ você · * saída.
// Cada passo seu deixa um fio no chão. Você não pode pisar num fio já deixado, nem voltar pelo mesmo caminho.
// Se ficar preso entre os fios, reinicie o trecho. OTIMOS é o caminho mais curto possível, por busca exaustiva.
const MAPAS = [
  ["@...#", "##.#.", "#...*", "#.###", "....."],
  ["@..#.", ".#.#.", ".#...", ".#.#.", "...#*"],
];
const OTIMOS = [6, 8];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Um fio de linha marca cada passo seu. Você não pode cruzar o próprio caminho: escolha cada casa como se fosse a última.",
  "O mar tem becos sem saída. Se o seu fio cercar a última casa, não há volta: reinicie e tente outro caminho.",
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

export default function FioFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(CAMPOS[0].ini);
  const [fios, setFios] = useState<number[]>([CAMPOS[0].ini]);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.fio.achou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você chega à saída em ${n} passos (${nota}). Um novo fio se estende até o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(CAMPOS[prox].ini);
        setFios([CAMPOS[prox].ini]);
        setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("fio-do-breu");
    const total = passosTotal.current;
    setMsg(`O fio te leva para fora do breu, sem um só passo perdido (${nota}).`);
    agendar(() => complete("fio", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Fios refeitos: ${reinicios.current}` : "Nenhum fio refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x;
    if (f.paredes.has(q)) { audio.sfx.fio.bate(); setMsg("Uma parede. O fio não passa por ela."); return; }
    if (fios.includes(q)) { audio.sfx.fio.bate(); setMsg("Seu próprio fio bloqueia a passagem. Escolha outra casa."); return; }
    passosTotal.current++;
    setPos(q);
    setFios([...fios, q]);
    setPassos(passos + 1);
    if (q === f.alvo) { concluir(passos + 1); return; }
    audio.sfx.fio.passo();
    setMsg("O fio se estende atrás de você.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(f.ini);
    setFios([f.ini]);
    setPassos(0);
    audio.sfx.interagir();
    setMsg("Você recolhe o fio e volta ao começo. Os passos já dados continuam contando.");
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
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="fio" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: chegue à saída sem cruzar o próprio fio.</p>

      <div
        role="img"
        aria-label={`Mar escuro com fio de ${fios.length} casas. Use as setas para andar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.paredes.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const fio = fios.includes(p), eu = pos === p, saida = f.alvo === p;
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-300 ${fio ? "bg-lanterna/20" : "bg-mare/25"}`}>
              {fio && !eu && <span className="absolute inset-[44%] rounded-full bg-lanterna/60" />}
              {saida && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.4)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Recolher o fio
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar com o fio">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
