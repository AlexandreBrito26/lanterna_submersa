import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Uma fileira de pedras de coral. Cada pedra tem um alcance: ao cair, derruba as pedras que estão
// até esse alcance para a esquerda e para a direita. Tocar numa pedra de pé a derruba, e a queda se espalha.
// Vence quando todas caem. OTIMOS é o mínimo de toques de cada fileira, por busca exaustiva.
const TRECHOS = [
  { alcance: [1, 0, 0, 1, 0, 0, 1] },
  { alcance: [1, 0, 1, 0, 0, 1, 0, 1] },
  { alcance: [0, 1, 0, 0, 1, 0, 0, 1, 0] },
];
const OTIMOS = [3, 4, 3];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "As pedras de coral estão de pé. Cada uma derruba as vizinhas até o seu alcance. Algumas só caem se alguém as empurrar.",
  "A fileira tem mais pausas. Uma pedra com alcance zero não derruba nada: é preciso começar uma queda nova do outro lado.",
  "A última fileira do cais. Antes de tocar, conte quais pedras ficam isoladas entre as quebras.",
];

// Quais pedras caem a partir de um conjunto de pedras tocadas (queda em cascata)
function cascata(alcance: number[], tocadas: number[]): boolean[] {
  const n = alcance.length;
  const caidas = new Array(n).fill(false);
  const fila: number[] = [];
  tocadas.forEach((i) => { if (!caidas[i]) { caidas[i] = true; fila.push(i); } });
  while (fila.length) {
    const i = fila.shift()!;
    for (let j = Math.max(0, i - alcance[i]); j <= Math.min(n - 1, i + alcance[i]); j++) {
      if (!caidas[j]) { caidas[j] = true; fila.push(j); }
    }
  }
  return caidas;
}

export default function DominosFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const togglesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [caidas, setCaidas] = useState<boolean[]>(() => TRECHOS[0].alcance.map(() => false));
  const [toques, setToques] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.dominos.cascata();
    const nota = n === OTIMOS[rodada] ? "o mínimo possível" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todas as pedras caem com ${n} ${n === 1 ? "toque" : "toques"} (${nota}). O cais se abre para a fileira seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setCaidas(TRECHOS[prox].alcance.map(() => false));
        setToques(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("pedras-que-caem");
    const total = togglesTotal.current;
    setMsg(`A última pedra tomba, e a queda chega ao fim do cais (${nota}).`);
    agendar(() => complete("dominos", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Fileiras refeitas: ${reinicios.current}` : "Nenhuma fileira refeita"],
    }), 2800);
  };

  // Só conta toque em pedra que ainda está de pé
  const tocar = (i: number) => {
    if (fim.current || travado || caidas[i]) return;
    const tocadas = [...caidas.map((c, k) => (c ? k : -1)).filter((k) => k >= 0), i];
    const novo = cascata(t.alcance, tocadas);
    const n = toques + 1;
    togglesTotal.current++;
    setCaidas(novo);
    setToques(n);
    audio.sfx.dominos.toque();
    const caem = novo.filter(Boolean).length - caidas.filter(Boolean).length;
    if (novo.every(Boolean)) { concluir(n); return; }
    setMsg(caem > 1 ? `Uma queda de ${caem} pedras. Ainda há pedras de pé.` : "Só a pedra tocada caiu. Procure a próxima pedra com alcance.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setCaidas(t.alcance.map(() => false));
    audio.sfx.interagir();
    setMsg("As pedras voltam a ficar de pé. Os toques já feitos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="dominos" />
      <div className="flex justify-center"><Cabecalho id="dominos" /></div>

      <p className="font-narrativa italic text-espuma/80">Fileira {rodada + 1} de {TRECHOS.length}: derrube todas as pedras.</p>

      <div
        role="group"
        aria-label={`Fileira com ${t.alcance.length} pedras. ${caidas.filter(Boolean).length} caídas.`}
        className="mx-auto flex w-full flex-wrap justify-center gap-2"
      >
        {t.alcance.map((r, i) => (
          <button
            key={i}
            onClick={() => tocar(i)}
            disabled={caidas[i] || travado}
            aria-label={`Pedra ${i + 1}, alcance ${r}, ${caidas[i] ? "caída" : "de pé"}`}
            className={`flex h-20 w-10 items-end justify-center rounded-md border-2 pb-1 font-narrativa text-sm transition-all duration-300 ${
              caidas[i]
                ? "translate-y-6 rotate-[70deg] border-latao/30 bg-[#4a3424]/40 text-espuma/30"
                : "border-latao bg-[#6e4f33] text-espuma hover:border-lanterna"
            } disabled:cursor-default`}
          >
            {r}
          </button>
        ))}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {toques} · Caídas: {caidas.filter(Boolean).length}/{t.alcance.length}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Levantar as pedras
        </button>
      </p>

      <p className="text-xs text-espuma/60">O número em cada pedra é o alcance: quantas pedras vizinhas ela derruba para cada lado.</p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
