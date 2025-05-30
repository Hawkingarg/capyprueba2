const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const startScreen = document.getElementById("startScreen");
const playButton = document.getElementById("playButton");
const rankingTableBody = document.querySelector("#rankingTable tbody");

const GRAVEDAD = 0.2;
const SALTO = -12;
const BASE_HEIGHT = 40;
const CAMERA_TOP = canvas.height / 3;
const FULL_BG_HEIGHT = 13000;

let capy = { x: 0, y: 0, width: 50, height: 50, vy: 0 };
let mouseX = 0;
let cameraY = 0;
let deathCount = 0;
let dinero = 0;

let platforms = [];
let coins = [];
let fallingCoins = [];

let gameWon = false;

// Sonidos
const muerteAudio = new Audio("audio/muerte.mp3");
const beepAudio = new Audio("audio/beep.mp3");
const musica1 = new Audio("audio/musica1.mp3");
musica1.loop = true;

// Imágenes
const fondoCompleto = new Image();
fondoCompleto.src = "fondoCompleto.png";

const capyImage = new Image();
capyImage.src = "capy.png";

const baseImage = new Image();
baseImage.src = "basedesalto.png";

const moonImage = new Image();
moonImage.src = "moon.png";

const coinImage = new Image();
coinImage.src = "moneda.png";

// Luna
let moon = {
  x: canvas.width / 2 - 60,
  y: 60,
  width: 120,
  height: 120,
  vy: 2,
  minY: 50,
  maxY: 150
};

let startTime = 0;
let elapsedTime = 0;
let gameStarted = false;

// LocalStorage seguro
function getRankingSeguro() {
  try {
    return JSON.parse(localStorage.getItem("capyRanking")) || [];
  } catch (e) {
    return [];
  }
}

function guardarRankingSeguro(ranking) {
  try {
    localStorage.setItem("capyRanking", JSON.stringify(ranking));
  } catch (e) {
    // Nada
  }
}

// Ranking guardado en localStorage (array de objetos con nombre, tiempo, fecha)
let ranking = getRankingSeguro();

function guardarRanking(nombre, tiempo) {
  const fecha = new Date().toLocaleDateString();
  ranking.push({ nombre, tiempo, fecha });
  ranking.sort((a,b) => a.tiempo - b.tiempo);
  if (ranking.length > 10) ranking.length = 10;
  guardarRankingSeguro(ranking);
  mostrarRanking();
}

