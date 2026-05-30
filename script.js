// SERVICE WORKER + NOTIFICAÇÕES
let swRegistration = null;

async function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register("sw.js");
    console.log("✅ Service Worker registrado");
  } catch (e) {
    console.warn("SW não registrado:", e);
  }
}

async function pedirPermissaoNotificacao() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Envia mensagem pro SW agendar a notificação
function agendarNotificacaoSW(lembrete) {
  if (!swRegistration || !lembrete.timestamp) return;
  swRegistration.active?.postMessage({
    tipo:      "AGENDAR_LEMBRETE",
    id:        lembrete.id,
    texto:     lembrete.texto,
    timestamp: lembrete.timestamp,
  });
}

// Cancela notificação agendada
function cancelarNotificacaoSW(id) {
  if (!swRegistration) return;
  swRegistration.active?.postMessage({ tipo: "CANCELAR_LEMBRETE", id });
}

// Inicia tudo
registrarSW();

// VIBRAÇÃO

function vibrar(ms = 20) {

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(ms);

    }

}

// SLIDESHOW TELA INICIAL

  const hannaInicial =
  document.getElementById("hannaInicial");

  const spritesInicio = [

      "assets/sprites/hanna/neutra.png",

      "assets/sprites/hanna/feliz.png",

      "assets/sprites/hanna/contente.png",

      "assets/sprites/hanna/curiosa.png",

      "assets/sprites/hanna/apaixonada.png"

  ];

  let spriteAtualInicio = 0;

  setInterval(() => {

      spriteAtualInicio++;

      if (
          spriteAtualInicio >=
          spritesInicio.length
      ) {

          spriteAtualInicio = 0;

      }

      hannaInicial.style.opacity =
      "0";

      setTimeout(() => {

          hannaInicial.src =
          spritesInicio[
              spriteAtualInicio
          ];

          hannaInicial.style.opacity =
          "1";

      }, 450);

  }, 4200);

// ESTRELINHAS TELA INICIAL
;(function criarEstrelas() {
  const container = document.getElementById("estrelinhas");
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("div");
    s.className = "estrela";
    s.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --dur:${1.5 + Math.random()*2.5}s;
      --delay:${Math.random()*3}s;
      width:${Math.random()<0.4?6:4}px;
      height:${Math.random()<0.4?6:4}px;
    `;
    container.appendChild(s);
  }
})();

// SISTEMA DE TRILHAS SONORAS

const trilhas = {
  menu:       document.getElementById("musicaMenu"),
  casa:       document.getElementById("musicaCasa"),
  fazenda:    document.getElementById("musicaFazenda"),
  loja:       document.getElementById("musicaLoja"),
  lembretes:  document.getElementById("musicaLembretes"),
  minigames:  document.getElementById("musicaMinigames"),
  arena:      document.getElementById("musicaArena"),
  pedido:     document.getElementById("musicaPedido"),
};

// Volume padrão de todas as trilhas (0.0 a 1.0)
Object.values(trilhas).forEach(t => { if (t) t.volume = 0.4; });

let trilhaAtual = null;

/**
 * Troca suavemente a trilha sonora.
 * @param {string|null} nome  - chave de `trilhas`, ou null para silenciar tudo
 */
let _fadeOutTimer = null;
let _fadeInTimer  = null;

function tocarTrilha(nome) {

  // Já tocando a mesma — não faz nada
  if (
    trilhaAtual === nome &&
    trilhas[nome] &&
    !trilhas[nome].paused
  ) return;

  const VOLUME_ALVO = 0.4;

  // Cancela fades anteriores
  clearInterval(_fadeOutTimer);
  clearInterval(_fadeInTimer);

  // Para TODAS as trilhas imediatamente (exceto a que vai tocar)
  Object.values(trilhas).forEach(audio => {
    if (!audio) return;
    audio.pause();
    audio.volume = VOLUME_ALVO;
  });

  trilhaAtual = nome;

  if (!nome || !trilhas[nome] || isMuted) return;

  const nova = trilhas[nome];
  nova.volume = 0;
  nova.currentTime = 0;
  nova.play().catch(() => {});

  _fadeInTimer = setInterval(() => {
    if (nova.volume < VOLUME_ALVO - 0.01) {
      nova.volume = Math.min(VOLUME_ALVO, nova.volume + 0.02);
    } else {
      nova.volume = VOLUME_ALVO;
      clearInterval(_fadeInTimer);
    }
  }, 80);

}

// visibilitychange gerenciado no bloco de áudio mais abaixo

// ELEMENTOS 
const mensagem          = document.getElementById("mensagem");
const hannaSprite       = document.getElementById("hannaSprite");
const eventoNoite       = document.getElementById("eventoNoite");
const zzzContainer      = document.getElementById("zzzContainer");
const gatinhaSprite     = document.getElementById("gatinhaSprite");
const nomeDaGatinhaTexto  = document.getElementById("nomeGatinha");

const gatinhaContainer  = document.getElementById("gatinhaContainer");

const btnCarinho        = document.getElementById("btnCarinho");
const btnComida         = document.getElementById("btnComida");
const btnDormir         = document.getElementById("btnDormir");
const btnPlantar        = document.getElementById("btnPlantar");
const balaoFazenda      = document.getElementById("balaoFazenda");
const btnEntrar         = document.getElementById("btnEntrar");
const btnMinigames      = document.getElementById("btnMinigames");
const btnBanho          = document.getElementById("btnBanho");
const navConfig         = document.getElementById("navConfig");
const telaConfig        = document.getElementById("telaConfig");
const btnVoltarConfig   = document.getElementById("btnVoltarConfig");
const btnCarta          = document.getElementById("btnCarta");
const inputNomeGatinha  = document.getElementById("inputNomeGatinha");
const btnSalvarNomeGatinha = document.getElementById("btnSalvarNomeGatinha");
const btnModoNoturno    = document.getElementById("btnModoNoturno");
// Volume fixo — sliders removidos, valores padrão constantes
const volumeMusica  = { value: "0.4" };
const volumeEfeitos = { value: "0.7" };
const telaCarta         = document.getElementById("telaCarta");
const btnVoltarCarta    = document.getElementById("btnVoltarCarta");
const saldoLoja         = document.getElementById("saldoLoja");

const telaInicial       = document.getElementById("telaInicial");
const telaJogo          = document.getElementById("telaJogo");
const telaBanho         = document.getElementById("telaBanho");
const telaMinigames     = document.getElementById("telaMinigames");
const telaArena         = document.getElementById("telaArena");
const arenaConteudo     = document.getElementById("arenaConteudo");
const arenaTitulo       = document.getElementById("arenaTitulo");
const arenaScore        = document.getElementById("arenaScore");

// Pedido Hanna
const textoPedido = document.getElementById("textoPedido");
const btnSimPedido = document.getElementById("btnSimPedido");
const btnNaoPedido = document.getElementById("btnNaoPedido");
const telaPedido = document.getElementById("telaPedido");

// Pedido Real
const telaPedidoReal = document.getElementById("telaPedidoReal");
const textoPedidoReal = document.getElementById("textoPedidoReal");
const btnSimReal = document.getElementById("btnSimReal");
const btnNaoReal = document.getElementById("btnNaoReal");

// Pedido Hanna
btnSimPedido.addEventListener("click", () => {

    abrirPedidoReal();

});

// Pedido Real
btnSimReal.addEventListener("click", () => {

    btnSimReal.style.display = "none";

    btnNaoReal.style.display = "none";

    iniciarFinalRomantico();

});

btnNaoReal.addEventListener("click", () => {

    textoPedidoReal.textContent +=

    "\n\n😾 resposta errada, tente novamente.";

});

let intervaloPedidoReal;

function escreverPedidoReal(
texto,
mostrarBotao = false
) {

    textoPedidoReal.textContent =
    "";

    let i = 0;

    clearInterval(intervaloPedidoReal);

    intervaloPedidoReal =
    setInterval(() => {

        textoPedidoReal.textContent +=
        texto.charAt(i);

        textoPedidoReal.scrollTop =
        textoPedidoReal.scrollHeight;

        i++;

        if (i >= texto.length) {

            clearInterval(intervaloPedidoReal);

            if (mostrarBotao) {

                btnSimReal.style.display =
                "block";

                btnNaoReal.style.display =
                "block";

            }

        }

    }, 45);

}

function abrirPedidoReal() {

    telaPedido.style.display =
    "none";

    telaPedidoReal.style.display =
    "flex";

    btnSimReal.style.display = "none";
    btnNaoReal.style.display = "none";

    // Esconde o botão de aceitar até o texto terminar
    const btnAceitar =
    document.getElementById("btnAceitarPedido");

    if (btnAceitar) {

        btnAceitar.style.display = "none";

    }

    escreverPedidoReal(

`E na verdade...

talvez esse pedido
não fosse só delas... 💖

    Kika Simplicio, este jogo foi inspirado em nós, e olha que coisa, tudo começou justamente porque alguém, com um belo par de olhos castanhos, me enviou um belo gatinho pretinho, e daí surgiu a hAnna que virou Hanna nesse game, que nada mais é do que uma celebração de tudo o que sentimos. E também vale ressaltar que a ideia do jogo veio de uma frase sua no nosso grupo, você dizia que estava querendo jogar algo novo, ou stardew valley comigo, e aí veio tudo na minha cabeça... “vou criar um jogo pra minha amada com tudo o que gostamos e eu que lute hahaha”.

    Desde o dia em que te revelei meus sentimentos, não teve um único dia que não pensei em você, em nós, e conforme as coisas foram avançando eu sentia uma energia e felicidade maravilhosa, talvez seja porque você exala essa energia, sério, é só eu falar com você que eu sinto minha “bateria” ser recarregada haha. Será que um belo sotaque recifense tenha esse poder, talvez sim hein! Já diria as Anavitoria e “meus males se vão com tua voz”, elas estavam muito certas nessa bela canção, que aliás combina demais com a gente, pois você me mandou ela e sinto que a letra é recíproca demais, pois como eu disse, é só te ouvir e minha bateria recarrega e fico toda serelepe kkkk.

    Eu sei que sempre apronto coisas mirabolantes pra poder fazer você sorrir, às vezes até chorar (prendam essa criminosa!!!), mas é que tem algo em “kanna” que me desperta um lado aprontão nível 10, não acho que essa bela morena recifense mereça nada “básico”, ela merece tudo do melhor pra soltar um sorriso de canto a canto, como ela tá fazendo justamente agora lendo esse texto hehe (me diz que tá sorrindo, prfv).

    Bom, volto aqui a frisar o quanto eu gosto do seu jeito, do seu humor, do seu gosto musical extremamente variado kkkk, da sua voz, da sua amizade, do seu cuidado comigo e com minha família, e obviamente, eu amo o jeito que você demonstra seus sentimentos por mim, não é tão escrachada como eu, mas é muito fofo, amo quando me chama de apelidinhos fofos, então, eu amo que eu amo você no geral, não é mesmo?!

    Com tudo isso dito, queria aproveitar esse espaço e te perguntar uma coisa bem importante, momento de limpar as lágrimas hein hahaha. Mas Kika, meu bemzinho...

...

Você aceita namorar comigo? 💍`,

true

    );


}

let scoreAtual = 0;

function abrirArena(titulo) {
    document.querySelector(".bottomNav")
.style.display = "none";

  arenaTitulo.textContent = titulo;
  arenaScore.textContent  = 0;
  scoreAtual = 0;
  telaMinigames.style.display = "none";
  telaArena.style.display     = "block";
  animarTela(telaArena);
  tocarTrilha("arena");
  window.scrollTo(0, 0);
}

function voltarParaMenu() {

  document.querySelector(".bottomNav")
  .style.display = "flex";

  pararJogoAtivo();

  abrirTela(telaMinigames);

  animarTela(telaMinigames);

  arenaConteudo.innerHTML     = "";

  tocarTrilha("minigames");

  window.scrollTo(0, 0);
}

function voltarParaJogo() {

  document.querySelector(".bottomNav")
  .style.display = "flex";

  pararJogoAtivo();

  abrirTela(telaJogo);

  arenaConteudo.innerHTML      = "";

  tocarTrilha("casa");

  window.scrollTo(0, 0);
}

// Referência ao jogo rodando (para limpar timers)
let jogoAtivo = { timers: [], intervals: [] };

function pararJogoAtivo() {
  jogoAtivo.timers.forEach(t => clearTimeout(t));
  jogoAtivo.intervals.forEach(i => clearInterval(i));
  jogoAtivo = { timers: [], intervals: [] };
}

function esconderTodasAsTelas() {

    telaJogo.style.display = "none";

    telaLoja.style.display = "none";

    telaLembretes.style.display = "none";

    telaFazenda.style.display = "none";

    telaMinigames.style.display = "none";

    telaConfig.style.display = "none";

    telaCarta.style.display = "none";

    telaArena.style.display = "none";

}

function abrirTela(tela) {

    esconderTodasAsTelas();

    tela.style.display = "block";

    window.scrollTo(0, 0);

}

// GANHAR MOEDAS

function ganharMoedas(qtd) {

  moedas += qtd;

  scoreAtual += qtd;

  arenaScore.textContent = scoreAtual;

  atualizarStatus();

  const som =
  document.getElementById("somMoeda");

  if (som) {

    som.currentTime = 0;

    som.volume =
    parseFloat(
        volumeEfeitos.value
    );

    som.play();

  }


  // EFEITO VISUAL
  const container = document.getElementById("efeitosMoedas");

  for (let i = 0; i < Math.min(qtd, 8); i++) {

    const moeda = document.createElement("div");

    moeda.className = "moeda-float";

    moeda.textContent = "🪙";

    moeda.style.left =
      (window.innerWidth / 2 + (Math.random() * 120 - 60))
      + "px";

    moeda.style.top =
      (window.innerHeight / 2 + (Math.random() * 60 - 30))
      + "px";

    container.appendChild(moeda);

    setTimeout(() => {

      moeda.remove();

    }, 1200);

  }

}

function criarParticulas(emoji = "💖", quantidade = 6) {

    const container =
    document.getElementById("efeitosParticulas");

    for (let i = 0; i < quantidade; i++) {

        const p = document.createElement("div");

        p.className = "particula";

        p.style.setProperty(
        "--duracao",
        (2 + Math.random() * 2) + "s"
        );

        p.style.setProperty(
        "--x",
        (Math.random() * 60 - 30)
        );

        p.textContent = emoji;

        const rect = hannaSprite.getBoundingClientRect();

        let ajusteX = 0;

        // SPRITE DORMINDO COM GATINHA

        if (
            hannaSprite.src.includes("dormindo")
        ) {

            ajusteX = 75;

        }

        p.style.left =
        (
            rect.left +
            rect.width / 2 +
            ajusteX +
            (Math.random() * 50 - 25)
        )
        + "px";

        p.style.top =
        (rect.top + 40 +
        (Math.random() * 30 - 15))
        + "px";

        container.appendChild(p);

        setTimeout(() => {

            p.remove();

        }, 4000);

    }

}

// TELA DE RESULTADO

function mostrarResultado(titulo, emoji, ganhou, desc, jogoFn) {
  pararJogoAtivo();
  arenaConteudo.innerHTML = `
    <div class="resultado-card">
      <div class="resultado-emoji">${emoji}</div>
      <div class="resultado-titulo">${titulo}</div>
      <div class="resultado-moedas">🪙 +${ganhou} moedas</div>
      <div class="resultado-desc">${desc}</div>
      <div class="resultado-btns">
        <button class="btn-resultado-jogar" id="btnJogarDenovo">Jogar de novo</button>
        <button class="btn-resultado-sair"  id="btnSairJogo">Sair</button>
      </div>
    </div>`;

  document.getElementById("btnJogarDenovo").onclick = () => {
    arenaConteudo.innerHTML = "";
    scoreAtual = 0;
    arenaScore.textContent = 0;
    jogoFn();
  };
  document.getElementById("btnSairJogo").onclick = voltarParaMenu;
}

function jogoMemoria() {
  abrirArena("Memória das Patas");

  arenaConteudo.innerHTML = `
    <div class="memoria-instrucao">Observe a sequência<br>e repita na ordem!</div>
    <div class="memoria-nivel" id="memNivel">Nível 1</div>
    <div class="memoria-hanna">
      <img src="assets/sprites/hanna/curiosa.png" id="memHanna">
    </div>
    <div class="memoria-grid">
      <button class="memoria-btn" data-cor="rosa">🐾</button>
      <button class="memoria-btn" data-cor="roxo">⭐</button>
      <button class="memoria-btn" data-cor="verde">🌸</button>
      <button class="memoria-btn" data-cor="amarelo">🐟</button>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--text-light);font-weight:700;" id="memStatus">Preparando...</div>`;

  const btns   = arenaConteudo.querySelectorAll(".memoria-btn");
  const hanna  = document.getElementById("memHanna");
  const status = document.getElementById("memStatus");
  const nivel  = document.getElementById("memNivel");

  let sequencia = [];
  let vez       = [];
  let bloqueado = true;
  let nivelAtual = 1;

  const cores = ["rosa", "roxo", "verde", "amarelo"];

  function acenderBtn(cor, dur = 500) {
    const b = arenaConteudo.querySelector(`[data-cor="${cor}"]`);
    b.classList.add("aceso");
    hanna.classList.add("flash");
    jogoAtivo.timers.push(setTimeout(() => {
      b.classList.remove("aceso");
      hanna.classList.remove("flash");
    }, dur));
  }

  function tocarSequencia() {
    bloqueado = true;
    status.textContent = "Observe...";
    let delay = 500;
    sequencia.forEach((cor, i) => {
      jogoAtivo.timers.push(setTimeout(() => {
        acenderBtn(cor, 450);
        if (i === sequencia.length - 1) {
          jogoAtivo.timers.push(setTimeout(() => {
            bloqueado = false;
            status.textContent = "Sua vez! Repita a sequência!";
          }, 600));
        }
      }, delay * (i + 1)));
    });
  }

  function proximoNivel() {
    nivelAtual++;
    nivel.textContent = `Nível ${nivelAtual}`;
    const novaCor = cores[Math.floor(Math.random() * cores.length)];
    sequencia.push(novaCor);
    vez = [];
    ganharMoedas(25);
    hanna.src = "assets/sprites/hanna/contente.png";
    jogoAtivo.timers.push(setTimeout(() => {
      hanna.src = "assets/sprites/hanna/curiosa.png";
      tocarSequencia();
    }, 1000));
  }

  function iniciar() {
    sequencia = [cores[Math.floor(Math.random() * cores.length)]];
    vez = [];
    nivelAtual = 1;
    nivel.textContent = "Nível 1";
    jogoAtivo.timers.push(setTimeout(tocarSequencia, 800));
  }

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (bloqueado) return;
      const cor = btn.dataset.cor;
      acenderBtn(cor, 200);
      vez.push(cor);
      const pos = vez.length - 1;

      if (vez[pos] !== sequencia[pos]) {
        // ERROU
        btn.classList.add("errado");
        bloqueado = true;
        hanna.src = "assets/sprites/hanna/brava.png";
        status.textContent = "Errou! 😿";
        const total = Math.max(0, (nivelAtual - 1) * 25);
        jogoAtivo.timers.push(setTimeout(() => {
          mostrarResultado(
            "Fim de jogo!",
            nivelAtual >= 5 ? "😺" : "😿",
            total,
            nivelAtual >= 5
              ? `Incrível! Você chegou ao nível ${nivelAtual}!`
              : `Você chegou ao nível ${nivelAtual}. Tente de novo!`,
            jogoMemoria
          );
        }, 1200));
        return;
      }

      if (vez.length === sequencia.length) {
        // Completou sequência
        bloqueado = true;
        status.textContent = "Acertou! 🎉";
        jogoAtivo.timers.push(setTimeout(proximoNivel, 800));
      }
    });
  });

  iniciar();
}

