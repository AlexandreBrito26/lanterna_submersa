import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Partículas que sobem ao fundo da tela (poeira, bolhas, faíscas de luz)
export default function Particulas({ quantidade = 14, cor = "#F2E6D6" }: { quantidade?: number; cor?: string }) {
  const reduz = useReducedMotion();
  const itens = useMemo(
    () => Array.from({ length: quantidade }, (_, i) => ({
      x: (i * 37 + 11) % 100,
      duracao: 9 + ((i * 7) % 9),
      atraso: -((i * 5) % 10),
      tamanho: 2 + (i % 3),
    })),
    [quantidade]
  );
  if (reduz) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {itens.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, bottom: -10, width: p.tamanho, height: p.tamanho, background: cor, opacity: 0.35 }}
          animate={{ y: "-110vh" }}
          transition={{ duration: p.duracao, repeat: Infinity, ease: "linear", delay: p.atraso }}
        />
      ))}
    </div>
  );
}
