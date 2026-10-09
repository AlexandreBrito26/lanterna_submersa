import { useEffect, useRef, useState } from "react";
import { Shield, RotateCcw } from "lucide-react";
import { audio } from "../game/audio";
import AmbienteFase from "../components/AmbienteFase";
import { useGame } from "../store/useGame";
import Cabecalho from "../components/Cabecalho";

// f farol · # parede · . casa livre para escudo.
// Uma onda sai da esquerda de cada linha e outra do topo de cada coluna, sempre em linha reta.
// Cada onda para ao bater numa parede ou num escudo. Se chegar a um farol, ele se perde.
// Coloque escudos para proteger todos os faróis. OTIMOS é o menor número de escudos de cada trecho, por busca exaustiva.
const MAPAS = [
  ["....", ".f..", "....", "...."],
  ["....", ".f.f", "....", "...."],
  ["#...", ".f..", "..f.", "...."],
];
const OTIMOS = [2, 3, 4];
const SOMA_OTIMOS = OTIMOS.reduce((a, b) => a + b, 0);

const INTROS = [
  "As ondas correm em linha reta: da esquerda para cada linha e do topo para cada coluna. Um escudo para cada onda que ameaça um farol.",
  "Dois faróis, e as ondas se cruzam. Um escudo pode proteger a linha de um farol e a coluna de outro ao mesmo tempo.",
  "A última muralha do porto. Uma parede já ajuda, mas os faróis estão no meio do mar: calcule cada onda antes de colocar um escudo.",
];

type Trecho = { W: number; H: number; celulas: string[] };

function ler(mapa: string[]): Trecho {
  return { W: mapa[0].length, H: mapa.length, celulas: mapa.flatMap((l) => [...l]) };
}
const TRECHOS = MAPAS.map(ler);

// Quais faróis são atingidos pelas ondas com os escudos atuais
function faroisAtingidos(t: Trecho, escudos: Set<number>): Set<number> {
  const atingidos = new Set<number>();
  const bloqueado = (p: number) => t.celulas[p] === "#" || escudos.has(p);
  const andar = (x0: number, y0: number, dx: number, dy: number) => {
    let x = x0, y = y0;
    while (x >= 0 && y >= 0 && x < t.W && y < t.H) {
      const p = y * t.W + x;
      if (bloqueado(p)) return;
      if (t.celulas[p] === "f") atingidos.add(p);
      x += dx; y += dy;
    }
  };
  for (let y = 0; y < t.H; y++) andar(0, y, 1, 0);
  for (let x = 0; x < t.W; x++) andar(x, 0, 0, 1);
  return atingidos;
}

