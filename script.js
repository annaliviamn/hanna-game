// SERVICE WORKER + NOTIFICAÇÕES
let swRegistration = null;

async function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register("sw.js");
    console.log("Service Worker registrado");

    // Registra sync periódico para lembretes (Android background)
    if ("periodicSync" in swRegistration) {
      try {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" });
        if (status.state === "granted") {
          await swRegistration.periodicSync.register("hanna-lembretes", {
            minInterval: 60 * 1000, // mínimo 1 min
          });
        }
      } catch (e) {
        // periodicSync não suportado — o IndexedDB no SW ainda cobre
      }
    }
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

// isMuted declarado aqui pra evitar ReferenceError no iOS PWA
// (usado em tocarTrilha e playEfeito que são chamados cedo)
let isMuted = localStorage.getItem("muted") === "true";

// Estado visual das sprites — declarado cedo pois btnResetar usa antes das vars de jogo
const estadoVisual = {
  momentoConjunto: false,
  spriteConjunta: null
};

let momentoConjuntoAtivo = false;
let exibindoSementeDourada = false;

// Configura áudio para mixing — permite tocar junto com Spotify, etc.
// No iOS/Android PWA, setar volume antes do primeiro play libera o mixing
function configurarAudioMixing() {
  document.querySelectorAll("audio").forEach(a => {
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
  });
}
configurarAudioMixing();

