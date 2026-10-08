import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../game/audio";
import type { CutsceneInfo } from "../game/cutscenes";

const lombadas = ["#14465A", "#E07A5F", "#3D8B7A", "#FFBF00", "#F2E6D6"];

// Cais avançado: farol com feixe que gira, ondas que se movem, estrelas, lâmpada que treme quando apaga
// e a lanterna na mão do jogador nas cenas finais. `i` é o índice da cena.
function Cais({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const estrelas = [[40, 40], [90, 70], [260, 50], [310, 90], [150, 30], [220, 110], [60, 130], [330, 150]];
  const lanterna = i >= 4;
  return (
    <>
      {/* céu e estrelas que piscam */}
      {estrelas.map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="1.6" fill="#F2E6D6" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2.5 + (k % 3), repeat: Infinity, delay: k * 0.4 }} />
      ))}
      {/* feixe do farol que gira devagar */}
      <motion.g style={{ transformOrigin: "180px 170px" }} animate={{ rotate: [0, 360] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }}>
        <motion.polygon points="180,170 40,60 40,110" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.12 }} transition={{ duration: 1.2 }} />
      </motion.g>
      {/* halo da lâmpada */}
      <motion.circle cx="180" cy="150" r="120" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.18 }} transition={{ duration: 1.2 }} />
      {/* torre do farol */}
      <path d="M168 190 L192 190 L188 120 L172 120 Z" fill="#14465A" />
      <rect x="170" y="112" width="20" height="10" fill="#1d5b74" />
      {/* lâmpada: treme quando quase apagada */}
      <motion.circle
        cx="180" cy="117" r="7" fill="#FFBF00"
        initial={false}
        animate={brilho < 0.5 && brilho > 0 ? { opacity: [0.2, 0.6, 0.1, 0.5] } : { opacity: 0.15 + brilho * 0.85 }}
        transition={brilho < 0.5 && brilho > 0 ? { duration: 0.9, repeat: Infinity } : { duration: 1.2 }}
      />
      {/* lanterna na mão do jogador (cenas finais) */}
      {lanterna && (
        <motion.g initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4 }}>
          <rect x="164" y="318" width="32" height="26" rx="4" fill="#14465A" />
          <circle cx="180" cy="331" r="7" fill={brilho > 0.5 ? "#FFBF00" : "#2b3d44"} />
        </motion.g>
      )}
      {/* ondas em movimento */}
      {[0, 1].map((k) => (
        <motion.path
          key={k}
          d="M-60 300 Q -30 285 0 300 T 60 300 T 120 300 T 180 300 T 240 300 T 300 300 T 360 300 T 420 300 V 420 H -60 Z"
          fill={k ? "#0f3d4d" : "#14465A"}
          opacity={0.7 - k * 0.2}
          animate={{ x: [0, -60] }}
          transition={{ duration: 4 + k * 2, repeat: Infinity, ease: "linear" }}
        />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Biblioteca avançada: páginas que flutuam para cima, tinta que escorre e a estante que treme com a cheia
function BibliotecaAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const paginas = [[60, 220], [140, 260], [230, 200], [300, 250], [110, 150]];
  return (
    <>
      <motion.circle cx="180" cy="40" r="90" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {[0, 1, 2].map((r) => (
        <motion.rect key={r} x="16" y={110 + r * 85} width="328" height="5" fill="#14465A" animate={{ x: [16, 19, 16] }} transition={{ duration: 0.6 + r * 0.2, repeat: Infinity, delay: r * 0.3 }} />
      ))}
      {[0, 1, 2].map((r) =>
        Array.from({ length: 12 }, (_, k) => {
          const h = 38 + ((k * 7 + r * 5) % 14);
          return <rect key={`${r}-${k}`} x={24 + k * 26} y={110 + r * 85 - h} width="20" height={h} fill={["#E07A5F", "#3D8B7A", "#F2E6D6", "#FFBF00"][(k + r) % 4]} opacity="0.75" />;
        })
      )}
      {/* páginas soltas que sobem, girando */}
      {paginas.map(([x, y], k) => (
        <motion.rect
          key={k} x={x} y={y} width="16" height="22" rx="2" fill="#F2E6D6"
          initial={false}
          animate={{ y: [y, y - 120], rotate: [0, k % 2 ? 25 : -25], opacity: [0, brilho * 0.8, 0] }}
          transition={{ duration: 6 + k, repeat: Infinity, delay: k * 1.1, ease: "easeOut" }}
        />
      ))}
      {/* tinta que escorre */}
      {[80, 190, 300].map((x, k) => (
        <motion.line key={x} x1={x} y1="0" x2={x} y2="80" stroke="#14465A" strokeWidth="2" strokeLinecap="round" initial={false} animate={{ y2: [0, 60 + brilho * 20] }} transition={{ duration: 3 + k, repeat: Infinity, repeatType: "reverse" }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Jardins avançados: galhos de coral que balançam, enguias que cruzam e o brilho que as atrai
function JardinsAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const galhos = [[40, 200], [95, 260], [150, 220], [215, 270], [270, 210], [320, 250]];
  return (
    <>
      <motion.circle cx="180" cy="350" r="150" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {galhos.map(([x, y], k) => (
        <motion.rect
          key={x} x={x - 9} y={y} width="18" height={400 - y} rx="9" fill="#3D8B7A" opacity="0.75"
          style={{ transformOrigin: `${x}px 400px` }}
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 4 + (k % 3), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.circle cx="180" cy="170" fill="none" stroke="#E07A5F" strokeWidth="1.5" initial={false} animate={{ r: [25 + brilho * 70, 30 + brilho * 70, 25 + brilho * 70], opacity: 0.15 + brilho * 0.3 }} transition={{ r: { duration: 2, repeat: Infinity }, opacity: { duration: 1.2 } }} />
      <ellipse cx="180" cy="170" rx="30" ry="9" fill="#E07A5F" />
      {/* enguias que cruzam a cena */}
      {[0, 1].map((k) => (
        <motion.path
          key={k} d="M-40 0 Q -20 -10 0 0 T 40 0 T 80 0" fill="none" stroke="#14465A" strokeWidth="6" strokeLinecap="round" opacity="0.8"
          initial={false}
          animate={{ x: [-40, 400], y: [260 + k * 60, 240 + k * 60] }}
          transition={{ duration: 7 + k * 2, repeat: Infinity, ease: "linear", delay: k * 2.5 }}
        />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Recife avançado: fragmentos de luz que flutuam entre ruínas, bolhas que sobem e um farol partido
function RecifeAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const fragmentos = [[70, 200], [150, 160], [230, 220], [290, 150], [120, 260]];
  return (
    <>
      <motion.circle cx="180" cy="300" r="140" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {/* ruína de farol partido */}
      <rect x="165" y="230" width="30" height="120" fill="#5a3d33" />
      <polygon points="165,230 180,205 195,230" fill="#5a3d33" />
      {fragmentos.map(([x, y], k) => (
        <motion.circle
          key={k} cx={x} cy={y} r="5" fill="#FFBF00"
          initial={false}
          animate={{ y: [y, y - 18, y], opacity: [0.2, brilho, 0.2] }}
          transition={{ duration: 3 + k * 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* bolhas subindo */}
      {[0, 1, 2, 3].map((k) => (
        <motion.circle
          key={k} cx={100 + k * 55} cy="380" r={3 + k} fill="none" stroke="#F2E6D6" strokeWidth="1"
          animate={{ cy: [380, 60], opacity: [0, 0.5, 0] }}
          transition={{ duration: 6 + k, repeat: Infinity, delay: k * 1.4 }}
        />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Catedral avançada: arcos que pulsam, lua que puxa a maré e um altar que brilha no ritmo das ondas
function CatedralAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="180" cy="90" r="46" fill="#F2E6D6" initial={false} animate={{ opacity: 0.2 + brilho * 0.4 }} transition={{ duration: 1.2 }} />
      <motion.circle cx="180" cy="90" r="60" fill="none" stroke="#F2E6D6" strokeWidth="1" animate={{ r: [60, 66, 60], opacity: [0.2, 0.05, 0.2] }} transition={{ duration: 5, repeat: Infinity }} />
      {/* arcos da catedral */}
      {[60, 180, 300].map((x, k) => (
        <motion.path
          key={x} d={`M${x - 40} 390 L${x - 40} 230 Q${x} 150 ${x + 40} 230 L${x + 40} 390`}
          fill="none" stroke="#3D8B7A" strokeWidth="6" opacity="0.7"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3 + k, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* altar com brilho pulsante */}
      <motion.rect x="150" y="300" width="60" height="18" rx="3" fill="#E07A5F" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2.2, repeat: Infinity }} />
      {/* inscrição: linhas que surgem na cena da maré */}
      {[0, 1, 2].map((k) => (
        <motion.line key={k} x1="150" y1={330 + k * 10} x2="210" y2={330 + k * 10} stroke="#FFBF00" strokeWidth="2" initial={false} animate={{ opacity: i >= 4 ? 0.6 : 0.1 }} transition={{ duration: 1.2, delay: k * 0.2 }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Abismo avançado: correntes que descem, destroços que giram e a âncora que resiste
function AbismoAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[60, 150, 240, 320].map((x, k) => (
        <motion.line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#3D8B7A" strokeWidth="2" strokeDasharray="10 14" opacity="0.4"
          animate={{ strokeDashoffset: [0, -48] }} transition={{ duration: 1.2 + k * 0.3, repeat: Infinity, ease: "linear" }} />
      ))}
      {[[90, 120], [210, 170], [270, 90]].map(([x, y], k) => (
        <motion.rect key={k} x={x} y={y} width="20" height="14" fill="#5a3d33" opacity="0.8"
          animate={{ rotate: [0, k % 2 ? 360 : -360], y: [y, y + 10, y] }}
          transition={{ rotate: { duration: 8 + k, repeat: Infinity, ease: "linear" }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
          style={{ transformOrigin: `${x + 10}px ${y + 7}px` }} />
      ))}
      {/* âncora */}
      <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "180px 200px" }}>
        <line x1="180" y1="200" x2="180" y2="320" stroke="#F2E6D6" strokeWidth="3" />
        <path d="M160 320 Q180 340 200 320" fill="none" stroke="#F2E6D6" strokeWidth="3" />
      </motion.g>
      <motion.circle cx="180" cy="190" r={24 + brilho * 4} fill="#E07A5F" initial={false} animate={{ opacity: 0.1 + brilho * 0.4 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

// Coração avançado: núcleo que pulsa, anéis de vidro e vozes de luz que se acendem a cada cena
function CoracaoAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const vozes = [[70, 150], [130, 110], [230, 110], [290, 150]];
  return (
    <>
      <motion.circle cx="180" cy="180" r="60" fill="#E07A5F" initial={false} animate={{ opacity: 0.2 + brilho * 0.4, scale: [1, 1.08, 1] }} transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }} style={{ transformOrigin: "180px 180px" }} />
      <motion.circle cx="180" cy="180" r="22" fill="#FFBF00" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
      {[0, 1, 2].map((k) => (
        <motion.circle key={k} cx="180" cy="180" fill="none" stroke="#7FE0D0" strokeWidth="1.2"
          animate={{ r: [30, 110], opacity: [0.5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: k * 1.3, ease: "easeOut" }} />
      ))}
      {/* as quatro vozes: acendem conforme a história avança */}
      {vozes.map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="9" fill="#F2E6D6" initial={false}
          animate={{ opacity: i >= k ? 0.9 : 0.1, scale: i >= k ? [1, 1.25, 1] : 1 }}
          transition={{ opacity: { duration: 0.8 }, scale: { duration: 1.6, repeat: i >= k ? Infinity : 0 } }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Mangue avançado: raízes que balançam, bolhas de lodo que sobem e a boia que pisca
function ManguAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const raizes = [30, 90, 150, 220, 290, 340];
  return (
    <>
      <motion.circle cx="250" cy="90" r="60" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.2 }} transition={{ duration: 1.2 }} />
      {raizes.map((x, k) => (
        <motion.rect key={x} x={x - 4} width="8" fill="#3D8B7A" opacity="0.7"
          initial={false} animate={{ y: 120 + (k % 3) * 20, height: 280 - (k % 3) * 20, rotate: [-2, 2, -2] }}
          style={{ transformOrigin: `${x}px 400px` }}
          transition={{ rotate: { duration: 3 + k * 0.4, repeat: Infinity, ease: "easeInOut" }, y: { duration: 1.2 }, height: { duration: 1.2 } }} />
      ))}
      <ellipse cx="180" cy="330" rx="170" ry="28" fill="#5a3d2b" opacity="0.8" />
      {[0, 1, 2].map((k) => (
        <motion.circle key={k} cx={120 + k * 50} cy="340" r="4" fill="none" stroke="#7FE0D0" strokeWidth="1"
          animate={{ cy: [340, 200], opacity: [0, 0.6, 0] }} transition={{ duration: 4 + k, repeat: Infinity, delay: k * 1.2 }} />
      ))}
      {/* boia que pisca; mais acesa quando a história avança */}
      <motion.circle cx="250" cy="90" r="9" fill="#FFBF00" initial={false} animate={{ opacity: [0.3 + brilho * 0.4, 0.9, 0.3 + brilho * 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <Agua agua={agua} />
    </>
  );
}

// Teatro avançado: o barco se desenha no lençol conforme as lâmpadas acendem
function TeatroAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const lampadas = [[100, 60], [260, 60], [180, 30]];
  return (
    <>
      <rect x="60" y="60" width="240" height="200" rx="4" fill="#F2E6D6" opacity="0.12" />
      <motion.path d="M120 200 L240 200 L225 230 L135 230 Z M180 200 L180 120 L225 200 Z" fill="#F2E6D6"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: brilho, opacity: 0.2 + brilho * 0.5 }} transition={{ duration: 1.6 }} />
      {lampadas.map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="10" fill="#FFBF00" initial={false}
          animate={{ opacity: 0.2 + brilho * 0.8, scale: [1, 1.12, 1] }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: 2 + k * 0.3, repeat: Infinity } }} />
      ))}
      {/* sombra que passa pelo lençol quando a cheia chega */}
      <motion.ellipse cx="180" cy="160" rx="60" ry="10" fill="#07050f" initial={false} animate={{ x: i >= 2 ? [0, 30, 0] : 0, opacity: i >= 2 ? 0.5 : 0 }} transition={{ duration: 4, repeat: Infinity }} />
      <Agua agua={agua} />
    </>
  );
}

// Casa das Bombas avançada: pistões que sobem e descem, rodas de válvula girando e vapor
function BombasAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[70, 180, 290].map((x, k) => (
        <g key={x}>
          <motion.rect x={x - 10} width="20" height="70" fill="#14465A" animate={{ y: [120, 100, 120] }} transition={{ duration: 1.6 + k * 0.3, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx={x} cy="230" r="16" fill="none" stroke="#FFBF00" strokeWidth="3" strokeDasharray="6 6" animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: `${x}px 230px` }} />
        </g>
      ))}
      <rect x="40" y="290" width="280" height="8" fill="#3D8B7A" opacity="0.7" />
      {[0, 1, 2].map((k) => (
        <motion.circle key={k} cx={100 + k * 80} cy="280" r="6" fill="#F2E6D6" opacity="0"
          animate={{ cy: [280, 150], opacity: [0, 0.35, 0], r: [6, 14] }} transition={{ duration: 3, repeat: Infinity, delay: k * 1.0 }} />
      ))}
      <motion.circle cx="180" cy="60" r="8" fill="#FFBF00" initial={false} animate={{ opacity: 0.2 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

// Rede avançada: a rede balança e peixes passam por ela
function RedeAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.g animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "180px 130px" }}>
        {[60, 100, 140, 180, 220, 260, 300].map((x) => (
          <line key={x} x1={x} y1="130" x2={x} y2="330" stroke="#E07A5F" strokeWidth="1" opacity={0.3 + brilho * 0.4} />
        ))}
        {[150, 190, 230, 270, 310].map((y) => (
          <line key={y} x1="50" y1={y} x2="330" y2={y} stroke="#E07A5F" strokeWidth="1" opacity={0.3 + brilho * 0.4} />
        ))}
      </motion.g>
      {[0, 1].map((k) => (
        <motion.ellipse key={k} cx="0" cy={210 + k * 60} rx="14" ry="8" fill="#E07A5F"
          animate={{ cx: [-20, 380], opacity: [0, 0.9, 0] }} transition={{ duration: 8 + k * 2, repeat: Infinity, delay: k * 3, ease: "linear" }} />
      ))}
      {i >= 3 && <motion.circle cx="180" cy="250" r="6" fill="#FFBF00" initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />}
      <Agua agua={agua} />
    </>
  );
}

// Maré avançada: comportas que abrem e fecham, e ondas que sobem e descem em tempos diferentes
function MareAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const portas = [60, 150, 240, 300];
  return (
    <>
      {portas.map((x, k) => (
        <motion.rect key={x} x={x - 14} width="28" y="150" height="90" rx="4" fill="#3D8B7A"
          style={{ transformOrigin: `${x}px 150px` }}
          animate={{ scaleY: k % 2 ? [1, 0.4, 1] : [0.4, 1, 0.4] }}
          transition={{ duration: 3 + k * 0.4, repeat: Infinity, ease: "easeInOut" }} />
      ))}
      <motion.circle cx="180" cy="90" r="22" fill="#FFBF00" initial={false} animate={{ opacity: 0.2 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      {[0, 1].map((k) => (
        <motion.path key={k} d="M-60 280 Q -30 265 0 280 T 60 280 T 120 280 T 180 280 T 240 280 T 300 280 T 360 280 T 420 280 V 420 H -60 Z"
          fill={k ? "#0f3d4d" : "#14465A"} opacity={0.6 - k * 0.2}
          animate={{ x: k ? [0, 40] : [0, -40], y: [0, -6, 0] }}
          transition={{ duration: 5 + k * 2, repeat: Infinity, ease: "easeInOut" }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Vento avançado: velas que balançam, linhas de vento que passam e o sol que nasce
function VentoAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="300" cy="80" r={20 + brilho * 10} fill="#FFBF00" initial={false} animate={{ opacity: 0.15 + brilho * 0.6 }} transition={{ duration: 1.5 }} />
      {[120, 170, 220, 270].map((y, k) => (
        <motion.path key={y} d={`M-40 ${y} Q 60 ${y - 25} 140 ${y} T 320 ${y}`} fill="none" stroke="#F2E6D6" strokeWidth="2"
          animate={{ x: [0, 60], opacity: [0.1, 0.5 + brilho * 0.3, 0.1] }}
          transition={{ duration: 4 + k, repeat: Infinity, ease: "linear", delay: k * 0.5 }} />
      ))}
      {/* vela principal, balançando */}
      <motion.path d="M180 60 L180 150 L230 150 Z" fill="#F2E6D6"
        style={{ transformOrigin: "180px 150px" }}
        animate={{ scaleX: [1, 0.85, 1], skewX: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
      <line x1="180" y1="60" x2="180" y2="170" stroke="#14465A" strokeWidth="3" />
      <Agua agua={agua} />
    </>
  );
}

// Escuta avançada: varredura de sonar que gira e ecos que voltam em anéis
function EcoAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const ecos = [[120, 120], [250, 110], [200, 230]];
  return (
    <>
      {[40, 80, 120].map((r, k) => (
        <motion.circle key={r} cx="180" cy="170" r={r} fill="none" stroke="#FFBF00" strokeWidth="1.5" initial={false} animate={{ opacity: brilho * (0.5 - k * 0.12) }} transition={{ duration: 1.2 }} />
      ))}
      {/* feixe de varredura que gira */}
      <motion.g style={{ transformOrigin: "180px 170px" }} animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
        <polygon points="180,170 180,60 200,60" fill="#7FE0D0" opacity={0.08 + brilho * 0.12} />
      </motion.g>
      {/* ecos de faróis distantes que piscam e somem */}
      {ecos.map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="4" fill="#7FE0D0"
          animate={{ opacity: [0, 0.9, 0], r: [4, 9, 4] }} transition={{ duration: 3 + k, repeat: Infinity, delay: k * 1.1 }} />
      ))}
      <motion.circle cx="180" cy="170" r="10" fill="#FFBF00" initial={false} animate={{ opacity: 0.2 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

// Cardume avançado: peixes que nadam em círculo, com a cauda ondulando; o cardume muda de direção na cena final
function CardumeAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const peixes = [0, 1, 2, 3, 4, 5];
  return (
    <>
      {peixes.map((k) => (
        <motion.g key={k} animate={{ x: [0, 60, 0], y: [0, -20, 0] }} transition={{ duration: 5 + k * 0.3, repeat: Infinity, ease: "easeInOut", delay: k * 0.2 }}>
          <motion.ellipse cx={60 + k * 40} cy={150 + (k % 2) * 40} rx="14" ry="7" fill="#7FE0D0"
            initial={false} animate={{ opacity: 0.2 + brilho * 0.8, scaleX: i >= 4 ? [1, -1, 1] : 1 }}
            transition={{ opacity: { duration: 1.2 }, scaleX: { duration: 1.2, repeat: Infinity } }} />
          <motion.path d={`M${40 + k * 40} ${150 + (k % 2) * 40} l -10 -6 l 0 12 z`} fill="#7FE0D0" animate={{ scaleY: [1, 0.5, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ transformOrigin: `${40 + k * 40}px ${150 + (k % 2) * 40}px` }} />
        </motion.g>
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Neblina avançada: camadas de névoa que deslizam e o farol aparece aos poucos, por trás
function NeblinaAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="180" cy="180" r="10" fill="#FFBF00" initial={false} animate={{ opacity: 0.1 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      <motion.circle cx="180" cy="180" r="60" fill="#FFBF00" initial={false} animate={{ opacity: brilho * 0.15 }} transition={{ duration: 1.2 }} />
      {[60, 110, 160, 210, 260].map((y, k) => (
        <motion.rect key={y} x="40" width="280" height="14" rx="7" fill="#F2E6D6"
          initial={false}
          animate={{ x: [40, 52, 40], opacity: [0.08 + brilho * 0.25, 0.14 + brilho * 0.2, 0.08 + brilho * 0.25] }}
          transition={{ x: { duration: 3 + k * 0.4, repeat: Infinity }, opacity: { duration: 3 + k * 0.4, repeat: Infinity } }}
          style={{ y: y - 180 + (i > 2 ? k * 2 : 0) }} />
      ))}
      {/* migalhas de casas visitadas que aparecem aos poucos */}
      {[[120, 220], [150, 240], [180, 230], [210, 250], [240, 220]].map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="2.5" fill="#7FE0D0" initial={{ opacity: 0 }} animate={{ opacity: i >= k % 4 + 1 ? 0.7 : 0 }} transition={{ duration: 1 }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Coral avançado: ramos que crescem do chão, bolhas que sobem e um núcleo que respira
function CoralAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="180" cy="120" r="18" fill="#7FE0D0" initial={false} animate={{ opacity: 0.1 + brilho * 0.5, scale: [1, 1.1, 1] }} transition={{ opacity: { duration: 1.2 }, scale: { duration: 3, repeat: Infinity } }} style={{ transformOrigin: "180px 120px" }} />
      {[[90, 330, 60], [180, 330, 100], [270, 330, 70]].map(([x, y, h], k) => (
        <motion.path key={k}
          d={`M${x} ${y} Q ${x + 14} ${y - h / 2} ${x} ${y - h}`}
          fill="none" stroke="#7FE0D0" strokeWidth="6" strokeLinecap="round"
          style={{ transformOrigin: `${x}px ${y}px` }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0.9, 1, 0.9], opacity: 0.2 + brilho * 0.8 }}
          transition={{ scaleY: { duration: 4 + k, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1.2 } }} />
      ))}
      {[0, 1, 2].map((k) => (
        <motion.circle key={k} cx={80 + k * 100} cy="340" r="3" fill="none" stroke="#F2E6D6" strokeWidth="1"
          animate={{ cy: [340, 150], opacity: [0, 0.5, 0] }} transition={{ duration: 5 + k, repeat: Infinity, delay: k * 1.5 }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Portas de ferro avançadas: portões que deslizam para cima quando as alavancas são puxadas
function AlavancasAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[60, 150, 240, 300].map((x, k) => (
        <motion.rect key={x} x={x - 12} width="24" y="120" height="150" fill="#4a3424" stroke="#FFBF00" strokeWidth="2"
          initial={false}
          animate={{ y: i >= k ? 80 : 120, opacity: 0.3 + brilho * 0.5 }}
          transition={{ y: { duration: 1.4, delay: k * 0.2 }, opacity: { duration: 1.2 } }} />
      ))}
      {[90, 210].map((x, k) => (
        <motion.g key={x} style={{ transformOrigin: `${x}px 200px` }} animate={{ rotate: [-12, 12, -12] }} transition={{ duration: 2.5 + k, repeat: Infinity, ease: "easeInOut" }}>
          <rect x={x} y="60" width="4" height="60" fill="#FFBF00" />
          <circle cx={x + 2} cy="58" r="6" fill="#FFBF00" />
        </motion.g>
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Conchas gêmeas avançadas: a caixa de conchas gira e as conchas se viram umas para as outras
function MemoriaAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <motion.rect key={`${r}-${c}`} x={70 + c * 58} y={100 + r * 62} width="46" height="46" rx="8" fill="#F2E6D6"
            style={{ transformOrigin: `${70 + c * 58 + 23}px ${100 + r * 62 + 23}px` }}
            initial={false}
            animate={{ rotateY: i >= 2 && (r + c) % 2 === 0 ? 180 : 0, opacity: 0.1 + brilho * (((r + c) % 2) ? 0.5 : 0.25) }}
            transition={{ rotateY: { duration: 0.8, delay: (r * 4 + c) * 0.1 }, opacity: { duration: 1.2 } }} />
        ))
      )}
      <Agua agua={agua} />
    </>
  );
}

// Colar de pérolas avançado: pérolas que balançam num fio curvo e brilham em sequência
function PerolasAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.path d="M40 140 Q 180 200 320 140" fill="none" stroke="#FFBF00" strokeWidth="1.5" opacity={0.4 + brilho * 0.3} />
      {Array.from({ length: 7 }, (_, k) => {
        const x = 60 + k * 40, y = 140 + Math.sin((k / 6) * Math.PI) * 40;
        return (
          <motion.circle key={k} cx={x} cy={y} r="11" fill="#F2E6D6"
            initial={false}
            animate={{ cy: [y, y + 4, y], opacity: 0.2 + brilho * 0.8 }}
            transition={{ cy: { duration: 2.5, repeat: Infinity, delay: k * 0.2, ease: "easeInOut" }, opacity: { duration: 1.2 } }} />
        );
      })}
      <motion.circle cx="180" cy="210" r="6" fill="#FFBF00" animate={{ opacity: [0.1, 0.9, 0.1] }} transition={{ duration: 2, repeat: Infinity }} />
      <Agua agua={agua} />
    </>
  );
}

// Correnteza avançada: setas que giram e um barco que segue a corrente pelo canal
function SetasAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[[120, 120, 0], [240, 120, 90], [120, 240, 270], [240, 240, 180]].map(([x, y, r], k) => (
        <motion.path key={k}
          d={`M${x - 14} ${y} L${x + 14} ${y} M${x + 6} ${y - 7} L${x + 14} ${y} L${x + 6} ${y + 7}`}
          transform={`rotate(${r} ${x} ${y})`} fill="none" stroke="#7FE0D0" strokeWidth="4" strokeLinecap="round"
          initial={false}
          animate={{ opacity: 0.2 + brilho * 0.8, rotate: i >= 3 ? [r, r + 90] : r }}
          style={{ transformOrigin: `${x}px ${y}px` }}
          transition={{ opacity: { duration: 1.2 }, rotate: { duration: 1.4, delay: k * 0.2 } }} />
      ))}
      <motion.path d="M-20 300 Q 90 280 180 300 T 380 300" fill="none" stroke="#7FE0D0" strokeWidth="2" opacity="0.4"
        animate={{ strokeDashoffset: [0, -60] }} strokeDasharray="12 12" transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
      <motion.circle cx="180" cy="180" r="12" fill="#FFBF00" initial={false} animate={{ opacity: 0.1 + brilho * 0.8 }} transition={{ duration: 1.2 }} />
      <Agua agua={agua} />
    </>
  );
}

// Pedras que caem avançadas: a fileira de pedras tomba em cascata, uma após a outra
function DominosAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {Array.from({ length: 7 }, (_, k) => (
        <motion.rect key={k} x={40 + k * 42} y={230} width="16" height="60" rx="3" fill="#6e4f33"
          style={{ transformOrigin: `${40 + k * 42}px 290px` }}
          initial={false}
          animate={{ rotate: i >= 2 ? 70 : (k % 2 ? 0 : 25), opacity: 0.2 + brilho * 0.8 }}
          transition={{ rotate: { duration: 0.6, delay: 0.3 + k * 0.18 }, opacity: { duration: 1.2 } }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Sopa das marés avançada: letras que surgem na água, uma a uma
function PalavrasAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {["A", "B", "C", "D", "E", "F", "G"].map((c, k) => (
        <motion.text key={c} x={60 + (k % 4) * 50} y={150 + Math.floor(k / 4) * 60} fontSize="28" fill="#FFBF00" textAnchor="middle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: i >= k % 3 ? 0.3 + brilho * 0.7 : 0.1, y: [10, 0] }}
          transition={{ opacity: { duration: 1.2 }, y: { duration: 1.2, delay: k * 0.15 } }}>
          {c}
        </motion.text>
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Apagar: mar escuro, luzes que se apagam uma a uma e névoa que desce
function ApagarAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  const luzes = [[70, 90], [150, 60], [230, 100], [300, 70]];
  return (
    <>
      {luzes.map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="5" fill="#FFBF00"
          animate={{ opacity: i >= k ? 0.03 : [0.2, 0.7, 0.2] }}
          transition={{ opacity: { duration: 1.5 }, default: { duration: 2 + k * 0.4, repeat: Infinity } }} />
      ))}
      {[0, 1, 2].map((k) => (
        <motion.rect key={k} x="-40" width="460" height="46" fill="#06121a" opacity={0.5 + k * 0.15}
          animate={{ y: [60 + k * 70, 90 + k * 70, 60 + k * 70] }}
          transition={{ duration: 6 + k, repeat: Infinity, ease: "easeInOut" }} />
      ))}
      <motion.circle cx="180" cy="170" r="10" fill="#FFBF00" initial={false} animate={{ opacity: 0.05 + brilho * 0.4 }} transition={{ duration: 1.5 }} />
      <Agua agua={agua} />
    </>
  );
}

// Acender: brasas que sobem e chamas que tremulam sobre a costa
function AcenderAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="180" cy="300" r="120" fill="#FF8C3C" initial={false} animate={{ opacity: 0.1 + brilho * 0.25 }} transition={{ duration: 1.2 }} />
      {[120, 180, 240].map((x, k) => (
        <motion.path key={x} d={`M${x - 14} 300 Q ${x - 6} 250 ${x} 260 Q ${x + 10} 220 ${x + 4} 190 Q ${x + 14} 230 ${x + 14} 300 Z`}
          fill="#FFBF00" opacity={0.3 + brilho * 0.6} style={{ transformOrigin: `${x}px 300px` }}
          animate={{ scaleY: [1, 1.12, 0.95, 1], scaleX: [1, 0.94, 1.04, 1] }}
          transition={{ duration: 1.4 + k * 0.3, repeat: Infinity, ease: "easeInOut" }} />
      ))}
      {Array.from({ length: 8 }, (_, k) => (
        <motion.circle key={k} cx={100 + k * 22} cy="300" r="2" fill="#FFBF00"
          animate={{ cy: [300, 90], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + (k % 3), repeat: Infinity, delay: k * 0.5 }} />
      ))}
      <Agua agua={agua} />
    </>
  );
}

// Guardar: cofres que se fecham, engrenagens que giram e escudos que brilham
function GuardarAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      {[60, 180, 300].map((x, k) => (
        <g key={x}>
          <motion.rect x={x - 30} y="240" width="60" height="44" rx="4" fill="#6e4f33" stroke="#FFBF00" strokeWidth="2"
            initial={false} animate={{ scaleY: i >= k + 1 ? 0.9 : 1 }} style={{ transformOrigin: `${x}px 284px` }} transition={{ duration: 1 }} />
          <motion.circle cx={x} cy="262" r="5" fill="#FFBF00" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: k * 0.4 }} />
        </g>
      ))}
      <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "180px 150px" }}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x="176" y="110" width="8" height="18" fill="#3D8B7A" opacity="0.7" transform={`rotate(${k * 60} 180 150)`} />
        ))}
      </motion.g>
      <motion.circle cx="180" cy="150" r={50 + brilho * 20} fill="none" stroke="#7FE0D0" strokeWidth="1" animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 3, repeat: Infinity }} />
      <Agua agua={agua} />
    </>
  );
}

// Renascer: raízes que crescem, brotos que se abrem e um sol que nasce atrás da costa
function RenascerAv({ agua, brilho, i }: { agua: number; brilho: number; i: number }) {
  return (
    <>
      <motion.circle cx="180" cy="150" r={70 + brilho * 30} fill="#FFE7A0" initial={false} animate={{ opacity: 0.1 + brilho * 0.25 }} transition={{ duration: 1.5 }} />
      {[90, 180, 270].map((x, k) => (
        <motion.path key={x} d={`M${x} 390 Q ${x + (k % 2 ? 12 : -12)} 300 ${x} 210 Q ${x - 16} 180 ${x - 6} 150`}
          fill="none" stroke="#8FB8A0" strokeWidth="5" strokeLinecap="round" opacity={0.4 + brilho * 0.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: i >= k ? 1 : 0.3 }} transition={{ duration: 2 }} />
      ))}
      {[[90, 150], [180, 130], [270, 150]].map(([x, y], k) => (
        <motion.circle key={k} cx={x} cy={y} r="6" fill="#8FB8A0" animate={{ r: [4, 8, 4], opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity, delay: k * 0.6 }} />
      ))}
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

// Cor de destaque por ato: dourado (Ato I), alga (Ato II) e coral (Ato III)
const destaque: Record<number, string> = { 1: "#FFBF00", 2: "#7FE0D0", 3: "#E07A5F", 4: "#8FB8A0", 5: "#F6E7B0" };

// Texto que se escreve letra por letra; tocar nele mostra tudo de uma vez
function Digitando({ texto, onFim }: { texto: string; onFim: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => setN((v) => Math.min(v + 1, texto.length)), 26);
    return () => window.clearInterval(id);
  }, [texto]);
  useEffect(() => {
    if (n >= texto.length && texto.length > 0) onFim();
  }, [n, texto]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{texto.slice(0, n)}<span className="inline-block w-[0.5ch] animate-pulse text-espuma/50">{n < texto.length ? "▍" : ""}</span></>;
}

// Bolhas que sobem ao fundo: posições fixas para não mudar a cada render
function Bolhas({ cor }: { cor: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }, (_, k) => {
        const x = (k * 37) % 100, tam = 3 + (k % 4) * 2, atraso = (k * 0.7) % 5, dur = 6 + (k % 5);
        return (
          <motion.span
            key={k}
            className="absolute bottom-0 rounded-full border"
            style={{ left: `${x}%`, width: tam, height: tam, borderColor: cor, opacity: 0 }}
            animate={{ y: [0, -520], opacity: [0, 0.45, 0] }}
            transition={{ duration: dur, delay: atraso, repeat: Infinity, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export default function Cutscene({ info, aoFinal, ato = 1 }: { info: CutsceneInfo; aoFinal: () => void; ato?: number }) {
  const [i, setI] = useState(0);
  const [escrito, setEscrito] = useState(false);
  const cena = info.cenas[i];
  const ultima = i === info.cenas.length - 1;
  const cor = destaque[ato] ?? destaque[1];

  // Primeiro toque termina de escrever o texto; o segundo avança para a próxima cena
  const avancar = () => {
    if (!escrito) { setEscrito(true); return; }
    audio.sfx.interagir();
    if (ultima) { aoFinal(); return; }
    setEscrito(false);
    setI(i + 1);
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
    <div className="fixed inset-0 z-[5] flex flex-col overflow-hidden bg-abismo" onClick={avancar}>
      <Bolhas cor={cor} />
      <motion.div
        className="relative mx-auto mt-16 w-full max-w-sm"
        animate={{ scale: [1, 1.035, 1], y: [0, -4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
      <motion.div
        key={`clarao-${i}`}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] rounded-full"
        style={{ background: `radial-gradient(circle, ${cor}66, transparent 65%)` }}
        initial={{ opacity: 0.55, scale: 0.8 }}
        animate={{ opacity: 0, scale: 1.4 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
      <svg viewBox="0 0 360 400" className="relative mx-auto w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        {info.tipo === "cais" && <Cais agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "biblioteca" && <BibliotecaAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "catedral" && <CatedralAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "coracao" && <CoracaoAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "recife" && <RecifeAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "abismo" && <AbismoAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "jardins" && <JardinsAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "mangue" && <ManguAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "teatro" && <TeatroAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "bombas" && <BombasAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "rede" && <RedeAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "mare" && <MareAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "vento" && <VentoAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "eco" && <EcoAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "cardume" && <CardumeAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "coral" && <CoralAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "neblina" && <NeblinaAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "alavancas" && <AlavancasAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "memoria" && <MemoriaAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "perolas" && <PerolasAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "setas" && <SetasAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "dominos" && <DominosAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "palavras" && <PalavrasAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "apagar" && <ApagarAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "acender" && <AcenderAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "guardar" && <GuardarAv agua={cena.agua} brilho={cena.brilho} i={i} />}
        {info.tipo === "renascer" && <RenascerAv agua={cena.agua} brilho={cena.brilho} i={i} />}
      </svg>
      </motion.div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-10 pt-6">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-abismo via-abismo/80 to-transparent" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="min-h-[7rem] font-narrativa text-2xl leading-relaxed text-espuma"
            role="status"
            aria-label={cena.texto}
          >
            {escrito ? cena.texto : <Digitando texto={cena.texto} onFim={() => setEscrito(true)} />}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button onClick={(e) => { e.stopPropagation(); aoFinal(); }} className="text-sm text-espuma/60 underline">
            Pular
          </button>
          <div className="flex flex-col items-center gap-1" aria-label={`Cena ${i + 1} de ${info.cenas.length}`}>
            <div className="flex gap-1.5">
              {info.cenas.map((_, k) => (
                <span key={k} className="h-1.5 w-1.5 rounded-full transition-colors duration-500" style={{ background: k <= i ? cor : "rgba(242,230,214,0.2)" }} />
              ))}
            </div>
            <span className="text-xs text-espuma/50">{ultima ? info.entrada : "Toque ou pressione Espaço para continuar"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
