import type { Save } from "../store/schema";

export type Pagina = { id: string; titulo: string; texto: string; dica: string; check: (s: Save) => boolean };

const fez = (fase: string) => (s: Save) => s.completed.includes(fase as Save["completed"][number]);
const tem = (item: string) => (s: Save) => s.inventory.includes(item);

// Páginas do diário de Tomás Vaz, o último faroleiro. Cada uma abre com o progresso do jogador.
export const paginas: Pagina[] = [
  {
    id: "d-cais", titulo: "A lanterna fria", dica: "Conclua o Cais Afundado.", check: fez("cais"),
    texto: "Não lembro de ter chegado ao cais. A lanterna estava na minha mão, fria, com uma frase gravada na base: quem a segura, responde. Ainda não sei a quem.",
  },
  {
    id: "d-conchas", titulo: "O que as conchas guardam", dica: "Encontre as 3 conchas do cais.", check: tem("conchas-todas"),
    texto: "Encostei uma concha no ouvido e ouvi gente conversando ao longe, de dia. Na cidade de antes, o mar nunca ficava calado.",
  },
  {
    id: "d-biblioteca", titulo: "Quatro mãos", dica: "Conclua a Biblioteca Alagada.", check: fez("biblioteca"),
    texto: "O registro da luz diz que a lanterna nunca teve um dono só. Quatro faroleiros a carregaram, um por geração, e cada um jurou deixá-la acesa para o seguinte.",
  },
  {
    id: "d-jardins", titulo: "As enguias do porto", dica: "Conclua os Jardins de Coral.", check: fez("jardins"),
    texto: "As enguias não nasceram monstros. Eram as vigias do jardim, treinadas para seguir a luz e conduzir barcos perdidos até o porto. Com a cheia, esqueceram o caminho de volta.",
  },
  {
    id: "d-armazem", titulo: "O peso das pedras", dica: "Conclua o Armazém do Porto.", check: fez("armazem"),
    texto: "Cada barco deixava uma pedra de lastro com o nome gravado: Aurora, Gaivota, Bom Retiro, Maré Mansa, Estrela-d'Alva. A última a chegar foi a Estrela-d'Alva, carregada de gente. Tomás nunca soube quantos eram.",
  },
  {
    id: "d-recife", titulo: "Seis noites", dica: "Conclua o Recife dos Naufrágios.", check: fez("recife"),
    texto: "Seis fragmentos. Seis noites em que a lanterna trouxe um barco para casa. Cada caco ainda guarda o nome do barco, riscado do lado de dentro do vidro.",
  },
  {
    id: "d-oficina", titulo: "Para Lia", dica: "Conclua a Oficina do Faroleiro.", check: fez("oficina"),
    texto: "Tomás refez a lente três vezes. Na tampa da caixa, riscado com prego: para Lia, quando eu voltar. A filha esperou no cais até a água cobrir o último degrau.",
  },
  {
    id: "d-lia", titulo: "A carta que sobrou", dica: "Leia todas as anotações da oficina.", check: (s) => ["caderno", "carta", "receita", "aprendiz", "retrato"].every((o) => s.inventory.includes(`oficina:${o}`)),
    texto: "Na carta de Lia, o último parágrafo estava borrado, mas dava para ler: se um dia a luz voltar, não deixe que ela fique só brilhando. Peça a ela que chame alguém.",
  },
  {
    id: "d-catedral", titulo: "O relógio da lua", dica: "Conclua a Catedral das Marés.", check: fez("catedral"),
    texto: "A catedral é um relógio de água. Quem a ergueu sabia que a cheia viria, só não sabia quando. Por isso a maré lá dentro sobe e desce desde o primeiro dia.",
  },
  {
    id: "d-sinos", titulo: "Cinco sinos", dica: "Conclua a Sala dos Sinos.", check: fez("sinos"),
    texto: "Os sinos não tocam de lamento. Cada um é a voz de um faroleiro: proa, cais, torre e ponte. O quinto, o mais agudo, o do farol, nunca foi tocado. Era o sino de quem viesse depois.",
  },
  {
    id: "d-observatorio", titulo: "O único mapa", dica: "Conclua o Observatório Naufragado.", check: fez("observatorio"),
    texto: "Do alto da cúpula, Tomás mostrava a Estrela para Lia e dizia que o céu era o único mapa que o mar não conseguia apagar. Anotou na margem: se a luz se perder, procure a Estrela. Ela sempre volta ao mesmo lugar.",
  },
  {
    id: "d-farol", titulo: "O que faltava", dica: "Monte a lente e afine o quinto sino.", check: (s) => s.inventory.includes("lente-do-faroleiro") && s.inventory.includes("quinto-sino"),
    texto: "Duas coisas estavam faltando na lanterna: uma lente que passasse a luz e um sino que respondesse a ela. Agora ela tem tudo o que Tomás deixou. Só falta alguém para acendê-la de novo.",
  },
  {
    id: "d-abismo", titulo: "A corrente que sobe", dica: "Conclua as Correntes do Abismo.", check: fez("abismo"),
    texto: "A corrente do poço não é inimiga. É o próprio mar tentando levar a luz de volta à superfície. O problema é que ele leva a cidade junto.",
  },
  {
    id: "d-coracao", titulo: "A voz de quatro luzes", dica: "Conclua o Coração da Lanterna.", check: fez("coracao"),
    texto: "O Guardião não tem rosto porque os quatro faroleiros deram o rosto à lanterna. Sobrou a voz de cada um: coral, lanterna, alga e espuma. Eles não queriam um herói. Queriam que alguém ouvisse.",
  },
  {
    id: "d-finais", titulo: "Todos os finais", dica: "Descubra os 4 finais.", check: (s) => ["apagar", "acender", "guardar", "renascer"].every((f) => s.inventory.includes(`final:${f}`)),
    texto: "Apagar, erguer, guardar ou chamar a cidade de volta: nenhum deles é errado. A lanterna só queria saber se havia alguém escutando. Agora há. Maré Alta não está mais sozinha.",
  },
];