// Helper pra tocar efeitos respeitando o mute
function playEfeito(audio) {
  if (!audio) return;
  audio.muted = isMuted;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

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
const btnPlantarDourada = document.getElementById("btnPlantarDourada");
const balaoFazenda      = document.getElementById("balaoFazenda");
const btnEntrar         = document.getElementById("btnEntrar");
const btnPetisco        = document.getElementById("btnPetisco");
const btnCocarBarriga   = document.getElementById("btnCocarBarriga");
const btnBanho          = document.getElementById("btnBanho");
const navConfig         = document.getElementById("navConfig");
const telaConfig        = document.getElementById("telaConfig");
const btnVoltarConfig   = document.getElementById("btnVoltarConfig");
const btnCarta          = document.getElementById("btnCarta");
const inputNomeGatinha  = document.getElementById("inputNomeGatinha");
const btnSalvarNomeGatinha = document.getElementById("btnSalvarNomeGatinha");
const btnModoNoturno    = document.getElementById("btnModoNoturno");
const btnResetar = document.getElementById("btnResetar");
// Caixa Misteriosa
const btnCaixa = document.getElementById("btnCaixa");
const telaCaixa = document.getElementById("telaCaixa");
const btnAbrirCaixa = document.getElementById("btnAbrirCaixa");
const btnFecharCaixa = document.getElementById("btnFecharCaixa");
const caixaSprite = document.getElementById("caixaSprite");
const textoCaixa = document.getElementById("textoCaixa");
const resultadoCaixa = document.getElementById("resultadoCaixa");
// Volume fixo — sliders removidos, valores padrão constantes
const volumeMusica  = { value: "0.4" };
const volumeEfeitos = { value: "0.7" };
const telaCarta         = document.getElementById("telaCarta");
const btnVoltarCarta    = document.getElementById("btnVoltarCarta");
const telaComoJogar      = document.getElementById("telaComoJogar");
const btnComoJogar       = document.getElementById("btnComoJogar");
const btnVoltarComoJogar = document.getElementById("btnVoltarComoJogar");
const telaTrofeus        = document.getElementById("telaTrofeus");
const navTrofeus         = document.getElementById("navTrofeus");
const saldoLoja         = document.getElementById("saldoLoja");

const telaInicial       = document.getElementById("telaInicial");
const telaJogo          = document.getElementById("telaJogo");
const telaBanho         = document.getElementById("telaBanho");
const telaMinigames     = document.getElementById("telaMinigames");
const telaArena         = document.getElementById("telaArena");
const telaLoja          = document.getElementById("telaLoja");
const telaLembretes     = document.getElementById("telaLembretes");
const telaFazenda       = document.getElementById("telaFazenda");
const arenaConteudo     = document.getElementById("arenaConteudo");
const arenaTitulo       = document.getElementById("arenaTitulo");
const arenaScore        = document.getElementById("arenaScore");

// Pedido Hanna
const textoPedido = document.getElementById("textoPedido");
const btnSimPedido = document.getElementById("btnSimPedido");
const btnNaoPedido = document.getElementById("btnNaoPedido");
const telaPedido = document.getElementById("telaPedido");

let resetandoProgresso = false;

// Botão de Resetar o Game
btnResetar.addEventListener("click", () => {

  const confirmar = confirm(
    "Tem certeza que deseja apagar todo o progresso?"
  );

  if (!confirmar) {
    return;
  }

  resetandoProgresso = true;

  sementes = 0;
  moedas = 0;
  amizade = 0;
  vinculoGatinhas = 0;

  gatinhaDesbloqueada = false;
  nomeGatinha = "";

  conquistasDesbloqueadas = {};

  momentoConjuntoAtivo = false;

  estadoVisual.momentoConjunto = false;
  estadoVisual.spriteConjunta = null;

  localStorage.clear();

  location.reload();

});

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

    telaComoJogar.style.display = "none";

    telaTrofeus.style.display = "none";

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


// SISTEMA DE CONQUISTAS

const CONQUISTAS = {
  // Cuidados
  primeiro_carinho:   { nome: "Primeiro carinho",      desc: "Você deu o primeiro carinho pra Hanna.",         sprite: "assets/sprites/hanna/carinho.png",    secao: "cuidados" },
  bem_alimentada:     { nome: "Bem alimentada",         desc: "A Hanna está de barriga cheia.",                 sprite: "assets/sprites/hanna/comendo.png",    secao: "cuidados" },
  hora_do_banho:      { nome: "Hora do banho",          desc: "Limpinha e feliz!",                              sprite: "assets/sprites/hanna/banho-tomado.png",    secao: "cuidados" },
  boa_noite:          { nome: "Boa noite",              desc: "A Hanna foi dormir descansada.",                 sprite: "assets/sprites/hanna/dormindo.png",    secao: "cuidados" },
  // Progressão
  jardineira:         { nome: "Jardineira",             desc: "Primeira planta colhida na fazenda.",            sprite: "assets/sprites/hanna/fazenda.png", secao: "progressao" },
  milionaria:         { nome: "Milionária",             desc: "10.000 moedas acumuladas.",                      sprite: "assets/sprites/hanna/hanna-rica.png", secao: "progressao" },
  rica_demais:        { nome: "Rica Demais",             desc: "50.000 moedas acumuladas.",                     sprite: "assets/sprites/hanna/hanna-rica.png",    secao: "progressao" },
  magnata_felina:     { nome: "Magnata Felina",          desc: "100.000 moedas acumuladas.",                     sprite: "assets/sprites/hanna/hanna-magnata.png", secao: "progressao" },
  bilionaria:         { nome: "Bilionária",           desc: "500.000 de moedas acumuladas. Lendária!",      sprite: "assets/sprites/hanna/hanna-bilionaria.png",    secao: "progressao" },
  bem_cuidada:        { nome: "Bem cuidada",            desc: "Todos os status acima de 95% ao mesmo tempo.",  sprite: "assets/sprites/hanna/chorando-felicidade.png", secao: "progressao" },
  nova_companheira:   { nome: "Nova companheira",       desc: "A gatinha pretinha chegou!",                    sprite: "assets/sprites/gatinha/gatinha-sorrindo.png", secao: "progressao" },
  inseparaveis:       { nome: "Inseparáveis",           desc: "Vínculo máximo com a gatinha pretinha.",        sprite: "assets/sprites/hanna-gatinha/felizes.png", secao: "progressao" },
  // Minigames
  mestre_memoria:     { nome: "Mestre da Memória",      desc: "Venceu o jogo Memória das Patas.",              sprite: "assets/ui/icons/icon-minigames.png",  secao: "minigames" },
  domino_mestre:      { nome: "Mestre do Dominó",       desc: "Venceu a Hanna no dominó.",                       sprite: "assets/ui/icons/icon-domino.png",   secao: "minigames" },
  match3_mestre:      { nome: "Combo Felino",            desc: "Fez 300+ pontos no Match-3.",                      sprite: "assets/ui/icons/icon-hanna-crush.png",   secao: "minigames" },
  palavra_certa:      { nome: "Palavras da Hanna",       desc: "Acertou a palavra secreta.",                       sprite: "assets/sprites/hanna/contente.png",   secao: "minigames" },
  bolinha_mestre:     { nome: "Bolinha Voadora",         desc: "Fez 20+ rebatidas na Bolinha de Lã.",              sprite: "assets/sprites/hanna/brincando-novelo.png",   secao: "minigames" },
  cocar_barriga:      { nome: "Coçadinha Especial",      desc: "Coçou a barriga da Hanna pela primeira vez.",      sprite: "assets/sprites/hanna/carinho-barriga.png",  secao: "cuidados" },
  caca_palavras:      { nome: "Detetive Felina",         desc: "Encontrou todas as palavras no Caça-Palavras.",    sprite: "assets/ui/icons/icon-cacando-palavras.png",   secao: "minigames" },
  missao_steve:       { nome: "Missão Cumprida",      desc: "Completou a Missão do Steve Rogers.",             sprite: "assets/sprites/pets/steve-missao.png", secao: "minigames" },
  james_ladrao:       { nome: "Mestre Ladrão",        desc: "James roubou 15+ petiscos na despensa.",          sprite: "assets/sprites/pets/james-espiando.png", secao: "minigames" },
  joao_aprontando:    { nome: "Destruição Total",     desc: "João derrubou 20+ objetos nas prateleiras.",      sprite: "assets/sprites/pets/joao-prateleira.png", secao: "minigames" },
  puzzle_mestre:      { nome: "Mestre do Quebra-Cabeça", desc: "Completou todos os níveis do quebra-cabeça!", sprite: "assets/sprites/hanna/animada.png", secao: "minigames" },
  leitora_humores:    { nome: "Leitora de Humores",     desc: "Venceu o jogo Adivinhe o Humor.",               sprite: "assets/sprites/hanna/curiosa.png",  secao: "minigames" },
  reflexos_felinos:   { nome: "Reflexos Felinos",       desc: "Venceu o jogo Reflexo Felino.",                 sprite: "assets/sprites/hanna/doidinha.png",  secao: "minigames" },
  colecionadora:      { nome: "Colecionadora",          desc: "Venceu o jogo Cartinhas da Hanna.",             sprite: "assets/sprites/hanna/brincando.png",  secao: "minigames" },
  cirurgia_felina:    { nome: "Cirurgiã Felina",        desc: "Venceu a Operação Sardinha.",                   sprite: "assets/sprites/hanna-gatinha/hanna-cod.png",  secao: "minigames" },
  recados_perfeito:   { nome: "Sintonia Total",         desc: "Acertou todas as respostas na Troca de Recados!",        sprite: "assets/ui/icons/icon-recados.png", secao: "minigames"  },
  esconde_mestre: { nome: "Achou!", desc: "Encontrou o filhotinho 7 vezes no Esconde-Esconde!", sprite: "assets/sprites/filhote/filhote-pego.png", secao: "momentos" },
  // Visitas e semente
  visita_steve:       { nome: "Visita Surpresa",        desc: "Steve Rogers apareceu de visita pela primeira vez!",     sprite: "assets/sprites/pets/steve-feliz.png",       secao: "progressao" },
  visita_joao:        { nome: "Visita do Tonton",       desc: "João Antônio veio fazer bagunça pela primeira vez!",     sprite: "assets/sprites/pets/joao-feliz.png",   secao: "progressao" },
  visita_james:       { nome: "Visita do Cook",         desc: "James Cook apareceu farejar a despensa pela primeira vez!", sprite: "assets/sprites/pets/james-comendo.png", secao: "progressao" },
  primeira_dourada:   { nome: "Semente Rara",           desc: "A Hanna te deu a primeira semente dourada!",             sprite: "assets/sprites/hanna/hanna-semente-dourada.png",           secao: "progressao" },
  visita_anna: { nome: "Visita Especial", desc: "Anna apareceu de visita pela primeira vez!", sprite: "assets/sprites/personagens/anna-avatar.png", secao: "progressao" },
  visita_kika: { nome: "Visita da Kika", desc: "Kika apareceu de visita pela primeira vez!", sprite: "assets/sprites/personagens/kika-avatar.png", secao: "progressao" },
  // Momentos Especiais
  pedido_aceito:    { nome: "Namoradas!",         desc: "A gatinha pretinha e a Hanna ficaram juntas para sempre!", sprite: "assets/sprites/hanna-gatinha/momento-especial.png", secao: "momentos" },
  esperando_filhote: { nome: "Novidade em Casa!", desc: "A gatinha ficou gravida! O filhotinho chega em 9 dias.", sprite: "assets/sprites/gatinha/gatinha-animada-especial.png", secao: "momentos" },
  familia_completa: { nome: "Família Completa",   desc: "O filhotinho chegou! A família está completa.",           sprite: "assets/sprites/filhote/filhote.png",                secao: "momentos" },
};

const TOTAL_CONQUISTAS = Object.keys(CONQUISTAS).length;

let conquistasDesbloqueadas = JSON.parse(localStorage.getItem("conquistas") || "{}");

function desbloquearConquista(id) {
  if (conquistasDesbloqueadas[id]) return;

  conquistasDesbloqueadas[id] = true;
  localStorage.setItem("conquistas", JSON.stringify(conquistasDesbloqueadas));

  const c = CONQUISTAS[id];
  if (!c) return;

  somConquista.currentTime = 0;
  somConquista.muted = (typeof isMuted !== "undefined") ? isMuted : false;
  somConquista.play().catch(() => {});

  const toast = document.createElement("div");
  toast.className = "conquista-toast";
  toast.innerHTML = `
    <img src="${c.sprite}" class="conquista-sprite">
    <div class="conquista-info">
      <div class="conquista-label">Conquista desbloqueada!</div>
      <div class="conquista-nome">${c.nome}</div>
      <div class="conquista-desc">${c.desc}</div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("conquista-visivel"));
  setTimeout(() => {
    toast.classList.remove("conquista-visivel");
    setTimeout(() => toast.remove(), 500);
  }, 3500);

  // Verifica platina
  const total = Object.keys(conquistasDesbloqueadas).length;
  if (total >= TOTAL_CONQUISTAS) {
    setTimeout(() => desbloquearPlatina(), 4000);
  }
}

function desbloquearPlatina() {
  if (conquistasDesbloqueadas["platina"]) return;
  conquistasDesbloqueadas["platina"] = true;
  localStorage.setItem("conquistas", JSON.stringify(conquistasDesbloqueadas));

  somConquista.currentTime = 0;
  somConquista.muted = (typeof isMuted !== "undefined") ? isMuted : false;
  somConquista.play().catch(() => {});

  const toast = document.createElement("div");
  toast.className = "conquista-toast conquista-toast-platina";
  toast.innerHTML = `
    <img src="assets/sprites/hanna/platina.png" class="conquista-sprite">
    <div class="conquista-info">
      <div class="conquista-label">🏆 Platina desbloqueada!</div>
      <div class="conquista-nome">Minha Hanna</div>
      <div class="conquista-desc">Você completou todas as conquistas.</div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("conquista-visivel"));
  setTimeout(() => {
    toast.classList.remove("conquista-visivel");
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

function renderizarTrofeus() {
  const desbloqueadas = Object.keys(conquistasDesbloqueadas).filter(k => k !== "platina");
  const total = desbloqueadas.length;

  // Progresso
  const contador = document.getElementById("trofeuContador");
  const barraFill = document.getElementById("trofeuBarraFill");
  if (contador) contador.textContent = `${total} / ${TOTAL_CONQUISTAS} conquistados`;
  if (barraFill) barraFill.style.width = `${(total / TOTAL_CONQUISTAS) * 100}%`;

  // Platina
  const platina = conquistasDesbloqueadas["platina"];
  const platinaImg  = document.getElementById("trofeuPlatinaImg");
  const platinaNome = document.getElementById("trofeuPlatinaNome");
  const platinaDesc = document.getElementById("trofeuPlatinaDesc");
  const cardPlatina = document.getElementById("cardPlatina");

  if (platinaImg)  platinaImg.src = platina ? "assets/sprites/hanna/platina.png" : "assets/sprites/hanna/platina-locked.png";
  if (platinaNome) platinaNome.textContent = platina ? "Minha Hanna" : "???";
  if (platinaDesc) platinaDesc.textContent = platina ? "Você completou todas as conquistas." : "Complete todas as conquistas para desbloquear.";
  if (cardPlatina) cardPlatina.classList.toggle("trofeu-desbloqueado", !!platina);

  // Grids por seção
  const secoes = { cuidados: "gridCuidados", progressao: "gridProgressao", minigames: "gridMinigames", momentos: "gridMomentos" };

  Object.entries(secoes).forEach(([secao, gridId]) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";

    Object.entries(CONQUISTAS)
      .filter(([, c]) => c.secao === secao)
      .forEach(([id, c]) => {
        const desbloqueada = !!conquistasDesbloqueadas[id];
        const card = document.createElement("div");
        card.className = `trofeu-card ${desbloqueada ? "trofeu-desbloqueado" : "trofeu-bloqueado"}`;
        card.innerHTML = `
          <div class="trofeu-img-wrap">
            <img src="${c.sprite}" class="trofeu-sprite">
          </div>
          <div class="trofeu-nome">${desbloqueada ? c.nome : "???"}</div>
          <div class="trofeu-desc">${desbloqueada ? c.desc : "Ainda não conquistado."}</div>
        `;
        grid.appendChild(card);
      });
  });
}


// TELA DE RESULTADO

function mostrarResultado(titulo, emoji, ganhou, desc, jogoFn) {
  pararJogoAtivo();

  // Dispara conquista de minigame se ganhou (ganhou > 0 e emoji positivo)
  if (ganhou > 0 && emoji !== "😿") {
    if      (jogoFn === jogoMemoria)   desbloquearConquista("mestre_memoria");
    else if (jogoFn === jogoDomino)    desbloquearConquista("domino_mestre");
    else if (jogoFn === jogoHumor)     desbloquearConquista("leitora_humores");
    else if (jogoFn === jogoReflexo)   desbloquearConquista("reflexos_felinos");
    else if (jogoFn === jogoCartinhas) desbloquearConquista("colecionadora");
  }

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

// JOGO 1: MEMÓRIA
function jogoMemoria() {
  abrirArena("Memória das Patas");

  arenaConteudo.innerHTML = `
    <div class="memoria-instrucao">Observe a sequência<br>e repita na ordem!</div>
    <div class="memoria-nivel" id="memNivel">Nível 1</div>
    <div class="memoria-hanna">
      <img src="assets/sprites/hanna/curiosa.png" id="memHanna">
    </div>
    <div class="memoria-grid">
      <button class="memoria-btn" data-cor="rosa"><img src="assets/shop/almofada.png" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated;"></button>
      <button class="memoria-btn" data-cor="roxo"><img src="assets/shop/novelo.png" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated;"></button>
      <button class="memoria-btn" data-cor="verde"><img src="assets/shop/ratinho.png" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated;"></button>
      <button class="memoria-btn" data-cor="amarelo"><img src="assets/shop/sashimi.png" style="width:40px;height:40px;object-fit:contain;image-rendering:pixelated;"></button>
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
        status.textContent = "Errou!";
        const total = Math.max(0, (nivelAtual - 1) * 25);
        jogoAtivo.timers.push(setTimeout(() => {
          mostrarResultado(
            "Fim de jogo!",
            nivelAtual >= 5 ? "" : "",
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
        status.textContent = "Acertou!";
        jogoAtivo.timers.push(setTimeout(proximoNivel, 800));
      }
    });
  });

  iniciar();
}

//   JOGO 2 — DOMINÓ
//   Você vs Hanna. 7 peças cada, resto no estoque.
//   Encaixe nas pontas. Quem esvaziar a mão primeiro ganha.
//   Recompensa: 30–80 moedas.

function jogoDomino() {
  abrirArena("Dominó com a Hanna");

  // Gera as 28 peças do dominó (0-6 x 0-6)
  function gerarPecas() {
    const pecas = [];
    for (let i = 0; i <= 6; i++)
      for (let j = i; j <= 6; j++)
        pecas.push([i, j]);
    // embaralha
    for (let i = pecas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pecas[i], pecas[j]] = [pecas[j], pecas[i]];
    }
    return pecas;
  }

  const todas = gerarPecas();
  let maoJogador = todas.splice(0, 7);
  let maoHanna   = todas.splice(0, 7);
  let estoque    = todas;
  let mesa       = []; // peças na mesa
  let pontaEsq   = null; // valor da ponta esquerda
  let pontaDir   = null; // valor da ponta direita
  let vezJogador = true;
  let rodando    = true;

  function gerarPontos(valor) {

    const layouts = {
      0: [],
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };

    const ativos = layouts[valor];

    let html = "";

    for (let i = 1; i <= 9; i++) {
      html += `
        <div class="dom-ponto ${ativos.includes(i) ? "ativo" : ""}"></div>
      `;
    }

    return `
      <div class="dom-grade">
        ${html}
      </div>
    `;
  }
  
  function renderizarPeca(a, b) {
    return `
      <div class="peca-dom">
        <div class="dom-metade">${gerarPontos(a)}</div>
        <div class="dom-separador"></div>
        <div class="dom-metade">${gerarPontos(b)}</div>
      </div>
    `;
  }

  function pecaJogavel(peca) {
    if (mesa.length === 0) return true;
    return peca[0] === pontaEsq || peca[1] === pontaEsq ||
           peca[0] === pontaDir  || peca[1] === pontaDir;
  }

  function jogarPeca(peca, lado) {
    if (mesa.length === 0) {
      mesa.push(peca);
      pontaEsq = peca[0];
      pontaDir = peca[1];
      return true;
    }
    if (lado === "esq") {
      if (peca[1] === pontaEsq) { mesa.unshift(peca); pontaEsq = peca[0]; return true; }
      if (peca[0] === pontaEsq) { mesa.unshift([peca[1], peca[0]]); pontaEsq = peca[1]; return true; }
    } else {
      if (peca[0] === pontaDir) { mesa.push(peca); pontaDir = peca[1]; return true; }
      if (peca[1] === pontaDir) { mesa.push([peca[1], peca[0]]); pontaDir = peca[0]; return true; }
    }
    return false;
  }

  function temJogada(mao) {
    return mao.some(p => pecaJogavel(p));
  }

  function render() {
    const pecasJogaveis = maoJogador.filter(p => pecaJogavel(p));

    arenaConteudo.innerHTML = `
      <div class="dom-wrap">
        <div class="dom-info">
          <span>Hanna: <b>${maoHanna.length}</b> peças</span>
          <span>Estoque: <b>${estoque.length}</b></span>
        </div>

        <div class="dom-hanna-box">
          <img
            src="${
              vezJogador
              ? "assets/sprites/hanna/curiosa.png"
              : "assets/sprites/hanna/vergonha.png"
            }"
            class="dom-hanna-sprite"
          >

          <div class="dom-hanna-fala">
            ${
              vezJogador
              ? "Sua vez!"
              : "Estou pensando..."
            }
          </div>
        </div>

        <div class="dom-mesa-wrap">
          <div class="dom-mesa" id="domMesa">
            ${mesa.length === 0
              ? '<span class="dom-vazia">Jogue a primeira peça</span>'
              : (() => {
                  const porLinha = 5;
                  const linhas = [];
                  for (let i = 0; i < mesa.length; i += porLinha) {
                    linhas.push(mesa.slice(i, i + porLinha));
                  }
                  return linhas.map((linha, li) => {
                    const inv = li % 2 === 1;
                    const pecasHtml = linha.map(p => renderizarPeca(p[0], p[1])).join("");
                    return `<div class="dom-linha ${inv ? "dom-linha-inv" : ""}">${pecasHtml}</div>`;
                  }).join("");
                })()
            }
          </div>
        </div>

        <div class="dom-pontas">
          ${mesa.length > 0 ? `<span>◀ <b>${pontaEsq}</b></span><span><b>${pontaDir}</b> ▶</span>` : ""}
        </div>

        <div class="dom-sua-mao">
          <div class="dom-label">Suas peças ${vezJogador ? "(sua vez)" : "(vez da Hanna...)"}</div>
          <div class="dom-pecas" id="domPecas">
            ${maoJogador.map((p, i) => {
              const jogavel = pecaJogavel(p) && vezJogador;
              return `
              <div
                class="peca-dom ${jogavel ? "peca-jogavel" : "peca-bloqueada"}"
                data-i="${i}"
              >
                <div class="dom-metade">
                  ${gerarPontos(p[0])}
                </div>

                <div class="dom-separador"></div>

                <div class="dom-metade">
                  ${gerarPontos(p[1])}
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>

        <div class="dom-acoes">
          ${vezJogador && pecasJogaveis.length === 0 && estoque.length > 0
            ? `<button class="dom-btn" id="btnComprarDom">Comprar do estoque</button>`
            : ""}
          ${vezJogador && pecasJogaveis.length === 0 && estoque.length === 0
            ? `<button class="dom-btn" id="btnPassarDom">Passar a vez</button>`
            : ""}
        </div>
      </div>`;

    // Listeners das peças
    document.querySelectorAll(".peca-jogavel").forEach(el => {
      el.addEventListener("click", () => {
        if (!vezJogador || !rodando) return;
        const i = parseInt(el.dataset.i);
        const peca = maoJogador[i];

        // Tenta jogar nos dois lados
        let ok = false;
        if (mesa.length === 0) { ok = jogarPeca(peca, "dir"); }
        else {
          // Tenta lado que encaixa
          const podeEsq = peca[0] === pontaEsq || peca[1] === pontaEsq;
          const podeDir = peca[0] === pontaDir  || peca[1] === pontaDir;
          if (podeDir && !podeEsq) ok = jogarPeca(peca, "dir");
          else if (podeEsq && !podeDir) ok = jogarPeca(peca, "esq");
          else if (podeEsq && podeDir) {
            // Encaixa nos dois — tenta dir primeiro
            ok = jogarPeca(peca, "dir") || jogarPeca(peca, "esq");
          }
        }

        if (ok) {
          maoJogador.splice(i, 1);
          if (maoJogador.length === 0) { terminar("jogador"); return; }
          vezJogador = false;
          render();
          jogoAtivo.timers.push(setTimeout(turnoHanna, 1200));
        }
      });
    });

    const btnComprar = document.getElementById("btnComprarDom");
    if (btnComprar) btnComprar.addEventListener("click", () => {
      if (estoque.length > 0) {
        maoJogador.push(estoque.pop());
        render();
      }
    });

    const btnPassar = document.getElementById("btnPassarDom");
    if (btnPassar) btnPassar.addEventListener("click", () => {
      vezJogador = false;
      render();
      jogoAtivo.timers.push(setTimeout(turnoHanna, 1200));
    });
  }

  function turnoHanna() {
    if (!rodando) return;

    // IA: joga a primeira peça válida
    let jogou = false;
    for (let i = 0; i < maoHanna.length; i++) {
      const p = maoHanna[i];
      if (pecaJogavel(p)) {
        const lado = (mesa.length === 0 || p[0] === pontaDir || p[1] === pontaDir) ? "dir" : "esq";
        jogarPeca(p, lado);
        maoHanna.splice(i, 1);
        jogou = true;
        break;
      }
    }

    if (!jogou) {
      // Hanna compra do estoque
      if (estoque.length > 0) {
        maoHanna.push(estoque.pop());
      }
      // Passa a vez de volta
    }

    if (maoHanna.length === 0) { terminar("hanna"); return; }

    vezJogador = true;

    // Verifica se ninguém pode jogar (travado)
    if (!temJogada(maoJogador) && !temJogada(maoHanna) && estoque.length === 0) {
      terminar("travado");
      return;
    }

    render();
  }

  function terminar(quem) {
    rodando = false;
    let titulo, emoji, recomp, desc;

    if (quem === "jogador") {
      titulo = "Você ganhou!";
      emoji  = "🏆";
      recomp = 80;
      desc   = "Esvaziou a mão primeiro! A Hanna ficou impressionada.";
      desbloquearConquista("domino_mestre");
    } else if (quem === "hanna") {
      titulo = "A Hanna ganhou!";
      emoji  = "😿";
      recomp = 20;
      desc   = "A Hanna esvaziou a mão primeiro. Tente de novo!";
    } else {
      titulo = "Jogo travado!";
      emoji  = "🤝";
      recomp = 35;
      const ptJog  = maoJogador.reduce((s, p) => s + p[0] + p[1], 0);
      const ptHanna = maoHanna.reduce((s, p) => s + p[0] + p[1], 0);
      desc = ptJog < ptHanna
        ? "Ninguém pode jogar — mas você tinha menos pontos! Vitória por pontos! 🎉"
        : ptJog > ptHanna
        ? "Ninguém pode jogar — a Hanna tinha menos pontos. Quase!"
        : "Empate total! Que partida equilibrada!";
      if (ptJog < ptHanna) recomp = 50;
    }

    ganharMoedas(recomp);
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(titulo, emoji, recomp, desc, jogoDomino);
    }, 600));
  }

  render();
}

//   JOGO 3 — ADIVINHE O HUMOR
//   A Hanna aparece com um sprite de emoção.
//   4 opções — escolha a certa em 6 segundos.
//   Streak de acertos multiplica a recompensa.
//   10 rodadas no total.

function jogoHumor() {
  abrirArena("Adivinhe o Humor");

  const humores = [
    { sprite: "assets/sprites/hanna/neutra.png",               nome: "Neutra",               alias: ["neutra","normal"] },
    { sprite: "assets/sprites/hanna/feliz.png",                nome: "Feliz",                alias: ["feliz","contente"] },
    { sprite: "assets/sprites/hanna/contente.png",             nome: "Contente",             alias: ["contente","feliz"] },
    { sprite: "assets/sprites/hanna/curiosa.png",              nome: "Curiosa",              alias: ["curiosa","surpresa"] },
    { sprite: "assets/sprites/hanna/brava.png",                nome: "Brava",                alias: ["brava","irritada"] },
    { sprite: "assets/sprites/hanna/triste.png",               nome: "Triste",               alias: ["triste","chateada"] },
    { sprite: "assets/sprites/hanna/sonolenta.png",            nome: "Sonolenta",            alias: ["sonolenta","com sono"] },
    { sprite: "assets/sprites/hanna/animada.png",              nome: "Animada",              alias: ["animada","empolgada"] },
    { sprite: "assets/sprites/hanna/apaixonada.png",           nome: "Apaixonada",           alias: ["apaixonada","feliz"] },
    { sprite: "assets/sprites/hanna/vergonha.png",             nome: "Com vergonha",         alias: ["vergonha","tímida"] },
    { sprite: "assets/sprites/hanna/aprontona.png",            nome: "Aprontona",            alias: ["aprontona","arteira"] },
    { sprite: "assets/sprites/hanna/doidinha.png",             nome: "Doidinha",             alias: ["doidinha","maluca"] },
    { sprite: "assets/sprites/hanna/chorando-felicidade.png",  nome: "Chorando de alegria", alias: ["chorando de alegria","emocionada"] },
    { sprite: "assets/sprites/hanna/metida.png",               nome: "Metida",               alias: ["metida","convencida"] },
  ];

  let rodada  = 0;
  let streak  = 0;
  let totalMoedas = 0;
  const TOTAL = 10;

  arenaConteudo.innerHTML = `
    <div class="humor-streak" id="humorStreak">Sequencia: 0</div>
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
          `Acertou com sequência máxima de ${streak}! ${totalMoedas >= 15 ? "Você conhece bem a Hanna" : "Pratique mais!"}`,
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
      streakEl.textContent = `Sequencia: ${streak} (+${ganho} moeda${ganho>1?"s":""})`;
      spriteEl.src = "assets/sprites/hanna/apaixonada.png";
    } else {
      if (btn) btn.classList.add("errado");
      streak = 0;
      streakEl.textContent = `Sequencia: 0`;
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
          "",
          totalMoedas,
          `Voce acertou ${acertos} de ${TOTAL} vezes! ${acertos >= 5 ? "Reflexos incriveis!" : "Treine seus reflexos!"}`,
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
          setFeedback("Tarde demais!", "#ff5555");
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
      setFeedback("Perfeito! +20", "#6acf88");
      hannaEl.src = "assets/sprites/hanna/apaixonada.png";
      rodada++;
      jogoAtivo.timers.push(setTimeout(novaRodada, 1000));
    } else {
      // Muito cedo
      setFeedback("Cedo demais!", "#ff9944");
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
const btnLoja = null; // navegação feita via navLoja.onclick abaixo
const btnVoltar = document.getElementById("btnVoltar");
const btnUrsinho = document.getElementById("btnUrsinho");
const btnMorango = document.getElementById("btnMorango");
const btnGatinha = document.getElementById("btnGatinha");

// ── PRESENTINHOS PRA GATINHA ─────────────────
const btnPresenteFlor      = document.getElementById("btnPresenteFlor");
const btnPresenteChocolate = document.getElementById("btnPresenteChocolate");
const btnPresenteCesta     = document.getElementById("btnPresenteCesta");

// Controle de limite diário
let ultimoPresenteFlor      = Number(localStorage.getItem("ultimoPresenteFlor"))      || 0;
let ultimoPresenteChocolate = Number(localStorage.getItem("ultimoPresenteChocolate")) || 0;
let ultimoPresenteCesta     = Number(localStorage.getItem("ultimoPresenteCesta"))     || 0;

function podeDarPresente(ultimaVez) {
  return (Date.now() - ultimaVez) >= 8 * 60 * 60 * 1000;
}

function darPresente(custo, bonus, chaveUltima, nomePresente) {
  if (!gatinhaDesbloqueada) {
    mostrarAlertaLoja("A gatinha pretinha ainda não chegou!");
    return;
  }
  if (moedas < custo) {
    mostrarAlertaLoja("Moedas insuficientes");
    return;
  }
  const ultimaVez = Number(localStorage.getItem(chaveUltima)) || 0;
  if (!podeDarPresente(ultimaVez)) {
    const horasRestantes = Math.ceil((ultimaVez + 24 * 60 * 60 * 1000 - Date.now()) / 3600000);
    mostrarAlertaLoja(`Você já deu esse presente hoje. Volte em ${horasRestantes}h!`);
    return;
  }

  moedas -= custo;
  vinculoGatinhas = Math.min(100, vinculoGatinhas + bonus);
  localStorage.setItem(chaveUltima, Date.now());
  localStorage.setItem("vinculoGatinhas", vinculoGatinhas);

  somCompra.currentTime = 0;
  somCompra.volume = parseFloat(volumeEfeitos.value);
  somCompra.play().catch(() => {});

  mostrarMensagem(`Que presente lindo! O vínculo aumentou!`);
  falarFazenda(`Que presente lindo, ${nomePresente}!`, "assets/sprites/hanna/apaixonada.png");

  atualizarStatus();
}

btnPresenteFlor?.addEventListener("click", () => {
  darPresente(10000, 10, "ultimoPresenteFlor", "essa florzinha");
});

btnPresenteChocolate?.addEventListener("click", () => {
  darPresente(20000, 20, "ultimoPresenteChocolate", "esse chocolate");
});

btnPresenteCesta?.addEventListener("click", () => {
  darPresente(40000, 40, "ultimoPresenteCesta", "essa cesta");
});

// LEMBRETES
const btnLembretes = null; // navegação feita via navLembretes.onclick abaixo
const btnVoltarLembretes = document.getElementById("btnVoltarLembretes");
const btnSalvarLembrete  = document.getElementById("btnSalvarLembrete");
const inputLembrete      = document.getElementById("inputLembrete");
const listaLembretes     = document.getElementById("listaLembretes");
const tipoLembrete       = document.getElementById("tipoLembrete");
const dataLembrete       = document.getElementById("dataLembrete");
const horaLembrete       = document.getElementById("horaLembrete");
const btnAbrirFazenda    = document.getElementById("btnAbrirFazenda");
const btnVoltarFazenda   = document.getElementById("btnVoltarFazenda");

// SONS (silencia erro se arquivo ausente)
function criarAudio(src) {
  const a = new Audio();
  a.src = src;
  return a;
}
const somBotao  = criarAudio("assets/music/som-botao.mp3");
somBotao.volume =
parseFloat(
    volumeEfeitos.value
);
const somCompra = criarAudio("assets/music/moeda.wav");
somCompra.volume =
parseFloat(
    volumeEfeitos.value
);
const somBanho = criarAudio("assets/music/banho.mp3");
somBanho.volume =
parseFloat(
    volumeEfeitos.value
);

// Sons de interação específicos
// Coloca os arquivos em assets/music/ com esses nomes
const somCarinho = criarAudio("assets/music/som-carinho.mp3");
const somComida  = criarAudio("assets/music/som-comida.mp3");
const somDormir  = criarAudio("assets/music/som-dormir.mp3");
const somAcordar = criarAudio("assets/music/som-acordar.mp3");
const somConquista = criarAudio("assets/music/som-conquista.mp3");

[somCarinho, somComida, somDormir, somAcordar].forEach(s => {
  s.volume = parseFloat(volumeEfeitos.value);
}); 

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

const gatinhaFalaEl = document.getElementById("gatinhaFala");
let gatinhaFalaTimer;

// Balão de fala quando clica na gatinha
function mostrarFalaGatinha(texto) {
  if (!gatinhaFalaEl) return;
  if (telaJogo.style.display !== "block") return;
  if (dormindo) return;
  clearTimeout(gatinhaFalaTimer);
  gatinhaFalaEl.textContent = texto;
  gatinhaFalaEl.classList.add("visivel");
  gatinhaFalaTimer = setTimeout(() => {
    gatinhaFalaEl.classList.remove("visivel");
  }, 2500);
}

// Falas aleatórias da gatinha ao ser clicada
const falasClique = [
  "Miau!", "Prrrr...", "Mrrrow~", "Miau miau!", "♪ nyaa~",
  "Me pega!", "Prrr", "Nyaa!", "*ronrona*", "Miau!",
];

// CLIQUE NA HANNA
const hannaFalaEl = document.getElementById("hannaFala");
let hannaFalaTimer;

const falasHanna = [
  "Miau!", "Purrr~", "Nyaa!", "Mrrrow",
  "Miau miau!", "*ronrona*", "Nyaa~", "Miau!",
  "Prrr", "Miau!",
];

function mostrarFalaHanna(texto) {
  if (!hannaFalaEl) return;
  if (telaJogo.style.display !== "block") return;
  if (dormindo) return;
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
  setTimeout(() => {

  if (momentoConjuntoAtivo) return;

  hannaSprite.src = spriteAnterior;

  }, 2000);

  // Balão de fala
  const fala = falasHanna[Math.floor(Math.random() * falasHanna.length)];
  mostrarFalaHanna(fala);

  // Pequeno boost
  felicidade = Math.min(100, felicidade + 0.5);
  amizade    = Math.min(5, amizade + 0.05);
});
  gatinhaSprite.addEventListener("click", () => {
    if (dormindo) return;
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
    if (gatinhaDesbloqueada) {
      vinculoGatinhas = Math.min(100, vinculoGatinhas + 1);
      registrarInteracaoGatinha();
    }
  });

// INTERAÇÕES DO FILHOTINHO
const filhoteContainer = document.getElementById("filhoteContainer");
const filhoteSprite    = document.getElementById("filhoteSprite");
const filhoteFala      = document.getElementById("filhoteFala");
const nomeFilhoteTexto = document.getElementById("nomeFilhoteTexto");

const spritesFilhote = {
  misto: [
    "assets/sprites/filhote/filhote.png",
    "assets/sprites/filhote/filhote-curioso.png",
    "assets/sprites/filhote/filhote-dramatico.png",
    "assets/sprites/filhote/filhote-comendo.png",
    "assets/sprites/filhote/filhote-dormindo.png",
    "assets/sprites/filhote/filhote-aprontando.png",
  ],
  hanna: [
    "assets/sprites/filhote/filhote-hanna.png",
    "assets/sprites/filhote/filhote-hanna-curioso.png",
    "assets/sprites/filhote/filhote-hanna-dramatico.png",
    "assets/sprites/filhote/filhote-hanna-comendo.png",
    "assets/sprites/filhote/filhote-hanna-dormindo.png",
    "assets/sprites/filhote/filhote-hanna-aprontando.png",
  ],
  gatinha: [
    "assets/sprites/filhote/filhote-gatinha.png",
    "assets/sprites/filhote/filhote-gatinha-curioso.png",
    "assets/sprites/filhote/filhote-gatinha-dramatico.png",
    "assets/sprites/filhote/filhote-gatinha-comendo.png",
    "assets/sprites/filhote/filhote-gatinha-dormindo.png",
    "assets/sprites/filhote/filhote-gatinha-aprontando.png",
  ],
};

const falasFilhote = {
  misto: [
    "Me pegaram!",
    "Isso e injusto!",
    "Eu nao fui eu!",
    "Tô chorando aqui!",
    "Nao acredito!",
    "Como voce me achou?!",
  ],
  hanna: [
    "Oi... com licenca...",
    "Eu tava so olhando...",
    "Nao me assusta!",
    "Posso ficar aqui?",
    "Desculpa...",
    "Eu so queria ajudar...",
  ],
  gatinha: [
    "Nao fui eu!",
    "Provem!",
    "Ja fiz pior!",
    "Isso foi divertido!",
    "Vou aprontar mais!",
    "Ninguem me pega!",
  ],
};

function mostrarFalaFilhote(texto) {
  if (!filhoteFala) return;
  filhoteFala.textContent = texto;
  filhoteFala.style.opacity = "1";
  setTimeout(() => { filhoteFala.style.opacity = "0"; }, 2500);
}

let _idleFilhoteInterval = null;

function iniciarIdleFilhote() {
  if (!filhoteDesbloqueado) return;
  
  // Limpa interval anterior se existir
  if (_idleFilhoteInterval) {
    clearInterval(_idleFilhoteInterval);
    _idleFilhoteInterval = null;
  }

  const versao = versaoFilhote || "misto";
  const spriteBase = versao === "hanna"
    ? "assets/sprites/filhote/filhote-hanna.png"
    : versao === "gatinha"
    ? "assets/sprites/filhote/filhote-gatinha.png"
    : "assets/sprites/filhote/filhote.png";

  const sprites = spritesFilhote[versao] || spritesFilhote.misto;
  const falas   = falasFilhote[versao]   || falasFilhote.misto;

  _idleFilhoteInterval = setInterval(() => {
    if (!filhoteDesbloqueado) return;
    if (Math.random() > 0.6) return;
    const sprite = sprites[Math.floor(Math.random() * sprites.length)];
    const fala   = falas[Math.floor(Math.random() * falas.length)];
    if (filhoteSprite) filhoteSprite.src = sprite;
    mostrarFalaFilhote(fala);
    setTimeout(() => {
      if (filhoteSprite) filhoteSprite.src = spriteBase;
    }, 4000);
  }, 15000);
}

// Clique no filhotinho
if (filhoteContainer) {
  filhoteContainer.addEventListener("click", () => {
    if (!filhoteDesbloqueado) return;

    const versao = versaoFilhote || "misto";
    const spriteBase = versao === "hanna"
      ? "assets/sprites/filhote/filhote-hanna.png"
      : versao === "gatinha"
      ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png";

    const sprites = spritesFilhote[versao] || spritesFilhote.misto;
    const falas   = falasFilhote[versao]   || falasFilhote.misto;

    const fala   = falas[Math.floor(Math.random() * falas.length)];
    const sprite = sprites[Math.floor(Math.random() * sprites.length)];
    if (filhoteSprite) filhoteSprite.src = sprite;
    mostrarFalaFilhote(fala);
    setTimeout(() => {
      if (filhoteSprite) filhoteSprite.src = spriteBase;
    }, 3000);
  });
}

// Momentos juntos: acontecem a cada 3–6 min se a gatinha estiver desbloqueada
// Progressivo por vínculo:
//   0–40%  → apenas brincam lado a lado (sprites individuais animadas)
//   40–70% → momentos simples (brincando, carinho)
//   70–100%→ todos os momentos (abraço, beijinho, lambendo, dormindo juntas)
let momentoJuntasTimer;

function agendarMomentoJuntas() {
  clearTimeout(momentoJuntasTimer);
  const intervalo =
  (180 + Math.random() * 180) * 1000; // 3-6 minutos
  momentoJuntasTimer = setTimeout(dispararMomentoJuntas, intervalo);
}

function dispararMomentoJuntas() {

  const spriteConjunta =
  document.getElementById("spriteConjunta");

  if (!gatinhaDesbloqueada || dormindo) {

    agendarMomentoJuntas();

    momentoConjuntoAtivo = false;

    estadoVisual.momentoConjunto = false;

    estadoVisual.spriteConjunta = null;

    renderizarGatinhas();

    return;
  }

  // Vínculo baixo — só animação lado a lado, sem sprite conjunta
  if (vinculoGatinhas < 40) {
    mostrarMensagem("as gatinhas ficaram se olhando...");
    agendarMomentoJuntas();
    return;
  }

  // Filtra momentos pelo nível de vínculo e condições especiais
  const momentosFiltrados = (vinculoGatinhas >= 70
    ? momentosJuntas
    : momentosJuntas.filter(m =>
        m.sprite.includes("brincando") ||
        m.sprite.includes("lambendo")
      )
  ).filter(m => !m.condicao || m.condicao());

  if (momentosFiltrados.length === 0) {
    agendarMomentoJuntas();
    return;
  }

  const momento = momentosFiltrados[Math.floor(Math.random() * momentosFiltrados.length)];

  momentoConjuntoAtivo = true;

  estadoVisual.momentoConjunto = true;

  estadoVisual.spriteConjunta = momento.sprite;

  renderizarGatinhas();

  if (momento.som === "purr") tocarPurr();
  else if (momento.som === "meow") tocarMeow();

  mostrarFalaGatinha(momento.fala);
  mostrarMensagem(momento.fala);

  setTimeout(() => {

    momentoConjuntoAtivo = false;

    estadoVisual.momentoConjunto = false;

    estadoVisual.spriteConjunta = null;

    renderizarGatinhas();

    //atualizarStatus();

    gatinhaFalaEl &&
    gatinhaFalaEl.classList.remove("visivel");

    agendarMomentoJuntas();

  }, 5000);
}

// Inicia agendamento assim que a gatinha for desbloqueada (ou já está no load)
function iniciarMomentosGatinha() {

  if (!gatinhaDesbloqueada) return;

  agendarMomentoJuntas();

}

// SPRITE DA GATINHA
function gatinhaSpritePor(nome) {
  if (!gatinhaDesbloqueada) return;
  // Se tá grávida, mantém a sprite especial
  if (dataGravidez > 0 && !filhoteDesbloqueado) {
    gatinhaSprite.src = "assets/sprites/gatinha/gatinha-animada-especial.png";
    return;
  }
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
  if (momentoConjuntoAtivo) return;
  if (!gatinhaDesbloqueada) return;

  // Dormindo: conjunta se tiver a gatinha, senão individual
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

// Limpa localStorage mantendo só as infos de conta
const _uidTemp = localStorage.getItem("hannaUid");
const _emailTemp = localStorage.getItem("hannaEmail");
const _senhaTemp = localStorage.getItem("hannaSenhaTexto");
localStorage.clear();
if (_uidTemp) localStorage.setItem("hannaUid", _uidTemp);
if (_emailTemp) localStorage.setItem("hannaEmail", _emailTemp);
if (_senhaTemp) localStorage.setItem("hannaSenhaTexto", _senhaTemp);


let fome        = Number(localStorage.getItem("fome"))        || 40;
let felicidade  = Number(localStorage.getItem("felicidade"))  || 35;
let energia     = Number(localStorage.getItem("energia"))     || 50;
let higiene     = Number(localStorage.getItem("higiene"))     || 30;
let sementes    = Number(localStorage.getItem("sementes"))    || 0;
let sementesDouradas = Number(localStorage.getItem("sementesDouradas")) || 0;
let ultimaSementeDourada = Number(localStorage.getItem("ultimaSementeDourada")) || 0;
let moedas      = Number(localStorage.getItem("moedas"))      || 0;
let amizade     = Number(localStorage.getItem("amizade"))     || 0;
let vinculoGatinhas = Number(localStorage.getItem("vinculoGatinhas")) || 0;

let gatinhaDesbloqueada = localStorage.getItem("gatinhaDesbloqueada") === "true";
let nomeGatinha = localStorage.getItem("nomeGatinha") || "";

// FILHOTINHO
let filhoteDesbloqueado = localStorage.getItem("filhoteDesbloqueado") === "true";
let nomeFilhote         = localStorage.getItem("nomeFilhote") || "";
let generoFilhote       = localStorage.getItem("generoFilhote") || "";
let versaoFilhote       = localStorage.getItem("versaoFilhote") || "misto"; // linha nova
let dataGravidez        = Number(localStorage.getItem("dataGravidez")) || 0;
let pedidoAceito        = localStorage.getItem("pedidoAceito") === "true";

let dormindo =
localStorage.getItem("dormindo") === "true";

let lembretes =
JSON.parse(localStorage.getItem("lembretes")) || [];

// NOME DA GATINHA — só exibe se foi adotada e já tem nome
nomeDaGatinhaTexto.textContent = (gatinhaDesbloqueada && nomeGatinha) ? nomeGatinha : "";

if (inputNomeGatinha) {
    inputNomeGatinha.value = (gatinhaDesbloqueada && nomeGatinha) ? nomeGatinha : "";
}

btnSalvarNomeGatinha.onclick = () => {

    const novoNome = inputNomeGatinha.value.trim();

    if (!novoNome) return;

    // Cobrar 2.000 moedas só se já tem nome (renomeando)
    if (nomeGatinha) {
        if (moedas < 2000) {
            inputNomeGatinha.style.border = "2px solid #ff5fa2";
            inputNomeGatinha.placeholder = "⚠️ Precisa de 2.000 moedas!";
            inputNomeGatinha.value = "";
            setTimeout(() => {
                inputNomeGatinha.style.border = "";
                inputNomeGatinha.placeholder = nomeGatinha || "Digite um nome...";
            }, 2500);
            return;
        }
        moedas -= 2000;
    }

    nomeGatinha = novoNome;

    nomeDaGatinhaTexto.textContent = nomeGatinha;

    localStorage.setItem("nomeGatinha", nomeGatinha);

    mostrarMensagem(`${nomeGatinha} adorou o novo nome 💖`);

    atualizarStatus();

};

if (!gatinhaDesbloqueada) {

    inputNomeGatinha.disabled =
    true;

    btnSalvarNomeGatinha.disabled =
    true;

    inputNomeGatinha.placeholder =
    "Adote a gatinha primeiro";

} else if (!nomeGatinha) {

    inputNomeGatinha.placeholder = "Dê um nome pra ela";

}

// ÚLTIMA VEZ ONLINE

let ultimoAcesso = Number(localStorage.getItem("ultimoAcesso")) || Date.now();

// COMPENSAR TEMPO OFFLINE
// Calcula quantos minutos se passaram desde o último acesso
// e aplica a degradação de stats proporcionalmente (máx 8h)
function compensarTempoOffline() {
  const agora = Date.now();
  const ultimoAcessoSalvo = Number(localStorage.getItem("ultimoAcesso")) || agora;
  const minutosOff = Math.min((agora - ultimoAcessoSalvo) / 60000, 480);
  const hora = new Date().getHours();
  const horarioSono = hora >= 0 && hora < 8;

  if (minutosOff >= 1) {
    if (dormindo) {
      energia = Math.min(100, energia + 0.5 * minutosOff);
      if (energia >= 100) {
        energia = 100;
        dormindo = false;
        momentoConjuntoAtivo = false;
        localStorage.setItem("dormindo", "false");
      }
    } else {
      fome       = Math.max(0, fome       - 1.5 * minutosOff);
      felicidade = Math.max(0, felicidade - 0.8 * minutosOff);
      energia    = Math.max(0, energia    - 0.3 * minutosOff);
      higiene    = Math.max(0, higiene    - 0.8 * minutosOff);

      // Vínculo cai 1% por hora fora do horário de sono
      if (!horarioSono && gatinhaDesbloqueada) {
        const horasOff = minutosOff / 60;
        vinculoGatinhas = Math.max(0, vinculoGatinhas - 1 * horasOff);
      }
    }
  }

  localStorage.setItem("ultimoAcesso", agora);
  setInterval(() => {
    localStorage.setItem("ultimoAcesso", Date.now());
  }, 30000);
}

// ── REAGENDAR CRESCIMENTO DAS PLANTAS OFFLINE ─────────────────
// (executado após a declaração de fazenda e slotsPlantacao, mais abaixo)

// MENSAGEM
let msgTimer;

function trocarAnimacao(animacao) {

    hannaSprite.style.animation = animacao;

}

function mostrarMensagem(texto, local = "home") {

  // Se for fazenda, mantém o balão da fazenda também
  if (local === "fazenda" && balaoFazenda) {
    clearTimeout(msgTimer);
    balaoFazenda.textContent = texto;
    balaoFazenda.style.opacity = "1";
    msgTimer = setTimeout(() => {
      balaoFazenda.style.opacity = "0";
    }, 2000);
    return;
  }

  // Toast só aparece na home
  if (telaJogo.style.display !== "block") return;

  let toast = document.getElementById("mensagemGlobal");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mensagemGlobal";
    toast.className = "mensagem-global";
    document.body.appendChild(toast);

    // Clique dispensa o toast imediatamente
    toast.addEventListener("click", () => {
      clearTimeout(msgTimer);
      toast.classList.add("mensagem-global-saindo");
      setTimeout(() => toast.classList.remove("mensagem-global-visivel", "mensagem-global-saindo"), 400);
    });
  }

  clearTimeout(msgTimer);
  toast.textContent = texto;
  toast.classList.remove("mensagem-global-saindo");
  toast.classList.add("mensagem-global-visivel");

  msgTimer = setTimeout(() => {
    toast.classList.add("mensagem-global-saindo");
    setTimeout(() => toast.classList.remove("mensagem-global-visivel", "mensagem-global-saindo"), 400);
  }, 2000);

}

function renderizarGatinhas() {

  const hannaContainer =
  document.getElementById("hannaContainer");

  const spriteConjunta =
  document.getElementById("spriteConjunta");

  const hannaSprite =
  document.getElementById("hannaSprite");

  const gatinhaSprite =
  document.getElementById("gatinhaSprite");

  // RESET VISUAL — garante que sprites individuais estão visíveis por padrão
  if (hannaContainer) {
    hannaContainer.style.display = "flex";
  }

  if (hannaSprite) {
    hannaSprite.style.display = "block";
  }

  if (gatinhaDesbloqueada) {
    gatinhaContainer.style.display = "flex";
    if (gatinhaSprite) gatinhaSprite.style.display = "block";
  }

  // Mostra filhotinho quando acorda
  if (filhoteDesbloqueado) {
    filhoteContainer.style.display = "flex";
  }

  if (spriteConjunta) {
    spriteConjunta.style.display = "none";
  }

  // DORMINDO JUNTAS
  if (dormindo && gatinhaDesbloqueada && vinculoGatinhas >= 70) {

    if (hannaContainer) {
      hannaContainer.style.display = "none";
    }

    gatinhaContainer.style.display = "none";
    
    if (filhoteDesbloqueado) {
      filhoteContainer.style.display = "none";
    }

    const spriteDormindo = filhoteDesbloqueado
      ? `assets/sprites/familia/familia-${versaoFilhote === "hanna" ? "hanna-" : versaoFilhote === "gatinha" ? "gatinha-" : ""}dormindo.png`
      : "assets/sprites/hanna-gatinha/gatinhas-dormindo.png";

    spriteConjunta.src = spriteDormindo;
    spriteConjunta.style.display = "block";
    spriteConjunta.style.bottom = filhoteDesbloqueado ? "0px" : "-65px";

    return;
  }

  // MOMENTOS CONJUNTOS
  if (estadoVisual.momentoConjunto) {

    if (hannaSprite) {
      hannaSprite.style.display = "none";
    }

    if (gatinhaSprite) {
      gatinhaSprite.style.display = "none";
    }

    if (hannaContainer) {
      hannaContainer.style.display = "none";
    }

    gatinhaContainer.style.display = "none";

    spriteConjunta.src =
    estadoVisual.spriteConjunta;

    spriteConjunta.style.display = "block";

    spriteConjunta.style.bottom = "";

  }

}

function iniciarFalasIdle() {

    const frasesIdle = {

      normal: [

          "Você voltou.",

          "Vamos brincar?",

          "Tava com saudade...",

          "Hoje você tá linda.",

          "Me faz carinho?"

      ],

      fome: [

          "Barriguinha vazia...",

          "Será que tem peixinho?",

          "Acho que tô com fome..."

      ],

      cansada: [

          "Tô com soninho.",

          "Será que dá pra cochilar?",

          "Minhas patinhas estão cansadas..."

      ],

      triste: [

          "Me dá carinho?",

          "Queria um abraço...",

          "Tô meio tristinha hoje"

      ],

      apaixonada: [

          "Você me faz feliz.",

          "Gosto quando você aparece.",

          "Você é especial pra mim."

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

      mostrarFalaHanna(frase);

  }, 90000);
}

const falasSementeDourada = [
  "Olha o que eu encontrei pra você!",
  "Encontrei uma coisa especial!",
  "Veja só essa surpresa que achei!",
  "Tinha que te mostrar isso!",
  "Cuidar de mim valeu a pena, olha!"
];

function verificarRecompensaSementeDourada() {
  if (dormindo) return; // não entrega semente dormindo

  const todosAltos =
    fome >= 85 &&
    felicidade >= 85 &&
    energia >= 85 &&
    higiene >= 85;

  if (!todosAltos) return;

  const agora = Date.now();
  const passou15dias = (agora - ultimaSementeDourada) >= 15 * 24 * 60 * 60 * 1000;

  if (!passou15dias) return;

  const sorteio = Math.random();

  if (sorteio <= 0.08) {

    sementesDouradas++;
    desbloquearConquista("primeira_dourada");
    ultimaSementeDourada = agora;

    localStorage.setItem("sementesDouradas", sementesDouradas);
    localStorage.setItem("ultimaSementeDourada", ultimaSementeDourada);

    const falaEscolhida =
      falasSementeDourada[Math.floor(Math.random() * falasSementeDourada.length)];

    exibindoSementeDourada = true;
    hannaSprite.src = "assets/sprites/hanna/hanna-semente-dourada.png";
    mostrarFalaHanna(falaEscolhida);

    setTimeout(() => {
      exibindoSementeDourada = false;
      atualizarStatus(); // deixa o bloco normal decidir a sprite certa de novo
    }, 4000);

  }

}

// ÍCONE RESUMO DE STATUS (perto das moedas/sementes)
function atualizarIconeStatusHanna() {
  const sprite = document.getElementById("spriteStatusHanna");
  const texto  = document.getElementById("textoStatusHanna");
  if (!sprite || !texto) return;

  const status   = [fome, felicidade, energia, higiene];
  const media    = status.reduce((a, b) => a + b, 0) / status.length;
  const criticos = status.filter(s => s <= 25).length;
  const menor    = Math.min(...status);

  const falas = {
    feliz:    ["tô me sentindo ótima hoje!", "que dia gostoso!", "tô feliz demais!", "que vida boa, que vida boa..."],
    fome:     ["tô morrendo de fome aqui...", "meu estômago tá roncando...", "me dá alguma coisa pra comer!", "pensei em comida o dia todo..."],
    triste:   ["queria um carinho agora...", "tô me sentindo sozinha...", "será que alguém pensa em mim?", "tô carecendo de atenção..."],
    cansada:  ["ai que soninho bom...", "tô caindo de sono...", "preciso deitar um pouquinho...", "meus olhos tão pesando..."],
    suja:     ["tô precisando de um banho...", "acho que tô cheirando mal...", "me sinto toda bagunçada...", "quero tomar um banho quentinho..."],
    alerta:   ["tô me sentindo um lixo...", "preciso de cuidados urgente...", "alguém me ajuda por favor...", "tô no limite aqui..."],
  };

  let estado;

  if (criticos >= 2) {
    estado = "alerta";
  } else if (menor <= 40) {
    if (menor === fome)            estado = "fome";
    else if (menor === felicidade) estado = "triste";
    else if (menor === energia)    estado = "cansada";
    else                           estado = "suja";
  } else if (media >= 70) {
    estado = "feliz";
  } else {
    estado = "feliz";
  }

  const novoSrc = `assets/status/hanna-status-${estado}.png`;

  if (sprite.getAttribute("src") !== novoSrc) {
    sprite.src = novoSrc;
    const lista = falas[estado];
    texto.textContent = lista[Math.floor(Math.random() * lista.length)];
  }

  // Garante que o texto apareça na primeira carga
  if (!texto.textContent) {
    const lista = falas[estado];
    texto.textContent = lista[Math.floor(Math.random() * lista.length)];
  }
}


// ATUALIZAR STATUS
function atualizarStatus() {

  // Toda visibilidade de sprites fica em renderizarGatinhas
  renderizarGatinhas();

  // Recompensa: semente dourada por cuidado excelente
  verificarRecompensaSementeDourada();

  // corações
  coracoes.forEach((c, i) => {
    c.src = amizade >= i + 1
      ? "assets/ui/coracao-5.png"
      : "assets/ui/coracao-1.png";
  });

  barraFome.style.width        = fome + "%";
  barraFelicidade.style.width  = felicidade + "%";
  barraEnergia.style.width     = energia + "%";
  barraHigiene.style.width     = higiene + "%";
  barraVinculo.style.width     = vinculoGatinhas + "%";

  vinculoPorcentagem.textContent = Math.floor(vinculoGatinhas) + "%";

  if (vinculoGatinhas < 20)       vinculoTexto.textContent = "Desconhecidas";
  else if (vinculoGatinhas < 40)  vinculoTexto.textContent = "Amigas";
  else if (vinculoGatinhas < 60)  vinculoTexto.textContent = "Próximas";
  else if (vinculoGatinhas < 80)  vinculoTexto.textContent = "Apaixonadinhas";
  else                            vinculoTexto.textContent = "Inseparáveis";

  fomePorcentagem.textContent       = Math.floor(fome) + "%";
  felicidadePorcentagem.textContent = Math.floor(felicidade) + "%";
  energiaPorcentagem.textContent    = Math.floor(energia) + "%";
  higienePorcentagem.textContent    = Math.floor(higiene) + "%";

  atualizarIconeStatusHanna();

  sementesTexto.textContent = sementes;
  moedasTexto.textContent   = moedas;

  const sementesFazendaEl = document.getElementById("sementesFazenda");
  if (sementesFazendaEl) sementesFazendaEl.textContent = sementes;

  const sementesDouradasEl =
  document.getElementById("sementesDouradasFazenda");

  if (sementesDouradasEl) {
    sementesDouradasEl.textContent =
    sementesDouradas;
  }

  if (gatinhaDesbloqueada) {
    nomeDaGatinhaTexto.textContent = nomeGatinha;
    const vinculoContainer = document.getElementById("vinculoContainer");
    if (vinculoContainer) vinculoContainer.style.display = "block";
  }

  saldoLoja.textContent = moedas;

  // Conquistas automáticas
  if (moedas >= 10000)   desbloquearConquista("milionaria");
  if (moedas >= 50000)  desbloquearConquista("rica_demais");
  if (moedas >= 100000)  desbloquearConquista("magnata_felina");
  if (moedas >= 500000) desbloquearConquista("bilionaria");
  if (fome >= 95 && felicidade >= 95 && energia >= 95 && higiene >= 95) desbloquearConquista("bem_cuidada");
  if (vinculoGatinhas >= 100 && gatinhaDesbloqueada) desbloquearConquista("inseparaveis");

  if (dormindo) {
    zzzContainer.style.display = "flex";
    return;
  }

  zzzContainer.style.display = "none";

  if (!estadoVisual.momentoConjunto && !momentoConjuntoAtivo && !exibindoSementeDourada) {
    if (energia <= 20) {
      hannaSprite.src = "assets/sprites/hanna/sonolenta.png";
      trocarAnimacao("tristeFloat 4s ease-in-out infinite");
    } else if (fome <= 15) {
      hannaSprite.src = "assets/sprites/hanna/brava.png";
      trocarAnimacao("bravaShake 0.4s infinite");
    } else if (fome <= 50) {
      hannaSprite.src = "assets/sprites/hanna/triste.png";
      trocarAnimacao("tristeFloat 4s ease-in-out infinite");
    } else if (felicidade >= 95) {
      hannaSprite.src = "assets/sprites/hanna/apaixonada.png";
      trocarAnimacao("apaixonadaFloat 5s ease-in-out infinite");
    } else if (felicidade >= 80) {
      hannaSprite.src = "assets/sprites/hanna/contente.png";
      trocarAnimacao("felizBounce 2.5s ease-in-out infinite");
    } else {
      hannaSprite.src = "assets/sprites/hanna/neutra.png";
      trocarAnimacao("idleFloat 4.5s ease-in-out infinite");
    }
    atualizarGatinha();
  }

  _salvar();
}

let _ultimoSaveNuvem = 0;
let _senhaHash = localStorage.getItem("hannaSenhaHash") || null;
let _bloqueioSaveNuvem = true; // começa bloqueado até fazer login

function _salvar() {
  localStorage.setItem("fome",                    fome);
  localStorage.setItem("felicidade",              felicidade);
  localStorage.setItem("energia",                 energia);
  localStorage.setItem("higiene",                 higiene);
  localStorage.setItem("sementes",                sementes);
  localStorage.setItem("sementesDouradas", sementesDouradas);
  localStorage.setItem("moedas",                  moedas);
  localStorage.setItem("amizade",                 amizade);
  localStorage.setItem("vinculoGatinhas",         vinculoGatinhas);
  localStorage.setItem("dormindo",                dormindo);
  localStorage.setItem("updatedAt", Date.now());
  localStorage.setItem("ultimoAcesso", Date.now());
  localStorage.setItem("gatinhaDesbloqueada",     gatinhaDesbloqueada ? "true" : "false");
  localStorage.setItem("nomeGatinha",             nomeGatinha);
  localStorage.setItem("filhoteDesbloqueado", filhoteDesbloqueado ? "true" : "false");
  localStorage.setItem("nomeFilhote",         nomeFilhote);
  localStorage.setItem("versaoFilhote", versaoFilhote);
  localStorage.setItem("generoFilhote",       generoFilhote);
  localStorage.setItem("dataGravidez",        dataGravidez);
  localStorage.setItem("pedidoAceito",        pedidoAceito ? "true" : "false");
  localStorage.setItem("ultimaInteracaoGatinha",  ultimaInteracaoGatinha);
  localStorage.setItem("steveDesbloqueado",       steveDesbloqueado ? "true" : "false");
  localStorage.setItem("joaoDesbloqueado",        joaoDesbloqueado  ? "true" : "false");
  localStorage.setItem("jamesDesbloqueado",       jamesDesbloqueado ? "true" : "false");
  localStorage.setItem("annaDesbloqueada", annaDesbloqueada ? "true" : "false");
  localStorage.setItem("kikaDesbloqueada", kikaDesbloqueada ? "true" : "false");
  localStorage.setItem("modoNoturno", document.body.classList.contains("dark-mode") ? "true" : "false");
  localStorage.setItem("ultimaRoleta", localStorage.getItem("ultimaRoleta") || "0");
  salvarFazenda();

  // Save na nuvem a cada 2 minutos pra não esgotar o limite gratuito
  const agora = Date.now();
  if (agora - _ultimoSaveNuvem > 2 * 60 * 1000) {
    const uid = localStorage.getItem("hannaUid");
    if (uid && !_bloqueioSaveNuvem) {
      _ultimoSaveNuvem = agora;
      import("./firebase.js").then(({ salvarProgressoNuvem }) => {
        salvarProgressoNuvem({
          fome, felicidade, energia, higiene, sementes, moedas,
          amizade, vinculoGatinhas, dormindo,
          gatinhaDesbloqueada, nomeGatinha,
          filhoteDesbloqueado, nomeFilhote, generoFilhote,
          versaoFilhote, dataGravidez, pedidoAceito,
          sementesDouradas, ultimaSementeDourada,
          steveDesbloqueado, joaoDesbloqueado, jamesDesbloqueado,
          annaDesbloqueada, kikaDesbloqueada, ultimaInteracaoGatinha,
          ultimoAcesso: Date.now(),
          modoNoturno: document.body.classList.contains("dark-mode"),
          muted: isMuted,
          fazenda: JSON.stringify(fazenda),
          conquistas: JSON.stringify(conquistasDesbloqueadas),
          lembretes: JSON.stringify(lembretes),
          ultimaRoleta: Number(localStorage.getItem("ultimaRoleta")) || 0,
        });
      }).catch(() => {});
    }
  }
}

// Save automático garantido a cada 30 segundos
setInterval(() => {
  const uid = localStorage.getItem("hannaUid");
  if (uid && !_bloqueioSaveNuvem && telaJogo.style.display === "block") {
    _salvar();
  }
}, 30 * 1000);

// ── SISTEMA DE VÍNCULO DA GATINHA ────────────────────────────
// - Cai 2% por hora sem interação
// - Qualquer interação registra o timestamp
// - Em 0% a gatinha vai embora (bloqueio de 24h pra readotar)
// - Balão de frases acima da gatinha conforme o vínculo

let ultimaInteracaoGatinha = Number(localStorage.getItem("ultimaInteracaoGatinha")) || Date.now();
let gatinhaBloqueadaAte    = Number(localStorage.getItem("gatinhaBloqueadaAte"))    || 0;

function registrarInteracaoGatinha() {
  ultimaInteracaoGatinha = Date.now();
  localStorage.setItem("ultimaInteracaoGatinha", ultimaInteracaoGatinha);
}

function calcularDecayVinculo() {
  if (!gatinhaDesbloqueada) return;
  if (dormindo) return; // vínculo não cai enquanto a Hanna dorme
  
  const agora = Date.now();
  const horasOff = (agora - ultimaInteracaoGatinha) / 3600000;
  if (horasOff >= 1) {
    const decai = Math.floor(horasOff) * 2;
    vinculoGatinhas = Math.max(0, vinculoGatinhas - decai);
    ultimaInteracaoGatinha = agora;
    localStorage.setItem("ultimaInteracaoGatinha", agora);
    localStorage.setItem("vinculoGatinhas", vinculoGatinhas);
    if (vinculoGatinhas <= 0) {
      setTimeout(() => gatinhaVaiEmbora(), 500);
    }
  }
}

function gatinhaVaiEmbora() {
  if (!gatinhaDesbloqueada) return;

  // Cena de despedida
  gatinhaSprite.src = "assets/sprites/gatinha/gatinha-triste.png";
  mostrarFalaGatinha("Vou sentir sua falta...");
  mostrarMensagem("A gatinha foi embora. Você pode adotá-la novamente em 24h.");

  setTimeout(() => {
    // Apaga os dados da gatinha
    gatinhaDesbloqueada        = false;
    nomeGatinha                = "";
    vinculoGatinhas            = 0;
    gatinhaBloqueadaAte        = Date.now() + 24 * 3600000;

    localStorage.setItem("gatinhaDesbloqueada", "false");
    localStorage.setItem("nomeGatinha",         "");
    localStorage.setItem("vinculoGatinhas",     "0");
    localStorage.setItem("gatinhaBloqueadaAte", gatinhaBloqueadaAte);

    gatinhaContainer.style.display = "none";
    nomeDaGatinhaTexto.textContent = "";

    const vinculoContainer = document.getElementById("vinculoContainer");
    if (vinculoContainer) vinculoContainer.style.display = "none";

    inputNomeGatinha.disabled            = true;
    btnSalvarNomeGatinha.disabled        = true;
    inputNomeGatinha.placeholder         = "Adote a gatinha primeiro";

    atualizarStatus();
  }, 4000);
}

// Frases dos balões por nível de vínculo
const frasesVinculoAlto = [
  "Você é minha pessoa favorita.",
  "Não quero sair daqui.",
  "Fico feliz toda vez que você aparece.",
  "Essa casinha é perfeita.",
  "Me sinto tão segura aqui.",
  "Você cuida tão bem de mim.",
];

const frasesVinculoBaixo = [
  "Tô com saudade de você...",
  "Faz um tempão que não brincamos.",
  "Você ainda se lembra de mim?",
  "Tô me sentindo esquecida...",
  "Queria que você viesse mais vezes.",
  "Aqui tá quieto demais.",
];

let vinculoFalaTimer;

function iniciarFalasVinculo() {
  if (!gatinhaDesbloqueada) return;

  clearInterval(vinculoFalaTimer);

  vinculoFalaTimer = setInterval(() => {
    if (!gatinhaDesbloqueada || dormindo || momentoConjuntoAtivo) return;
    if (Math.random() > 0.6) return; // 40% de chance

    const frases = vinculoGatinhas >= 70 ? frasesVinculoAlto : frasesVinculoBaixo;
    const fala = frases[Math.floor(Math.random() * frases.length)];
    mostrarFalaGatinha(fala);

  }, 90000); // a cada 1.5 min
}

// Calcula decay ao carregar (tempo offline)
calcularDecayVinculo();
function mostrarFeedbackBarra(barraId, valor) {
  const container = document.querySelector(`#${barraId}`)?.closest(".barraContainer");
  if (!container) return;

  // Remove feedback anterior se ainda estiver visível
  container.querySelector(".stat-feedback")?.remove();

  const el = document.createElement("span");
  el.className   = "stat-feedback";
  el.textContent = valor > 0 ? `+${Math.round(valor)}` : `${Math.round(valor)}`;
  el.style.color = valor > 0 ? "#a8ffb0" : "#ffb0b0";

  container.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

let eventoEmAndamento = false;

const eventosDoDia = [

  {
    sprite:    "vergonha",
    animacao:  "vergonhaWiggle 0.6s ease-in-out infinite alternate",
    duracao:   4000,
    fala:      "Aaaa, para de olhar!",
    // Aparece quando está feliz ou apaixonada (humor alto)
    condicao:  () => felicidade >= 70 && !dormindo,
    peso:      3,
  },

  {
    sprite:    "aprontona",
    animacao:  "aprontonaSneak 1s ease-in-out infinite",
    duracao:   5000,
    fala:      "Eu não fiz nada...",
    // Aparece com qualquer humor, mais comum quando a fome tá ok
    condicao:  () => fome >= 40 && !dormindo,
    peso:      4,
  },

  {
    sprite:    "doidinha",
    animacao:  "doidinhaSpin 0.5s linear infinite",
    duracao:   4500,
    fala:      "WHEEEEE",
    // Aparece só quando energia está alta
    condicao:  () => energia >= 70 && !dormindo,
    peso:      2,
  },

  {
    sprite:    "chorando-felicidade",
    animacao:  "chorandoFelizFloat 3s ease-in-out infinite",
    duracao:   5500,
    fala:      "Tô chorando de amor por você...",
    // Só aparece com felicidade e vínculo muito altos
    condicao:  () => felicidade >= 85 && amizade >= 3 && !dormindo,
    peso:      2,
  },

  {
    sprite:    "metida",
    animacao:  "metidaFloat 4s ease-in-out infinite",
    duracao:   5000,
    fala:      "Sei lá, sou muito fofa mesmo.",
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

  // 60% de chance de não disparar mesmo assim (pra não ficar repetitivo)
  if (Math.random() > 0.4) return;

  eventoEmAndamento = true;

  const spriteAnterior  = hannaSprite.src;
  const animacaoAnterior = hannaSprite.style.animation;

  hannaSprite.src = `assets/sprites/hanna/${evento.sprite}.png`;
  trocarAnimacao(evento.animacao);
  mostrarMensagem(evento.fala);

  setTimeout(() => {

    if (momentoConjuntoAtivo) return;

    hannaSprite.src = spriteAnterior;
    trocarAnimacao(animacaoAnterior);
    eventoEmAndamento = false;
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
  if (dormindo || momentoConjuntoAtivo) {
    mostrarFalaHanna("Zzz... 💤");
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
  somCarinho.currentTime = 0;
  somCarinho.play().catch(()=>{});
  vibrar(10);
  felicidade = Math.min(100, felicidade + 10);
  amizade    = Math.min(5,   amizade    + 0.05);
  mostrarFeedbackBarra("barraFelicidade", 10);
  if (gatinhaDesbloqueada) {
    vinculoGatinhas = Math.min(100, vinculoGatinhas + 2);
    registrarInteracaoGatinha();
  }
  sementes++;
  criarParticulas("💖", 8);
  mostrarMensagem("Purrrr...");
  desbloquearConquista("primeiro_carinho");
  hannaSprite.src = "assets/sprites/hanna/carinho.png";
  gatinhaSpriteTemp("gatinha-apaixonada", 2000);
  setTimeout(atualizarStatus, 2000);
  // Filhotinho reage ao carinho
  if (filhoteDesbloqueado) {
    const sprites = spritesFilhote[versaoFilhote] || spritesFilhote.misto;
    const spriteBase = versaoFilhote === "hanna"
      ? "assets/sprites/filhote/filhote-hanna.png"
      : versaoFilhote === "gatinha"
      ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png";
    if (filhoteSprite) filhoteSprite.src = sprites[Math.floor(Math.random() * sprites.length)];
    setTimeout(() => { if (filhoteSprite) filhoteSprite.src = spriteBase; }, 2000);
  }
});

btnComida.addEventListener("click", () => {
  if (dormindo || momentoConjuntoAtivo) {
    mostrarFalaHanna("Zzz... 💤");
    return;
  }

    somBotao.volume =
    parseFloat(
        volumeEfeitos.value
    );

somBotao.play().catch(()=>{});
  somComida.currentTime = 0;
  somComida.play().catch(()=>{});

    fome = Math.min(100, fome + 10);

    amizade = Math.min(5, amizade + 0.05);

    mostrarFeedbackBarra("barraFome", 10);

    criarParticulas("🐟", 6);

    mostrarMensagem("Miauu! obrigada pela comida.");
    desbloquearConquista("bem_alimentada");
    if (gatinhaDesbloqueada) registrarInteracaoGatinha();

    hannaSprite.src =
    "assets/sprites/hanna/comendo.png";

    gatinhaSpriteTemp("gatinha-sorrindo", 2000);

    setTimeout(() => {

        hannaSprite.src =
        "assets/sprites/hanna/neutra.png";

    }, 1000);

    setTimeout(atualizarStatus, 2000);

    // Filhotinho reage à comida
  if (filhoteDesbloqueado) {
    const sprites = spritesFilhote[versaoFilhote] || spritesFilhote.misto;
    const spriteBase = versaoFilhote === "hanna"
      ? "assets/sprites/filhote/filhote-hanna.png"
      : versaoFilhote === "gatinha"
      ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png";
    if (filhoteSprite) filhoteSprite.src = sprites.find(s => s.includes("comendo")) || sprites[0];
    setTimeout(() => { if (filhoteSprite) filhoteSprite.src = spriteBase; }, 2000);
  }

});

let dormirInterval;


// FUNÇÃO DE DORMIR

function iniciarSono() {

    dormindo = true;

    zzzContainer.style.display = "flex";

    localStorage.setItem("dormindo", "true");

    atualizarGatinha();

    if (gatinhaDesbloqueada && vinculoGatinhas >= 70) {
      // Vínculo alto — dormem juntas via renderizarGatinhas
      momentoConjuntoAtivo = false; // momento conjunto é diferente de dormindo juntas
    } else {
      // Vínculo baixo — sprites individuais
      momentoConjuntoAtivo = false;
      hannaSprite.src = "assets/sprites/hanna/dormindo.png";
      hannaSprite.style.animation = "none";
      if (gatinhaDesbloqueada) gatinhaSprite.style.animation = "none";
    }

    atualizarStatus(); // chama renderizarGatinhas que cuida de tudo


    clearInterval(dormirInterval);


    dormirInterval = setInterval(() => {

        energia += 0.5;


        if (energia >= 100) {

          energia = 100;

          dormindo = false;

          momentoConjuntoAtivo = false;

          clearInterval(dormirInterval);

          const hannaContainer =
          document.getElementById("hannaContainer");

          const spriteConjunta =
          document.getElementById("spriteConjunta");

          if (spriteConjunta) {
            spriteConjunta.style.display   = "none";
            spriteConjunta.style.animation = "";
          }

          if (hannaContainer) {
            hannaContainer.style.display     = "flex";
            hannaContainer.style.visibility  = "";
            hannaContainer.style.opacity     = "";
          }

          hannaSprite.style.display   = "block";
          hannaSprite.style.animation = "";

          if (gatinhaDesbloqueada) {
            gatinhaContainer.style.display     = "flex";
            gatinhaContainer.style.visibility  = "";
            gatinhaContainer.style.opacity     = "";
            gatinhaSprite.style.animation      = "";
          }

          localStorage.setItem("dormindo", "false");

          zzzContainer.style.display = "none";

          mostrarMensagem("A Hanna acordou descansada.");

          somAcordar.currentTime = 0;
          somAcordar.play().catch(()=>{});

          atualizarStatus();

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

    somDormir.currentTime = 0;
    somDormir.play().catch(()=>{});

    mostrarMensagem("A Hanna foi dormir.");
    desbloquearConquista("boa_noite");
    if (gatinhaDesbloqueada) registrarInteracaoGatinha();


    iniciarSono();

    // Filhotinho reage ao dormir
    if (filhoteDesbloqueado) {
      const spriteBase = versaoFilhote === "hanna" ? "assets/sprites/filhote/filhote-hanna.png"
        : versaoFilhote === "gatinha" ? "assets/sprites/filhote/filhote-gatinha.png"
        : "assets/sprites/filhote/filhote.png";
      const sprites = spritesFilhote[versaoFilhote] || spritesFilhote.misto;
      if (filhoteSprite) filhoteSprite.src = sprites.find(s => s.includes("dormindo")) || sprites[0];
      setTimeout(() => { if (filhoteSprite) filhoteSprite.src = spriteBase; }, 3000);
    }

});

// PASSAGEM DO TEMPO
setInterval(() => {
  if (!dormindo) {
    fome       = Math.max(0, fome       - 1.5);
    felicidade = Math.max(0, felicidade - 0.8);
    energia    = Math.max(0, energia    - 0.3);
    higiene    = Math.max(0, higiene    - 0.8);

    // Vínculo cai 1% por hora fora do horário de sono
    const hora = new Date().getHours();
    const horarioSono = hora >= 0 && hora < 8;
    if (!horarioSono && gatinhaDesbloqueada) {
      vinculoGatinhas = Math.max(0, vinculoGatinhas - (1/60));
    }

    atualizarStatus();
  }
}, 60000); // 1 min

// Carregar dados do Jogo
function carregarDadosNoJogo(dados) {
  fome                 = Number(dados.fome)                || 40;
  felicidade           = Number(dados.felicidade)          || 35;
  energia              = Number(dados.energia)             || 50;
  higiene              = Number(dados.higiene)             || 30;
  sementes             = Number(dados.sementes)            || 0;
  sementesDouradas     = Number(dados.sementesDouradas)    || 0;
  ultimaSementeDourada = Number(dados.ultimaSementeDourada)|| 0;
  moedas               = Number(dados.moedas)              || 0;
  amizade              = Number(dados.amizade)             || 0;
  vinculoGatinhas      = Number(dados.vinculoGatinhas)     || 0;

  gatinhaDesbloqueada  = dados.gatinhaDesbloqueada === true || dados.gatinhaDesbloqueada === "true";
  nomeGatinha          = dados.nomeGatinha || "";
  dormindo             = dados.dormindo === true || dados.dormindo === "true";

  filhoteDesbloqueado = dados.filhoteDesbloqueado === true || dados.filhoteDesbloqueado === "true";
  nomeFilhote         = dados.nomeFilhote || "";
  generoFilhote       = dados.generoFilhote || "";
  versaoFilhote       = dados.versaoFilhote || "misto";
  dataGravidez        = Number(dados.dataGravidez) || 0;
  pedidoAceito        = dados.pedidoAceito === true || dados.pedidoAceito === "true";

  steveDesbloqueado    = dados.steveDesbloqueado === true || dados.steveDesbloqueado === "true";
  joaoDesbloqueado     = dados.joaoDesbloqueado === true || dados.joaoDesbloqueado === "true";
  jamesDesbloqueado    = dados.jamesDesbloqueado === true || dados.jamesDesbloqueado === "true";
  annaDesbloqueada = dados.annaDesbloqueada === true || dados.annaDesbloqueada === "true";
  kikaDesbloqueada = dados.kikaDesbloqueada === true || dados.kikaDesbloqueada === "true";

  if (dados.conquistas) {
    try { conquistasDesbloqueadas = JSON.parse(dados.conquistas); } catch(e) {}
  }

  ultimaInteracaoGatinha = Number(dados.ultimaInteracaoGatinha) || Date.now();

  if (dados.fazenda) {
    try {
      const fazendaSalva = JSON.parse(dados.fazenda);
      fazendaSalva.forEach((slot, idx) => {
        if (fazenda[idx]) {
          fazenda[idx].plantada  = slot.plantada  || false;
          fazenda[idx].pronta    = slot.pronta    || false;
          fazenda[idx].flor      = slot.flor      || "";
          fazenda[idx].tempoFim  = slot.tempoFim  || 0;
        }
      });
    } catch(e) {}
  }

  if (dados.lembretes) {
    try { lembretes = JSON.parse(dados.lembretes); } catch(e) {}
  }

  if (dados.ultimoAcesso) localStorage.setItem("ultimoAcesso", dados.ultimoAcesso); // linha nova

  if (dados.modoNoturno === true) document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");

  if (dados.muted !== undefined) {
    isMuted = dados.muted === true;
    aplicarMute();
  }

  if (dados.ultimaRoleta) localStorage.setItem("ultimaRoleta", dados.ultimaRoleta);
}

// TELA DE LOADING
function mostrarLoading() {
  const hora = new Date().getHours();
  const sprite = (hora >= 6 && hora < 18)
    ? "assets/sprites/hanna/hanna-loading-dia.png"
    : "assets/sprites/hanna/hanna-loading-noite.png";

  document.getElementById("hannaLoading").src = sprite;
  document.getElementById("telaLoading").style.display = "block";
  telaInicial.classList.add("fadeOut");
  setTimeout(() => telaInicial.style.display = "none", 500);
}

function esconderLoading() {
  const telaLoad = document.getElementById("telaLoading");
  telaLoad.classList.add("fadeOut");
  setTimeout(() => {
    telaLoad.style.display = "none";
    telaLoad.classList.remove("fadeOut");
  }, 500);
}

// ENTRAR NO JOGO
function entrarNoJogo() {
  document.querySelector(".bottomNav").style.display = "flex";
  esconderLoading();
  setTimeout(() => {
    abrirTela(telaJogo);
    telaJogo.classList.add("fadeIn");
    tocarTrilha("casa");
    mensagemHorario();
    iniciarFalasIdle();
    iniciarMomentosEspeciais();
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ tipo: "CHECK_LEMBRETES" });
    }
    if (gatinhaDesbloqueada) {
      gatinhaContainer.style.display = "flex";
      if (nomeGatinha) nomeDaGatinhaTexto.textContent = nomeGatinha;
    }
    momentoConjuntoAtivo = false;
    exibindoSementeDourada = false;
    dormindo = localStorage.getItem("dormindo") === "true";

    // Reinicia interval de sono se já tava dormindo
    if (dormindo) {
      dormirInterval = setInterval(() => {
        energia += 0.5;
        if (energia >= 100) {
          energia = 100;
          dormindo = false;
          clearInterval(dormirInterval);
          localStorage.setItem("dormindo", "false");
          zzzContainer.style.display = "none";
          hannaSprite.src = "assets/sprites/hanna/neutra.png";
          mostrarMensagem("A Hanna acordou descansada.");
          atualizarStatus();
        }
        atualizarStatus();
      }, 7000);
    }

    // Recalcula energia ganha dormindo
    if (dormindo) {
      const agora = Date.now();
      const ultimoAcessoSalvo = Number(localStorage.getItem("ultimoAcesso")) || agora;
      const minutosOff = Math.min((agora - ultimoAcessoSalvo) / 60000, 480);
      energia = Math.min(100, energia + 0.5 * minutosOff);
      if (energia >= 100) {
        energia = 100;
        dormindo = false;
        localStorage.setItem("dormindo", "false");
      }
    }

    // Sprite e zzz
    if (dormindo) {
      hannaSprite.src = "assets/sprites/hanna/dormindo.png";
      zzzContainer.style.display = "flex";
    } else {
      zzzContainer.style.display = "none";
    }

    atualizarStatus();
    verificarRoletaDiaria();
    atualizarBtnEsconde();
    atualizarBtnsLoja();
    atualizarConfigGatinha();

    // Filhotinho
    if (filhoteDesbloqueado) exibirFilhote();
    if (dataGravidez > 0) verificarNascimentoFilhote();

    // Inicia sistema de visitas (fila central)
    iniciarSistemaVisitas();

  }, 500);
}

// LOGIN NA TELA INICIAL
function mostrarFeedbackLogin(msg, erro = false) {
  const el = document.getElementById("textoFeedbackLogin");
  if (!el) return;
  el.textContent = msg;
  el.style.color = erro ? "#ff5555" : "var(--pink-deep)";
  el.style.display = "block";
}

function mostrarFeedbackCriar(msg, erro = false) {
  const el = document.getElementById("textoFeedbackCriar");
  if (!el) return;
  el.textContent = msg;
  el.style.color = erro ? "#ff5555" : "var(--pink-deep)";
  el.style.display = "block";
}

// Botão Entrar
document.getElementById("btnEntrar")?.addEventListener("click", async () => {
  const email = document.getElementById("inputLoginEmail").value.trim();
  const senha = document.getElementById("inputLoginSenha").value.trim();

  if (!email || !senha) {
    mostrarFeedbackLogin("Preencha email e senha.", true);
    return;
  }

  mostrarLoading();

  const { entrarComConta } = await import("./firebase.js");
  const resultado = await entrarComConta(email, senha);

  if (!resultado.ok) {
    document.getElementById("telaLoading").style.display = "none";
    telaInicial.style.display = "block";
    telaInicial.classList.remove("fadeOut");
    mostrarFeedbackLogin(resultado.erro, true);
    return;
  }

  localStorage.setItem("hannaEmail", email);
  localStorage.setItem("hannaSenhaTexto", senha);

  localStorage.clear();
  if (resultado.dados) {
    carregarDadosNoJogo(resultado.dados);
    compensarTempoOffline();
    restaurarSlotsVisuais();
    setTimeout(() => reagendarCrescimentoOffline(), 600);
  }
  _bloqueioSaveNuvem = true;
  _salvar();
  setTimeout(() => { 
    _bloqueioSaveNuvem = false; 
  }, 60000);

  localStorage.setItem("hannaUid", resultado.uid);
  localStorage.setItem("hannaEmail", email);
  localStorage.setItem("hannaSenhaTexto", senha);

  somBotao.volume = parseFloat(volumeEfeitos.value);
  somBotao.play().catch(() => {});
  vibrar(15);

  entrarNoJogo();
});

// Botão Esqueci minha senha
document.getElementById("btnEsqueciSenha")?.addEventListener("click", async () => {
  const email = document.getElementById("inputLoginEmail").value.trim();
  if (!email) {
    mostrarFeedbackLogin("Digite seu email primeiro.", true);
    return;
  }
  const { recuperarSenha } = await import("./firebase.js");
  const resultado = await recuperarSenha(email);
  if (resultado.ok) {
    mostrarFeedbackLogin("Email de recuperação enviado!", false);
  } else {
    mostrarFeedbackLogin(resultado.erro, true);
  }
});

// Botão Ir pra Criar Conta
document.getElementById("btnIrCriarConta")?.addEventListener("click", () => {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaCriarConta").style.display = "block";
});

// Botão Voltar pro Login
document.getElementById("btnVoltarLogin")?.addEventListener("click", () => {
  document.getElementById("telaCriarConta").style.display = "none";
  document.getElementById("telaLogin").style.display = "block";
});

// Botão Criar Conta
document.getElementById("btnCriarContaInicial")?.addEventListener("click", async () => {
  const email = document.getElementById("inputCriarEmail").value.trim();
  const senha = document.getElementById("inputCriarSenha").value.trim();

  if (!email || !senha) {
    mostrarFeedbackCriar("Preencha email e senha.", true);
    return;
  }
  if (senha.length < 6) {
    mostrarFeedbackCriar("Senha precisa ter pelo menos 6 caracteres.", true);
    return;
  }

  mostrarFeedbackCriar("Conta criada!");
  setTimeout(() => {
    mostrarLoading();
    setTimeout(() => entrarNoJogo(), 500);
  }, 1000);

  const { criarConta, salvarProgressoNuvem } = await import("./firebase.js");
  const resultado = await criarConta(email, senha);

  if (!resultado.ok) {
    mostrarFeedbackCriar(resultado.erro, true);
    return;
  }

  localStorage.setItem("hannaUid", resultado.uid);
  localStorage.setItem("hannaEmail", email);
  localStorage.setItem("hannaSenhaTexto", senha);

  await salvarProgressoNuvem({
    fome, felicidade, energia, higiene, sementes, moedas,
    amizade, vinculoGatinhas, dormindo,
    gatinhaDesbloqueada, nomeGatinha,
    sementesDouradas, ultimaSementeDourada,
    steveDesbloqueado, joaoDesbloqueado, jamesDesbloqueado,
    ultimaInteracaoGatinha,
    fazenda: JSON.stringify(fazenda),
    conquistas: JSON.stringify(conquistasDesbloqueadas),
    lembretes: JSON.stringify(lembretes),
  });

  mostrarFeedbackCriar("Conta criada!");
  setTimeout(() => entrarNoJogo(), 1000);
});

// Auto-preenchimento se já tem email salvo
const _emailSalvo = localStorage.getItem("hannaEmail");
const _senhaSalva = localStorage.getItem("hannaSenhaTexto");
if (_emailSalvo && _senhaSalva) {
  document.getElementById("inputLoginEmail").value = _emailSalvo;
  document.getElementById("inputLoginSenha").value = _senhaSalva;
}

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

    girassol: 3500,

    "flor-aurora": 100000

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
  "Vamos plantar!",
  "Cuida bem das plantinhas!",
  "Adoro a fazendinha",
  "Quando colhemos?",
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

    // GUARDA O VALOR ANTES DE LIMPAR
    const valorColheita = valorPlantas[slot.flor] || 0;

    moedas += valorColheita;
    if (isNaN(moedas)) moedas = 0;
    amizade = Math.min(5, amizade + 0.08);

    slot.plantada = false;
    slot.pronta   = false;
    slot.flor     = "";

    sprite.src = "assets/farm/vazio.png";

    atualizarStatus();
    salvarFazenda();

    mostrarMensagem(`Você colheu! 🪙 +${valorColheita}`);
    desbloquearConquista("jardineira");

    falarFazenda(
      `Que colheita boa!`,
      "assets/sprites/hanna/brincando.png"
    );

  });
});

