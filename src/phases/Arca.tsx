import { useEffect, useRef, useState } from "react";
import { Package, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Arca cheia. Cada carga tem um peso (1 a 4). Cada arca aguenta até a capacidade do trecho.
// Toque numa carga para selecioná-la, e depois numa arca para guardá-la (se couber). Toque numa carga guardada para tirá-la.
// Você tem uma arca a mais que o necessário. OTIMOS é o mínimo de arcas de cada trecho (empacotamento exato).
type Trecho = { cargas: number[]; capacidade: number };
const TRECHOS: Trecho[] = [
  { cargas: [2, 3, 1, 2], capacidade: 4 },
  { cargas: [3, 3, 2, 2, 1, 1], capacidade: 5 },
  { cargas: [4, 3, 3, 2, 2], capacidade: 6 },
];

// Menor número de arcas para guardar todas as cargas (busca exaustiva; cargas são poucas)
function minArcas(cargas: number[], capacidade: number): number {
  let melhor = Infinity;
  const arcas: number[] = [];
  const dfs = (i: number) => {
    if (arcas.length >= melhor) return;
    if (i === cargas.length) { melhor = arcas.length; return; }
    for (let k = 0; k < arcas.length; k++) {
      if (arcas[k] + cargas[i] <= capacidade) { arcas[k] += cargas[i]; dfs(i + 1); arcas[k] -= cargas[i]; }
    }
    arcas.push(cargas[i]); dfs(i + 1); arcas.pop();
  };
  dfs(0);
  return melhor;
}
const OTIMOS = TRECHOS.map((t) => minArcas(t.cargas, t.capacidade));
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "Cada carga tem um peso. Uma arca aguenta até a capacidade. Guarde tudo usando o menor número de arcas possível.",
  "Mais cargas, e pesos que não se encaixam fácil. Às vezes, uma carga pesada precisa de uma arca só para ela.",
  "A última carga do porto, com a arca mais cheia. Pense em combinar os pesos grandes com os pequenos.",
];

export default function ArcaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const arcasTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [arcaDe, setArcaDe] = useState<number[]>(() => TRECHOS[0].cargas.map(() => -1));
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const K = OTIMOS[rodada] + 1; // arcas disponíveis
  const peso = (k: number) => t.cargas.reduce((s, c, i) => s + (arcaDe[i] === k ? c : 0), 0);
  const guardadas = arcaDe.filter((a) => a >= 0).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (final: number[]) => {
    setTravado(true);
    audio.sfx.arca.completo();
    const usadas = new Set(final).size;
    const nota = usadas === OTIMOS[rodada] ? "o mínimo de arcas" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todas as cargas guardadas em ${usadas} ${usadas === 1 ? "arca" : "arcas"} (${nota}). O depósito seguinte se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setArcaDe(TRECHOS[prox].cargas.map(() => -1));
        setSelecionada(null); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("arca-cheia");
    setMsg(`O depósito fica organizado, e nada se perde no caminho para o farol (${nota}).`);
    agendar(() => complete("arca", {
      estrelas: arcasTotal.current <= SOMA_OTIMOS ? 3 : arcasTotal.current <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Arcas usadas: ${arcasTotal.current} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Depósitos refeitos: ${reinicios.current}` : "Nenhum depósito refeito"],
    }), 2800);
  };

  const tocarCarga = (i: number) => {
    if (fim.current || travado) return;
    if (arcaDe[i] >= 0) {
      const novo = [...arcaDe]; novo[i] = -1; setArcaDe(novo); setSelecionada(null);
      audio.sfx.arca.tirar();
      setMsg("A carga sai da arca. Escolha outra arca para ela.");
      return;
    }
    setSelecionada(selecionada === i ? null : i);
    setMsg(selecionada === i ? "Carga desmarcada." : `Carga de peso ${t.cargas[i]} selecionada. Toque numa arca.`);
  };

  const tocarArca = (k: number) => {
    if (fim.current || travado) return;
    if (selecionada === null) { setMsg("Selecione uma carga primeiro."); return; }
    if (peso(k) + t.cargas[selecionada] > t.capacidade) { audio.sfx.arca.falha(); setMsg("Essa arca não aguenta mais esta carga. Tente outra."); return; }
    const novo = [...arcaDe]; novo[selecionada] = k;
    arcasTotal.current++;
    setArcaDe(novo);
    setSelecionada(null);
    audio.sfx.arca.guardar();
    if (novo.every((a) => a >= 0)) { concluirComArcas(novo); return; }
    setMsg("Carga guardada. Continue com as cargas restantes.");
  };

  const concluirComArcas = (novo: number[]) => { setArcaDe(novo); concluir(novo); };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setArcaDe(t.cargas.map(() => -1));
    setSelecionada(null);
    audio.sfx.interagir();
    setMsg("O depósito é esvaziado. As cargas já guardadas continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="arca" /></div>

      <p className="font-narrativa italic text-espuma/80">Depósito {rodada + 1} de {TRECHOS.length}: guarde todas as cargas em arcas de capacidade {t.capacidade}.</p>

      <div className="mx-auto flex flex-wrap justify-center gap-2" role="group" aria-label="Cargas">
        {t.cargas.map((c, i) => {
          const guardada = arcaDe[i] >= 0, sel = selecionada === i;
          return (
            <button
              key={i}
              onClick={() => tocarCarga(i)}
              disabled={travado}
              aria-label={`Carga de peso ${c}, ${guardada ? `guardada na arca ${arcaDe[i] + 1}` : sel ? "selecionada" : "solta"}`}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 font-narrativa text-lg transition-all ${
                sel ? "border-lanterna bg-lanterna/25 text-lanterna"
                : guardada ? "border-alga/50 bg-alga/10 text-espuma/50"
                : "border-latao/70 bg-[#6e4f33] text-espuma hover:border-lanterna/60"
              } disabled:cursor-default`}
            >
              {c}
              <span className="text-[9px] uppercase tracking-wide text-espuma/50">{guardada ? `arca ${arcaDe[i] + 1}` : "solta"}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto grid w-full grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Arcas">
        {Array.from({ length: K }, (_, k) => {
          const cheia = peso(k), pesoOcupado = Math.min(100, (cheia / t.capacidade) * 100);
          return (
            <button
              key={k}
              onClick={() => tocarArca(k)}
              disabled={travado}
              aria-label={`Arca ${k + 1}, ${cheia} de ${t.capacidade} de peso`}
              className="flex flex-col gap-2 rounded-2xl border-2 border-latao/60 bg-[#4a3424]/40 p-3 text-left transition-colors hover:border-lanterna/60 disabled:cursor-default"
            >
              <span className="flex items-center gap-2 font-narrativa text-sm text-espuma/80"><Package size={14} aria-hidden /> Arca {k + 1}</span>
              <span className="h-2 w-full overflow-hidden rounded-full bg-abismo/60">
                <span className="block h-full bg-lanterna transition-all duration-500" style={{ width: `${pesoOcupado}%` }} />
              </span>
              <span className="text-xs text-espuma/60">{cheia}/{t.capacidade}</span>
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Guardadas: {guardadas}/{t.cargas.length}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Esvaziar o depósito
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
