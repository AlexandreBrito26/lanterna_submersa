import { Fragment, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Jardim de alturas. Cada linha e coluna leva as alturas 1 a N, sem repetir. As pistas nas bordas dizem quantas
// plantas se veem daquele lado (uma planta só aparece se for mais alta que todas as antes dela).
// Toque numa casa para subir a altura (1 → 2 → ... → vazia). Cada toque conta como uma ação.
const TRECHOS = [
  { sol: [[1, 2, 3], [2, 3, 1], [3, 1, 2]] },
  { sol: [[1, 2, 3, 4], [2, 4, 1, 3], [3, 1, 4, 2], [4, 3, 2, 1]] },
];
function visiveis(l: number[]): number { let max = 0, n = 0; for (const h of l) if (h > max) { n++; max = h; } return n; }
function pistasDe(sol: number[][]) {
  const N = sol.length;
  return {
    esq: sol.map((r) => visiveis(r)),
    dir: sol.map((r) => visiveis([...r].reverse())),
    cima: Array.from({ length: N }, (_, c) => visiveis(sol.map((r) => r[c]))),
    baixo: Array.from({ length: N }, (_, c) => visiveis(sol.map((r) => r[c]).reverse())),
  };
}
const INTROS = [
  "Cada linha e cada coluna têm plantas de altura 1 a 3, sem repetir. Use as pistas: elas dizem quantas plantas se veem de cada lado.",
  "Agora são quatro alturas. Uma planta baixa atrás de uma alta fica escondida: pense nisso ao ler as pistas.",
];
const SOMA_OTIMOS = TRECHOS.reduce((a, t) => a + t.sol.length * t.sol.length, 0);

export default function AlturasFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const acoesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [grade, setGrade] = useState<number[][]>(() => TRECHOS[0].sol.map((r) => r.map(() => 0)));
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);
  const t = TRECHOS[rodada];
  const N = t.sol.length;
  const p = pistasDe(t.sol);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const ok = (g: number[][]) => {
    if (g.some((r) => r.some((v) => v === 0))) return false;
    const pp = pistasDe(g);
    const iguais = (a: number[], b: number[]) => a.every((v, i) => v === b[i]);
    return iguais(pp.esq, p.esq) && iguais(pp.dir, p.dir) && iguais(pp.cima, p.cima) && iguais(pp.baixo, p.baixo);
  };

  const tocar = (r: number, c: number) => {
    if (fim.current || travado) return;
    const g = grade.map((row) => [...row]);
    g[r][c] = g[r][c] >= N ? 0 : g[r][c] + 1;
    acoesTotal.current++;
    setGrade(g); audio.sfx.alturas.toque();
    if (ok(g)) { concluir(acoesTotal.current); return; }
    setMsg("A planta cresce. Confira as pistas de cada lado.");
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.alturas.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg(`O jardim bate com todas as pistas, em ${n} ações.`);
      agendar(() => { setRodada(rodada + 1); setGrade(TRECHOS[rodada + 1].sol.map((r) => r.map(() => 0))); setTravado(false); setMsg(INTROS[rodada + 1]); }, 2300);
      return;
    }
    fim.current = true;
    giveItem("jardim-de-alturas");
    const total = acoesTotal.current;
    setMsg(`O jardim cresce em ordem, e cada planta encontra o seu lugar (${total} ações).`);
    agendar(() => complete("alturas", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 4 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Ações: ${total}`, reinicios.current ? `Jardins refeitos: ${reinicios.current}` : "Nenhum jardim refeito"],
    }), 2800);
  };

  const reiniciar = () => { if (fim.current || travado) return; reinicios.current++; setGrade(t.sol.map((r) => r.map(() => 0))); audio.sfx.interagir(); setMsg("Os canteiros são limpos. As ações já feitas continuam contando."); };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="alturas" /></div>
      <p className="font-narrativa italic text-espuma/80">Jardim {rodada + 1} de {TRECHOS.length}: cada linha e coluna com alturas de 1 a {N}.</p>
      <div className="mx-auto grid w-full max-w-sm gap-1" style={{ gridTemplateColumns: `auto repeat(${N}, 1fr) auto` }}>
        <div />
        {p.cima.map((v, c) => <div key={`ct${c}`} className="text-center text-sm text-latao">{v}</div>)}
        <div />
        {grade.map((linha, r) => (
          <Fragment key={`linha-${r}`}>
            <div key={`el${r}`} className="flex items-center text-sm text-latao">{p.esq[r]}</div>
            {linha.map((v, c) => (
              <button key={`${r}-${c}`} onClick={() => tocar(r, c)} disabled={travado} aria-label={`Linha ${r + 1}, coluna ${c + 1}, altura ${v || "vazia"}`}
                className="aspect-square rounded-md border border-latao/50 bg-mare/25 font-narrativa text-lg hover:border-lanterna/60 disabled:cursor-default">
                {v || ""}
              </button>
            ))}
            <div key={`dl${r}`} className="flex items-center text-sm text-latao">{p.dir[r]}</div>
          </Fragment>
        ))}
        <div />
        {p.baixo.map((v, c) => <div key={`cb${c}`} className="text-center text-sm text-latao">{v}</div>)}
        <div />
      </div>
      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Ações: {acoesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Limpar os canteiros</button>
      </p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