// Restaura os visuais dos slots ao carregar a página
restaurarSlotsVisuais();

// REAGENDAR CRESCIMENTO DAS PLANTAS OFFLINE
function reagendarCrescimentoOffline() {
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

    const spriteAgora = slotsPlantacao[idx]?.querySelector("img");

    if (tempoRestante <= 0) {
      slot.pronta = true;
      salvarFazenda();
      if (spriteAgora) spriteAgora.src = `assets/farm/${slot.flor}.png`;
    } else {
      const progresso = 1 - tempoRestante / MATURACAO;
      if (spriteAgora && progresso > 0.5) spriteAgora.src = "assets/farm/brotinho.png";

      setTimeout(() => {
        slot.pronta = true;
        salvarFazenda();
        const s = slotsPlantacao[idx]?.querySelector("img");
        if (s) s.src = `assets/farm/${slot.flor}.png`;
        mostrarMensagem("Uma flor cresceu.");
      }, tempoRestante);
    }
  });
}

// Chama ao carregar a página (comportamento original)
reagendarCrescimentoOffline();

btnPlantar.addEventListener("click", () => {

  const slotLivre = fazenda.findIndex(s => !s.plantada);

  if (slotLivre === -1) {

    mostrarMensagem("Todos os canteiros estão ocupados.", "fazenda");
    falarFazenda("Todos os canteiros cheios.", "assets/sprites/hanna/curiosa.png");

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
  "rosa",

  "flor",
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

  "girassol"

];

slot.flor =
  plantas[
    Math.floor(Math.random() * plantas.length)
  ];

  

  const tempoMaturacao = 300000; // 5 minutos
  slot.tempoFim = Date.now() + tempoMaturacao;
  salvarFazenda();

  sprite.src = "assets/farm/semente.png";

  sprite.style.display = "none";

  sprite.offsetHeight;

  sprite.style.display = "block";

  mostrarMensagem("A Hanna plantou uma sementinha.");
  falarFazenda("Plantei! Agora é só esperar.", "assets/sprites/hanna/feliz.png");

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

    mostrarMensagem("Uma flor cresceu.");
    falarFazenda("Cresceu! Toca pra colher.", "assets/sprites/hanna/animada.png");

  }, tempoRestante);

});

