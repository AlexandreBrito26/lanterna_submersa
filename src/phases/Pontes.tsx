import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// Pontes de mangue. Cada ilha tem um número: é o total de pontes que saem dela.
// Toque numa ilha e depois em outra alinhada (na mesma linha ou coluna, sem ilha no meio). Cada toque cria
// ou aumenta a ponte (1, depois 2, depois nenhuma). Pontes não podem se cruzar. Vence quando todas as ilhas
// têm o número certo de pontes e todas estão ligadas entre si.
type Ilha = { x: number; y: number; n: number };
type Trecho = { W: number; H: number; ilhas: Ilha[] };
const TRECHOS: Trecho[] = [
  { W: 5, H: 4, ilhas: [{ x: 0, y: 0, n: 3 }, { x: 4, y: 0, n: 3 }, { x: 0, y: 3, n: 3 }, { x: 4, y: 3, n: 3 }] },
  { W: 5, H: 5, ilhas: [{ x: 0, y: 0, n: 2 }, { x: 2, y: 0, n: 5 }, { x: 4, y: 0, n: 3 }, { x: 2, y: 2, n: 2 }, { x: 0, y: 4, n: 2 }, { x: 4, y: 4, n: 4 }] },
];
const LIMITE = { tres: 14, dois: 20 };

const INTROS = [
  "Quatro ilhas de mangue, cada uma com três pontes. Ligue-as na mesma linha ou coluna, sem cruzar as pontes.",
  "Seis ilhas, algumas com muitas pontes. Comece pela ilha de número mais alto: ela decide para onde as outras vão.",
];

function chave(a: number, b: number): string { return a < b ? `${a}-${b}` : `${b}-${a}`; }

