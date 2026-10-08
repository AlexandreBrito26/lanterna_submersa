import { useEffect, useRef, useState } from "react";
import { Sprout, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Sementes em linha. Plante uma semente em cada linha e em cada coluna, sem repetir linha nem coluna.
// Algumas casas estão proibidas (solo fraco, marcadas com "x"). Tentativas inválidas contam como erro.
type Trecho = { n: number; proibidas: Set<number> };
const TRECHOS: Trecho[] = [
  { n: 4, proibidas: new Set([0, 5, 10, 15, 3, 9]) },
  { n: 5, proibidas: new Set([0, 4, 9, 12, 18, 20, 24, 11]) },
];
const LIMITE = { tres: 0, dois: 3 };

const INTROS = [
  "Uma semente por linha e uma por coluna. Algumas casas têm solo fraco e não aceitam semente.",
  "A horta é maior e as casas proibidas estão espalhadas. Marque cada linha e coluna ao plantar, para não repetir.",
];

export default function SementesFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [sementes, setSementes] = useState<number[]>([]);
  const [erros, setErros] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const linhasUsadas = new Set(sementes.map((p) => Math.floor(p / t.n)));
  const colunasUsadas = new Set(sementes.map((p) => p % t.n));

  const concluir = () => {
    setTravado(true);
    audio.sfx.sementes.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg("A horta está plantada, e cada raiz tem o seu espaço. A horta seguinte se abre.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setSementes([]); setErros(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("sementes-em-linha");
    const total = errosTotal.current;
    setMsg(`A horta floresce em ordem, com uma semente em cada linha e coluna (${total} ${total === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("sementes", {
      estrelas: total <= LIMITE.tres ? 3 : total <= LIMITE.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Plantios errados: ${total}`, reinicios.current ? `Hortas refeitas: ${reinicios.current}` : "Nenhuma horta refeita"],
    }), 2800);
  };

  const plantar = (p: number) => {
    if (fim.current || travado) return;
    if (sementes.includes(p)) { setSementes(sementes.filter((s) => s !== p)); audio.sfx.sementes.tirar(); setMsg("Semente retirada da terra."); return; }
    const y = Math.floor(p / t.n), x = p % t.n;
    if (t.proibidas.has(p)) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.sementes.erro(); setMsg("Solo fraco aqui. A semente não brota."); return; }
    if (linhasUsadas.has(y)) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.sementes.erro(); setMsg("Essa linha já tem uma semente."); return; }
    if (colunasUsadas.has(x)) { errosTotal.current++; setErros((e) => e + 1); audio.sfx.sementes.erro(); setMsg("Essa coluna já tem uma semente."); return; }
    const novo = [...sementes, p];
    setSementes(novo);
    audio.sfx.sementes.plantar();
    if (novo.length === t.n) { concluir(); return; }
    setMsg(`Semente plantada. Faltam ${t.n - novo.length} ${t.n - novo.length === 1 ? "linha" : "linhas"}.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setSementes([]);
    audio.sfx.interagir();
    setMsg("A terra é revirada. Os erros já cometidos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="sementes" /></div>

      <p className="font-narrativa italic text-espuma/80">Horta {rodada + 1} de {TRECHOS.length}: uma semente por linha e por coluna.</p>

      <div
        role="grid"
        aria-label={`Horta ${t.n} por ${t.n}. ${sementes.length} sementes plantadas.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3 backdrop-blur-sm"
        style={{ maxWidth: t.n * 74, gridTemplateColumns: `repeat(${t.n}, 1fr)` }}
      >
        {Array.from({ length: t.n * t.n }, (_, p) => {
          const semente = sementes.includes(p), proibida = t.proibidas.has(p);
          return (
            <button
              key={p}
              onClick={() => plantar(p)}
              disabled={travado}
              aria-label={`Linha ${Math.floor(p / t.n) + 1}, coluna ${(p % t.n) + 1}${semente ? ", semente" : proibida ? ", solo fraco" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-md border transition-all duration-300 ${
                semente ? "border-alga bg-alga/25"
                : proibida ? "border-coral/40 bg-coral/10 text-coral/60"
                : "border-latao/50 bg-mare/20 hover:border-lanterna/60"
              } disabled:cursor-default`}
            >
              {semente ? <Sprout size={20} className="text-alga" aria-hidden /> : proibida ? <span className="font-narrativa text-lg">×</span> : null}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Sementes: {sementes.length}/{t.n} · Erros: {erros}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Revirar a terra</button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