btnPlantarDourada.addEventListener("click", () => {

  const slotLivre = fazenda.findIndex(s => !s.plantada);

  if (slotLivre === -1) {

    mostrarMensagem("Todos os canteiros estão ocupados.", "fazenda");
    falarFazenda("Todos os canteiros cheios.", "assets/sprites/hanna/curiosa.png");

    return;

  }

  if (sementesDouradas <= 0) {

    mostrarMensagem("Você não possui sementes douradas.", "fazenda");
    falarFazenda("Cadê minhas sementes raras?", "assets/sprites/hanna/triste.png");

    return;

  }

  sementesDouradas--;

  atualizarStatus();

  const slot = fazenda[slotLivre];
  const sprite = slotsPlantacao[slotLivre].querySelector("img");

  slot.plantada = true;
  slot.flor = "flor-aurora";

  const tempoMaturacao = 300000; // 5 minutos
  slot.tempoFim = Date.now() + tempoMaturacao;

  salvarFazenda();

  sprite.src = "assets/farm/semente-dourada.png";

  mostrarMensagem("Você plantou uma Semente Dourada.");
  falarFazenda("Essa vai valer uma fortuna!", "assets/sprites/hanna/animada.png");

  setTimeout(() => {

    sprite.src = "assets/farm/brotinho.png";

  }, 5000);

  const tempoRestante =
    Math.max(0, slot.tempoFim - Date.now());

  setTimeout(() => {

    slot.pronta = true;

    salvarFazenda();

    sprite.src = "assets/farm/flor-aurora.png";

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
    { sprite:"assets/sprites/hanna/curiosa.png",    frase:"A Hanna está curiosa" },
    { sprite:"assets/sprites/hanna/animada.png",    frase:"A Hanna quer brincar" },
    { sprite:"assets/sprites/hanna/apaixonada.png", frase:"Purrrr..." },
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
  if (moedas < 1250) { mostrarAlertaLoja("⚠️ Moedas insuficientes"); return; }
  moedas -= 1250;
  somCompra.currentTime = 0; 
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});
  felicidade = Math.min(100, felicidade + 10);
  mostrarFeedbackBarra("barraFelicidade", 10);
  mostrarMensagem("A Hanna amou a nova coleira.");
  hannaSprite.src = "assets/sprites/hanna/contente.png";
  atualizarStatus();
});

btnMorango.addEventListener("click", () => {
  if (moedas < 400) { mostrarAlertaLoja("⚠️ Moedas insuficientes"); return; }
  moedas -= 400;
  somCompra.currentTime = 0; 
  
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});
  fome = Math.min(100, fome + 30);
  mostrarFeedbackBarra("barraFome", 30);
  mostrarMensagem("A Hanna devorou o peixinho.");
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
// Cinza o botão de adotar se já tem gatinha
btnSashimi.addEventListener("click", () => {
  if (moedas < 900) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 900;
  fome = Math.min(100, fome + 50);
  mostrarFeedbackBarra("barraFome", 50);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna amou o sashimi.");
  atualizarStatus();
});

btnNovelo.addEventListener("click", () => {
  if (moedas < 600) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 600;
  felicidade = Math.min(100, felicidade + 20);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna brincou com o novelo.");
  atualizarStatus();
});

btnRatinho.addEventListener("click", () => {
  if (moedas < 900) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 900;
  felicidade = Math.min(100, felicidade + 25);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna adorou o ratinho.");
  atualizarStatus();
});

btnAtum.addEventListener("click", () => {
  if (moedas < 1500) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 1500;
  fome = Math.min(100, fome + 70);
  mostrarFeedbackBarra("barraFome", 70);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Atum premium, delicioso.");
  atualizarStatus();
});

btnBiscoito.addEventListener("click", () => {
  if (moedas < 1000) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 1000;
  fome = Math.min(100, fome + 25);
  felicidade = Math.min(100, felicidade + 25);
  mostrarFeedbackBarra("barraFome", 25);
  mostrarFeedbackBarra("barraFelicidade", 25);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Biscoitinho crocante.");
  atualizarStatus();
});

btnDonut.addEventListener("click", () => {
  if (moedas < 1250) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 1250;
  felicidade = Math.min(100, felicidade + 45);
  mostrarFeedbackBarra("barraFelicidade", 45);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Donut felino, delicioso.");
  atualizarStatus();
});

// PACK DE SEMENTES
document.getElementById("btnPackSementes").addEventListener("click", () => {
  if (moedas < 4000) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 4000;
  sementes += 10;

  somCompra.currentTime = 0;
  somCompra.volume = parseFloat(volumeEfeitos.value);
  somCompra.play().catch(() => {});

  mostrarMensagem("10 sementes adicionadas! 🌱");
  atualizarStatus();
});

function digitarTexto(elemento, texto, velocidade = 35, aoTerminar = null) {
  elemento.textContent = "";
  let i = 0;
  const intervalo = setInterval(() => {
    elemento.textContent += texto[i];
    i++;
    if (i >= texto.length) {
      clearInterval(intervalo);
      if (aoTerminar) aoTerminar();
    }
  }, velocidade);
}

function abrirTelaPedido() {
  const telaPedido  = document.getElementById("telaPedido");
  const textoPedido = document.getElementById("textoPedido");
  const pedidoBtns  = document.getElementById("pedidoBtns");
  const pedidoSprite = document.getElementById("pedidoSprite");

  pedidoSprite.src = "assets/sprites/hanna-gatinha/pedido.png";
  pedidoBtns.style.display = "none";
  telaPedido.style.display = "flex";
  tocarTrilha("pedido");

  const mensagem = "E-eu estou um pouquinho nervosa... Desde que nos conhecemos, você se tornou muito importante para mim. Meu coração bate mais forte quando estamos juntas e eu adoro passar o tempo ao seu lado. Eu queria te fazer uma pergunta... Você aceita namorar comigo?";

  // Botões só aparecem depois que terminar de digitar
  digitarTexto(textoPedido, mensagem, 35, () => {
    pedidoBtns.style.display = "flex";
  });
}

btnSimPedido.addEventListener("click", () => {
  const textoPedido  = document.getElementById("textoPedido");
  const pedidoBtns   = document.getElementById("pedidoBtns");
  const pedidoSprite = document.getElementById("pedidoSprite");

  pedidoBtns.style.display = "none";
  pedidoSprite.src = "assets/sprites/hanna-gatinha/felizes.png";

  // Seta pedido aceito
  pedidoAceito = true;
  desbloquearConquista("pedido_aceito");

  // Bloqueia botão na loja
  const btnPedido = document.getElementById("btnPedidoEspecial");
  if (btnPedido) {
    btnPedido.textContent = "Já namoram!";
    btnPedido.classList.add("btn-adotado");
    btnPedido.style.opacity = "0.5";
    btnPedido.style.cursor = "not-allowed";
  }

  const resposta = "Sério?! Eu sou a gatinha mais feliz do mundo! Prometo continuar ao seu lado em todas as nossas aventuras!";

  digitarTexto(textoPedido, resposta, 35, () => {
    setTimeout(() => {
      telaPedido.style.display = "none";
      tocarTrilha("casa");
      _salvar();
    }, 3000);
  });
});

btnNaoPedido.addEventListener("click", () => {
  telaPedido.style.display = "none";
});

btnNaoPedido.addEventListener("click", () => {
  telaPedido.style.display = "none";
  tocarTrilha("casa")

});

// PEDIDO ESPECIAL
document.getElementById("btnPedidoEspecial")?.addEventListener("click", () => {
  if (pedidoAceito) {
    mostrarAlertaLoja("Elas já namoram!");
    return;
  }
  if (vinculoGatinhas < 80) {
    mostrarAlertaLoja("A Hanna precisa de 80% de vínculo primeiro!");
    return;
  }
  if (moedas < 70000) {
    mostrarAlertaLoja("Você precisa de 70.000 moedas!");
    return;
  }
  moedas -= 70000;
  atualizarStatus();
  somCompra.currentTime = 0;
  somCompra.volume = parseFloat(volumeEfeitos.value);
  somCompra.play().catch(() => {});
  abrirTelaPedido();
});

btnVarinha.addEventListener("click", () => {
  if (moedas < 1750) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 1750;
  felicidade = Math.min(100, felicidade + 40);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Magia felina.");
  atualizarStatus();
});

btnRobo.addEventListener("click", () => {
  if (moedas < 12500) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 12500;
  felicidade = Math.min(100, felicidade + 50);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("Ratinho robô ativado.");
  atualizarStatus();
});

btnAlmofada.addEventListener("click", () => {
  if (moedas < 1100) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 1100;
  energia = Math.min(100, energia + 20);

  somCompra.currentTime = 0;
  somCompra.volume =
  parseFloat(
      volumeEfeitos.value
  );

  somCompra.play().catch(()=>{});

  mostrarMensagem("A Hanna descansou fofinha.");
  atualizarStatus();
});

function abrirCaixa() {
  // Simula o clique no botão da caixa sem cobrar moedas
  caixaSprite.src = "assets/shop/caixa.png";
  textoCaixa.textContent = "O que será que tem aqui dentro?";
  btnAbrirCaixa.style.display = "block";
  btnAbrirCaixa.disabled = false;
  btnFecharCaixa.style.display = "none";
  resultadoCaixa.style.display = "none";
  resultadoCaixa.innerHTML = "";
  telaCaixa.style.display = "flex";
  atualizarStatus();
}

// CAIXA MISTERIOSA
btnCaixa.addEventListener("click", () => {

  if (moedas < 5000) {
    mostrarAlertaLoja("⚠️ Moedas insuficientes");
    return;
  }

  moedas -= 5000;

  // VOLTA AO ESTADO INICIAL
  caixaSprite.src = "assets/shop/caixa.png";
  textoCaixa.textContent = "O que será que tem aqui dentro?";

  btnAbrirCaixa.style.display = "block";
  btnAbrirCaixa.disabled = false;

  btnFecharCaixa.style.display = "none";

  resultadoCaixa.style.display = "none";
  resultadoCaixa.innerHTML = "";

  telaCaixa.style.display = "flex";

  atualizarStatus();

});

btnAbrirCaixa.addEventListener("click", () => {

  btnAbrirCaixa.disabled = true;

  caixaSprite.classList.add("caixaTremendo");

  setTimeout(() => {
    caixaSprite.classList.remove("caixaTremendo");
    caixaSprite.src = "assets/shop/caixa-aberta.png";

    const temSementeDourada = Math.random() < 0.05; // 5% de chance
    const quantidadePremios = temSementeDourada ? 3 : (Math.random() < 0.5 ? 3 : 4);

    const premiosDisponiveis = [...premiosCaixa];
    const premiosRecebidos = [];

    for (let i = 0; i < quantidadePremios; i++) {
      const indice = Math.floor(Math.random() * premiosDisponiveis.length);
      const premio = premiosDisponiveis.splice(indice, 1)[0];
      premio.aplicar();
      premiosRecebidos.push(premio);
    }

    // Adiciona semente dourada se sorteou
    if (temSementeDourada) {
      sementesDouradas++;
      localStorage.setItem("sementesDouradas", sementesDouradas);
      premiosRecebidos.unshift({
        nome: "Semente Dourada",
        sprite: "assets/farm/semente-dourada.png",
      });
    }

    textoCaixa.textContent = "Você encontrou:";

    resultadoCaixa.style.display = "block";
    resultadoCaixa.innerHTML = premiosRecebidos.map(premio => `
      <div class="premioCaixa">
        <img src="${premio.sprite}" class="premioCaixaSprite" alt="${premio.nome}">
        <span>${premio.nome}</span>
      </div>
    `).join("");

    btnAbrirCaixa.style.display = "none";
    btnFecharCaixa.style.display = "block";

    atualizarStatus();

  }, 500);

});

btnFecharCaixa.addEventListener("click", () => {
  telaCaixa.style.display = "none";
});

// Sorteio Caixa Misteriosa - Comum
const premiosCaixa = [
  {
    nome: "Sashimi",
    sprite: "assets/shop/sashimi.png",
    aplicar: () => {
      fome = Math.min(100, fome + 40);
    }
  },

  {
    nome: "Novelo",
    sprite: "assets/shop/novelo.png",
    aplicar: () => {
      felicidade = Math.min(100, felicidade + 15);
    }
  },

  {
    nome: "Ratinho",
    sprite: "assets/shop/ratinho.png",
    aplicar: () => {
      felicidade = Math.min(100, felicidade + 30);
    }
  },

  {
    nome: "Atum",
    sprite: "assets/shop/atum.png",
    aplicar: () => {
      fome = Math.min(100, fome + 20);
    }
  },

  {
    nome: "Biscoito",
    sprite: "assets/shop/biscoito.png",
    aplicar: () => {
      fome = Math.min(100, fome + 15);
    }
  },

  {
    nome: "Donut",
    sprite: "assets/shop/donut.png",
    aplicar: () => {
      felicidade = Math.min(100, felicidade + 20);
    }
  },

  {
    nome: "Varinha",
    sprite: "assets/shop/varinha.png",
    aplicar: () => {
      felicidade = Math.min(100, felicidade + 40);
    }
  },

  {
    nome: "Almofada",
    sprite: "assets/shop/almofada.png",
    aplicar: () => {
      energia = Math.min(100, energia + 20);
    }
  },

  {
    nome: "10 sementes",
    sprite: "assets/shop/pacote-sementes.png",
    aplicar: () => {
      sementes += 10;
    }
  }
];

// Cinza o botão de adotar se já tem gatinha
if (gatinhaDesbloqueada) {
  btnGatinha.dataset.adotado = "true";
  btnGatinha.textContent = "Já adotado";
  btnGatinha.classList.add("btn-adotado");
  btnGatinha.style.opacity = "0.5";
  btnGatinha.style.cursor = "not-allowed";
}

// PETS VISITANTES 
let steveDesbloqueado = localStorage.getItem("steveDesbloqueado") === "true";
let joaoDesbloqueado  = localStorage.getItem("joaoDesbloqueado")  === "true";
let jamesDesbloqueado = localStorage.getItem("jamesDesbloqueado") === "true";

const btnSteve = document.getElementById("btnSteve");
const btnJoao  = document.getElementById("btnJoao");
const btnJames = document.getElementById("btnJames");

function cinzarPetBtn(btn, nome) {
  if (!btn) return;
  btn.textContent = `${nome} já visita!`;
  btn.classList.add("btn-adotado");
  btn.style.opacity = "0.5";
  btn.style.cursor  = "not-allowed";
}

if (steveDesbloqueado) cinzarPetBtn(btnSteve, "Steve");
if (joaoDesbloqueado)  cinzarPetBtn(btnJoao,  "João");
if (jamesDesbloqueado) cinzarPetBtn(btnJames, "James");

function comprarPet(btn, chave, nome, callback) {
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (localStorage.getItem(chave) === "true") {
      mostrarAlertaLoja(`${nome} já visita vocês!`);
      return;
    }
    if (moedas < 50000) {
      mostrarAlertaLoja("Moedas insuficientes");
      return;
    }
    moedas -= 50000;
    localStorage.setItem(chave, "true");
    cinzarPetBtn(btn, nome);
    callback();
    mostrarMensagem(`${nome} vai aparecer de visita!`);
    atualizarStatus();
  });
}

comprarPet(btnSteve, "steveDesbloqueado", "Steve", () => { steveDesbloqueado = true; iniciarVisitasSteve(); });
comprarPet(btnJoao,  "joaoDesbloqueado",  "João",  () => { joaoDesbloqueado  = true; iniciarVisitasJoao();  });
comprarPet(btnJames, "jamesDesbloqueado", "James", () => { jamesDesbloqueado = true; iniciarVisitasJames(); });

// VISITAS ESPECIAIS
let annaDesbloqueada = localStorage.getItem("annaDesbloqueada") === "true";
let kikaDesbloqueada = localStorage.getItem("kikaDesbloqueada") === "true";

const btnAnna = document.getElementById("btnAnna");
const btnKika = document.getElementById("btnKika");

if (annaDesbloqueada) cinzarPetBtn(btnAnna, "Anna");
if (kikaDesbloqueada) cinzarPetBtn(btnKika, "Kika");

// Bloqueia botão do pedido se já aceito
if (pedidoAceito) {
  const btnPedido = document.getElementById("btnPedidoEspecial");
  if (btnPedido) {
    btnPedido.textContent = "Já namoram!";
    btnPedido.classList.add("btn-adotado");
    btnPedido.style.opacity = "0.5";
    btnPedido.style.cursor = "not-allowed";
  }
}

function comprarVisitaEspecial(btn, chave, nome, callback) {
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (localStorage.getItem(chave) === "true") {
      mostrarAlertaLoja(`${nome} já visita vocês!`);
      return;
    }
    if (moedas < 100000) {
      mostrarAlertaLoja("Moedas insuficientes");
      return;
    }
    moedas -= 100000;
    localStorage.setItem(chave, "true");
    cinzarPetBtn(btn, nome);
    callback();
    mostrarMensagem(`${nome} vai aparecer de visita!`);
    atualizarStatus();
  });
}

comprarVisitaEspecial(btnAnna, "annaDesbloqueada", "Anna", () => { annaDesbloqueada = true; iniciarVisitasAnna(); });
comprarVisitaEspecial(btnKika, "kikaDesbloqueada", "Kika", () => { kikaDesbloqueada = true; iniciarVisitasKika(); });

// Atualiza botões da loja após carregar save
if (steveDesbloqueado) cinzarPetBtn(btnSteve, "Steve");
if (joaoDesbloqueado)  cinzarPetBtn(btnJoao,  "João");
if (jamesDesbloqueado) cinzarPetBtn(btnJames, "James");
if (annaDesbloqueada)  cinzarPetBtn(btnAnna,  "Anna");
if (kikaDesbloqueada)  cinzarPetBtn(btnKika,  "Kika");
if (pedidoAceito) {
  const btnPedido = document.getElementById("btnPedidoEspecial");
  if (btnPedido) {
    btnPedido.textContent = "Já namoram!";
    btnPedido.classList.add("btn-adotado");
    btnPedido.style.opacity = "0.5";
    btnPedido.style.cursor = "not-allowed";
  }
}

// Bloqueia esconde-esconde se filhotinho não nasceu
function atualizarBtnEsconde() {
  const btnEsconde = document.getElementById("btnEsconde");
  if (!btnEsconde) return;
  if (!filhoteDesbloqueado) {
    btnEsconde.textContent = "Bloqueado";
    btnEsconde.disabled = true;
    btnEsconde.style.opacity = "0.5";
    btnEsconde.style.cursor = "not-allowed";
  } else {
    btnEsconde.textContent = "Jogar";
    btnEsconde.disabled = false;
    btnEsconde.style.opacity = "1";
    btnEsconde.style.cursor = "pointer";
  }
}

function atualizarConfigGatinha() {
  if (!gatinhaDesbloqueada) {
    inputNomeGatinha.disabled = true;
    btnSalvarNomeGatinha.disabled = true;
    inputNomeGatinha.placeholder = "Adote a gatinha primeiro";
  } else {
    inputNomeGatinha.disabled = false;
    btnSalvarNomeGatinha.disabled = false;
    inputNomeGatinha.value = nomeGatinha || "";
    inputNomeGatinha.placeholder = nomeGatinha ? nomeGatinha : "Dê um nome pra ela";
  }
}