//   JOGO 2 — PEGA PEIXE
//   Peixes e bombas caem. Toque peixes (+1 ponto) evite bombas (-1 vida).
//   30 segundos. 3 vidas. Recompensa proporcional aos peixes pegos.

function jogoPeixe() {
  abrirArena("Pega Peixe");

  arenaConteudo.innerHTML = `
    <div class="peixe-info">
      <div class="peixe-timer">⏱️ <span id="peixeTimer">30</span>s</div>
      <div class="peixe-vidas">❤️ <span id="peixeVidas">3</span></div>
      <div class="peixe-timer">🐟 <span id="peixePontos">0</span></div>
    </div>
    <div class="peixe-arena" id="peixeArena"></div>
    <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text-light);font-weight:700;">
      Toque nos peixes! Evite as bombas 💣
    </div>`;

  const arena  = document.getElementById("peixeArena");
  let vidas    = 3;
  let pontos   = 0;
  let tempo    = 30;
  let rodando  = true;

  const timerEl  = document.getElementById("peixeTimer");
  const vidasEl  = document.getElementById("peixeVidas");
  const pontosEl = document.getElementById("peixePontos");

  const itens = ["🐟","🐠","🐡","🦐","🦑"];
  const perigo = ["💣","🪨"];

  function criarItem() {
    if (!rodando) return;
    const isBomba = Math.random() < 0.28;
    const emoji   = isBomba
      ? perigo[Math.floor(Math.random() * perigo.length)]
      : itens[Math.floor(Math.random() * itens.length)];

    const el = document.createElement("div");
    el.className = "peixe-item";
    el.textContent = emoji;
    const x = Math.random() * (arena.clientWidth - 44);
    el.style.left = x + "px";
    const dur = 2200 + Math.random() * 1400;
    el.style.animationDuration = dur + "ms";
    arena.appendChild(el);

    el.addEventListener("click", (e) => {
      if (!rodando) return;
      e.stopPropagation();

      // splash
      const splash = document.createElement("div");
      splash.className = "peixe-splash";
      splash.textContent = isBomba ? "💥" : "✨";
      splash.style.left = x + "px";
      splash.style.top  = el.style.top || "60px";
      arena.appendChild(splash);
      jogoAtivo.timers.push(setTimeout(() => splash.remove(), 500));

      el.remove();

      if (isBomba) {
        vidas--;
        vidasEl.textContent = "❤️".repeat(Math.max(0, vidas));
        if (vidas <= 0) terminar();
      } else {
        pontos++;
        pontosEl.textContent = pontos;
      }
    });

    // Remove se chegar embaixo sem clicar
    jogoAtivo.timers.push(setTimeout(() => {
      if (el.parentNode) el.remove();
    }, dur + 100));
  }

  // Spawn periódico (fica mais rápido com tempo)
  const spawnInterval = setInterval(() => {
    if (!rodando) { clearInterval(spawnInterval); return; }
    criarItem();
    if (tempo < 15) criarItem(); // mais itens no final
  }, 900);
  jogoAtivo.intervals.push(spawnInterval);

  // Countdown
  const countInterval = setInterval(() => {
    if (!rodando) { clearInterval(countInterval); return; }
    tempo--;
    timerEl.textContent = tempo;
    if (tempo <= 0) terminar();
  }, 1000);
  jogoAtivo.intervals.push(countInterval);

  function terminar() {
    rodando = false;
    clearInterval(spawnInterval);
    clearInterval(countInterval);
    // 0–5 peixes: 5 moedas | 6–12: 15 | 13–20: 25 | 21+: 30
    const recomp =
    pontos >= 21 ? 120 :
    pontos >= 13 ? 80  :
    pontos >= 6  ? 45  :
    Math.max(10, pontos * 3);
    ganharMoedas(recomp);
    const emoji = pontos >= 15 ? "🐟" : pontos >= 8 ? "😺" : "😿";
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        pontos >= 15 ? "Mestre da pesca!" : "Jogo finalizado!",
        emoji, recomp,
        `Você pegou ${pontos} peixes! ${pontos >= 15 ? "Incrível!" : "Tente pegar mais da próxima vez!"}`,
        jogoPeixe
      );
    }, 600));
  }
}

//   JOGO 3 — ADIVINHE O HUMOR
//   A Hanna aparece com um sprite de emoção.
//   4 opções — escolha a certa em 6 segundos.
//   Streak de acertos multiplica a recompensa.
//   10 rodadas no total.

function jogoHumor() {
  abrirArena("Adivinhe o Humor");

  const humores = [
    { sprite: "assets/sprites/hanna/neutra.png",               nome: "Neutra 😐",               alias: ["neutra","normal"] },
    { sprite: "assets/sprites/hanna/feliz.png",                nome: "Feliz 😸",                alias: ["feliz","contente"] },
    { sprite: "assets/sprites/hanna/contente.png",             nome: "Contente 😊",             alias: ["contente","feliz"] },
    { sprite: "assets/sprites/hanna/curiosa.png",              nome: "Curiosa 👀",              alias: ["curiosa","surpresa"] },
    { sprite: "assets/sprites/hanna/brava.png",                nome: "Brava 😾",                alias: ["brava","irritada"] },
    { sprite: "assets/sprites/hanna/triste.png",               nome: "Triste 😿",               alias: ["triste","chateada"] },
    { sprite: "assets/sprites/hanna/sonolenta.png",            nome: "Sonolenta 😴",            alias: ["sonolenta","com sono"] },
    { sprite: "assets/sprites/hanna/animada.png",              nome: "Animada 🎉",              alias: ["animada","empolgada"] },
    { sprite: "assets/sprites/hanna/apaixonada.png",           nome: "Apaixonada 💖",           alias: ["apaixonada","feliz"] },
    { sprite: "assets/sprites/hanna/vergonha.png",             nome: "Com vergonha 🙈",         alias: ["vergonha","tímida"] },
    { sprite: "assets/sprites/hanna/aprontona.png",            nome: "Aprontona 😼",            alias: ["aprontona","arteira"] },
    { sprite: "assets/sprites/hanna/doidinha.png",             nome: "Doidinha 🌀",             alias: ["doidinha","maluca"] },
    { sprite: "assets/sprites/hanna/chorando-felicidade.png",  nome: "Chorando de alegria 😭💖", alias: ["chorando de alegria","emocionada"] },
    { sprite: "assets/sprites/hanna/metida.png",               nome: "Metida 💅",               alias: ["metida","convencida"] },
  ];

  let rodada  = 0;
  let streak  = 0;
  let totalMoedas = 0;
  const TOTAL = 10;

  arenaConteudo.innerHTML = `
    <div class="humor-streak" id="humorStreak">🔥 Sequência: 0</div>
    <div class="humor-instrucao" id="humorInstrucao">Como a Hanna está se sentindo?</div>
    <div class="humor-timer-bar-bg"><div class="humor-timer-bar-fill" id="humorTimerBar" style="width:100%"></div></div>
    <div class="humor-sprite-wrap">
      <img src="assets/sprites/hanna/neutra.png" id="humorSprite">
    </div>
    <div class="humor-opcoes" id="humorOpcoes"></div>
    <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text-light);font-weight:700;">
      Rodada <span id="humorRodada">1</span>/${TOTAL}
    </div>`;

  const spriteEl  = document.getElementById("humorSprite");
  const opcoesEl  = document.getElementById("humorOpcoes");
  const timerBar  = document.getElementById("humorTimerBar");
  const streakEl  = document.getElementById("humorStreak");
  const rodadaEl  = document.getElementById("humorRodada");

  let timerInterval;
  let timerValor = 100;
  let respondido = false;

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - .5);
  }

  function novaRodada() {
    if (rodada >= TOTAL) {
      ganharMoedas(totalMoedas);
      jogoAtivo.timers.push(setTimeout(() => {
        mostrarResultado(
          totalMoedas >= 15 ? "Você entende a Hanna!" : "Jogo finalizado!",
          totalMoedas >= 15 ? "💖" : "😺",
          totalMoedas,
          `Acertou com sequência máxima de ${streak}! ${totalMoedas >= 15 ? "Você conhece bem a Hanna 💕" : "Pratique mais!"}`,
          jogoHumor
        );
      }, 800));
      return;
    }

    respondido = false;
    rodadaEl.textContent = rodada + 1;
    clearInterval(timerInterval);
    timerValor = 100;
    timerBar.style.width = "100%";
    timerBar.style.background = "linear-gradient(90deg,#ff8fc2,#ff5fa2)";

    // Escolhe humor correto
    const correto = humores[Math.floor(Math.random() * humores.length)];
    spriteEl.src   = correto.sprite;

    // 3 erradas + 1 certa embaralhadas
    const erradas = shuffle(humores.filter(h => h.nome !== correto.nome)).slice(0, 3);
    const opcoes  = shuffle([correto, ...erradas]);

    opcoesEl.innerHTML = "";
    opcoes.forEach(op => {
      const btn = document.createElement("button");
      btn.className = "humor-opcao";
      btn.textContent = op.nome;
      btn.onclick = () => responder(btn, op.nome === correto.nome);
      opcoesEl.appendChild(btn);
    });

    // Timer 6s
    timerInterval = setInterval(() => {
      if (respondido) { clearInterval(timerInterval); return; }
      timerValor -= 100 / 60; // 6 segundos = 60 ticks de 100ms
      timerBar.style.width = Math.max(0, timerValor) + "%";
      if (timerValor <= 30) timerBar.style.background = "linear-gradient(90deg,#ff9944,#ff5520)";
      if (timerValor <= 0) {
        clearInterval(timerInterval);
        if (!respondido) responder(null, false);
      }
    }, 100);
    jogoAtivo.intervals.push(timerInterval);
  }

  function responder(btn, acertou) {
    if (respondido) return;
    respondido = true;
    clearInterval(timerInterval);

    if (acertou) {
      if (btn) btn.classList.add("certo");
      streak++;
      const ganho =
      streak >= 7 ? 30 :
      streak >= 5 ? 20 :
      streak >= 3 ? 12 :
      8;
      totalMoedas += ganho;
      streakEl.textContent = `🔥 Sequência: ${streak} (+${ganho} moeda${ganho>1?"s":""})`;
      spriteEl.src = "assets/sprites/hanna/apaixonada.png";
    } else {
      if (btn) btn.classList.add("errado");
      streak = 0;
      streakEl.textContent = `🔥 Sequência: 0`;
      spriteEl.src = "assets/sprites/hanna/brava.png";
    }

    rodada++;
    jogoAtivo.timers.push(setTimeout(novaRodada, 1000));
  }

  novaRodada();
}

//   JOGO 4 — REFLEXO FELINO

