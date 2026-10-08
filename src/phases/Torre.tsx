import { useEffect, useRef, useState } from "react";
import { Repeat } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// "." é luz curta (ponto), "-" é luz longa (traço). Cada texto é uma letra.
type Rodada = { titulo: string; letras: string[]; guia: boolean; escuro: boolean; intro: string };

const RODADAS: Rodada[] = [
  {
    titulo: "LIA", letras: [".-..", "..", ".-"], guia: true, escuro: false,
    intro: "O primeiro sinal é o nome de Lia. Ouça e repita: toque rápido faz um ponto, segurar faz um traço. Os pontos cinza são o guia.",
  },
  {
    titulo: "VEM", letras: ["...-", ".", "--"], guia: false, escuro: false,
    intro: "Agora o chamado que Tomás mandava para ela. Sem guia: cada grupo é uma letra, e só você sabe o que ouviu.",
  },
  {
    titulo: "um pedido de socorro", letras: ["...", "---", "..."], guia: false, escuro: true,
    intro: "O nevoeiro engoliu a luz da torre, e só o som chega forte. Este é o sinal que Tomás nunca chegou a enviar.",
  },
];

const PONTO = 0.2, TRACO = 0.6, ESPACO = 0.22, ENTRE_LETRAS = 0.7; // segundos
const LIMIAR = 360;      // ms: abaixo é ponto, a partir daí é traço
const FREQ = 620;

function Marca({ s, tipo }: { s: string | null; tipo: "feito" | "guia" | "vazio" }) {
  const forma = s === "-" && tipo !== "vazio" ? "h-3 w-8" : "h-3 w-3";
  const cor = tipo === "feito" ? "bg-lanterna" : tipo === "guia" ? "bg-espuma/30" : "border border-espuma/40";
  return <span aria-hidden className={`inline-block rounded-full transition-all ${forma} ${cor}`} />;
}

