# Hanna

A cozy virtual pet experience built with HTML, CSS and Vanilla JavaScript.

> Mobile-first virtual pet game inspired by Tamagotchi and cozy farming games.

---

## Sobre

**Hanna** é um jogo mobile de gatinha virtual no estilo *cozy*, inspirado em Tamagotchi e Stardew Valley. O jogador cuida da Hanna — alimentando, dando carinho, colocando pra dormir, dando banho — e vai construindo um vínculo ao longo do tempo.

Foi um projeto desenvolvido inteiramente do zero como presente especial, com foco em uma experiência mobile-first, instalável como PWA.

---

## Recursos

- **Gatinha virtual** com sprites animados e expressões variadas
- **Sistema de status** — Fome, Felicidade, Energia, Higiene e Vínculo
- **Eventos aleatórios** — a Hanna reage ao tempo, humor e ao dia com eventos visuais únicos
- **Fazenda** — plante sementes, cuide e colha plantas pra ganhar moedas. O girassol é raro e vale mais!
- **Lojinha** — gaste moedas em comidas, brinquedos e mimos que melhoram os status da Hanna, além de um pack de sementes
- **6 minigames** — Memória das Patas, Dominó com a Hanna, Adivinhe o Humor, Reflexo Felino, Cartinhas da Hanna e Operação Sardinha
- **Gatinha parceira** desbloqueável com sistema de vínculo, momentos especiais conjuntos e risco de ir embora se negligenciada
- **Sistema de conquistas** — troféus desbloqueáveis por ações e marcos do jogo
- **Lembretes** com notificações push via Service Worker
- **Ciclo de dia/noite** com overlays visuais e eventos especiais
- **Chuva aleatória** com som ambiente
- **Trilhas sonoras** por tela com fade in/out suave
- **Modo escuro** persistente
- **PWA** — instalável como app no Android e iOS sem loja

---

## Tecnologias

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

- HTML5
- CSS3
- Vanilla JavaScript
- Service Workers + IndexedDB
- Web Audio API
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
git clone https://github.com/annaliviam_/hanna-game.git
cd hanna-game
```

Abre o `index.html` no navegador — ou usa uma extensão como **Live Server** no VS Code pra ter o Service Worker funcionando corretamente.

---

## Estrutura do Projeto

```
hanna-game/
├── index.html
├── script.js
├── style.css
├── manifest.json
├── sw.js
├── assets/
│   ├── sprites/
│   │   ├── hanna/          # sprites da Hanna (neutra, feliz, triste...)
│   │   ├── gatinha/        # sprites da gatinha parceira
│   │   └── hanna-gatinha/  # sprites conjuntas
│   ├── farm/               # sprites da fazenda
│   ├── shop/               # ícones da loja
│   ├── ui/                 # ícones de interface e corações
│   ├── icons/              # ícones PWA (192x192, 512x512)
│   └── music/              # trilhas e efeitos sonoros
```

---

## Aprendizados

Este projeto foi um grande laboratório prático. Alguns dos conceitos aplicados:

- Arquitetura de um jogo em JS puro sem game engine
- Gerenciamento de estado global com variáveis e LocalStorage
- Service Workers, IndexedDB e notificações push
- PWA com manifest e instalação nativa
- Sistema de trilhas sonoras com fade entre telas
- Animações CSS complexas (float, shake, bounce, pulse)
- Design mobile-first com foco em UX tátil
- Depuração de bugs em contexto PWA no iOS

---

## Notas

This project started as a personal gift and gradually evolved into a complete cozy mobile experience focused on interaction, atmosphere and emotional design.