// Função que acinzenta os botões especiais depois de comprados
function atualizarBtnsLoja() {
  if (gatinhaDesbloqueada) {
    const btnGatinha = document.getElementById("btnGatinha");
    if (btnGatinha) {
      btnGatinha.textContent = "Já é da família!";
      btnGatinha.classList.add("btn-adotado");
      btnGatinha.style.opacity = "0.5";
      btnGatinha.style.cursor = "not-allowed";
    }
  }
  if (steveDesbloqueado) cinzarPetBtn(btnSteve, "Steve");
  if (joaoDesbloqueado)  cinzarPetBtn(btnJoao,  "João");
  if (jamesDesbloqueado) cinzarPetBtn(btnJames, "James");
  if (annaDesbloqueada)  cinzarPetBtn(btnAnna,  "Anna");
  if (kikaDesbloqueada)  cinzarPetBtn(btnKika,  "Kika");
  if (pedidoAceito) {
    const btnPedido = document.getElementById("btnPedidoEspecial");
    if (btnPedido) {
      btnPedido.textContent = "Já namoram!";
      btnPedido.classList.add("btn-adotado");
      btnPedido.style.opacity = "0.5";
      btnPedido.style.cursor = "not-allowed";
    }
  }
}

btnGatinha.addEventListener("click", () => {

  if (gatinhaDesbloqueada) {
    mostrarAlertaLoja(`${nomeGatinha || "sua gatinha"} já mora com vocês`);
    return;
  }
  if (gatinhaBloqueadaAte && Date.now() < gatinhaBloqueadaAte) {
    const horasRestantes = Math.ceil((gatinhaBloqueadaAte - Date.now()) / 3600000);
    mostrarAlertaLoja(`A gatinha ainda precisa de espaço. Volte em ${horasRestantes}h.`);
    return;
  }

  if (
  btnGatinha.dataset.adotado
  === "true"
  ) {

      mostrarAlertaLoja(
      "Você já tem uma companhia"
      );

      return;

  }

  if (moedas < 25000) {

    mostrarAlertaLoja("Moedas insuficientes");

    return;
  }

  const nomeEscolhido = prompt(
    "Qual será o nome da gatinha?"
  );

  if (!nomeEscolhido ||
      nomeEscolhido.trim() === "") {

    mostrarMensagem(
      "A adoção foi cancelada"
    );

    return;
  }

  moedas -= 25000;

  gatinhaDesbloqueada = true;
  desbloquearConquista("nova_companheira");
  registrarInteracaoGatinha();
  iniciarFalasVinculo();

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
    `${nomeGatinha} foi adotada!`
  );

  btnGatinha.dataset.adotado = "true";
  btnGatinha.textContent = "Já adotado";
  btnGatinha.classList.add("btn-adotado");
  btnGatinha.style.opacity = "0.5";
  btnGatinha.style.cursor = "not-allowed";

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

  // Remove lembretes únicos que já passaram da hora
  const antes = lembretes.length;
  lembretes = lembretes.filter(l => {
    if (
      (!l.recorrencia || l.recorrencia === "nenhuma") &&
      l.timestamp &&
      l.timestamp < agora &&
      !l.feito
    ) {
      cancelarNotificacaoSW(l.id);
      return false; // remove
    }
    return true;
  });
  if (lembretes.length !== antes) mudou = true;

  // Recorrentes que passaram — reagenda
  lembretes.forEach((l, i) => {
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
        Nenhum lembrete ainda<br>
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
          mostrarMensagem(`Lembrete ${labels[rec]} reagendado.`);
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
  const dataAniversario = document.getElementById("dataAniversario");
  const horaRow = horaLembrete.parentElement;

  if (tipo === "🎂") {
    dataLembrete.style.display    = "none";
    dataAniversario.style.display = "block";
    horaLembrete.style.display    = "block"; // hora opcional pro aniversário
    rowRecorrencia.style.display  = "block";
    recorrenciaLembrete.value     = "anual";
  } else if (tipo === "⏰") {
    dataLembrete.style.display    = "block";
    dataAniversario.style.display = "none";
    horaLembrete.style.display    = "block";
    rowRecorrencia.style.display  = "block";
    recorrenciaLembrete.value     = "nenhuma";
  } else {
    dataLembrete.style.display    = "block";
    dataAniversario.style.display = "none";
    horaLembrete.style.display    = "block";
    rowRecorrencia.style.display  = "none";
    recorrenciaLembrete.value     = "nenhuma";
  }
});

btnSalvarLembrete.addEventListener("click", async () => {
  const texto = inputLembrete.value.trim();
  if (!texto) return;

  const tipo            = tipoLembrete.value;
  const dataAniversario = document.getElementById("dataAniversario");
  const data            = tipo === "🎂" ? dataAniversario.value : dataLembrete.value;
  const hora            = horaLembrete.value;
  const recorrencia     = recorrenciaLembrete ? recorrenciaLembrete.value : "nenhuma";

  let conteudo = `${tipo} ${texto}`;
  if (tipo === "🎂" && data) conteudo += ` — ${data}`;
  if (tipo === "🎂" && hora) conteudo += ` às ${hora}`;
  if (tipo === "⏰" && data) conteudo += ` — ${data}`;
  if (tipo === "⏰" && hora) conteudo += ` às ${hora}`;

  // Monta timestamp
  let timestamp = null;
  if (tipo === "🎂" && data) {

    const [dia, mes] = data.split("/");

    if (dia && mes) {

      const agora = new Date();
      const horaAniv = hora || "08:00";
      let ano = agora.getFullYear();

      let aniv = new Date(
        `${ano}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}T${horaAniv}:00`
      );

      if (aniv <= agora) {
        aniv.setFullYear(ano + 1);
      }

      timestamp = aniv.getTime();
    }

  }

  // ALERTAS E TAREFAS
  else if (hora) {

    const hoje =
    new Date().toISOString().slice(0, 10);

    timestamp =
    new Date(`${hoje}T${hora}:00`).getTime();

    // se já passou do horário hoje,
    // joga pra amanhã
    if (timestamp <= Date.now()) {
      timestamp += 86400000;
    }

  }

  const id = Date.now();
  const novoLembrete = { id, tipo, recorrencia, texto: conteudo, data, hora, feito: false, timestamp };
  console.log("TIPO:", tipo);
  console.log("DATA:", data);
  console.log("HORA:", hora);
  console.log("TIMESTAMP:", timestamp);

  lembretes.push(novoLembrete);
  localStorage.setItem("lembretes", JSON.stringify(lembretes));
  renderizarLembretes();

  // Agenda notificação
  if (timestamp && timestamp > Date.now()) {
    const permitido = await pedirPermissaoNotificacao();
    if (permitido) {
      try {
        const sw = await navigator.serviceWorker.ready;
        // Espera o SW ficar ativo (importante no mobile)
        const active = sw.active || await new Promise(resolve => {
          const check = setInterval(() => {
            if (sw.active) { clearInterval(check); resolve(sw.active); }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(null); }, 3000);
        });
        if (active) {
          active.postMessage({ tipo: "AGENDAR_LEMBRETE", id, texto: conteudo, timestamp });
          mostrarMensagem("Lembrete agendado.");
        }
      } catch(e) {
        console.warn("Erro ao agendar notificação:", e);
      }
    } else {
      mostrarMensagem("Permita notificações para ser lembrado.");
    }
  }

  inputLembrete.value          = "";
  dataLembrete.value           = "";
  horaLembrete.value           = "";
  horaLembrete.style.display   = "block";
  recorrenciaLembrete.value    = "nenhuma";
  rowRecorrencia.style.display = "none";
  tipoLembrete.value           = "📚";
  dataAniversario.value        = "";
  dataAniversario.style.display = "none";
  dataLembrete.style.display   = "block";

});

// INIT 
atualizarStatus();
renderizarLembretes();
iniciarMomentosGatinha();
if (gatinhaDesbloqueada) iniciarFalasVinculo();

// Reagenda notificações pendentes após reload
(async () => {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const sw = await navigator.serviceWorker.ready;
    const active = sw.active || await new Promise(resolve => {
      const check = setInterval(() => {
        if (sw.active) { clearInterval(check); resolve(sw.active); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(null); }, 3000);
    });
    if (!active) return;
    const agora = Date.now();
    lembretes.forEach(l => {
      if (l.timestamp && l.timestamp > agora && !l.feito) {
        active.postMessage({
          tipo:      "AGENDAR_LEMBRETE",
          id:        l.id,
          texto:     l.texto,
          timestamp: l.timestamp,
        });
      }
    });
  } catch(e) {
    console.warn("Erro ao reagendar lembretes:", e);
  }
})();

// CONTINUAR SONO APÓS RELOAD

if (dormindo) {

    iniciarSono();

}

// LISTENERS DE NAVEGAÇÃO
// Petisco
btnPetisco.addEventListener("click", () => {
  if (dormindo || momentoConjuntoAtivo) {
    mostrarFalaHanna("Zzz... 💤");
    return;
  }

  felicidade  = Math.min(100, felicidade + 15);
  fome        = Math.min(100, fome + 5);

  if (Math.random() < 0.35) {
    sementes += 1;
    mostrarMensagem("A Hanna adorou o petisco!");
  } else {
    mostrarMensagem("A Hanna ficou satisfeita.");
  }

  mostrarFeedbackBarra("barraFelicidade", 15);
  mostrarFeedbackBarra("barraFome", 5);

  // Seta sprite de petisco e restaura após 2.5s
  hannaSprite.src = "assets/sprites/hanna/petisco.png";
  trocarAnimacao("felizBounce 2.5s ease-in-out infinite");

  if (gatinhaDesbloqueada) registrarInteracaoGatinha();
  if (gatinhaDesbloqueada) gatinhaSpriteTemp("gatinha-animada", 2500);

  setTimeout(() => atualizarStatus(), 2500);
  _salvar();
  // Filhotinho reage ao petisco
  if (filhoteDesbloqueado) {
    const sprites = spritesFilhote[versaoFilhote] || spritesFilhote.misto;
    const spriteBase = versaoFilhote === "hanna" ? "assets/sprites/filhote/filhote-hanna.png"
      : versaoFilhote === "gatinha" ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png";
    if (filhoteSprite) filhoteSprite.src = sprites.find(s => s.includes("comendo")) || sprites[0];
    setTimeout(() => { if (filhoteSprite) filhoteSprite.src = spriteBase; }, 2500);
  }
});

// COÇAR BARRIGA
btnCocarBarriga.addEventListener("click", () => {
  if (dormindo || momentoConjuntoAtivo) {
    mostrarFalaHanna("Zzz...");
    return;
  }

  felicidade = Math.min(100, felicidade + 20);
  energia    = Math.min(100, energia + 10);

  mostrarMensagem("A Hanna ronronou de felicidade!");
  mostrarFalaHanna("Purrr...");
  mostrarFeedbackBarra("barraFelicidade", 20);
  mostrarFeedbackBarra("barraEnergia", 10);

  // Seta sprite e restaura após 2.5s
  hannaSprite.src = "assets/sprites/hanna/carinho-barriga.png";
  trocarAnimacao("apaixonadaFloat 5s ease-in-out infinite");

  if (gatinhaDesbloqueada) registrarInteracaoGatinha();
  if (gatinhaDesbloqueada) gatinhaSpriteTemp("gatinha-animada", 2500);

  desbloquearConquista("cocar_barriga");

  setTimeout(() => atualizarStatus(), 2500);
  _salvar();
  // Filhotinho reage ao carinho
  if (filhoteDesbloqueado) {
    const sprites = spritesFilhote[versaoFilhote] || spritesFilhote.misto;
    const spriteBase = versaoFilhote === "hanna" ? "assets/sprites/filhote/filhote-hanna.png"
      : versaoFilhote === "gatinha" ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png";
    if (filhoteSprite) filhoteSprite.src = sprites.find(s => s.includes("curioso")) || sprites[0];
    setTimeout(() => { if (filhoteSprite) filhoteSprite.src = spriteBase; }, 2500);
  }
});

let telaAnteriorConfig = "casa";

// BOTÃO MUTE
const btnMute    = document.getElementById("btnMute");
const iconeMute  = document.getElementById("iconeMute");
const textMute   = document.getElementById("textMute");

function aplicarMute() {

  // Só muta as trilhas
  Object.values(trilhas).forEach(audio => {
    if (!audio) return;
    audio.muted = isMuted;
  });

  // Efeitos gerais (botão, compra, banho, etc) — também mutados
  const efeitos = [
    somBotao, somCompra, somBanho,
    somCarinho, somComida, somDormir, somAcordar,
    document.getElementById("somMoeda"),
    document.getElementById("somChuva"),
  ];
  efeitos.forEach(audio => {
    if (!audio) return;
    audio.muted = isMuted;
  });

  // Reações dos pets — NUNCA mutadas
  // somPurr, somMeow1, somMeow2, somMeow3, somMeowAdocao
  // ficam fora propositalmente

  if (iconeMute) {
    iconeMute.textContent = isMuted ? "🔇" : "🔊";
  }

  if (textMute) {
    textMute.textContent = isMuted ? "Mudo" : "Som";
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

btnComoJogar.addEventListener("click", () => {

  abrirTela(telaComoJogar);

  window.scrollTo(0, 0);

});

btnVoltarComoJogar.addEventListener("click", () => {

  abrirTela(telaConfig);

  window.scrollTo(0, 0);

});

navTrofeus.onclick = () => {
  abrirTela(telaTrofeus);
  renderizarTrofeus();
  tocarTrilha("casa");
  window.scrollTo(0, 0);
};

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

// SAVE NA NUVEM — exibir e recuperar ID
const textoIdSave = document.getElementById("textoIdSave");
const inputIdSave = document.getElementById("inputIdSave");
const btnRecuperarSave = document.getElementById("btnRecuperarSave");

// Mostra o ID atual assim que a tela de config abre
const idAtual = localStorage.getItem("hannaDeviceId") || "não encontrado";
if (textoIdSave) textoIdSave.textContent = idAtual;

// SISTEMA DE CONTA
const contaComConta     = document.getElementById("contaComConta");
const contaTrocarSenha  = document.getElementById("contaTrocarSenha");
const textoNickname     = document.getElementById("textoNickname");
const textoFeedback     = document.getElementById("textoFeedbackConta");

function mostrarFeedbackConta(msg, erro = false) {
  textoFeedback.textContent = msg;
  textoFeedback.style.color = erro ? "#ff5555" : "var(--pink-deep)";
  textoFeedback.style.display = "block";
  setTimeout(() => textoFeedback.style.display = "none", 3000);
}

function atualizarEstadoConta() {
  const uid = localStorage.getItem("hannaUid");
  const email = localStorage.getItem("hannaEmail");
  if (contaComConta) contaComConta.style.display = uid ? "block" : "none";
  if (contaTrocarSenha) contaTrocarSenha.style.display = "none";
  if (textoNickname && email) textoNickname.textContent = email;
}

// Atualiza estado ao carregar
atualizarEstadoConta();

// CRIAR CONTA
document.getElementById("btnCriarConta")?.addEventListener("click", async () => {
  const nickname = document.getElementById("inputNickname").value.trim();
  const senha    = document.getElementById("inputSenha").value.trim();

  if (!nickname || !senha) {
    mostrarFeedbackConta("Preencha nickname e senha.", true);
    return;
  }
  if (senha.length < 4) {
    mostrarFeedbackConta("Senha precisa ter pelo menos 4 caracteres.", true);
    return;
  }

  mostrarFeedbackConta("Criando conta...");

  const { criarConta, salvarProgressoNuvem, hashSenha } = await import("./firebase.js");
  const resultado = await criarConta(nickname, senha);

  if (!resultado.ok) {
    mostrarFeedbackConta(resultado.erro, true);
    return;
  }

  // Salva o progresso atual na nuvem com a senha
  const senhaHash = await hashSenha(senha);
  _senhaHash = senhaHash;
  localStorage.setItem("hannaSenhaHash", senhaHash);
  await salvarProgressoNuvem({
    senha: senhaHash,
    fome, felicidade, energia, higiene, sementes, moedas,
    amizade, vinculoGatinhas, dormindo,
    gatinhaDesbloqueada, nomeGatinha,
    sementesDouradas, ultimaSementeDourada,
    steveDesbloqueado, joaoDesbloqueado, jamesDesbloqueado,
    ultimaInteracaoGatinha,
    fazenda: JSON.stringify(fazenda),
    conquistas: JSON.stringify(conquistasDesbloqueadas),
    lembretes: JSON.stringify(lembretes),
  });

  mostrarFeedbackConta("Conta criada com sucesso!");
  atualizarEstadoConta();
});

// TROCAR SENHA
document.getElementById("btnTrocarSenha")?.addEventListener("click", () => {
  contaTrocarSenha.style.display =
    contaTrocarSenha.style.display === "none" ? "block" : "none";
});

document.getElementById("btnConfirmarTrocarSenha")?.addEventListener("click", async () => {
  const id         = localStorage.getItem("hannaDeviceId");
  const senhaAtual = document.getElementById("inputSenhaAtual").value.trim();
  const senhaNova  = document.getElementById("inputSenhaNova").value.trim();

  if (!senhaAtual || !senhaNova) {
    mostrarFeedbackConta("Preencha os dois campos.", true);
    return;
  }
  if (senhaNova.length < 4) {
    mostrarFeedbackConta("Senha nova precisa ter pelo menos 4 caracteres.", true);
    return;
  }

  mostrarFeedbackConta("Alterando senha...");

  const { trocarSenha } = await import("./firebase.js");
  const resultado = await trocarSenha(id, senhaAtual, senhaNova);

  if (!resultado.ok) {
    mostrarFeedbackConta(resultado.erro, true);
    return;
  }

  mostrarFeedbackConta("Senha alterada com sucesso!");
  contaTrocarSenha.style.display = "none";
});

// SAIR DA CONTA
document.getElementById("btnSairConta")?.addEventListener("click", () => {
  localStorage.removeItem("hannaDeviceId");
  localStorage.removeItem("hannaSenhaTexto");
  localStorage.removeItem("hannaSenhaHash");
  localStorage.removeItem("updatedAt");
  mostrarFeedbackConta("Saiu da conta.");
  setTimeout(() => location.reload(), 1000);
});

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
    else if (jogo === "domino")     jogoDomino();
    else if (jogo === "humor")     jogoHumor();
    else if (jogo === "reflexo")   jogoReflexo();
    else if (jogo === "cartinhas") jogoCartinhas();
    else if (jogo === "sardinha")  jogoSardinha();
    else if (jogo === "match3")    jogoMatch3();
    else if (jogo === "palavras")  jogoPalavras();
    else if (jogo === "bolinha")   jogoBolinha();
    else if (jogo === "cacapalavras") jogoCacaPalavras();
    else if (jogo === "steve")        jogoSteve();
    else if (jogo === "james")        jogoJames();
    else if (jogo === "joao")         jogoJoao();
    else if (jogo === "quebracabeca") jogoQuebracabeca();
    else if (jogo === "recados")      jogoRecados();
    else if (jogo === "recados")      jogoRecados();
    else if (jogo === "esconde")      jogoEscondeEsconde();
  });
});


//   JOGO DA MEMÓRIA DAS CARTINHAS

function jogoCartinhas() {
  abrirArena("Cartinhas da Hanna");

  const SPRITES = [
    { id: "animada",           src: "assets/sprites/hanna/animada.png",             nome: "Animada"           },
    { id: "apaixonada",        src: "assets/sprites/hanna/apaixonada.png",          nome: "Apaixonada"        },
    { id: "aprontona",         src: "assets/sprites/hanna/aprontona.png",           nome: "Aprontona"         },
    { id: "assustada",         src: "assets/sprites/hanna/assustada.png",           nome: "Assustada"         },
    { id: "banho",             src: "assets/sprites/hanna/banho.png",               nome: "Banho"             },
    { id: "banho-tomado",      src: "assets/sprites/hanna/banho-tomado.png",        nome: "Banho Tomado"      },
    { id: "brava",             src: "assets/sprites/hanna/brava.png",               nome: "Brava"             },
    { id: "brincando",         src: "assets/sprites/hanna/brincando.png",           nome: "Brincando"         },
    { id: "brincando-novelo",  src: "assets/sprites/hanna/brincando-novelo.png",    nome: "Brincando de Novelo" },
    { id: "carinho",           src: "assets/sprites/hanna/carinho.png",             nome: "Carinho"           },
    { id: "carinho-barriga",   src: "assets/sprites/hanna/carinho-barriga.png",     nome: "Carinho na Barriga"},
    { id: "chorando-felicidade", src: "assets/sprites/hanna/chorando-felicidade.png", nome: "Chorando de Felicidade" },
    { id: "comendo",           src: "assets/sprites/hanna/comendo.png",             nome: "Comendo"           },
    { id: "contente",          src: "assets/sprites/hanna/contente.png",            nome: "Contente"          },
    { id: "curiosa",           src: "assets/sprites/hanna/curiosa.png",             nome: "Curiosa"           },
    { id: "doidinha",          src: "assets/sprites/hanna/doidinha.png",            nome: "Doidinha"          },
    { id: "dormindo",          src: "assets/sprites/hanna/dormindo.png",            nome: "Dormindo"          },
    { id: "feliz",             src: "assets/sprites/hanna/feliz.png",               nome: "Feliz"             },
    { id: "hanna",             src: "assets/sprites/hanna/hanna.png",               nome: "Hanna"             },
    { id: "medo",              src: "assets/sprites/hanna/medo.png",                nome: "Com Medo"          },
    { id: "metida",            src: "assets/sprites/hanna/metida.png",              nome: "Metida"            },
    { id: "neutra",            src: "assets/sprites/hanna/neutra.png",              nome: "Neutra"            },
    { id: "sonolenta",         src: "assets/sprites/hanna/sonolenta.png",           nome: "Sonolenta"         },
    { id: "triste",            src: "assets/sprites/hanna/triste.png",              nome: "Triste"            },
    { id: "vergonha",          src: "assets/sprites/hanna/vergonha.png",            nome: "Vergonha"          },
  ];

  arenaConteudo.innerHTML = `
    <div class="cartinha-dif-wrap">
      <div class="cartinha-hanna-topo">
        <img src="assets/sprites/hanna/animada.png" id="cartinhaDifHanna">
        <div class="cartinha-fala">Escolha a dificuldade!</div>
      </div>
      <div class="cartinha-dif-lista">

        <button class="cartinha-dif-btn" data-dif="facil">
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Facil</div>
            <div class="cartinha-dif-desc">6 pares · 12 cartas</div>
            <div class="cartinha-dif-recomp">ate 15 moedas</div>
          </div>
        </button>

        <button class="cartinha-dif-btn" data-dif="medio">
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Medio</div>
            <div class="cartinha-dif-desc">10 pares · 20 cartas</div>
            <div class="cartinha-dif-recomp">ate 30 moedas</div>
          </div>
        </button>

        <button class="cartinha-dif-btn" data-dif="dificil">
          <div class="cartinha-dif-info">
            <div class="cartinha-dif-titulo">Dificil</div>
            <div class="cartinha-dif-desc">14 pares · 28 cartas</div>
            <div class="cartinha-dif-recomp">ate 50 moedas</div>
          </div>
        </button>

      </div>
    </div>`;

  document.querySelectorAll(".cartinha-dif-btn").forEach(btn => {
    btn.addEventListener("click", () => iniciarCartinhas(btn.dataset.dif));
  });

  function iniciarCartinhas(dificuldade) {
    pararJogoAtivo();

    const config = {
      facil:   { pares: 6,  colunas: 4, moedaBase: 60,  tempoBase: 90  },
      medio:   { pares: 10, colunas: 4, moedaBase: 140, tempoBase: 150 },
      dificil: { pares: 14, colunas: 4, moedaBase: 260, tempoBase: 210 },
    }[dificuldade];

    const spritesEscolhidos = [...SPRITES]
      .sort(() => Math.random() - .5)
      .slice(0, config.pares);

    const cartas = [...spritesEscolhidos, ...spritesEscolhidos]
      .sort(() => Math.random() - .5)
      .map((s, i) => ({ ...s, uid: i, virada: false, encontrada: false }));

    let tempo        = config.tempoBase;
    let viradas      = [];
    let bloqueado    = false;
    let paresAcertos = 0;
    let erros        = 0;
    let movimentos   = 0;

    arenaConteudo.innerHTML = `
      <div class="cartinha-hud">
        <div class="cartinha-hud-item">Tempo: <span id="ctTimer">${tempo}</span>s</div>
        <div class="cartinha-hud-item">Pares: <span id="ctPares">0</span>/${config.pares}</div>
        <div class="cartinha-hud-item">Mov: <span id="ctMovs">0</span></div>
      </div>
      <div class="cartinha-grid" id="ctGrid"
        style="grid-template-columns: repeat(${config.colunas}, 1fr);">
      </div>`;

    const grid    = document.getElementById("ctGrid");
    const timerEl = document.getElementById("ctTimer");
    const paresEl = document.getElementById("ctPares");
    const movsEl  = document.getElementById("ctMovs");

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
          paresAcertos++;
          paresEl.textContent = paresAcertos;
          a.el.classList.add("encontrada");
          b.el.classList.add("encontrada");
          a.carta.encontrada = b.carta.encontrada = true;
          viradas = [];
          bloqueado = false;
          if (paresAcertos === config.pares) terminar(true);
        } else {
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

    const countdown = setInterval(() => {
      tempo--;
      timerEl.textContent = tempo;
      if (tempo <= 10) timerEl.style.color = "#ff5555";
      if (tempo <= 0) { clearInterval(countdown); terminar(false); }
    }, 1000);
    jogoAtivo.intervals.push(countdown);

    function terminar(venceu) {
      pararJogoAtivo();

      let moedas_ganhas = 0;
      if (venceu) {
        const bonusTempo = Math.floor(tempo / config.tempoBase * config.moedaBase * 0.4);
        const bonusErros = Math.max(0, config.moedaBase * 0.6 - erros * 2);
        moedas_ganhas = Math.min(config.moedaBase, Math.max(5, Math.round(bonusTempo + bonusErros)));
      } else {
        moedas_ganhas = Math.floor(paresAcertos / config.pares * config.moedaBase * 0.4);
      }

      ganharMoedas(moedas_ganhas);
      desbloquearConquista("colecionadora");

      const titulo = venceu
        ? (erros <= 3 ? "Perfeito! Memoria incrivel!" : "Voce completou!")
        : "Tempo esgotado!";

      const desc = venceu
        ? `${movimentos} movimentos · ${erros} erros · ${tempo}s restantes`
        : `Voce encontrou ${paresAcertos} de ${config.pares} pares.`;

      jogoAtivo.timers.push(setTimeout(() => {
        mostrarResultado(titulo, "", moedas_ganhas, desc, jogoCartinhas);
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

  if (dormindo || momentoConjuntoAtivo) {
    mostrarFalaHanna("Zzz... 💤");
    return;
  }

    somBanho.currentTime = 0;

    somBanho.volume =
    parseFloat(
        volumeEfeitos.value
    );

    somBanho.play().catch(()=>{});

    mostrarMensagem("A Hanna está tomando banho.");
    desbloquearConquista("hora_do_banho");
    if (gatinhaDesbloqueada) registrarInteracaoGatinha();

    criarParticulas("🫧", 18);

    // Abre a tela do banho
    telaBanho.style.display = "flex";

    // Mostra hannaBanho (sprite grande) e esconde hannaSprite pequeno
    const hannaBanho = document.getElementById("hannaBanho");
    if (hannaBanho) hannaBanho.style.display = "block";
    hannaSprite.style.display = "none";

    gatinhaSpriteTemp("gatinha-assustada", 9000);

    higiene = Math.min(100, higiene + 100);
    felicidade = Math.min(100, felicidade + 5);

    mostrarFeedbackBarra("barraHigiene", 100);
    mostrarFeedbackBarra("barraFelicidade", 5);

    setTimeout(() => {
        telaBanho.style.display = "none";
        somBanho.pause();
        hannaSprite.style.display = "block";
        if (hannaBanho) hannaBanho.style.display = "none";
        atualizarStatus();
    }, 9000);

});



// ABRIR FAZENDA

//if (btnAbrirFazenda) {
    //btnAbrirFazenda.onclick = () => {

        //abrirTela(telaFazenda);

        //animarTela(telaFazenda);

        //tocarTrilha("fazenda");

        //balaoFazenda.classList.remove("fade-out-balao");

        //void balaoFazenda.offsetWidth;

        //setTimeout(() => {
            //balaoFazenda.classList.add("fade-out-balao");
        //}, //4000);

    //};
//}


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

}

atualizarPeriodoDoDia();

// CONFIG ÁUDIO

// CARREGAR VOLUMES

// PAUSAR AO MINIMIZAR / RETOMAR AO VOLTAR
function pausarTodasTrilhas() {
    Object.values(trilhas).forEach(audio => {
        if (!audio) return;
        audio.pause();
    });
}

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {

        if (!resetandoProgresso) {
            _salvar();
            localStorage.setItem("ultimoAcesso", Date.now());
        }

        pausarTodasTrilhas();

    } else {

        // Usa ready em vez de controller pra garantir que o SW tá ativo
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(sw => {
                sw.active.postMessage({ tipo: "CHECK_LEMBRETES" });
            }).catch(() => {});
        }

        if (!isMuted && trilhaAtual && trilhas[trilhaAtual]) {
            trilhas[trilhaAtual].play().catch(() => {});
        }
    }

});

