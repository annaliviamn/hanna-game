# Hanna

A cozy virtual pet experience built with HTML, CSS and Vanilla JavaScript.

> Mobile-first virtual pet game inspired by Tamagotchi and cozy farming games.

---

## Sobre

**Hanna** é um jogo mobile de gatinha virtual no estilo *cozy*, inspirado em Tamagotchi e Stardew Valley. O jogador cuida da Hanna — alimentando, dando carinho, colocando pra dormir, dando banho — e vai construindo um vínculo ao longo do tempo.

Foi desenvolvido inteiramente do zero como presente especial, com foco em uma experiência mobile-first, instalável como PWA, com save na nuvem via Firebase.

---

## Recursos

- **Gatinha virtual** com sprites animados e expressões variadas reagindo ao humor e aos cuidados
- **Sistema de status** — Fome, Felicidade, Energia, Higiene e Vínculo
- **Save na nuvem** — progresso sincronizado entre dispositivos via Firebase Auth + Firestore
- **Gatinha parceira** desbloqueável com sistema de vínculo, momentos especiais conjuntos e risco de ir embora se negligenciada
- **Sistema de gravidez e filhotinho** — evento raro que desencadeia uma gravidez de 9 dias reais, com sprites temáticas e nascimento com escolha de nome e gênero
- **Fazenda** — plante sementes, cuide e colha plantas pra ganhar moedas
- **Roleta diária** — gire uma vez por dia pra ganhar prêmios variados
- **Loja completa** — itens pra Hanna, gatinha parceira, filhotinho e visitantes especiais
- **Pets visitantes** — Steve, João Antônio e James Cook aparecem de surpresa com falas e sprites próprias
- **Visitas especiais** — personagens reais desbloqueáveis que aparecem com mensagens personalizadas
- **Sistema de fila de visitas** — garante variedade e evita repetição de visitantes
- **16 minigames** — Memória das Patas, Dominó, Adivinhe o Humor, Reflexo Felino, Cartinhas, Operação Sardinha, Hanna Crush (Match-3), Palavras da Hanna (Wordle), Bolinha de Lã, Caça-Palavras, Missão do Steve, James e a Despensa, João e as Prateleiras, Quebra-Cabeça (10 níveis), Troca de Recados, Esconde-Esconde e Colorindo com a Hanna
- **Colorindo com a Hanna** — minigame relaxante com flood fill, zoom por pinch/scroll, paleta expandida e sistema de duas camadas de canvas
- **Sistema de conquistas** — troféus organizados por categoria (cuidados, progressão, minigames, momentos especiais)
- **Notificações de visitas** — banner deslizante com som de campainha ao receber visitas
- **Ciclo de dia/noite** com overlays visuais e eventos especiais
- **Modo escuro/claro** persistente na nuvem
- **Trilhas sonoras** por tela com fade in/out suave
- **PWA** — instalável como app no Android e iOS sem loja

---

## Tecnologias

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

- HTML5, CSS3, Vanilla JavaScript
- Firebase Auth + Firestore (autenticação e save na nuvem)
- Service Workers + Cache API
- Web Audio API
- Canvas API (minigame de colorir)
- LocalStorage
- Progressive Web App (PWA)

---

## Instalação

**Android:**
1. Abra o link no Chrome
2. Aguarde o banner "Adicionar à tela inicial" aparecer
3. Toque em instalar — pronto!

**iOS:**
1. Abra o link no Safari
2. Toque no botão de compartilhar (quadrado com seta)
3. Selecione "Adicionar à Tela de Início"

> ⚠️ No iOS, notificações push só funcionam com o app em foreground ou minimizado — é uma limitação do sistema operacional da Apple para PWAs.

---

## Desenvolvimento Local

Não precisa de nenhuma instalação. Basta clonar e abrir:

```bash
git clone https://github.com/annaliviamn/hanna-game.git
cd hanna-game
```

Abre o `index.html` no navegador — ou usa uma extensão como **Live Server** no VS Code pra ter o Service Worker funcionando corretamente.

---

## Estrutura do Projeto
hanna-game/
├── index.html
├── script.js
├── estilo.css
├── manifest.json
├── sw.js
├── firebase.js
├── assets/
│   ├── sprites/
│   │   ├── hanna/            # sprites da Hanna
│   │   ├── gatinha/          # sprites da gatinha parceira
│   │   ├── hanna-gatinha/    # sprites conjuntas e momentos especiais
│   │   ├── filhote/          # sprites do filhotinho
│   │   ├── familia/          # sprites de família completa
│   │   ├── colorir/          # desenhos do minigame de colorir
│   │   ├── personagens/      # sprites das visitas especiais
│   │   └── pets/             # sprites dos pets visitantes
│   ├── shop/                 # ícones da loja
│   ├── ui/                   # ícones de interface
│   ├── icons/                # ícones PWA
│   └── music/                # trilhas e efeitos sonoros

---

## Aprendizados

Este projeto foi um grande laboratório prático. Alguns dos conceitos aplicados:

- Arquitetura de um jogo em JS puro sem game engine
- Gerenciamento de estado global com variáveis, LocalStorage e Firestore
- Autenticação e sincronização de dados com Firebase Auth + Firestore
- Canvas API com flood fill, sistema de camadas e zoom touch/scroll
- Service Workers e PWA com instalação nativa
- Sistema de trilhas sonoras com fade entre telas
- Animações CSS complexas (float, shake, bounce, pulse)
- Design mobile-first com foco em UX tátil
- Depuração de bugs em contexto PWA no iOS e Android

---

## Notas

This project started as a personal gift and gradually evolved into a complete cozy mobile experience focused on interaction, atmosphere and emotional design.