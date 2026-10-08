// Sem dependências: pode ser importado por qualquer componente sem puxar o Pixi para o bundle principal
export const reduzMovimento = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
