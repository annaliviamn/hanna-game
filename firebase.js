// ── FIREBASE CONFIG ──────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ── ID ANÔNIMO POR DISPOSITIVO ───────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem("hannaDeviceId");
  if (!id) {
    id = "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("hannaDeviceId", id);
  }
  return id;
}

// ── SALVAR PROGRESSO NA NUVEM ────────────────────────────────
export async function salvarProgressoNuvem(dados) {
  try {
    const id = getDeviceId();
    await setDoc(doc(db, "saves", id), {
      ...dados,
      updatedAt: Date.now()
    });
  } catch (e) {}
}

// ── CARREGAR PROGRESSO DA NUVEM ──────────────────────────────
export async function carregarProgressoNuvem() {
  try {
    const id   = getDeviceId();
    const snap = await getDoc(doc(db, "saves", id));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    return null;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyDR0Dx0HCn1qGSoQB5iQENPwEfVbsUXHd0",
  authDomain: "hanna-game.firebaseapp.com",
  projectId: "hanna-game",
  storageBucket: "hanna-game.firebasestorage.app",
  messagingSenderId: "350753310505",
  appId: "1:350753310505:web:357dec557ac9dcb2021938"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── BANCO DE PALAVRAS ────────────────────────────────────────
// Regras: Wordle = 4-6 letras | Caça-palavras = máx 10 letras por palavra
const BANCO_LOCAL = {

  wordle: [
    // 🎮 Universo Hanna (4-6 letras)
    "HANNA","GATO","AMOR","PATA","MIAU","FOME","SONO","LOJA",
    "BANHO","FELIZ","FLOR","ROSA","PURR","FESTA","CHUVA",
    "MOEDA","JAMES","STEVE","JOAO","NOVELO","PETISCO",
    "SASHIMI","VARINHA","COLEIRA","CARINHO",

    // 🎵 Música (4-6 letras)
    "PAGODE","SAMBA","METAL","KPOP","TRAP","MPB","POP",
    "PABLO","ALCEU","LETRA","RITMO","VOCAL","BANDA","VERSO",
    "FORRÓ","BREGA","SERTAO","BAILE","SHOW","CORAL",

    // 🎮 Games (4-6 letras)
    "LEVEL","BOSS","ARENA","PIXEL","QUEST","CRAFT","FASE",
    "VIDA","ARMA","MAPA","PAUSA","TURNO","COMBO","RANK",

    // 🐾 Pets (4-6 letras)
    "GATO","PEIXE","CAUDA","PELO","LATIDO","RONROM","RACAO",
    "MIMO","ADOTAR","FOCINHO","PATINHA",

    // 🌸 Flores (4-6 letras)
    "ROSA","TULIPA","LIRIO","DALIA","JASMIM","PETALA","AROMA",
    "VASO","JARDIM","FLORAL","CRAVO","CAULE","HASTE",

    // 🎬 Filmes e Séries (4-6 letras)
    "TERROR","DRAMA","CENAS","OSCAR","TELA","ELENCO","ATRIZ",
    "ATOR","ROTEIRO","SERIE","SKINS","LOST","TRONO","ZUMBI",
    "ROSS","RACHEL","MONICA","ELEVEN","WALTER",

    // 🔭 Ciências (4-6 letras)
    "ATOMO","CELULA","GENE","DNA","ORBITA","LUA","SOL","MARTE",
    "VENUS","COMETA","ACIDO","ENERGIA","MASSA","CALOR","ONDA",

    // 📼 Anos 2000 (4-6 letras)
    "ORKUT","MSN","CD","DVD","MTV","IPOD","CLIPE","BANDA",
    "ANIME","NOKIA","FLASH","VIRAL","NICK","BLOG",
  ],

  cacapalavras: [
    // Tema: Universo Hanna
    ["HANNA","GATO","AMOR","PATA","MIAU","FOME","SONO","LOJA"],
    ["FAZENDA","BANHO","FELIZ","CARINHO","MOEDA","FLOR","ROSA","PURR"],
    ["GATINHA","SEMENTE","VINCULO","PETISCO","NOVELO","FESTA","CHUVA","LACO"],
    ["JAMES","STEVE","JOAO","HANNA","GATO","AMOR","PATA","MIAU"],
    ["COLEIRA","NOVELO","RATINHO","SASHIMI","VARINHA","DONUT","ATUM","BISCOITO"],

    // Tema: Música geral
    ["PAGODE","SAMBA","METAL","KPOP","TRAP","MPB","POP","FORRO"],
    ["BREGA","PISADA","NUMETAL","SERTAO","BAILE","VOCAL","BANDA","CORAL"],

    // Tema: Artistas (máx 10 letras)
    ["ALCIONE","ANAVITO","PABLO","LEGIAO","ALCEU","VITTAR","SABRINA","GONZAGA"],
    ["PARAMORE","DEMI","RIHANNA","MILEY","BRITNEY","SZA","ARIANA","SELENA"],
    ["BIEBER","CALCINHA","JOAOGOMES","PITTY","GALCOSTA","KATSEYE","OLIVIADEAN","LINKIN"],

    // Tema: Games (máx 10 letras)
    ["COD","SURVIVAL","CRAFT","QUEST","LEVEL","BOSS","ARENA","PIXEL"],
    ["HELLOKITTY","LASTOFUS","STARDEW","HOLLOW","RESIDENT","ASSASSIN","WALKING","CANDY"],

    // Tema: Pets
    ["GATO","CAO","PEIXE","HAMSTER","PAPAGAIO","CAUDA","RONROM","LATIDO"],
    ["ADOTAR","RACAO","COLEIRA","BANHO","CARINHO","MIMO","FOCINHO","PATINHA"],

    // Tema: Flores
    ["ROSA","GIRASSOL","TULIPA","ORQUIDEA","MARGARIDA","LAVANDA","LIRIO","DALIA"],
    ["VIOLETA","JASMIM","PEONIA","CAMELIA","PETALA","AROMA","JARDIM","FLORAL"],

    // Tema: Séries
    ["FRIENDS","SKINS","LOST","EUPHORIA","HANNA","BREAKING","WALKING","STRANGER"],
    ["HAWKINS","CORDELIA","WESTEROS","JACKSON","ROSS","RACHEL","MONICA","CHANDLER"],
    ["JOEY","PHOEBE","WALTER","JESSE","ELEVEN","BILLY","STEVE","SHANE"],

    // Tema: Filmes
    ["TERROR","SUSPENSE","COMEDIA","ROMANCE","CULT","ROTEIRO","ELENCO","OSCAR"],
    ["ACAO","DRAMA","MISTERIO","THRILLER","FANTASIA","ANIMACAO","MUSICAL","FICCAO"],

    // Tema: Astronomia
    ["PLANETA","ESTRELA","COMETA","GALAXIA","SATELITE","ORBITA","LUA","SOL"],
    ["MARTE","VENUS","MERCURIO","JUPITER","SATURNO","URANO","NETUNO","PLUTAO"],

    // Tema: Química
    ["ATOMO","MOLECULA","ENERGIA","MISTURA","ELEMENTO","OXIGENIO","CARBONO","ACIDO"],
    ["REACAO","SOLUCAO","CALCIO","SODIO","FERRO","OURO","PRATA","COBRE"],

    // Tema: Biologia
    ["CELULA","GENE","TECIDO","ORGAO","ESPECIE","ANIMAL","PLANTA","DNA"],
    ["EVOLUCAO","BACTERIA","VIRUS","FUNGO","ALGA","MUSGO","RAIZ","FOLHA"],

    // Tema: Anos 2000
    ["ORKUT","MSN","FLOGAO","WEBCAM","EMOTICON","NICK","LANHOUSE","DOWNLOAD"],
    ["MP3","IPOD","CD","DVD","CLIPE","MTV","BANDA","RADIO"],
    ["NOVELA","SERIADO","DISNEY","NICKEL","REALITY","ANIME","POKEMON","YUGIOH"],
    ["CELULAR","GAMEBOY","CAMERA","CONTROLE","NINTENDO","PENDRIVE","TECLADO","DISCMAN"],

    // Tema: Divas Pop
    ["BEYONCE","RIHANNA","MADONNA","MARIAH","WHITNEY","BRITNEY","GAGA","ARIANA"],
    ["TAYLOR","KATY","SELENA","MILEY","DEMI","CAMILA","LIZZO","ADELE"],
  ],
};

// Cache em memória
let _cache = null;

// ── BUSCAR DO FIRESTORE ──────────────────────────────────────
export async function carregarBancoPalavras() {
  if (_cache) return _cache;

  try {
    const snap = await getDoc(doc(db, "config", "palavras"));
    if (snap.exists()) {
      _cache = snap.data();
      console.log("✅ Banco carregado do Firebase!");
      return _cache;
    } else {
      await setDoc(doc(db, "config", "palavras"), BANCO_LOCAL);
      _cache = BANCO_LOCAL;
      console.log("✅ Banco criado no Firebase!");
      return _cache;
    }
  } catch (e) {
    console.warn("⚠️ Offline, usando banco local:", e.message);
    _cache = BANCO_LOCAL;
    return _cache;
  }
}

export function palavraAleatoria(banco) {
  const lista = banco.wordle || BANCO_LOCAL.wordle;
  const filtradas = lista.filter(p => {
    const sem = p.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return sem.length >= 4 && sem.length <= 6;
  });
  return filtradas[Math.floor(Math.random() * filtradas.length)];
}

export function listaAleatoriaCaca(banco) {
  const listas = banco.cacapalavras || BANCO_LOCAL.cacapalavras;
  return listas[Math.floor(Math.random() * listas.length)];
}