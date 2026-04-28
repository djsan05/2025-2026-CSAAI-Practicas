/*jshint esversion: 6*/

// =======================
// CANVAS
// =======================
var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

canvas.width  = 800;
canvas.height = 500;

// =======================
// CONSTANTES DEL CAMPO
// =======================
var FIELD = {
    left:   30,
    right:  770,
    top:    30,
    bottom: 470
};

var GOAL_HEIGHT  = 120;
var GOAL_DEPTH   = 18;
var GOAL_TOP     = (canvas.height - GOAL_HEIGHT) / 2;
var GOAL_BOTTOM  = GOAL_TOP + GOAL_HEIGHT;

// Portería izquierda (azul defiende, rojo ataca)
var GOAL_LEFT = {
    x:      FIELD.left - GOAL_DEPTH,
    y:      GOAL_TOP,
    width:  GOAL_DEPTH,
    height: GOAL_HEIGHT
};

// Portería derecha (rojo defiende, azul ataca)
var GOAL_RIGHT = {
    x:      FIELD.right,
    y:      GOAL_TOP,
    width:  GOAL_DEPTH,
    height: GOAL_HEIGHT
};

// =======================
// ESTADO DEL JUEGO
// =======================
var gameMode    = null;   // '3-goals' | 'golden-goal'
var gameStarted = false;
var gameOver    = false;

var scoreBlue = 0;
var scoreRed  = 0;

// Fases: 'countdown' | 'playing' | 'goal' | 'gameover'
var phase         = "countdown";
var countdown     = 3;
var countdownTimer = 0;
var COUNTDOWN_INTERVAL = 60; // frames por número

// =======================
// JUGADORES
// =======================
var PLAYER_RADIUS = 15;

function makePlayer(x, y, angle, speed, color) {
    return { x: x, y: y, angle: angle, speed: speed, color: color };
}

var playerBlue = makePlayer(200, 250, 0, 2.8, "#4fc3f7");

// Dos bots rivales con comportamientos distintos
var botAttack  = makePlayer(580, 200, Math.PI, 1.8, "#ef5350"); // agresivo
var botDefend  = makePlayer(680, 300, Math.PI, 1.4, "#e53935"); // defensivo

// =======================
// PELOTA
// =======================
var ball = {
    x:       400,
    y:       250,
    vx:      0,
    vy:      0,
    radius:  9,
    friction: 0.985
};

// =======================
// INPUT
// =======================
var keys = {};

window.addEventListener("keydown", function(e) {
    keys[e.code] = true;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) !== -1) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
});

// =======================
// BOTONES UI
// =======================
document.getElementById("btn-3goals").addEventListener("click", function() { startGame("3-goals"); });
document.getElementById("btn-golden").addEventListener("click", function() { startGame("golden-goal"); });
document.getElementById("btn-restart").addEventListener("click", function() { location.reload(); });
document.getElementById("btn-menu").addEventListener("click",   function() { location.reload(); });

// =======================
// INICIAR JUEGO
// =======================
function startGame(mode) {
    gameMode = mode;
    document.getElementById("overlay-menu").classList.add("hidden");
    document.getElementById("scoreboard").classList.remove("hidden");
    document.getElementById("mode-display").classList.remove("hidden");
    document.getElementById("mode-display").textContent =
        mode === "3-goals" ? "Partido a 3 goles" : "Gol de oro";

    resetPositions();
    beginCountdown();
    gameStarted = true;
}

// =======================
// RESET POSICIONES
// =======================
function resetPositions() {
    playerBlue.x = 200; playerBlue.y = 250; playerBlue.angle = 0;
    botAttack.x  = 560; botAttack.y  = 200; botAttack.angle  = Math.PI;
    botDefend.x  = 660; botDefend.y  = 310; botDefend.angle  = Math.PI;
    ball.x = 400; ball.y = 250; ball.vx = 0; ball.vy = 0;
}

// =======================
// CUENTA ATRÁS
// =======================
function beginCountdown() {
    phase          = "countdown";
    countdown      = 3;
    countdownTimer = 0;
    showOverlay("", String(countdown));
}

function showOverlay(title, sub) {
    var ov = document.getElementById("overlay-message");
    ov.classList.remove("hidden");
    document.getElementById("status-text").textContent    = title;
    document.getElementById("countdown-text").textContent = sub;
    document.getElementById("post-game-buttons").classList.add("hidden");
}

function hideOverlay() {
    document.getElementById("overlay-message").classList.add("hidden");
}

