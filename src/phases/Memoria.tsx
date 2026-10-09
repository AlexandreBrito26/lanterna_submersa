import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Conchas gravadas com símbolos. Vire duas: se forem iguais, o par fica aberto; se não, as duas se fecham.
// Os layouts são fixos e cada símbolo aparece exatamente duas vezes.
const SIMBOLOS = ["Ω", "Σ", "Δ", "Ξ", "Ψ", "Φ", "Λ", "Π"];
const TRECHOS = [
  { w: 4, h: 3, valores: [2, 4, 0, 5, 1, 3, 3, 0, 5, 2, 4, 1] },
  { w: 4, h: 4, valores: [6, 1, 3, 0, 7, 2, 5, 4, 0, 6, 2, 1, 4, 3, 7, 5] },
  { w: 4, h: 4, valores: [1, 5, 7, 2, 0, 3, 6, 4, 7, 1, 3, 0, 6, 2, 5, 4] },
];
const INTROS = [
  "Tomás marcava cada concha com um símbolo, e as conchas iguais eram guardadas juntas. Vire duas por vez e lembre onde cada uma está.",
  "Agora são mais conchas, e cada erro custa uma lembrança. Procure os pares pelas posições que você já viu.",
  "A última caixa de conchas da casa. Não há pressa: cada par encontrado fica aberto, e os erros é que contam.",
];

export default function MemoriaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const errosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [virados, setVirados] = useState<number[]>([]);
  const [achados, setAchados] = useState<boolean[]>(() => TRECHOS[0].valores.map(() => false));
  const [sel, setSel] = useState<number[]>([]);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluirRodada = () => {
    setTravado(true);
    audio.sfx.memoria.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg("Todas as conchas do par estão achadas. A caixa seguinte abre na mesa.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setAchados(TRECHOS[prox].valores.map(() => false));
        setVirados([]); setSel([]); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("casal-de-mar");
    const erros = errosTotal.current;
    setMsg(`Todas as conchas estão em par, e Tomás finalmente guarda a última caixa (${erros} ${erros === 1 ? "erro" : "erros"} no total).`);
    agendar(() => complete("memoria", {
      estrelas: erros === 0 ? 3 : erros <= 3 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Erros: ${erros}`, reinicios.current ? `Mesas refeitas: ${reinicios.current}` : "Nenhuma mesa refeita"],
    }), 2800);
  };

  const virar = (i: number) => {
    if (fim.current || travado || achados[i] || sel.includes(i)) return;
    audio.sfx.memoria.virar();
    setVirados((v) => [...v, i]);
    const novo = [...sel, i];
    setSel(novo);
    if (novo.length < 2) return;
    setTravado(true);
    const [a, b] = novo;
    if (t.valores[a] === t.valores[b]) {
      audio.sfx.memoria.par();
      agendar(() => {
        const ach = [...achados];
        ach[a] = true; ach[b] = true;
        setAchados(ach);
        setSel([]);
        setTravado(false);
        if (ach.every(Boolean)) { concluirRodada(); return; }
        setMsg("Um par encontrado. As duas conchas ficam abertas.");
      }, 500);
    } else {
      errosTotal.current++;
      audio.sfx.memoria.erro();
      setMsg("Símbolos diferentes. As conchas se fecham de novo: lembre onde estão.");
      agendar(() => { setVirados((v) => v.filter((x) => x !== a && x !== b)); setSel([]); setTravado(false); }, 900);
    }
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setAchados(t.valores.map(() => false));
    setVirados([]); setSel([]);
    audio.sfx.interagir();
    setMsg("A mesa é arrumada de novo, mas os erros já cometidos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="memoria" />
      <div className="flex justify-center"><Cabecalho id="memoria" /></div>

      <p className="font-narrativa italic text-espuma/80">Caixa {rodada + 1} de {TRECHOS.length}: ache todos os pares de conchas.</p>

      <div
        role="grid"
        aria-label={`Mesa com ${t.valores.length} conchas. ${achados.filter(Boolean).length / 2} pares achados.`}
        className="mx-auto grid w-full gap-2"
        style={{ maxWidth: t.w * 80, gridTemplateColumns: `repeat(${t.w}, 1fr)` }}
      >
        {t.valores.map((v, i) => {
          const aberta = achados[i] || virados.includes(i);
          return (
            <button
              key={i}
              onClick={() => virar(i)}
              disabled={aberta || travado}
              aria-label={aberta ? `Concha ${SIMBOLOS[v]}` : `Concha ${i + 1}, virada para baixo`}
              className={`aspect-square rounded-xl border-2 font-narrativa text-3xl transition-all duration-300 active:scale-95 ${
                achados[i]
                  ? "border-alga bg-alga/25 text-alga shadow-[0_0_14px_3px_rgba(127,224,208,0.35)]"
                  : aberta
                    ? "border-lanterna bg-lanterna/20 text-lanterna"
                    : "border-latao/60 bg-[#4a3424] text-transparent hover:border-latao"
              }`}
            >
              {aberta ? SIMBOLOS[v] : "·"}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Pares achados: {achados.filter(Boolean).length / 2}/{t.valores.length / 2} · Erros: {errosTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Arrumar a mesa
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
