import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Cada rodada esconde um farol apagado numa grade 5x5. Você chama (toca numa casa) e o mar devolve um eco:
// quanto mais perto o farol, mais alto e claro o eco. Não há como ver o farol antes de achá-lo.
const FAROIS = [
  { alvo: [3, 1] as [number, number] },
  { alvo: [0, 4] as [number, number] },
  { alvo: [4, 2] as [number, number] },
];
const TAMANHO = 5;

const INTROS = [
  "O Segundo Mar começa além das pedras da cidade. Aqui há faróis que ninguém acendeu. Chame e escute o eco: ele fica mais forte perto do farol.",
  "O eco é fraco de longe e forte de perto. Use cada chamado para cortar a grade pela metade, e não repita uma casa.",
  "O último farol do Segundo Mar. Quando o eco for forte em duas casas vizinhas, o farol deve estar entre elas.",
];

const STAR_TOTAL = { tres: 9, dois: 14 };

export default function EcoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const chamadas = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [sondados, setSondados] = useState<Record<number, number>>({});
  const [achado, setAchado] = useState(false);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const alvo = FAROIS[rodada].alvo;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = () => {
    setTravado(true);
    setAchado(true);
    audio.sfx.eco.achou();
    if (rodada < FAROIS.length - 1) {
      setMsg("O farol responde com uma luz curta e fria. Um eco mais forte vem da próxima direção.");
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setSondados({});
        setAchado(false);
        setTravado(false);
        setMsg(INTROS[prox]);
      }, 2400);
      return;
    }
    fim.current = true;
    giveItem("eco-do-segundo-mar");
    const total = chamadas.current;
    setMsg("Todos os faróis do Segundo Mar respondem juntos. A cidade ouve o próprio nome vindo do fundo do mar.");
    agendar(() => complete("eco", {
      estrelas: total <= STAR_TOTAL.tres ? 3 : total <= STAR_TOTAL.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Chamados: ${total} (ideal: até ${STAR_TOTAL.tres})`, reinicios.current ? `Mares refeitas: ${reinicios.current}` : "Nenhuma mar refeita"],
    }), 2800);
  };

  const chamar = (x: number, y: number) => {
    if (fim.current || travado || achado) return;
    const k = y * TAMANHO + x;
    if (sondados[k] !== undefined) return;
    const d = Math.abs(x - alvo[0]) + Math.abs(y - alvo[1]);
    chamadas.current++;
    audio.sfx.eco.ping(d);
    setSondados({ ...sondados, [k]: d });
    if (d === 0) { concluir(); return; }
    if (d === 1) setMsg("Eco forte: o farol está a um passo de você.");
    else if (d <= 3) setMsg("Eco médio: o farol está por perto, mas não nesta casa.");
    else setMsg("Eco fraco: o farol está longe desta casa.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setSondados({});
    audio.sfx.interagir();
    setMsg("O mar fica em silêncio e você pode chamar de novo. Os chamados já feitos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="eco" />
      <div className="flex justify-center"><Cabecalho id="eco" /></div>

      <p className="font-narrativa italic text-espuma/80">Farol {rodada + 1} de {FAROIS.length}: chame o mar e ache a luz apagada.</p>

      <div
        role="grid"
        aria-label={`Grade de chamados com ${TAMANHO} por ${TAMANHO} casas`}
        className="mx-auto grid w-full gap-1.5 rounded-lg border border-latao/60 bg-abismo/60 p-2 backdrop-blur-sm"
        style={{ maxWidth: TAMANHO * 62, gridTemplateColumns: `repeat(${TAMANHO}, 1fr)` }}
      >
        {Array.from({ length: TAMANHO * TAMANHO }, (_, k) => {
          const x = k % TAMANHO, y = Math.floor(k / TAMANHO);
          const d = sondados[k];
          const forca = d === undefined ? 0 : Math.max(0, 1 - d / 6);
          const eFarol = achado && alvo[0] === x && alvo[1] === y;
          return (
            <button
              key={k}
              onClick={() => chamar(x, y)}
              disabled={d !== undefined || achado || travado}
              aria-label={`Casa linha ${y + 1}, coluna ${x + 1}${d !== undefined ? (d === 0 ? ", o farol" : `, eco ${d === 1 ? "forte" : d <= 3 ? "médio" : "fraco"}`) : ""}`}
              className={`relative aspect-square rounded-md border transition-colors duration-500 ${d === undefined ? "border-espuma/10 bg-mare/25 hover:bg-mare/45" : "border-espuma/10 bg-mare/25"} disabled:cursor-default`}
              style={d !== undefined ? { boxShadow: `inset 0 0 ${8 + forca * 18}px ${forca * 6}px rgba(255,191,0,${0.1 + forca * 0.5})` } : undefined}
            >
              {d !== undefined && (
                <span aria-hidden className="absolute inset-[38%] rounded-full bg-espuma/40" />
              )}
              {eFarol && (
                <span aria-hidden className="absolute inset-[22%] rounded-full bg-lanterna shadow-[0_0_20px_6px_rgba(255,191,0,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Chamados: {chamadas.current}</span>
        <button onClick={reiniciar} disabled={travado || achado || !Object.keys(sondados).length} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Limpar o mar
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