window.addEventListener("pagehide", () => {

    pausarTodasTrilhas();

    if (!resetandoProgresso) {
        _salvar();
        localStorage.setItem("ultimoAcesso", Date.now());
    }

});

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

// Jogo: Operação Sardinha
function jogoSardinha() {
  abrirArena("Operação Sardinha");
  const arena = document.getElementById("arenaConteudo");

  arena.innerHTML = `
    <div class="sardinha-escolha">
      <div class="sardinha-titulo-op">ESCOLHA SUA AGENTE</div>
      <div class="sardinha-subtitle">quem vai defender as sardinhas?</div>
      <div class="sardinha-agentes">
        <div class="sardinha-agente" data-agente="hanna">
          <img src="assets/sprites/hanna-gatinha/hanna-cod.png" class="sardinha-agente-img">
          <div class="sardinha-agente-nome">Hanna</div>
          <div class="sardinha-agente-desc">Protagonista<br>Tiro rápido</div>
        </div>
        <div class="sardinha-agente ${gatinhaDesbloqueada ? '' : 'sardinha-agente-locked'}" data-agente="gatinha">
          <img src="assets/sprites/hanna-gatinha/gatinha-cod.png" class="sardinha-agente-img">
          <div class="sardinha-agente-nome">Gatinha ${gatinhaDesbloqueada ? '' : '(bloqueada)'}</div>
          <div class="sardinha-agente-desc">${gatinhaDesbloqueada ? 'Parceira<br>Dano duplo' : 'Desbloqueie na loja!'}</div>
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
    hanna:   { img: "assets/sprites/hanna/animada.png",            dano: 1, cadencia: 700 },
    gatinha: { img: "assets/sprites/gatinha/gatinha-animada.png",  dano: 2, cadencia: 900 },
  };
  const cfg = AGENTES[agente];

  let vidas         = 3;
  let onda          = 1;
  let ratosOnda     = 5;
  let ratosVivos    = 0;
  let score         = 0;
  let gameOver      = false;

  arena.innerHTML = `
    <div class="sardinha-hud">
      <div class="sardinha-hud-esq">
        <span id="srd-onda">Onda 1</span>
        <span id="srd-ratos"><img src="assets/shop/ratinho.png" style="width:16px;vertical-align:middle;"> 5</span>
      </div>
      <div class="sardinha-hud-dir">
        <span id="srd-vidas"></span>
      </div>
    </div>

    <div class="sardinha-campo" id="srdCampo">
      <div class="sardinha-alvo" id="srdAlvo">
        <img src="assets/shop/peixe.png" style="width:32px;">
        <div class="sardinha-alvo-label">Despensa</div>
      </div>

      <div class="sardinha-player" id="srdPlayer">
        <img src="${cfg.img}" class="sardinha-player-img" id="srdPlayerImg">
      </div>
    </div>

    <div class="sardinha-instrucao" id="srdInstrucao">
      Toque nos ratos para atirar!
    </div>`;

  const campo    = document.getElementById("srdCampo");
  const hudOnda  = document.getElementById("srd-onda");
  const hudRatos = document.getElementById("srd-ratos");
  const hudVidas = document.getElementById("srd-vidas");
  const instrucao = document.getElementById("srdInstrucao");

  function atualizarHUD() {
    hudOnda.innerHTML  = `Onda ${onda}`;
    hudRatos.innerHTML = `<img src="assets/shop/ratinho.png" style="width:16px;vertical-align:middle;image-rendering:pixelated;"> ${ratosVivos}`;
    
    let coracoes = "";
    for (let i = 0; i < 3; i++) {
      coracoes += `<img src="${i < vidas ? "assets/ui/coracao-5.png" : "assets/ui/coracao-1.png"}" style="width:18px;image-rendering:pixelated;">`;
    }
    hudVidas.innerHTML = coracoes;
    document.getElementById("arenaScore").textContent = score;
  }

  function spawnRato() {
    if (gameOver) return;
    ratosVivos++;
    atualizarHUD();

    const rato = document.createElement("div");
    rato.className = "sardinha-rato";
    rato.innerHTML = `<img src="assets/shop/ratinho.png" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;pointer-events:none;">`;

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

    rato.addEventListener("click", () => {
      if (gameOver || rato.dataset.morto) return;
      rato.dataset.morto = "1";

      rato.innerHTML = `<img src="assets/ui/explosao.png" style="width:32px;pointer-events:none;">`;
      rato.style.transform = "scale(1.4)";

      const playerImg = document.getElementById("srdPlayerImg");
      if (playerImg) {
        playerImg.style.filter = "brightness(2)";
        setTimeout(() => playerImg.style.filter = "", 150);
      }

      score += cfg.dano === 2 ? 3 : 2;
      atualizarHUD();

      jogoAtivo.timers.push(setTimeout(() => {
        rato.remove();
        ratosVivos--;
        atualizarHUD();
        verificarFimOnda();
      }, 300));
    });

    const duracaoMs = Math.max(3500 - onda * 250, 1500);
    rato.style.transition = `top ${duracaoMs}ms linear, left ${duracaoMs}ms linear`;

    jogoAtivo.timers.push(setTimeout(() => {
      rato.style.top  = "75%";
      rato.style.left = "45%";
    }, 50));

    jogoAtivo.timers.push(setTimeout(() => {
      if (rato.dataset.morto || gameOver) return;
      rato.dataset.morto = "1";
      rato.remove();
      ratosVivos--;

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

  function iniciarOnda() {
    if (gameOver) return;
    ratosOnda  = 4 + onda * 2;
    ratosVivos = 0;
    instrucao.textContent = `Onda ${onda} — ${ratosOnda} ratos!`;
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
    const ratosNoCampo = campo.querySelectorAll(".sardinha-rato:not([data-morto])").length;
    if (ratosNoCampo > 0) return;

    jogoAtivo.timers.push(setTimeout(() => {
      if (gameOver) return;
      const ainda = campo.querySelectorAll(".sardinha-rato:not([data-morto])").length;
      if (ainda > 0) return;

      onda++;
      score += onda * 3;
      atualizarHUD();

      if (onda > 5) {
        encerrarSardinha(true);
        return;
      }

      instrucao.textContent = `Onda ${onda - 1} concluida! +${onda * 3} moedas`;
      instrucao.style.opacity = "1";
      jogoAtivo.timers.push(setTimeout(() => {
        instrucao.style.opacity = "0";
        iniciarOnda();
      }, 1800));
    }, 600));
  }

  function encerrarSardinha(vitoria) {
    if (gameOver) return;
    gameOver = true;

    const moedas = vitoria
      ? Math.min(250, 40 + Math.floor(score / 1.8))
      : Math.max(20, Math.floor(score / 3));

    ganharMoedas(moedas);
    if (vitoria) desbloquearConquista("cirurgia_felina");

    const titulo    = vitoria ? "Missao cumprida!" : "Game Over";
    const subtitulo = vitoria ? "Todas as sardinhas estao salvas!" : "Os ratos levaram as sardinhas...";
    const agenteImg = vitoria
      ? (agente === "hanna" ? "assets/sprites/hanna/feliz.png" : "assets/sprites/gatinha/gatinha-sorrindo.png")
      : (agente === "hanna" ? "assets/sprites/hanna/triste.png" : "assets/sprites/gatinha/gatinha-triste.png");

    arena.innerHTML = `
      <div class="sardinha-fim">
        <div class="sardinha-fim-titulo">${titulo}</div>
        <img src="${agenteImg}" class="sardinha-fim-img">
        <div class="sardinha-fim-sub">${subtitulo}</div>
        <div class="sardinha-fim-stats">
          <div>Ondas: <b>${onda - (vitoria ? 1 : 0)}/5</b></div>
          <div>Score: <b>${score}</b></div>
          <div>Moedas: <b>+${moedas}</b></div>
        </div>
        <div class="sardinha-fim-btns">
          <button class="sardinha-btn-acao" id="srdJogarNovamente">Jogar novamente</button>
          <button class="sardinha-btn-acao sardinha-btn-sec" id="srdSair">Sair</button>
        </div>
      </div>`;

    document.getElementById("srdJogarNovamente").addEventListener("click", () => jogoSardinha());
    document.getElementById("srdSair").addEventListener("click", () => voltarParaMenu());
  }

  jogoAtivo.timers.push(setTimeout(iniciarOnda, 800));
  atualizarHUD();
}

// Mensagems de Horário
function mensagemHorario() {

    const hora = new Date().getHours();

    if (hora < 12) {
        mostrarFalaHanna("Bom dia meu bem!");
    } else if (hora < 18) {
        mostrarFalaHanna("Boa tarde neném!");
    } else {
        mostrarFalaHanna("Boa noite meu amor 🌙");
    }

}

let _alertaLojaTimer = null;

function mostrarAlertaLoja(texto) {
  const el = document.getElementById("alertaLoja");
  if (!el) return;
  clearTimeout(_alertaLojaTimer);
  el.textContent = texto;
  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) translateY(0px)";
  _alertaLojaTimer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(-8px)";
  }, 2500);
}

// SISTEMA DE INTERAÇÕES HANNA + GATINHA 
function iniciarMomentosEspeciais() {

    setInterval(() => {

      // Verifica evento do filhotinho
        verificarEventoFilhote();

        // chance pequena
        if (Math.random() > 0.35) return;

        // só ativa se a gatinha foi adotada
        if (!gatinhaDesbloqueada) return;

        // não ativa em telas especiais
        if (
            telaPedido.style.display === "flex" ||
            telaPedidoReal.style.display === "flex"
        ) return;

        const momentos = [
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-dormindo.png",
                frase: "Elas dormiram juntinhas",
                chance: () => energia < 40
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-carinho.png",
                frase: "Muito carinho por aqui",
                chance: () => amizade > 3.5
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-brincando3.png",
                frase: "As duas estão brincando",
                chance: () => felicidade > 60
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-abraco.png",
                frase: "Se abraçando fofinho",
                chance: () => amizade > 3
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-beijinho.png",
                frase: "Beijinho da gatinha preta",
                chance: () => vinculoGatinhas > 50
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-brincando.png",
                frase: "Brincando juntas",
                chance: () => felicidade > 50
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-brincando2.png",
                frase: "Aprontando juntas",
                chance: () => felicidade > 50
            },
            {
                sprite: "assets/sprites/hanna-gatinha/gatinhas-lambendo.png",
                frase: "Se lambendo de carinho",
                chance: () => vinculoGatinhas > 40
            },
            {
                sprite: "assets/sprites/hanna-gatinha/noite-feliz.png",
                frase: "Psiu... ouviu essa fofoca?",
                chance: () => new Date().getHours() >= 19 || new Date().getHours() < 6
            },
            // Momentos da família
            {
                sprite: `assets/sprites/familia/familia-${versaoFilhote === "hanna" ? "hanna-" : versaoFilhote === "gatinha" ? "gatinha-" : ""}brincando.png`,
                frase: "A família toda brincando!",
                chance: () => filhoteDesbloqueado && felicidade > 60
            },
            {
                sprite: `assets/sprites/familia/familia-${versaoFilhote === "hanna" ? "hanna-" : versaoFilhote === "gatinha" ? "gatinha-" : ""}comendo.png`,
                frase: "Hora da refeição em família!",
                chance: () => filhoteDesbloqueado && fome > 50
            },
            {
                sprite: `assets/sprites/familia/familia-${versaoFilhote === "hanna" ? "hanna-" : versaoFilhote === "gatinha" ? "gatinha-" : ""}dormindo.png`,
                frase: "A família dormindo juntinha",
                chance: () => filhoteDesbloqueado && energia < 40
            },
            {
                sprite: `assets/sprites/familia/familia-${versaoFilhote === "hanna" ? "hanna-" : versaoFilhote === "gatinha" ? "gatinha-" : ""}aprontando.png`,
                frase: "O filhotinho aprontando igual as mães!",
                chance: () => filhoteDesbloqueado && Math.random() > 0.5
            },
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

        // Usa o sistema correto de sprites conjuntas
        momentoConjuntoAtivo = true;
        estadoVisual.momentoConjunto = true;
        estadoVisual.spriteConjunta = momento.sprite;
        renderizarGatinhas();

        mostrarMensagem(
        momento.frase
        );

        setTimeout(() => {
            momentoConjuntoAtivo = false;
            estadoVisual.momentoConjunto = false;
            estadoVisual.spriteConjunta = null;
            renderizarGatinhas();
            atualizarStatus();
        }, 6000);

    }, 120000);

}

// ── BANNER DE NOTIFICAÇÃO DE VISITA ──────────
const somCampainha = criarAudio("assets/music/som-campainha.mp3");

let _visitaPendente = null;
let _bannerTimer = null;

function mostrarBannerVisita(sprite, nome, callback) {
  const banner = document.getElementById("bannerVisita");
  const bannerSprite = document.getElementById("bannerVisitaSprite");
  const bannerNome = document.getElementById("bannerVisitaNome");
  if (!banner) return;

  // Toca campainha
  somCampainha.currentTime = 0;
  somCampainha.volume = parseFloat(volumeEfeitos.value);
  somCampainha.play().catch(() => {});

  bannerSprite.src = sprite;
  bannerNome.textContent = nome;
  banner.style.display = "block";

  setTimeout(() => banner.classList.add("visivel"), 50);

  // Guarda callback
  _visitaPendente = callback;

  // Some após 30 segundos
  _bannerTimer = setTimeout(() => {
    fecharBannerVisita();
    _visitaPendente = null;
  }, 30000);

  // Clique no banner
  banner.onclick = () => {
    clearTimeout(_bannerTimer);
    const callback = _visitaPendente;
    _visitaPendente = null;
    fecharBannerVisita();
    // Vai pra home
    abrirTela(telaJogo);
    tocarTrilha("casa");
    setTimeout(() => {
      if (callback) callback();
    }, 800);
  };
}

function fecharBannerVisita() {
  const banner = document.getElementById("bannerVisita");
  if (!banner) return;
  banner.classList.remove("visivel");
  setTimeout(() => banner.style.display = "none", 400);
}

//   VISITAS DOS PETS
function mostrarVisitaPet(sprite, fala, duracao = 8000, pet = null, nomeExibicao = "") {
  // Se não tiver na home, mostra banner
  if (telaJogo.style.display !== "block") {
    mostrarBannerVisita(sprite, nomeExibicao || "Visita chegou!", () => {
      mostrarVisitaPet(sprite, fala, duracao, pet, nomeExibicao);
    });
    return;
  }

  if (dormindo || momentoConjuntoAtivo) return;

  const spriteConjunta = document.getElementById("spriteConjunta");
  if (!spriteConjunta) return;

  // Conquistas
  if (pet === "steve") desbloquearConquista("visita_steve");
  if (pet === "joao")  desbloquearConquista("visita_joao");
  if (pet === "james") desbloquearConquista("visita_james");
  if (pet === "anna")  desbloquearConquista("visita_anna");
  if (pet === "kika")  desbloquearConquista("visita_kika");

  momentoConjuntoAtivo = true;
  estadoVisual.momentoConjunto = true;
  estadoVisual.spriteConjunta  = sprite;
  renderizarGatinhas();

  const visitaFalaEl = document.getElementById("visitaFala");
  if (visitaFalaEl) {
    visitaFalaEl.textContent = fala;
    visitaFalaEl.classList.add("visivel");
    setTimeout(() => visitaFalaEl.classList.remove("visivel"), duracao);
  }

  setTimeout(() => {
    momentoConjuntoAtivo = false;
    estadoVisual.momentoConjunto = false;
    estadoVisual.spriteConjunta  = null;
    renderizarGatinhas();
    atualizarStatus();
  }, duracao);
}

// SISTEMA DE FILA DE VISITAS
let _filaVisitas = [];

function gerarNovaFilaVisitas() {
  const personagensDisponiveis = [];
  
  if (steveDesbloqueado) personagensDisponiveis.push("steve");
  if (joaoDesbloqueado)  personagensDisponiveis.push("joao");
  if (jamesDesbloqueado) personagensDisponiveis.push("james");
  if (annaDesbloqueada)  personagensDisponiveis.push("anna");
  if (kikaDesbloqueada)  personagensDisponiveis.push("kika");
  
  // Embaralha a lista (Fisher-Yates)
  for (let i = personagensDisponiveis.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [personagensDisponiveis[i], personagensDisponiveis[j]] = [personagensDisponiveis[j], personagensDisponiveis[i]];
  }
  
  _filaVisitas = personagensDisponiveis;
}

function proximaVisitaDaFila() {
  // Se a fila tá vazia, gera uma nova rodada
  if (_filaVisitas.length === 0) {
    gerarNovaFilaVisitas();
  }
  
  // Se ainda tá vazia (nenhum pet desbloqueado), retorna null
  if (_filaVisitas.length === 0) return null;
  
  return _filaVisitas.shift(); // remove e retorna o primeiro
}

function iniciarSistemaVisitas() {
  setInterval(() => {
    // Não tem ninguém desbloqueado
    if (!steveDesbloqueado && !joaoDesbloqueado && !jamesDesbloqueado && !annaDesbloqueada && !kikaDesbloqueada) return;
    
    if (Math.random() > 0.7) return; // 70% de chance
    
    const personagem = proximaVisitaDaFila();
    if (!personagem) return;
    
    dispararVisita(personagem);
  }, 5 * 60 * 1000);
}

function dispararVisita(personagem) {
  const dados = {
    steve: {
      falas: [
        "Steve apareceu com uma fofoca",
        "Steve trouxe novidades do bairro!",
        "Steve veio fazer companhia",
        "Psiu... Steve ouviu algo interessante!",
      ],
      sprites: [
        "assets/sprites/pets/steve-visita.png",
        "assets/sprites/pets/steve-visita-2.png",
        "assets/sprites/pets/steve-visita-3.png",
      ],
      nomeExibicao: "Steve Rogers chegou!",
    },
    joao: {
      falas: [
        "João Antônio derrubou alguma coisa!",
        "João Antônio veio aprontar por aqui",
        "João chegou fazendo bagunça!",
        "João Antônio não quer nem saber do James hoje",
      ],
      sprites: [
        "assets/sprites/pets/joao-visita.png",
        "assets/sprites/pets/joao-visita-2.png",
        "assets/sprites/pets/joao-visita-3.png",
      ],
      nomeExibicao: "João Antônio chegou!",
    },
    james: {
      falas: [
        "Cook veio conferir a despensa",
        "Cook apareceu com cara de fome!",
        "Cook farejando comida por aqui",
        "Cook tentou roubar o petisco da Hanna!",
      ],
      sprites: [
        "assets/sprites/pets/james-visita.png",
        "assets/sprites/pets/james-visita-2.png",
        "assets/sprites/pets/james-visita-3.png",
      ],
      nomeExibicao: "James Cook chegou!",
    },
    anna: {
      falas: [
        "Vim ver como vocês tão!",
        "Tô com saudade das meninas!",
        "Trouxe um mimo pras gatinhas!",
        "O que vocês tão aprontando?",
        "Anna apareceu pra dar um oi!",
        "Tô de olho em vocês!",
      ],
      sprites: [
        "assets/sprites/personagens/anna-visita-1.png",
        "assets/sprites/personagens/anna-visita-2.png",
        "assets/sprites/personagens/anna-visita-3.png",
      ],
      nomeExibicao: "Anna chegou!",
    },
    kika: {
      falas: [
        "Vim dar uma passadinha!",
        "Tô com saudade das meninas!",
        "Trouxe um petisco pras gatinhas!",
        "Cook, eu tô de olho em você!",
        "Kika apareceu!",
        "Esse Cook tava roubando de novo!",
      ],
      sprites: [
        "assets/sprites/personagens/kika-visita-1.png",
        "assets/sprites/personagens/kika-visita-2.png",
        "assets/sprites/personagens/kika-visita-3.png",
      ],
      nomeExibicao: "Kika chegou!",
    },
  };

  const info = dados[personagem];
  if (!info) return;

  const fala = info.falas[Math.floor(Math.random() * info.falas.length)];
  const sprite = info.sprites[Math.floor(Math.random() * info.sprites.length)];

  mostrarVisitaPet(sprite, fala, 15000, personagem, info.nomeExibicao);
}

//   JOGO — MISSÃO DO STEVE (Stealth)
//   Steve tenta chegar ao osso sem ser visto.
//   Clique nos momentos certos pra avançar.

function jogoSteve() {
  abrirArena("Missão do Steve");

  let fase    = 0;
  let pontos  = 0;
  let rodando = true;

  const FASES = [
    { desc: "Steve quer pegar o osso sem a Hanna ver!", emoji: "🦴", obstaculos: 3, janela: 1200 },
    { desc: "Mais difícil agora! Hanna está mais atenta.", emoji: "🦴🦴", obstaculos: 4, janela: 900 },
    { desc: "Nível máximo! Steve precisa ser ninja!", emoji: "🦴🦴🦴", obstaculos: 5, janela: 700 },
  ];

  function render() {
    const f = FASES[Math.min(fase, FASES.length - 1)];
    arenaConteudo.innerHTML = `
      <div class="steve-wrap">
        <div class="steve-info">
          <span>🐕 Fase ${fase + 1}/${FASES.length}</span>
          <span>⭐ ${pontos} pts</span>
        </div>
        <div class="steve-cenario">
          <img src="assets/sprites/pets/steve-missao.png" class="steve-sprite" id="steveSprite">
          <div class="steve-desc">${f.desc}</div>
          <div class="steve-botao-wrap">
            <button class="steve-btn" id="steveAvançar">AGORA!</button>
          </div>
        </div>
        <div class="steve-dica">Toque no momento certo pra Steve avançar sem ser visto!</div>
      </div>`;

    let cliques   = 0;
    let esperando = false;

    document.getElementById("steveAvançar")?.addEventListener("click", () => {
      if (!rodando || esperando) return;
      esperando = true;

      // Janela aleatória de sucesso
      const sucesso = Math.random() < 0.6;
      cliques++;

      const sprite = document.getElementById("steveSprite");
      if (sprite) sprite.src = sucesso
        ? "assets/sprites/pets/steve-feliz.png"
        : "assets/sprites/pets/steve-pego.png";

      if (sucesso) {
        pontos += 10;
        mostrarFalaHanna(["Vai Steve! 🐾", "Isso aí! 🐕", "Passou! ⭐"][Math.floor(Math.random()*3)]);
      } else {
        mostrarFalaHanna(["Hanna viu! 😹", "Ops! 😼", "Busted! 😂"][Math.floor(Math.random()*3)]);
      }

      jogoAtivo.timers.push(setTimeout(() => {
        if (cliques >= f.obstaculos) {
          fase++;
          if (fase >= FASES.length) {
            terminar();
          } else {
            render();
          }
        } else {
          esperando = false;
          if (sprite) sprite.src = "assets/sprites/pets/steve-missao.png";
        }
      }, 800));
    });
  }

  function terminar() {
    rodando = false;
    const recomp = pontos >= 40 ? 90 : pontos >= 25 ? 60 : 30;
    ganharMoedas(recomp);
    desbloquearConquista("missao_steve");
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado("Missão cumprida! 🐕", "🦴", recomp,
        `Steve conseguiu! ${pontos} pontos no total.`, jogoSteve);
    }, 600));
  }

  render();
}

// ══════════════════════════════════════════════
//   JOGO 8 — COOK E A DESPENSA (Stealth/Timing)
//   James tenta roubar comida sem ser pego.
// ══════════════════════════════════════════════

function jogoJames() {
  abrirArena("Cook e a Despensa");

  let pontos  = 0;
  let vidas   = 3;
  let tempo   = 45;
  let rodando = true;

  const comidas = [
    { src: "assets/shop/peixe.png",   nome: "Peixe"   },
    { src: "assets/shop/sashimi.png", nome: "Sashimi" },
    { src: "assets/shop/atum.png",    nome: "Atum"    },
    { src: "assets/shop/carne.png",   nome: "Carne"   },
    { src: "assets/shop/frango.png",  nome: "Frango"  },
    { src: "assets/shop/presunto.png",nome: "Presunto"},
  ];

  const armadilhas = [
    { src: "assets/sprites/personagens/kika-olhando.png", nome: "kika-olhando" },
    { src: "assets/sprites/personagens/kika-brava.png",   nome: "kika-brava"   },
    { src: "assets/sprites/personagens/kika-pegando.png", nome: "kika-pegando" },
  ];

  arenaConteudo.innerHTML = `
    <div class="james-wrap">
      <div class="james-info">
        <span>Petiscos: <b id="jamesPontos">0</b></span>
        <div id="jamesVidas" style="display:flex;gap:4px;">
          <img src="assets/ui/coracao-5.png" style="width:18px;">
          <img src="assets/ui/coracao-5.png" style="width:18px;">
          <img src="assets/ui/coracao-5.png" style="width:18px;">
        </div>
        <span>Tempo: <b id="jamesTimer">45</b>s</span>
      </div>
      <div class="james-arena" id="jamesArena">
        <img src="assets/sprites/pets/james-espiando.png" class="james-sprite">
      </div>
      <div class="james-dica">Toque nas comidas! Evite a Kika!</div>
    </div>`;

  const arena = document.getElementById("jamesArena");

  function atualizarVidas() {
    const el = document.getElementById("jamesVidas");
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const img = document.createElement("img");
      img.src = i < vidas ? "assets/ui/coracao-5.png" : "assets/ui/coracao-1.png";
      img.style.width = "18px";
      el.appendChild(img);
    }
  }

  function criarItem() {
    if (!rodando) return;
    const isTrap = Math.random() < 0.3;
    const item   = isTrap
      ? armadilhas[Math.floor(Math.random() * armadilhas.length)]
      : comidas[Math.floor(Math.random() * comidas.length)];

    const el = document.createElement("div");
    el.className = "james-item";
    el.style.left = Math.random() * 75 + "%";
    el.style.top  = Math.random() * 70 + 10 + "%";

    const img = document.createElement("img");
    img.src = item.src;
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.objectFit = "contain";
    img.style.pointerEvents = "none";
    img.style.imageRendering = "pixelated";
    el.appendChild(img);

    arena.appendChild(el);

    el.addEventListener("click", () => {
      if (!rodando) return;
      el.remove();
      if (isTrap) {
        vidas--;
        atualizarVidas();
        mostrarFalaHanna("Cook foi pego pela Kika!");
        if (vidas <= 0) terminar();
      } else {
        pontos++;
        document.getElementById("jamesPontos").textContent = pontos;
        mostrarFalaHanna(["Delicia!", "Roubado!", "Nham!"][Math.floor(Math.random()*3)]);
      }
    });

    jogoAtivo.timers.push(setTimeout(() => el.parentNode && el.remove(), 2500));
  }

  const spawn = setInterval(() => { if (!rodando) { clearInterval(spawn); return; } criarItem(); }, 1000);
  jogoAtivo.intervals.push(spawn);

  const count = setInterval(() => {
    if (!rodando) { clearInterval(count); return; }
    tempo--;
    const el = document.getElementById("jamesTimer");
    if (el) el.textContent = tempo;
    if (tempo <= 0) terminar();
  }, 1000);
  jogoAtivo.intervals.push(count);

  function terminar() {
    rodando = false;
    const recomp = pontos >= 20 ? 80 : pontos >= 10 ? 50 : 20;
    ganharMoedas(recomp);
    desbloquearConquista("james_ladrao");
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        pontos >= 15 ? "Mestre ladrao!" : "Quase la!",
        "",
        recomp,
        `Cook roubou ${pontos} petiscos!`,
        jogoJames
      );
    }, 600));
  }
}

// ══════════════════════════════════════════════
//   JOGO 9 — JOÃO E AS PRATELEIRAS (Tap)
//   Derrube o máximo de objetos possível!
// ══════════════════════════════════════════════

