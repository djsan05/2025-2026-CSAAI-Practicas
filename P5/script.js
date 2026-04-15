const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajustar tamaño
canvas.width = 800;
canvas.height = 500;

// =======================
// ESTADO DEL JUEGO
// =======================
let gameStarted = false;

// =======================
// JUGADORES
// =======================
const playerBlue = {
    x: 200,
    y: 250,
    angle: 0,
    speed: 2,
    color: "blue"
};

const playerRed = {
    x: 600,
    y: 250,
    angle: 0,
    speed: 1.2,
    color: "red"
};

// =======================
// PELOTA
// =======================
const ball = {
    x: 400,
    y: 250,
    vx: 0,
    vy: 0,
    radius: 8
};

// =======================
// INPUT
// =======================
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// =======================
// INICIAR JUEGO (ARREGLADO)
// =======================
function startGame(mode) {
    document.getElementById("overlay-menu").classList.add("hidden");
    gameStarted = true;
}

// =======================
// MOVIMIENTO JUGADOR AZUL
// =======================
function updateBluePlayer() {
    if (keys["ArrowUp"]) {
        playerBlue.x += Math.cos(playerBlue.angle) * playerBlue.speed;
        playerBlue.y += Math.sin(playerBlue.angle) * playerBlue.speed;
    }

    if (keys["ArrowDown"]) {
        playerBlue.x -= Math.cos(playerBlue.angle) * playerBlue.speed;
        playerBlue.y -= Math.sin(playerBlue.angle) * playerBlue.speed;
    }

    if (keys["KeyA"]) playerBlue.angle -= 0.05;
    if (keys["KeyD"]) playerBlue.angle += 0.05;

    if (keys["Space"]) shootBall(playerBlue);

    keepInsideField(playerBlue);
}

// =======================
// IA JUGADOR ROJO
// =======================
function updateRedPlayer() {
    const dx = ball.x - playerRed.x;
    const dy = ball.y - playerRed.y;

    const angleToBall = Math.atan2(dy, dx);

    let diff = angleToBall - playerRed.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));

    playerRed.angle += diff * 0.05;

    playerRed.x += Math.cos(playerRed.angle) * playerRed.speed;
    playerRed.y += Math.sin(playerRed.angle) * playerRed.speed;

    keepInsideField(playerRed);

    const dist = Math.hypot(dx, dy);
    if (dist < 25) shootBall(playerRed);
}

// =======================
// LIMITES
// =======================
function keepInsideField(player) {
    const margin = 20;

    if (player.x < margin) player.x = margin;
    if (player.x > canvas.width - margin) player.x = canvas.width - margin;

    if (player.y < margin) player.y = margin;
    if (player.y > canvas.height - margin) player.y = canvas.height - margin;
}

// =======================
// PELOTA
// =======================
function shootBall(player) {
    const power = 5;

    ball.vx = Math.cos(player.angle) * power;
    ball.vy = Math.sin(player.angle) * power;
}

function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
        ball.vx *= -1;
    }

    if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) {
        ball.vy *= -1;
    }

    ball.vx *= 0.98;
    ball.vy *= 0.98;
}

// =======================
// DIBUJO
// =======================
function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    ctx.restore();
}

function drawBall() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawField() {
    ctx.fillStyle = "#1b4d2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =======================
// LOOP (ARREGLADO)
// =======================
function gameLoop() {
    drawField();

    if (gameStarted) {
        updateBluePlayer();
        updateRedPlayer();
        updateBall();
    }

    drawPlayer(playerBlue);
    drawPlayer(playerRed);
    drawBall();

    requestAnimationFrame(gameLoop);
}

// =======================
// INICIO
// =======================
gameLoop();