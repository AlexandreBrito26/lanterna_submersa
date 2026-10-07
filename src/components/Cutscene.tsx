import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../game/audio";
import type { CutsceneInfo } from "../game/cutscenes";

const lombadas = ["#14465A", "#E07A5F", "#3D8B7A", "#FFBF00", "#F2E6D6"];

function Cais({ agua, brilho }: { agua: number; brilho: number }) {
  return (
    <>
      <motion.circle cx="180" cy="150" r="120" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.18 }} transition={{ duration: 1.2 }} />
      <rect x="170" y="190" width="20" height="110" fill="#14465A" />
      <motion.circle cx="180" cy="170" r="22" fill="#FFBF00" initial={false} animate={{ opacity: 0.15 + brilho * 0.85 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

function Biblioteca({ agua, brilho }: { agua: number; brilho: number }) {
  return (
    <>
      <motion.circle cx="180" cy="40" r="90" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {[0, 1, 2].map((r) =>
        Array.from({ length: 12 }, (_, k) => {
          const h = 38 + ((k * 7 + r * 5) % 14);
          return (
            <rect key={`${r}-${k}`} x={24 + k * 26} y={110 + r * 85 - h} width="20" height={h} fill={lombadas[(k + r) % lombadas.length]} opacity="0.8" />
          );
        })
      )}
      {[0, 1, 2].map((r) => <rect key={r} x="16" y={110 + r * 85} width="328" height="5" fill="#14465A" />)}
      <Agua agua={agua} />
    </>
  );
}

function Jardins({ agua, brilho }: { agua: number; brilho: number }) {
  const galhos = [[40, 200], [95, 260], [150, 220], [215, 270], [270, 210], [320, 250]];
  return (
    <>
      <motion.circle cx="180" cy="350" r="150" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {galhos.map(([x, y]) => (
        <rect key={x} x={x - 9} y={y} width="18" height={400 - y} rx="9" fill="#3D8B7A" opacity="0.75" />
      ))}
      <motion.circle cx="180" cy="170" fill="none" stroke="#E07A5F" strokeWidth="1.5" initial={false} animate={{ r: 25 + brilho * 70, opacity: 0.15 + brilho * 0.3 }} transition={{ duration: 1.2 }} />
      <ellipse cx="180" cy="170" rx="30" ry="9" fill="#E07A5F" />
      <circle cx="180" cy="350" r="9" fill="#F2E6D6" />
      <Agua agua={agua} />
    </>
  );
}

function Recife({ agua, brilho }: { agua: number; brilho: number }) {
  return (
    <>
      <motion.circle cx="180" cy="300" r="140" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.14 }} transition={{ duration: 1.2 }} />
      <path d="M40 330 L140 330 L170 290 L60 290 Z" fill="#5a3d33" />
      <rect x="95" y="190" width="6" height="110" fill="#5a3d33" />
      <path d="M200 350 L320 350 L300 310 L220 310 Z" fill="#5a3d33" />
      {[[110, 280], [250, 300], [190, 340], [300, 250], [70, 230], [210, 220]].map(([x, y], k) => (
        <motion.path key={k} d={`M${x} ${y - 9} L${x + 7} ${y} L${x} ${y + 9} L${x - 7} ${y} Z`} fill="#FFBF00" initial={false} animate={{ opacity: 0.2 + brilho * 0.8 }} transition={{ duration: 1.2, delay: k * 0.1 }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

function Abismo({ agua, brilho }: { agua: number; brilho: number }) {
  return (
    <>
      <motion.circle cx="180" cy="320" r="120" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.12 }} transition={{ duration: 1.2 }} />
      {[[60, 60, 14], [150, 120, 10], [250, 80, 17], [310, 170, 9], [110, 210, 12], [220, 250, 15]].map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill="#5a3d33" stroke="#E07A5F" strokeWidth="2" opacity={0.85} />
      ))}
      {[70, 140, 210, 280].map((x) => <path key={x} d={`M${x} 40 Q${x + 25} 200 ${x} 380`} fill="none" stroke="#F2E6D6" strokeWidth="1" opacity="0.2" />)}
      <circle cx="180" cy="350" r="9" fill="#F2E6D6" />
      <Agua agua={agua} />
    </>
  );
}

function Catedral({ agua, brilho }: { agua: number; brilho: number }) {
  return (
    <>
      <path d="M40 400 V150 Q40 20 180 10 Q320 20 320 150 V400" fill="none" stroke="#14465A" strokeWidth="6" />
      <path d="M100 400 V200 Q100 110 180 95 Q260 110 260 200 V400" fill="none" stroke="#14465A" strokeWidth="4" />
      {[60, 190, 330].map((y) => (
        <motion.circle key={y} cx="180" cy={y} r="10" fill="#FFBF00" initial={false} animate={{ opacity: 0.2 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      ))}
      <Agua agua={agua} />
      <motion.line x1="0" x2="360" stroke="#F2E6D6" strokeWidth="2" opacity="0.6" initial={false} animate={{ y1: 400 - agua * 400, y2: 400 - agua * 400 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
    </>
  );
}

function Coracao({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const orbes = [["#E07A5F", 180, 90], ["#FFBF00", 290, 200], ["#3D8B7A", 180, 310], ["#F2E6D6", 70, 200]] as const;
  return (
    <>
      <motion.circle cx="180" cy="200" r="130" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.2 }} transition={{ duration: 1.2 }} />
      {orbes.map(([cor, x, y], k) => (
        <motion.circle key={cor} cx={x} cy={y} r="16" fill={cor} initial={false} animate={{ opacity: k <= i ? 1 : 0.2 }} transition={{ duration: 0.8 }} />
      ))}
      <motion.circle cx="180" cy="200" fill="#FFBF00" initial={false} animate={{ r: 24 + brilho * 14, opacity: 0.3 + brilho * 0.7 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

function Agua({ agua }: { agua: number }) {
  return (
    <motion.rect
      x="0" width="360" fill="#14465A" opacity="0.85" initial={false}
      animate={{ y: 400 - agua * 400, height: agua * 400 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    />
  );
}

export default function Cutscene({ info, aoFinal }: { info: CutsceneInfo; aoFinal: () => void }) {
  const [i, setI] = useState(0);
  const cena = info.cenas[i];
  const ultima = i === info.cenas.length - 1;

  const avancar = () => {
    audio.sfx.interagir();
    if (ultima) aoFinal(); else setI(i + 1);
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); avancar(); }
      if (e.key === "Escape") aoFinal();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  return (
    <div className="fixed inset-0 z-[5] flex flex-col bg-abismo" onClick={avancar}>
      <svg viewBox="0 0 360 400" className="mx-auto mt-16 w-full max-w-sm" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        {info.tipo === "cais" && <Cais agua={cena.agua} brilho={cena.brilho} />}
        {info.tipo === "biblioteca" && <Biblioteca agua={cena.agua} brilho={cena.brilho} />}
        {info.tipo === "catedral" && <Catedral agua={cena.agua} brilho={cena.brilho} />}
        {info.tipo === "coracao" && <Coracao agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "recife" && <Recife agua={cena.agua} brilho={cena.brilho} />}
        {info.tipo === "abismo" && <Abismo agua={cena.agua} brilho={cena.brilho} />}
        {info.tipo === "jardins" && <Jardins agua={cena.agua} brilho={cena.brilho} />}
      </svg>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-10 pt-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="font-narrativa text-2xl leading-relaxed text-espuma"
            role="status"
          >
            {cena.texto}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button onClick={(e) => { e.stopPropagation(); aoFinal(); }} className="text-sm text-espuma/60 underline">
            Pular
          </button>
          <span className="text-sm text-espuma/60">{ultima ? info.entrada : "Toque para continuar"}</span>
        </div>
      </div>
    </div>
  );
}