function jogoReflexo() {
  abrirArena("Reflexo Felino");

  arenaConteudo.innerHTML = `
    <div class="reflexo-rodada">Rodada <span id="refRodada">1</span> / 7</div>
    <div class="reflexo-instrucao">
      Pressione o botão<br><b>enquanto</b> a Hanna estiver brilhando!
    </div>
    <div class="reflexo-arena">
      <div class="reflexo-hanna-wrap">
        <div class="reflexo-ring" id="refRing"></div>
        <img src="assets/sprites/hanna/neutra.png" id="refHanna">
      </div>
      <div class="reflexo-feedback" id="refFeedback"></div>
      <button class="reflexo-btn" id="refBtn">TAP!</button>
    </div>`;

  const hannaEl    = document.getElementById("refHanna");
  const ringEl     = document.getElementById("refRing");
  const btn        = document.getElementById("refBtn");
  const feedbackEl = document.getElementById("refFeedback");
  const rodadaEl   = document.getElementById("refRodada");

  let rodada    = 0;
  let piscando  = false;
  let esperando = true;
  let acertos   = 0;
  let totalMoedas = 0;
  const TOTAL   = 7;

  function setFeedback(txt, cor) {
    feedbackEl.textContent = txt;
    feedbackEl.style.color = cor;
    jogoAtivo.timers.push(setTimeout(() => { feedbackEl.textContent = ""; }, 900));
  }

  function novaRodada() {
    if (rodada >= TOTAL) {
      ganharMoedas(totalMoedas);
      jogoAtivo.timers.push(setTimeout(() => {
        mostrarResultado(
          acertos >= 6 ? "Reflexos de felino!" : "Jogo finalizado!",
          acertos >= 6 ? "⚡" : acertos >= 4 ? "😺" : "😿",
          totalMoedas,
          `Você acertou ${acertos} de ${TOTAL} vezes! ${acertos >= 5 ? "Reflexos incríveis! 🐱" : "Treine seus reflexos!"}`,
          jogoReflexo
        );
      }, 800));
      return;
    }

    esperando = true;
    piscando  = false;
    rodadaEl.textContent = rodada + 1;
    btn.disabled = false;
    hannaEl.src = "assets/sprites/hanna/neutra.png";
    hannaEl.classList.remove("piscando");
    ringEl.classList.remove("piscando");

    // Delay aleatório antes de piscar: 1.2s a 3.5s
    const delay = 1200 + Math.random() * 2300;
    // Duração do flash: 500ms a 900ms
    const durFlash = 500 + Math.random() * 400;

    jogoAtivo.timers.push(setTimeout(() => {
      piscando = true;
      hannaEl.src = "assets/sprites/hanna/animada.png";
      hannaEl.classList.add("piscando");
      ringEl.classList.add("piscando");

      jogoAtivo.timers.push(setTimeout(() => {
        piscando = false;
        hannaEl.classList.remove("piscando");
        ringEl.classList.remove("piscando");
        hannaEl.src = "assets/sprites/hanna/neutra.png";

        // Se não clicou durante o flash = perdeu rodada
        if (esperando) {
          setFeedback("Tarde demais! 😿", "#ff5555");
          esperando = false;
          rodada++;
          jogoAtivo.timers.push(setTimeout(novaRodada, 1000));
        }
      }, durFlash));
    }, delay));
  }

  btn.addEventListener("click", () => {
    if (!esperando) return;

    if (piscando) {
      // Acertou!
      acertos++;
      esperando = false;
      const ganho = 20;
      totalMoedas += ganho;
      setFeedback("Perfeito! ⚡ +20", "#6acf88");
      hannaEl.src = "assets/sprites/hanna/apaixonada.png";
      rodada++;
      jogoAtivo.timers.push(setTimeout(novaRodada, 1000));
    } else {
      // Muito cedo
      setFeedback("Cedo demais! 😹", "#ff9944");
      hannaEl.src = "assets/sprites/hanna/brava.png";
      jogoAtivo.timers.push(setTimeout(() => {
        hannaEl.src = "assets/sprites/hanna/neutra.png";
      }, 600));
      // Não pula rodada — deixa tentar de novo
    }
  });

  novaRodada();
}

const barraFome         = document.getElementById("barraFome");
const barraFelicidade   = document.getElementById("barraFelicidade");
const barraEnergia      = document.getElementById("barraEnergia");
const barraHigiene = document.getElementById("barraHigiene");
const barraVinculo = document.getElementById("barraVinculo");
const vinculoPorcentagem = document.getElementById("vinculoPorcentagem");
const vinculoTexto = document.getElementById("vinculoTexto");

const fomePorcentagem        = document.getElementById("fomePorcentagem");
const felicidadePorcentagem  = document.getElementById("felicidadePorcentagem");
const energiaPorcentagem     = document.getElementById("energiaPorcentagem");
const higienePorcentagem = document.getElementById("higienePorcentagem");

const sementesTexto     = document.getElementById("sementes");
const moedasTexto       = document.getElementById("moedas");
const coracoes          = document.querySelectorAll(".coracaoAmizade");

const navHome = document.getElementById("navHome");
const navFarm = document.getElementById("navFarm");
const navLembretes = document.getElementById("navLembretes");
const navLoja = document.getElementById("navLoja");
const navGames = document.getElementById("navGames");

// LOJA
const btnLoja = document.getElementById("btnLoja");
const telaLoja  = document.getElementById("telaLoja");
const btnVoltar = document.getElementById("btnVoltar");
const btnUrsinho = document.getElementById("btnUrsinho");
const btnMorango = document.getElementById("btnMorango");
const btnGatinha = document.getElementById("btnGatinha");

// LEMBRETES
const btnLembretes = document.getElementById("btnLembretes");
const telaLembretes      = document.getElementById("telaLembretes");
const btnVoltarLembretes = document.getElementById("btnVoltarLembretes");
const btnSalvarLembrete  = document.getElementById("btnSalvarLembrete");
const inputLembrete      = document.getElementById("inputLembrete");
const listaLembretes     = document.getElementById("listaLembretes");
const tipoLembrete       = document.getElementById("tipoLembrete");
const dataLembrete       = document.getElementById("dataLembrete");
const horaLembrete       = document.getElementById("horaLembrete");
const btnAbrirFazenda = document.getElementById("btnAbrirFazenda");
const telaFazenda = document.getElementById("telaFazenda");
const btnVoltarFazenda = document.getElementById("btnVoltarFazenda");

// SONS (silencia erro se arquivo ausente)
function criarAudio(src) {
  const a = new Audio();
  a.src = src;
  return a;
}
const somBotao  = criarAudio("assets/music/som-botao.wav");
somBotao.volume =
parseFloat(
    volumeEfeitos.value
);
const somCompra = criarAudio("assets/music/som-compra.wav");
somCompra.volume =
parseFloat(
    volumeEfeitos.value
);
const somBanho = criarAudio("assets/music/banho.mp3");
somBanho.volume =
parseFloat(
    volumeEfeitos.value
);

// SONS DA GATINHA 

const sonsMeow = [
  document.getElementById("somMeow1"),
  document.getElementById("somMeow2"),
  document.getElementById("somMeow3"),
];
const somPurr       = document.getElementById("somPurr");
const somMeowAdocao = document.getElementById("somMeowAdocao");

function tocarMeow() {
  const som = sonsMeow[Math.floor(Math.random() * sonsMeow.length)];
  if (!som) return;
  som.currentTime = 0;
  som.volume =
  parseFloat(
    volumeEfeitos.value
  );
  som.play().catch(() => {});
}

function tocarPurr() {
  if (!somPurr) return;

  somPurr.currentTime = 0;

  somPurr.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somPurr.play().catch(() => {});
}

// SISTEMA DE INTERAÇÕES HANNA + GATINHA 
const momentosJuntas = [
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-abraco.png",
    fala: "🤗 se abraçando fofinho!",
    som: "purr",
  },
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-beijinho.png",
    fala: "💋 beijinho da gatinha preta!",
    som: "purr",
  },
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-brincando.png",
    fala: "🎀 brincando juntas!",
    som: "meow",
  },
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-carinho.png",
    fala: "💜 se fazendo carinho...",
    som: "purr",
  },
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-lambendo.png",
    fala: "👅 se lambendo de carinho!",
    som: "purr",
  },
  {
    sprite: "assets/sprites/hanna-gatinha/noite-feliz.png",
    fala: "🌙 noitinha feliz juntas~",
    som: null,
  },
  {
    sprite: "assets/sprites/hanna-gatinha/gatinhas-dormindo.png",
    fala: "💤 soneca fofa juntas...",
    som: null,
  },
];

const gatinhaFalaEl = document.getElementById("gatinhaFala");
let gatinhaFalaTimer;

// Balão de fala quando clica na gatinha
function mostrarFalaGatinha(texto) {
  if (!gatinhaFalaEl) return;
  clearTimeout(gatinhaFalaTimer);
  gatinhaFalaEl.textContent = texto;
  gatinhaFalaEl.classList.add("visivel");
  gatinhaFalaTimer = setTimeout(() => {
    gatinhaFalaEl.classList.remove("visivel");
  }, 2500);
}

// Falas aleatórias da gatinha ao ser clicada
const falasClique = [
  "Miau! 🖤", "Prrrr... 💜", "Mrrrow~", "Miau miau!", "♪ nyaa~",
  "Me pega! 🐾", "Prrr 💤", "Nyaa! ✨", "*ronrona* 💜", "Miau! 🎀",
];

// CLIQUE NA HANNA
const hannaFalaEl = document.getElementById("hannaFala");
let hannaFalaTimer;

const falasHanna = [
  "Miau! 🤍", "Purrr~ 💗", "Nyaa! ✨", "Mrrrow 🎀",
  "Miau miau! 💖", "*ronrona* 🌸", "Nyaa~ 🩷", "Miau! 🐾",
  "Prrr 💤", "Miau! ⭐",
];

function mostrarFalaHanna(texto) {
  if (!hannaFalaEl) return;
  clearTimeout(hannaFalaTimer);
  hannaFalaEl.textContent = texto;
  hannaFalaEl.classList.add("visivel");
  hannaFalaTimer = setTimeout(() => hannaFalaEl.classList.remove("visivel"), 2500);
}

// Sprites que podem aparecer ao clicar na Hanna
const spritesCliqueHanna = [
  "animada", "contente", "feliz", "apaixonada", "curiosa",
];

document.getElementById("hannaContainer").addEventListener("click", () => {
  if (dormindo) return; // não reage dormindo

  tocarMeow();

  // Pulso visual
  hannaSprite.classList.remove("hanna-pulse");
  void hannaSprite.offsetWidth;
  hannaSprite.classList.add("hanna-pulse");
  setTimeout(() => hannaSprite.classList.remove("hanna-pulse"), 500);

  // Sprite temporária aleatória
  const spriteEscolhida = spritesCliqueHanna[Math.floor(Math.random() * spritesCliqueHanna.length)];
  const spriteAnterior  = hannaSprite.src;
  hannaSprite.src = `assets/sprites/hanna/${spriteEscolhida}.png`;
  setTimeout(() => { hannaSprite.src = spriteAnterior; }, 2000);

  // Balão de fala
  const fala = falasHanna[Math.floor(Math.random() * falasHanna.length)];
  mostrarFalaHanna(fala);

  // Pequeno boost
  felicidade = Math.min(100, felicidade + 0.5);
  amizade    = Math.min(5, amizade + 0.05);
});
  gatinhaSprite.addEventListener("click", () => {
    tocarMeow();
    gatinhaSprite.classList.remove("gatinha-pulse");
    void gatinhaSprite.offsetWidth;
    gatinhaSprite.classList.add("gatinha-pulse");
    setTimeout(() => gatinhaSprite.classList.remove("gatinha-pulse"), 500);
    gatinhaSpriteTemp("gatinha-animada", 2000);
    const fala = falasClique[Math.floor(Math.random() * falasClique.length)];
    mostrarFalaGatinha(fala);
    felicidade = Math.min(100, felicidade + 3);
    amizade    = Math.min(5, amizade + 0.1);
  });

// Momentos juntos: acontecem a cada 3–6 min se a gatinha estiver desbloqueada
let momentoJuntasTimer;

function agendarMomentoJuntas() {
  clearTimeout(momentoJuntasTimer);
  const intervalo = (180 + Math.random() * 180) * 1000; // 3–6 min
  momentoJuntasTimer = setTimeout(dispararMomentoJuntas, intervalo);
}

function dispararMomentoJuntas() {
  if (!gatinhaDesbloqueada || dormindo) {
    agendarMomentoJuntas();
    return;
  }

  const momento = momentosJuntas[Math.floor(Math.random() * momentosJuntas.length)];
  const spriteConjunta = document.getElementById("spriteConjunta");

  // Esconde Hanna e gatinha individuais, mostra sprite conjunta
  hannaSprite.style.display      = "none";
  gatinhaContainer.style.display = "none";
  spriteConjunta.src              = momento.sprite;
  spriteConjunta.style.display    = "block";

  if (momento.som === "purr") tocarPurr();
  else if (momento.som === "meow") tocarMeow();

  mostrarFalaGatinha(momento.fala);
  mostrarMensagem(momento.fala);

  setTimeout(() => {
    spriteConjunta.style.display   = "none";
    hannaSprite.style.display      = "block";
    if (gatinhaDesbloqueada) gatinhaContainer.style.display = "flex";
    gatinhaFalaEl && gatinhaFalaEl.classList.remove("visivel");
  }, 5000);

  agendarMomentoJuntas();
}

// Inicia agendamento assim que a gatinha for desbloqueada (ou já está no load)
function iniciarMomentosGatinha() {
  if (gatinhaDesbloqueada) agendarMomentoJuntas();
}

// SPRITE DA GATINHA
function gatinhaSpritePor(nome) {
  if (!gatinhaDesbloqueada) return;
  gatinhaSprite.src = `assets/sprites/gatinha/${nome}.png`;
}

// Sprite temporária: volta para o estado de status após `ms` milissegundos
function gatinhaSpriteTemp(nome, ms = 2000) {
  if (!gatinhaDesbloqueada) return;
  gatinhaSpritePor(nome);
  setTimeout(atualizarGatinha, ms);
}

// Atualiza a sprite da gatinha baseado no status atual do jogo
function atualizarGatinha() {
  if (!gatinhaDesbloqueada) return;

  // Dormindo: conjunta se tiver a Kika, senão individual
  if (dormindo) {
    gatinhaSpritePor("gatinha-dormindo");
    return;
  }

  // Segue o humor da Hanna
  if (energia <= 20)        gatinhaSpritePor("gatinha-dormindo");
  else if (fome <= 15)      gatinhaSpritePor("gatinha-brava");
  else if (fome <= 50)      gatinhaSpritePor("gatinha-triste");
  else if (higiene <= 30)   gatinhaSpritePor("gatinha-confusa");
  else if (felicidade >= 95) gatinhaSpritePor("gatinha-apaixonada");
  else if (felicidade >= 80) gatinhaSpritePor("gatinha-animada");
  else                       gatinhaSpritePor("gatinha-neutra");
}
let fome        = Number(localStorage.getItem("fome"))        || 100;
let felicidade  = Number(localStorage.getItem("felicidade"))  || 100;
let energia     = Number(localStorage.getItem("energia"))     || 100;
let higiene     = Number(localStorage.getItem("higiene"))     || 100;
let sementes    = Number(localStorage.getItem("sementes"))    || 0;
let moedas      = Number(localStorage.getItem("moedas"))      || 0;
let amizade     = Number(localStorage.getItem("amizade"))     || 0;
let vinculoGatinhas = Number(localStorage.getItem("vinculoGatinhas")) || 0;

let gatinhaDesbloqueada = localStorage.getItem("gatinhaDesbloqueada") === "true";
let nomeGatinha = localStorage.getItem("nomeGatinha") || "";

let dormindo = localStorage.getItem("dormindo") === "true";
let lembretes = JSON.parse(localStorage.getItem("lembretes")) || [];

// NOME DA GATINHA — só exibe se foi adotada e já tem nome
nomeDaGatinhaTexto.textContent = (gatinhaDesbloqueada && nomeGatinha) ? nomeGatinha : "";

if (inputNomeGatinha) {
    inputNomeGatinha.value = (gatinhaDesbloqueada && nomeGatinha) ? nomeGatinha : "";
}

