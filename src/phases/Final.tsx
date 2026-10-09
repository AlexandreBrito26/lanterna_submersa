import { useEffect, useRef, useState } from "react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Fim do Ato II: os quatro faróis do Segundo Mar. O farol do seu final (escolhido no Coração) acende primeiro.
// Depois, acenda os outros três, na ordem que quiser. Quando todos brilharem, a luz chega à cidade submersa.
const FINAIS = ["apagar", "acender", "guardar", "renascer"] as const;
type Final = (typeof FINAIS)[number];

const NOMES: Record<Final, string> = {
  apagar: "Farol do Silêncio",
  acender: "Farol da Chama",
  guardar: "Farol do Cofre",
  renascer: "Farol da Superfície",
};

const DESFECHO: Record<Final, string> = {
  apagar: "Você escolheu apagar a lanterna no Coração. Agora ela volta a brilhar, e a cidade aprende que o silêncio também pode ser um farol.",
  acender: "Você escolheu acender a lanterna no Coração. A chama se espalha para os outros faróis, e cada um responde com a sua própria cor.",
  guardar: "Você escolheu guardar a lanterna no Coração. Os faróis voltam para o cofre submerso, e a luz fica protegida até a hora certa.",
  renascer: "Você escolheu renascer no Coração. A luz sobe até a superfície, e pela primeira vez a cidade vê o céu de cima.",
};

const INTRO = "Quatro faróis ainda esperam do lado de fora da cidade. A luz do seu final deve acender primeiro. Depois, os outros três.";

export default function FinalFase() {
  const { giveItem, complete, inventory } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  // Final escolhido: o último que o jogador desbloqueou no Coração (com "apagar" como padrão)
  const escolhido: Final = [...FINAIS].reverse().find((f) => inventory.includes(`final:${f}`)) ?? "apagar";
  const [acesos, setAcesos] = useState<Final[]>([]);
  const [msg, setMsg] = useState(INTRO);
  const [travado, setTravado] = useState(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const acender = (f: Final) => {
    if (fim.current || travado || acesos.includes(f)) return;
    if (f !== escolhido && !acesos.includes(escolhido)) {
      audio.sfx.interagir();
      setMsg(`${NOMES[f]} não responde ainda. Primeiro, acenda o farol do seu final: ${NOMES[escolhido]}.`);
      return;
    }
    const novo = [...acesos, f];
    setAcesos(novo);
    audio.sfx.lenteAcesa();
    if (novo.length === FINAIS.length) {
      setTravado(true);
      fim.current = true;
      giveItem("fim-do-segundo-mar");
      setMsg(DESFECHO[escolhido] + " Os quatro faróis brilham juntos, e a luz chega ao fundo da cidade.");
      agendar(() => audio.sfx.porta(), 500);
      agendar(() => complete("final2", {
        estrelas: 3,
        tempo: Math.round((performance.now() - inicio.current) / 1000),
        detalhes: [`Final do Coração: ${NOMES[escolhido]}`],
      }), 2800);
      return;
    }
    setMsg(f === escolhido ? `${NOMES[f]} acende primeiro. Agora, os outros faróis respondem.` : `${NOMES[f]} acende e espalha a sua cor.`);
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="final2" /></div>

      <p className="font-narrativa italic text-espuma/80">Os quatro faróis do Segundo Mar, uma luz para cada final.</p>

      <div className="mx-auto grid w-full grid-cols-2 gap-4">
        {FINAIS.map((f) => {
          const aceso = acesos.includes(f);
          const principal = f === escolhido;
          return (
            <button
              key={f}
              onClick={() => acender(f)}
              disabled={aceso || travado}
              aria-label={`${NOMES[f]}${principal ? ", o farol do seu final" : ""}${aceso ? ", aceso" : ", apagado"}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all duration-500 ${
                aceso
                  ? "border-lanterna bg-lanterna/25 shadow-[0_0_28px_8px_rgba(255,191,0,0.35)]"
                  : principal
                    ? "border-alga/70 bg-mare/40 animate-pulse"
                    : "border-mare bg-mare/25 hover:border-espuma/40"
              } disabled:cursor-default`}
            >
              <span aria-hidden className={`mb-2 block h-8 w-8 rounded-full transition-all duration-500 ${aceso ? "bg-lanterna shadow-[0_0_18px_6px_rgba(255,191,0,0.6)]" : "bg-espuma/20"}`} />
              <span className={`font-narrativa text-sm ${aceso ? "text-lanterna" : "text-espuma/80"}`}>{NOMES[f]}</span>
              {principal && !aceso && <span className="mt-1 text-[10px] uppercase tracking-widest text-alga">seu final</span>}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-espuma/70">Faróis acesos: {acesos.length}/{FINAIS.length}</p>
      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
