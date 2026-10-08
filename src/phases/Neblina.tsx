import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · . mar · @ você · * saída.
// A neblina esconde tudo: você só enxerga as casas que já visitou e as vizinhas delas. Memorize o caminho.
// OTIMOS é o mínimo de passos de cada trecho, calculado com o mapa todo visível (busca em largura).
const MAPAS = [
  ["@....", ".###.", "....#", "##.#.", "...*."],
  ["@.....", ".####.", "......", "#.###.", "....*."],
  ["@.#....", "..#.##.", "....#..", ".##...#", "......*"],
];
const OTIMOS = [7, 8, 10];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "A neblina cobre o mar. Você só vê a casa onde está e as vizinhas. Ande com cuidado e guarde o caminho na memória.",
  "Há paredes de pedra escondidas na névoa. Uma casa visitada fica marcada, e a névoa não volta a esconder o que você já viu.",
  "O último trecho da neblina. Quando a névoa estiver mais densa, procure as passagens longas, que costumam levar à saída.",
];

type Campo = { W: number; H: number; rochas: Set<number>; ini: number; alvo: number };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const rochas = new Set<number>();
  let ini = 0, alvo = 0;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") rochas.add(p);
    if (c === "@") ini = p;
    if (c === "*") alvo = p;
  }));
  return { W, H, rochas, ini, alvo };
}
const CAMPOS = MAPAS.map(ler);

export default function NeblinaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pos, setPos] = useState(CAMPOS[0].ini);
  const [vistas, setVistas] = useState<Set<number>>(() => new Set([CAMPOS[0].ini]));
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  // Uma casa é vista se foi visitada ou se é vizinha de uma casa visitada
  const visivel = (p: number): boolean => {
    if (vistas.has(p)) return true;
    const x = p % f.W, y = Math.floor(p / f.W);
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && vistas.has(ny * f.W + nx);
    });
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.neblina.achou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você chega à saída em ${n} passos (${nota}). A névoa se abre por um instante e mostra o trecho seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPos(CAMPOS[prox].ini);
        setVistas(new Set([CAMPOS[prox].ini]));
        setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("farol-na-neblina");
    const total = passosTotal.current;
    setMsg(`A névoa se desfaz, e o farol aparece inteiro no horizonte (${nota}).`);
    agendar(() => complete("neblina", {
      estrelas: total <= SOMA_OTIMOS + 4 ? 3 : total <= SOMA_OTIMOS + 10 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Trechos refeitos: ${reinicios.current}` : "Nenhum trecho refeito"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (pos % f.W) + dx, y = Math.floor(pos / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x;
    if (f.rochas.has(q)) { audio.sfx.neblina.parede(); setMsg("Uma pedra escondida na névoa. Você recua."); return; }
    const novaCasa = !vistas.has(q);
    passosTotal.current++;
    setPos(q);
    setPassos(passos + 1);
    if (novaCasa) setVistas(new Set([...vistas, q]));
    if (q === f.alvo) { concluir(passos + 1); return; }
    if (novaCasa) audio.sfx.neblina.revela(); else audio.sfx.neblina.passo();
    setMsg(novaCasa ? "Uma nova casa aparece por entre a névoa." : "Você volta a um caminho que já conhecia.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPos(f.ini);
    setVistas(new Set([f.ini]));
    setPassos(0);
    audio.sfx.interagir();
    setMsg("A névoa engole o caminho de volta. Você começa de novo, mas os passos já dados continuam contando.");
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
      <AmbienteFase tipo="neblina" />
      <div className="flex justify-center"><Cabecalho id="neblina" /></div>

      <p className="font-narrativa italic text-espuma/80">Trecho {rodada + 1} de {CAMPOS.length}: encontre a saída na névoa.</p>

      <div
        role="img"
        aria-label={`Mar coberto de névoa. Você está visitando ${vistas.size} casas. Use as setas para andar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          const vis = visivel(p);
          if (!vis) return <div key={p} className="aspect-square rounded-sm bg-[#081a22]" />;
          if (f.rochas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const alvo = f.alvo === p, eu = pos === p, visitada = vistas.has(p);
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-500 ${visitada ? "bg-mare/45" : "bg-mare/20"}`}>
              {alvo && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.55)]" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · Casas vistas: {vistas.size}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Reiniciar
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar na neblina">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