btnSalvarNomeGatinha.onclick = () => {

    const novoNome =
    inputNomeGatinha.value.trim();

    if (!novoNome) return;

    nomeGatinha = novoNome;

    nomeDaGatinhaTexto.textContent =
    nomeGatinha;

    localStorage.setItem(
        "nomeGatinha",
        nomeGatinha
    );

    mostrarMensagem(
        `${nomeGatinha} adorou o novo nome 💖`
    );

};

if (!gatinhaDesbloqueada) {

    inputNomeGatinha.disabled =
    true;

    btnSalvarNomeGatinha.disabled =
    true;

    inputNomeGatinha.placeholder =
    "Adote a gatinha primeiro 🖤";

} else if (!nomeGatinha) {

    inputNomeGatinha.placeholder = "Dê um nome pra ela 🐾";

}

// ÚLTIMA VEZ ONLINE

let ultimoAcesso = Number(localStorage.getItem("ultimoAcesso")) || Date.now();

// ── COMPENSAR TEMPO OFFLINE ──────────────────────────────────
// Calcula quantos minutos se passaram desde o último acesso
// e aplica a degradação de stats proporcionalmente (máx 8h)
(function compensarTempoOffline() {
  const agora       = Date.now();
  const minutosOff  = Math.min((agora - ultimoAcesso) / 60000, 480); // máx 8h

  if (minutosOff >= 1 && !dormindo) {
    fome       = Math.max(0, fome       - 2   * minutosOff);
    felicidade = Math.max(0, felicidade - 1   * minutosOff);
    energia    = Math.max(0, energia    - 0.5 * minutosOff);
    higiene    = Math.max(0, higiene    - 1   * minutosOff);
  }

  // Atualiza ultimoAcesso e salva a cada 30s enquanto o app está aberto
  localStorage.setItem("ultimoAcesso", agora);
  setInterval(() => {
    localStorage.setItem("ultimoAcesso", Date.now());
  }, 30000);
})();

// ── REAGENDAR CRESCIMENTO DAS PLANTAS OFFLINE ─────────────────
// (executado após a declaração de fazenda e slotsPlantacao, mais abaixo)

// MENSAGEM
let msgTimer;

function trocarAnimacao(animacao) {

    hannaSprite.style.animation = animacao;

}

function mostrarMensagem(
texto,
local = "home"
) {
  let container = mensagem;

  if (local === "fazenda") {

    container =
    balaoFazenda;

  }

    clearTimeout(msgTimer);

    container.textContent = texto;

    container.style.opacity = "1";

    msgTimer = setTimeout(() => {

        container.style.opacity = "0";

    }, 3500);

}

function iniciarFalasIdle() {

    const frasesIdle = {

      normal: [

          "Você voltou 💖",

          "Vamos brincar?",

          "Tava com saudade...",

          "Hoje você tá linda ✨",

          "Me faz carinho?"

      ],

      fome: [

          "Barriguinha vazia 😿",

          "Será que tem peixinho? 🐟",

          "Acho que tô com fome..."

      ],

      cansada: [

          "Tô com soninho 😴",

          "Será que dá pra cochilar?",

          "Minhas patinhas estão cansadas..."

      ],

      triste: [

          "Me dá carinho?",

          "Queria um abraço...",

          "Tô meio tristinha hoje"

      ],

      apaixonada: [

          "Você me faz feliz 💖",

          "Gosto quando você aparece 🌸",

          "Você é especial pra mim ✨"

      ]

  };

    setInterval(() => {

      if (
          telaPedido.style.display === "flex" ||
          telaPedidoReal.style.display === "flex" ||
          telaMinigames.style.display === "block"
      ) return;

      let listaAtual =
      frasesIdle.normal;

      // PRIORIDADES

      if (fome < 30) {

          listaAtual =
          frasesIdle.fome;

      }

      else if (energia < 30) {

          listaAtual =
          frasesIdle.cansada;

      }

      else if (felicidade < 40) {

          listaAtual =
          frasesIdle.triste;

      }

      else if (amizade > 3.5) {

          listaAtual =
          frasesIdle.apaixonada;

      }

      const frase =

      listaAtual[
          Math.floor(
              Math.random() *
              listaAtual.length
          )
      ];

      mostrarMensagem(frase);

  }, 90000);

}

// ATUALIZAR STATUS
function atualizarStatus() {
  // corações
  coracoes.forEach((c, i) => {
    c.src = amizade >= i + 1
      ? "assets/ui/coracao-5.png"
      : "assets/ui/coracao-1.png";
  });

  barraFome.style.width        = fome + "%";
  barraFelicidade.style.width  = felicidade + "%";
  barraEnergia.style.width     = energia + "%";
  barraHigiene.style.width = higiene + "%";
  barraVinculo.style.width = vinculoGatinhas + "%";

  vinculoPorcentagem.textContent =
  Math.floor(vinculoGatinhas) + "%";


  if (vinculoGatinhas < 20) {

      vinculoTexto.textContent =
      "Desconhecidas 🤍";

  }

  else if (vinculoGatinhas < 40) {

      vinculoTexto.textContent =
      "Amigas 💜";

  }

  else if (vinculoGatinhas < 60) {

      vinculoTexto.textContent =
      "Próximas 🌸";

  }

  else if (vinculoGatinhas < 80) {

      vinculoTexto.textContent =
      "Apaixonadinhas 💖";

  }

  else {

      vinculoTexto.textContent =
      "Inseparáveis 💍";

  }

  fomePorcentagem.textContent       = Math.floor(fome) + "%";
  felicidadePorcentagem.textContent = Math.floor(felicidade) + "%";
  energiaPorcentagem.textContent    = Math.floor(energia) + "%";
  higienePorcentagem.textContent = Math.floor(higiene) + "%";

  sementesTexto.textContent = sementes;
  moedasTexto.textContent   = moedas;

  const sementesFazendaEl = document.getElementById("sementesFazenda");
  if (sementesFazendaEl) sementesFazendaEl.textContent = sementes;

  if (gatinhaDesbloqueada) {
    // Só exibe o container individual se a sprite conjunta NÃO estiver visível
    const _conjunta = document.getElementById("spriteConjunta");
    const conjuntaAtiva = _conjunta && _conjunta.style.display !== "none";
    if (!conjuntaAtiva) {
      gatinhaContainer.style.display = "flex";
    }
    nomeDaGatinhaTexto.textContent = nomeGatinha;

    // Mostra a barra de vínculo só quando a gatinha estiver desbloqueada
    const vinculoContainer = document.getElementById("vinculoContainer");
    if (vinculoContainer) vinculoContainer.style.display = "block";
  }

  saldoLoja.textContent = moedas;

  if (dormindo) {

    zzzContainer.style.display = "flex";

    const _conjunta = document.getElementById("spriteConjunta");
    if (!_conjunta || _conjunta.style.display === "none") {
      hannaSprite.src = "assets/sprites/hanna/dormindo.png";
      hannaSprite.style.animation = "none";
    } else {
      // Sprite conjunta ativa — sem animação
      _conjunta.style.animation = "none";
    }

    return;

    }

    zzzContainer.style.display = "none";

  if (energia <= 20) {

    hannaSprite.src = "assets/sprites/hanna/sonolenta.png";

    trocarAnimacao("tristeFloat 4s ease-in-out infinite");

    }

    else if (fome <= 15) {

    hannaSprite.src = "assets/sprites/hanna/brava.png";

    trocarAnimacao("bravaShake 0.4s infinite");

    }

    else if (fome <= 50) {

    hannaSprite.src = "assets/sprites/hanna/triste.png";

    trocarAnimacao("tristeFloat 4s ease-in-out infinite");

    }

    else if (felicidade >= 95) {

    hannaSprite.src = "assets/sprites/hanna/apaixonada.png";

    trocarAnimacao("apaixonadaFloat 5s ease-in-out infinite");

    }

    else if (felicidade >= 80) {

    hannaSprite.src = "assets/sprites/hanna/contente.png";

    trocarAnimacao("felizBounce 2.5s ease-in-out infinite");

    }

    else {

    hannaSprite.src = "assets/sprites/hanna/neutra.png";

    trocarAnimacao("idleFloat 4.5s ease-in-out infinite");

    }

  atualizarGatinha();
  _salvar();
}

function _salvar() {
  localStorage.setItem("fome",                fome);
  localStorage.setItem("felicidade",          felicidade);
  localStorage.setItem("energia",             energia);
  localStorage.setItem("higiene",             higiene);
  localStorage.setItem("sementes",            sementes);
  localStorage.setItem("moedas",              moedas);
  localStorage.setItem("amizade",             amizade);
  localStorage.setItem("vinculoGatinhas",     vinculoGatinhas);
  localStorage.setItem("dormindo",            dormindo);
  localStorage.setItem("gatinhaDesbloqueada", gatinhaDesbloqueada ? "true" : "false");
  localStorage.setItem("nomeGatinha",         nomeGatinha);
  salvarFazenda();
}

// EVENTOS ALEATÓRIOS DO DIA

let eventoEmAndamento = false;

const eventosDoDia = [

  {
    sprite:    "vergonha",
    animacao:  "vergonhaWiggle 0.6s ease-in-out infinite alternate",
    duracao:   4000,
    fala:      "Aaaa para de olhar!! 🙈",
    // Aparece quando está feliz ou apaixonada (humor alto)
    condicao:  () => felicidade >= 70 && !dormindo,
    peso:      3,
  },

  {
    sprite:    "aprontona",
    animacao:  "aprontonaSneak 1s ease-in-out infinite",
    duracao:   5000,
    fala:      "Eu não fiz nada... 😼",
    // Aparece com qualquer humor, mais comum quando a fome tá ok
    condicao:  () => fome >= 40 && !dormindo,
    peso:      4,
  },

  {
    sprite:    "doidinha",
    animacao:  "doidinhaSpin 0.5s linear infinite",
    duracao:   4500,
    fala:      "WHEEEEE 🌀✨",
    // Aparece só quando energia está alta
    condicao:  () => energia >= 70 && !dormindo,
    peso:      2,
  },

  {
    sprite:    "chorando-felicidade",
    animacao:  "chorandoFelizFloat 3s ease-in-out infinite",
    duracao:   5500,
    fala:      "Tô chorando de amor por você 😭💖",
    // Só aparece com felicidade e vínculo muito altos
    condicao:  () => felicidade >= 85 && amizade >= 3 && !dormindo,
    peso:      2,
  },

  {
    sprite:    "metida",
    animacao:  "metidaFloat 4s ease-in-out infinite",
    duracao:   5000,
    fala:      "Sei lá, sou muito fofa mesmo 💅",
    // Aparece quando está contente ou apaixonada
    condicao:  () => felicidade >= 60 && !dormindo,
    peso:      3,
  },

];

/**
 * Dispara um evento aleatório do dia conforme o humor atual.
 * Escolhe com peso — eventos mais raros têm peso menor.
 */
function dispararEventoAleatorio() {

  // Não interrompe dormindo, banho, outro evento, ou sprite especial ativa
  if (
    eventoEmAndamento ||
    dormindo ||
    hannaSprite.src.includes("banho") ||
    hannaSprite.src.includes("carinho") ||
    hannaSprite.src.includes("comendo")
  ) return;

  // Filtra só os eventos cujas condições estão satisfeitas
  const disponiveis = eventosDoDia.filter(e => e.condicao());

  if (disponiveis.length === 0) return;

  // Sorteio com peso
  const pool = [];
  disponiveis.forEach(e => {
    for (let i = 0; i < e.peso; i++) pool.push(e);
  });

  const evento = pool[Math.floor(Math.random() * pool.length)];

  // 40% de chance de não disparar mesmo assim (pra não ficar repetitivo)
  if (Math.random() > 0.6) return;

  eventoEmAndamento = true;

  const spriteAnterior  = hannaSprite.src;
  const animacaoAnterior = hannaSprite.style.animation;

  hannaSprite.src = `assets/sprites/hanna/${evento.sprite}.png`;
  trocarAnimacao(evento.animacao);
  mostrarMensagem(evento.fala);

  setTimeout(() => {
    hannaSprite.src            = spriteAnterior;
    hannaSprite.style.animation = animacaoAnterior;
    eventoEmAndamento           = false;
  }, evento.duracao);

}

/**
 * Agenda eventos aleatórios periodicamente.
 * Intervalo entre 45s e 2min pra parecer natural.
 */
function agendarProximoEvento() {
  const minMs  = 45  * 1000;
  const maxMs  = 120 * 1000;
  const espera = Math.random() * (maxMs - minMs) + minMs;

  setTimeout(() => {
    dispararEventoAleatorio();
    agendarProximoEvento(); // reagenda sempre
  }, espera);
}

// Inicia o ciclo de eventos assim que o script carrega
agendarProximoEvento();

// AÇÕES
btnCarinho.addEventListener("click", () => {
  if (
    hannaSprite.src.includes("dormindo")
  ) {

    mostrarMensagem(
      "A Hanna está dormindo 💤"
    );

    return;
  }
  somBotao.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somBotao.volume =
  parseFloat(
      volumeEfeitos.value
  );

somBotao.play().catch(()=>{});
  vibrar(10);
  if (gatinhaDesbloqueada) tocarPurr();
  felicidade = Math.min(100, felicidade + 10);
  amizade    = Math.min(5,   amizade    + 0.05);
  if (gatinhaDesbloqueada) {

    vinculoGatinhas =
    Math.min(
        100,
        vinculoGatinhas + 2
    );

  }
  sementes++;
  criarParticulas("💖", 8);
  mostrarMensagem("Purrrr 💖");
  hannaSprite.src = "assets/sprites/hanna/carinho.png";
  gatinhaSpriteTemp("gatinha-apaixonada", 2000);
  setTimeout(atualizarStatus, 2000);
});

btnComida.addEventListener("click", () => {
    if (
    hannaSprite.src.includes("dormindo")
    ) {

    mostrarMensagem(
      "A Hanna está dormindo 💤"
    );

    return;
    }

    somBotao.volume =
    parseFloat(
        volumeEfeitos.value
    );

somBotao.play().catch(()=>{});

    fome = Math.min(100, fome + 10);

    amizade = Math.min(5, amizade + 0.05);

    criarParticulas("🐟", 6);

    mostrarMensagem("Miauu! obrigada pela comida 🐟");

    hannaSprite.src =
    "assets/sprites/hanna/comendo.png";

    gatinhaSpriteTemp("gatinha-sorrindo", 2000);

    setTimeout(() => {

        hannaSprite.src =
        "assets/sprites/hanna/neutra.png";

    }, 1000);

    setTimeout(atualizarStatus, 2000);

});

let dormirInterval;


// FUNÇÃO DE DORMIR

function iniciarSono() {

    dormindo = true;

    zzzContainer.style.display = "flex";

    localStorage.setItem("dormindo", "true");

    atualizarStatus(); // roda primeiro

    if (gatinhaDesbloqueada) {
      // Mostra sprite conjunta dormindo — sobrescreve o que atualizarStatus fez
      const spriteConjunta = document.getElementById("spriteConjunta");
      hannaSprite.style.display      = "none";
      gatinhaContainer.style.display = "none";
      spriteConjunta.src             = "assets/sprites/hanna-gatinha/gatinhas-dormindo.png";
      spriteConjunta.style.display   = "block";
    } else {
      hannaSprite.src = "assets/sprites/hanna/dormindo.png";
    }


    clearInterval(dormirInterval);


    dormirInterval = setInterval(() => {

        energia += 0.5;


        if (energia >= 100) {

            energia = 100;

            dormindo = false;

            zzzContainer.style.display = "none";

            localStorage.setItem("dormindo", "false");

            clearInterval(dormirInterval);

            // Restaura sprites individuais se estava mostrando a conjunta
            const spriteConjunta = document.getElementById("spriteConjunta");
            if (spriteConjunta) {
              spriteConjunta.style.animation = "";
              spriteConjunta.style.display   = "none";
            }
            hannaSprite.style.display = "block";
            hannaSprite.style.animation = "";
            if (gatinhaDesbloqueada) gatinhaContainer.style.display = "flex";

            mostrarMensagem("A Hanna acordou descansada 💖");

        }


        atualizarStatus();

    }, 7000);

}


