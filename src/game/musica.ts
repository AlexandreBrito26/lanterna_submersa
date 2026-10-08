import { Howler } from "howler";

export type TemaMusical = "menu" | "cais" | "biblioteca" | "jardins" | "armazem" | "porao" | "recife" | "oficina" | "espelhos" | "catedral" | "sinos" | "observatorio" | "eclusa" | "torre" | "abismo" | "coracao" | "mangue" | "teatro" | "bombas" | "rede" | "mare" | "vento" | "eco" | "cardume" | "coral" | "neblina" | "alavancas" | "memoria" | "perolas" | "setas" | "dominos" | "palavras" | "final2" | "silencio" | "contagem" | "fio" | "pedra" | "breu" | "chama" | "vela" | "forja" | "molhada" | "brasa" | "arca" | "muralha" | "ganchos" | "fechadura" | "selos" | "escalada" | "encaixe" | "sementes" | "alternado" | "pontes" | "trilha" | "sombra" | "luar" | "ar" | "chaves" | "viciosa" | "vapor" | "aquecida" | "anel" | "fosforo" | "tanques" | "simetria" | "prateleiras" | "trilhos" | "torrecaixas" | "infinito";

type Tema = {
  raiz: number;            // frequência base em Hz
  escala: number[];        // semitons para as notas de sino
  acordes: number[][];     // acordes do pad, em semitons
  passo: [number, number]; // intervalo (s) entre sinos
  onda: OscillatorType;
  filtro: number;          // brilho do pad
  pulso?: "coracao" | "corrente" | "forja" | "badalo" | "gotejo" | "sonar" | "marulho" | "buzina" | "cristal" | "casco" | "lama" | "lencol" | "bombeo" | "pesca" | "mare" | "vento" | "eco" | "cardume" | "coral" | "neblina" | "ferro" | "caixinha" | "perolas" | "correnteza" | "pedras" | "sopa" | "silencio";
  grave?: boolean;         // drone sub-grave
};