export default function PontesFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const togglesTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [pontes, setPontes] = useState<Record<string, number>>({});
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const grau = (i: number) => Object.entries(pontes).reduce((s, [k, v]) => {
    const [a, b] = k.split("-").map(Number);
    return s + (a === i || b === i ? v : 0);
  }, 0);

  const conectadas = (): boolean => {
    const vizinhos: Map<number, number[]> = new Map(t.ilhas.map((_, i) => [i, []]));
    Object.entries(pontes).forEach(([k, v]) => { if (v > 0) { const [a, b] = k.split("-").map(Number); vizinhos.get(a)!.push(b); vizinhos.get(b)!.push(a); } });
    const vistos = new Set([0]); const fila = [0];
    while (fila.length) { const i = fila.shift()!; (vizinhos.get(i) ?? []).forEach((j) => { if (!vistos.has(j)) { vistos.add(j); fila.push(j); } }); }
    return vistos.size === t.ilhas.length;
  };

  const ilhaNoMeio = (a: number, b: number): boolean => {
    const A = t.ilhas[a], B = t.ilhas[b];
    return t.ilhas.some((c, i) => i !== a && i !== b && (
      (A.y === B.y && c.y === A.y && c.x > Math.min(A.x, B.x) && c.x < Math.max(A.x, B.x)) ||
      (A.x === B.x && c.x === A.x && c.y > Math.min(A.y, B.y) && c.y < Math.max(A.y, B.y))));
  };

  const cruza = (a: number, b: number): boolean => {
    const A = t.ilhas[a], B = t.ilhas[b];
    if (A.y !== B.y && A.x !== B.x) return false;
    return Object.entries(pontes).some(([k, v]) => {
      if (v === 0) return false;
      const [c, d] = k.split("-").map(Number);
      const C = t.ilhas[c], D = t.ilhas[d];
      if (C.x === D.x || A.y !== B.y) {
        if (A.y === B.y && C.x === D.x) {
          const xi = C.x, yMin = Math.min(C.y, D.y), yMax = Math.max(C.y, D.y), hy = A.y;
          return xi > Math.min(A.x, B.x) && xi < Math.max(A.x, B.x) && hy > yMin && hy < yMax;
        }
      }
      if (A.x === B.x && C.y === D.y) {
        const yi = C.y, xMin = Math.min(C.x, D.x), xMax = Math.max(C.x, D.x), vx = A.x;
        return yi > Math.min(A.y, B.y) && yi < Math.max(A.y, B.y) && vx > xMin && vx < xMax;
      }
      return false;
    });
  };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.pontes.completo();
    if (rodada < TRECHOS.length - 1) {
      setMsg(`As ilhas estão ligadas, com todas as pontes no lugar (${n} toques). O próximo mangue se abre.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setPontes({}); setSelecionada(null); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("pontes-de-mangue");
    const total = togglesTotal.current;
    setMsg(`O mangue inteiro está ligado, e as pontes sustentam a costa (${total} toques no total).`);
    agendar(() => complete("pontes", {
      estrelas: total <= LIMITE.tres ? 3 : total <= LIMITE.dois ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Toques: ${total}`, reinicios.current ? `Mangues refeitos: ${reinicios.current}` : "Nenhum mangue refeito"],
    }), 2800);
  };

  const tocarIlha = (i: number) => {
    if (fim.current || travado) return;
    if (selecionada === null) { setSelecionada(i); setMsg("Ilha marcada. Toque noutra ilha alinhada para ligar."); return; }
    if (selecionada === i) { setSelecionada(null); return; }
    const a = selecionada;
    setSelecionada(null);
    const alinhadas = t.ilhas[a].x === t.ilhas[i].x || t.ilhas[a].y === t.ilhas[i].y;
    if (!alinhadas) { audio.sfx.pontes.falha(); setMsg("Ilhas precisam estar na mesma linha ou coluna."); return; }
    if (ilhaNoMeio(a, i)) { audio.sfx.pontes.falha(); setMsg("Há outra ilha no meio do caminho."); return; }
    const k = chave(a, i);
    const atual = pontes[k] ?? 0;
    const proximo = (atual + 1) % 3;
    if (proximo > 0 && cruza(a, i)) { audio.sfx.pontes.falha(); setMsg("Essa ponte cruzaria outra ponte."); return; }
    if (proximo > 0 && (grau(a) - atual + proximo > t.ilhas[a].n || grau(i) - atual + proximo > t.ilhas[i].n)) {
      audio.sfx.pontes.falha(); setMsg("Essa ponte passa do número de uma das ilhas.");
      return;
    }
    const novo = { ...pontes, [k]: proximo };
    setPontes(novo);
    togglesTotal.current++;
    audio.sfx.pontes.ponte();
    const ok = t.ilhas.every((il, j) => grau(j) - (novo[k] - (pontes[k] ?? 0)) * 0 >= 0) && t.ilhas.every((il, j) => {
      const g = Object.entries(novo).reduce((s, [kk, v]) => { const [p, q] = kk.split("-").map(Number); return s + (p === j || q === j ? v : 0); }, 0);
      return g === il.n;
    });
    if (ok && conectadas()) { concluir(togglesTotal.current); return; }
    setMsg("Ponte ligada. Confira os números das ilhas.");
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setPontes({}); setSelecionada(null);
    audio.sfx.interagir();
    setMsg("As pontes são desmontadas. Os toques já dados continuam contando.");
  };

  const W = t.W, H = t.H;

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="pontes" /></div>

      <p className="font-narrativa italic text-espuma/80">Mangue {rodada + 1} de {TRECHOS.length}: ligue as ilhas com o número exato de pontes.</p>

      <div className="relative mx-auto w-full" style={{ maxWidth: W * 60, aspectRatio: `${W} / ${H}` }} role="group" aria-label={`Mangue de ${t.ilhas.length} ilhas`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
          {Object.entries(pontes).filter(([, v]) => v > 0).map(([k, v]) => {
            const [a, b] = k.split("-").map(Number);
            const A = t.ilhas[a], B = t.ilhas[b];
            return (
              <g key={k}>
                {v === 1 && <line x1={A.x + 0.5} y1={A.y + 0.5} x2={B.x + 0.5} y2={B.y + 0.5} stroke="#7FE0D0" strokeWidth="0.12" strokeLinecap="round" />}
                {v === 2 && <>
                  <line x1={A.x + 0.5 + (A.y === B.y ? 0 : 0.1)} y1={A.y + 0.5 + (A.x === B.x ? 0 : 0.1)} x2={B.x + 0.5 + (A.y === B.y ? 0 : 0.1)} y2={B.y + 0.5 + (A.x === B.x ? 0 : 0.1)} stroke="#7FE0D0" strokeWidth="0.1" strokeLinecap="round" />
                  <line x1={A.x + 0.5 - (A.y === B.y ? 0 : 0.1)} y1={A.y + 0.5 - (A.x === B.x ? 0 : 0.1)} x2={B.x + 0.5 - (A.y === B.y ? 0 : 0.1)} y2={B.y + 0.5 - (A.x === B.x ? 0 : 0.1)} stroke="#7FE0D0" strokeWidth="0.1" strokeLinecap="round" />
                </>}
              </g>
            );
          })}
        </svg>
        {t.ilhas.map((il, i) => {
          const g = grau(i), certo = g === il.n, excedeu = g > il.n;
          return (
            <button
              key={i}
              onClick={() => tocarIlha(i)}
              disabled={travado}
              aria-label={`Ilha ${i + 1}, pede ${il.n} pontes, tem ${g}${selecionada === i ? ", selecionada" : ""}`}
              className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-narrativa text-lg transition-colors ${
                selecionada === i ? "border-lanterna bg-lanterna/30 text-lanterna"
                : excedeu ? "border-coral bg-coral/20 text-coral"
                : certo ? "border-alga bg-alga/20 text-alga"
                : "border-latao/70 bg-[#4a3424] text-espuma"
              } disabled:cursor-default`}
              style={{ left: `${((il.x + 0.5) / W) * 100}%`, top: `${((il.y + 0.5) / H) * 100}%` }}
            >
              {il.n}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Toques: {togglesTotal.current}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40"><RotateCcw size={14} aria-hidden /> Desmontar as pontes</button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