// BOTÃO DORMIR

btnDormir.addEventListener("click", () => {

    somBotao.volume =
    parseFloat(
        volumeEfeitos.value
    );

somBotao.play().catch(()=>{});


    if (dormindo) return;


    mostrarMensagem("A Hanna foi dormir 😴");


    iniciarSono();

});

// PASSAGEM DO TEMPO
setInterval(() => {
  if (!dormindo) {
    fome       = Math.max(0, fome       - 2);
    felicidade = Math.max(0, felicidade - 1);
    energia    = Math.max(0, energia    - 0.5);
    higiene = Math.max(0, higiene - 1);
    atualizarStatus();
  }
}, 60000);                // 1 min

// ENTRAR
btnEntrar.addEventListener("click", () => {

    document.querySelector(".bottomNav")
    .style.display = "flex";

    somBotao.volume =
    parseFloat(
        volumeEfeitos.value
    );

somBotao.play().catch(()=>{});

vibrar(15);

telaInicial.classList.add("fadeOut");

setTimeout(() => {

    telaInicial.style.display = "none";

    abrirTela(telaJogo);

    telaJogo.classList.add("fadeIn");

    tocarTrilha("casa");

    mensagemHorario();

    iniciarFalasIdle();

    iniciarMomentosEspeciais();

    // Mostra a gatinha imediatamente se já foi adotada
    if (gatinhaDesbloqueada) {
        gatinhaContainer.style.display = "flex";
        if (nomeGatinha) nomeDaGatinhaTexto.textContent = nomeGatinha;
    }

}, 800);

});

// Música do menu inicial — começa ao carregar a página
// (browsers modernos bloqueiam autoplay; a música inicia na 1ª interação)
document.addEventListener("click", function iniciarMenuMusic() {
  if (!trilhaAtual) tocarTrilha("menu");
  document.removeEventListener("click", iniciarMenuMusic);
}, { once: true });

// FAZENDA
const slotsPlantacao = document.querySelectorAll(".slotPlantacao");
const valorPlantas = {

    flor: 35,

    rosa: 55,

    morango: 85,

    cenoura: 110,

    abobora: 180,

    lavanda: 260,

    margarida: 350,

    girassol: 3500

};
const fazenda = (() => {
  const salvo = localStorage.getItem("fazenda");
  if (salvo) {
    try { return JSON.parse(salvo); } catch(e) {}
  }
  return [
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
    { plantada:false, pronta:false, flor:"", tempoFim:0 },
  ];
})();

function salvarFazenda() {
  localStorage.setItem("fazenda", JSON.stringify(fazenda));
}

// Restaura sprites dos slots ao carregar
function restaurarSlotsVisuais() {
  slotsPlantacao.forEach((slotHTML, idx) => {
    const slot   = fazenda[idx];
    const sprite = slotHTML.querySelector("img");
    if (!sprite) return;
    if (slot.pronta) {
      sprite.src = `assets/farm/${slot.flor}.png`;
    } else if (slot.plantada) {
      sprite.src = "assets/farm/semente.png";
    } else {
      sprite.src = "assets/farm/vazio.png";
    }
  });
}


// HANNA NA FAZENDA
const hannaFazendaSprite = document.getElementById("hannaFazendaSprite");
const hannaFazendaFala   = document.getElementById("hannaFazendaFala");

const falasFazendaIdle = [
  "Vamos plantar! 🌱",
  "Cuida bem das plantinhas! 🌸",
  "Adoro a fazendinha 🐾",
  "Quando colhemos? 👀",
];

let falaFazendaTimer;

function falarFazenda(texto, sprite) {
  clearTimeout(falaFazendaTimer);
  if (hannaFazendaFala)   hannaFazendaFala.textContent = texto;
  if (hannaFazendaSprite && sprite) hannaFazendaSprite.src = sprite;
  falaFazendaTimer = setTimeout(() => {
    const idle = falasFazendaIdle[Math.floor(Math.random() * falasFazendaIdle.length)];
    if (hannaFazendaFala)   hannaFazendaFala.textContent = idle;
    if (hannaFazendaSprite) hannaFazendaSprite.src = "assets/sprites/hanna/contente.png";
  }, 4000);
}

slotsPlantacao.forEach((slotHTML, idx) => {
  slotHTML.addEventListener("click", () => {
    const slot   = fazenda[idx];
    const sprite = slotHTML.querySelector("img");
    if (!slot.pronta) return;
    moedas += valorPlantas[slot.flor];
    amizade  = Math.min(5, amizade + 0.08);
    slot.plantada = slot.pronta = false;
    slot.flor = "";
    sprite.src = "assets/farm/vazio.png";
    atualizarStatus();
    salvarFazenda();
    mostrarMensagem(`Você colheu! 🪙 +${valorPlantas[slot.flor] || 0}`);
    falarFazenda(`Que colheita boa! 🌸`, "assets/sprites/hanna/brincando.png");
  });
});

// Restaura os visuais dos slots ao carregar a página
restaurarSlotsVisuais();

// ── REAGENDAR CRESCIMENTO DAS PLANTAS OFFLINE ─────────────────
(function reagendarCrescimentoOffline() {
  const agora   = Date.now();
  const PLANTAS = ["rosa","flor","morango","cenoura","abobora","lavanda","margarida","girassol"];
  const MATURACAO = 300000;

  fazenda.forEach((slot, idx) => {
    if (!slot.plantada || slot.pronta) return;

    if (!slot.flor) {
      slot.flor = PLANTAS[Math.floor(Math.random() * PLANTAS.length)];
    }
    if (!slot.tempoFim || slot.tempoFim === 0) {
      slot.tempoFim = agora + 60000;
      salvarFazenda();
    }

    const tempoRestante = slot.tempoFim - agora;

    // Busca o sprite agora pra uso imediato
    const spriteAgora = slotsPlantacao[idx]?.querySelector("img");

    if (tempoRestante <= 0) {
      // Já devia ter brotado offline
      slot.pronta = true;
      salvarFazenda();
      if (spriteAgora) spriteAgora.src = `assets/farm/${slot.flor}.png`;
    } else {
      // Mostra brotinho se passou mais da metade
      const progresso = 1 - tempoRestante / MATURACAO;
      if (spriteAgora && progresso > 0.5) spriteAgora.src = "assets/farm/brotinho.png";

      // Rebusca o sprite dentro do timeout — evita referência stale
      setTimeout(() => {
        slot.pronta = true;
        salvarFazenda();
        const s = slotsPlantacao[idx]?.querySelector("img");
        if (s) s.src = `assets/farm/${slot.flor}.png`;
        mostrarMensagem("Uma flor cresceu! 🌸");
      }, tempoRestante);
    }
  });
})();

btnPlantar.addEventListener("click", () => {

  const slotLivre = fazenda.findIndex(s => !s.plantada);

  if (slotLivre === -1) {

    mostrarMensagem("Todos os canteiros estão ocupados 🌱", "fazenda");
    falarFazenda("Todos os canteiros cheios! 🌿", "assets/sprites/hanna/curiosa.png");

    return;

  }

  if (sementes <= 0) {

    mostrarMensagem("Você não tem sementes", "fazenda");
    falarFazenda("Sem sementes...", "assets/sprites/hanna/triste.png");

    return;

  }

  sementes--;

  atualizarStatus();

  const slot = fazenda[slotLivre];

  const sprite = slotsPlantacao[slotLivre].querySelector("img");

  slot.plantada = true;

  const plantas = [

    "rosa",
    "rosa",

    "flor",
    "flor",

    "morango",
    "morango",

    "cenoura",
    "cenoura",

    "abobora",
    "abobora",

    "lavanda",
    "lavanda",

    "margarida",
    "margarida",

    // MUITO rara 🌻
    "girassol"

  ];

    slot.flor = plantas[
    Math.floor(Math.random() * plantas.length)
    ];

  const tempoMaturacao = 300000; // 5 minutos
  slot.tempoFim = Date.now() + tempoMaturacao;
  salvarFazenda();

  sprite.src = "assets/farm/semente.png";

  sprite.style.display = "none";

  sprite.offsetHeight;

  sprite.style.display = "block";

  mostrarMensagem("A Hanna plantou uma sementinha 🌱");
  falarFazenda("Plantei! Agora é só esperar 💧", "assets/sprites/hanna/feliz.png");

  setTimeout(() => {

    sprite.src = "assets/farm/brotinho.png";

  }, 5000);

  const tempoRestante =
  Math.max(0, slot.tempoFim - Date.now());

  if (tempoRestante <= 0) {

      slot.pronta = true;

      sprite.src = `assets/farm/${slot.flor}.png`;

      salvarFazenda();

      return;

  }

  setTimeout(() => {

      slot.pronta = true;

      salvarFazenda();

      sprite.src = `assets/farm/${slot.flor}.png`;

  }, tempoRestante);

  setTimeout(() => {

    slot.pronta = true;
    salvarFazenda();

    sprite.src = `assets/farm/${slot.flor}.png`;

    mostrarMensagem("Uma flor cresceu! 🌸");
    falarFazenda("Cresceu! Toca pra colher! 🌸", "assets/sprites/hanna/animada.png");

  }, tempoRestante);

});

// CÔMODOS

const COMODOS = ["sala", "quarto", "cozinha"];

function sortearComodo() {
  return COMODOS[Math.floor(Math.random() * COMODOS.length)];
}

let comodoAtual = localStorage.getItem("comodoAtual") || sortearComodo();

function getPeriodo() {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return "dia";
  if (h >= 12 && h < 18) return "tarde";
  return "noite";
}

function aplicarBackgroundComodo() {
  const periodo = getPeriodo();
  const url     = `assets/backgrounds/${comodoAtual}-${periodo}.png`;

  const img = new Image();
  img.onload = () => {
    document.getElementById("cenarioHanna").style.backgroundImage = `url("${url}")`;
  };
  img.onerror = () => {
    const fallback = {
      dia:   "assets/backgrounds/casa-hanna-dia.png",
      tarde: "assets/backgrounds/casa-hanna-tarde.png",
      noite: "assets/backgrounds/casa-hanna-noite.png",
    };
    document.getElementById("cenarioHanna").style.backgroundImage = `url("${fallback[periodo]}")`;
  };
  img.src = url;
}

function trocarComodo() {
  const outros = COMODOS.filter(c => c !== comodoAtual);
  comodoAtual = outros[Math.floor(Math.random() * outros.length)];
  localStorage.setItem("comodoAtual", comodoAtual);

  const cenario = document.getElementById("cenarioHanna");
  cenario.style.transition = "opacity 0.6s ease";
  cenario.style.opacity    = "0";

  setTimeout(() => {
    aplicarBackgroundComodo();
    cenario.style.opacity = "1";
  }, 600);

  setTimeout(() => {
    cenario.style.transition = "";
  }, 1300);
}

aplicarBackgroundComodo();

function agendarTrocaComodo() {
  const minMs = 6  * 60 * 1000;
  const maxMs = 10 * 60 * 1000;
  const espera = Math.random() * (maxMs - minMs) + minMs;
  setTimeout(() => {
    if (!dormindo) trocarComodo();
    agendarTrocaComodo();
  }, espera);
}
agendarTrocaComodo();

// HORÁRIO
function atualizarHorario() {
  const h = new Date().getHours();
  document.body.classList.remove("manha","tarde","noite");
  if      (h >= 6  && h < 12) document.body.classList.add("manha");
  else if (h >= 12 && h < 18) document.body.classList.add("tarde");
  else                         document.body.classList.add("noite");

  aplicarBackgroundComodo();
}
atualizarHorario();
setInterval(atualizarHorario, 60000);

// REAÇÕES ALEATÓRIAS
setInterval(() => {
  if (dormindo) return;
  const reacoes = [
    { sprite:"assets/sprites/hanna/curiosa.png",    frase:"A Hanna está curiosa 👀" },
    { sprite:"assets/sprites/hanna/animada.png",    frase:"A Hanna quer brincar 😺" },
    { sprite:"assets/sprites/hanna/apaixonada.png", frase:"Purrrr 💖" },
  ];
  const r = reacoes[Math.floor(Math.random() * reacoes.length)];
  hannaSprite.src = r.sprite;
  mostrarMensagem(r.frase);
  setTimeout(atualizarStatus, 7000);
}, 300000);             // 2 min

// Loja e Lembretes Botão
btnVoltar.addEventListener("click", () => {

    abrirTela(telaJogo);

    tocarTrilha("casa");

});

if (btnLoja) {

    btnLoja.addEventListener("click", () => {

        abrirTela(telaLoja);

        animarTela(telaLoja);

        tocarTrilha("loja");

    });

}

if (btnLembretes) {

    btnLembretes.addEventListener("click", () => {

        abrirTela(telaLembretes);

        animarTela(telaLembretes);

        tocarTrilha("lembretes");

    });

}

btnUrsinho.addEventListener("click", () => {
  if (moedas < 50) { mostrarAlertaLoja("⚠️ Moedas insuficientes"); return; }
  moedas -= 50;
  somCompra.currentTime = 0; 
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});
  felicidade = Math.min(100, felicidade + 10);
  mostrarMensagem("A Hanna amou a nova coleira 🎀");
  hannaSprite.src = "assets/sprites/hanna/contente.png";
  atualizarStatus();
});

btnMorango.addEventListener("click", () => {
  if (moedas < 30) { mostrarAlertaLoja("⚠️ Moedas insuficientes"); return; }
  moedas -= 30;
  somCompra.currentTime = 0; 
  
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});
  fome = Math.min(100, fome + 15);
  mostrarMensagem("A Hanna devorou o peixinho 🐟");
  hannaSprite.src = "assets/sprites/hanna/comendo.png";
  atualizarStatus();
});

const btnSashimi = document.getElementById("btnSashimi");
const btnNovelo = document.getElementById("btnNovelo");
const btnRatinho = document.getElementById("btnRatinho");
const btnAtum = document.getElementById("btnAtum");
const btnBiscoito = document.getElementById("btnBiscoito");
const btnDonut = document.getElementById("btnDonut");
const btnVarinha = document.getElementById("btnVarinha");
const btnRobo = document.getElementById("btnRobo");
const btnAlmofada = document.getElementById("btnAlmofada");
const btnPedidoEspecial = document.getElementById("btnPedidoEspecial");

btnSashimi.addEventListener("click", () => {
  if (moedas < 80) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 80;
  fome = Math.min(100, fome + 25);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna amou o sashimi 🍣");
  atualizarStatus();
});

btnNovelo.addEventListener("click", () => {
  if (moedas < 120) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 120;
  felicidade = Math.min(100, felicidade + 20);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna brincou com o novelo 🧶");
  atualizarStatus();
});

btnRatinho.addEventListener("click", () => {
  if (moedas < 180) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 180;
  felicidade = Math.min(100, felicidade + 25);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna adorou o ratinho 🐭");
  atualizarStatus();
});