const temas: Record<TemaMusical, Tema> = {
  menu:       { raiz: 196,   escala: [0, 3, 5, 7, 10, 12, 15], acordes: [[0, 7, 15], [-2, 5, 12], [-4, 3, 10], [-5, 2, 7]], passo: [2, 4.5], onda: "triangle", filtro: 800 },
  cais:       { raiz: 174.6, escala: [0, 2, 4, 7, 9, 12, 14],  acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 5], onda: "sine", filtro: 900 },
  biblioteca: { raiz: 164.8, escala: [0, 2, 3, 5, 7, 9, 10, 12], acordes: [[0, 7, 14], [-2, 5, 12], [3, 10, 15], [-4, 3, 10]], passo: [2, 4], onda: "triangle", filtro: 650 },
  jardins:    { raiz: 185,   escala: [0, 1, 5, 7, 8, 12],      acordes: [[0, 7, 13], [-2, 5, 11], [-4, 3, 8], [-6, 1, 7]], passo: [3, 6], onda: "sine", filtro: 520, grave: true },
  armazem:    { raiz: 138.6, escala: [0, 2, 3, 7, 8, 12],      acordes: [[0, 7, 15], [-2, 5, 12], [-4, 3, 10], [-5, 2, 8]], passo: [2.5, 5], onda: "triangle", filtro: 760, pulso: "gotejo" },
  observatorio: { raiz: 220, escala: [0, 2, 7, 9, 14, 16],     acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [1.5, 3.5], onda: "sine", filtro: 1300, pulso: "sonar" },
  eclusa:     { raiz: 123.5, escala: [0, 3, 5, 7, 10, 12],     acordes: [[0, 7, 15], [-2, 5, 12], [-5, 3, 10], [-7, 0, 7]], passo: [2.8, 5.5], onda: "sine", filtro: 620, pulso: "marulho", grave: true },
  torre:      { raiz: 185,   escala: [0, 2, 5, 7, 9, 12],      acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2.2, 4.8], onda: "triangle", filtro: 900, pulso: "buzina" },
  porao:      { raiz: 98,    escala: [0, 3, 5, 7, 10, 12],     acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3.5, 7], onda: "triangle", filtro: 420, pulso: "casco", grave: true },
  espelhos:   { raiz: 261.6, escala: [0, 4, 7, 11, 12, 16],    acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 11], [-7, 0, 7]], passo: [1.8, 4], onda: "sine", filtro: 1500, pulso: "cristal" },
  recife:     { raiz: 220,   escala: [0, 2, 4, 6, 7, 9, 11, 12], acordes: [[0, 7, 16], [2, 9, 18], [-3, 4, 11], [-5, 2, 9]], passo: [1.5, 3.5], onda: "triangle", filtro: 950 },
  oficina:    { raiz: 155.6, escala: [0, 2, 4, 7, 9, 12],      acordes: [[0, 7, 16], [-2, 5, 14], [-5, 4, 12], [-7, 0, 7]], passo: [2, 4.5], onda: "triangle", filtro: 850, pulso: "forja" },
  sinos:      { raiz: 196,   escala: [0, 4, 7, 9, 12, 16],     acordes: [[0, 7, 12, 16], [-3, 4, 9], [-5, 2, 7, 11], [-7, 0, 5]], passo: [2.4, 5], onda: "sine", filtro: 1100, pulso: "badalo", grave: true },
  catedral:   { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12, 16],  acordes: [[0, 7, 12, 16], [-5, 2, 7, 11], [-3, 4, 9, 12], [-7, 0, 5, 9]], passo: [3, 6], onda: "sine", filtro: 700, grave: true },
  abismo:     { raiz: 110,   escala: [0, 3, 5, 7, 8, 12],      acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [1, 2.5], onda: "sawtooth", filtro: 380, pulso: "corrente", grave: true },
  coracao:    { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12, 14, 16], acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [1.8, 3.6], onda: "triangle", filtro: 1000, pulso: "coracao", grave: true },
  mangue:     { raiz: 116.5, escala: [0, 3, 5, 7, 10, 12],     acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3, 6], onda: "sine", filtro: 480, pulso: "lama", grave: true },
  teatro:     { raiz: 220,   escala: [0, 2, 4, 7, 9, 12],      acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 5], onda: "triangle", filtro: 1000, pulso: "lencol" },
  bombas:     { raiz: 98,    escala: [0, 2, 5, 7, 9, 12],      acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 7], onda: "triangle", filtro: 400, pulso: "bombeo", grave: true },
  rede:       { raiz: 174.6, escala: [0, 2, 4, 7, 9, 12],     acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 5], onda: "sine", filtro: 900, pulso: "pesca" },
  mare:       { raiz: 146.8, escala: [0, 2, 4, 7, 9, 11],   acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3, 6], onda: "sine", filtro: 700, pulso: "mare" },
  vento:      { raiz: 130.8, escala: [0, 3, 5, 7, 10, 12],    acordes: [[0, 7, 15], [-2, 5, 12], [-5, 3, 10], [-7, 0, 7]], passo: [2.5, 5], onda: "triangle", filtro: 800, pulso: "vento" },
  eco:        { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12, 14], acordes: [[0, 7, 14], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [4, 7], onda: "sine", filtro: 900, pulso: "eco" },
  cardume:    { raiz: 164.8, escala: [0, 2, 4, 7, 9, 12],   acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [2.5, 5], onda: "triangle", filtro: 1100, pulso: "cardume" },
  coral:      { raiz: 146.8, escala: [0, 2, 4, 7, 9, 11],   acordes: [[0, 7, 14], [-2, 5, 12], [-4, 3, 9], [-7, 0, 7]], passo: [4, 7], onda: "sine", filtro: 750, pulso: "coral" },
  neblina:    { raiz: 116.5, escala: [0, 2, 5, 7, 9], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 8], onda: "sine", filtro: 500, pulso: "neblina", grave: true },
  alavancas:  { raiz: 110, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sawtooth", filtro: 420, pulso: "ferro", grave: true },
  memoria:    { raiz: 196, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 4], onda: "triangle", filtro: 1200, pulso: "caixinha" },
  perolas:    { raiz: 207.65, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2, 4], onda: "sine", filtro: 1400, pulso: "perolas" },
  setas:      { raiz: 130.8, escala: [0, 2, 3, 7, 8, 12], acordes: [[0, 7, 15], [-2, 5, 12], [-4, 3, 10], [-5, 2, 8]], passo: [2.5, 5], onda: "triangle", filtro: 700, pulso: "correnteza" },
  dominos:    { raiz: 146.8, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "triangle", filtro: 600, pulso: "pedras" },
  palavras:   { raiz: 174.6, escala: [0, 2, 4, 7, 9, 11], acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [3, 5], onda: "sine", filtro: 1000, pulso: "sopa" },
  final2:     { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12, 14, 16], acordes: [[0, 7, 16], [-3, 4, 12], [-5, 2, 9], [-7, 0, 7]], passo: [2, 4], onda: "triangle", filtro: 1100, pulso: "coracao", grave: true },
  silencio:   { raiz: 73.4, escala: [0, 7, 12], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [6, 10], onda: "sine", filtro: 260, pulso: "silencio", grave: true },
  contagem:   { raiz: 82.4, escala: [0, 5, 7, 12], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [5, 9], onda: "sine", filtro: 300, pulso: "silencio", grave: true },
  fio:        { raiz: 92.5, escala: [0, 3, 7, 10, 12], acordes: [[0, 7], [-3, 4], [-5, 2], [-7, 0]], passo: [6, 10], onda: "triangle", filtro: 340, pulso: "silencio", grave: true },
  pedra:      { raiz: 98, escala: [0, 2, 5, 7, 9], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [5, 9], onda: "sine", filtro: 280, pulso: "silencio", grave: true },
  breu:       { raiz: 87.3, escala: [0, 3, 5, 7, 10], acordes: [[0, 7], [-3, 4], [-5, 2], [-7, 0]], passo: [6, 11], onda: "triangle", filtro: 260, pulso: "silencio", grave: true },
  chama:      { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [4, 7], onda: "triangle", filtro: 700, pulso: "lencol" },
  vela:       { raiz: 164.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [4, 8], onda: "triangle", filtro: 900, pulso: "lencol" },
  forja:      { raiz: 155.6, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 16], [-2, 5, 14], [-5, 4, 12], [-7, 0, 7]], passo: [2, 4.5], onda: "triangle", filtro: 850, pulso: "forja" },
  molhada:    { raiz: 130.8, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 7], onda: "triangle", filtro: 620, pulso: "lencol" },
  brasa:      { raiz: 123.5, escala: [0, 2, 5, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sine", filtro: 800, pulso: "forja" },
  arca:       { raiz: 110, escala: [0, 2, 4, 7, 9], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [4, 7], onda: "triangle", filtro: 500, pulso: "casco", grave: true },
  muralha:    { raiz: 116.5, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sine", filtro: 480, pulso: "casco", grave: true },
  ganchos:    { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [3, 5], onda: "triangle", filtro: 700, pulso: "casco", grave: true },
  fechadura:  { raiz: 130.8, escala: [0, 2, 3, 7, 8, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [4, 7], onda: "sine", filtro: 650, pulso: "lencol" },
  selos:      { raiz: 138.6, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "triangle", filtro: 720, pulso: "lencol" },
  escalada:   { raiz: 98, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3, 6], onda: "triangle", filtro: 620, pulso: "lencol" },
  encaixe:    { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [3, 6], onda: "sine", filtro: 800, pulso: "lencol" },
  sementes:   { raiz: 116.5, escala: [0, 3, 5, 7, 10, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [4, 8], onda: "triangle", filtro: 700, pulso: "lencol" },
  alternado:  { raiz: 123.5, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3, 6], onda: "triangle", filtro: 750, pulso: "lencol" },
  pontes:     { raiz: 146.8, escala: [0, 2, 5, 7, 9], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sine", filtro: 650, pulso: "lencol" },
  trilha:     { raiz: 92.5, escala: [0, 2, 5, 7, 9], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [5, 9], onda: "sine", filtro: 300, pulso: "silencio", grave: true },
  sombra:     { raiz: 110, escala: [0, 4, 7, 9, 12], acordes: [[0, 7], [-5, 2], [-3, 4], [-7, 0]], passo: [5, 9], onda: "sine", filtro: 280, pulso: "silencio", grave: true },
  luar:       { raiz: 116.5, escala: [0, 3, 5, 7, 10], acordes: [[0, 7], [-2, 5], [-5, 2], [-7, 0]], passo: [5, 9], onda: "sine", filtro: 320, pulso: "silencio", grave: true },
  ar:         { raiz: 98, escala: [0, 2, 5, 7, 9], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [5, 9], onda: "sine", filtro: 260, pulso: "silencio", grave: true },
  chaves:     { raiz: 103.8, escala: [0, 2, 3, 7, 8, 12], acordes: [[0, 7], [-5, 2], [-3, 4], [-7, 0]], passo: [5, 9], onda: "sine", filtro: 300, pulso: "silencio", grave: true },
  viciosa:    { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [3, 6], onda: "triangle", filtro: 800, pulso: "lencol" },
  vapor:      { raiz: 116.5, escala: [0, 2, 3, 7, 8, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 7], onda: "sine", filtro: 650, pulso: "marulho" },
  aquecida:   { raiz: 110, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 8], onda: "triangle", filtro: 500, pulso: "casco", grave: true },
  anel:       { raiz: 146.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 14], [-3, 4, 9], [-5, 2, 9], [-7, 0, 7]], passo: [2.5, 5], onda: "triangle", filtro: 900, pulso: "pesca" },
  fosforo:    { raiz: 123.5, escala: [0, 2, 5, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sine", filtro: 780, pulso: "lencol" },
  tanques:    { raiz: 130.8, escala: [0, 2, 4, 7, 9, 12], acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [4, 7], onda: "sine", filtro: 700, pulso: "marulho" },
  simetria:   { raiz: 146.8, escala: [0, 2, 4, 7, 9, 11], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], passo: [4, 8], onda: "triangle", filtro: 850, pulso: "lencol" },
  prateleiras:{ raiz: 110, escala: [0, 3, 5, 7, 10], acordes: [[0, 7, 12], [-2, 5, 10], [-5, 2, 7], [-7, 0, 5]], passo: [4, 8], onda: "triangle", filtro: 520, pulso: "casco", grave: true },
  trilhos:    { raiz: 123.5, escala: [0, 2, 5, 7, 9, 12], acordes: [[0, 7, 12], [-3, 4, 9], [-5, 2, 7], [-7, 0, 5]], passo: [3, 6], onda: "sine", filtro: 780, pulso: "pesca" },
  torrecaixas: { raiz: 98, escala: [0, 2, 5, 7, 9], acordes: [[0, 7], [-5, 2], [-7, 0], [-5, 2]], passo: [5, 9], onda: "triangle", filtro: 420, pulso: "casco", grave: true },
  infinito:   { raiz: 110,   escala: [0, 3, 5, 7, 8, 12],      acordes: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], passo: [0.6, 1.5], onda: "sawtooth", filtro: 450, pulso: "corrente", grave: true },
};