function jogoJoao() {
  abrirArena("João e as Prateleiras");

  let derrubados = 0;
  let tempo      = 30;
  let rodando    = true;

  const objetos = ["📱","📚","🖥️","🏺","🪴","📷","🎮","🕯️","🧸","📦"];

  arenaConteudo.innerHTML = `
    <div class="joao-wrap">
      <div class="joao-info">
        <span>💥 <b id="joaoPontos">0</b> derrubados</span>
        <span>⏱️ <b id="joaoTimer">30</b>s</span>
      </div>
      <img src="assets/sprites/pets/joao-prateleira.png" class="joao-sprite">
      <div class="joao-prateleira" id="joaoArena"></div>
      <div class="joao-dica">Toque nos objetos pra João derrubar!</div>
    </div>`;

  const arena = document.getElementById("joaoArena");

  function spawnObjeto() {
    if (!rodando || arena.children.length >= 6) return;
    const el = document.createElement("div");
    el.className = "joao-objeto";
    el.textContent = objetos[Math.floor(Math.random() * objetos.length)];
    arena.appendChild(el);

    el.addEventListener("click", () => {
      if (!rodando) return;
      el.classList.add("joao-caindo");
      derrubados++;
      document.getElementById("joaoPontos").textContent = derrubados;
      mostrarFalaHanna(["CRASH!", "Vai abaixo!", "João apronta!"][Math.floor(Math.random()*3)]);
      jogoAtivo.timers.push(setTimeout(() => el.remove(), 400));
    });
  }

  const spawn = setInterval(() => { if (!rodando) { clearInterval(spawn); return; } spawnObjeto(); }, 700);
  jogoAtivo.intervals.push(spawn);

  const count = setInterval(() => {
    if (!rodando) { clearInterval(count); return; }
    tempo--;
    const el = document.getElementById("joaoTimer");
    if (el) el.textContent = tempo;
    if (tempo <= 0) terminar();
  }, 1000);
  jogoAtivo.intervals.push(count);

  function terminar() {
    rodando = false;
    const recomp = derrubados >= 25 ? 80 : derrubados >= 15 ? 55 : derrubados >= 8 ? 30 : 15;
    ganharMoedas(recomp);
    desbloquearConquista("joao_aprontando");
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        derrubados >= 20 ? "Destruição total! 💥" : "Bagunça feita!",
        "😼", recomp,
        `João derrubou ${derrubados} objetos!`, jogoJoao);
    }, 600));
  }
}

// ══════════════════════════════════════════════
//   JOGO 13 — TROCA DE RECADOS
//   Monte a resposta certa na ordem certa!
// ══════════════════════════════════════════════

function jogoRecados() {
  abrirArena("Troca de Recados");

  // ── BANCO DE CONVERSAS ──────────────────────
  const conversas = [
    // Universo Hanna
    { remetente: "kika",  mensagem: "Como tá a Hanna hoje?",                         resposta: "Ela tá com fome e dramática como sempre" },
    { remetente: "anna",  mensagem: "A Hanna ganhou uma semente dourada!",            resposta: "Ela merece tudo de bom" },
    { remetente: "anna",  mensagem: "O Cook tentou roubar a comida da Hanna de novo", resposta: "Esse Cook é igual ao original" },
    { remetente: "kika",  mensagem: "O Tonton tá fazendo bagunça aí no jogo?",        resposta: "Igualzinho ao seu João Antonio" },
    { remetente: "anna",  mensagem: "O Tivo apareceu com fofoca nova",                resposta: "Igualzinho ao seu Steve kkkkk" },
    { remetente: "anna",  mensagem: "Tô com saudade de você",                         resposta: "Eu e a Hanna também" },
    // Músicas
    { remetente: "kika",  mensagem: "Ouvi Cigarra da Anavitória e só pensei em você", resposta: "Essa música agora é nossa" },
    { remetente: "kika",  mensagem: "Tô meio tristinha hoje...",                       resposta: "Coloca Hate To See Your Heart Break e pensa em mim" },
    { remetente: "kika",  mensagem: "Calcinha Preta no volume máximo hoje",            resposta: "Você e seu bregão kkkkk" },
    { remetente: "anna",  mensagem: "Dizem que o amor atrai...",                       resposta: "Então a culpa é sua por me atrair assim" },
    { remetente: "kika",  mensagem: "Hoje à noite não tem luar...",                    resposta: "Mas tem você, e tá bom demais" },
    // Séries e filmes
    { remetente: "kika",  mensagem: "The Last of Us temporada um foi perfeita",        resposta: "Só a um, combinado" },
    { remetente: "kika",  mensagem: "Friends sempre cai bem",                          resposta: "Todo dia é dia de Friends" },
    { remetente: "anna",  mensagem: "Você assistiu Lost até o final?",                 resposta: "Não consigo parar de assistir" },
    { remetente: "kika",  mensagem: "TWD é vício, não tem cura",                       resposta: "Quero rever tudo com você" },
    { remetente: "kika",  mensagem: "Filme de terror hoje à noite?",                   resposta: "Você assiste e me conta como termina" },
    // Coisas de vocês
    { remetente: "kika",  mensagem: "Oi minha brasiliense",                            resposta: "Oi minha recifense" },
    { remetente: "anna",  mensagem: "Tô com saudade neném",                            resposta: "Eu também meu bem" },
    { remetente: "kika",  mensagem: "Bela brasiliense, tô pensando em você",           resposta: "Bela recifense, eu também" },
    { remetente: "anna",  mensagem: "Nenis, você é especial demais",                   resposta: "Você primeiro, baby" },
  ];

  // ── ESTADO DO JOGO ───────────────────────────
  let rodada        = 0;
  let acertos       = 0;
  let erros         = 0;
  let moedas        = 0;
  let palavrasSelecionadas = [];
  const TOTAL_RODADAS = 5;

  // Embaralha e pega 5 conversas aleatórias
  const selecionadas = [...conversas]
    .sort(() => Math.random() - 0.5)
    .slice(0, TOTAL_RODADAS);

  // ── HTML DA ARENA ────────────────────────────
  arenaConteudo.innerHTML = `
    <div class="recados-wrap">

      <div class="recados-progresso">
        <span id="recadosRodada">1/${TOTAL_RODADAS}</span>
        <span id="recadosFeedback"></span>
      </div>

      <div class="recados-chat">

        <div class="recados-balao-wrap" id="recadosMsgWrap">
          <img class="recados-avatar-chat" id="recadosAvatar" src="">
          <div class="recados-balao" id="recadosBalao"></div>
        </div>

        <div class="recados-resposta-wrap">
          <div class="recados-preview" id="recadosPreview">
            Toque nas palavras na ordem certa...
          </div>
          <img class="recados-avatar-chat recados-avatar-direita" id="recadosAvatarResp" src="">
        </div>

      </div>

      <div class="recados-timer-barra">
        <div class="recados-timer-progresso" id="recadosTimer"></div>
      </div>

      <div class="recados-palavras" id="recadosPalavras"></div>

    </div>`;

  // ── FUNÇÕES ──────────────────────────────────
  function embaralhar(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function iniciarRodada() {
    if (rodada >= TOTAL_RODADAS) return terminar();

    palavrasSelecionadas = [];
    const conversa = selecionadas[rodada];

    // Define avatares conforme remetente
    const avatarRemetente  = conversa.remetente === "anna"
      ? "assets/sprites/personagens/anna-avatar.png"
      : "assets/sprites/personagens/kika-avatar.png";
    const avatarRespondente = conversa.remetente === "anna"
      ? "assets/sprites/personagens/kika-avatar.png"
      : "assets/sprites/personagens/anna-avatar.png";

    document.getElementById("recadosAvatar").src     = avatarRemetente;
    document.getElementById("recadosAvatarResp").src = avatarRespondente;
    document.getElementById("recadosBalao").textContent = conversa.mensagem;
    document.getElementById("recadosPreview").textContent = "Toque nas palavras na ordem certa...";
    document.getElementById("recadosRodada").textContent = `${rodada + 1}/${TOTAL_RODADAS}`;
    document.getElementById("recadosFeedback").textContent = "";

    // Monta palavras embaralhadas
    const palavras = embaralhar(conversa.resposta.split(" "));
    const container = document.getElementById("recadosPalavras");
    container.innerHTML = "";

    palavras.forEach(palavra => {
      const btn = document.createElement("button");
      btn.className = "recados-palavra-btn";
      btn.textContent = palavra;
      btn.addEventListener("click", () => selecionarPalavra(btn, palavra, conversa.resposta));
      container.appendChild(btn);
    });

    iniciarTimer();
  }

  function selecionarPalavra(btn, palavra, respostaCorreta) {
    if (btn.classList.contains("usada")) return;
    btn.classList.add("usada");
    palavrasSelecionadas.push(palavra);

    const preview = document.getElementById("recadosPreview");
    preview.textContent = palavrasSelecionadas.join(" ");

    // Verifica se já montou a resposta completa
    const totalPalavras = respostaCorreta.split(" ").length;
    if (palavrasSelecionadas.length === totalPalavras) {
      verificarResposta(respostaCorreta);
    }
  }

  function verificarResposta(respostaCorreta) {
    pararTimer();
    const respostaDada = palavrasSelecionadas.join(" ");
    const feedback = document.getElementById("recadosFeedback");
    const container = document.getElementById("recadosPalavras");

    if (respostaDada === respostaCorreta) {
      acertos++;
      moedas += 10;
      feedback.textContent = "Perfeito!";
      feedback.style.color = "var(--green, #4caf50)";
      container.querySelectorAll(".recados-palavra-btn").forEach(b => b.classList.add("correta"));
    } else {
      erros++;
      feedback.textContent = "Quase...";
      feedback.style.color = "var(--pink-deep)";
      container.querySelectorAll(".recados-palavra-btn").forEach(b => b.classList.add("errada"));
    }

    rodada++;
    jogoAtivo.timers.push(setTimeout(iniciarRodada, 1500));
  }

  // ── TIMER 
  let timerInterval = null;
  let tempoRestante = 15; // 15 segundos por rodada

  function iniciarTimer() {
    tempoRestante = 15;
    const barra = document.getElementById("recadosTimer");
    if (barra) barra.style.width = "100%";

    timerInterval = setInterval(() => {
      tempoRestante--;
      const pct = (tempoRestante / 15) * 100;
      if (barra) barra.style.width = pct + "%";

      if (tempoRestante <= 0) {
        pararTimer();
        erros++;
        rodada++;
        const feedback = document.getElementById("recadosFeedback");
        if (feedback) {
          feedback.textContent = "Tempo esgotado!";
          feedback.style.color = "var(--pink-deep)";
        }
        jogoAtivo.timers.push(setTimeout(iniciarRodada, 1500));
      }
    }, 1000);
    jogoAtivo.intervals.push(timerInterval);
  }

  function pararTimer() {
    clearInterval(timerInterval);
  }

  // RESULTADO
  function terminar() {
    pararTimer();
    const recomp = acertos === 5 ? 50 : acertos >= 3 ? 30 : acertos >= 1 ? 10 : 5;
    if (acertos === 5) desbloquearConquista("recados_perfeito"); // linha nova
    ganharMoedas(recomp);
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        acertos === 5 ? "Vocês se entendem demais!" : acertos >= 3 ? "Quase perfeito!" : "Continua tentando!",
        "💌", recomp,
        `${acertos} de ${TOTAL_RODADAS} respostas certas!`,
        jogoRecados
      );
    }, 600));
  }

  // INICIA 
  iniciarRodada();
}

//   QUEBRA-CABEÇA — 9 NÍVEIS PROGRESSIVOS

function jogoQuebracabeca() {
  abrirArena("Quebra-Cabeca");

  const NIVEIS = [
    { sprite: "assets/sprites/puzzle/puzzle-nivel1.png", grade: 3, nome: "Hanna brincando" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel2.png", grade: 4, nome: "Hanna e a Gatinha" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel3.png", grade: 4, nome: "Joao Antonio o aprontao" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel4.png", grade: 5, nome: "James Cook roubando presunto" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel5.png", grade: 5, nome: "Steve Rogers o fofoqueiro" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel6.png", grade: 6, nome: "Uma familia Completa" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel7.png", grade: 6, nome: "Manha de Caos em Casa" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel8.png", grade: 6, nome: "Noite de Cinema em Familia" },
    { sprite: "assets/sprites/puzzle/puzzle-nivel9.png", grade: 7, nome: "A Familia Cresceu" },
  ];

  let nivelAtual = parseInt(localStorage.getItem("puzzleNivel") || "0");
  let movimentos = 0;

  function iniciarNivel(idx) {
    const nivel = NIVEIS[idx];
    const N     = nivel.grade;
    const total = N * N;

    let pecas = Array.from({length: total}, (_, i) => i);
    do {
      for (let i = pecas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pecas[i], pecas[j]] = [pecas[j], pecas[i]];
      }
    } while (!resolucaoValida(pecas, N) || pecasNoLugar(pecas));

    let selecionada = null;

    function resolucaoValida(arr, n) {
      let inv = 0;
      for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++)
          if (arr[i] > arr[j]) inv++;
      return inv % 2 === 0;
    }

    function pecasNoLugar(arr) {
      return arr.every((v, i) => v === i);
    }

    function render() {
      const porcento = Math.round((pecas.filter((v, i) => v === i).length / total) * 100);
      arenaConteudo.innerHTML = `
        <div class="pz-wrap">
          <div class="pz-info">
            <span>Nivel ${idx + 1}/${NIVEIS.length}</span>
            <span>${movimentos} mov</span>
            <span>${porcento}%</span>
          </div>
          <div class="pz-label">${nivel.nome}</div>
          <div class="pz-grade" id="pzGrade" style="grid-template-columns: repeat(${N}, 1fr);">
            ${pecas.map((peca, pos) => {
              const row = Math.floor(peca / N);
              const col = peca % N;
              const sel = selecionada === pos;
              return `<div class="pz-peca ${sel ? "pz-sel" : ""}" data-pos="${pos}"
                style="background-image:url('${nivel.sprite}');
                       background-size:${N * 100}%;
                       background-position:${col * 100/(N-1)}% ${row * 100/(N-1)}%;">
              </div>`;
            }).join("")}
          </div>
          <div class="pz-dica">Toque em duas pecas para troca-las de lugar</div>
        </div>`;

      document.querySelectorAll(".pz-peca").forEach(el => {
        el.addEventListener("click", () => {
          const pos = parseInt(el.dataset.pos);
          if (selecionada === null) {
            selecionada = pos;
            render();
          } else if (selecionada === pos) {
            selecionada = null;
            render();
          } else {
            [pecas[selecionada], pecas[pos]] = [pecas[pos], pecas[selecionada]];
            movimentos++;
            selecionada = null;
            render();
            if (pecasNoLugar(pecas)) {
              jogoAtivo.timers.push(setTimeout(() => completarNivel(), 400));
            }
          }
        });
      });
    }

    function completarNivel() {
      mostrarFalaHanna(idx === 5 ? "Que surpresa!" : "Uau! Resolveu!");
      const proximo = idx + 1;
      localStorage.setItem("puzzleNivel", Math.max(nivelAtual, proximo).toString());

      if (proximo >= NIVEIS.length) {
        const recomp = 200;
        ganharMoedas(recomp);
        desbloquearConquista("puzzle_mestre");
        jogoAtivo.timers.push(setTimeout(() => {
          mostrarResultado("Quebra-cabeca completo!", "", recomp,
            "Voce montou todos os niveis! Incrivel!", jogoQuebracabeca);
        }, 800));
      } else {
        const recomp = (idx + 1) * 20;
        ganharMoedas(recomp);
        jogoAtivo.timers.push(setTimeout(() => {
          arenaConteudo.innerHTML = `
            <div class="pz-wrap" style="align-items:center;gap:20px;">
              <div style="font-size:32px; color:var(--pink-deep);">Nivel ${idx+1} completo!</div>
              <div style="font-size:13px;color:var(--text-mid);">+${recomp} moedas</div>
              <button class="steve-btn" id="pzProximo">Proximo nivel</button>
            </div>`;
          document.getElementById("pzProximo")?.addEventListener("click", () => {
            iniciarNivel(proximo);
          });
        }, 600));
      }
    }

    render();
  }

  arenaConteudo.innerHTML = `
    <div class="pz-wrap">
      <div class="pz-label" style="font-size:14px; color:var(--text-dark);">Escolha um nivel</div>
      <div class="pz-niveis">
        ${NIVEIS.map((n, i) => {
          const desbloqueado = i <= nivelAtual;
          return `<div class="pz-nivel-card ${desbloqueado ? "" : "pz-bloqueado"}" data-idx="${i}">
            <img src="${n.sprite}" class="pz-nivel-img">
            <div class="pz-nivel-nome">${i + 1}. ${n.nome}</div>
            <div class="pz-nivel-grade">${n.grade}x${n.grade}</div>
            ${desbloqueado ? "" : '<div class="pz-lock">bloqueado</div>'}
          </div>`;
        }).join("")}
      </div>
    </div>`;

  document.querySelectorAll(".pz-nivel-card:not(.pz-bloqueado)").forEach(el => {
    el.addEventListener("click", () => {
      iniciarNivel(parseInt(el.dataset.idx));
    });
  });
}

function animarTela(tela) {

    tela.classList.remove("fadeTela");

    void tela.offsetWidth;

    tela.classList.add("fadeTela");

}

// ══════════════════════════════════════════════
//   JOGO 10 — CAÇA-PALAVRAS
//   Encontre todas as palavras na grade 10x10.
//   Deslize sobre as letras pra marcar.
//   Recompensa por palavras encontradas.
// ══════════════════════════════════════════════

async function jogoCacaPalavras() {
  abrirArena("Caça-Palavras");

  arenaConteudo.innerHTML = `<div style="text-align:center;padding:40px;color:#fff;font-weight:800;">Carregando... 🔍</div>`;

  let LISTAS;
  try {
    const { carregarBancoPalavras } = await import("./firebase.js");
    const banco = await carregarBancoPalavras();
    LISTAS = banco.cacapalavras.map(item =>
      typeof item === "string" ? item.split(",") : item
    );
  } catch(e) {
    LISTAS = [
      ["HANNA","GATO","AMOR","PATA","MIAU","FOME","SONO","LOJA"],
      ["FAZENDA","BANHO","FELIZ","CARINHO","MOEDA","FLOR","ROSA","PURR"],
      ["GATINHA","SEMENTE","VINCULO","PETISCO","NOVELO","FESTA","CHUVA","LACO"],
    ];
  }

  const PALAVRAS_DISPLAY = LISTAS[Math.floor(Math.random() * LISTAS.length)];
  const TAMANHO = 10;
  const DIRS = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  let grade = Array.from({length: TAMANHO}, () => Array(TAMANHO).fill(""));

  function semAcento(p) {
    return p.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
  }

  const PALAVRAS = PALAVRAS_DISPLAY.map(semAcento);

  function caber(palavra, r, c, dr, dc) {
    for (let i = 0; i < palavra.length; i++) {
      const nr = r + dr*i, nc = c + dc*i;
      if (nr < 0 || nr >= TAMANHO || nc < 0 || nc >= TAMANHO) return false;
      if (grade[nr][nc] !== "" && grade[nr][nc] !== palavra[i]) return false;
    }
    return true;
  }

  function colocar(palavra) {
    for (let t = 0; t < 200; t++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r = Math.floor(Math.random() * TAMANHO);
      const c = Math.floor(Math.random() * TAMANHO);
      if (caber(palavra, r, c, dr, dc)) {
        for (let i = 0; i < palavra.length; i++) grade[r + dr*i][c + dc*i] = palavra[i];
        return true;
      }
    }
    return false;
  }

  const ALFA = "ABCDEFGHIJKLMNOPRSTUVZ";
  PALAVRAS.forEach(p => colocar(p));
  for (let r = 0; r < TAMANHO; r++)
    for (let c = 0; c < TAMANHO; c++)
      if (!grade[r][c]) grade[r][c] = ALFA[Math.floor(Math.random() * ALFA.length)];

  let selecionando = false;
  let selInicio    = null;
  let selAtual     = [];
  let encontradas  = new Set();
  let celsMarcadas = new Set();

  function celulasDe(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    if (dr !== 0 && dc !== 0 && Math.abs(r2-r1) !== Math.abs(c2-c1)) return [];
    const cels = [];
    let r = r1, c = c1;
    while (true) {
      cels.push([r, c]);
      if (r === r2 && c === c2) break;
      r += dr; c += dc;
      if (cels.length > TAMANHO * 2) break;
    }
    return cels;
  }

  function getCelFromPoint(x, y) {
    const grade = document.getElementById("cpGrade");
    if (!grade) return null;
    const els = grade.querySelectorAll(".cp-cel");
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return [parseInt(el.dataset.r), parseInt(el.dataset.c)];
      }
    }
    return null;
  }

  function confirmarSelecao() {
    if (!selecionando || selAtual.length === 0) return;
    const sel = [...selAtual];
    selecionando = false;
    selInicio    = null;
    selAtual     = [];

    const texto    = sel.map(([r,c]) => grade[r][c]).join("");
    const textoRev = [...texto].reverse().join("");

    let achou = false;
    PALAVRAS.forEach((palavra, i) => {
      if ((texto === palavra || textoRev === palavra) && !encontradas.has(i)) {
        achou = true;
        encontradas.add(i);
        sel.forEach(([r,c]) => celsMarcadas.add(`${r},${c}`));
        mostrarFalaHanna(`"${PALAVRAS_DISPLAY[i]}" encontrada!`);
        if (encontradas.size === PALAVRAS.length) {
          render();
          ganharMoedas(70);
          desbloquearConquista("caca_palavras");
          jogoAtivo.timers.push(setTimeout(() => {
            mostrarResultado("Detetive Felina!", "", 70,
              "Encontrou todas as palavras! Incrível!", jogoCacaPalavras);
          }, 800));
          return;
        }
      }
    });

    render();
  }

  function render() {
    arenaConteudo.innerHTML = `
      <div class="cp-wrap">
        <div class="cp-palavras">
          ${PALAVRAS_DISPLAY.map((p, i) =>
            `<span class="cp-palavra ${encontradas.has(i) ? "cp-encontrada" : ""}">${p}</span>`
          ).join("")}
        </div>
        <div class="cp-grade" id="cpGrade" style="touch-action:none; user-select:none;">
          ${grade.map((row, r) =>
            row.map((letra, c) => {
              const key     = `${r},${c}`;
              const marcada = celsMarcadas.has(key);
              const sel     = selAtual.some(([sr,sc]) => sr===r && sc===c);
              return `<div class="cp-cel ${marcada ? "cp-marcada" : ""} ${sel ? "cp-selecionando" : ""}"
                data-r="${r}" data-c="${c}">${letra}</div>`;
            }).join("")
          ).join("")}
        </div>
        ${encontradas.size === PALAVRAS.length
          ? `<div class="cp-parabens">Encontrou tudo!</div>`
          : `<div class="cp-dica">Deslize sobre as letras pra marcar palavras</div>`}
      </div>`;

    const gradeEl = document.getElementById("cpGrade");
    if (!gradeEl) return;

    // TOUCH
    gradeEl.addEventListener("touchstart", e => {
      e.preventDefault();
      const t = e.touches[0];
      const cel = getCelFromPoint(t.clientX, t.clientY);
      if (!cel) return;
      selecionando = true;
      selInicio    = cel;
      selAtual     = [cel];
      render();
    }, { passive: false });

    gradeEl.addEventListener("touchmove", e => {
      e.preventDefault();
      if (!selecionando || !selInicio) return;
      const t = e.touches[0];
      const cel = getCelFromPoint(t.clientX, t.clientY);
      if (!cel) return;
      selAtual = celulasDe(selInicio[0], selInicio[1], cel[0], cel[1]);
      render();
    }, { passive: false });

    gradeEl.addEventListener("touchend", e => {
      e.preventDefault();
      confirmarSelecao();
    }, { passive: false });

    // MOUSE (desktop)
    gradeEl.addEventListener("mousedown", e => {
      const cel = getCelFromPoint(e.clientX, e.clientY);
      if (!cel) return;
      selecionando = true;
      selInicio    = cel;
      selAtual     = [cel];
      render();
    });

    gradeEl.addEventListener("mousemove", e => {
      if (!selecionando || !selInicio) return;
      const cel = getCelFromPoint(e.clientX, e.clientY);
      if (!cel) return;
      selAtual = celulasDe(selInicio[0], selInicio[1], cel[0], cel[1]);
      render();
    });

    gradeEl.addEventListener("mouseup", () => {
      confirmarSelecao();
    });
  }

  render();
}

//   JOGO 7 — MATCH-3 FELINO
function jogoMatch3() {
  abrirArena("Match-3 Felino");

  const COLS   = 6;
  const ROWS   = 7;
  const ICONES = [
    "novelo","novelo","novelo",
    "peixe","peixe","peixe",
    "ratinho","ratinho","ratinho",
    "donut","donut","donut",
    "coleira","coleira",
    "varinha"
  ];
  const VALORES = {
    novelo:  10,
    peixe:   15,
    ratinho: 20,
    donut:   25,
    coleira: 40,
    varinha: 50,
  };
  const opcoesJogadas = [10, 15, 20, 25, 30];
  const MAX_JOGADAS = opcoesJogadas[Math.floor(Math.random() * opcoesJogadas.length)];

  let board    = [];
  let selected = null;
  let pontos   = 0;
  let jogadas  = 0;
  let rodando  = true;

  function novaGrade() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      board.push([]);
      for (let c = 0; c < COLS; c++) {
        board[r].push(ICONES[Math.floor(Math.random() * ICONES.length)]);
      }
    }
    let mudou = true;
    while (mudou) { mudou = removerCombos(false); }
    if (!existeJogadaPossivel()) novaGrade();
  }

  function existeJogadaPossivel() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1) {
          [board[r][c], board[r][c+1]] = [board[r][c+1], board[r][c]];
          const formouCombo = testarCombo();
          [board[r][c], board[r][c+1]] = [board[r][c+1], board[r][c]];
          if (formouCombo) return true;
        }
        if (r < ROWS - 1) {
          [board[r][c], board[r+1][c]] = [board[r+1][c], board[r][c]];
          const formouCombo = testarCombo();
          [board[r][c], board[r+1][c]] = [board[r+1][c], board[r][c]];
          if (formouCombo) return true;
        }
      }
    }
    return false;
  }

  function testarCombo() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS - 2; c++)
        if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) return true;
    for (let r = 0; r < ROWS - 2; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) return true;
    return false;
  }

  function removerCombos(contar = true) {
    const marcar = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    const valores = Array.from({length: ROWS}, () => Array(COLS).fill(0));

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS - 2; c++)
        if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
          marcar[r][c] = marcar[r][c+1] = marcar[r][c+2] = true;
          valores[r][c] = valores[r][c+1] = valores[r][c+2] = VALORES[board[r][c]] || 10;
        }

    for (let r = 0; r < ROWS - 2; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
          marcar[r][c] = marcar[r+1][c] = marcar[r+2][c] = true;
          valores[r][c] = valores[r+1][c] = valores[r+2][c] = VALORES[board[r][c]] || 10;
        }

    let ganho = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (marcar[r][c]) ganho += valores[r][c];

    if (ganho === 0) return false;
    if (contar) pontos += ganho;

    for (let c = 0; c < COLS; c++) {
      let novaCol = board.map(r => r[c]).filter((_, i) => !marcar[i][c]);
      while (novaCol.length < ROWS) novaCol.unshift(ICONES[Math.floor(Math.random() * ICONES.length)]);
      for (let r = 0; r < ROWS; r++) board[r][c] = novaCol[r];
    }
    return true;
  }

  function trocar(r1, c1, r2, c2) {
    [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    if (!removerCombos()) {
      [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
    } else {
      jogadas++;
      let mudou = true;
      while (mudou) mudou = removerCombos();
      if (jogadas >= MAX_JOGADAS) {
        render();
        jogoAtivo.timers.push(setTimeout(terminar, 400));
        return;
      }
      if (!existeJogadaPossivel()) {
        novaGrade();
        mostrarMensagem("Sem jogadas! Embaralhando...");
      }
    }
    render();
  }

  function render() {
    const restam = MAX_JOGADAS - jogadas;
    arenaConteudo.innerHTML = `
      <div class="m3-wrap">
        <div class="m3-info">
          <span>Pontos: <b id="m3Pontos">${pontos}</b></span>
          <span><b>${restam}</b> jogadas</span>
        </div>
        <div class="m3-grade" id="m3Grade">
          ${board.map((row, r) =>
            row.map((icone, c) => {
              const valor = VALORES[icone] || 10;
              return `<div class="m3-cell ${selected && selected[0]===r && selected[1]===c ? 'm3-sel' : ''}"
                data-r="${r}" data-c="${c}">
                <img src="assets/shop/${icone}.png" class="m3-item" draggable="false">
                <span class="m3-valor">${valor}</span>
              </div>`;
            }).join("")
          ).join("")}
        </div>
        <div class="m3-dica">Toque numa peca e depois numa adjacente pra trocar!</div>
      </div>`;

    document.querySelectorAll(".m3-cell").forEach(el => {
      el.addEventListener("click", () => {
        if (!rodando) return;
        const r = parseInt(el.dataset.r);
        const c = parseInt(el.dataset.c);
        if (!selected) {
          selected = [r, c];
          render();
        } else {
          const [sr, sc] = selected;
          selected = null;
          const adj = (Math.abs(r-sr) + Math.abs(c-sc)) === 1;
          if (adj) trocar(sr, sc, r, c);
          else render();
        }
      });
    });
  }

  function terminar() {
    rodando = false;
    
    ganharMoedas(pontos);
    if (pontos >= 600) desbloquearConquista("match3_mestre");
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        pontos >= 600 ? "Combinacao perfeita!" : "Jogadas esgotadas!",
        "",
        pontos,
        `Voce fez ${pontos} pontos em ${MAX_JOGADAS} jogadas!`,
        jogoMatch3
      );
    }, 600));
  }

  novaGrade();
  render();
}


// ══════════════════════════════════════════════
//   JOGO 8 — PALAVRAS DA HANNA (Wordle)
//   Adivinhe a palavra secreta em 6 tentativas.
//   Verde = certa no lugar, Amarelo = certa fora, Cinza = errada.
//   Recompensa: menos tentativas = mais moedas.
// ══════════════════════════════════════════════