btnAtum.addEventListener("click", () => {
  if (moedas < 150) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 150;
  fome = Math.min(100, fome + 35);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Atum premium delicioso 🐟");
  atualizarStatus();
});

btnBiscoito.addEventListener("click", () => {
  if (moedas < 90) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 90;
  fome = Math.min(100, fome + 10);
  felicidade = Math.min(100, felicidade + 10);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Biscoitinho crocante 💖");
  atualizarStatus();
});

btnDonut.addEventListener("click", () => {
  if (moedas < 110) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 110;
  felicidade = Math.min(100, felicidade + 20);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Donut felino delicioso 🍩");
  atualizarStatus();
});

btnVarinha.addEventListener("click", () => {
  if (moedas < 350) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 350;
  felicidade = Math.min(100, felicidade + 40);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Magia felina ✨");
  atualizarStatus();
});

btnRobo.addEventListener("click", () => {
  if (moedas < 500) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 500;
  felicidade = Math.min(100, felicidade + 50);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Ratinho robô ativado 🤖");
  atualizarStatus();
});

btnAlmofada.addEventListener("click", () => {
  if (moedas < 220) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 220;
  energia = Math.min(100, energia + 20);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna descansou fofinha 💤");
  atualizarStatus();
});

btnPedidoEspecial.addEventListener(
"click", () => {

    if (moedas < 10000) {

        mostrarMensagem(
        "Moedas insuficientes 😿"
        );

        return;

    }

    moedas -= 10000;

    atualizarStatus();

    somCompra.currentTime = 0;

    somCompra.volume =
    parseFloat(
        volumeEfeitos.value
    );

    somCompra.play().catch(()=>{});

    abrirTelaPedido();

});

btnGatinha.addEventListener("click", () => {

  if (
  btnGatinha.dataset.adotado
  === "true"
  ) {

      mostrarAlertaLoja(
      "🖤 Você já tem uma companhia"
      );

      return;

  }

  if (gatinhaDesbloqueada) {

        mostrarAlertaLoja(
    `🖤 ${nomeGatinha || "sua gatinha"} já mora com vocês`
    );

    return;
  }

  if (moedas < 5000) {

    mostrarAlertaLoja("⚠️ Moedas insuficientes");

    return;
  }

  const nomeEscolhido = prompt(
    "Qual será o nome da gatinha? 🖤"
  );

  if (!nomeEscolhido ||
      nomeEscolhido.trim() === "") {

    mostrarMensagem(
      "A adoção foi cancelada 😿"
    );

    return;
  }

  moedas -= 5000;

  gatinhaDesbloqueada = true;

  inputNomeGatinha.disabled =
  false;

  btnSalvarNomeGatinha.disabled =
  false;

inputNomeGatinha.placeholder =
"Digite o nome dela...";

  nomeGatinha =
  nomeEscolhido.trim();

  nomeGatinhaElemento.textContent =
  nomeGatinha;

  // MOSTRAR

  nomeGatinhaElemento.classList.remove(
    "fade-nome-gatinha"
  );

  void nomeGatinhaElemento.offsetWidth;

  // SUMIR

  setTimeout(() => {

    nomeGatinhaElemento.classList.add(
      "fade-nome-gatinha"
    );

  }, 3000);

  localStorage.setItem(
    "gatinhaDesbloqueada",
    "true"
  );

  localStorage.setItem(
    "nomeGatinha",
    nomeGatinha
  );

  gatinhaContainer.style.display = "flex";

  nomeDaGatinhaTexto.textContent = nomeGatinha;

    // MOSTRAR NOME

    nomeDaGatinhaTexto.classList.remove(
      "fade-nome-gatinha"
    );

    void nomeDaGatinhaTexto.offsetWidth;

    // ESCONDER DEPOIS

    setTimeout(() => {

        nomeDaGatinhaTexto.classList.add(
          "fade-nome-gatinha"
        );

    }, 3000);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});
  if (somMeowAdocao) { somMeowAdocao.currentTime = 0; somMeowAdocao.play().catch(()=>{}); }

  mostrarMensagem(
    `${nomeGatinha} foi adotada! 🖤`
  );

  btnGatinha.dataset.adotado =
  "true";

  btnGatinha.textContent =
  "Já adotado 💖";

  btnGatinha.classList.add(
  "btn-adotado"
  );

  atualizarStatus();
  iniciarMomentosGatinha();
});

// LEMBRETES
if (btnVoltarLembretes) {

    btnVoltarLembretes.addEventListener("click", () => {

        abrirTela(telaJogo);

        tocarTrilha("casa");

    });

}

// RECORRÊNCIA DE LEMBRETES
function proximoTimestamp(lembrete) {
  const base = lembrete.timestamp ? new Date(lembrete.timestamp) : new Date();
  const agora = new Date();
  let proxima = new Date(base);

  switch (lembrete.recorrencia) {
    case "diario":
      proxima.setDate(proxima.getDate() + 1);
      break;
    case "semanal":
      proxima.setDate(proxima.getDate() + 7);
      break;
    case "mensal":
      proxima.setMonth(proxima.getMonth() + 1);
      break;
    case "anual":
      proxima.setFullYear(proxima.getFullYear() + 1);
      break;
  }

  // Se a próxima ainda é no passado, avança até ficar no futuro
  while (proxima <= agora) {
    switch (lembrete.recorrencia) {
      case "diario":  proxima.setDate(proxima.getDate() + 1); break;
      case "semanal": proxima.setDate(proxima.getDate() + 7); break;
      case "mensal":  proxima.setMonth(proxima.getMonth() + 1); break;
      case "anual":   proxima.setFullYear(proxima.getFullYear() + 1); break;
      default: return proxima.getTime();
    }
  }
  return proxima.getTime();
}

function processarRecorrencias() {
  const agora = Date.now();
  let mudou = false;
  lembretes.forEach((l, i) => {
    // Se tem recorrência, não foi feito, e o timestamp já passou — reseta
    if (l.recorrencia && l.recorrencia !== "nenhuma" && l.feito && l.timestamp && l.timestamp <= agora) {
      lembretes[i].feito     = false;
      lembretes[i].timestamp = proximoTimestamp(l);
      mudou = true;
    }
  });
  if (mudou) localStorage.setItem("lembretes", JSON.stringify(lembretes));
}

function renderizarLembretes() {
  // Verifica e processa recorrências antes de renderizar
  processarRecorrencias();

  listaLembretes.innerHTML = "";
  if (lembretes.length === 0) {
    listaLembretes.innerHTML = `
      <div style="text-align:center;padding:24px 0;color:#b080c8;font-size:13px;font-weight:700;">
        Nenhum lembrete ainda 🐾<br>
        <span style="font-size:12px;opacity:.7;">Crie o primeiro acima!</span>
      </div>`;
    return;
  }

  const badgeRecorrencia = {
    diario:  "📅 diário",
    semanal: "📆 semanal",
    mensal:  "🗓️ mensal",
    anual:   "🎂 anual",
  };

  lembretes.forEach((lembrete, index) => {
    const div = document.createElement("div");
    div.className = "lembrete";
    const badge = lembrete.recorrencia && lembrete.recorrencia !== "nenhuma"
      ? `<span class="lembrete-badge">${badgeRecorrencia[lembrete.recorrencia] || ""}</span>`
      : "";
    div.innerHTML = `
      <div class="topoLembrete">
        <label class="checkboxContainer">
          <input type="checkbox" class="checkboxLembrete" ${lembrete.feito ? "checked" : ""}>
          <span class="checkmark"></span>
          <div class="lembrete-info">
            <span class="textoLembrete">${lembrete.texto}</span>
            ${badge}
          </div>
        </label>
        <div class="acoesLembrete">
          <button class="btnEditar" title="Editar">✏️</button>
          <button class="btnExcluir" title="Excluir">🗑️</button>
        </div>
      </div>`;

    // Checkbox — marcar como feito
    div.querySelector(".checkboxLembrete").addEventListener("change", (e) => {
      if (!e.target.checked) return;

      div.classList.add("lembrete-concluindo");

      setTimeout(() => {
        const rec = lembrete.recorrencia || "nenhuma";

        if (rec !== "nenhuma") {
          // Recorrente: reagenda para a próxima ocorrência
          lembretes[index].feito     = false;
          lembretes[index].timestamp = proximoTimestamp(lembrete);
          // Atualiza data no texto se tiver
          if (lembrete.data) {
            const novaData = new Date(lembretes[index].timestamp)
              .toISOString().slice(0, 10);
            lembretes[index].data  = novaData;
            lembretes[index].texto = lembretes[index].texto.replace(
              /— \d{4}-\d{2}-\d{2}/, `— ${novaData}`
            );
          }
          const labels = { diario:"diário", semanal:"semanal", mensal:"mensal", anual:"anual" };
          mostrarMensagem(`🔁 Lembrete ${labels[rec]} reagendado!`);
        } else {
          // Único: remove
          cancelarNotificacaoSW(lembrete.id);
          lembretes.splice(index, 1);
        }

        localStorage.setItem("lembretes", JSON.stringify(lembretes));
        renderizarLembretes();
      }, 1800);
    });

    // Excluir
    div.querySelector(".btnExcluir").addEventListener("click", () => {
      cancelarNotificacaoSW(lembrete.id);
      lembretes.splice(index, 1);
      localStorage.setItem("lembretes", JSON.stringify(lembretes));
      renderizarLembretes();
    });

    // Editar
    div.querySelector(".btnEditar").addEventListener("click", () => {
      const novo = prompt("Editar lembrete:", lembrete.texto);
      if (novo !== null && novo.trim() !== "") {
        lembretes[index].texto = novo.trim();
        localStorage.setItem("lembretes", JSON.stringify(lembretes));
        renderizarLembretes();
      }
    });

    listaLembretes.appendChild(div);
  });
}

// Mostrar/esconder recorrência conforme o tipo
const rowRecorrencia      = document.getElementById("rowRecorrencia");
const recorrenciaLembrete = document.getElementById("recorrenciaLembrete");

tipoLembrete.addEventListener("change", () => {
  const tipo = tipoLembrete.value;
  if (tipo === "⏰" || tipo === "🎂") {
    rowRecorrencia.style.display = "block";
    // Pré-seleciona anual para aniversários
    if (tipo === "🎂") recorrenciaLembrete.value = "anual";
    else recorrenciaLembrete.value = "nenhuma";
  } else {
    rowRecorrencia.style.display = "none";
    recorrenciaLembrete.value = "nenhuma";
  }
});

btnSalvarLembrete.addEventListener("click", async () => {
  const texto = inputLembrete.value.trim();
  if (!texto) return;

  const tipo        = tipoLembrete.value;
  const data        = dataLembrete.value;
  const hora        = horaLembrete.value;
  const recorrencia = recorrenciaLembrete ? recorrenciaLembrete.value : "nenhuma";

  let conteudo = `${tipo} ${texto}`;
  if (tipo === "🎂" && data) conteudo += ` — ${data}`;
  if (tipo === "⏰" && data) conteudo += ` — ${data}`;
  if (tipo === "⏰" && hora) conteudo += ` às ${hora}`;

  // Monta timestamp
  let timestamp = null;
  if (data && hora) {
    timestamp = new Date(`${data}T${hora}:00`).getTime();
  } else if (hora) {
    const hoje = new Date().toISOString().slice(0, 10);
    timestamp = new Date(`${hoje}T${hora}:00`).getTime();
  } else if (tipo === "🎂" && data) {
    // Aniversário sem hora: notifica às 08:00
    timestamp = new Date(`${data}T08:00:00`).getTime();
  }

  const id = Date.now();
  const novoLembrete = { id, tipo, recorrencia, texto: conteudo, data, hora, feito: false, timestamp };

  lembretes.push(novoLembrete);
  localStorage.setItem("lembretes", JSON.stringify(lembretes));
  renderizarLembretes();

  // Agenda notificação
  if (timestamp && timestamp > Date.now()) {
    const permitido = await pedirPermissaoNotificacao();
    if (permitido) {
      const sw = await navigator.serviceWorker.ready;
      sw.active?.postMessage({ tipo: "AGENDAR_LEMBRETE", id, texto: conteudo, timestamp });
      mostrarMensagem("✅ Lembrete agendado!");
    } else {
      mostrarMensagem("⚠️ Permita notificações para ser lembrado!");
    }
  }

  inputLembrete.value        = "";
  dataLembrete.value         = "";
  horaLembrete.value         = "";
  recorrenciaLembrete.value  = "nenhuma";
  rowRecorrencia.style.display = "none";
  tipoLembrete.value         = "📚";
});

// ── INIT ─────────────────────────────────────
atualizarStatus();
renderizarLembretes();
iniciarMomentosGatinha();

// Reagenda notificações pendentes após reload
(async () => {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const sw = await navigator.serviceWorker.ready;
  const agora = Date.now();
  lembretes.forEach(l => {
    if (l.timestamp && l.timestamp > agora && !l.feito) {
      sw.active?.postMessage({
        tipo:      "AGENDAR_LEMBRETE",
        id:        l.id,
        texto:     l.texto,
        timestamp: l.timestamp,
      });
    }
  });
})();

// CONTINUAR SONO APÓS RELOAD

if (dormindo) {

    iniciarSono();

}

// LISTENERS DE NAVEGAÇÃO

// Botão de minigames na tela principal
document.getElementById("btnMinigames").addEventListener("click", () => {
  abrirTela(telaMinigames);
  document.querySelector(".bottomNav").style.display = "none";
  tocarTrilha("minigames");
  window.scrollTo(0, 0);
});

let telaAnteriorConfig = "casa";

// ── BOTÃO MUTE ───────────────────────────────────────────────
let isMuted = localStorage.getItem("muted") === "true";

const btnMute    = document.getElementById("btnMute");
const iconeMute  = document.getElementById("iconeMute");
const textMute   = document.getElementById("textMute");

function aplicarMute() {

  Object.values(trilhas).forEach(audio => {

    if (!audio) return;

    audio.muted = isMuted;

  });

  if (iconeMute) {

    iconeMute.textContent =
    isMuted ? "🔇" : "🔊";

  }

  if (textMute) {

    textMute.textContent =
    isMuted ? "Mudo" : "Som";

  }

  localStorage.setItem("muted", isMuted);

}

if (btnMute) {
  btnMute.addEventListener("click", () => {
    isMuted = !isMuted;
    aplicarMute();
    if (!isMuted && trilhaAtual && trilhas[trilhaAtual]) {
      trilhas[trilhaAtual].play().catch(() => {});
    }
  });
}

// Aplica estado de mute salvo ao carregar
aplicarMute();

btnCarta.addEventListener("click", () => {

  abrirTela(telaCarta);

  animarTela(telaCarta);

  window.scrollTo(0, 0);

});

btnVoltarCarta.addEventListener("click", () => {

  abrirTela(telaConfig);

  animarTela(telaConfig);

  window.scrollTo(0, 0);

});

// MODO ESCURO

const modoSalvo =

localStorage.getItem(
    "modoNoturno"
) === "true";

// APLICA AO ABRIR

if (modoSalvo) {

    document.body.classList.add(
        "dark-mode"
    );

} else {

    document.body.classList.remove(
        "dark-mode"
    );

}

// TEXTO BOTÃO

btnModoNoturno.textContent =

modoSalvo

? "Desativar modo escuro"

: "Ativar modo escuro";

// BOTÃO

btnModoNoturno.onclick = () => {

    const ativo =

    document.body.classList.toggle(
        "dark-mode"
    );

    localStorage.setItem(
        "modoNoturno",
        ativo
    );

    btnModoNoturno.textContent =

    ativo

    ? "Desativar modo escuro"

    : "Ativar modo escuro";

};

