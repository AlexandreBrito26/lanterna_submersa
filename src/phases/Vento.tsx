import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Undo2 } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// # rocha · . mar aberto · @ barco · * farol.
// Você anda um passo. Logo depois, o vento empurra o barco uma casa, e a direção gira a cada passo:
// direita, baixo, esquerda, cima. Se o vento bater numa rocha, o barco fica onde está.
// OTIMOS é o mínimo de passos de cada rota, achado por busca em largura sobre (posição, direção do vento).
const MAPAS = [
  ["@....", ".#...", "....#", "..#..", "....*"],
  ["@.....", "..#...", "......", "...#..", "..*..."],
  ["...#.", "..#..", ".##.*", "....#", "..@##"],
];
const OTIMOS = [5, 6, 7];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);
const VENTO: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const SETAS = [ArrowRight, ArrowDown, ArrowLeft, ArrowUp];

const INTROS = [
  "Ande com a vela, mas cuidado: depois de cada passo seu, o vento empurra o barco. Ele muda de direção a cada vez.",
  "O mar tem mais rochas agora. O empurrão do vento pode levar o barco para um lugar que você não planejou.",
  "O último mar do porto. Antes de cada passo, pense no empurrão que vem logo depois.",
];

type Campo = { W: number; H: number; rochas: Set<number>; ini: number; alvo: number };
type Estado = { p: number; n: number }; // n = passos dados neste trecho, para saber a direção do vento

function ler(mapa: string[]): Campo {
  const H = mapa.length, W = mapa[0].length;
  const rochas = new Set<number>();
  let ini = 0, alvo = -1;
  mapa.forEach((l, y) => [...l].forEach((c, x) => {
    const p = y * W + x;
    if (c === "#") rochas.add(p);
    if (c === "@") ini = p;
    if (c === "*") alvo = p;
  }));
  return { W, H, rochas, ini, alvo };
}
const CAMPOS = MAPAS.map(ler);

export default function VentoFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const passosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [estado, setEstado] = useState<Estado>({ p: CAMPOS[0].ini, n: 0 });
  const [historico, setHistorico] = useState<Estado[]>([]);
  const [passos, setPassos] = useState(0);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const f = CAMPOS[rodada];
  const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < f.W && y < f.H;
  const proximoVento = VENTO[(estado.n + 1) % 4];
  const SetaVento = SETAS[(estado.n + 1) % 4];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.vento.chegou();
    const nota = n === OTIMOS[rodada] ? "a rota mais curta" : `a rota mais curta tinha ${OTIMOS[rodada]}`;
    if (rodada < CAMPOS.length - 1) {
      setMsg(`O farol aparece no horizonte em ${n} passos (${nota}). O vento vira e o próximo mar se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEstado({ p: CAMPOS[prox].ini, n: 0 });
        setHistorico([]); setPassos(0); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("vela-do-farol");
    const total = passosTotal.current;
    setMsg(`A vela velha aponta para o farol, e o vento sopra a favor (${nota}).`);
    agendar(() => complete("vento", {
      estrelas: total <= SOMA_OTIMOS + 2 ? 3 : total <= SOMA_OTIMOS + 6 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Passos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Rotas refeitas: ${reinicios.current}` : "Nenhuma rota refeita"],
    }), 2800);
  };

  const mover = (dx: number, dy: number) => {
    if (fim.current || travado) return;
    const x = (estado.p % f.W) + dx, y = Math.floor(estado.p / f.W) + dy;
    if (!dentro(x, y) || f.rochas.has(y * f.W + x)) { audio.sfx.vento.bate(); setMsg("Rocha na frente. O barco não passa por ela."); return; }
    let q = y * f.W + x;
    const n = estado.n + 1;
    if (q === f.alvo) { passosTotal.current++; setHistorico((h) => [...h, estado]); setEstado({ p: q, n }); setPassos(passos + 1); audio.sfx.vento.empurrao(); concluir(passos + 1); return; }
    const [vx, vy] = VENTO[(estado.n + 1) % 4];
    const ex = x + vx, ey = y + vy;
    let empurrado = false;
    if (dentro(ex, ey) && !f.rochas.has(ey * f.W + ex)) { q = ey * f.W + ex; empurrado = true; }
    passosTotal.current++;
    setHistorico((h) => [...h, estado]);
    setEstado({ p: q, n });
    setPassos(passos + 1);
    audio.sfx.vento.sopro();
    if (q === f.alvo) { audio.sfx.vento.empurrao(); concluir(passos + 1); return; }
    setMsg(empurrado ? "O vento empurra o barco para o lado. Olhe a próxima rajada antes de navegar." : "O vento sopra contra o barco e o deixa parado no lugar.");
  };

  const desfazer = () => {
    const ant = historico[historico.length - 1];
    if (!ant || fim.current || travado) return;
    setEstado(ant);
    setHistorico(historico.slice(0, -1));
    audio.sfx.vento.sopro();
    setMsg("Você volta ao ponto anterior. Os passos já dados continuam contando.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEstado({ p: f.ini, n: 0 }); setHistorico([]);
    audio.sfx.interagir();
    setMsg("O barco volta ao porto. Os passos já dados continuam contando.");
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
      <AmbienteFase tipo="vento" />
      <div className="flex justify-center"><Cabecalho id="vento" /></div>

      <p className="font-narrativa italic text-espuma/80">Mar {rodada + 1} de {CAMPOS.length}: chegue ao farol contando com o vento.</p>

      <p className="flex items-center gap-2 text-sm uppercase tracking-widest text-latao" aria-live="polite">
        Próximo empurrão do vento <SetaVento size={16} aria-hidden className="text-lanterna" />
      </p>

      <div
        role="img"
        aria-label={`Mar com o barco e o farol. O próximo empurrão do vento vai para ${["direita", "baixo", "esquerda", "cima"][(estado.n + 1) % 4]}.`}
        className="mx-auto grid w-full gap-px rounded-lg border border-latao/60 bg-abismo/60 p-1 backdrop-blur-sm"
        style={{ maxWidth: f.W * 54, gridTemplateColumns: `repeat(${f.W}, 1fr)` }}
      >
        {Array.from({ length: f.W * f.H }, (_, p) => {
          if (f.rochas.has(p)) return <div key={p} className="aspect-square rounded-sm bg-[#2a3d44] shadow-inner" />;
          const alvo = f.alvo === p, eu = estado.p === p;
          return (
            <div key={p} className="relative aspect-square rounded-sm bg-mare/25">
              {alvo && <span className="absolute inset-[24%] rounded-full bg-lanterna shadow-[0_0_16px_4px_rgba(255,191,0,0.55)]" />}
              {eu && <span className="absolute inset-[20%] rounded-full bg-espuma shadow-[0_0_12px_2px_rgba(242,230,214,0.5)]" />}
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Passos: {passos} · vento: {["→", "↓", "←", "↑"][(estado.n + 1) % 4]}</span>
        <button onClick={desfazer} disabled={!historico.length || travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <Undo2 size={14} aria-hidden /> Desfazer (Z)
        </button>
      </p>

      <div className="mx-auto grid grid-cols-3 gap-2" role="group" aria-label="Velejar">
        <span />{seta("Velejar para cima", ArrowUp, 0, -1)}<span />
        {seta("Velejar para a esquerda", ArrowLeft, -1, 0)}{seta("Velejar para baixo", ArrowDown, 0, 1)}{seta("Velejar para a direita", ArrowRight, 1, 0)}
      </div>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