// =======================
// COLISIÓN JUGADOR-PELOTA
// =======================
function playerBallCollision(player) {
    var dx   = ball.x - player.x;
    var dy   = ball.y - player.y;
    var dist = Math.hypot(dx, dy);
    var minD = PLAYER_RADIUS + ball.radius;

    if (dist < minD && dist > 0) {
        var nx = dx / dist;
        var ny = dy / dist;
        // Separa
        ball.x = player.x + nx * minD;
        ball.y = player.y + ny * minD;
        // Rebote
        var speed = Math.hypot(ball.vx, ball.vy);
        ball.vx = nx * Math.max(speed, 2.5);
        ball.vy = ny * Math.max(speed, 2.5);
    }
}

// =======================
// DISPARAR
// =======================
var shootCooldown = 0;

function shootBall(player) {
    if (shootCooldown > 0) { return; }
    var power = 7;
    ball.vx = Math.cos(player.angle) * power;
    ball.vy = Math.sin(player.angle) * power;
    shootCooldown = 20;
}

// =======================
// MOVER JUGADOR AZUL
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
    if (keys["ArrowLeft"])  { playerBlue.angle -= 0.06; }
    if (keys["ArrowRight"]) { playerBlue.angle += 0.06; }
    if (keys["KeyA"])  { playerBlue.angle -= 0.06; }
    if (keys["KeyD"])  { playerBlue.angle += 0.06; }
    if (keys["Space"]) { shootBall(playerBlue); }

    keepInsideField(playerBlue);
}

// =======================
// IA BOT ATACANTE
// =======================
function updateBotAttack() {
    var tx, ty;
    // Si está cerca de la pelota, apunta a portería izquierda (de azul)
    var distToBall = Math.hypot(ball.x - botAttack.x, ball.y - botAttack.y);

    if (distToBall < 60) {
        // Apunta a la portería izquierda
        tx = GOAL_LEFT.x;
        ty = canvas.height / 2;
    } else {
        tx = ball.x;
        ty = ball.y;
    }

    rotateToward(botAttack, tx, ty, 0.08);
    botAttack.x += Math.cos(botAttack.angle) * botAttack.speed;
    botAttack.y += Math.sin(botAttack.angle) * botAttack.speed;
    keepInsideField(botAttack);

    if (distToBall < 22) { shootBall(botAttack); }
}

// =======================
// IA BOT DEFENSOR
// =======================
function updateBotDefend() {
    // Se coloca entre la pelota y su portería
    var midX = (ball.x + GOAL_RIGHT.x) / 2;
    var midY = (ball.y + canvas.height / 2) / 2;

    rotateToward(botDefend, midX, midY, 0.06);
    botDefend.x += Math.cos(botDefend.angle) * botDefend.speed;
    botDefend.y += Math.sin(botDefend.angle) * botDefend.speed;
    keepInsideField(botDefend);

    var distToBall = Math.hypot(ball.x - botDefend.x, ball.y - botDefend.y);
    if (distToBall < 22) { shootBall(botDefend); }
}

function rotateToward(player, tx, ty, factor) {
    var dx     = tx - player.x;
    var dy     = ty - player.y;
    var target = Math.atan2(dy, dx);
    var diff   = target - player.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.angle += diff * factor;
}

// =======================
// LIMITES DEL CAMPO
// =======================
function keepInsideField(player) {
    if (player.x < FIELD.left   + PLAYER_RADIUS) { player.x = FIELD.left   + PLAYER_RADIUS; }
    if (player.x > FIELD.right  - PLAYER_RADIUS) { player.x = FIELD.right  - PLAYER_RADIUS; }
    if (player.y < FIELD.top    + PLAYER_RADIUS) { player.y = FIELD.top    + PLAYER_RADIUS; }
    if (player.y > FIELD.bottom - PLAYER_RADIUS) { player.y = FIELD.bottom - PLAYER_RADIUS; }
}

// =======================
// ACTUALIZAR PELOTA
// =======================
function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bordes laterales del campo (arriba y abajo)
    if (ball.y - ball.radius < FIELD.top) {
        ball.y = FIELD.top + ball.radius;
        ball.vy = Math.abs(ball.vy);
    }
    if (ball.y + ball.radius > FIELD.bottom) {
        ball.y = FIELD.bottom - ball.radius;
        ball.vy = -Math.abs(ball.vy);
    }

    // Borde izquierdo (rebota excepto si entra en portería)
    if (ball.x - ball.radius < FIELD.left) {
        if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
            // Gol para rojo
            registerGoal("red");
            return;
        }
        ball.x = FIELD.left + ball.radius;
        ball.vx = Math.abs(ball.vx);
    }

    // Borde derecho (rebota excepto si entra en portería)
    if (ball.x + ball.radius > FIELD.right) {
        if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
            // Gol para azul
            registerGoal("blue");
            return;
        }
        ball.x = FIELD.right - ball.radius;
        ball.vx = -Math.abs(ball.vx);
    }

    // Fricción
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;
}

