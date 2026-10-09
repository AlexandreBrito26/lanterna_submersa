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
    id: "d-porao", titulo: "A conta da Estrela-d'Alva", dica: "Conclua o Porão da Estrela-d'Alva.", check: fez("porao"),
    texto: "A Estrela-d'Alva saiu com o porão cheio de gente e de caixas. Tomás refez a lista de bordo três vezes: cada caixa tirada do caminho abria lugar para mais um nome. Nunca soube quantos eram. Soube que ninguém ficou no cais por falta de espaço.",
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
    id: "d-espelhos", titulo: "Prata para a luz", dica: "Conclua a Galeria dos Espelhos.", check: fez("espelhos"),
    texto: "A lanterna sozinha alcançava pouco. Tomás pendurou espelhos de prata pela torre inteira, e a luz passou a dobrar esquinas. Lia descobriu cedo que um espelho virado de leve mudava o farol de lugar, e passou uma tarde desenhando manchas de luz na parede.",
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
    id: "d-eclusa", titulo: "Medida de água", dica: "Conclua as Eclusas da Cidade Baixa.", check: fez("eclusa"),
    texto: "Nas eclusas, ninguém confiava no olho. Cada câmara tinha a sua medida riscada: três, cinco, oito. Lia aprendeu ali, ainda criança, que a água não se perde, só muda de câmara. Tomás anotou a frase na margem do livro.",
  },
  {
    id: "d-torre", titulo: "O último chamado", dica: "Conclua a Torre dos Sinais.", check: fez("torre"),
    texto: "LIA queria dizer estou bem. VEM queria dizer venha. O terceiro sinal, o de socorro, Tomás nunca enviou: o mar subiu antes. Quando a lâmpada voltou a chamar, a água lá em cima pareceu escutar.",
  },
  {
    id: "d-farol", titulo: "O que faltava", dica: "Monte a lente e afine o quinto sino.", check: (s) => s.inventory.includes("lente-do-faroleiro") && s.inventory.includes("quinto-sino"),
    texto: "Duas coisas estavam faltando na lanterna: uma lente que passasse a luz e um sino que respondesse a ela. Agora ela tem tudo o que Tomás deixou. Só falta alguém para acendê-la de novo.",
  },
  {
    id: "d-mangue", titulo: "Lodo que não segura", dica: "Conclua o Manguezal Escorregadio.", check: fez("mangue"),
    texto: "No manguezal, a lama parece firme até o primeiro passo. Aprendi a deslizar de raiz em raiz e a nunca parar sobre o lodo mole: ele cede sob quem fica parado. Quem passa leve, passa.",
  },
  {
    id: "d-teatro", titulo: "A praça das sombras", dica: "Conclua o Teatro de Sombras.", check: fez("teatro"),
    texto: "Na praça da Matriz, a cidade contava histórias com um lençol e uma lanterna por trás dele. Cada lâmpada acendia um pedaço do barco. Quando todas as marcas acendiam, a figura inteira aparecia na parede.",
  },
  {
    id: "d-bombas", titulo: "Pressão de volta", dica: "Conclua a Casa das Bombas.", check: fez("bombas"),
    texto: "A Casa das Bombas era o pulmão da cidade. Quando a última válvula abriu, o ar desceu pelos tubos e a sineira respondeu pela primeira vez desde a cheia.",
  },
  {
    id: "d-rede", titulo: "Nó de pescador", dica: "Conclua a Rede do Porto.", check: fez("rede"),
    texto: "Os pescadores ensinavam: rede boa é a que fecha. Tomás prendia os peixes que a cheia trouxe e, quando a maré baixava, soltava todos de volta ao mar.",
  },
  {
    id: "d-mare", titulo: "Relógio da maré", dica: "Conclua o Labirinto da Maré.", check: fez("mare"),
    texto: "A maré da Cidade Baixa não obedece à lua. Obedece ao caminho: cada passo que a gente dá muda o mar. Tomás contou os passos até achar o certo, e nunca mais errou o compasso.",
  },
  {
    id: "d-vento", titulo: "Vento a favor", dica: "Conclua o Vento Contrário.", check: fez("vento"),
    texto: "Tomás escreveu: o vento não é inimigo. Ele empurra quem se mexe, e só precisa ser lido antes de ser vencido. Usou a vela velha como bússola e chegou ao farol.",
  },
  {
    id: "d-eco", titulo: "Ecos no escuro", dica: "Conclua a Escuta do Segundo Mar.", check: fez("eco"),
    texto: "Depois do Coração, a cidade viu o mar aberto pela primeira vez. Tomás escreveu que havia faróis lá fora, apagados há séculos. Chamei o mar e ouvi o eco voltar mais forte de cada farol que ainda esperava ser acendido.",
  },
  {
    id: "d-cardume", titulo: "Quem anda junto", dica: "Conclua o Cardume Perdido.", check: fez("cardume"),
    texto: "Tomás aprendeu que o cardume não obedece a um peixe só. Cada movimento vale para todos, e quem para antes dos outros perde o grupo. Por isso ele sempre andava junto com quem ainda estava perdido.",
  },
  {
    id: "d-coral", titulo: "O que cresce sobre a cidade", dica: "Conclua o Coral Que Cresce.", check: fez("coral"),
    texto: "O coral só cresce colado ao que já existe. Tomás escreveu que a cidade submersa precisava de um caminho de volta, e o coral podia ser essa ponte, uma casa vizinha de cada vez.",
  },
  {
    id: "d-neblina", titulo: "Mar sem horizonte", dica: "Conclua a Neblina Azul.", check: fez("neblina"),
    texto: "Na neblina, Tomás não via o farol, só lembrava dele. Cada casa visitada ficava marcada na memória, e a névoa nunca apagava o caminho que já tinha feito.",
  },
  {
    id: "d-alavancas", titulo: "Portas de ferro", dica: "Conclua as Portas de Ferro.", check: fez("alavancas"),
    texto: "As portas da cidade baixa foram travadas por quem fugiu da cheia. Cada alavanca abria uma parte delas, e nenhuma abria tudo sozinha. Tomás achou a ordem depois de apertar todas.",
  },
  {
    id: "d-memoria", titulo: "Casal de mar", dica: "Conclua as Conchas Gêmeas.", check: fez("memoria"),
    texto: "Tomás guardava as conchas em pares: cada símbolo tinha outro igual, guardado em outra caixa. Quem lembrava onde estava cada uma, lembrava também a casa de quem a deixou.",
  },
  {
    id: "d-perolas", titulo: "Colar de pérolas", dica: "Conclua o Colar de Pérolas.", check: fez("perolas"),
    texto: "Tomás contava as pérolas de cada fio antes de montar o colar. Uma sequência longa limitava as outras, e quem começava pelas bordas nunca errava a forma.",
  },
  {
    id: "d-setas", titulo: "A correnteza certa", dica: "Conclua a Correnteza de Setas.", check: fez("setas"),
    texto: "A correnteza do porto muda de direção a cada geração. Tomás aprendeu a girar as setas com paciência, e chamava de redemoinho qualquer caminho que voltasse para onde já tinha estado.",
  },
  {
    id: "d-dominos", titulo: "Pedras que caem", dica: "Conclua as Pedras Que Caem.", check: fez("dominos"),
    texto: "No cais, as pedras de coral estavam em fila. Tomás notou que algumas caíam sozinhas e outras só caíam quando empurradas. Derrubar a pedra certa era o que fazia a queda chegar ao fim.",
  },
  {
    id: "d-palavras", titulo: "Letras do mar", dica: "Conclua a Sopa das Marés.", check: fez("palavras"),
    texto: "Os nomes da cidade ficaram escritos nas paredes do porto, e a água apagou quase todos. Tomás copiou as letras que sobraram, e as palavras voltaram a aparecer quando ele as procurava em todas as direções.",
  },
  {
    id: "d-final2", titulo: "Fim do Segundo Mar", dica: "Conclua O Último Farol.", check: fez("final2"),
    texto: "Os quatro faróis acenderam juntos, e a luz chegou ao fundo da cidade. Tomás tinha escrito que só a lanterna podia salvar todos. Agora ela já não estava sozinha.",
  },
  {
    id: "d-silencio", titulo: "Sem luz", dica: "Conclua o Mar Sem Luz.", check: fez("silencio"),
    texto: "Quando a lanterna se apagou de vez, Tomás aprendeu a andar pelo mar com as mãos. Cada parede que ele batia virava uma lembrança firme. Ele escreveu: no escuro, a gente só conhece o que tocou.",
  },
  {
    id: "d-pedra", titulo: "Atirar no escuro", dica: "Conclua a Pedra Lançada.", check: fez("pedra"),
    texto: "Tomás escreveu que cada pedra era uma pergunta feita ao mar. Quem sabia perguntar com pedras, nunca precisava de luz para saber onde estava.",
  },
  {
    id: "d-breu", titulo: "O último breu", dica: "Conclua o Breu Final.", check: fez("breu"),
    texto: "No último breu, Tomás deixou as pedras para trás e só tateou. Ele escreveu que o escuro não apaga o caminho: ele obriga a gente a lembrar onde já esteve.",
  },
  {
    id: "d-chama", titulo: "O fogo que corre", dica: "Conclua a Chama Que Corre.", check: fez("chama"),
    texto: "Tomás aprendeu que o fogo não faz o que quer: ele corre só pela madeira que alcança. Uma tocha para cada mata de lenha, e nenhuma tocha a mais.",
  },
  {
    id: "d-vela", titulo: "Cera e tempo", dica: "Conclua a Vela Que Derrete.", check: fez("vela"),
    texto: "Tomás tinha velas de duração diferente, e escreveu que a luz só serve quando chega junta. Uma vela acesa por vez, cada uma no seu tempo, e todas as portas abrem no mesmo instante.",
  },
  {
    id: "d-forja", titulo: "No ponto", dica: "Conclua a Forja de Pedras.", check: fez("forja"),
    texto: "Tomás aprendeu com o ferreiro do porto que a pedra não aceita pressa: cada brasa esquenta o vizinho também. Quem queria o ponto certo acendia devagar, e apagava quando passava.",
  },
  {
    id: "d-molhada", titulo: "Lenha que chia", dica: "Conclua a Lenha Molhada.", check: fez("molhada"),
    texto: "A chuva da cheia encharcou a lenha do porto. Tomás aprendeu a reconhecer a madeira molhada pelo chiado: ela pede duas tochas, e uma tocha perdida é uma luz a menos para o farol.",
  },
  {
    id: "d-brasa", titulo: "A brasa que anda", dica: "Conclua a Brasa Que Migra.", check: fez("brasa"),
    texto: "Tomás escreveu que a brasa do porto nunca ficava parada. Ela andava de altar em altar, e quem a queria acesa precisava estar no lugar certo na hora certa.",
  },
  {
    id: "d-arca", titulo: "O que fica guardado", dica: "Conclua a Arca Cheia.", check: fez("arca"),
    texto: "No depósito do porto, Tomás guardava as cargas dos barcos que não voltaram. Aprendeu que o peso precisa caber inteiro: uma arca a mais é uma carga a menos que se perde.",
  },
  {
    id: "d-muralha", titulo: "Ondas em linha reta", dica: "Conclua a Muralha de Escudos.", check: fez("muralha"),
    texto: "Tomás notou que as ondas da cheia sempre vinham em linha reta, da esquerda e do topo. Um escudo bem posto protegia uma linha inteira, e cada farol precisava dos seus.",
  },
  {
    id: "d-ganchos", titulo: "Nó desfeito", dica: "Conclua os Ganchos da Corrente.", check: fez("ganchos"),
    texto: "A corrente do cais tinha ganchos numerados, e a cheia os embaralhou. Tomás aprendeu que cada troca precisa de um vizinho: não se pega um gancho e o joga do outro lado do cais.",
  },
  {
    id: "d-fechadura", titulo: "O cofre dos pinos", dica: "Conclua a Fechadura de Pinos.", check: fez("fechadura"),
    texto: "Tomás guardava o cofre do porto com pinos de três posições. O mar não contava a resposta, só quantos pinos estavam certos. Ele escreveu: quem testa devagar, muda um pino por vez e aprende mais.",
  },
  {
    id: "d-selos", titulo: "Vizinhos diferentes", dica: "Conclua os Selos do Cofre.", check: fez("selos"),
    texto: "Tomás aprendeu a regra dos selos: cada um precisa ser diferente do que está ao lado. Quem respeitava a vizinhança, nunca precisava desmontar o cofre.",
  },
  {
    id: "d-escalada", titulo: "Degrau a degrau", dica: "Conclua a Escalada de Raízes.", check: fez("escalada"),
    texto: "As raízes da costa cresciam em degraus, e Tomás aprendeu a subir sem pular. Um salto errado quebrava a raiz; um passo firme a levava mais alto a cada vez.",
  },
  {
    id: "d-encaixe", titulo: "A costa se fecha", dica: "Conclua o Encaixe de Corais.", check: fez("encaixe"),
    texto: "Os corais que nasceram na costa cresciam em formas que se encaixavam. Tomás aprendeu que a costa só fecha quando nenhuma casa sobra e nenhuma peça se sobrepõe.",
  },
  {
    id: "d-sementes", titulo: "Uma semente por linha", dica: "Conclua as Sementes em Linha.", check: fez("sementes"),
    texto: "Tomás plantava a horta devagar: uma semente por linha e uma por coluna, fugindo do solo fraco. Quem repetia linha ou coluna perdia a colheita inteira.",
  },
  {
    id: "d-alternado", titulo: "Cores que se revezam", dica: "Conclua a Trilha Alternada.", check: fez("alternado"),
    texto: "No mangue, as casas tinham duas cores que se revezavam. Tomás aprendeu que a trilha só se atravessa quando cada passo muda de cor: nunca pisar duas vezes no mesmo tom seguido.",
  },
  {
    id: "d-pontes", titulo: "Ilhas que se ligam", dica: "Conclua as Pontes de Mangue.", check: fez("pontes"),
    texto: "As ilhas do mangue só se mantinham de pé ligadas por pontes. Cada ilha pedia o seu número de pontes, e nenhuma ponte podia cruzar outra. Tomás chamava isso de equilíbrio da costa.",
  },
  {
    id: "d-trilha", titulo: "Trilha de memória", dica: "Conclua a Trilha Lembrada.", check: fez("trilha"),
    texto: "Quando a luz se apagou de vez, Tomás só tinha a memória do caminho. Ele olhava o mapa por um instante e refazia cada curva de cabeça. Quem esquecia uma curva, voltava ao começo.",
  },
  {
    id: "d-sombra", titulo: "A sombra do outro lado", dica: "Conclua a Sombra Espelhada.", check: fez("sombra"),
    texto: "Tomás notou que a sombra andava sempre do outro lado do espelho. Quem queria acender a lâmpada precisava pensar ao contrário: para ir à direita, a sombra ia à esquerda.",
  },
  {
    id: "d-luar", titulo: "Luz em linhas", dica: "Conclua o Luar de Linhas.", check: fez("luar"),
    texto: "No porto, as lâmpadas se acendiam em fileiras. Tomás descobriu que virar uma fileira inteira ajudava mais do que acender uma lâmpada de cada vez. Mas virar duas vezes a mesma fileira desfazia tudo.",
  },
  {
    id: "d-ar", titulo: "Fôlego contado", dica: "Conclua o Ar Contado.", check: fez("ar"),
    texto: "Tomás mergulhava com pouco ar, e aprendeu a contar cada braçada. As bolhas do fundo eram a única esperança de voltar, e ele sempre planejava o caminho até a próxima.",
  },
  {
    id: "d-chaves", titulo: "Chaves do breu", dica: "Conclua as Chaves do Breu.", check: fez("chaves"),
    texto: "No porto, cada porta trancada tinha a sua chave escondida em algum canto. Tomás aprendeu a procurar a chave antes de forçar a porta, porque uma chave serve para todas as portas da mesma cor.",
  },
  {
    id: "d-viciosa", titulo: "O fogo que se espalha", dica: "Conclua a Brasa Viciosa.", check: fez("viciosa"),
    texto: "Tomás descobriu que a brasa só pegava onde já havia calor ao lado. Uma faísca sozinha se apagava; três juntas faziam a costa inteira queimar.",
  },
  {
    id: "d-vapor", titulo: "Entre as colunas quentes", dica: "Conclua a Coluna de Vapor.", check: fez("vapor"),
    texto: "O vapor subia de uma coluna e depois de outra, sem ordem aparente. Tomás contava os turnos e atravessava sempre que a sua coluna estava fria.",
  },
  {
    id: "d-aquecida", titulo: "Pedra contra o calor", dica: "Conclua a Pedra Aquecida.", check: fez("aquecida"),
    texto: "Uma pedra bem posta barrava o calor como um muro. Tomás protegia cada alvo com o mínimo de pedras, porque cada pedra custava uma tarde de trabalho.",
  },
  {
    id: "d-anel", titulo: "O anel das lamparinas", dica: "Conclua o Anel de Lamparinas.", check: fez("anel"),
    texto: "As lamparinas do porto formavam um anel que girava devagar. Quando as chamas caíam nas marcas, a luz se espalhava por toda a praça.",
  },
  {
    id: "d-fosforo", titulo: "O último fósforo", dica: "Conclua o Fósforo Curto.", check: fez("fosforo"),
    texto: "Os fósforos eram poucos, e cada um acendia uma linha ou uma coluna de lenha. Tomás aprendeu a riscar só o necessário, e a praça inteira acendeu com a última chama.",
  },
  {
    id: "d-tanques", titulo: "Água na medida", dica: "Conclua os Tanques da Chuva.", check: fez("tanques"),
    texto: "Na chuva, Tomás media a água em jarros sem marcas. Aprendeu que, passando de um para outro, sempre sobrava a medida que faltava.",
  },
  {
    id: "d-simetria", titulo: "O espelho do cofre", dica: "Conclua a Simetria do Cofre.", check: fez("simetria"),
    texto: "O cofre do porto tinha os dois lados iguais, como um espelho. Quem pintava um lado precisava pintar o outro, senão o cofre não fechava.",
  },
  {
    id: "d-prateleiras", titulo: "Peso igual", dica: "Conclua as Prateleiras Iguais.", check: fez("prateleiras"),
    texto: "Tomás dividia as cargas entre as estantes até que todas pesassem o mesmo. Ele dizia que o armazém só era justo quando nenhuma prateleira carregava mais que a outra.",
  },
  {
    id: "d-trilhos", titulo: "Chaves da mina", dica: "Conclua os Trilhos da Mina.", check: fez("trilhos"),
    texto: "Os trilhos da mina se bifurcavam a cada chave. Tomás aprendeu a ver o caminho inteiro antes de mexer em qualquer uma, porque uma troca errada mandava a vagoneta para longe.",
  },
  {
    id: "d-caixas", titulo: "Caixas empilhadas", dica: "Conclua a Torre de Caixas.", check: fez("torrecaixas"),
    texto: "Com caixas de três tamanhos, Tomás montava a torre do cais na altura exata. Às vezes uma caixa grande valia por duas pequenas, e ele sempre procurava essa economia.",
  },
  {
    id: "d-alturas", titulo: "Plantas em fila", dica: "Conclua o Jardim de Alturas.", check: fez("alturas"),
    texto: "No jardim do renascer, cada planta tinha uma altura diferente das outras da mesma fila. Tomás lia as pistas das bordas como quem lê as sombras, e sabia quantas se viam de cada lado.",
  },
  {
    id: "d-queda", titulo: "Sementes que caem", dica: "Conclua a Queda de Sementes.", check: fez("queda"),
    texto: "A semente cai até encontrar o chão. Tomás aprendeu a soltar cada uma pela coluna certa, porque uma semente fora da marca era uma flor perdida.",
  },
  {
    id: "d-tinta", titulo: "A cor que se espalha", dica: "Conclua a Tinta de Flor.", check: fez("tinta"),
    texto: "Uma flor de cor espalha a cor para tudo o que é vizinho da mesma cor. Tomás pintava o jardim inteiro com uma só tinta, e cada toque valia pelo que atingia.",
  },
  {
    id: "d-ninho", titulo: "Pássaros no jardim", dica: "Conclua o Ninho de Pássaros.", check: fez("ninho"),
    texto: "Os pássaros do renascer pousavam onde podiam vigiar a horta toda. Tomás aprendeu que um bom vigia não precisa estar em cada casa, só perto delas.",
  },
  {
    id: "d-colheita", titulo: "Sem repetir a casa", dica: "Conclua a Colheita Completa.", check: fez("colheita"),
    texto: "Colher o jardim inteiro sem voltar a nenhuma casa exigia planejamento. Tomás olhava a cerca antes de dar o primeiro passo, e assim nunca ficava preso num canto.",
  },
  {
    id: "d-travessia", titulo: "Os quatro caminhos", dica: "Conclua a Travessia dos Quatro Pontos.", check: fez("travessia"),
    texto: "Tomás carregava um pedaço de cada ramo: a trilha, a brasa, a chave e a semente. Só quando passou por todos eles é que a saída se abriu, porque o porto precisava das quatro coisas juntas.",
  },
  {
    id: "d-bussola", titulo: "A bússola que gira", dica: "Conclua a Bússola Girada.", check: fez("bussola"),
    texto: "No mar final, a bússola de Tomás girava a cada passo. Ele demorou a aceitar que o caminho não mudava: era só a sua mão que precisava aprender outra direção.",
  },
  {
    id: "d-cores", titulo: "Cores em sequência", dica: "Conclua Cores que Não se Repetem.", check: fez("cores"),
    texto: "No último mar, cada casa tinha uma cor, e Tomás aprendeu que andar em linha reta sobre a mesma cor era se perder. Variar era a única maneira de avançar.",
  },
  {
    id: "d-mosaico", titulo: "Luz equilibrada", dica: "Conclua o Mosaico de Luz.", check: fez("mosaico"),
    texto: "O mosaico do farol precisava de metade de luz em cada linha e cada coluna. Tomás aprendeu que três casas seguidas iguais deixavam o conjunto torto, e que o equilíbrio era a forma de a luz durar.",
  },
  {
    id: "d-volta", titulo: "Ida e volta", dica: "Conclua a Volta pelo Mar.", check: fez("volta"),
    texto: "Para voltar do mar final, Tomás precisava de um caminho diferente do da ida. Dois caminhos iguais se cruzariam e se perderiam; só a rota que não se encontra leva de volta para casa.",
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
