// ── FIREBASE CONFIG ──────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

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
const auth = getAuth(app);

// ── CRIAR CONTA ──────────────────────────────────────────────
export async function criarConta(email, senha) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    return { ok: true, uid: cred.user.uid };
  } catch(e) {
    const erros = {
      "auth/email-already-in-use": "Esse email já está em uso.",
      "auth/invalid-email": "Email inválido.",
      "auth/weak-password": "Senha muito fraca. Use pelo menos 6 caracteres.",
    };
    return { ok: false, erro: erros[e.code] || "Erro ao criar conta." };
  }
}

// ── ENTRAR COM CONTA ─────────────────────────────────────────
export async function entrarComConta(email, senha) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const uid  = cred.user.uid;
    const snap = await getDoc(doc(db, "saves", uid));
    const dados = snap.exists() ? snap.data() : null;
    localStorage.setItem("hannaUid", uid);
    return { ok: true, dados, uid };
  } catch(e) {
    const erros = {
      "auth/invalid-credential": "Email ou senha incorretos.",
      "auth/user-not-found": "Usuária não encontrada.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/invalid-email": "Email inválido.",
    };
    return { ok: false, erro: erros[e.code] || "Erro ao entrar." };
  }
}

// ── RECUPERAR SENHA ───────────────────────────────────────────
export async function recuperarSenha(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch(e) {
    return { ok: false, erro: "Erro ao enviar email de recuperação." };
  }
}

// ── SALVAR PROGRESSO NA NUVEM ────────────────────────────────
export async function salvarProgressoNuvem(dados) {
  try {
    const uid = localStorage.getItem("hannaUid");
    if (!uid) return;
    await setDoc(doc(db, "saves", uid), {
      ...dados,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {}
}

// ── CARREGAR PROGRESSO DA NUVEM ──────────────────────────────
export async function carregarProgressoNuvem() {
  try {
    const uid  = localStorage.getItem("hannaUid");
    if (!uid) return null;
    const snap = await getDoc(doc(db, "saves", uid));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    return null;
  }
}

// ── VERIFICAR SE JÁ TÁ LOGADA ────────────────────────────────
export function verificarSessao(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem("hannaUid", user.uid);
      callback(user.uid);
    } else {
      localStorage.removeItem("hannaUid");
      callback(null);
    }
  });
}

