import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # parede · . chão · @ você · * saída.
// No escuro você não vê as paredes, mas cada casa visitada mostra quantas paredes há ao redor dela (0 a 4).
// Use os números para deduzir onde não há parede. Bater numa parede não sai do lugar e conta como batida.
// OTIMOS é o mínimo de passos de cada trecho, por busca em largura sobre o mapa completo.
const MAPAS = [
  ["@.....", ".##.#.", "...#..", "#...#.", "...#.*"],
  ["@..#...", "..#...#", "....#..", ".#...#.", "...#..*"],
];
const OTIMOS = [9, 10];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Você não vê as paredes. Cada casa que visita mostra quantas paredes a cercam. Use esses números para não bater no escuro.",
  "O mar é maior e os números se confundem. Compare as casas vizinhas: uma contagem alta quase sempre esconde uma parede logo ao lado.",
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

// Quantas paredes cercam a casa p (até 4 vizinhas)
function vizinhasParede(f: Campo, p: number): number {
  const x = p % f.W, y = Math.floor(p / f.W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx < 0 || ny < 0 || nx >= f.W || ny >= f.H || f.paredes.has(ny * f.W + nx);
  }).length;
}

export default function ContagemFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(CAMPOS[0].ini);
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
    audio.sfx.contagem.achou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você chega à saída em ${n} passos (${nota}). Os números se acalmam e mostram o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(CAMPOS[prox].ini);
        setVisitadas(new Set([CAMPOS[prox].ini]));
        setPassos(0); setBatidas(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("contagem-no-escuro");
    const total = passosTotal.current;
    setMsg(`A saída é encontrada pelas contas, e não pelos olhos (${nota}).`);
    agendar(() => complete("contagem", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x;
    if (f.paredes.has(q)) {
      setBatidas(batidas + 1);
      audio.sfx.contagem.bate();
      setMsg("Uma parede. Você não sai do lugar, mas agora sabe que ela está ali.");
      return;
    }
    passosTotal.current++;
    setPos(q);
    setPassos(passos + 1);
    setVisitadas(new Set([...visitadas, q]));
    if (q === f.alvo) { concluir(passos + 1); return; }
    audio.sfx.contagem.passo();
    setMsg(`Esta casa tem ${vizinhasParede(f, q)} ${vizinhasParede(f, q) === 1 ? "parede" : "paredes"} ao redor.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(f.ini);
    setVisitadas(new Set([f.ini]));
    audio.sfx.interagir();
    setMsg("Você volta ao começo. As contagens já descobertas continuam guardadas.");
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
      <div className="flex justify-center"><Cabecalho id="contagem" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: deduza o caminho pelas contagens.</p>

      <div
        role="img"
        aria-label={`Mar escuro com ${visitadas.size} casas visitadas e suas contagens de paredes.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const visto = visitadas.has(p), eu = pos === p, saida = f.alvo === p;
          return (
            <div key={p} className={`relative flex aspect-square items-center justify-center rounded-sm transition-colors duration-500 ${visto ? "bg-mare/30" : "bg-[#06121a]"}`}>
              {visto && !saida && <span className="font-narrativa text-lg text-lanterna">{vizinhasParede(f, p)}</span>}
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