async function jogoPalavras() {
  abrirArena("Palavras da Hanna");

  // Mostra loading enquanto busca
  arenaConteudo.innerHTML = `<div style="text-align:center;padding:40px;color:#fff;font-weight:800;">Carregando...</div>`;

  // Tenta buscar do Firebase, usa local como fallback
  let palavraEscolhida;
  try {
    const { carregarBancoPalavras, palavraAleatoria } = await import("./firebase.js");
    const banco = await carregarBancoPalavras();
    palavraEscolhida = palavraAleatoria(banco);
  } catch(e) {
    const fallback = [
      { palavra: "FOME", tema: "Universo Hanna" },
      { palavra: "SONO", tema: "Universo Hanna" },
      { palavra: "MIAU", tema: "Universo Hanna" },
      { palavra: "GATO", tema: "Universo Hanna" },
      { palavra: "BANHO", tema: "Universo Hanna" },
      { palavra: "FELIZ", tema: "Universo Hanna" },
      { palavra: "ROSA", tema: "Flores" },
      { palavra: "LAVANDA", tema: "Flores" },
    ];
    palavraEscolhida = fallback[Math.floor(Math.random() * fallback.length)];
  }

  const palavra = palavraEscolhida.palavra;
  const tema    = palavraEscolhida.tema;
  const letras  = palavra.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const MAX     = 6;
  let tentativas = [];
  let atual      = "";
  let ganhou     = false;

  function avaliar(tentativa) {
    const t   = tentativa.toUpperCase();
    const res = Array(letras.length).fill("cinza");
    const restantes = letras.split("");

    // Verde
    for (let i = 0; i < letras.length; i++) {
      if (t[i] === letras[i]) { res[i] = "verde"; restantes[i] = null; }
    }
    // Amarelo
    for (let i = 0; i < letras.length; i++) {
      if (res[i] === "verde") continue;
      const idx = restantes.indexOf(t[i]);
      if (idx !== -1) { res[i] = "amarelo"; restantes[idx] = null; }
    }
    return res;
  }

  function render() {
    arenaConteudo.innerHTML = `
      <div class="pw-wrap">
        <div class="pw-info">Adivinhe a palavra de <b>${letras.length}</b> letras!</div>
        <div class="pw-tema">💡 Tema: <b>${tema}</b></div>
        <div class="pw-grade">
          ${Array.from({length: MAX}, (_, ti) => {
            const tent = tentativas[ti];
            if (tent) {
              const av = avaliar(tent);
              return `<div class="pw-linha">
                ${tent.toUpperCase().split("").map((l, i) =>
                  `<div class="pw-cel pw-${av[i]}">${l}</div>`
                ).join("")}
              </div>`;
            }
            if (ti === tentativas.length) {
              const cells = atual.toUpperCase().padEnd(letras.length).split("").slice(0, letras.length);
              return `<div class="pw-linha">
                ${cells.map(l => `<div class="pw-cel pw-atual">${l.trim() || ""}</div>`).join("")}
              </div>`;
            }
            return `<div class="pw-linha">
              ${Array(letras.length).fill('<div class="pw-cel pw-vazia"></div>').join("")}
            </div>`;
          }).join("")}
        </div>
        <div class="pw-teclado">
          ${["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"].map(linha =>
            `<div class="pw-linha-teclado">
              ${linha.split("").map(l =>
                `<button class="pw-tecla" data-l="${l}">${l}</button>`
              ).join("")}
            </div>`
          ).join("")}
          <div class="pw-linha-teclado">
            <button class="pw-tecla pw-enter" id="pwEnter">ENTER</button>
            <button class="pw-tecla pw-del" id="pwDel">⌫</button>
          </div>
        </div>
        ${ganhou || tentativas.length >= MAX ? `<div class="pw-resposta">A palavra era: <b>${palavra}</b></div>` : ""}
      </div>`;

    document.querySelectorAll(".pw-tecla[data-l]").forEach(el => {
      el.addEventListener("click", () => {
        if (ganhou || tentativas.length >= MAX) return;
        if (atual.length < letras.length) { atual += el.dataset.l; render(); }
      });
    });

    document.getElementById("pwDel")?.addEventListener("click", () => {
      atual = atual.slice(0, -1); render();
    });

    document.getElementById("pwEnter")?.addEventListener("click", () => {
      if (atual.length !== letras.length) return;
      tentativas.push(atual);
      const av = avaliar(atual);
      if (av.every(a => a === "verde")) {
        ganhou = true;
        render();
        const recomp = [60, 50, 40, 30, 20, 10][tentativas.length - 1] || 10;
        ganharMoedas(recomp);
        desbloquearConquista("palavra_certa");
        jogoAtivo.timers.push(setTimeout(() => {
          mostrarResultado("Acertou!", "", recomp,
            `"${palavra}" em ${tentativas.length} tentativa${tentativas.length > 1 ? "s" : ""}!`,
            jogoPalavras);
        }, 800));
      } else if (tentativas.length >= MAX) {
        render();
        ganharMoedas(5);
        jogoAtivo.timers.push(setTimeout(() => {
          mostrarResultado("Quase lá!", "", 5,
            `A palavra era "${palavra}". Tente de novo!`, jogoPalavras);
        }, 800));
      } else {
        atual = "";
        render();
      }
    });
  }

  render();
}

// ══════════════════════════════════════════════
//   JOGO 9 — BOLINHA DE LÃ (Pong)
//   Rebata a bolinha com a raquete.
//   Não deixe cair! Cada rebatida = 1 ponto.
//   A bolinha acelera com o tempo.
// ══════════════════════════════════════════════

function jogoBolinha() {
  abrirArena("Bolinha de Lã");

  arenaConteudo.innerHTML = `
    <div class="bl-wrap">
      <div class="bl-info">
        <span>🧶 <b id="blPontos">0</b> rebatidas</span>
        <span id="blStatus">Toque pra começar!</span>
      </div>
      <canvas id="blCanvas" class="bl-canvas"></canvas>
      <div class="bl-dica">Arraste ou toque pra mover a raquete</div>
    </div>`;

  const canvas = document.getElementById("blCanvas");
  const ctx    = canvas.getContext("2d");
  const W      = canvas.offsetWidth  || 320;
  const H      = canvas.offsetHeight || 400;
  canvas.width  = W;
  canvas.height = H;

  const RAQ_W = 80, RAQ_H = 12, BOLA_R = 12;
  let raqX    = W / 2 - RAQ_W / 2;
  let bX      = W / 2, bY = H / 2;
  let bVX     = 3, bVY = -4;
  let pontos  = 0;
  let rodando = false;
  let animId  = null;
  let bonus10Recebido = false;

  function desenhar() {
    ctx.clearRect(0, 0, W, H);

    // Fundo
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    // Raquete
    ctx.fillStyle = "#ff8fc2";
    ctx.beginPath();
    ctx.roundRect(raqX, H - 40, RAQ_W, RAQ_H, 6);
    ctx.fill();

    // Bolinha
    ctx.font = `${BOLA_R * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧶", bX, bY);
  }

  function loop() {
    if (!rodando) return;
    bX += bVX;
    bY += bVY;

    // Paredes laterais
    if (bX - BOLA_R < 0)  { bX = BOLA_R;     bVX = Math.abs(bVX); }
    if (bX + BOLA_R > W)  { bX = W - BOLA_R; bVX = -Math.abs(bVX); }
    // Teto
    if (bY - BOLA_R < 0)  { bY = BOLA_R;     bVY = Math.abs(bVY); }

    // Raquete
    if (bY + BOLA_R >= H - 40 && bY + BOLA_R <= H - 28 &&
        bX >= raqX - 5 && bX <= raqX + RAQ_W + 5) {
      bVY = -Math.abs(bVY);
      bY  = H - 40 - BOLA_R;
      pontos++;
      const el = document.getElementById("blPontos");
      if (el) el.textContent = pontos;
      if (pontos >= 10 && !bonus10Recebido) {
        bonus10Recebido = true;

        ganharMoedas(10);

        mostrarMensagem(
          "Bônus de habilidade! +10 moedas por 10 rebatidas!"
        );
      }
      // Acelera levemente
      const spd = Math.sqrt(bVX*bVX + bVY*bVY);
      const fator = Math.min(1 + pontos * 0.02, 2.2);
      bVX = (bVX / spd) * 4 * fator;
      bVY = (bVY / spd) * 4 * fator;
    }

    // Chão = perdeu
    if (bY - BOLA_R > H) {
      rodando = false;
      const recomp = pontos >= 30 ? 80 : pontos >= 15 ? 50 : pontos >= 7 ? 30 : 10;
      ganharMoedas(recomp);
      if (pontos >= 20) desbloquearConquista("bolinha_mestre");
      cancelAnimationFrame(animId);
      jogoAtivo.timers.push(setTimeout(() => {
        mostrarResultado(
          pontos >= 15 ? "Incrível!" : "Fim de jogo!",
          pontos >= 15 ? "" : "",
          recomp,
          `Você fez ${pontos} rebatidas! ${pontos >= 15 ? "A Hanna ficou impressionada!" : "Tente não deixar cair!"}`,
          jogoBolinha
        );
      }, 600));
      return;
    }

    desenhar();
    animId = requestAnimationFrame(loop);
  }

  // Controle por toque e mouse
  function moverRaquete(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x    = clientX - rect.left;
    raqX = Math.max(0, Math.min(W - RAQ_W, x - RAQ_W / 2));
  }

  canvas.addEventListener("mousemove", e => moverRaquete(e.clientX));
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    moverRaquete(e.touches[0].clientX);
  }, { passive: false });

  canvas.addEventListener("click", () => {
    if (!rodando) {
      rodando = true;
      const el = document.getElementById("blStatus");
      if (el) el.textContent = "Não deixe cair! 🧶";
      loop();
    }
  });

  jogoAtivo.timers.push(setTimeout(() => {
    if (!rodando) return;
  }, 0));

  desenhar();
}

// EVENTO DO FILHOTINHO
function verificarEventoFilhote() {
  // Condições: pedido aceito, vínculo 100%, todos stats acima de 70%
  if (filhoteDesbloqueado) return;
  if (!pedidoAceito) return;
  if (vinculoGatinhas < 90) return;
  if (fome < 70 || felicidade < 70 || energia < 70 || higiene < 70) return;
  if (dataGravidez > 0) return; // já tá grávida

  // 1% de chance por verificação (roda a cada 5 minutos)
  if (Math.random() > 0.01) return;

  mostrarEventoFilhote();
}

function mostrarEventoFilhote() {
  // Se não tiver na home, mostra banner
  if (telaJogo.style.display !== "block") {
    mostrarBannerVisita(
      "assets/sprites/gatinha/gatinha-animada-especial.png",
      "A gatinha quer te falar algo...",
      () => mostrarEventoFilhote()
    );
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "overlayFilhote";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; z-index: 999; gap: 16px; padding: 24px;
  `;

  overlay.innerHTML = `
    <img src="assets/sprites/hanna-gatinha/momento-especial.png" 
         style="width: 180px; image-rendering: pixelated;">
    <div style="
      background: var(--card-bg); border-radius: 16px; padding: 20px;
      text-align: center; max-width: 300px; font-family: var(--font-pixel);
    ">
      <p style="font-size: 11px; color: var(--pink-deep); margin-bottom: 16px; line-height: 1.8;">
        A gatinha olhou pra Hanna com olhinhos brilhando...<br><br>
        <b>"Hanna... e se a gente tivesse um filhotinho?"</b>
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="btnAceitarFilhote" class="btn-principal" style="font-size: 10px;">
          <span>Sim, eu adoraria!</span>
        </button>
        <button id="btnRecusarFilhote" class="btn-secundario" style="font-size: 10px;">
          <span>Ainda não...</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("btnAceitarFilhote").addEventListener("click", () => {
    overlay.remove();
    aceitarFilhote();
  });

  document.getElementById("btnRecusarFilhote").addEventListener("click", () => {
    overlay.remove();
  });
}

function aceitarFilhote() {
  dataGravidez = Date.now();
  generoFilhote = Math.random() > 0.5 ? "femea" : "macho";
  const versoes = ["misto", "gatinha", "hanna"];
  versaoFilhote = versoes[Math.floor(Math.random() * versoes.length)];

  desbloquearConquista("esperando_filhote");
  
  // Gatinha muda de sprite
  if (gatinhaSprite) gatinhaSprite.src = "assets/sprites/gatinha/gatinha-animada-especial.png";
  
  mostrarMensagem("Daqui a 9 dias a família vai crescer!");
  _salvar();
  
  // Inicia verificação de nascimento
  verificarNascimentoFilhote();
}

function verificarNascimentoFilhote() {
  if (!dataGravidez || filhoteDesbloqueado) return;
  
  const noveDias = 9 * 24 * 60 * 60 * 1000;
  const agora = Date.now();
  
  if (agora - dataGravidez >= noveDias) {
    nascerFilhote();
    return;
  }
  
  // Verifica a cada hora
  const restante = (dataGravidez + noveDias) - agora;
  jogoAtivo.timers.push(setTimeout(() => {
    verificarNascimentoFilhote();
  }, Math.min(restante, 60 * 60 * 1000)));
}

function nascerFilhote() {
  // Se não tiver na home, mostra banner
  if (telaJogo.style.display !== "block") {
    mostrarBannerVisita(
      versaoFilhote === "hanna" ? "assets/sprites/filhote/filhote-hanna.png"
      : versaoFilhote === "gatinha" ? "assets/sprites/filhote/filhote-gatinha.png"
      : "assets/sprites/filhote/filhote.png",
      "O filhotinho nasceu! Toque pra conhecer!",
      () => nascerFilhote()
    );
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "overlayNascimento";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; z-index: 999; gap: 16px; padding: 24px;
  `;

  const generoTexto = generoFilhote === "femea" ? "uma menina" : "um menino";

  overlay.innerHTML = `
    <img src="${versaoFilhote === 'hanna' ? 'assets/sprites/filhote/filhote-hanna.png' : versaoFilhote === 'gatinha' ? 'assets/sprites/filhote/filhote-gatinha.png' : 'assets/sprites/filhote/filhote.png'}"
         style="width: 120px; image-rendering: pixelated; animation: idleFloat 3s ease-in-out infinite;">
    <div style="
      background: var(--card-bg); border-radius: 16px; padding: 20px;
      text-align: center; max-width: 300px; font-family: var(--font-pixel);
    ">
      <p style="font-size: 13px; color: var(--pink-deep); margin-bottom: 12px;">
        É ${generoTexto}!
      </p>
      <p style="font-size: 10px; color: var(--text-light); margin-bottom: 16px;">
        Como você vai chamar esse filhotinho?
      </p>
      <input type="text" id="inputNomeFilhote" class="input-cozy" 
             placeholder="Nome do filhotinho" maxlength="15"
             style="margin-bottom: 12px;">
      <button id="btnConfirmarNomeFilhote" class="btn-principal">
        <span>Confirmar</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("btnConfirmarNomeFilhote").addEventListener("click", () => {
    const nome = document.getElementById("inputNomeFilhote").value.trim();
    if (!nome) return;
    
    nomeFilhote = nome;
    filhoteDesbloqueado = true;
    dataGravidez = 0;
    
    overlay.remove();
    exibirFilhote();
    desbloquearConquista("familia_completa");
    mostrarMensagem(`Bem-vindo, ${nomeFilhote}!`);
    _salvar();
  });
}

function exibirFilhote() {
  if (!filhoteDesbloqueado || !nomeFilhote) return;

  const spriteBase = versaoFilhote === "hanna" 
    ? "assets/sprites/filhote/filhote-hanna.png"
    : versaoFilhote === "gatinha"
    ? "assets/sprites/filhote/filhote-gatinha.png"
    : "assets/sprites/filhote/filhote.png";

  if (filhoteContainer) {
    filhoteContainer.style.display = "flex";
    if (filhoteSprite) filhoteSprite.src = spriteBase;
  }
  iniciarIdleFilhote();
}

// MINIGAME: ESCONDE-ESCONDE DO FILHOTINHO
function jogoEscondeEsconde() {
  if (!filhoteDesbloqueado) {
    mostrarMensagem("O filhotinho precisa nascer primeiro!");
    return;
  }

  abrirArena("Esconde-Esconde!");

  const esconderijos = [
    { id: "almofada",  nome: "Almofada",  fechado: "assets/sprites/filhote/esconderijos/almofada.png",  aberto: "assets/sprites/filhote/esconderijos/almofada-aberta.png"  },
    { id: "caixa",     nome: "Caixa",     fechado: "assets/sprites/filhote/esconderijos/caixa.png",     aberto: "assets/sprites/filhote/esconderijos/caixa-aberta.png"     },
    { id: "cortina",   nome: "Cortina",   fechado: "assets/sprites/filhote/esconderijos/cortina.png",   aberto: "assets/sprites/filhote/esconderijos/cortina-aberta.png"   },
    { id: "cobertor",  nome: "Cobertor",  fechado: "assets/sprites/filhote/esconderijos/cobertor.png",  aberto: "assets/sprites/filhote/esconderijos/cobertor-aberto.png"  },
  ];

  const falas = [
    "Me pegaram!",
    "Nao acredito!",
    "Como voce me achou?!",
    "Nao vale!",
    "Eu tava tao bem escondido!",
    "Isso e injusto!",
  ];

  const falasEscapou = [
    "Hahaha nao me achou!",
    "Sou imbativel!",
    "Tente de novo!",
    "Muito facil pra mim!",
  ];

  let rodada    = 0;
  let pontos    = 0;
  let acertos   = 0;
  const TOTAL   = 8;

  function novaRodada() {
    if (rodada >= TOTAL) {
      terminar();
      return;
    }

    rodada++;

    // Escolhe esconderijo correto aleatoriamente
    const correto = esconderijos[Math.floor(Math.random() * esconderijos.length)];

    // Embaralha os 4 esconderijos
    const opcoes = [...esconderijos].sort(() => Math.random() - 0.5);

    let tempoRestante = 30;
    let encontrou = false;

    arenaConteudo.innerHTML = `
      <div class="esconde-wrap">
        <div class="esconde-hud">
          <span>Rodada <b>${rodada}</b>/${TOTAL}</span>
          <span>Acertos: <b>${acertos}</b></span>
          <span>Tempo: <b id="escondeTimer">30</b>s</span>
        </div>
        <img src="assets/backgrounds/esconde-esconde.png" class="esconde-bg">
        <div class="esconde-fala" id="escondeFala">Onde eu estou?</div>
        <div class="esconde-grid" id="escondeGrid">
          ${opcoes.map(e => `
            <div class="esconde-item" data-id="${e.id}" style="position:relative;">
              <img src="${e.fechado}" class="esconde-sprite">
              <img src="assets/sprites/filhote/filhote.png" 
                  class="esconde-filhote-oculto" 
                  style="display:none; position:absolute; bottom:30px; left:50%; transform:translateX(-50%); width:50px; image-rendering:pixelated; pointer-events:none;">
              <span class="esconde-nome">${e.nome}</span>
            </div>
          `).join("")}
        </div>
        <div class="esconde-score">
          <span>Pontos: <b id="escondePontos">${pontos}</b></span>
        </div>
      </div>`;

    // Timer
    const timerEl = document.getElementById("escondeTimer");
    const timerInterval = setInterval(() => {
      tempoRestante--;
      if (timerEl) timerEl.textContent = tempoRestante;
      if (tempoRestante <= 0) {
        clearInterval(timerInterval);
        if (!encontrou) {
          // Tempo esgotado — revela onde estava
          const fala = falasEscapou[Math.floor(Math.random() * falasEscapou.length)];
          const falaEl = document.getElementById("escondeFala");
          const filhoteEl = document.getElementById("escondeFilhote");
          if (falaEl) falaEl.textContent = fala;
          if (filhoteEl) filhoteEl.src = "assets/sprites/filhote/filhote-escapou.png";

          // Revela o esconderijo correto
          document.querySelectorAll(".esconde-item").forEach(el => {
            if (el.dataset.id === correto.id) {
              el.querySelector("img.esconde-sprite").src = correto.aberto;
              const filhoteOculto = el.querySelector(".esconde-filhote-oculto");
              if (filhoteOculto) {
                filhoteOculto.src = "assets/sprites/filhote/filhote-escapou.png";
                filhoteOculto.style.display = "block";
              }
              el.classList.add("esconde-correto");
            }
            el.style.pointerEvents = "none";
          });

          jogoAtivo.timers.push(setTimeout(novaRodada, 2000));
        }
      }
    }, 1000);
    jogoAtivo.intervals.push(timerInterval);

    // Cliques nos esconderijos
    document.querySelectorAll(".esconde-item").forEach(el => {
      el.addEventListener("click", () => {
        if (encontrou) return;

        const acertou = el.dataset.id === correto.id;

        if (acertou) {
          encontrou = true;
          clearInterval(timerInterval);

          const ganho = tempoRestante >= 20 ? 15 : tempoRestante >= 10 ? 10 : 5;
          pontos += ganho;
          acertos++;

          const fala = falas[Math.floor(Math.random() * falas.length)];
          const falaEl = document.getElementById("escondeFala");
          const pontosEl = document.getElementById("escondePontos");

          if (falaEl) falaEl.textContent = fala;
          if (pontosEl) pontosEl.textContent = pontos;

          // Mostra o filhotinho saindo do esconderijo correto
          el.querySelector("img.esconde-sprite").src = correto.aberto;
          const filhoteOculto = el.querySelector(".esconde-filhote-oculto");
          if (filhoteOculto) {
            filhoteOculto.src = "assets/sprites/filhote/filhote-pego.png";
            filhoteOculto.style.display = "block";
          }
          el.classList.add("esconde-correto");
          el.style.animation = "sacudir 0.4s ease";

          document.querySelectorAll(".esconde-item").forEach(i => i.style.pointerEvents = "none");
          jogoAtivo.timers.push(setTimeout(novaRodada, 2000));

        } else {
          // Errou — sacude o errado
          el.style.animation = "sacudir 0.4s ease";
          setTimeout(() => el.style.animation = "", 400);
        }
      });
    });
  }

  function terminar() {
    if (acertos >= 7) desbloquearConquista("esconde_mestre");
    const recomp = acertos >= 7 ? 80 : acertos >= 5 ? 50 : acertos >= 3 ? 30 : 15;
    ganharMoedas(recomp);
    jogoAtivo.timers.push(setTimeout(() => {
      mostrarResultado(
        acertos >= 7 ? "Especialista em esconde-esconde!" : acertos >= 5 ? "Quase la!" : "O filhotinho ganhou!",
        "",
        recomp,
        `Voce achou o filhotinho ${acertos} de ${TOTAL} vezes!`,
        jogoEscondeEsconde
      );
    }, 600));
  }

  novaRodada();
}

// ROLETA DIÁRIA
const PREMIOS_ROLETA = [
  { nome: "Novelo",          sprite: "assets/shop/novelo.png",                        cor: "#ff8fc2", tipo: "item",    valor: "novelo",    quantidade: 1  },
  { nome: "Ratinho",         sprite: "assets/shop/ratinho.png",                       cor: "#ffb347", tipo: "item",    valor: "ratinho",   quantidade: 1  },
  { nome: "Peixe",           sprite: "assets/shop/peixe.png",                         cor: "#87ceeb", tipo: "item",    valor: "peixe",     quantidade: 1  },
  { nome: "10 Sementes",     sprite: "assets/shop/pacote-sementes.png",               cor: "#98fb98", tipo: "semente", valor:                          10 },
  { nome: "Coleira",         sprite: "assets/shop/coleira.png",                       cor: "#dda0dd", tipo: "item",    valor: "coleira",   quantidade: 1  },
  { nome: "Caixa Misteriosa",sprite: "assets/shop/caixa.png",                         cor: "#ffd700", tipo: "caixa",   valor: "caixa"                     },
  { nome: "5000 Moedas",     sprite: "assets/sprites/hanna/hanna-rica.png",           cor: "#ffa500", tipo: "moedas",  valor: 5000                        },
  { nome: "Semente Dourada", sprite: "assets/sprites/hanna/hanna-semente-dourada.png",cor: "#ff6347", tipo: "dourada", valor: 1                           },
];

function verificarRoletaDiaria() {
  const ultimaRoleta = Number(localStorage.getItem("ultimaRoleta")) || 0;
  const agora = Date.now();
  const umDia = 24 * 60 * 60 * 1000;
  if (agora - ultimaRoleta >= umDia) {
    setTimeout(() => mostrarRoleta(), 1500);
  }
}

function mostrarRoleta() {
  const overlay = document.getElementById("overlayRoleta");
  if (!overlay) return;
  overlay.style.display = "flex";

  const canvas = document.getElementById("roletaCanvas");
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const raio = cx - 10;
  const total = PREMIOS_ROLETA.length;
  const anguloPorFatia = (2 * Math.PI) / total;
  const anguloInicial = -Math.PI / 2; // seta no topo

  function desenharRoleta(rotacao) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    PREMIOS_ROLETA.forEach((premio, i) => {
      const inicio = rotacao + anguloInicial + i * anguloPorFatia;
      const fim = inicio + anguloPorFatia;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, raio, inicio, fim);
      ctx.closePath();
      ctx.fillStyle = premio.cor;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(inicio + anguloPorFatia / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "right";
      ctx.fillText(premio.nome, raio - 10, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#ff8fc2";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  desenharRoleta(0);

  let girando = false;

  document.getElementById("btnGirarRoleta").onclick = () => {
    if (girando) return;
    girando = true;
    document.getElementById("btnGirarRoleta").style.display = "none";

    const pesos = [15, 15, 15, 15, 15, 10, 10, 5];
    const pool = [];
    PREMIOS_ROLETA.forEach((p, i) => {
      for (let j = 0; j < pesos[i]; j++) pool.push(i);
    });
    const idxSorteado = pool[Math.floor(Math.random() * pool.length)];
    console.log("Sorteado idx:", idxSorteado, "Nome:", PREMIOS_ROLETA[idxSorteado].nome);

    const somCamp = criarAudio("assets/music/som-campainha.mp3");

    const voltas = 5 + Math.random() * 3;
    // Gira um número aleatório de voltas + ângulo aleatório
    const anguloFinal = (2 * Math.PI * (5 + Math.floor(Math.random() * 3))) + (Math.random() * 2 * Math.PI);
    const duracao = 4000;
    const inicio = performance.now();

    function animar(agora) {
      const elapsed = agora - inicio;
      const progresso = Math.min(elapsed / duracao, 1);
      const ease = 1 - Math.pow(1 - progresso, 4);
      const rotacaoAtual = ease * anguloFinal;
      desenharRoleta(rotacaoAtual);

      if (progresso < 1) {
        requestAnimationFrame(animar);
      } else {
        // Lê qual fatia tá na seta (topo)
        const rotacaoNormalizada = ((rotacaoAtual % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const anguloSeta = (2 * Math.PI - rotacaoNormalizada) % (2 * Math.PI);
        const idxReal = Math.floor(anguloSeta / anguloPorFatia) % total;

        somCamp.currentTime = 0;
        somCamp.volume = parseFloat(volumeEfeitos.value);
        somCamp.play().catch(() => {});

        const premio = PREMIOS_ROLETA[idxReal];
        console.log("idx real:", idxReal, "premio:", premio.nome);
        entregarPremioProleta(premio);

        document.getElementById("roletaPremioSprite").src = premio.sprite;
        document.getElementById("roletaPremioTexto").textContent = `Voce ganhou: ${premio.nome}!`;
        document.getElementById("roletaPremio").style.display = "flex";

        localStorage.setItem("ultimaRoleta", Date.now());
      }
    }

    requestAnimationFrame(animar);
  };

  document.getElementById("btnFecharRoleta").onclick = () => {
    overlay.style.display = "none";
  };
}

function entregarPremioProleta(premio) {
  switch (premio.tipo) {
    case "moedas":
      moedas += premio.valor;
      mostrarMensagem(`+${premio.valor} moedas!`);
      break;
    case "semente":
      sementes += premio.valor;
      mostrarMensagem(`+${premio.valor} sementes!`);
      break;
    case "dourada":
      sementesDouradas += premio.valor;
      mostrarMensagem("Semente Dourada conquistada!");
      break;
    case "caixa":
      setTimeout(() => abrirCaixa(), 1000);
      break;
    case "item":
      // Usa os valores da caixa misteriosa
      const efeitos = {
        novelo:  () => { felicidade = Math.min(100, felicidade + 15); mostrarMensagem("Hanna adorou o novelo!"); },
        ratinho: () => { felicidade = Math.min(100, felicidade + 30); mostrarMensagem("Hanna ficou animada!"); },
        peixe:   () => { fome = Math.min(100, fome + 20); mostrarMensagem("Que peixinho gostoso!"); },
        coleira: () => { felicidade = Math.min(100, felicidade + 40); vinculoGatinhas = Math.min(100, vinculoGatinhas + 5); mostrarMensagem("Coleirinha nova!"); },
      };
      if (efeitos[premio.valor]) efeitos[premio.valor]();
      break;
  }
  atualizarStatus();
  _salvar();
}