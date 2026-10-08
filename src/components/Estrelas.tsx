import { motion } from "framer-motion";
import { Star } from "lucide-react";

// animado: as estrelas acendem uma a uma, com um pequeno salto
export default function Estrelas({ valor, tamanho = 16, animado = false }: { valor: number; tamanho?: number; animado?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${valor} de 3 estrelas`}>
      {[1, 2, 3].map((n) => {
        const acesa = n <= valor;
        const estrela = (
          <Star size={tamanho} className={acesa ? "fill-lanterna text-lanterna" : "text-espuma/25"} aria-hidden />
        );
        if (!animado) return <span key={n}>{estrela}</span>;
        return (
          <motion.span
            key={n}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: acesa ? [0.4, 1.3, 1] : 1, opacity: 1 }}
            transition={{ delay: 0.25 + (n - 1) * 0.35, duration: 0.45, ease: "easeOut" }}
            className="inline-block"
          >
            {estrela}
          </motion.span>
        );
      })}
    </span>
  );
}
