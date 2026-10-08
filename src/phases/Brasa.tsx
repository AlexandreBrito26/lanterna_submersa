import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Brasa Que Migra. O caminho tem casas em ciclo. "a" = altar de atiçar, "o" = casa comum.
// A brasa avança uma casa por turno. Cada turno você ou atiça a brasa (só num altar) ou passa.
// Atiçar dá +1 de luz e reacende o fogo para 2 turnos. Passar gasta 1 turno de fogo.
// Se o fogo apagar, o trecho recomeça. OTIMOS é o mínimo de turnos, achado por busca em largura.
const RODADAS = [
  { padrao: "aoao", L: 2, minimo: 3 },
  { padrao: "aaoao", L: 3, minimo: 4 },
  { padrao: "aoaoao", L: 4, minimo: 7 },
];
const SOMA_OTIMOS = RODADAS.reduce((a, r) => a + r.minimo, 0);
const FOGO_MAX = 2;

const INTROS = [
  "A brasa anda sozinha pelo caminho. Atice-a quando ela estiver num altar. Se você passar dois turnos sem atiçar, o fogo se apaga.",
  "Mais altares, mais luz para juntar. Espere a brasa chegar ao altar certo, sem deixar o fogo esfriar.",
  "A última brasa do porto. Os altares são raros e a brasa se afasta deles. Calcule o próximo passo antes de agir.",
];

export default function BrasaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const turnosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [turno, setTurno] = useState(0);
  const [luz, setLuz] = useState(0);
  const [fogo, setFogo] = useState(FOGO_MAX);
  const [travado, setTravado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const r = RODADAS[rodada];
  const P = r.padrao.length;
  const posicao = turno % P;
  const noAltar = r.padrao[posicao] === "a";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.brasa.completo();
    const nota = n === r.minimo ? "o mínimo de turnos" : `o mínimo era ${r.minimo}`;
    if (rodada < RODADAS.length - 1) {
      setMsg(`Luz suficiente em ${n} turnos (${nota}). A brasa seguinte se acende no altar.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setTurno(0); setLuz(0); setFogo(FOGO_MAX); setFalhou(false); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("brasa-que-migra");
    const total = turnosTotal.current;
    setMsg(`A última brasa se acende no altar mais alto, e a luz segue até o farol (${nota}).`);
    agendar(() => complete("brasa", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Turnos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Brasas refeitas: ${reinicios.current}` : "Nenhuma brasa refeita"],
    }), 2800);
  };

  const avancar = (novaLuz: number, novoFogo: number) => {
    turnosTotal.current++;
    setTurno(turno + 1);
    setLuz(novaLuz);
    setFogo(novoFogo);
  };

  const atiçar = () => {
    if (fim.current || travado || falhou || !noAltar) return;
    audio.sfx.brasa.atiçar();
    const novaLuz = luz + 1;
    avancar(novaLuz, FOGO_MAX);
    if (novaLuz === r.L) { concluir(turnosTotal.current); return; }
    setMsg(`A brasa acende e junta luz: ${novaLuz} de ${r.L}. O fogo volta a ter dois turnos.`);
  };

  const passar = () => {
    if (fim.current || travado || falhou) return;
    const novoFogo = fogo - 1;
    audio.sfx.brasa.passar();
    avancar(luz, novoFogo);
    if (novoFogo < 0) {
      setFalhou(true);
      audio.sfx.brasa.apagar();
      setMsg("O fogo se apagou. A brasa esfria e o trecho precisa recomeçar.");
      return;
    }
    setMsg(novoFogo === 0 ? "O fogo está no último fio. Atice a brasa no próximo altar, ou ele se apaga." : "A brasa anda pelo caminho.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setTurno(0); setLuz(0); setFogo(FOGO_MAX); setFalhou(false);
    audio.sfx.interagir();
    setMsg("A brasa volta ao começo do caminho. Os turnos já passados continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="chama" />
      <div className="flex justify-center"><Cabecalho id="brasa" /></div>

      <p className="font-narrativa italic text-espuma/80">Brasa {rodada + 1} de {RODADAS.length}: junte {r.L} de luz antes que o fogo se apague.</p>

      <div
        role="img"
        aria-label={`Caminho com ${P} casas. A brasa está na casa ${posicao + 1}, ${noAltar ? "num altar" : "fora de um altar"}. Luz ${luz} de ${r.L}.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3 backdrop-blur-sm"
        style={{ maxWidth: P * 62, gridTemplateColumns: `repeat(${P}, 1fr)` }}
      >
        {r.padrao.split("").map((c, i) => {
          const aqui = i === posicao;
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-lg border transition-all duration-300 ${
                c === "a" ? "border-lanterna/70 bg-lanterna/10" : "border-latao/40 bg-mare/20"
              }`}
            >
              {aqui && <Flame size={26} className={falhou ? "text-espuma/30" : "text-lanterna drop-shadow-[0_0_10px_rgba(255,191,0,0.8)]"} aria-hidden />}
              {!aqui && c === "a" && <span className="h-2 w-2 rounded-full bg-lanterna/60" aria-hidden />}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-espuma/60">Altar: casa com o ponto dourado. Só aqui a brasa pode ser atiçada.</p>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={atiçar} disabled={travado || falhou || !noAltar} className="rounded-xl border border-lanterna/60 bg-mare/40 px-5 py-3 font-narrativa text-lanterna active:scale-95 disabled:opacity-40">
          Atiçar a brasa
        </button>
        <button onClick={passar} disabled={travado || falhou} className="rounded-xl border border-mare bg-mare/25 px-5 py-3 font-narrativa text-espuma/80 active:scale-95 disabled:opacity-40">
          Passar o turno
        </button>
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Turno {turno} · Luz {luz}/{r.L} · Fogo {Math.max(fogo, 0)}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Recomeçar a brasa
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