// Voltar do menu de minigames
document.getElementById("btnVoltarMinigames").addEventListener("click", () => {

  abrirTela(telaJogo);

  document.querySelector(".bottomNav")
  .style.display = "flex";

  tocarTrilha("casa");

});

// Voltar da arena
document.getElementById("btnVoltarArena").addEventListener("click", voltarParaMenu);

// Cards: iniciar jogo ao clicar em "Jogar"
document.querySelectorAll(".mg-btn-jogar").forEach(btn => {
  btn.addEventListener("click", () => {
    const jogo = btn.dataset.jogo;
    if      (jogo === "memoria")   jogoMemoria();
    else if (jogo === "peixe")     jogoPeixe();
    else if (jogo === "humor")     jogoHumor();
    else if (jogo === "reflexo")   jogoReflexo();
    else if (jogo === "cartinhas") jogoCartinhas();
    else if (jogo === "sardinha")  jogoSardinha();
  });
});


//   JOGO DA MEMÓRIA DAS CARTINHAS

function jogoCartinhas() {
  abrirArena("Cartinhas da Hanna");

  // ── DIFICULDADE ─────────────────────────────────────────
  // Fácil  = 6 pares (12 cartas)  | grid 4×3
  // Médio  = 10 pares (20 cartas) | grid 4×5
  // Difícil= 14 pares (28 cartas) | grid 4×7
  // A dificuldade é escolhida antes de iniciar

  const SPRITES = [
    { id: "animada",   src: "assets/sprites/hanna/animada.png",   nome: "Animada"   },
    { id: "apaixonada",src: "assets/sprites/hanna/apaixonada.png",nome: "Apaixonada"},
    { id: "assustada", src: "assets/sprites/hanna/assustada.png", nome: "Assustada" },
    { id: "brava",     src: "assets/sprites/hanna/brava.png",     nome: "Brava"     },
    { id: "carinho",   src: "assets/sprites/hanna/carinho.png",   nome: "Carinho"   },
    { id: "comendo",   src: "assets/sprites/hanna/comendo.png",   nome: "Comendo"   },
    { id: "contente",  src: "assets/sprites/hanna/contente.png",  nome: "Contente"  },
    { id: "curiosa",   src: "assets/sprites/hanna/curiosa.png",   nome: "Curiosa"   },
    { id: "dormindo",  src: "assets/sprites/hanna/dormindo.png",  nome: "Dormindo"  },
    { id: "feliz",     src: "assets/sprites/hanna/feliz.png",     nome: "Feliz"     },
    { id: "hanna",     src: "assets/sprites/hanna/hanna.png",     nome: "Hanna"     },
    { id: "neutra",    src: "assets/sprites/hanna/neutra.png",    nome: "Neutra"    },
    { id: "sonolenta", src: "assets/sprites/hanna/sonolenta.png", nome: "Sonolenta" },
    { id: "triste",    src: "assets/sprites/hanna/triste.png",    nome: "Triste"    },
  ];

  // TELA DE SELEÇÃO DE DIFICULDADE
  arenaConteudo.innerHTML = `
    <div class="cartinha-dif-wrap">

      <div class="cartinha-hanna-topo">
        <img src="assets/sprites/hanna/animada.png" id="cartinhaDifHanna">
        <div class="cartinha-fala">Escolha a dificuldade! 🃏</div>
      </div>

      <div class="cartinha-dif-lista">

        <button class="cartinha-dif-btn" data-dif="facil">
          <span class="cartinha-dif-emoji">🌸</span>
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Fácil</div>
            <div class="cartinha-dif-desc">6 pares · 12 cartas</div>
            <div class="cartinha-dif-recomp">🪙 até 15 moedas</div>
          </div>
        </button>

        <button class="cartinha-dif-btn" data-dif="medio">
          <span class="cartinha-dif-emoji">🐾</span>
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Médio</div>
            <div class="cartinha-dif-desc">10 pares · 20 cartas</div>
            <div class="cartinha-dif-recomp">🪙 até 30 moedas</div>
          </div>
        </button>

        <button class="cartinha-dif-btn" data-dif="dificil">
          <span class="cartinha-dif-emoji">⚡</span>
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Difícil</div>
            <div class="cartinha-dif-desc">14 pares · 28 cartas</div>
            <div class="cartinha-dif-recomp">🪙 até 50 moedas</div>
          </div>
        </button>

      </div>
    </div>`;

  document.querySelectorAll(".cartinha-dif-btn").forEach(btn => {
    btn.addEventListener("click", () => iniciarCartinhas(btn.dataset.dif));
  });

  // JOGO 5
  function iniciarCartinhas(dificuldade) {
    pararJogoAtivo();

    const config = {
      facil:   { pares: 6,  colunas: 4, moedaBase: 60,  tempoBase: 90  },
      medio:   { pares: 10, colunas: 4, moedaBase: 140, tempoBase: 150 },
      dificil: { pares: 14, colunas: 4, moedaBase: 260, tempoBase: 210 },
    }[dificuldade];

    // Embaralha e pega os sprites necessários
    const spritesEscolhidos = [...SPRITES]
      .sort(() => Math.random() - .5)
      .slice(0, config.pares);

    // Duplica e embaralha para formar pares
    const cartas = [...spritesEscolhidos, ...spritesEscolhidos]
      .sort(() => Math.random() - .5)
      .map((s, i) => ({ ...s, uid: i, virada: false, encontrada: false }));

    let tempo        = config.tempoBase;
    let viradas      = [];   // máx 2 cartas viradas
    let bloqueado    = false;
    let paresAcertos = 0;
    let erros        = 0;
    let movimentos   = 0;

    // RENDER
    arenaConteudo.innerHTML = `
      <div class="cartinha-hud">
        <div class="cartinha-hud-item">⏱️ <span id="ctTimer">${tempo}</span>s</div>
        <div class="cartinha-hud-item">🃏 <span id="ctPares">0</span>/${config.pares}</div>
        <div class="cartinha-hud-item">👆 <span id="ctMovs">0</span></div>
      </div>

      <div class="cartinha-grid" id="ctGrid"
        style="grid-template-columns: repeat(${config.colunas}, 1fr);">
      </div>`;

    const grid    = document.getElementById("ctGrid");
    const timerEl = document.getElementById("ctTimer");
    const paresEl = document.getElementById("ctPares");
    const movsEl  = document.getElementById("ctMovs");

    // Cria as cartas no DOM
    cartas.forEach(carta => {
      const el = document.createElement("div");
      el.className   = "cartinha";
      el.dataset.uid = carta.uid;
      el.innerHTML = `
        <div class="cartinha-inner">
          <div class="cartinha-frente">
            <img src="${carta.src}" alt="${carta.nome}">
            <span>${carta.nome}</span>
          </div>
          <div class="cartinha-verso"></div>
        </div>`;

      el.addEventListener("click", () => clicarCarta(carta, el));
      grid.appendChild(el);
    });

    // LÓGICA
    function clicarCarta(carta, el) {
      if (bloqueado) return;
      if (carta.virada || carta.encontrada) return;
      if (viradas.length >= 2) return;

      carta.virada = true;
      el.classList.add("virada");
      viradas.push({ carta, el });

      if (viradas.length === 2) {
        movimentos++;
        movsEl.textContent = movimentos;
        bloqueado = true;
        const [a, b] = viradas;

        if (a.carta.id === b.carta.id) {
          // PAR ENCONTRADO
          paresAcertos++;
          paresEl.textContent = paresAcertos;
          a.el.classList.add("encontrada");
          b.el.classList.add("encontrada");
          a.carta.encontrada = b.carta.encontrada = true;
          viradas = [];
          bloqueado = false;

          if (paresAcertos === config.pares) terminar(true);

        } else {
          // ERROU — vira de volta
          erros++;
          a.el.classList.add("errada");
          b.el.classList.add("errada");

          jogoAtivo.timers.push(setTimeout(() => {
            a.carta.virada = b.carta.virada = false;
            a.el.classList.remove("virada","errada");
            b.el.classList.remove("virada","errada");
            viradas  = [];
            bloqueado = false;
          }, 900));
        }
      }
    }

    // TIMER
    const countdown = setInterval(() => {
      tempo--;
      timerEl.textContent = tempo;
      if (tempo <= 10) timerEl.style.color = "#ff5555";
      if (tempo <= 0) { clearInterval(countdown); terminar(false); }
    }, 1000);
    jogoAtivo.intervals.push(countdown);

    // RESULTADO
    function terminar(venceu) {
      pararJogoAtivo();

      let moedas_ganhas = 0;

      if (venceu) {
        // Recompensa baseada em tempo restante e erros
        const bonusTempo  = Math.floor(tempo / config.tempoBase * config.moedaBase * 0.4);
        const bonusErros  = Math.max(0, config.moedaBase * 0.6 - erros * 2);
        moedas_ganhas = Math.min(config.moedaBase, Math.max(5, Math.round(bonusTempo + bonusErros)));
      } else {
        // Perdeu: ganha proporcional aos pares encontrados
        moedas_ganhas = Math.floor(paresAcertos / config.pares * config.moedaBase * 0.4);
      }

      ganharMoedas(moedas_ganhas);

      const emoji = venceu
        ? (erros <= 5 ? "🏆" : "🎉")
        : (paresAcertos >= config.pares * 0.6 ? "😺" : "😿");

      const titulo = venceu
        ? (erros <= 3 ? "Perfeito! Memória incrível!" : "Você completou!")
        : "Tempo esgotado!";

      const desc = venceu
        ? `${movimentos} movimentos · ${erros} erros · ${tempo}s restantes`
        : `Você encontrou ${paresAcertos} de ${config.pares} pares.`;

      jogoAtivo.timers.push(setTimeout(() => {
        mostrarResultado(titulo, emoji, moedas_ganhas, desc, jogoCartinhas);
      }, 600));
    }
  }
}

// VOLTAR FAZENDA

document.getElementById("btnVoltarFazenda")
.onclick = function () {

    abrirTela(telaJogo);

    tocarTrilha("casa");

};


// BANHO

btnBanho.addEventListener("click", () => {

    telaBanho.style.display = "flex";

    somBanho.currentTime = 0;

    somBanho.volume =
    parseFloat(
        volumeEfeitos.value
    );

    somBanho.play().catch(()=>{});

    mostrarMensagem("A Hanna está tomando banho 🫧");

    criarParticulas("🫧", 18);

    hannaSprite.src =
    "assets/sprites/hanna/banho.png";

    gatinhaSpriteTemp("gatinha-assustada", 9000);

    setTimeout(() => {

        hannaSprite.src =
        "assets/sprites/hanna/neutra.png";

    }, 1200);

    higiene = Math.min(100, higiene + 100);

    felicidade = Math.min(100, felicidade + 5);

    atualizarStatus();

    setTimeout(() => {

        telaBanho.style.display = "none";

        somBanho.pause();

    }, 9000);

});


// ABRIR FAZENDA

btnAbrirFazenda.onclick = () => {

    abrirTela(telaFazenda);

    animarTela(telaFazenda);

    tocarTrilha("fazenda");

    balaoFazenda.classList.remove("fade-out-balao");

    void balaoFazenda.offsetWidth;

    setTimeout(() => {
        balaoFazenda.classList.add("fade-out-balao");
    }, 4000);

};


// NAVBAR

navHome.onclick = () => {

    abrirTela(telaJogo);

    tocarTrilha("casa");

};


navFarm.onclick = () => {

    abrirTela(telaFazenda);

    tocarTrilha("fazenda");

};


navLoja.onclick = () => {

    abrirTela(telaLoja);

    tocarTrilha("loja");

};


navLembretes.onclick = () => {

    abrirTela(telaLembretes);

    renderizarLembretes();

    tocarTrilha("lembretes");

};

// NAV GAMES

navGames.onclick = () => {

    // GARANTE NAVBAR VISÍVEL

    document.querySelector(".bottomNav")
    .style.display = "flex";

    abrirTela(telaMinigames);

    animarTela(telaMinigames);

    tocarTrilha("minigames");

    window.scrollTo(0, 0);

};

// NAV CONFIG

navConfig.onclick = () => {

    abrirTela(telaConfig);

    animarTela(telaConfig);

    window.scrollTo(0, 0);

};

function animacoesAleatoriasHanna() {

    const expressoes = [

        "curiosa.png",

        "feliz.png",

        "contente.png",

        "animada.png"

    ];

    setInterval(() => {

        if (dormindo) return;

        const aleatoria = expressoes[
            Math.floor(Math.random() * expressoes.length)
        ];

        hannaSprite.src =
        "assets/sprites/hanna/" + aleatoria;

        setTimeout(() => {

            if (!dormindo) {

                hannaSprite.src =
                "assets/sprites/hanna/neutra.png";

            }

        }, 2500);

    }, 12000);

}

function atualizarPeriodoDoDia() {

    const hora = new Date().getHours();

    const overlay =
    document.getElementById("overlayPeriodo");

    overlay.className = "";

    if (hora >= 17 && hora < 19) {

        overlay.classList.add("periodo-tarde");

    }

    else if (hora >= 19 && hora < 24) {

    overlay.classList.add("periodo-noite");

    // EVENTO ESPECIAL NOTURNO

    if (
        Math.random() < 0.08 &&
        eventoNoite.style.display !== "block"
    ) {

       // ativarEventoNoite();

    }

  }

    else if (hora >= 0 && hora < 6) {

        overlay.classList.add("periodo-madrugada");

    }

    const chanceChuva = Math.random();

    if (chanceChuva < 0.25) {

      overlay.classList.add("periodo-chuva");

    iniciarChuva();

}

}

atualizarPeriodoDoDia();


// CONFIG ÁUDIO

// CARREGAR VOLUMES

// ── PAUSAR AO MINIMIZAR / RETOMAR AO VOLTAR ──────────────────
function pausarTodasTrilhas() {
    Object.values(trilhas).forEach(audio => {
        if (!audio) return;
        audio.pause();
    });
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pausarTodasTrilhas();
    } else if (!isMuted && trilhaAtual && trilhas[trilhaAtual]) {
        trilhas[trilhaAtual].play().catch(() => {});
    }
});

window.addEventListener("pagehide", pausarTodasTrilhas);

function escreverPedido(texto, aoTerminar) {

    textoPedido.textContent = "";

    let i = 0;

    const intervalo =
    setInterval(() => {

        textoPedido.textContent +=
        texto.charAt(i);

        i++;

        if (i >= texto.length) {

            clearInterval(intervalo);

            if (aoTerminar) {
                setTimeout(aoTerminar, 400);
            }

        }

    }, 45);

}

function abrirTelaPedido() {

    telaPedido.style.display =
    "flex";

    btnSimPedido.style.display = "none";
    btnNaoPedido.style.display = "none";

    tocarTrilha("pedido");

    const texto =
`Hanna olha timidamente para ${nomeGatinha} se ajoelha e diz...

Depois de tantos momentos juntas,
tantos carinhos,
tantas aventuras e tantas noites felizes...

ela queria fazer uma perguntinha muito importante...

Você quer namorar comigo?`;

    escreverPedido(texto, () => {
        btnSimPedido.style.display = "block";
        btnNaoPedido.style.display = "block";
    });

}

// ── LISTENERS DOS BOTÕES DO PEDIDO ────────────────────────
btnSimPedido.addEventListener("click", () => {
    abrirPedidoReal();
});

let naoPedidoCliques = 0;
const frasesNao = [
    "Tem certeza? 🥺",
    "Pensa melhor...",
    "Não me deixa assim 😿",
    "Só mais uma chance? 💖",
    "Vai lá, aperta o SIM!",
];