// ── BANCO DE PALAVRAS ────────────────────────────────────────
const BANCO_LOCAL = {
  wordle: [
    { palavra: "HANNA",   tema: "Universo Hanna" },
    { palavra: "GATO",    tema: "Universo Hanna" },
    { palavra: "AMOR",    tema: "Universo Hanna" },
    { palavra: "PATA",    tema: "Universo Hanna" },
    { palavra: "MIAU",    tema: "Universo Hanna" },
    { palavra: "FOME",    tema: "Universo Hanna" },
    { palavra: "SONO",    tema: "Universo Hanna" },
    { palavra: "LOJA",    tema: "Universo Hanna" },
    { palavra: "BANHO",   tema: "Universo Hanna" },
    { palavra: "FELIZ",   tema: "Universo Hanna" },
    { palavra: "FLOR",    tema: "Universo Hanna" },
    { palavra: "ROSA",    tema: "Universo Hanna" },
    { palavra: "PURR",    tema: "Universo Hanna" },
    { palavra: "FESTA",   tema: "Universo Hanna" },
    { palavra: "CHUVA",   tema: "Universo Hanna" },
    { palavra: "MOEDA",   tema: "Universo Hanna" },
    { palavra: "JAMES",   tema: "Universo Hanna" },
    { palavra: "STEVE",   tema: "Universo Hanna" },
    { palavra: "JOAO",    tema: "Universo Hanna" },
    { palavra: "NOVELO",  tema: "Universo Hanna" },
    { palavra: "PETISCO", tema: "Universo Hanna" },
    { palavra: "SASHIMI", tema: "Universo Hanna" },
    { palavra: "VARINHA", tema: "Universo Hanna" },
    { palavra: "COLEIRA", tema: "Universo Hanna" },
    { palavra: "CARINHO", tema: "Universo Hanna" },
    { palavra: "PAGODE", tema: "Música" },
    { palavra: "SAMBA",  tema: "Música" },
    { palavra: "METAL",  tema: "Música" },
    { palavra: "KPOP",   tema: "Música" },
    { palavra: "TRAP",   tema: "Música" },
    { palavra: "MPB",    tema: "Música" },
    { palavra: "POP",    tema: "Música" },
    { palavra: "PABLO",  tema: "Música" },
    { palavra: "ALCEU",  tema: "Música" },
    { palavra: "LETRA",  tema: "Música" },
    { palavra: "RITMO",  tema: "Música" },
    { palavra: "VOCAL",  tema: "Música" },
    { palavra: "BANDA",  tema: "Música" },
    { palavra: "VERSO",  tema: "Música" },
    { palavra: "FORRÓ",  tema: "Música" },
    { palavra: "BREGA",  tema: "Música" },
    { palavra: "SERTAO", tema: "Música" },
    { palavra: "BAILE",  tema: "Música" },
    { palavra: "SHOW",   tema: "Música" },
    { palavra: "CORAL",  tema: "Música" },
    { palavra: "LEVEL", tema: "Games" },
    { palavra: "BOSS",  tema: "Games" },
    { palavra: "ARENA", tema: "Games" },
    { palavra: "PIXEL", tema: "Games" },
    { palavra: "QUEST", tema: "Games" },
    { palavra: "CRAFT", tema: "Games" },
    { palavra: "FASE",  tema: "Games" },
    { palavra: "VIDA",  tema: "Games" },
    { palavra: "ARMA",  tema: "Games" },
    { palavra: "MAPA",  tema: "Games" },
    { palavra: "PAUSA", tema: "Games" },
    { palavra: "TURNO", tema: "Games" },
    { palavra: "COMBO", tema: "Games" },
    { palavra: "RANK",  tema: "Games" },
    { palavra: "GATO",     tema: "Pets" },
    { palavra: "PEIXE",    tema: "Pets" },
    { palavra: "CAUDA",    tema: "Pets" },
    { palavra: "PELO",     tema: "Pets" },
    { palavra: "LATIDO",   tema: "Pets" },
    { palavra: "RONROM",   tema: "Pets" },
    { palavra: "RACAO",    tema: "Pets" },
    { palavra: "MIMO",     tema: "Pets" },
    { palavra: "ADOTAR",   tema: "Pets" },
    { palavra: "FOCINHO",  tema: "Pets" },
    { palavra: "PATINHA",  tema: "Pets" },
    { palavra: "ROSA",   tema: "Flores" },
    { palavra: "TULIPA", tema: "Flores" },
    { palavra: "LIRIO",  tema: "Flores" },
    { palavra: "DALIA",  tema: "Flores" },
    { palavra: "JASMIM", tema: "Flores" },
    { palavra: "PETALA", tema: "Flores" },
    { palavra: "AROMA",  tema: "Flores" },
    { palavra: "VASO",   tema: "Flores" },
    { palavra: "JARDIM", tema: "Flores" },
    { palavra: "FLORAL", tema: "Flores" },
    { palavra: "CRAVO",  tema: "Flores" },
    { palavra: "CAULE",  tema: "Flores" },
    { palavra: "HASTE",  tema: "Flores" },
    { palavra: "TERROR",  tema: "Filmes e Séries" },
    { palavra: "DRAMA",   tema: "Filmes e Séries" },
    { palavra: "CENAS",   tema: "Filmes e Séries" },
    { palavra: "OSCAR",   tema: "Filmes e Séries" },
    { palavra: "TELA",    tema: "Filmes e Séries" },
    { palavra: "ELENCO",  tema: "Filmes e Séries" },
    { palavra: "ATRIZ",   tema: "Filmes e Séries" },
    { palavra: "ATOR",    tema: "Filmes e Séries" },
    { palavra: "ROTEIRO", tema: "Filmes e Séries" },
    { palavra: "SERIE",   tema: "Filmes e Séries" },
    { palavra: "SKINS",   tema: "Filmes e Séries" },
    { palavra: "LOST",    tema: "Filmes e Séries" },
    { palavra: "TRONO",   tema: "Filmes e Séries" },
    { palavra: "ZUMBI",   tema: "Filmes e Séries" },
    { palavra: "ROSS",    tema: "Filmes e Séries" },
    { palavra: "RACHEL",  tema: "Filmes e Séries" },
    { palavra: "MONICA",  tema: "Filmes e Séries" },
    { palavra: "ELEVEN",  tema: "Filmes e Séries" },
    { palavra: "WALTER",  tema: "Filmes e Séries" },
    { palavra: "ATOMO",   tema: "Ciências" },
    { palavra: "CELULA",  tema: "Ciências" },
    { palavra: "GENE",    tema: "Ciências" },
    { palavra: "DNA",     tema: "Ciências" },
    { palavra: "ORBITA",  tema: "Ciências" },
    { palavra: "LUA",     tema: "Ciências" },
    { palavra: "SOL",     tema: "Ciências" },
    { palavra: "MARTE",   tema: "Ciências" },
    { palavra: "VENUS",   tema: "Ciências" },
    { palavra: "COMETA",  tema: "Ciências" },
    { palavra: "ACIDO",   tema: "Ciências" },
    { palavra: "ENERGIA", tema: "Ciências" },
    { palavra: "MASSA",   tema: "Ciências" },
    { palavra: "CALOR",   tema: "Ciências" },
    { palavra: "ONDA",    tema: "Ciências" },
    { palavra: "ORKUT", tema: "Anos 2000" },
    { palavra: "MSN",   tema: "Anos 2000" },
    { palavra: "CD",    tema: "Anos 2000" },
    { palavra: "DVD",   tema: "Anos 2000" },
    { palavra: "MTV",   tema: "Anos 2000" },
    { palavra: "IPOD",  tema: "Anos 2000" },
    { palavra: "CLIPE", tema: "Anos 2000" },
    { palavra: "BANDA", tema: "Anos 2000" },
    { palavra: "ANIME", tema: "Anos 2000" },
    { palavra: "NOKIA", tema: "Anos 2000" },
    { palavra: "FLASH", tema: "Anos 2000" },
    { palavra: "VIRAL", tema: "Anos 2000" },
    { palavra: "NICK",  tema: "Anos 2000" },
    { palavra: "BLOG",  tema: "Anos 2000" },
  ],
  cacapalavras: [
    "HANNA,GATO,AMOR,PATA,MIAU,FOME,SONO,LOJA",
    "FAZENDA,BANHO,FELIZ,CARINHO,MOEDA,FLOR,ROSA,PURR",
    "GATINHA,SEMENTE,VINCULO,PETISCO,NOVELO,FESTA,CHUVA,LACO",
    "JAMES,STEVE,JOAO,HANNA,GATO,AMOR,PATA,MIAU",
    "COLEIRA,NOVELO,RATINHO,SASHIMI,VARINHA,DONUT,ATUM,BISCOITO",
    "PAGODE,SAMBA,METAL,KPOP,TRAP,MPB,POP,FORRO",
    "BREGA,PISADA,NUMETAL,SERTAO,BAILE,VOCAL,BANDA,CORAL",
    "ALCIONE,ANAVITO,PABLO,LEGIAO,ALCEU,VITTAR,SABRINA,GONZAGA",
    "PARAMORE,DEMI,RIHANNA,MILEY,BRITNEY,SZA,ARIANA,SELENA",
    "BIEBER,CALCINHA,JOAOGOMES,PITTY,GALCOSTA,KATSEYE,OLIVIADEAN,LINKIN",
    "COD,SURVIVAL,CRAFT,QUEST,LEVEL,BOSS,ARENA,PIXEL",
    "HELLOKITTY,LASTOFUS,STARDEW,HOLLOW,RESIDENT,ASSASSIN,WALKING,CANDY",
    "GATO,CAO,PEIXE,HAMSTER,PAPAGAIO,CAUDA,RONROM,LATIDO",
    "ADOTAR,RACAO,COLEIRA,BANHO,CARINHO,MIMO,FOCINHO,PATINHA",
    "ROSA,GIRASSOL,TULIPA,ORQUIDEA,MARGARIDA,LAVANDA,LIRIO,DALIA",
    "VIOLETA,JASMIM,PEONIA,CAMELIA,PETALA,AROMA,JARDIM,FLORAL",
    "FRIENDS,SKINS,LOST,EUPHORIA,HANNA,BREAKING,WALKING,STRANGER",
    "HAWKINS,CORDELIA,WESTEROS,JACKSON,ROSS,RACHEL,MONICA,CHANDLER",
    "JOEY,PHOEBE,WALTER,JESSE,ELEVEN,BILLY,STEVE,SHANE",
    "TERROR,SUSPENSE,COMEDIA,ROMANCE,CULT,ROTEIRO,ELENCO,OSCAR",
    "ACAO,DRAMA,MISTERIO,THRILLER,FANTASIA,ANIMACAO,MUSICAL,FICCAO",
    "PLANETA,ESTRELA,COMETA,GALAXIA,SATELITE,ORBITA,LUA,SOL",
    "MARTE,VENUS,MERCURIO,JUPITER,SATURNO,URANO,NETUNO,PLUTAO",
    "ATOMO,MOLECULA,ENERGIA,MISTURA,ELEMENTO,OXIGENIO,CARBONO,ACIDO",
    "REACAO,SOLUCAO,CALCIO,SODIO,FERRO,OURO,PRATA,COBRE",
    "CELULA,GENE,TECIDO,ORGAO,ESPECIE,ANIMAL,PLANTA,DNA",
    "EVOLUCAO,BACTERIA,VIRUS,FUNGO,ALGA,MUSGO,RAIZ,FOLHA",
    "ORKUT,MSN,FLOGAO,WEBCAM,EMOTICON,NICK,LANHOUSE,DOWNLOAD",
    "MP3,IPOD,CD,DVD,CLIPE,MTV,BANDA,RADIO",
    "NOVELA,SERIADO,DISNEY,NICKEL,REALITY,ANIME,POKEMON,YUGIOH",
    "CELULAR,GAMEBOY,CAMERA,CONTROLE,NINTENDO,PENDRIVE,TECLADO,DISCMAN",
    "BEYONCE,RIHANNA,MADONNA,MARIAH,WHITNEY,BRITNEY,GAGA,ARIANA",
    "TAYLOR,KATY,SELENA,MILEY,DEMI,CAMILA,LIZZO,ADELE",
  ],
};

let _cache = null;

export async function carregarBancoPalavras() {
  if (_cache) return _cache;
  try {
    const snap = await getDoc(doc(db, "config", "palavras"));
    if (snap.exists()) {
      _cache = snap.data();
      return _cache;
    } else {
      await setDoc(doc(db, "config", "palavras"), BANCO_LOCAL);
      _cache = BANCO_LOCAL;
      return _cache;
    }
  } catch (e) {
    _cache = BANCO_LOCAL;
    return _cache;
  }
}

export function palavraAleatoria(banco) {
  const lista = banco.wordle || BANCO_LOCAL.wordle;
  const normalizadas = lista.map(item => {
    if (typeof item === "string") return { palavra: item, tema: "Universo Hanna" };
    return item;
  });
  const filtradas = normalizadas.filter(({ palavra }) => {
    const sem = palavra.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return sem.length >= 4 && sem.length <= 6;
  });
  return filtradas[Math.floor(Math.random() * filtradas.length)];
}

export function listaAleatoriaCaca(banco) {
  const listas = banco.cacapalavras || BANCO_LOCAL.cacapalavras;
  return listas[Math.floor(Math.random() * listas.length)];
}