import { motion, useReducedMotion } from "framer-motion";

// Faixa de ondas que corre devagar na base da tela
export default function Ondas() {
  const reduz = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-12 overflow-hidden">
      <motion.svg
        viewBox="0 0 720 40"
        preserveAspectRatio="none"
        className="h-full"
        style={{ width: "200%" }}
        animate={reduz ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        <path d="M0 20 Q45 5 90 20 T180 20 T270 20 T360 20 T450 20 T540 20 T630 20 T720 20 V40 H0 Z" fill="#14465A" opacity="0.55" />
      </motion.svg>
    </div>
  );
}
