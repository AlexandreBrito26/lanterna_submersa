import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { audio } from "../game/audio";
import { useGame } from "../store/useGame";
import { configAtual } from "../game/dificuldade";

const ondaPath = (topo: number, fase: number, fechar: boolean) => {
  let d = `M0 ${topo + Math.sin(fase) * 3}`;
  for (let x = 12; x <= 360; x += 12) d += ` L${x} ${topo + Math.sin(x * 0.08 + fase) * 3}`;
  return fechar ? `${d} L360 520 L0 520 Z` : d;
};
const yDoNivel = (n: number) => 500 - n * 460;

type Mecanismo = {
  id: "pedal" | "sino" | "comporta";
  nome: string;
  nivel: number; // altura em que ele fica na catedral
  ativo: (nivel: number, descendo: boolean, janela: number) => boolean;
  erro: string;
};

const mecanismos: Mecanismo[] = [
  { id: "pedal", nome: "Pedal do chão", nivel: 0.2, ativo: (n) => n < 0.2, erro: "A água cobre o pedal. Espere a maré baixar." },
  { id: "sino", nome: "Corda do sino", nivel: 0.85, ativo: (n) => n > 0.85, erro: "A corda está alta demais. Espere a maré encher." },
  { id: "comporta", nome: "Comporta central", nivel: 0.5, ativo: (n, d, j) => Math.abs(n - 0.5) < j && d, erro: "A comporta só cede com a água na metade e descendo." },
];
const ordemCerta: Mecanismo["id"][] = ["pedal", "sino", "comporta"];

export default function Catedral() {
  const { giveItem, complete, leave } = useGame();
  const cfg = configAtual();
  const [nivel, setNivel] = useState(0.5);
  const [descendo, setDescendo] = useState(false);
  const [feitos, setFeitos] = useState<Mecanismo["id"][]>([]);
  const [msg, setMsg] = useState("Observe a maré. Cada mecanismo só responde na altura certa.");
  const fim = useRef(false);

  useEffect(() => {
    let raf = 0;
    let anterior = 0.5;
    const inicio = performance.now();
    const loop = (agora: number) => {
      const t = (agora - inicio) / 1000;
      const n = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / cfg.periodo);
      setNivel(n);
      setDescendo(n < anterior);
      anterior = n;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const acionar = (m: Mecanismo) => {
    if (fim.current || feitos.includes(m.id)) return;
    if (!m.ativo(nivel, descendo, cfg.comporta)) { audio.sfx.erro(); setMsg(m.erro); return; }
    if (m.id !== ordemCerta[feitos.length]) {
      audio.sfx.erro();
      setFeitos([]);
      setMsg("Nada responde. A ordem está errada e a catedral voltou ao início.");
      return;
    }
    const novos = [...feitos, m.id];
    setFeitos(novos);
    if (novos.length < ordemCerta.length) {
      audio.sfx.porta();
      setMsg("Algo se move nas paredes. Continue.");
    } else {
      fim.current = true;
      audio.sfx.vitoria();
      giveItem("sino-da-mare");
      setMsg("O sino toca sob a água e a nave se abre.");
      setTimeout(() => complete("catedral"), 1800);
    }
  };

  const reduz = useReducedMotion();
  const fase = reduz ? 0 : performance.now() * 0.003;
  const topo = yDoNivel(nivel);

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-6 py-10">
      <header className="flex items-center justify-between">
        <h2 className="font-narrativa text-3xl text-lanterna">Catedral das Marés</h2>
        <button onClick={leave} className="text-sm text-espuma/70 underline">Voltar</button>
      </header>

      <p className="rounded-lg border-l-4 border-lanterna bg-mare/30 p-3 font-narrativa italic">
        Inscrição no altar: o mar primeiro abre o chão, depois chama o céu, por fim deixa a porta passar.
      </p>

      <svg viewBox="0 0 360 520" className="mx-auto w-full max-w-xs rounded-lg border border-mare" role="img" aria-label="Nave da catedral com a água subindo e descendo">
        <rect width="360" height="520" fill="#0B1D2A" />
        <path d="M40 520 V200 Q40 40 180 20 Q320 40 320 200 V520" fill="none" stroke="#14465A" strokeWidth="6" />
        <path d="M100 520 V260 Q100 150 180 130 Q260 150 260 260 V520" fill="none" stroke="#14465A" strokeWidth="4" />
        {[[150, 210, 260, 100], [110, 130, 160, 60]].map(([a, b, c, d], k) => (
          <polygon key={k} points={`${a},20 ${b},20 ${c},520 ${d},520`} fill="#F2CC8F" opacity="0.04">
            {!reduz && <animate attributeName="opacity" values="0.02;0.07;0.02" dur={`${6 + k * 2}s`} repeatCount="indefinite" />}
          </polygon>
        ))}
        {mecanismos.map((m) => {
          const ligado = m.ativo(nivel, descendo, cfg.comporta) && !feitos.includes(m.id);
          const feito = feitos.includes(m.id);
          return (
            <g key={m.id}>
              {ligado && (
                <circle cx={180} cy={yDoNivel(m.nivel)} r={14} fill="none" stroke="#F2CC8F" strokeWidth="2">
                  {!reduz && <animate attributeName="r" values="12;22;12" dur="1.4s" repeatCount="indefinite" />}
                  {!reduz && <animate attributeName="opacity" values="0.9;0;0.9" dur="1.4s" repeatCount="indefinite" />}
                </circle>
              )}
              <circle
                cx={180}
                cy={yDoNivel(m.nivel)}
                r={feito ? 12 : 10}
                fill={feito ? "#3D8B7A" : ligado ? "#F2CC8F" : "#E07A5F"}
                opacity={ligado || feito ? 1 : 0.6}
              />
            </g>
          );
        })}
        <path d={ondaPath(topo, fase, true)} fill="#14465A" opacity="0.75" />
        <path d={ondaPath(topo, fase, false)} fill="none" stroke="#EAF4F4" strokeWidth="2" opacity="0.7" />
      </svg>

      <p className="text-center text-sm text-espuma/70" aria-live="off">
        Maré {descendo ? "descendo" : "subindo"}
      </p>

      <ul className="flex flex-col gap-2">
        {mecanismos.map((m) => {
          const feito = feitos.includes(m.id);
          return (
            <li key={m.id}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => acionar(m)}
                disabled={feito}
                className="w-full rounded-lg border border-mare bg-mare/40 p-3 text-left enabled:hover:border-lanterna disabled:border-alga disabled:text-alga"
              >
                {m.nome}
                {feito && " (acionado)"}
              </motion.button>
            </li>
          );
        })}
      </ul>

      <p className="font-narrativa text-espuma/90" role="status">{msg}</p>
    </main>
  );
}
