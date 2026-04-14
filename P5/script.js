const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let gameState = 'MENU';
let gameMode = '';
let score = { player: 0, bot: 0 };
let countdown = 3;
let canScore = true;

// OBJETOS
const ball = { x: 400, y: 250, radius: 10, dx: 0, dy: 0, friction: 0.98 };

const player = { x: 150, y: 250, radius: 15, speed: 4, angle: 0 };

const bot = { x: 650, y: 250, radius: 15, speed: 2.5 };

// INPUT
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// START
function startGame(mode) {
    gameMode = mode;
    score = { player: 0, bot: 0 };
    document.getElementById('overlay-menu').classList.add('hidden');
    resetPositions();
    startCountdown();
}

// COUNTDOWN
function startCountdown() {
    gameState = 'COUNTDOWN';
    countdown = 3;

    const overlay = document.getElementById('overlay-message');
    overlay.classList.remove('hidden');

    document.getElementById('status-text').innerText = "¡PREPÁRATE!";

    let timer = setInterval(() => {
        document.getElementById('countdown-text').innerText = countdown;
        countdown--;

        if (countdown < 0) {
            clearInterval(timer);
            overlay.classList.add('hidden');
            gameState = 'PLAYING';
            canScore = true;
        }
    }, 1000);
}

// RESET
function resetPositions() {
    ball.x = 400; ball.y = 250;
    ball.dx = 0; ball.dy = 0;

    player.x = 150; player.y = 250;
    bot.x = 650; bot.y = 250;
}

// UPDATE
function update() {
    if (gameState !== 'PLAYING') return;

    // MOVIMIENTO JUGADOR
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // LIMITES JUGADOR
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // ROTACION
    if (keys['KeyA']) player.angle -= 0.08;
    if (keys['KeyD']) player.angle += 0.08;

    // BOT IA
    if (bot.x < ball.x) bot.x += bot.speed;
    if (bot.x > ball.x) bot.x -= bot.speed;
    if (bot.y < ball.y) bot.y += bot.speed;
    if (bot.y > ball.y) bot.y -= bot.speed;

    // LIMITES BOT
    bot.x = Math.max(bot.radius, Math.min(canvas.width - bot.radius, bot.x));
    bot.y = Math.max(bot.radius, Math.min(canvas.height - bot.radius, bot.y));

    // BALON
    ball.x += ball.dx;
    ball.y += ball.dy;

    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // REBOTES
    if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) {
        ball.dy *= -1;
    }

    // GOLES
    if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
        if (canScore && ball.y > 180 && ball.y < 320) {
            checkGoal();
        } else {
            ball.dx *= -1;
        }
    }

    // COLISIONES
    handleCollision(player, ball);
    handleCollision(bot, ball);

    // CHUTE
    if (keys['Space'] && getDistance(player, ball) < 25) {
        ball.dx = Math.cos(player.angle) * 10;
        ball.dy = Math.sin(player.angle) * 10;
    }
}

// COLISION
function handleCollision(p, b) {
    let dist = getDistance(p, b);

    if (dist < p.radius + b.radius) {
        let angle = Math.atan2(b.y - p.y, b.x - p.x);
        b.dx = Math.cos(angle) * 6;
        b.dy = Math.sin(angle) * 6;
    }
}

// GOL
function checkGoal() {
    canScore = false;
    gameState = 'GOAL';

    const overlay = document.getElementById('overlay-message');
    overlay.classList.remove('hidden');

    if (ball.x > canvas.width / 2) {
        score.player++;
        document.getElementById('status-text').innerText = "¡GOOOL!";
    } else {
        score.bot++;
        document.getElementById('status-text').innerText = "¡GOL RIVAL!";
    }

    setTimeout(() => {
        if (
            (gameMode === '3-goals' && (score.player >= 3 || score.bot >= 3)) ||
            (gameMode === 'golden-goal')
        ) {
            endGame();
        } else {
            resetPositions();
            startCountdown();
        }
    }, 1500);
}

// FINAL
function endGame() {
    gameState = 'GAMEOVER';

    const overlay = document.getElementById('overlay-message');
    overlay.classList.remove('hidden');

    document.getElementById('status-text').innerText =
        score.player > score.bot ? "¡HAS GANADO!" : "HAS PERDIDO";

    document.getElementById('post-game-buttons').classList.remove('hidden');
}

// DISTANCIA
function getDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// DIBUJO
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Campo
    ctx.strokeStyle = "white";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Porterias
    ctx.fillRect(0, 180, 10, 140);
    ctx.fillRect(canvas.width - 10, 180, 10, 140);

    // Jugador
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direccion
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = "white";
    ctx.fillRect(player.radius, -2, 10, 4);
    ctx.restore();

    // Bot
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
    ctx.fill();

    // Balon
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Marcador
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${score.player} - ${score.bot}`, canvas.width / 2, 40);

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();