export default function MuralhaFase() {
  const { giveItem, complete } = useGame();
  const inicio = useRef(performance.now());
  const fim = useRef(false);
  const timers = useRef<number[]>([]);
  const escudosTotal = useRef(0);
  const reinicios = useRef(0);
  const [rodada, setRodada] = useState(0);
  const [escudos, setEscudos] = useState<Set<number>>(() => new Set());
  const [travado, setTravado] = useState(false);
  const [msg, setMsg] = useState(INTROS[0]);

  const t = TRECHOS[rodada];
  const atingidos = faroisAtingidos(t, escudos);
  const faroes = t.celulas.flatMap((c, p) => (c === "f" ? [p] : []));
  const expostos = faroes.filter((p) => atingidos.has(p)).length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const agendar = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const concluir = (n: number) => {
    setTravado(true);
    audio.sfx.muralha.completo();
    const nota = n === OTIMOS[rodada] ? "o mínimo de escudos" : `o mínimo era ${OTIMOS[rodada]}`;
    if (rodada < TRECHOS.length - 1) {
      setMsg(`Todos os faróis estão a salvo com ${n} ${n === 1 ? "escudo" : "escudos"} (${nota}). A muralha seguinte se ergue.`);
      agendar(() => {
        const prox = rodada + 1;
        setRodada(prox);
        setEscudos(new Set()); setTravado(false);
        setMsg(INTROS[prox]);
      }, 2300);
      return;
    }
    fim.current = true;
    giveItem("muralha-de-escudos");
    const total = escudosTotal.current;
    setMsg(`Nenhuma onda chega aos faróis. A luz segue inteira até o porto (${nota}).`);
    agendar(() => complete("muralha", {
      estrelas: total <= SOMA_OTIMOS ? 3 : total <= SOMA_OTIMOS + 2 ? 2 : 1,
      tempo: Math.round((performance.now() - inicio.current) / 1000),
      detalhes: [`Escudos: ${total} (o mínimo seria ${SOMA_OTIMOS})`, reinicios.current ? `Muralhas refeitas: ${reinicios.current}` : "Nenhuma muralha refeita"],
    }), 2800);
  };

  const alternar = (p: number) => {
    if (fim.current || travado || t.celulas[p] !== ".") return;
    const novo = new Set(escudos);
    if (novo.has(p)) {
      novo.delete(p);
      audio.sfx.muralha.tirar();
      setEscudos(novo);
      setMsg("O escudo é recolhido. As ondas voltam a correr por aquela casa.");
      return;
    }
    novo.add(p);
    escudosTotal.current++;
    audio.sfx.muralha.erguer();
    setEscudos(novo);
    const agora = faroisAtingidos(t, novo);
    if (agora.size === 0) { concluir(novo.size); return; }
    setMsg(`${agora.size} ${agora.size === 1 ? "farol ainda exposto" : "faróis ainda expostos"} às ondas.`);
  };

  const reiniciar = () => {
    if (fim.current || travado) return;
    reinicios.current++;
    setEscudos(new Set());
    audio.sfx.interagir();
    setMsg("Os escudos são desmontados. Os já erguidos continuam contando.");
  };

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-4 py-3 fase-compacta">
      <AmbienteFase tipo="coral" />
      <div className="flex justify-center"><Cabecalho id="muralha" /></div>

      <p className="font-narrativa italic text-espuma/80">Muralha {rodada + 1} de {TRECHOS.length}: proteja todos os faróis das ondas.</p>

      <div
        role="grid"
        aria-label={`Mar com ${t.W} por ${t.H} casas. ${expostos} faróis expostos. ${escudos.size} escudos.`}
        className="mx-auto grid w-full gap-2 rounded-lg border border-latao/60 bg-abismo/60 p-3 backdrop-blur-sm"
        style={{ maxWidth: t.W * 78, gridTemplateColumns: `repeat(${t.W}, 1fr)` }}
      >
        {t.celulas.map((c, p) => {
          if (c === "#") return <div key={p} className="aspect-square rounded-md bg-[#2a3d44] shadow-inner" />;
          if (c === "f") {
            const exposto = atingidos.has(p);
            return (
              <div
                key={p}
                role="img"
                aria-label={exposto ? "Farol exposto às ondas" : "Farol protegido"}
                className={`flex aspect-square items-center justify-center rounded-md border-2 transition-colors duration-500 ${exposto ? "border-coral bg-coral/20" : "border-alga bg-alga/20"}`}
              >
                <span className={`block h-4 w-4 rounded-full ${exposto ? "bg-coral" : "bg-lanterna shadow-[0_0_12px_4px_rgba(255,191,0,0.5)]"}`} aria-hidden />
              </div>
            );
          }
          const escudo = escudos.has(p);
          return (
            <button
              key={p}
              onClick={() => alternar(p)}
              disabled={travado}
              aria-label={escudo ? "Escudo erguido, toque para recolher" : "Casa livre, toque para erguer um escudo"}
              className={`flex aspect-square items-center justify-center rounded-md border transition-all duration-300 ${escudo ? "border-mare bg-mare/50" : "border-latao/40 bg-mare/20 hover:border-lanterna/60"} disabled:cursor-default`}
            >
              {escudo && <Shield size={18} className="text-espuma" aria-hidden />}
            </button>
          );
        })}
      </div>

      <p className="flex items-center justify-between text-sm text-espuma/70">
        <span>Escudos: {escudos.size} · Faróis expostos: {expostos}/{faroes.length}</span>
        <button onClick={reiniciar} disabled={travado} className="flex items-center gap-1 underline disabled:opacity-40">
          <RotateCcw size={14} aria-hidden /> Recolher os escudos
        </button>
      </p>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
