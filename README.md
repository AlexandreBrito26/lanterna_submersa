# Lanterna Submersa

Jogo narrativo de exploração e puzzles, 100% front-end (React, Pixi.js, Zustand, Framer Motion, Howler).

```bash
npm install
npm run dev
```

## Fases e tipos de vitória
| # | Fase | Vitória |
|---|------|---------|
| 1 | Cais Afundado | Exploração: chave + conchas opcionais |
| 2 | Biblioteca Alagada | Dedução: ordenar a história |
| 3 | Jardins de Coral | Furtividade: chegar sem ser visto |
| 4 | Recife dos Naufrágios | Coleta: fragmentos antes do ar acabar |
| 5 | Catedral das Marés | Sincronia: mecanismos na maré certa |
| 6 | Correntes do Abismo | Sobrevivência: resistir até a corrente acalmar |
| 7 | Coração da Lanterna | Duelo de sequência + 3 finais |

Cada fase dá de 1 a 3 estrelas e guarda o melhor tempo. Saves antigos (v1) são migrados.

## Estrutura
- `src/store`: estado (Zustand) e validação/migração do save (Zod)
- `src/phases`: dados e cenas de cada fase (`data.ts` lista os tipos de vitória)
- `src/components`: Menu, Cabecalho, Resultado (confete), Estrelas, Cutscene
- `src/game`: áudio, dificuldade, helpers de Pixi (`pixiBase.ts`) e paleta

## Deploy na Vercel
Suba para o GitHub e importe em vercel.com. O Vite é detectado automaticamente.

## Extras (v2.1)
- **Medalhas**: 14 conquistas em `src/game/conquistas.ts`, com aviso na tela e galeria no menu.
- **Maré Infinita**: modo sem fim das Correntes do Abismo, liberado após concluir a fase. Guarda o recorde.
- **Música**: trilha sintetizada por fase em `src/game/musica.ts` (sem arquivos de áudio), mais efeitos novos (medalha, pancada, bolha). Dá para desligar a trilha em Ajustes.

## Mecânicas e arte (v2.2)
- **Cais**: Interagir longe de objetos emite um *sonar* que revela as conchas.
- **Jardins**: tecla F / botão lança uma *isca de plâncton* que desvia as enguias (recarga de 9s).
- **Arte por fase**: `Tela.tsx` aplica um acabamento próprio (`.grade-*` em `index.css`): dourado pixelado no Cais, coral violáceo nos Jardins, ferrugem granulada no Recife, azul gelado e vinheta no Abismo.
- **Biblioteca**: a tinta escorre; segure o registro para lê-lo.
- **Catedral**: a maré é irregular, puxada pela lua; leia o ritmo antes de agir.
- **Coração**: o último canto deve ser repetido de trás para frente.
- **Recife**: prender o fôlego (Espaço) gasta menos ar, mas você nada devagar.
- **Abismo**: a âncora (Espaço) para a corrente por poucos segundos e recarrega devagar.
