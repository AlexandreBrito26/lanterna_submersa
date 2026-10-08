import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Selos do cofre. A grade é preenchida com selos 1, 2 ou 3. Dois selos vizinhos (cima, baixo, esquerda, direita)
// nunca podem ser iguais. Algumas casas já vêm marcadas. Toque numa casa vazia para colocar o próximo selo
// (1 → 2 → 3 → vazio). Vence quando a grade estiver cheia e sem vizinhos iguais.
// Cada vez que um selo cria um vizinho igual, conta como erro. Estrelas pelo número de erros.
type Trecho = { grade: number[][]; fixos: [number, number][] };
const TRECHOS: Trecho[] = [
  { grade: [[1, 2, 1], [2, 3, 2], [1, 2, 1]], fixos: [[0, 0], [1, 1]] },
  { grade: [[1, 2, 3, 1], [3, 1, 2, 3], [2, 3, 1, 2]], fixos: [[0, 1], [2, 2]] },
  { grade: [[1, 2, 1, 2], [3, 1, 3, 1], [2, 3, 2, 3], [1, 2, 1, 2]], fixos: [[0, 0], [1, 2], [3, 3]] },
];

const INTROS = [
  "Os selos do cofre não podem se encostar iguais. Algumas casas já estão marcadas: use-as como ponto de partida.",
  "A grade é maior e os selos se repetem em cruz. Confira cada vizinho antes de colocar um selo.",
  "O último cofre. Quatro linhas de selos e poucas marcas. Vá preenchendo com cuidado: um erro encadeia outro.",
];

function conflitos(g: (number | null)[][]): Set<string> {
  const H = g.length, W = g[0].length; const c = new Set<string>();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = g[y][x]; if (v === null) continue;
    if (x + 1 < W && g[y][x + 1] === v) { c.add(`${y},${x}`); c.add(`${y},${x + 1}`); }
    if (y + 1 < H && g[y + 1][x] === v) { c.add(`${y},${x}`); c.add(`${y + 1},${x}`); }
  }
  return c;
}

export default function SelosFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [grade, setGrade] = useState<(number | null)[][]>(() => montar(TRECHOS[0]));
  const [erros, setErros] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const conflito = conflitos(grade);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  function montar(tr: Trecho): (number | null)[][] {
    return tr.grade.map((linha, y) => linha.map((v, x) => (tr.fixos.some(([fy, fx]) => fy === y && fx === x) ? v : null)));
  }

  const concluir = () => {
    setTravado(true);
    audio.sfx.selos.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg("Todos os selos estão no lugar, e o cofre se fecha em paz. O próximo cofre se abre.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setGrade(montar(TRECHOS[prox]));
        setErros(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("selos-do-cofre");
    const total = errosTotal.current;
    setMsg(`O último selo encaixa, e a costa recebe a chave do farol (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("selos", {
      estrelas: total === 0 ? 3 : total <= 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Erros: ${total}`, reinicios.current ? `Cofres refeitos: ${reinicios.current}` : "Nenhum cofre refeito"],
    }), 2800);
  };

  const proximo = (v: number | null): number | null => (v === null ? 1 : v === 3 ? null : v + 1);

  const tocar = (y: number, x: number) => {
    if (fim.current || travado) return;
    if (t.fixos.some(([fy, fx]) => fy === y && fx === x)) return;
    const novo = grade.map((l) => [...l]);
    novo[y][x] = proximo(novo[y][x]);
    const antes = conflitos(grade);
    const depois = conflitos(novo);
    const criou = [...depois].filter((k) => !antes.has(k)).length;
    if (criou > 0) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.selos.erro(); }
    else audio.sfx.selos.colocar();
    setGrade(novo);
    if (novo[y][x] === null) { setMsg("O selo é recolhido da casa."); return; }
    if (depois.size === 0 && novo.every((l) => l.every((v) => v !== null))) { concluir(); return; }
    setMsg(criou > 0 ? "Esse selo encosta num igual. As casas em vermelho precisam mudar." : "Selo colocado sem vizinho igual.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setGrade(montar(t));
    audio.sfx.interagir();
    setMsg("O cofre é desmontado. Os erros já cometidos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="selos" /></div>

      <p className="font-narrativa italic text-espuma/80">Cofre {rodada + 1} de {TRECHOS.length}: nenhum selo pode encostar num igual.</p>

      <div
        role="grid"
        aria-label={`Cofre com ${t.grade.length} linhas e ${t.grade[0].length} colunas. ${erros} erros.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3 backdrop-blur-sm"
        style={{ maxWidth: t.grade[0].length * 80, gridTemplateColumns: `repeat(${t.grade[0].length}, 1fr)` }}
      >
        {grade.flatMap((linha, y) => linha.map((v, x) => {
          const fixo = t.fixos.some(([fy, fx]) => fy === y && fx === x);
          const emConflito = conflito.has(`${y},${x}`);
          return (
            <button
              key={`${y}-${x}`}
              onClick={() => tocar(y, x)}
              disabled={travado || fixo}
              aria-label={`Linha ${y + 1}, coluna ${x + 1}, ${v === null ? "vazia" : `selo ${v}`}${fixo ? ", fixo" : ""}${emConflito ? ", encosta num igual" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-xl border-2 font-narrativa text-2xl transition-all duration-300 ${
                emConflito ? "border-coral bg-coral/25 text-coral"
                : fixo ? "border-lanterna/60 bg-lanterna/15 text-lanterna"
                : v !== null ? "border-alga/60 bg-alga/15 text-alga"
                : "border-latao/60 bg-[#4a3424]/50 text-transparent hover:border-lanterna/60"
              } disabled:cursor-default`}
            >
              {v ?? "·"}
            </button>
          );
        }))}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Erros: {erros}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Desmontar o cofre
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
