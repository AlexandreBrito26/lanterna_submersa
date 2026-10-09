import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleDot, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · . chão · @ você · * saída.
// No escuro, você pode atirar uma pedra em qualquer direção (botão de pedra). Ela revela a primeira parede
// que encontrar naquela linha. Andar para uma parede desconhecida também a revela, como batida.
// Vence chegando à saída. Estrelas pelo total de pedras e batidas.
const MAPAS = [
  ["@..#..", ".#...#", "...#..", "#...#.", "..#..*"],
  ["@.#.....", "..#.##..", "....#...", ".##...#.", "...#..#.", "#.....*."],
];
const SOMA_LIMITE = { tres: 3, dois: 6 };

const INTROS = [
  "Você tem pedras para atirar no escuro. Escolha uma direção, atire, e a primeira parede daquela linha se revela.",
  "O mar é mais largo e as paredes se escondem melhor. Atire com cuidado: cada pedra conta.",
];
const DIRECOES: Array<{ rotulo: string; dx: number; dy: number; Icone: typeof ArrowUp }> = [
  { rotulo: "para cima", dx: 0, dy: -1, Icone: ArrowUp },
  { rotulo: "para baixo", dx: 0, dy: 1, Icone: ArrowDown },
  { rotulo: "para a esquerda", dx: -1, dy: 0, Icone: ArrowLeft },
  { rotulo: "para a direita", dx: 1, dy: 0, Icone: ArrowRight },
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

export default function PedraFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const pedrasTotal = useRef(0);
  const batidasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(CAMPOS[0].ini);
  const [reveladas, setReveladas] = useState<Set<number>>(() => new Set());
  const [pedras, setPedras] = useState(0);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = () => {
    setTravado(true);
    audio.sfx.pedra.achou();
    if (rodada < CAMPOS.length - 1) {
      setMsg("A pedra acerta a última parede e a saída aparece. O mar seguinte se abre.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(CAMPOS[prox].ini);
        setReveladas(new Set());
        setPedras(0); setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("pedra-lancada");
    const total = pedrasTotal.current;
    setMsg("Você chega à saída guiado pelas pedras. O breu não é tão grande quando se atira nele.");
    agendar(() => complete("pedra", {
      estrelas: total <= SOMA_LIMITE.tres ? 3 : total <= SOMA_LIMITE.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Pedras atiradas: ${total}`, `Batidas: ${batidasTotal.current}`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  // Atira uma pedra: revela a primeira parede na linha
  const atirar = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    let x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    let achou: number | null = null;
    while (x >= 0 && y >= 0 && x < f.W && y < f.H) {
      const q = y * f.W + x;
      if (f.paredes.has(q)) { achou = q; break; }
      x += dx; y += dy;
    }
    pedrasTotal.current++;
    setPedras(pedras + 1);
    audio.sfx.pedra.atirar();
    if (achou === null) { setMsg("A pedra cai no vazio e chega até a borda do mar. Não há parede nessa direção."); return; }
    setReveladas(new Set([...reveladas, achou]));
    setMsg("A pedra bate numa parede, e ela fica marcada no mapa.");
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x;
    if (reveladas.has(q)) { audio.sfx.pedra.bate(); setMsg("Você conhece essa parede e não tenta de novo."); return; }
    if (f.paredes.has(q)) {
      batidasTotal.current++;
      setReveladas(new Set([...reveladas, q]));
      audio.sfx.pedra.bate();
      setMsg("Uma parede inesperada. Você recua e ela fica marcada.");
      return;
    }
    setPos(q);
    setPassos(passos + 1);
    if (q === f.alvo) { concluir(); return; }
    audio.sfx.pedra.passo();
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(f.ini);
    audio.sfx.interagir();
    setMsg("Você volta ao começo. As paredes já reveladas continuam marcadas.");
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
      <div className="flex justify-center"><Cabecalho id="pedra" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: atire pedras e chegue à saída.</p>

      <div
        role="img"
        aria-label={`Mar escuro com ${reveladas.size} paredes reveladas. Use as setas para andar e os botões para atirar pedras.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (reveladas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const eu = pos === p, saida = f.alvo === p;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-[#06121a]">
              {saida && <span className="absolute inset-[24%] rounded-full bg-lanterna/60" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma/80 shadow-[0_0_10px_2px_rgba(242,230,214,0.35)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pedras: {pedras} · Passos: {passos}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Voltar ao começo
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar no escuro">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <div className="mx-auto flex flex-wrap justify-center gap-2" role="group" aria-label="Atirar pedra">
        {DIRECOES.map((d) => (
          <button
            key={d.rotulo}
            onClick={() => atirar(d.dx, d.dy)}
            disabled={travado}
            className="flex items-center gap-2 rounded-full border border-latao/60 bg-[#4a3424]/60 px-4 py-2 text-sm text-espuma active:scale-95 disabled:opacity-40"
          >
            <CircleDot size={14} aria-hidden /> Pedra {d.rotulo}
          </button>
        ))}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
