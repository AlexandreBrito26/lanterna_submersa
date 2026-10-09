import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Trilha lembrada. Um caminho aparece por alguns segundos e depois some. Refaça a sequência de direções a partir do início.
// Bater numa parede ou sair do caminho conta como erro e recomeça a trilha. Estrelas pelos erros.
const DIR: Record<string, [number, number]> = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };
const SETA = { R: ArrowRight, L: ArrowLeft, D: ArrowDown, U: ArrowUp };
type Trecho = { W: number; H: number; inicio: [number, number]; saida: [number, number]; caminho: string; paredes: [number, number][] };
const TRECHOS: Trecho[] = [
  { W: 5, H: 4, inicio: [0, 0], saida: [3, 2], caminho: "RRDDR", paredes: [[0, 2], [4, 1], [1, 2], [3, 0], [4, 3]] },
  { W: 5, H: 5, inicio: [0, 0], saida: [4, 3], caminho: "DDRRDRR", paredes: [[1, 0], [3, 1], [4, 1], [1, 4], [3, 4], [4, 4]] },
];
const LIMITE = { tres: 0, dois: 3 };
const MOSTRAR_MS = 3800;

const INTROS = [
  "Olhe bem o caminho. Ele vai sumir, e você precisa refazê-lo do começo ao fim, só de memória.",
  "Um caminho mais longo, com a saída do lado oposto. Decore cada curva antes que a trilha suma.",
];

export default function TrilhaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [mostrando, setMostrando] = useState(true);
  const [feitos, setFeitos] = useState<string>("");
  const [pos, setPos] = useState<[number, number]>(TRECHOS[0].inicio);
  const [erros, setErros] = useState(0);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const paredes = new Set(t.paredes.map(([x, y]) => `${x},${y}`));
  const caminhoCelulas: string[] = [];
  { let [x, y] = t.inicio; caminhoCelulas.push(`${x},${y}`); for (const c of t.caminho) { x += DIR[c][0]; y += DIR[c][1]; caminhoCelulas.push(`${x},${y}`); } }

  useEffect(() => {
    setMostrando(true);
    const id = window.setTimeout(() => setMostrando(false), MOSTRAR_MS);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [rodada]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    audio.sfx.trilha.chegou();
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Você refez a trilha sem se perder (${n} ${n === 1 ? "erro" : "erros"}). O próximo caminho se abre.`);
      agendar(() => { setRodada(rodada + 1); setFeitos(""); setPos(TRECHOS[rodada + 1].inicio); setErros(0); setMsg(INTROS[rodada + 1]); }, 2200);
      return;
    }
    fim.current = true;
    giveItem("trilha-lembrada");
    const total = errosTotal.current;
    setMsg(`Você chega à luz pelo caminho que guardou na memória (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("trilha", {
      estrelas: total <= LIMITE.tres ? 3 : total <= LIMITE.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Erros: ${total}`, reinicios.current ? `Trilhas refeitas: ${reinicios.current}` : "Nenhuma trilha refeita"],
    }), 2600);
  };

  const andar = (d: "R" | "L" | "D" | "U") => {
    if (fim.current || mostrando) return;
    const esperado = t.caminho[feitos.length];
    const [dx, dy] = DIR[d];
    const [x, y] = pos;
    const nx = x + dx, ny = y + dy;
    const fora = nx < 0 || ny < 0 || nx >= t.W || ny >= t.H;
    if (fora || paredes.has(`${nx},${ny}`) || d !== esperado) {
      errosTotal.current++;
      setErros((e) => e + 1);
      audio.sfx.trilha.erro();
      setMsg(fora || paredes.has(`${nx},${ny}`) ? "Parede! A trilha recomeça do início." : "Essa curva não estava no caminho. A trilha recomeça do início.");
      setPos(t.inicio); setFeitos("");
      return;
    }
    const novo = feitos + d;
    setFeitos(novo);
    setPos([nx, ny]);
    audio.sfx.trilha.passo();
    if (novo === t.caminho) { concluir(erros); return; }
    setMsg("Certo. Continue pela trilha que você guardou.");
  };

  const reiniciar = () => {
    if (fim.current) return;
    reinicios.current++;
    setPos(t.inicio); setFeitos("");
    setMostrando(true);
    const id = window.setTimeout(() => setMostrando(false), MOSTRAR_MS);
    timers.current.push(id);
    audio.sfx.interagir();
    setMsg("A trilha volta a aparecer por um instante. Os erros já cometidos continuam contando.");
  };

  const seta = (rotulo: string, d: "R" | "L" | "D" | "U", col: number, row: number) => {
    const Icone = SETA[d];
    return (
      <button key={d} onClick={() => andar(d)} disabled={mostrando} aria-label={rotulo}
        style={{ gridColumn: col, gridRow: row }}
        className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95 disabled:opacity-40">
        <Icone size={22} aria-hidden />
      </button>
    );
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="silencio" />
      <div className="flex justify-center"><Cabecalho id="trilha" /></div>

      <p className="font-narrativa italic text-espuma/80">Caminho {rodada + 1} de {TRECHOS.length}: refaça a trilha de memória.</p>

      <div
        role="img"
        aria-label={mostrando ? "Trilha visível por alguns segundos" : `Trilha oculta. Você está em ${pos[0] + 1}, ${pos[1] + 1}.`}
        className="mx-auto grid w-full gap-1 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: t.W * 58, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {Array.from({ length: t.W * t.H }, (_, p) => {
          const x = p % t.W, y = Math.floor(p / t.W);
          const key = `${x},${y}`;
          if (paredes.has(key)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const naTrilha = caminhoCelulas.includes(key);
          const eu = pos[0] === x && pos[1] === y;
          const saida = t.saida[0] === x && t.saida[1] === y;
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-500 ${mostrando && naTrilha ? "bg-lanterna/30" : "bg-mare/25"}`}>
              {saida && <span className="absolute inset-[26%] rounded-full bg-lanterna shadow-[0_0_14px_4px_rgba(255,191,0,0.5)]" />}
              {eu && <span className="absolute inset-[22%] rounded-full bg-espuma shadow-[0_0_10px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar pela trilha">
        <span />{seta("Subir", "U", 2, 1)}<span />
        {seta("Ir para a esquerda", "L", 1, 2)}{seta("Descer", "D", 2, 2)}{seta("Ir para a direita", "R", 3, 2)}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos certos: {feitos.length}/{t.caminho.length} · Erros: {erros}</span>
        <button onClick={reiniciar} disabled={mostrando} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Mostrar a trilha de novo</button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{mostrando ? "Memorize o caminho..." : msg}</p>
    </main>
  );
}
