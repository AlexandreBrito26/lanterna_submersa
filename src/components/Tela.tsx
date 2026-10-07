import type { ReactNode } from "react";
import { useGame } from "../store/useGame";

// Área de jogo 9:16 com um "grade" de arte próprio de cada fase (ver .grade-* em index.css)
export default function Tela({ children }: { children: ReactNode }) {
  const fase = useGame((s) => s.current);
  return (
    <div className="tela-area" style={{ containerType: "size" }}>
      <div
        className="moldura mx-auto overflow-hidden"
        style={{ width: "min(100cqw, calc(100cqh * 9 / 16))", aspectRatio: "9 / 16" }}
      >
        {children}
        <div aria-hidden className={`grade-fase pointer-events-none absolute inset-0 grade-${fase ?? "cais"}`} />
      </div>
    </div>
  );
}
