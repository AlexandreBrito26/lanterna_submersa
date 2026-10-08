import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Colar de pérolas (picross). Cada linha e coluna traz a contagem de pérolas em sequência, como "2 1".
// Toque numa casa para alternar: vazio → pérola → marca (X) → vazio. Vence quando as contagens batem.
// As figuras abaixo são a solução; as contagens são derivadas delas.
const FIGURAS = [
  ["..#..", ".###.", "#####", ".###.", "..#.."],
  [".###.", "#...#", "#.#.#", "#...#", ".###."],
  ["..#..", ".###.", "..#..", "#####", "#...#"],
];
const INTROS = [
  "Um colar de pérolas com uma forma escondida. Os números das bordas dizem quantas pérolas seguidas há em cada linha e coluna.",
  "Agora o colar tem um buraco no meio. Pense em cada linha antes de preencher, e lembre que duas sequências precisam de uma casa vazia entre elas.",
  "O último colar do porto. Comece pelas linhas e colunas que têm sequências longas: elas limitam o resto.",
];

type Figura = { W: number; H: number; sol: number[]; linhas: number[][]; colunas: number[][] };

// Sequências de pérolas (contagem de 1s seguidos) de um vetor de 0/1
function sequencias(v: number[]): number[] {
  const r: number[] = []; let c = 0;
  for (const x of v) {
    if (x === 1) c++;
    else if (c > 0) { r.push(c); c = 0; }
  }
  if (c > 0) r.push(c);
  return r;
}

function montar(ascii: string[]): Figura {
  const H = ascii.length, W = ascii[0].length;
  const sol: number[] = [];
  ascii.forEach((l) => [...l].forEach((c) => sol.push(c === "#" ? 1 : 0)));
  const linhas = Array.from({ length: H }, (_, y) => sequencias(sol.slice(y * W, y * W + W)));
  const colunas = Array.from({ length: W }, (_, x) => sequencias(Array.from({ length: H }, (_, y) => sol[y * W + x])));
  return { W, H, sol, linhas, colunas };
}

const CAMPOS = FIGURAS.map(montar);

// Estado de cada casa: 0 vazia, 1 pérola, 2 marca (X)
function confere(f: Figura, grade: number[]): boolean {
  const cheio = (x: number, y: number) => grade[y * f.W + x] === 1 ? 1 : 0;
  for (let y = 0; y < f.H; y++) {
    const linha = Array.from({ length: f.W }, (_, x) => cheio(x, y));
    if (JSON.stringify(sequencias(linha)) !== JSON.stringify(f.linhas[y])) return false;
  }
  for (let x = 0; x < f.W; x++) {
    const col = Array.from({ length: f.H }, (_, y) => cheio(x, y));
    if (JSON.stringify(sequencias(col)) !== JSON.stringify(f.colunas[x])) return false;
  }
  return true;
}

export default function PerolasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [grade, setGrade] = useState<number[]>(() => CAMPOS[0].sol.map(() => 0));
  const [erros, setErros] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = () => {
    setTravado(true);
    audio.sfx.perolas.completo();
    if (rodada < CAMPOS.length - 1) {
      setMsg("O colar fecha e uma nova conta brilha no fio. O próximo colar está pronto.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setGrade(CAMPOS[prox].sol.map(() => 0));
        setErros(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("colar-de-perolas");
    const total = errosTotal.current;
    setMsg(`Todas as pérolas no lugar. O colar volta ao pescoço da estátua do porto (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("perolas", {
      estrelas: total === 0 ? 3 : total <= 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Pérolas postas no lugar errado: ${total}`, reinicios.current ? `Colares refeitos: ${reinicios.current}` : "Nenhum colar refeito"],
    }), 2800);
  };

  const tocar = (p: number) => {
    if (fim.current || travado) return;
    const atual = grade[p];
    const novo = (atual + 1) % 3;
    const g = [...grade];
    g[p] = novo;
    setGrade(g);
    if (novo === 1) {
      if (f.sol[p] !== 1) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.perolas.erro(); setMsg("Essa conta não pertence a esta forma. Cuidado com as sequências."); }
      else audio.sfx.perolas.pinta();
    } else {
      audio.sfx.interagir();
    }
    if (confere(f, g)) { concluir(); return; }
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setGrade(f.sol.map(() => 0));
    audio.sfx.interagir();
    setMsg("O colar volta a ser um fio vazio. Os erros já cometidos continuam contando.");
  };

  const pulos = (xs: number[]) => (xs.length ? xs.join(" ") : "0");

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="perolas" />
      <div className="flex justify-center"><Cabecalho id="perolas" /></div>

      <p className="font-narrativa italic text-espuma/80">Colar {rodada + 1} de {CAMPOS.length}: ache a forma pelas contagens.</p>

      <div className="mx-auto w-full" style={{ maxWidth: (f.W + 1) * 52 }}>
        <div
          role="grid"
          aria-label={`Colar de ${f.W} por ${f.H}. Contagens nas bordas.`}
          className="grid gap-1"
          style={{ gridTemplateColumns: `auto repeat(${f.W}, 1fr)` }}
        >
          <div />
          {f.colunas.map((c, x) => (
            <div key={`c${x}`} className="flex items-end justify-center pb-1 text-center text-xs text-latao">{pulos(c).split(" ").map((n, i) => <span key={i} className="block">{n}</span>)}</div>
          ))}
          {Array.from({ length: f.H }, (_, y) => (
            <Linha key={y} f={f} y={y} grade={grade} linhas={f.linhas[y]} aoTocar={tocar} pulos={pulos} />
          ))}
        </div>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pérolas erradas: {erros}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Limpar o colar
        </button>
      </p>

      <p className="text-xs text-espuma/60">Toque: vazio → pérola → X → vazio.</p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}

function Linha({ f, y, grade, linhas, aoTocar, pulos }: { f: Figura; y: number; grade: number[]; linhas: number[]; aoTocar: (p: number) => void; pulos: (xs: number[]) => string }) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-xs text-latao">{pulos(linhas)}</div>
      {Array.from({ length: f.W }, (_, x) => {
        const p = y * f.W + x, v = grade[p];
        return (
          <button
            key={p}
            onClick={() => aoTocar(p)}
            aria-label={`Linha ${y + 1}, coluna ${x + 1}, ${v === 1 ? "pérola" : v === 2 ? "marcada" : "vazia"}`}
            className={`aspect-square rounded-md border transition-colors duration-200 ${v === 1 ? "border-lanterna bg-lanterna/80 shadow-[0_0_12px_3px_rgba(255,191,0,0.4)]" : v === 2 ? "border-espuma/20 bg-mare/20 text-espuma/50" : "border-mare bg-mare/25 hover:bg-mare/45"}`}
          >
            {v === 2 ? "×" : ""}
          </button>
        );
      })}
    </>
  );
}