// =======================
// GOL
// =======================
var goalTimer = 0;
var GOAL_SHOW_FRAMES = 120;

function registerGoal(team) {
    if (phase !== "playing") { return; }

    if (team === "blue") {
        scoreBlue++;
        document.getElementById("score-blue").textContent = String(scoreBlue);
    } else {
        scoreRed++;
        document.getElementById("score-red").textContent = String(scoreRed);
    }

    phase     = "goal";
    goalTimer = 0;

    var msg = team === "blue" ? "¡GOOOL!" : "¡Gol rival!";
    showOverlay(msg, "");

    // ¿Fin de partida?
    if (isGameOver()) {
        phase = "gameover";
        var winner = scoreBlue > scoreRed ? "¡Has ganado!" : "¡Has perdido!";
        showOverlay(winner, "");
        document.getElementById("post-game-buttons").classList.remove("hidden");
        gameOver = true;
    }
}

function isGameOver() {
    if (gameMode === "golden-goal") {
        return scoreBlue > 0 || scoreRed > 0;
    }
    if (gameMode === "3-goals") {
        return scoreBlue >= 3 || scoreRed >= 3;
    }
    return false;
}

// =======================
// DIBUJAR CAMPO
// =======================
function drawField() {
    // Fondo hierba
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Franja más clara en el centro (efecto hierba)
    ctx.fillStyle = "#1e6b23";
    for (var i = 0; i < 8; i++) {
        if (i % 2 === 0) {
            ctx.fillRect(0, i * (canvas.height / 8), canvas.width, canvas.height / 8);
        }
    }

    // Borde del campo
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth   = 2;
    ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);

    // Línea central
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, FIELD.top);
    ctx.lineTo(canvas.width / 2, FIELD.bottom);
    ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Área pequeña izquierda
    ctx.strokeRect(FIELD.left, GOAL_TOP - 20, 60, GOAL_HEIGHT + 40);
    // Área pequeña derecha
    ctx.strokeRect(FIELD.right - 60, GOAL_TOP - 20, 60, GOAL_HEIGHT + 40);
}

function drawGoals() {
    // Portería izquierda
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(GOAL_LEFT.x, GOAL_LEFT.y, GOAL_LEFT.width, GOAL_LEFT.height);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 3;
    ctx.strokeRect(GOAL_LEFT.x, GOAL_LEFT.y, GOAL_LEFT.width, GOAL_LEFT.height);

    // Portería derecha
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(GOAL_RIGHT.x, GOAL_RIGHT.y, GOAL_RIGHT.width, GOAL_RIGHT.height);
    ctx.strokeRect(GOAL_RIGHT.x, GOAL_RIGHT.y, GOAL_RIGHT.width, GOAL_RIGHT.height);
}

// =======================
// DIBUJAR JUGADOR
// =======================
function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Sombra
    ctx.shadowColor   = "rgba(0,0,0,0.5)";
    ctx.shadowBlur    = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Cuerpo
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Borde blanco
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Indicador de dirección
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(PLAYER_RADIUS + 7, 0);
    ctx.stroke();

    ctx.restore();
}

// =======================
// DIBUJAR PELOTA
// =======================
function drawBall() {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur  = 10;

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
}

// =======================
// LOOP PRINCIPAL
// =======================
function gameLoop() {
    drawField();
    drawGoals();

    if (gameStarted && !gameOver) {
        if (phase === "countdown") {
            countdownTimer++;
            if (countdownTimer >= COUNTDOWN_INTERVAL) {
                countdownTimer = 0;
                countdown--;
                if (countdown <= 0) {
                    phase = "playing";
                    hideOverlay();
                } else {
                    document.getElementById("countdown-text").textContent = String(countdown);
                }
            }
        }

        if (phase === "playing") {
            if (shootCooldown > 0) { shootCooldown--; }
            updateBluePlayer();
            updateBotAttack();
            updateBotDefend();
            updateBall();
            playerBallCollision(playerBlue);
            playerBallCollision(botAttack);
            playerBallCollision(botDefend);
        }

        if (phase === "goal") {
            goalTimer++;
            if (goalTimer >= GOAL_SHOW_FRAMES) {
                resetPositions();
                beginCountdown();
            }
        }
    }

    drawPlayer(playerBlue);
    drawPlayer(botAttack);
    drawPlayer(botDefend);
    drawBall();

    requestAnimationFrame(gameLoop);
}

// =======================
// INICIO
// =======================
gameLoop();