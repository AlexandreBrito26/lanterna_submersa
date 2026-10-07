import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { audio } from "../game/audio";
import { useGame } from "../store/useGame";
import { configAtual } from "../game/dificuldade";
import Cabecalho from "../components/Cabecalho";
import AmbienteFase from "../components/AmbienteFase";

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
  const { giveItem, complete } = useGame();
  const erros = useRef(0);
  const inicio = useRef(performance.now());
  const cfg = configAtual();
  const [nivel, setNivel] = useState(0.5);
  const [descendo, setDescendo] = useState(false);
  const [feitos, setFeitos] = useState<Mecanismo["id"][]>([]);
  const [msg, setMsg] = useState("Observe a maré: a lua a puxa em ritmo torto. Cada mecanismo só responde na altura certa.");
  const fim = useRef(false);

  useEffect(() => {
    let raf = 0;
    let anterior = 0.5;
    const inicio = performance.now();
    const loop = (agora: number) => {
      const t = (agora - inicio) / 1000;
      const n = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / cfg.periodo + 0.9 * Math.sin((2 * Math.PI * t) / (cfg.periodo * 3)));
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
    if (!m.ativo(nivel, descendo, cfg.comporta)) { audio.sfx.erro(); erros.current++; setMsg(m.erro); return; }
    if (m.id !== ordemCerta[feitos.length]) {
      audio.sfx.erro();
      erros.current++;
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
      const e = erros.current;
      setTimeout(() => complete("catedral", {
        estrelas: e <= 1 ? 3 : e <= 4 ? 2 : 1,
        tempo: Math.round((performance.now() - inicio.current) / 1000),
        detalhes: [e === 0 ? "Nenhum erro" : `Acionamentos errados: ${e}`],
      }), 1500);
    }
  };

  const reduz = useReducedMotion();
  const fase = reduz ? 0 : performance.now() * 0.003;
  const topo = yDoNivel(nivel);

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col gap-3 overflow-y-auto px-6 py-10">
      <AmbienteFase tipo="catedral" />
      <div className="flex justify-center"><Cabecalho id="catedral" /></div>

      <p className="rounded-lg border-l-4 border-lanterna bg-mare/30 p-3 font-narrativa italic">
        Inscrição no altar: o mar primeiro abre o chão, depois chama o céu, por fim deixa a porta passar.
      </p>

      <svg viewBox="0 0 360 520" className="mx-auto w-full max-w-xs rounded-xl border border-mare shadow-[0_0_40px_rgba(20,70,90,0.5)]" role="img" aria-label="Nave da catedral com a água subindo e descendo">
        <defs>
          <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3D8B7A" stopOpacity="0.6" />
            <stop offset="1" stopColor="#0A1A1F" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="pedra" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0f3347" />
            <stop offset="0.5" stopColor="#1d5a73" />
            <stop offset="1" stopColor="#0f3347" />
          </linearGradient>
          <radialGradient id="rosaBrilho">
            <stop offset="0" stopColor="#FFBF00" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFBF00" stopOpacity="0" />
          </radialGradient>
          <clipPath id="clipAgua"><path d={ondaPath(topo, fase, true)} /></clipPath>
        </defs>
        <rect width="360" height="520" fill="#0A1A1F" />
        {/* colunas e arcos de pedra */}
        <path d="M40 520 V200 Q40 40 180 20 Q320 40 320 200 V520" fill="none" stroke="url(#pedra)" strokeWidth="10" />
        <path d="M100 520 V260 Q100 150 180 130 Q260 150 260 260 V520" fill="none" stroke="url(#pedra)" strokeWidth="6" />
        {[60, 300].map((x) => <rect key={x} x={x - 4} y="200" width="8" height="320" fill="url(#pedra)" opacity="0.5" />)}
        {/* rosácea de vitral */}
        <circle cx="180" cy="78" r="60" fill="url(#rosaBrilho)" />
        <g transform="translate(180 78)">
          <circle r="34" fill="#071722" stroke="#14465A" strokeWidth="3" />
          <g>
            {!reduz && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="90s" repeatCount="indefinite" />}
            {Array.from({ length: 8 }, (_, k) => (
              <ellipse key={k} cx="0" cy="-19" rx="7" ry="13" transform={`rotate(${k * 45})`} fill={["#E07A5F", "#FFBF00", "#3D8B7A", "#F2E6D6"][k % 4]} opacity="0.75" />
            ))}
          </g>
          <circle r="7" fill="#FFBF00" />
        </g>
        {/* feixes coloridos que descem do vitral */}
        {[["#E07A5F", 140, 90, 80, 30], ["#FFBF00", 175, 185, 150, 210], ["#3D8B7A", 220, 150, 250, 330]].map(([cor, a, b, c, d], k) => (
          <polygon key={k} points={`${a},100 ${Number(a) + 26},100 ${d},520 ${c},520`} fill={String(cor)} opacity="0.05">
            {!reduz && <animate attributeName="opacity" values="0.02;0.09;0.02" dur={`${5 + k * 2}s`} repeatCount="indefinite" />}
          </polygon>
        ))}
        {/* linhas de nível dos mecanismos */}
        {mecanismos.map((m) => (
          <g key={`n-${m.id}`}>
            <line x1="40" x2="320" y1={yDoNivel(m.nivel)} y2={yDoNivel(m.nivel)} stroke="#F2E6D6" strokeOpacity="0.12" strokeDasharray="4 6" />
            <text x="48" y={yDoNivel(m.nivel) - 8} fill="#F2E6D6" fillOpacity="0.45" fontSize="10">{m.nome}</text>
          </g>
        ))}
        {mecanismos.map((m) => {
          const ligado = m.ativo(nivel, descendo, cfg.comporta) && !feitos.includes(m.id);
          const feito = feitos.includes(m.id);
          const cor = feito ? "#3D8B7A" : ligado ? "#FFBF00" : "#E07A5F";
          const y = yDoNivel(m.nivel);
          return (
            <g key={m.id} transform={`translate(180 ${y})`} opacity={ligado || feito ? 1 : 0.6}>
              {ligado && (
                <circle r="16" fill="none" stroke="#FFBF00" strokeWidth="2">
                  {!reduz && <animate attributeName="r" values="14;28;14" dur="1.4s" repeatCount="indefinite" />}
                  {!reduz && <animate attributeName="opacity" values="0.9;0;0.9" dur="1.4s" repeatCount="indefinite" />}
                </circle>
              )}
              {(ligado || feito) && <circle r="26" fill={cor} opacity="0.18" />}
              {m.id === "pedal" && <rect x="-14" y="-5" width="28" height="10" rx="4" fill={cor} />}
              {m.id === "sino" && (
                <g>
                  {ligado && !reduz && <animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="1.2s" repeatCount="indefinite" />}
                  <path d="M-11 8 Q-11 -10 0 -13 Q11 -10 11 8 Z" fill={cor} />
                  <circle cy="11" r="3" fill={cor} />
                </g>
              )}
              {m.id === "comporta" && (
                <g fill={cor}>
                  <rect x="-14" y="-12" width="7" height="24" rx="2" />
                  <rect x="7" y="-12" width="7" height="24" rx="2" />
                  <rect x="-5" y="-3" width="10" height="6" rx="2" opacity="0.6" />
                </g>
              )}
            </g>
          );
        })}
        {/* água com profundidade, bolhas e brilho de superfície */}
        <path d={ondaPath(topo, fase, true)} fill="url(#agua)" />
        <g clipPath="url(#clipAgua)">
          {[60, 120, 200, 250, 300].map((x, k) => (
            <circle key={x} cx={x} cy="510" r={2 + (k % 3)} fill="none" stroke="#F2E6D6" strokeOpacity="0.4">
              {!reduz && <animate attributeName="cy" values="515;40" dur={`${6 + k * 1.3}s`} begin={`${k * 0.9}s`} repeatCount="indefinite" />}
            </circle>
          ))}
        </g>
        <path d={ondaPath(topo, fase, false)} fill="none" stroke="#F2E6D6" strokeWidth="2" opacity="0.75" />
        <path d={ondaPath(topo + 6, fase + 1.5, false)} fill="none" stroke="#F2E6D6" strokeWidth="1" opacity="0.25" />
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
