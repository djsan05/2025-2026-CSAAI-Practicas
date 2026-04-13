const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración inicial
canvas.width = 800;
canvas.height = 500;

let gameState = 'MENU'; // MENU, PLAYING, COUNTDOWN, GAMEOVER
let gameMode = ''; // '3-goals' o 'golden-goal'
let score = { player: 0, bot: 0 };
let countdown = 3;

// Objetos del juego
const ball = {
    x: 400, y: 250, radius: 10,
    dx: 0, dy: 0, friction: 0.98
};

const player = {
    x: 150, y: 250, radius: 15, color: '#004488',
    speed: 4, angle: 0, score: 0
};

const bot = {
    x: 650, y: 250, radius: 15, color: '#882222',
    speed: 3
};

// Control de teclas
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Iniciar Juego
function startGame(mode) {
    gameMode = mode;
    document.getElementById('overlay-menu').classList.add('hidden');
    resetPositions();
    startCountdown();
}

function startCountdown() {
    gameState = 'COUNTDOWN';
    countdown = 3;
    document.getElementById('overlay-message').classList.remove('hidden');
    document.getElementById('status-text').innerText = "¡PREPÁRATE!";
    
    let timer = setInterval(() => {
        document.getElementById('countdown-text').innerText = countdown;
        countdown--;
        if (countdown < 0) {
            clearInterval(timer);
            gameState = 'PLAYING';
            document.getElementById('overlay-message').classList.add('hidden');
            document.getElementById('countdown-text').innerText = "";
        }
    }, 1000);
}

function resetPositions() {
    ball.x = 400; ball.y = 250; ball.dx = 0; ball.dy = 0;
    player.x = 150; player.y = 250;
    bot.x = 650; bot.y = 250;
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Movimiento Jugador
    if (keys['ArrowUp'] && player.y > player.radius) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.radius) player.y += player.speed;
    if (keys['ArrowLeft'] && player.x > player.radius) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width/2) player.x += player.speed;

    // Rotación de disparo (A y D)
    if (keys['KeyA']) player.angle -= 0.1;
    if (keys['KeyD']) player.angle += 0.1;

    // IA básica del BOT
    if (ball.x > canvas.width / 2) {
        if (bot.y < ball.y) bot.y += bot.speed;
        if (bot.y > ball.y) bot.y -= bot.speed;
        if (bot.x < ball.x) bot.x += bot.speed;
        if (bot.x > ball.x) bot.x -= bot.speed;
    }

    // Física del balón
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // Colisiones con paredes
    if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) ball.dy *= -1;
    if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
        // Verificar si es GOL (zona central de los laterales)
        if (ball.y > 180 && ball.y < 320) {
            checkGoal();
        } else {
            ball.dx *= -1;
        }
    }

    // Colisión Jugador - Balón
    handleCollision(player, ball);
    handleCollision(bot, ball);

    // Chutar (Espacio)
    if (keys['Space'] && getDistance(player, ball) < player.radius + ball.radius + 5) {
        ball.dx = Math.cos(player.angle) * 10;
        ball.dy = Math.sin(player.angle) * 10;
    }
}

function handleCollision(p, b) {
    let dist = getDistance(p, b);
    if (dist < p.radius + b.radius) {
        let angle = Math.atan2(b.y - p.y, b.x - p.x);
        b.dx = Math.cos(angle) * 5;
        b.dy = Math.sin(angle) * 5;
    }
}

function checkGoal() {
    if (ball.x > canvas.width / 2) {
        score.player++;
        document.getElementById('status-text').innerText = "¡GOOOL TUYO!";
    } else {
        score.bot++;
        document.getElementById('status-text').innerText = "¡GOL RIVAL!";
    }

    if ((gameMode === '3-goals' && (score.player >= 3 || score.bot >= 3)) || gameMode === 'golden-goal') {
        endGame();
    } else {
        resetPositions();
        startCountdown();
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    document.getElementById('status-text').innerText = score.player > score.bot ? "¡HAS GANADO EL PARTIDO!" : "HAS PERDIDO...";
    document.getElementById('overlay-message').classList.remove('hidden');
    document.getElementById('post-game-buttons').classList.remove('hidden');
}

function getDistance(obj1, obj2) {
    return Math.sqrt((obj1.x - obj2.x)**2 + (obj1.y - obj2.y)**2);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar campo (Líneas blancas)
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Porterías
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 180, 10, 140);
    ctx.fillRect(canvas.width - 10, 180, 10, 140);

    // Jugador (con indicador de dirección)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Triángulo de dirección
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(player.radius + 2, 0);
    ctx.lineTo(player.radius - 5, -5);
    ctx.lineTo(player.radius - 5, 5);
    ctx.fill();
    ctx.restore();

    // Bot
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
    ctx.fill();

    // Balón
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Marcador
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(`${score.player} - ${score.bot}`, canvas.width / 2, 50);
    ctx.font = "15px Arial";
    ctx.fillText(gameMode === '3-goals' ? "A 3 goles" : "Gol de Oro", canvas.width / 2, 70);

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();