const KEY = "lanterna-submersa:musica";
const hz = (raiz: number, semis: number) => raiz * 2 ** (semis / 12);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function lerAtiva(): boolean {
  try { return localStorage.getItem(KEY) !== "0"; } catch { return true; }
}

let ativa = lerAtiva();
let ligado = false;            // só depois do primeiro gesto do jogador
let alvo: TemaMusical = "menu";
let atual: { tema: TemaMusical; parar: () => void } | null = null;

function iniciarTema(nome: TemaMusical) {
  const ctx = Howler.ctx;
  const destino: AudioNode | undefined = Howler.masterGain ?? ctx?.destination;
  if (!ctx || !destino) return null;
  const t = temas[nome];
  const timers: number[] = [];
  const fontes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  let vivo = true;

  const saida = ctx.createGain();
  saida.gain.value = 0;
  saida.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
  saida.connect(destino);

  // eco que faz as notas ecoarem como numa caverna
  const atraso = ctx.createDelay(1.5);
  atraso.delayTime.value = 0.42;
  const fb = ctx.createGain(); fb.gain.value = 0.4;
  const molhado = ctx.createGain(); molhado.gain.value = 0.5;
  atraso.connect(fb); fb.connect(atraso); atraso.connect(molhado); molhado.connect(saida);

  // pad: acordes longos filtrados, que "respiram"
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass"; filtro.frequency.value = t.filtro;
  filtro.connect(saida);
  const acorde0 = t.acordes[0];
  const vozes = acorde0.map((s) => {
    const o = ctx.createOscillator();
    o.type = t.onda; o.frequency.value = hz(t.raiz, s); o.detune.value = rnd(-7, 7);
    const g = ctx.createGain(); g.gain.value = t.onda === "sawtooth" ? 0.035 : 0.07;
    o.connect(g); g.connect(filtro); o.start();
    fontes.push(o);
    return o;
  });
  const lfo = ctx.createOscillator();
  lfo.frequency.value = t.pulso === "corrente" ? 0.35 : 0.08;
  const lg = ctx.createGain(); lg.gain.value = t.pulso === "corrente" ? t.filtro * 0.7 : t.filtro * 0.3;
  lfo.connect(lg); lg.connect(filtro.frequency); lfo.start();
  fontes.push(lfo);

  if (t.grave) {
    const sub = ctx.createOscillator();
    sub.type = "sine"; sub.frequency.value = t.raiz / 2;
    const sg = ctx.createGain(); sg.gain.value = 0.1;
    sub.connect(sg); sg.connect(saida); sub.start();
    fontes.push(sub);
  }

  // troca de acorde a cada poucos segundos, com glissando suave
  let idx = 0;
  const mudar = () => {
    if (!vivo) return;
    idx = (idx + 1) % t.acordes.length;
    const ac = t.acordes[idx];
    vozes.forEach((o, i) => o.frequency.setTargetAtTime(hz(t.raiz, ac[i % ac.length]), ctx.currentTime, 1.6));
    timers.push(window.setTimeout(mudar, t.pulso === "corrente" ? 6000 : 9000));
  };
  timers.push(window.setTimeout(mudar, 7000));

  const sino = (f: number) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2.76;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.6);
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(saida); g.connect(atraso);
    o.start(); o2.start(); o.stop(ctx.currentTime + 2.7); o2.stop(ctx.currentTime + 2.7);
  };
  const notas = () => {
    if (!vivo) return;
    const s = t.escala[Math.floor(Math.random() * t.escala.length)];
    sino(hz(t.raiz * 2, s + (Math.random() < 0.25 ? 12 : 0)));
    timers.push(window.setTimeout(notas, rnd(t.passo[0], t.passo[1]) * 1000));
  };
  timers.push(window.setTimeout(notas, 1200));

  // batimento de coração (Coração da Lanterna)
  if (t.pulso === "coracao") {
    const batida = (atrasoS: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const t0 = ctx.currentTime + atrasoS;
      o.type = "sine";
      o.frequency.setValueAtTime(95, t0);
      o.frequency.exponentialRampToValueAtTime(45, t0 + 0.15);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g); g.connect(saida); o.start(t0); o.stop(t0 + 0.4);
    };
    const bater = () => { if (!vivo) return; batida(0); batida(0.24); timers.push(window.setTimeout(bater, 1250)); };
    bater();
  }

  // Oficina: tinidos de martelo no ferro, em compasso de três, com eco
  if (t.pulso === "forja") {
    const tinido = (atrasoS: number, f: number, vol: number) => {
      const t0 = ctx.currentTime + atrasoS;
      [1, 2.4, 5.1].forEach((m, k) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol / (k + 1), t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6 / (k + 1) + 0.1);
        o.connect(g); g.connect(saida); g.connect(atraso);
        o.start(t0); o.stop(t0 + 0.9);
      });
    };
    const martelar = () => {
      if (!vivo) return;
      tinido(0, 880, 0.07); tinido(0.45, 1320, 0.04); tinido(0.9, 880, 0.06);
      timers.push(window.setTimeout(martelar, 3600));
    };
    timers.push(window.setTimeout(martelar, 1500));
  }

  // Armazém: gotas pingando de um teto de pedra, cada uma num tom
  if (t.pulso === "gotejo") {
    const gota = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(520, 1100);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t0 + 0.14);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 0.3);
      timers.push(window.setTimeout(gota, rnd(900, 2800)));
    };
    timers.push(window.setTimeout(gota, 1200));
  }

  // Observatório: ping de sonar e o retorno fraco, vindo de longe
  if (t.pulso === "sonar") {
    const ping = (atrasoS: number, f: number, vol: number) => {
      const t0 = ctx.currentTime + atrasoS;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 1.5);
    };
    const emitir = () => {
      if (!vivo) return;
      ping(0, 1320, 0.07); ping(0.9, 990, 0.025);
      timers.push(window.setTimeout(emitir, 5200));
    };
    timers.push(window.setTimeout(emitir, 2000));
  }

  // Eclusas: marulho contínuo de água parada, que sobe e desce, e bolhas ocasionais
  if (t.pulso === "marulho") {
    const n = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 480; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.03;
    const ondas = ctx.createOscillator(); ondas.frequency.value = 0.11;
    const og = ctx.createGain(); og.gain.value = 0.02;
    ondas.connect(og); og.connect(g.gain);
    src.connect(bp); bp.connect(g); g.connect(saida);
    src.start(); ondas.start();
    fontes.push(src, ondas);
    const bolha = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(160, 260);
      const o = ctx.createOscillator(), bg = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 1.8, t0 + 0.12);
      bg.gain.setValueAtTime(0.0001, t0);
      bg.gain.exponentialRampToValueAtTime(0.07, t0 + 0.01);
      bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(bg); bg.connect(saida); bg.connect(atraso);
      o.start(t0); o.stop(t0 + 0.3);
      timers.push(window.setTimeout(bolha, rnd(1800, 4500)));
    };
    timers.push(window.setTimeout(bolha, 1500));
  }

  // Torre dos Sinais: buzina grave de um barco ao longe, que cai de tom e responde com outra
  if (t.pulso === "buzina") {
    const buzinar = (atrasoS: number, f: number, vol: number) => {
      const t0 = ctx.currentTime + atrasoS;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 0.92, t0 + 2.4);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 2.7);
    };
    const soar = () => {
      if (!vivo) return;
      buzinar(0, t.raiz / 2, 0.08); buzinar(3.2, t.raiz / 2 * 1.5, 0.035);
      timers.push(window.setTimeout(soar, rnd(9500, 13000)));
    };
    timers.push(window.setTimeout(soar, 3000));
  }

  // Galeria dos Espelhos: brilhos agudos de vidro, que cintilam e se apagam
  if (t.pulso === "cristal") {
    const brilho = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(2200, 3600);
      [f, f * 1.003].forEach((fr) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = fr;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.025, t0 + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
        o.connect(g); g.connect(saida); g.connect(atraso);
        o.start(t0); o.stop(t0 + 1);
      });
      timers.push(window.setTimeout(brilho, rnd(1200, 3500)));
    };
    timers.push(window.setTimeout(brilho, 1400));
  }

  // Porão: o casco range devagar, como madeira velha sob peso
  if (t.pulso === "casco") {
    const ranger = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(48, 70);
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.linearRampToValueAtTime(f * 1.35, t0 + 1.8);
      lp.type = "lowpass"; lp.frequency.value = 260;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
      o.connect(lp); lp.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 2.3);
      timers.push(window.setTimeout(ranger, rnd(6500, 10500)));
    };
    timers.push(window.setTimeout(ranger, 2500));
  }

  // Sala dos Sinos: badalada grave e distante, com cauda longa
  if (t.pulso === "badalo") {
    const toque = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      [[1, 0.22, 5], [2, 0.1, 3.5], [2.76, 0.09, 2.8], [5.4, 0.04, 1.5]].forEach(([m, v, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = (t.raiz / 2) * m;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(v, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(saida); g.connect(atraso);
        o.start(t0); o.stop(t0 + d + 0.1);
      });
      timers.push(window.setTimeout(toque, rnd(6500, 9500)));
    };
    timers.push(window.setTimeout(toque, 2500));
  }

  // Manguezal: bolhas de lodo que estouram sob o zumbido grave
  if (t.pulso === "lama") {
    const bolha = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, f = rnd(260, 520);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * 1.8, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 0.2);
      timers.push(window.setTimeout(bolha, rnd(1800, 4200)));
    };
    timers.push(window.setTimeout(bolha, 1800));
  }

  // Teatro: o lençol range com o vento, um sopro de cordas que sobe e desce
  if (t.pulso === "lencol") {
    const sopro = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = rnd(330, 392);
      lp.type = "lowpass"; lp.Q.value = 2;
      lp.frequency.setValueAtTime(260, t0);
      lp.frequency.linearRampToValueAtTime(980, t0 + 1.4);
      lp.frequency.linearRampToValueAtTime(300, t0 + 2.6);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
      o.connect(lp); lp.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 2.7);
      timers.push(window.setTimeout(sopro, rnd(4500, 7000)));
    };
    timers.push(window.setTimeout(sopro, 2000));
  }

  // Casa das Bombas: pistão que bate devagar, como uma bomba antiga
  if (t.pulso === "bombeo") {
    const pisto = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(90, t0);
      o.frequency.exponentialRampToValueAtTime(45, t0 + 0.18);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(saida);
      o.start(t0); o.stop(t0 + 0.25);
      timers.push(window.setTimeout(pisto, 1600));
    };
    timers.push(window.setTimeout(pisto, 1200));
  }

  // Rede do porto: pingos claros de peixe na água, espaçados
  if (t.pulso === "pesca") {
    const pingo = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, fr = rnd(880, 1320);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(fr, t0);
      o.frequency.exponentialRampToValueAtTime(fr * 1.25, t0 + 0.08);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 0.55);
      timers.push(window.setTimeout(pingo, rnd(2200, 4200)));
    };
    timers.push(window.setTimeout(pingo, 2400));
  }

  // Labirinto da maré: a onda sobe e desce devagar, como a água entrando e saindo do canal
  if (t.pulso === "mare") {
    const onda = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(110, t0);
      o.frequency.linearRampToValueAtTime(165, t0 + 1.6);
      o.frequency.linearRampToValueAtTime(110, t0 + 3.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
      o.connect(g); g.connect(saida);
      o.start(t0); o.stop(t0 + 3.3);
      timers.push(window.setTimeout(onda, 3300));
    };
    onda();
  }

  // Vento contrário: rajada de ruído que varre o mar de uma ponta à outra
  if (t.pulso === "vento") {
    const rajada = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, dur = 2.6;
      const n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf;
      bp.type = "bandpass"; bp.Q.value = 1.5;
      bp.frequency.setValueAtTime(400, t0);
      bp.frequency.linearRampToValueAtTime(1200, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(saida);
      src.start(t0); src.stop(t0 + dur + 0.05);
      timers.push(window.setTimeout(rajada, rnd(4500, 7000)));
    };
    timers.push(window.setTimeout(rajada, 1500));
  }

  // Escuta do Segundo Mar: sino distante que ecoa pela linha de atraso
  if (t.pulso === "eco") {
    const chamado = () => {
      if (!vivo) return;
      const s = t.escala[Math.floor(Math.random() * t.escala.length)];
      const f = hz(t.raiz * 2, s);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(); o.stop(ctx.currentTime + 2.5);
      timers.push(window.setTimeout(chamado, rnd(5000, 8000)));
    };
    timers.push(window.setTimeout(chamado, 1500));
  }

  // Cardume: peixes que mudam de direção com um brilho curto, em pares espaçados
  if (t.pulso === "cardume") {
    const peixinho = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, fr = rnd(1400, 2200);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(fr, t0);
      o.frequency.exponentialRampToValueAtTime(fr * 0.7, t0 + 0.1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.connect(g); g.connect(saida);
      o.start(t0); o.stop(t0 + 0.16);
      timers.push(window.setTimeout(peixinho, rnd(1400, 3000)));
    };
    timers.push(window.setTimeout(peixinho, 1600));
  }

  // Coral: sinos longos e distantes, como o crescimento lento de um jardim
  if (t.pulso === "coral") {
    const sino = () => {
      if (!vivo) return;
      const fr = hz(t.raiz * 2, t.escala[Math.floor(Math.random() * t.escala.length)]);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(); o.stop(ctx.currentTime + 3.6);
      timers.push(window.setTimeout(sino, rnd(6000, 10000)));
    };
    timers.push(window.setTimeout(sino, 2500));
  }

  // Neblina: buzina de farol bem longe, que vem e vai na névoa
  if (t.pulso === "neblina") {
    const buzina = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 98;
      lp.type = "lowpass"; lp.frequency.value = 300;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
      o.connect(lp); lp.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 3.3);
      timers.push(window.setTimeout(buzina, rnd(7000, 10000)));
    };
    timers.push(window.setTimeout(buzina, 2500));
  }

  // Portas de ferro: clangor metálico de alavanca que cai, com cauda curta
  if (t.pulso === "ferro") {
    const clangor = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.setValueAtTime(190, t0); o.frequency.exponentialRampToValueAtTime(90, t0 + 0.2);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(t0); o.stop(t0 + 0.32);
      timers.push(window.setTimeout(clangor, rnd(3500, 6000)));
    };
    timers.push(window.setTimeout(clangor, 2000));
  }

  // Conchas gêmeas: notinhas de caixinha de música, espaçadas e suaves
  if (t.pulso === "caixinha") {
    const nota = () => {
      if (!vivo) return;
      const fr = hz(t.raiz * 2, t.escala[Math.floor(Math.random() * t.escala.length)]);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      o.connect(g); g.connect(saida);
      o.start(); o.stop(ctx.currentTime + 1.3);
      timers.push(window.setTimeout(nota, rnd(1600, 3000)));
    };
    timers.push(window.setTimeout(nota, 1500));
  }

  // Colar de pérolas: pérolas que tilintam de leve, espaçadas
  if (t.pulso === "perolas") {
    const tilintar = () => {
      if (!vivo) return;
      const fr = hz(t.raiz * 4, t.escala[Math.floor(Math.random() * t.escala.length)]);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(); o.stop(ctx.currentTime + 1);
      timers.push(window.setTimeout(tilintar, rnd(1800, 3500)));
    };
    timers.push(window.setTimeout(tilintar, 1500));
  }

  // Correnteza de setas: ruído de água que passa devagar, de um lado a outro
  if (t.pulso === "correnteza") {
    const passa = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime, dur = 3.2;
      const n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf;
      bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t0);
      bp.frequency.linearRampToValueAtTime(900, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.04, t0 + 1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(saida);
      src.start(t0); src.stop(t0 + dur + 0.05);
      timers.push(window.setTimeout(passa, rnd(5000, 8000)));
    };
    timers.push(window.setTimeout(passa, 1800));
  }

  // Pedras que caem: toque seco de pedra contra pedra, com intervalos irregulares
  if (t.pulso === "pedras") {
    const toque = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.setValueAtTime(rnd(400, 600), t0); o.frequency.exponentialRampToValueAtTime(180, t0 + 0.05);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g); g.connect(saida);
      o.start(t0); o.stop(t0 + 0.1);
      timers.push(window.setTimeout(toque, rnd(2500, 5000)));
    };
    timers.push(window.setTimeout(toque, 2000));
  }

  // Sopa das marés: notas de sino baixas que surgem como letras aparecendo na água
  if (t.pulso === "sopa") {
    const letra = () => {
      if (!vivo) return;
      const fr = hz(t.raiz * 2, t.escala[Math.floor(Math.random() * t.escala.length)]);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2);
      o.connect(g); g.connect(saida); g.connect(atraso);
      o.start(); o.stop(ctx.currentTime + 2.1);
      timers.push(window.setTimeout(letra, rnd(3000, 5500)));
    };
    timers.push(window.setTimeout(letra, 1800));
  }

  // Mar sem luz: um sopro grave e distante, quase silêncio, de tempos em tempos
  if (t.pulso === "silencio") {
    const sopro = () => {
      if (!vivo) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(60, t0); o.frequency.linearRampToValueAtTime(45, t0 + 4);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.5);
      o.connect(g); g.connect(saida);
      o.start(t0); o.stop(t0 + 4.6);
      timers.push(window.setTimeout(sopro, rnd(7000, 11000)));
    };
    timers.push(window.setTimeout(sopro, 2000));
  }

  return {
    tema: nome,
    parar() {
      vivo = false;
      timers.forEach((id) => clearTimeout(id));
      saida.gain.cancelScheduledValues(ctx.currentTime);
      saida.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      window.setTimeout(() => {
        fontes.forEach((o) => { try { o.stop(); } catch { /* já parado */ } });
        saida.disconnect();
      }, 2200);
    },
  };
}

function aplicar() {
  if (!ligado || !ativa) { atual?.parar(); atual = null; return; }
  if (atual?.tema === alvo) return;
  atual?.parar();
  atual = iniciarTema(alvo);
}

export const musica = {
  /** Chamado no primeiro gesto do jogador (navegadores bloqueiam áudio antes disso). */
  iniciar() { ligado = true; aplicar(); },
  tocar(tema: TemaMusical) { alvo = tema; aplicar(); },
  estaAtiva: () => ativa,
  definirAtiva(v: boolean) {
    ativa = v;
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* sem armazenamento */ }
    aplicar();
  },
};