export default function Torre() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const erros = useRef(0);
  const repeticoes = useRef(0);
  const aperto = useRef<{ t: number; tom: ReturnType<typeof audio.afinador>; aviso: number } | null>(null);
  const [rodada, setRodada] = useState(0);
  const [entrada, setEntrada] = useState<string[]>([]);
  const [tocando, setTocando] = useState(true);   // o sinal está sendo mostrado
  const [travado, setTravado] = useState(false);  // entre rodadas
  const [luz, setLuz] = useState(false);          // lâmpada acesa pelo sinal do jogo
  const [segurando, setSegurando] = useState(false);
  const [longo, setLongo] = useState(false);
  const [msg, setMsg] = useState(RODADAS[0].intro);

  const r = RODADAS[rodada];
  const alvo = r.letras.join("");
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const limpar = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Mostra o sinal da rodada atual: luz e som juntos
  const reproduzir = () => {
    limpar();
    setTocando(true);
    setEntrada([]);
    let t = 0;
    r.letras.forEach((letra) => {
      [...letra].forEach((s) => {
        const dur = s === "." ? PONTO : TRACO;
        agendar(() => { setLuz(true); audio.bipe(dur, FREQ); }, t * 1000);
        agendar(() => setLuz(false), (t + dur) * 1000);
        t += dur + ESPACO;
      });
      t += ENTRE_LETRAS - ESPACO;
    });
    agendar(() => setTocando(false), t * 1000);
  };

  // Cada rodada começa com o sinal sendo mostrado uma vez, de graça
  useEffect(() => {
    setTocando(true);
    agendar(reproduzir, 900);
    return limpar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodada]);

  const ouvirDeNovo = () => {
    if (tocando || travado || fim.current) return;
    repeticoes.current++;
    setMsg("O sinal passa de novo. Cada repetição pesa um pouco na pontuação.");
    reproduzir();
  };

  const registrar = (sinal: string) => {
    const i = entrada.length;
    if (sinal !== alvo[i]) {
      erros.current++;
      audio.sfx.erro();
      setEntrada([]);
      setMsg("Sinal errado. O chamado recomeça do primeiro sinal.");
      return;
    }
    const nova = [...entrada, sinal];
    setEntrada(nova);
    if (nova.length < alvo.length) {
      if (alvo.length - nova.length === 1) setMsg("Falta só um sinal.");
      return;
    }
    setTravado(true);
    audio.sfx.sinalOk();
    if (rodada < RODADAS.length - 1) {
      setMsg(`Sinal enviado. Lá fora, a água treme: alguém viu.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEntrada([]);
        setTravado(false);
        setMsg(RODADAS[prox].intro);
      }, 1900);
      return;
    }
    fim.current = true;
    audio.sfx.chamado();
    audio.sfx.porta();
    audio.sfx.vitoria();
    giveItem("sinal-da-torre");
    setMsg("O chamado sobe pela água turva. Muito acima, uma luz pequena pisca de volta.");
    const custo = erros.current * 2 + repeticoes.current;
    agendar(() => complete("torre", {
      estrelas: custo <= 2 ? 3 : custo <= 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [
        erros.current ? `Sinais errados: ${erros.current}` : "Nenhum sinal errado",
        repeticoes.current ? `Repetições do sinal: ${repeticoes.current}` : "Nenhuma repetição",
      ],
    }), 2300);
  };

  const apertar = () => {
    if (aperto.current || tocando || travado || fim.current) return;
    const tom = audio.afinador();
    tom.definir(FREQ);
    const aviso = window.setTimeout(() => setLongo(true), LIMIAR);
    aperto.current = { t: performance.now(), tom, aviso };
    setSegurando(true);
    setLongo(false);
  };

  const soltar = () => {
    const a = aperto.current;
    if (!a) return;
    aperto.current = null;
    clearTimeout(a.aviso);
    a.tom.parar();
    setSegurando(false);
    setLongo(false);
    registrar(performance.now() - a.t < LIMIAR ? "." : "-");
  };

  // Os ouvintes da janela são criados uma vez; este ref entrega sempre a versão mais nova das funções
  const acoes = useRef({ apertar, soltar });
  acoes.current = { apertar, soltar };

  useEffect(() => {
    const desce = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); acoes.current.apertar(); } };
    const sobe = (e: KeyboardEvent) => { if (e.code === "Space") acoes.current.soltar(); };
    const solta = () => acoes.current.soltar();
    window.addEventListener("keydown", desce);
    window.addEventListener("keyup", sobe);
    window.addEventListener("blur", solta);
    return () => {
      window.removeEventListener("keydown", desce);
      window.removeEventListener("keyup", sobe);
      window.removeEventListener("blur", solta);
      const a = aperto.current;
      if (a) { clearTimeout(a.aviso); a.tom.parar(); aperto.current = null; }
    };
  }, []);

  const aceso = segurando || luz;
  // No nevoeiro, a luz mostrada pelo jogo fica fraca; a sua própria luz continua forte
  const forca = segurando ? 1 : luz ? (r.escuro ? 0.3 : 1) : 0;
  const bloqueado = tocando || travado;
  const rotulo = tocando ? "Escute o sinal..." : travado ? "Sinal enviado" : segurando ? (longo ? "Traço" : "Ponto") : "Segure a lanterna";

  let k = 0;
  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coracao" />
      <div className="flex justify-center"><Cabecalho id="torre" /></div>

      <p className="font-narrativa italic text-espuma/80">Rodada {rodada + 1} de {RODADAS.length}: sinal de {r.titulo}.</p>

      <section
        aria-label={`Sinais: ${entrada.length} de ${alvo.length} respondidos`}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl border border-mare bg-mare/30 px-4 py-4 backdrop-blur-sm"
      >
        {r.letras.map((letra, li) => (
          <div key={li} className="flex items-center gap-2">
            {[...letra].map((s) => {
              const i = k++;
              const feito = entrada[i];
              return feito
                ? <Marca key={i} s={feito} tipo="feito" />
                : r.guia ? <Marca key={i} s={s} tipo="guia" /> : <Marca key={i} s={null} tipo="vazio" />;
            })}
          </div>
        ))}
      </section>

      <button
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); apertar(); }}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onLostPointerCapture={soltar}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Lanterna de sinais. Toque rápido faz um ponto, segurar faz um traço. Também funciona com a barra de espaço."
        aria-disabled={bloqueado}
        className="relative mx-auto flex h-44 w-44 select-none items-center justify-center rounded-full border-2 border-lanterna/70 font-narrativa text-lg text-espuma transition-[box-shadow,background] duration-100"
        style={{
          touchAction: "none",
          background: aceso
            ? "radial-gradient(circle, #FFF3C4 0%, #FFBF00 45%, rgba(255,191,0,0.2) 100%)"
            : "radial-gradient(circle, #1F3A40 0%, #0A1A1F 100%)",
          boxShadow: aceso ? `0 0 ${70 * forca}px ${20 * forca}px rgba(255,191,0,${0.45 * forca})` : "none",
          opacity: bloqueado && !luz ? 0.75 : 1,
          color: aceso ? "#0A1A1F" : undefined,
        }}
      >
        {rotulo}
      </button>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Sinais: {entrada.length}/{alvo.length}</span>
        <button onClick={ouvirDeNovo} disabled={bloqueado} className="flex items-center gap-1 underline disabled:opacity-40">
          <Repeat size={14} aria-hidden /> Ouvir de novo (pesa na nota)
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
