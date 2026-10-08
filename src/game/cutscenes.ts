// agua: altura da água (0 a 1). brilho: força da luz (0 a 1)
export type Cena = { texto: string; agua: number; brilho: number };
export type CutsceneInfo = { tipo: "cais" | "biblioteca" | "jardins" | "recife" | "catedral" | "abismo" | "coracao" | "mangue" | "teatro" | "bombas" | "rede" | "mare" | "vento" | "eco" | "cardume" | "coral" | "neblina" | "alavancas" | "memoria" | "perolas" | "setas" | "dominos" | "palavras" | "final" | "tateio" | "apagar" | "acender" | "guardar" | "renascer"; entrada: string; cenas: Cena[] };

export const cutscenes = {
  cais: {
    tipo: "cais",
    entrada: "Toque para entrar no cais",
    cenas: [
      { texto: "Há muito tempo, a cidade de Maré Alta vivia da luz de uma única lanterna.", agua: 0.15, brilho: 1 },
      { texto: "Ela guiava os barcos de volta para casa, noite após noite.", agua: 0.15, brilho: 1 },
      { texto: "Numa madrugada, o mar subiu. Subiu por três noites, e a luz se apagou.", agua: 0.7, brilho: 0.15 },
      { texto: "Os sinos ainda tocam sob a água, mas ninguém responde.", agua: 0.85, brilho: 0 },
      { texto: "Você acorda no cais, com a lanterna fria nas mãos.", agua: 0.85, brilho: 0.1 },
      { texto: "Algo nela ainda lembra de acender.", agua: 0.85, brilho: 0.75 },
    ],
  },
  biblioteca: {
    tipo: "biblioteca",
    entrada: "Toque para entrar na biblioteca",
    cenas: [
      { texto: "Depois do cais, a rua some sob a água até os joelhos.", agua: 0.3, brilho: 0.3 },
      { texto: "No fim dela, uma casa de pedra guarda tudo o que a cidade escreveu sobre si.", agua: 0.3, brilho: 0.5 },
      { texto: "Os livros boiam e as páginas se soltam, mas a tinta resiste.", agua: 0.45, brilho: 0.5 },
      { texto: "Alguém separou quatro registros antes da cheia. Talvez para você.", agua: 0.45, brilho: 0.8 },
      { texto: "Para entender a lanterna, é preciso lembrar em que ordem a cidade a perdeu.", agua: 0.45, brilho: 1 },
    ],
  },
  jardins: {
    tipo: "jardins",
    entrada: "Toque para entrar nos jardins",
    cenas: [
      { texto: "A biblioteca termina num portão coberto de cracas. Do outro lado, o jardim da cidade virou recife.", agua: 0.2, brilho: 0.6 },
      { texto: "O coral cresceu sobre os canteiros e as fontes, em fileiras que parecem muros.", agua: 0.2, brilho: 0.5 },
      { texto: "Enguias patrulham os corredores. Elas seguem a luz como os barcos seguiam a lanterna.", agua: 0.2, brilho: 1 },
      { texto: "Quanto mais a lanterna brilha, de mais longe elas veem você.", agua: 0.2, brilho: 1 },
      { texto: "Para passar, será preciso aprender a andar no escuro.", agua: 0.2, brilho: 0.1 },
    ],
  },
  armazem: {
    tipo: "recife",
    entrada: "Toque para entrar no armazém",
    cenas: [
      { texto: "No fim do porto, um armazém de pedra guarda o lastro de todos os barcos que a lanterna trouxe de volta.", agua: 0.4, brilho: 0.3 },
      { texto: "Cada barco deixava uma pedra com o próprio nome. Pela ordem de peso, o armazém sabia a ordem em que chegaram.", agua: 0.4, brilho: 0.5 },
      { texto: "A água levou os livros e apagou as marcas. Mas as pedras continuam aqui, cada uma com o seu peso.", agua: 0.4, brilho: 0.5 },
      { texto: "Uma balança de dois pratos ainda pende do teto. Está enferrujada, mas continua honesta.", agua: 0.4, brilho: 0.8 },
      { texto: "Compare as pedras. O peso não mente, só engana quem pesa com pressa.", agua: 0.4, brilho: 1 },
    ],
  },
  observatorio: {
    tipo: "coracao",
    entrada: "Toque para subir ao observatório",
    cenas: [
      { texto: "Acima da Sala dos Sinos, uma escada em espiral sobe até uma cúpula de vidro. Mesmo debaixo d'água, ela ainda mostra as estrelas, trêmulas como numa lembrança.", agua: 0.7, brilho: 0.3 },
      { texto: "Os faroleiros vinham aqui para achar o norte quando as nuvens cobriam o céu.", agua: 0.7, brilho: 0.5 },
      { texto: "Três anéis de bronze giram em torno do mesmo eixo. Um arrasta o outro, e o outro arrasta o terceiro, como a lua arrasta a maré.", agua: 0.7, brilho: 0.7 },
      { texto: "Só quando a Estrela estiver no topo dos três anéis o caminho até a superfície vai aparecer.", agua: 0.7, brilho: 0.9 },
      { texto: "Gire com calma. Cada movimento tem uma consequência.", agua: 0.7, brilho: 1 },
    ],
  },
  porao: {
    tipo: "recife",
    entrada: "Toque para descer ao porão",
    cenas: [
      { texto: "No fundo do porto, o casco da Estrela-d'Alva repousa de lado, ainda preso à última corda do cais.", agua: 0.6, brilho: 0.3 },
      { texto: "Foi o último barco a partir antes da cheia. Saiu tão cheio de gente que o mestre mandou trocar a carga por lugares.", agua: 0.6, brilho: 0.5 },
      { texto: "O porão ficou entulhado de caixas. Cada uma que sai do caminho abre espaço para mais um passageiro.", agua: 0.6, brilho: 0.7 },
      { texto: "Empurre, nunca puxe. Uma caixa encostada num canto não volta mais.", agua: 0.6, brilho: 1 },
    ],
  },
  espelhos: {
    tipo: "biblioteca",
    entrada: "Toque para subir à galeria",
    cenas: [
      { texto: "Acima da oficina, uma galeria comprida leva do fundo da torre até a janela da lanterna.", agua: 0.3, brilho: 0.3 },
      { texto: "Tomás mandou pendurar espelhos de prata em cada canto, para a luz subir mesmo quando a lente estava longe.", agua: 0.3, brilho: 0.6 },
      { texto: "Cada espelho vira de um lado para o outro. Com a inclinação certa, o feixe contorna as paredes e chega onde só havia sombra.", agua: 0.3, brilho: 0.8 },
      { texto: "A lente espera no fim do caminho. Siga o feixe com os olhos e gire só o que for preciso.", agua: 0.3, brilho: 1 },
    ],
  },
  eclusa: {
    tipo: "catedral",
    entrada: "Toque para descer às eclusas",
    cenas: [
      { texto: "Abaixo do observatório, a cidade guardava a água em três câmaras de pedra, ligadas por comportas.", agua: 0.6, brilho: 0.3 },
      { texto: "Os eclusários nunca sabiam quanto havia, só quanto cabia. Cada câmara tinha a sua medida riscada na parede.", agua: 0.6, brilho: 0.5 },
      { texto: "Uma comporta só se abria quando a água era exatamente a que o livro pedia. Ninguém abria por pressa.", agua: 0.6, brilho: 0.7 },
      { texto: "Despeje de uma câmara na outra. A água não some: só muda de lugar.", agua: 0.6, brilho: 1 },
    ],
  },
  torre: {
    tipo: "cais",
    entrada: "Toque para subir à torre",
    cenas: [
      { texto: "No ponto mais alto da cidade ainda resta uma torre curta, de pedra, com uma lâmpada de sinais na janela.", agua: 0.5, brilho: 0.3 },
      { texto: "Antes da cheia, Tomás e Lia combinaram uma língua só deles, feita de luz curta e luz longa.", agua: 0.5, brilho: 0.6 },
      { texto: "Pontos e traços. A luz curta é uma batida, a longa é um respiro.", agua: 0.5, brilho: 0.8 },
      { texto: "A água turva engole os sinais fracos. Escute com atenção, repita e então chame.", agua: 0.5, brilho: 1 },
    ],
  },
  recife: {
    tipo: "recife",
    entrada: "Toque para mergulhar no recife",
    cenas: [
      { texto: "Depois dos jardins, o fundo desce e desce. Ali dormem os barcos que a lanterna não conseguiu trazer de volta.", agua: 0.6, brilho: 0.3 },
      { texto: "A luz da cidade se estilhaçou no naufrágio. Cada caco ainda guarda um pouco de calor.", agua: 0.6, brilho: 0.7 },
      { texto: "Seis fragmentos esperam entre os cascos. Mas você está sem fôlego de verdade agora.", agua: 0.6, brilho: 0.5 },
      { texto: "Respire quando achar bolhas e não se perca. O ar não perdoa quem hesita.", agua: 0.6, brilho: 0.9 },
    ],
  },
  oficina: {
    tipo: "biblioteca",
    entrada: "Toque para entrar na oficina",
    cenas: [
      { texto: "Entre o recife e a catedral, uma casinha de tábuas resistiu à cheia. A porta nunca foi trancada.", agua: 0.35, brilho: 0.3 },
      { texto: "Era a oficina do faroleiro. Tomás Vaz passou quarenta anos ali, polindo vidro e trocando pavios.", agua: 0.35, brilho: 0.5 },
      { texto: "Na bancada, a lente da lanterna está desmontada. Alguém tentou consertá-la e não terminou.", agua: 0.35, brilho: 0.6 },
      { texto: "Bilhetes, uma carta e uma receita esperam ao lado das peças. Nem todos dizem a verdade.", agua: 0.35, brilho: 0.8 },
      { texto: "Monte a lente, forje o aro e aponte o feixe. Uma peça errada e a luz não passa.", agua: 0.35, brilho: 1 },
    ],
  },
  sinos: {
    tipo: "catedral",
    entrada: "Toque para escutar os sinos",
    cenas: [
      { texto: "Atrás do altar, uma escada de pedra desce até uma sala redonda. O som chega antes da luz.", agua: 0.6, brilho: 0.2 },
      { texto: "Cinco sinos pendem do teto, presos por correntes grossas de sal e ferrugem.", agua: 0.6, brilho: 0.4 },
      { texto: "Quatro deles já tocaram a vida inteira. Tocavam quando um barco voltava, e a cidade inteira sabia pelo som.", agua: 0.6, brilho: 0.6 },
      { texto: "O quinto sino nunca foi tocado. A corda dele está limpa, como se esperasse por alguém.", agua: 0.6, brilho: 0.8 },
      { texto: "Primeiro aprenda a voz de cada um. Depois afine o quinto, para que ele possa responder.", agua: 0.6, brilho: 1 },
    ],
  },
  catedral: {
    tipo: "catedral",
    entrada: "Toque para entrar na catedral",
    cenas: [
      { texto: "Além dos jardins, uma catedral guarda a nave inteira debaixo d'água.", agua: 0.2, brilho: 0.4 },
      { texto: "A água nunca fica parada. Ela sobe e desce num ciclo que ninguém conseguiu deter.", agua: 0.5, brilho: 0.4 },
      { texto: "Cada mecanismo foi feito para uma altura da maré: um no chão, um no alto, um no meio.", agua: 0.85, brilho: 0.7 },
      { texto: "No altar há uma inscrição. Leia com calma e observe a maré.", agua: 0.5, brilho: 0.5 },
      { texto: "A pressa não abre nada aqui. A água só respeita quem espera a hora certa.", agua: 0.2, brilho: 0.8 },
    ],
  },
  mangue: {
    tipo: "mangue",
    entrada: "Toque para entrar no manguezal",
    cenas: [
      { texto: "Atrás da Cidade Baixa começa o manguezal. As raízes seguram a terra, mas a lama mole não segura ninguém.", agua: 0.5, brilho: 0.3 },
      { texto: "Tomás atravessava por ali em noites de maré grande, deslizando de raiz em raiz, sem parar no lodo.", agua: 0.5, brilho: 0.5 },
      { texto: "Onde a lama é fina, o chão cede e fecha sobre a marca de quem ficou parado.", agua: 0.55, brilho: 0.6 },
      { texto: "Lá na frente, uma boia acende na margem firme. Só existe um jeito de chegar: deslizando com cuidado.", agua: 0.55, brilho: 0.9 },
    ],
  },
  teatro: {
    tipo: "teatro",
    entrada: "Toque para entrar na praça",
    cenas: [
      { texto: "Na praça da Matriz, a cidade contava histórias com um lençol branco e uma lanterna atrás dele.", agua: 0.3, brilho: 0.4 },
      { texto: "Cada lâmpada acendia um pedaço da figura, e as crianças adivinhavam o barco antes do fim.", agua: 0.3, brilho: 0.7 },
      { texto: "Quando a cheia tomou a praça, o lençol ficou sem luz, e o barco da história sumiu da parede.", agua: 0.6, brilho: 0.2 },
      { texto: "Acenda todas as marcas da cena. Só com todas acesas, o barco inteiro volta ao lençol.", agua: 0.6, brilho: 0.9 },
    ],
  },
  bombas: {
    tipo: "bombas",
    entrada: "Toque para entrar na casa das bombas",
    cenas: [
      { texto: "Sob a Estrela-d'Alva, a Casa das Bombas ainda puxava ar para a sineira. Cada tubo mantinha a cidade respirando debaixo d'água.", agua: 0.6, brilho: 0.3 },
      { texto: "Uma válvula aberta empurra a pressão para a próxima. Se uma se fecha, pode fechar as vizinhas também.", agua: 0.6, brilho: 0.5 },
      { texto: "Depois da cheia, as válvulas emperraram umas nas outras, presas em posições erradas.", agua: 0.65, brilho: 0.3 },
      { texto: "Abra todas. A bomba só volta a zumbir quando o último tubo respirar.", agua: 0.65, brilho: 0.9 },
    ],
  },
  rede: {
    tipo: "rede",
    entrada: "Toque para ir ao porto",
    cenas: [
      { texto: "Nas margens do porto, os pescadores estendiam redes para guardar os peixes quando a maré ameaçava.", agua: 0.5, brilho: 0.4 },
      { texto: "Uma rede boa é um laço fechado: começa e termina no mesmo ponto, sem cruzar a si mesma.", agua: 0.5, brilho: 0.6 },
      { texto: "Os peixes que a cheia trouxe ficaram soltos no porto. Ninguém os tirou de lá.", agua: 0.55, brilho: 0.5 },
      { texto: "Trace o laço por fora das pedras e feche em volta de todos os peixes. Quem ficar de fora se perde.", agua: 0.55, brilho: 0.9 },
    ],
  },
  mare: {
    tipo: "mare",
    entrada: "Toque para entrar no canal",
    cenas: [
      { texto: "Entre os cais da Cidade Baixa, a maré não sobe nem desce de uma vez. Ela abre e fecha passagens a cada passo, como se respirasse.", agua: 0.5, brilho: 0.3 },
      { texto: "Tomás aprendeu o ritmo: cada passagem usada vira mar, e o mar vira passagem.", agua: 0.5, brilho: 0.5 },
      { texto: "Quem fica preso numa passagem que fecha afunda no lodo do canal.", agua: 0.55, brilho: 0.4 },
      { texto: "Conte os passos e espere a maré certa. Do outro lado, a Sineira já está acesa.", agua: 0.55, brilho: 0.9 },
    ],
  },
  vento: {
    tipo: "vento",
    entrada: "Toque para subir ao convés",
    cenas: [
      { texto: "No alto do porto, uma vela velha ainda aponta para o farol. O vento da cheia nunca parou de soprar.", agua: 0.3, brilho: 0.4 },
      { texto: "Ele empurra tudo o que se move: a corda, o barco e a cabeça de quem tenta navegar.", agua: 0.3, brilho: 0.6 },
      { texto: "Tomás usava o vento a seu favor: cada passo à frente era seguido de um empurrão que ele precisava prever.", agua: 0.35, brilho: 0.5 },
      { texto: "Leia a próxima rajada antes de cada passo. Quando o último empurrão cair a favor, o farol estará na linha da luz.", agua: 0.35, brilho: 0.9 },
    ],
  },
  eco: {
    tipo: "eco",
    entrada: "Toque para ouvir o Segundo Mar",
    cenas: [
      { texto: "Depois do Coração, a lanterna volta a acender e a cidade ouve algo que não ouvia há séculos: o mar do lado de fora.", agua: 0.4, brilho: 0.4 },
      { texto: "Além das pedras existe um Segundo Mar, aberto e fundo. Tomás escreveu sobre faróis lá fora, apagados há gerações.", agua: 0.45, brilho: 0.5 },
      { texto: "Ninguém os viu de perto. Só o eco de cada um volta até a cidade, cada vez mais fraco e mais distante.", agua: 0.5, brilho: 0.4 },
      { texto: "Chame o mar. O eco vai dizer onde a próxima luz está escondida.", agua: 0.55, brilho: 0.8 },
    ],
  },
  cardume: {
    tipo: "cardume",
    entrada: "Toque para seguir o cardume",
    cenas: [
      { texto: "Depois da escuta, a lanterna encontra o cardume: centenas de peixes que a cheia separou da cidade.", agua: 0.5, brilho: 0.4 },
      { texto: "Os peixes seguem quem se move com firmeza. Se um para antes dos outros, o cardume se desfaz.", agua: 0.5, brilho: 0.5 },
      { texto: "Tomás guiava os peixes de volta ao porto, um movimento de cada vez, todos juntos.", agua: 0.55, brilho: 0.6 },
      { texto: "Mova o cardume inteiro. Cada direção vale para todos os peixes ao mesmo tempo.", agua: 0.55, brilho: 0.9 },
    ],
  },
  coral: {
    tipo: "coral",
    entrada: "Toque para ver o jardim submerso",
    cenas: [
      { texto: "Nas ruínas afundadas, o coral cresceu sobre as casas. Ele só cresce onde já existe vida.", agua: 0.6, brilho: 0.3 },
      { texto: "Tomás escreveu que a cidade precisava de um caminho de volta, e o coral podia ser a ponte.", agua: 0.6, brilho: 0.5 },
      { texto: "Cada novo ramo nasce colado ao que já existe. Nada cresce do nada.", agua: 0.65, brilho: 0.6 },
      { texto: "Plante o coral devagar. Cubra todas as marcas e ele segura a cidade inteira.", agua: 0.65, brilho: 0.9 },
    ],
  },
  neblina: {
    tipo: "neblina",
    entrada: "Toque para entrar na neblina",
    cenas: [
      { texto: "Mais adiante, o mar some numa névoa branca. Nem o eco chega até o outro lado.", agua: 0.6, brilho: 0.3 },
      { texto: "Tomás aprendeu a andar nela contando os passos e lembrando cada casa por onde passou.", agua: 0.6, brilho: 0.4 },
      { texto: "A névoa esconde pedras, correntes e o caminho de volta. Só a memória é firme.", agua: 0.65, brilho: 0.4 },
      { texto: "Ande devagar e guarde o caminho. Em algum lugar da névoa, o farol espera.", agua: 0.65, brilho: 0.7 },
    ],
  },
  alavancas: {
    tipo: "alavancas",
    entrada: "Toque para entrar na cidade baixa",
    cenas: [
      { texto: "A cidade baixa tem portas de ferro, travadas quando a cheia chegou. Algumas ainda guardam o que estava do outro lado.", agua: 0.6, brilho: 0.3 },
      { texto: "As alavancas da parede abrem partes dessas portas. Nenhuma abre tudo sozinha.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás apertava uma, depois outra, até descobrir a ordem certa para cada passagem.", agua: 0.62, brilho: 0.6 },
      { texto: "Aperte as alavancas e observe. O caminho só se abre quando todos os portões do corredor estiverem livres.", agua: 0.62, brilho: 0.9 },
    ],
  },
  memoria: {
    tipo: "memoria",
    entrada: "Toque para abrir a caixa de conchas",
    cenas: [
      { texto: "Numa casa de pedra, uma caixa guarda conchas gravadas com símbolos. Cada uma tem outra igual, em algum lugar da caixa.", agua: 0.55, brilho: 0.3 },
      { texto: "Tomás as separava em pares, e dizia que quem lembrava a posição de cada concha nunca perdia uma amiga.", agua: 0.55, brilho: 0.5 },
      { texto: "A água misturou as conchas, mas os símbolos continuam ali, esperando o olhar certo.", agua: 0.58, brilho: 0.6 },
      { texto: "Vire duas conchas por vez. Se forem iguais, ficam abertas. Se não, lembre onde estão.", agua: 0.58, brilho: 0.9 },
    ],
  },
  perolas: {
    tipo: "perolas",
    entrada: "Toque para ver o colar do porto",
    cenas: [
      { texto: "Na estátua do porto, um colar de pérolas foi tirado do pescoço antes da cheia. Só a forma do fio ficou.", agua: 0.55, brilho: 0.3 },
      { texto: "Os pescadores escreviam o colar com números: quantas pérolas seguidas em cada linha e cada coluna.", agua: 0.55, brilho: 0.5 },
      { texto: "Tomás aprendeu a ler os números antes de tocar em qualquer conta. Sempre começava pelas sequências longas.", agua: 0.58, brilho: 0.6 },
      { texto: "Preencha o colar seguindo as contagens. Quando a forma fechar, a estátua volta a brilhar.", agua: 0.58, brilho: 0.9 },
    ],
  },
  setas: {
    tipo: "setas",
    entrada: "Toque para seguir a correnteza",
    cenas: [
      { texto: "No canal do porto, a correnteza é marcada por setas de pedra, cada uma apontando para onde a água deve ir.", agua: 0.6, brilho: 0.3 },
      { texto: "Mas as setas foram giradas pela cheia. Agora o barco se perde, e cada redemoinho leva de volta ao mesmo ponto.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás girava uma seta de cada vez, sempre seguindo o barco com os olhos até ver onde ele parava.", agua: 0.62, brilho: 0.6 },
      { texto: "Gire as setas com calma. Quando a última apontar para o farol, a correnteza estará do lado certo.", agua: 0.62, brilho: 0.9 },
    ],
  },
  dominos: {
    tipo: "dominos",
    entrada: "Toque para ver o cais das pedras",
    cenas: [
      { texto: "No cais, uma fileira de pedras de coral sustenta o que restou do porto. Cada uma tem um alcance próprio.", agua: 0.6, brilho: 0.3 },
      { texto: "Quando uma tomba, derruba as vizinhas que estão ao seu alcance. Algumas pedras só caem se alguém começar a queda.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás aprendeu a ler a fileira antes de mexer nela: onde a queda para e onde precisa começar de novo.", agua: 0.62, brilho: 0.6 },
      { texto: "Toque numa pedra de pé. Veja a queda se espalhar e escolha a próxima com cuidado.", agua: 0.62, brilho: 0.9 },
    ],
  },
  palavras: {
    tipo: "palavras",
    entrada: "Toque para ler as letras do mar",
    cenas: [
      { texto: "Nas paredes do porto havia nomes escritos com letras de pedra: farol, onda, sino, coral, alga.", agua: 0.55, brilho: 0.3 },
      { texto: "A água apagou quase tudo. Só as letras soltas ficaram, espalhadas no meio de outras que não querem dizer nada.", agua: 0.58, brilho: 0.5 },
      { texto: "Tomás procurava as palavras em todas as direções, na horizontal, na vertical e na diagonal.", agua: 0.6, brilho: 0.6 },
      { texto: "Ache as palavras da cidade. Cada uma que você encontrar volta a ficar escrita no porto.", agua: 0.6, brilho: 0.9 },
    ],
  },
  final2: {
    tipo: "coral",
    entrada: "Toque para acender os faróis",
    cenas: [
      { texto: "Do outro lado da cidade submersa, quatro faróis esperam há gerações. Nenhum deles foi visto de perto.", agua: 0.7, brilho: 0.3 },
      { texto: "O mundo inteiro está debaixo d'água. Só a lanterna da cidade pode salvar todos, e ela já sabe o seu caminho.", agua: 0.75, brilho: 0.5 },
      { texto: "Cada farol tem a sua própria cor, e cada final do Coração escolheu um deles para ser o primeiro.", agua: 0.75, brilho: 0.7 },
      { texto: "Acenda o farol do seu final. Depois, acenda os outros três. A luz vai até o fundo do mar.", agua: 0.8, brilho: 0.9 },
    ],
  },
  silencio: {
    tipo: "apagar",
    entrada: "Toque para entrar no mar sem luz",
    cenas: [
      { texto: "Você escolheu apagar a lanterna. A luz se foi, e o mar fechou em volta da cidade como um manto.", agua: 0.8, brilho: 0.05 },
      { texto: "No escuro, não há faróis para seguir. Só o toque das paredes, uma de cada vez.", agua: 0.8, brilho: 0.05 },
      { texto: "Tomás dizia que o silêncio também é um caminho, e que cada batida ensina onde não se deve voltar.", agua: 0.82, brilho: 0.03 },
      { texto: "Ande com a mão estendida. Quando sentir a saída, ela estará onde o mar deixar.", agua: 0.82, brilho: 0.03 },
    ],
  },
  contagem: {
    tipo: "apagar",
    entrada: "Toque para contar o mar",
    cenas: [
      { texto: "Sem luz, o mar não mostra mais nada. Mas cada casa guarda uma pista: quantas paredes a cercam.", agua: 0.8, brilho: 0.03 },
      { texto: "Tomás passou a contar as paredes em voz baixa, casa por casa, até formar um mapa na cabeça.", agua: 0.82, brilho: 0.03 },
      { texto: "Um número alto quase sempre esconde uma parede ao lado.", agua: 0.82, brilho: 0.04 },
      { texto: "Conte com cuidado. A saída está onde as contas dizem que não há parede.", agua: 0.84, brilho: 0.04 },
    ],
  },
  fio: {
    tipo: "apagar",
    entrada: "Toque para desenrolar o fio",
    cenas: [
      { texto: "Tomás levava um fio de linha amarrado à cintura. Cada passo era um rastro que ele podia seguir de volta.", agua: 0.8, brilho: 0.04 },
      { texto: "Mas o fio também prende. Um caminho que cruza o próprio rastro vira um beco sem volta.", agua: 0.82, brilho: 0.04 },
      { texto: "Tomás aprendeu a escolher cada casa como se fosse a última, e a saída apareceu sem cruzar o fio.", agua: 0.83, brilho: 0.05 },
      { texto: "Deixe o seu fio atrás de você. Chegue à saída sem tocar no que já foi caminho.", agua: 0.84, brilho: 0.05 },
    ],
  },
  pedra: {
    tipo: "apagar",
    entrada: "Toque para atirar no escuro",
    cenas: [
      { texto: "Quando não havia mais luz, Tomás atirava pedras no mar. O som de cada pedra dizia onde a parede estava.", agua: 0.82, brilho: 0.04 },
      { texto: "Uma pedra que bate e volta é uma parede revelada. Uma que cai no vazio é um caminho livre.", agua: 0.83, brilho: 0.04 },
      { texto: "Ele guardava as pedras para os trechos mais difíceis, porque elas nunca voltavam.", agua: 0.84, brilho: 0.05 },
      { texto: "Atire com calma. Cada pedra é uma pergunta feita ao mar.", agua: 0.85, brilho: 0.05 },
    ],
  },
  breu: {
    tipo: "apagar",
    entrada: "Toque para entrar no breu final",
    cenas: [
      { texto: "No último breu do Apagar, a cidade não tem mais luz nenhuma. Só o tato, a memória e algumas pedras.", agua: 0.86, brilho: 0.03 },
      { texto: "Tomás dizia que o breu não é o fim do caminho. É o lugar onde a gente aprende a ver com outras coisas.", agua: 0.86, brilho: 0.04 },
      { texto: "Com poucas pedras, cada batida ensina. Quem bate menos, chega mais perto da saída.", agua: 0.87, brilho: 0.04 },
      { texto: "Feche o breu. A saída está onde você já esteve, e a lanterna sabe onde é.", agua: 0.88, brilho: 0.05 },
    ],
  },
  chama: {
    tipo: "acender",
    entrada: "Toque para acender a costa",
    cenas: [
      { texto: "Você escolheu acender a lanterna. Mas, no mar sem luz, a costa precisa de outro fogo: o da lenha seca.", agua: 0.6, brilho: 0.3 },
      { texto: "Tomás guardava tochas na beira do cais, e sabia onde cada mata de lenha começava e terminava.", agua: 0.6, brilho: 0.5 },
      { texto: "Uma tocha acende um pedaço. O resto corre pelo que estiver ao alcance, e para diante da pedra.", agua: 0.62, brilho: 0.7 },
      { texto: "Acenda a lenha certa e sopre o fogo. Quando a última mata queimar, a luz sobe até o farol.", agua: 0.62, brilho: 0.9 },
    ],
  },
  vela: {
    tipo: "acender",
    entrada: "Toque para acender as velas",
    cenas: [
      { texto: "Nas portas da casa de pedra, as velas de cera guardavam o caminho. Cada uma durava um tempo diferente.", agua: 0.6, brilho: 0.3 },
      { texto: "Só se acende uma vela por vez. E uma vela acesa não volta a ser acesa depois que apaga.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás aprendeu a contar os turnos com as mãos, e a acender na ordem que fazia todas brilharem juntas.", agua: 0.62, brilho: 0.7 },
      { texto: "Escolha a ordem certa. Quando todas as velas brilharem ao mesmo tempo, a porta se abre.", agua: 0.62, brilho: 0.9 },
    ],
  },
  forja: {
    tipo: "acender",
    entrada: "Toque para entrar na forja",
    cenas: [
      { texto: "Na beira do porto, a forja ainda guarda pedras de lastro. Algumas precisam de calor exato para virar lâmina.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada brasa aquece as pedras ao redor. Acender uma sempre esquenta mais do que se imagina.", agua: 0.6, brilho: 0.5 },
      { texto: "O ferreiro dizia que o ponto certo não é o quente: é o quente que para exatamente onde deve parar.", agua: 0.62, brilho: 0.7 },
      { texto: "Acenda as brasas com cuidado. Quando cada pedra estiver no ponto, a lâmina do farol fica pronta.", agua: 0.62, brilho: 0.9 },
    ],
  },
  molhada: {
    tipo: "acender",
    entrada: "Toque para acender a costa molhada",
    cenas: [
      { texto: "A cheia encharcou a lenha da costa. Parte dela ainda seca, parte não.", agua: 0.6, brilho: 0.3 },
      { texto: "Uma tocha na lenha molhada só faz chiar. Tomás aprendeu a reconhecer o chiado e a dar a segunda tocha.", agua: 0.6, brilho: 0.5 },
      { texto: "As tochas são poucas. Cada uma gasta é uma que falta para o farol.", agua: 0.62, brilho: 0.7 },
      { texto: "Acenda a costa com cuidado. Só a lenha que pegar leva a luz até o farol.", agua: 0.62, brilho: 0.9 },
    ],
  },
  brasa: {
    tipo: "acender",
    entrada: "Toque para seguir a brasa",
    cenas: [
      { texto: "No porto, uma brasa viva anda sozinha pelo caminho de pedra, de altar em altar.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada altar é uma chance de atiçá-la. Mas o fogo não espera: passar muitos turnos sem atiçar o apaga.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás dizia que a brasa é como a luz: não se pega à força, se acompanha no tempo certo.", agua: 0.62, brilho: 0.7 },
      { texto: "Espere a brasa chegar ao altar e atice-a. A luz se junta até o farol.", agua: 0.62, brilho: 0.9 },
    ],
  },
  arca: {
    tipo: "guardar",
    entrada: "Toque para entrar no depósito",
    cenas: [
      { texto: "Na beira do porto, um depósito antigo guarda as cargas dos barcos que a cheia deixou para trás.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada carga tem um peso, e cada arca aguenta só até um limite. Nada pode ficar de fora.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás aprendeu a combinar os pesos grandes com os pequenos, para que nenhuma arca sobrasse vazia.", agua: 0.62, brilho: 0.7 },
      { texto: "Guarde todas as cargas. Quanto menos arcas, mais carga chega ao farol.", agua: 0.62, brilho: 0.9 },
    ],
  },
  muralha: {
    tipo: "guardar",
    entrada: "Toque para erguer a muralha",
    cenas: [
      { texto: "Os faróis do mar aberto estão expostos. Cada onda da cheia atravessa a água em linha reta, sem aviso.", agua: 0.6, brilho: 0.3 },
      { texto: "Tomás erguia escudos de madeira e pedra, cada um na frente de um farol, entre a onda e a luz.", agua: 0.6, brilho: 0.5 },
      { texto: "Um escudo bem posto protege a linha inteira. Mas cada farol precisa do seu próprio.", agua: 0.62, brilho: 0.7 },
      { texto: "Erga os escudos com calma. Quando nenhuma onda chegar ao farol, a luz segue inteira.", agua: 0.62, brilho: 0.9 },
    ],
  },
  ganchos: {
    tipo: "guardar",
    entrada: "Toque para ajustar a corrente",
    cenas: [
      { texto: "A corrente que sustenta as comportas do cais tem ganchos numerados. A cheia os embaralhou.", agua: 0.6, brilho: 0.3 },
      { texto: "Os ganchos só se tocam com o vizinho. Não há atalho: cada número precisa atravessar a fila uma troca de cada vez.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás contava as trocas a cada passo, e sabia que cada par fora de ordem custava uma troca a mais.", agua: 0.62, brilho: 0.7 },
      { texto: "Ajuste a corrente com paciência. Quando os ganchos estiverem em ordem, as comportas sobem.", agua: 0.62, brilho: 0.9 },
    ],
  },
  fechadura: {
    tipo: "guardar",
    entrada: "Toque para abrir o cofre",
    cenas: [
      { texto: "No fundo do porto, um cofre de pedra guarda o que os faroleiros não tiveram tempo de levar.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada pino tem três posições. A fechadura não diz qual está certo, apenas quantos estão.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás testava um pino de cada vez, e anotava o que mudava. Assim, uma tentativa ensinava a seguinte.", agua: 0.62, brilho: 0.7 },
      { texto: "Deduza a combinação com cuidado. Quando todos os pinos estiverem certos, o cofre se abre.", agua: 0.62, brilho: 0.9 },
    ],
  },
  selos: {
    tipo: "guardar",
    entrada: "Toque para abrir o cofre dos selos",
    cenas: [
      { texto: "Num cofre de madeira, os faroleiros guardavam selos de três cores. Eles fechavam a costa inteira.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada selo tinha uma regra: nunca encostar num igual. Um só erro desmontava o cofre inteiro.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás conferia os vizinhos antes de cada selo, do mesmo modo que alguém confere os nós de uma corda.", agua: 0.62, brilho: 0.7 },
      { texto: "Preencha o cofre com cuidado. Quando nenhum selo encostar no igual, a chave do farol se revela.", agua: 0.62, brilho: 0.9 },
    ],
  },
  escalada: {
    tipo: "renascer",
    entrada: "Toque para subir a raiz",
    cenas: [
      { texto: "Você escolheu renascer. Da costa submersa, uma raiz começa a crescer para a superfície, degrau por degrau.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada degrau é uma tentativa de vida. Um salto demais quebra a raiz, e a costa precisa recomeçar.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás subia pelas raízes com as mãos, medindo cada degrau antes de pisar.", agua: 0.62, brilho: 0.7 },
      { texto: "Suba com calma. Quanto mais alto a raiz, mais perto a cidade fica da luz do céu.", agua: 0.62, brilho: 0.9 },
    ],
  },
  encaixe: {
    tipo: "renascer",
    entrada: "Toque para fechar a costa",
    cenas: [
      { texto: "A costa do Renascer ainda está aberta: areia e lodo, sem forma. Os corais precisam cobri-la inteira.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada peça de coral tem um formato. Encaixadas, elas não deixam buraco nem se sobrepõem.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás começava pelas peças grandes, e deixava as pequenas para fechar os cantos.", agua: 0.62, brilho: 0.7 },
      { texto: "Encaixe as peças com paciência. Quando a costa se fechar, a vida volta a ocupar o chão.", agua: 0.62, brilho: 0.9 },
    ],
  },
  sementes: {
    tipo: "renascer",
    entrada: "Toque para plantar a horta",
    cenas: [
      { texto: "Na beira do porto, a terra guarda sementes de todas as espécies. Algumas casas têm solo fraco, e nada brota ali.", agua: 0.6, brilho: 0.3 },
      { texto: "Tomás plantava uma semente por linha e uma por coluna, para que nenhuma raiz disputasse o mesmo espaço.", agua: 0.6, brilho: 0.5 },
      { texto: "Os que repetiam linha ou coluna viam as mudas brigarem por luz, e perdiam a horta inteira.", agua: 0.62, brilho: 0.7 },
      { texto: "Plante com cuidado. Quando cada linha e coluna tiver a sua semente, a horta floresce.", agua: 0.62, brilho: 0.9 },
    ],
  },
  alternado: {
    tipo: "renascer",
    entrada: "Toque para seguir a trilha",
    cenas: [
      { texto: "Entre as raízes do mangue, uma trilha de casas claras e escuras leva até a luz.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada passo precisa mudar de cor. Quem pisa duas vezes no mesmo tom se perde na lama.", agua: 0.6, brilho: 0.5 },
      { texto: "Tomás seguia a trilha como quem canta um revezamento: um tom, depois o outro, sem pressa.", agua: 0.62, brilho: 0.7 },
      { texto: "Alterne as cores com cuidado. Quando a saída aparecer, a costa respira de novo.", agua: 0.62, brilho: 0.9 },
    ],
  },
  pontes: {
    tipo: "renascer",
    entrada: "Toque para ligar as ilhas",
    cenas: [
      { texto: "O mangue é feito de ilhas separadas pela água. Sem pontes, nenhuma delas alcança a costa.", agua: 0.6, brilho: 0.3 },
      { texto: "Cada ilha tem um número: quantas pontes precisa para se manter ligada aos vizinhos.", agua: 0.6, brilho: 0.5 },
      { texto: "As pontes não podem se cruzar. Tomás dizia que a costa só aguenta o que não se atravessa.", agua: 0.62, brilho: 0.7 },
      { texto: "Ligue as ilhas com o número exato. Quando todas estiverem ligadas, o mangue se sustenta.", agua: 0.62, brilho: 0.9 },
    ],
  },
  abismo: {
    tipo: "abismo",
    entrada: "Toque para enfrentar a corrente",
    cenas: [
      { texto: "A catedral termina num poço. Dele sobe a corrente que mantém a cidade presa no fundo.", agua: 0.8, brilho: 0.3 },
      { texto: "Destroços de todos os séculos caem por ali, empurrados de um lado para o outro.", agua: 0.8, brilho: 0.4 },
      { texto: "Não há como lutar contra o mar. Só como aguentar até ele mudar de ideia.", agua: 0.8, brilho: 0.6 },
      { texto: "Fique em movimento e proteja o casco.", agua: 0.8, brilho: 1 },
    ],
  },
  coracao: {
    tipo: "coracao",
    entrada: "Toque para encarar o Guardião",
    cenas: [
      { texto: "No centro da cidade, a lanterna original ainda pulsa, presa num coração de vidro e coral.", agua: 0.9, brilho: 0.5 },
      { texto: "Quem a guarda não tem rosto. Tem só uma voz, feita de quatro luzes.", agua: 0.9, brilho: 0.8 },
      { texto: "O Guardião não quer lutar. Quer saber se você ouviu a cidade até aqui.", agua: 0.9, brilho: 0.9 },
      { texto: "O que você decidir fazer com a luz, o mar vai lembrar.", agua: 0.9, brilho: 1 },
    ],
  },
} satisfies Record<string, CutsceneInfo>;

export type CenaId = keyof typeof cutscenes;
