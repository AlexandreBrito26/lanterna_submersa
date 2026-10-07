import { Star } from "lucide-react";

export default function Estrelas({ valor, tamanho = 16 }: { valor: number; tamanho?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${valor} de 3 estrelas`}>
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          size={tamanho}
          className={n <= valor ? "fill-lanterna text-lanterna" : "text-espuma/25"}
          aria-hidden
        />
      ))}
    </span>
  );
}