btnNaoPedido.addEventListener("click", () => {
    naoPedidoCliques++;
    if (naoPedidoCliques >= frasesNao.length) {
        // Depois de muitas recusas, redireciona pra tela principal
        telaPedido.style.display = "none";
        // Reseta posição do botão pra próxima vez
        btnNaoPedido.style.position = "";
        btnNaoPedido.style.left = "";
        btnNaoPedido.style.top = "";
        btnNaoPedido.style.zIndex = "";
        btnNaoPedido.textContent = "NÃO";
        naoPedidoCliques = 0;
        tocarTrilha("casa");
        mostrarMensagem("A Hanna ficou triste... 😿");
        return;
    }
    // Move o botão pra um lugar aleatório pra ficar difícil clicar
    const maxX = window.innerWidth - 120;
    const maxY = window.innerHeight - 60;
    btnNaoPedido.style.position = "fixed";
    btnNaoPedido.style.left = Math.random() * maxX + "px";
    btnNaoPedido.style.top  = Math.random() * maxY + "px";
    btnNaoPedido.style.zIndex = "10001";
    btnNaoPedido.textContent = frasesNao[naoPedidoCliques - 1];
});

// Botão de aceitar na telaPedidoReal
const btnAceitarPedidoEl = document.getElementById("btnAceitarPedido");
if (btnAceitarPedidoEl) {
    btnAceitarPedidoEl.addEventListener("click", () => {
        tocarTrilha("casa");
        // Partículas de celebração
        for (let i = 0; i < 3; i++) {
            setTimeout(() => criarParticulas("💖", 10), i * 300);
            setTimeout(() => criarParticulas("🌟", 8), i * 300 + 150);
        }
        mostrarMensagem("Que momento especial!");
    });
}

// JOGO 6

function jogoSardinha() {
  abrirArena("Operação Sardinha");
  const arena = document.getElementById("arenaConteudo");

  // ── ESCOLHA DE AGENTE ──────────────────────────────────────
  arena.innerHTML = `
    <div class="sardinha-escolha">
      <div class="sardinha-titulo-op">ESCOLHA SUA AGENTE</div>
      <div class="sardinha-subtitle">quem vai defender as sardinhas?</div>
      <div class="sardinha-agentes">
        <div class="sardinha-agente" data-agente="hanna">
          <img src="assets/sprites/hanna-gatinha/hanna-cod.png" class="sardinha-agente-img">
          <div class="sardinha-agente-nome">Hanna</div>
          <div class="sardinha-agente-desc">Protagonista 🤍<br>Tiro rápido</div>
        </div>
        <div class="sardinha-agente ${gatinhaDesbloqueada ? '' : 'sardinha-agente-locked'}" data-agente="kika">
          <img src="assets/sprites/hanna-gatinha/gatinha-cod.png" class="sardinha-agente-img">
          <div class="sardinha-agente-nome">Kika ${gatinhaDesbloqueada ? '' : '🔒'}</div>
          <div class="sardinha-agente-desc">${gatinhaDesbloqueada ? 'Parceira 🖤<br>Dano duplo' : 'Desbloqueie na loja!'}</div>
        </div>
      </div>
    </div>`;

  arena.querySelectorAll(".sardinha-agente:not(.sardinha-agente-locked)").forEach(el => {
    el.addEventListener("click", () => iniciarSardinha(el.dataset.agente));
  });
}

function iniciarSardinha(agente) {
  const arena = document.getElementById("arenaConteudo");

  const AGENTES = {
    hanna: { img: "assets/sprites/hanna/animada.png",         dano: 1, cadencia: 700 },
    kika:  { img: "assets/sprites/gatinha/gatinha-animada.png", dano: 2, cadencia: 900 },
  };
  const cfg = AGENTES[agente];

  // Estado do jogo
  let vidas       = 3;
  let onda        = 1;
  let ratosOnda   = 5;
  let ratosVivos  = 0;
  let ratosPassaram = 0;
  let score       = 0;
  let gameOver    = false;
  let atirando    = false;

  // HTML DA ARENA 
  arena.innerHTML = `
    <div class="sardinha-hud">
      <div class="sardinha-hud-esq">
        <span id="srd-onda">Onda 1</span>
        <span id="srd-ratos">🐭 5</span>
      </div>
      <div class="sardinha-hud-dir">
        <span id="srd-vidas">❤️❤️❤️</span>
      </div>
    </div>

    <div class="sardinha-campo" id="srdCampo">
      <!-- sardinha alvo no fundo -->
      <div class="sardinha-alvo" id="srdAlvo">
        <span style="font-size:32px;">🐟</span>
        <div class="sardinha-alvo-label">Despensa</div>
      </div>

      <!-- agente jogador -->
      <div class="sardinha-player" id="srdPlayer">
        <img src="${cfg.img}" class="sardinha-player-img" id="srdPlayerImg">
        <div class="sardinha-mira" id="srdMira">🎯</div>
      </div>
    </div>

    <div class="sardinha-instrucao" id="srdInstrucao">
      Toque nos 🐭 para atirar!
    </div>`;

  const campo       = document.getElementById("srdCampo");
  const hudOnda     = document.getElementById("srd-onda");
  const hudRatos    = document.getElementById("srd-ratos");
  const hudVidas    = document.getElementById("srd-vidas");
  const instrucao   = document.getElementById("srdInstrucao");

  function atualizarHUD() {
    hudOnda.textContent   = `Onda ${onda}`;
    hudRatos.textContent  = `🐭 ${ratosVivos}`;
    const coracoes = "❤️".repeat(vidas) + "🖤".repeat(Math.max(0, 3 - vidas));
    hudVidas.textContent  = coracoes;
    document.getElementById("arenaScore").textContent = score;
  }

  // SPAWN DE RATO
  function spawnRato() {
    if (gameOver) return;
    ratosVivos++;
    atualizarHUD();

    const rato = document.createElement("div");
    rato.className = "sardinha-rato";
    rato.innerHTML = `<span class="srd-rato-emoji">🐭</span>`;

    // Posição aleatória no topo/laterais
    const lado = Math.random();
    if (lado < 0.6) {
      rato.style.left = (10 + Math.random() * 80) + "%";
      rato.style.top  = "-40px";
    } else if (lado < 0.8) {
      rato.style.left = "-40px";
      rato.style.top  = (10 + Math.random() * 40) + "%";
    } else {
      rato.style.left = "calc(100% + 10px)";
      rato.style.top  = (10 + Math.random() * 40) + "%";
    }

    campo.appendChild(rato);

    // Clique no rato = atirar
    rato.addEventListener("click", () => {
      if (gameOver || rato.dataset.morto) return;
      rato.dataset.morto = "1";

      // Efeito de tiro
      rato.innerHTML = `<span style="font-size:22px;">💥</span>`;
      rato.style.transform = "scale(1.4)";

      // Flash no player
      const playerImg = document.getElementById("srdPlayerImg");
      if (playerImg) {
        playerImg.style.filter = "brightness(2)";
        setTimeout(() => playerImg.style.filter = "", 150);
      }

      const ganho = cfg.dano === 2 ? 3 : 2;
      score += ganho;
      atualizarHUD();

      jogoAtivo.timers.push(setTimeout(() => {
        rato.remove();
        ratosVivos--;
        atualizarHUD();
        verificarFimOnda();
      }, 300));
    });

    // Rato se move em direção à despensa
    const duracaoMs = Math.max(3500 - onda * 250, 1500);
    rato.style.transition = `top ${duracaoMs}ms linear, left ${duracaoMs}ms linear`;

    jogoAtivo.timers.push(setTimeout(() => {
      rato.style.top  = "75%";
      rato.style.left = "45%";
    }, 50));

    // Se chegar à despensa sem ser clicado
    jogoAtivo.timers.push(setTimeout(() => {
      if (rato.dataset.morto || gameOver) return;
      rato.dataset.morto = "1";
      rato.remove();
      ratosVivos--;

      // Efeito de dano
      const alvo = document.getElementById("srdAlvo");
      if (alvo) {
        alvo.style.animation = "sardinhaDano .4s ease";
        setTimeout(() => alvo.style.animation = "", 400);
      }

      vidas--;
      atualizarHUD();

      if (vidas <= 0) {
        encerrarSardinha(false);
      } else {
        verificarFimOnda();
      }
    }, duracaoMs + 100));
  }

  // ONDAS
  function iniciarOnda() {
    if (gameOver) return;
    ratosOnda  = 4 + onda * 2;
    ratosVivos = 0;
    instrucao.textContent = `⚠️ Onda ${onda} — ${ratosOnda} ratos!`;
    instrucao.style.opacity = "1";

    jogoAtivo.timers.push(setTimeout(() => {
      instrucao.style.opacity = "0";
    }, 1500));

    let spawned = 0;
    const intervaloSpawn = Math.max(1200 - onda * 80, 500);
    const spawnId = setInterval(() => {
      if (gameOver || spawned >= ratosOnda) { clearInterval(spawnId); return; }
      spawnRato();
      spawned++;
    }, intervaloSpawn);
    jogoAtivo.intervals.push(spawnId);
  }

  function verificarFimOnda() {
    if (gameOver) return;
    // Verifica se todos foram spawnados e não há mais ratos
    const ratosNoCampo = campo.querySelectorAll(".sardinha-rato:not([data-morto])").length;
    if (ratosNoCampo > 0) return;

    // Pequena espera antes de checar (dá tempo dos últimos timers rodarem)
    jogoAtivo.timers.push(setTimeout(() => {
      if (gameOver) return;
      const ainda = campo.querySelectorAll(".sardinha-rato:not([data-morto])").length;
      if (ainda > 0) return;

      // Próxima onda
      onda++;
      score += onda * 3; // bonus de onda
      atualizarHUD();

      if (onda > 5) {
        encerrarSardinha(true);
        return;
      }

      instrucao.textContent = `✅ Onda ${onda - 1} concluída! +${onda * 3} 🪙`;
      instrucao.style.opacity = "1";
      jogoAtivo.timers.push(setTimeout(() => {
        instrucao.style.opacity = "0";
        iniciarOnda();
      }, 1800));
    }, 600));
  }

  // FIM DE JOGO
  function encerrarSardinha(vitoria) {
    if (gameOver) return;
    gameOver = true;

    const moedas = vitoria
      ? Math.min(250, 40 + Math.floor(score / 1.8))
      : Math.max(20, Math.floor(score / 3));

    ganharMoedas(moedas);

    const titulo    = vitoria ? "🏆 MISSÃO CUMPRIDA!" : "GAME OVER";
    const subtitulo = vitoria
      ? `Todas as sardinhas estão salvas! 🐟💖`
      : `Os ratos levaram as sardinhas... 😿`;
    const agenteImg = vitoria
      ? (agente === "hanna" ? "assets/sprites/hanna/feliz.png" : "assets/sprites/gatinha/gatinha-sorrindo.png")
      : (agente === "hanna" ? "assets/sprites/hanna/triste.png" : "assets/sprites/gatinha/gatinha-triste.png");

    arena.innerHTML = `
      <div class="sardinha-fim">
        <div class="sardinha-fim-titulo">${titulo}</div>
        <img src="${agenteImg}" class="sardinha-fim-img">
        <div class="sardinha-fim-sub">${subtitulo}</div>
        <div class="sardinha-fim-stats">
          <div>🐭 Ondas: <b>${onda - (vitoria ? 1 : 0)}/5</b></div>
          <div>🎯 Score: <b>${score}</b></div>
          <div>🪙 Moedas: <b>+${moedas}</b></div>
        </div>
        <div class="sardinha-fim-btns">
          <button class="sardinha-btn-acao" id="srdJogarNovamente">🔄 Jogar novamente</button>
          <button class="sardinha-btn-acao sardinha-btn-sec" id="srdSair">🏠 Sair</button>
        </div>
      </div>`;

    document.getElementById("srdJogarNovamente")
      .addEventListener("click", () => jogoSardinha());
    document.getElementById("srdSair")
      .addEventListener("click", () => voltarParaMenu());
  }

  // Inicia primeira onda
  jogoAtivo.timers.push(setTimeout(iniciarOnda, 800));
  atualizarHUD();
}

function iniciarFinalRomantico() {

    const overlay =
    document.getElementById("overlayFinal");

    const emojis = [
        "💖",
        "🌸",
        "✨",
        "💕"
    ];

    const intervalo =
    setInterval(() => {

        const p =
        document.createElement("div");

        p.className =
        "particula-final";

        p.textContent =

        emojis[
            Math.floor(
                Math.random() *
                emojis.length
            )
        ];

        p.style.left =
        Math.random() * 100 + "vw";

        p.style.animationDuration =
        (6 + Math.random() * 5)
        + "s";

        p.style.fontSize =
        (20 + Math.random() * 22)
        + "px";

        overlay.appendChild(p);

        setTimeout(() => {

            p.remove();

        }, 12000);

    }, 250);

    // FINALIZA DEPOIS DE 10 SEGUNDOS

    setTimeout(() => {

        clearInterval(intervalo);

        telaPedidoReal.style.display =
        "none";

        telaJogo.style.display =
        "block";

        document.querySelector(".bottomNav")
        .style.display = "flex";

        tocarTrilha("casa");

        mostrarMensagem(
        "Agora vocês namoram oficialmente 💖"
        );

    }, 10000);

}

function mensagemHorario() {

    const hora =
    new Date().getHours();

    if (hora < 12) {

        mostrarMensagem(
        "Bom dia meu bem 🌞"
        );

    }

    else if (hora < 18) {

        mostrarMensagem(
        "Boa tarde 🌸"
        );

    }

    else {

        mostrarMensagem(
        "Boa noite meu amor 🌙"
        );

    }

}

function mostrarAlertaLoja(texto) {

    const alerta =
    document.getElementById("alertaLoja");

    alerta.textContent =
    texto;

    alerta.style.opacity =
    "1";

    alerta.style.transform =
    "translateX(-50%) translateY(0)";

    clearTimeout(alerta.timer);

    alerta.timer =
    setTimeout(() => {

        alerta.style.opacity =
        "0";

        alerta.style.transform =
        "translateX(-50%) translateY(-10px)";

    }, 3500);

}

function iniciarMomentosEspeciais() {

    setInterval(() => {

        // chance pequena
        if (Math.random() > 0.35) return;

        // não ativa em telas especiais
        if (
            telaPedido.style.display === "flex" ||
            telaPedidoReal.style.display === "flex"
        ) return;

        const momentos = [

            {
                sprite:
                "assets/sprites/hanna/gatinhas-dormindo.png",

                frase:
                "Elas dormiram juntinhas 💤",

                chance:
                () => energia < 40
            },

            {
                sprite:
                "assets/sprites/hanna/gatinhas-carinho.png",

                frase:
                "Muito carinho por aqui",

                chance:
                () => amizade > 3.5
            },

            {
                sprite:
                "assets/sprites/hanna/gatinhas-brincando.png",

                frase:
                "As duas estão brincando",

                chance:
                () => felicidade > 60
            }

        ];

        const disponiveis =
        momentos.filter(
            m => m.chance()
        );

        if (
            disponiveis.length === 0
        ) return;

        const momento =

        disponiveis[
            Math.floor(
                Math.random() *
                disponiveis.length
            )
        ];

        hannaSprite.src =
        momento.sprite;

        mostrarMensagem(
        momento.frase
        );

        setTimeout(() => {

            hannaSprite.src =
            "assets/sprites/hanna/neutra.png";

        }, 6000);

    }, 120000);

}

function animarTela(tela) {

    tela.classList.remove("fadeTela");

    void tela.offsetWidth;

    tela.classList.add("fadeTela");

}