function mostrarRanking() {
  rankingTableBody.innerHTML = "";
  ranking.forEach((entry, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${entry.nombre}</td>
      <td>${entry.tiempo.toFixed(2)}</td>
      <td>${entry.fecha}</td>
    `;
    rankingTableBody.appendChild(tr);
  });
}

mostrarRanking();

function reiniciarJuego() {
  capy.width = 50;
  capy.height = 50;
  capy.x = canvas.width / 2 - capy.width / 2;
  capy.y = FULL_BG_HEIGHT - BASE_HEIGHT - capy.height;
  capy.vy = 0;
  mouseX = capy.x;
  cameraY = FULL_BG_HEIGHT - canvas.height;

  deathCount = 0;
  dinero = 0;
  gameWon = false;

  platforms = [];
  platforms.push({
    x: 0,
    y: FULL_BG_HEIGHT - BASE_HEIGHT,
    width: canvas.width,
    height: BASE_HEIGHT,
    speedX: 0
  });

  let ultimaY = FULL_BG_HEIGHT - BASE_HEIGHT;
  const minDY = 100, maxDY = 140;

  while (ultimaY > 0) {
    const dy = minDY + Math.random() * (maxDY - minDY);
    const newY = ultimaY - dy;
    if (newY < 0) break;

    const w = 100 + Math.random() * 80;
    const x = Math.random() * (canvas.width - w);
    const speedX = (Math.random() < 0.5) ? ((Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 1.3)) : 0;

    platforms.push({ x, y: newY, width: w, height: 20, speedX });
    ultimaY = newY;
  }

  coins = [];
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * (canvas.width - 30);
    const y = Math.random() * FULL_BG_HEIGHT;
    coins.push({ x, y, width: 30, height: 30 });
  }

  fallingCoins = [];

  moon.y = 60;
  moon.vy = 2;

  startTime = performance.now();
  elapsedTime = 0;
  gameStarted = true;
}

canvas.addEventListener("mousemove", e => {
  mouseX = e.clientX - capy.width / 2;
});

function update() {
  if (!gameStarted || gameWon) return;

  capy.x += (mouseX - capy.x) * 0.15;
  capy.x = Math.max(0, Math.min(capy.x, canvas.width - capy.width));
  capy.vy += GRAVEDAD;
  capy.y += capy.vy;

  for (let p of platforms) {
    if (p.speedX !== 0) {
      p.x += p.speedX;
      if (p.x < 0 || p.x + p.width > canvas.width) {
        p.speedX *= -1;
        p.x = Math.max(0, Math.min(p.x, canvas.width - p.width));
      }
    }
  }

  for (let p of platforms) {
    if (
      capy.x + capy.width > p.x &&
      capy.x < p.x + p.width &&
      capy.y + capy.height >= p.y &&
      capy.y + capy.height <= p.y + p.height + 10 &&
      capy.vy >= 0
    ) {
      capy.y = p.y - capy.height;
      capy.vy = SALTO;
      break;
    }
  }

  if (capy.y < cameraY + CAMERA_TOP) {
    cameraY = capy.y - CAMERA_TOP;
    cameraY = Math.max(0, Math.min(cameraY, FULL_BG_HEIGHT - canvas.height));
  }

  if ((capy.y - cameraY) > canvas.height) {
    muerteAudio.currentTime = 0;  
    muerteAudio.play();
    deathCount++;
    reiniciarJuego();
  }

  moon.y += moon.vy;
  if (moon.y < moon.minY || moon.y > moon.maxY) {
    moon.vy *= -1;
  }

  if (
    capy.x + capy.width > moon.x &&
    capy.x < moon.x + moon.width &&
    capy.y + capy.height > moon.y &&
    capy.y < moon.y + moon.height
  ) {
    gameWon = true;
    musica1.pause();

    elapsedTime = (performance.now() - startTime) / 1000;
    let nombreJugador = prompt("¡Ganaste! Ingresá tu nombre para el ranking:");
    if (!nombreJugador) nombreJugador = "Anon";

    guardarRanking(nombreJugador, elapsedTime);

    alert(`¡Llegaste a la Luna en ${elapsedTime.toFixed(2)} segundos!`);
    reiniciarJuego();
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    if (
      capy.x + capy.width > coin.x &&
      capy.x < coin.x + coin.width &&
      capy.y + capy.height > coin.y &&
      capy.y < coin.y + coin.height
    ) {
      dinero += 1;
      beepAudio.currentTime = 0;
      beepAudio.play();
      fallingCoins.push({ x: coin.x, y: coin.y, vy: 1 });
      coins.splice(i, 1);
    }
  }

  for (let c of fallingCoins) {
    c.y += c.vy;
    c.vy += 0.1;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fondoCompleto, 0, cameraY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

  for (let p of platforms) {
    ctx.drawImage(baseImage, p.x, p.y - cameraY, p.width, p.height);
  }

  ctx.drawImage(capyImage, capy.x, capy.y - cameraY, capy.width, capy.height);

  for (let coin of coins) {
    ctx.drawImage(coinImage, coin.x, coin.y - cameraY, coin.width, coin.height);
  }

  for (let coin of fallingCoins) {
    ctx.globalAlpha = 0.6;
    ctx.drawImage(coinImage, coin.x, coin.y - cameraY, 20, 20);
    ctx.globalAlpha = 1;
  }

  ctx.drawImage(moonImage, moon.x, moon.y - cameraY, moon.width, moon.height);

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Dinero: $${dinero}`, 20, 90);
  ctx.fillText(`Altura: ${Math.floor((FULL_BG_HEIGHT - BASE_HEIGHT) - capy.y)} m`, 20, 30);
  ctx.fillText(`Muertes: ${deathCount}`, 20, 60);

  if (gameWon) {
    ctx.fillStyle = "#0f0";
    ctx.font = "48px Arial";
    ctx.fillText("¡Ganaste! 🎉", canvas.width / 2 - 100, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function iniciarJuego() {
  const video = document.getElementById("backgroundVideo");
  if (video) video.pause();
  startScreen.style.display = "none";
  musica1.play();
  reiniciarJuego();
  loop();
  gameStarted = true;
}

playButton.addEventListener("click", iniciarJuego);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  moon.x = canvas.width / 2 - 60;
  cameraY = Math.min(cameraY, FULL_BG_HEIGHT - canvas.height);
});

mostrarRanking();
