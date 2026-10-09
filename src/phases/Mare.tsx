import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · . sempre aberto · a passagem de maré baixa · b passagem de maré alta · @ você · * saída
// A maré inverte a cada passo. Sua célula e a de destino precisam estar abertas na maré nova.
// OTIMOS é o mínimo de passos de cada labirinto, achado por busca em largura sobre (posição, maré).
const MAPAS = [
  [".##aa", ".*..#", ".b.#.", ".##.#", "..@a."],
  [".....", "..#..", "@a...", "###.b", "bb..*"],
  ["..#@a", "a##.#", "*.#..", "...#.", ".#..."],
];
const OTIMOS = [6, 10, 11];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "A maré começa baixa. A cada passo ela vira, e as passagens de areia e de água se trocam. Só dá para pisar onde o mar deixa.",
  "O canal é mais longo e as passagens se misturam. Conte os passos antes de andar: uma célula que fecha sob você te leva para o lodo.",
  "A última maré do canal. Pense duas jogadas à frente: quem espera a maré certa chega à saída sem molhar os pés.",
];

type Campo = { W: number; H: number; paredes: Set<number>; pa: Set<number>; pb: Set<number>; ini: number; alvo: number };
type Estado = { p: number; baixa: boolean };

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const paredes = new Set<number>(), pa = new Set<number>(), pb = new Set<number>();
  let ini = 0, alvo = -1;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") paredes.add(p);
    if (c === "a") pa.add(p);
    if (c === "b") pb.add(p);
    if (c === "@") ini = p;
    if (c === "*") alvo = p;
  }));
  return { W, H, paredes, pa, pb, ini, alvo };
}
const CAMPOS = MAPAS.map(ler);

// Uma célula está aberta na maré baixa (baixa = true) ou alta (baixa = false)?
function aberto(f: Campo, p: number, baixa: boolean): boolean {
  if (f.paredes.has(p)) return false;
  if (f.pa.has(p)) return baixa;
  if (f.pb.has(p)) return !baixa;
  return true;
}

export default function MareFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [estado, setEstado] = useState<Estado>({ p: CAMPOS[0].ini, baixa: true });
  const [historico, setHistorico] = useState<Estado[]>([]);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.mare.chegou();
    const nota = n === OTIMOS[rodada] ? "o caminho mais curto" : `o mais curto tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`Você chega à saída em ${n} passos (${nota}). A maré recua e abre o canal seguinte.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEstado({ p: CAMPOS[prox].ini, baixa: true });
        setHistorico([]); setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("ritmo-da-mare");
    const total = passosTotal.current;
    setMsg(`O canal inteiro se abre, e a Sineira responde do outro lado (${nota}).`);
    agendar(() => complete("mare", {
      estrelas: total <= SOMA_OTIMOS + 3 ? 3 : total <= SOMA_OTIMOS + 9 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Canais reiniciados: ${reinicios.current}` : "Nenhum reinício"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (estado.p % f.W) + dx, y = Math.floor(estado.p / f.W) + dy;
    if (x < 0 || y < 0 || x >= f.W || y >= f.H) return;
    const q = y * f.W + x, nova = !estado.baixa;
    if (!aberto(f, q, nova)) { audio.sfx.mare.bloqueio(); setMsg("Essa passagem está fechada na maré nova. Espere a maré certa."); return; }
    if (!aberto(f, estado.p, nova)) { audio.sfx.mare.bloqueio(); setMsg("A maré fecharia sob os seus pés. Procure outro caminho."); return; }
    const fechando = [...f.pa, ...f.pb].filter((c) => aberto(f, c, estado.baixa) && !aberto(f, c, nova)).length;
    setHistorico((h) => [...h, estado]);
    setEstado({ p: q, baixa: nova });
    const n = passos + 1;
    setPassos(n);
    passosTotal.current++;
    if (nova) audio.sfx.mare.descer(); else audio.sfx.mare.subir();
    if (fechando) audio.sfx.mare.fecha();
    if (q === f.alvo) { concluir(n); return; }
    setMsg(nova ? "A maré baixa. As passagens de areia aparecem." : "A maré sobe. As passagens de areia se fecham.");
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setEstado(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.mare.subir();
    setMsg("Você volta um passo. A maré também volta, mas os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEstado({ p: f.ini, baixa: true }); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O canal volta ao começo, com a maré baixa. Os passos já dados continuam contando.");
  };

  const acoes = useRef({ mover, desfazer });
  acoes.current = { mover, desfazer };
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (d[e.key]) { e.preventDefault(); acoes.current.mover(...d[e.key]); }
      else if (e.key === "z" || e.key === "Z") acoes.current.desfazer();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const seta = (rotulo: string, Icone: typeof ArrowUp, dx: number, dy: number) => (
    <button
      onClick={() => mover(dx, dy)}
      aria-label={rotulo}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-lanterna/60 bg-mare/40 text-lanterna active:scale-95"
    ><Icone size={22} aria-hidden /></button>
  );

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="mare" />
      <div className="flex justify-center"><Cabecalho id="mare" /></div>

      <p className="font-narrativa italic text-espuma/80">Canal {rodada + 1} de {CAMPOS.length}: chegue à saída com a maré mudando a cada passo.</p>

      <p className="text-sm uppercase tracking-widest text-latao" aria-live="polite">
        Maré {estado.baixa ? "baixa" : "alta"} agora · a próxima será {estado.baixa ? "alta" : "baixa"}
      </p>

      <div
        role="img"
        aria-label={`Labirinto da maré. A maré está ${estado.baixa ? "baixa" : "alta"}. Use as setas para andar.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.paredes.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const passagem = f.pa.has(p) ? "baixa" : f.pb.has(p) ? "alta" : null;
          const abre = passagem ? aberto(f, p, estado.baixa) : true;
          const alvo = f.alvo === p, eu = estado.p === p;
          const fundo = !passagem
            ? "bg-mare/25"
            : abre
              ? (passagem === "baixa" ? "bg-latao/45" : "bg-mare/60")
              : "bg-[#0d2a3b]";
          return (
            <div key={p} className={`relative aspect-square rounded-sm transition-colors duration-500 ${fundo}`}>
              {passagem && !abre && <span className="absolute inset-[30%] rounded-full border border-mare/40" />}
              {alvo && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.55)]" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos}</span>
        <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer (Z)
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Andar">
        <span />{seta("Subir", ArrowUp, 0, -1)}<span />
        {seta("Ir para a esquerda", ArrowLeft, -1, 0)}{seta("Descer", ArrowDown, 0, 1)}{seta("Ir para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
