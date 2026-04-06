// canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HUD
const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const energyBar = document.getElementById("energy-fill");
const message = document.getElementById("message");

// sonidos
const laserSound = document.getElementById("laserSound");
const explosionSound = document.getElementById("explosionSound");
const winSound = document.getElementById("winSound");
const gameOverSound = document.getElementById("gameOverSound");

// imágenes
const playerImg = new Image();
playerImg.src = "player.png";

const alienImg = new Image();
alienImg.src = "alien.png";

// jugador
let player = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 120,
    w: 120,
    h: 120,
    speed: 6
};

// teclado
let left = false;
let right = false;

document.addEventListener("keydown", e=>{
    if(e.key==="ArrowLeft") left=true;
    if(e.key==="ArrowRight") right=true;
    if(e.code==="Space") shoot();
});

document.addEventListener("keyup", e=>{
    if(e.key==="ArrowLeft") left=false;
    if(e.key==="ArrowRight") right=false;
});

// balas jugador
let bullets=[];

// energía
let energy=5;
let maxEnergy=5;

// vidas
let lives=3;

// puntos
let score=0;

// pausa
let gamePaused=false;

// aliens
let aliens=[];
let direction=1;

function createAliens(){
    aliens=[];
    for(let r=0;r<3;r++){
        for(let c=0;c<8;c++){
            aliens.push({
                x:80+c*80,
                y:40+r*70,
                w:50,
                h:50,
                alive:true
            });
        }
    }
}

createAliens();

// disparo jugador
function shoot(){

    if(energy<=0 || gamePaused) return;

    bullets.push({
        x:player.x+player.w/2,
        y:player.y,
        w:4,
        h:10,
        speed:7
    });

    laserSound.currentTime=0;
    laserSound.play();

    energy--;
}

// recarga energía
setInterval(()=>{
    if(energy<maxEnergy) energy++;
},500);

// mover jugador
function movePlayer(){

    if(left) player.x-=player.speed;
    if(right) player.x+=player.speed;

    if(player.x<0) player.x=0;
    if(player.x+player.w>canvas.width)
        player.x=canvas.width-player.w;
}

// mover balas
function moveBullets(){

    bullets.forEach((b,i)=>{
        b.y-=b.speed;

        if(b.y<0) bullets.splice(i,1);
    });

}

// mover aliens
function moveAliens(){

    let edge=false;

    let alive=aliens.filter(a=>a.alive).length;

    let speed=1+(24-alive)*0.2;

    aliens.forEach(a=>{

        if(!a.alive) return;

        a.x+=direction*speed;

        if(a.x<0 || a.x+a.w>canvas.width){
            edge=true;
        }

    });

    if(edge){

        direction*=-1;

        aliens.forEach(a=>{
            a.y+=20;

            if(a.y+a.h>=player.y){
                loseLife();
            }
        });

    }

}

// colisiones
function collisions(){

    bullets.forEach((b,bi)=>{

        aliens.forEach(a=>{

            if(!a.alive) return;

            if(
                b.x<a.x+a.w &&
                b.x+b.w>a.x &&
                b.y<a.y+a.h &&
                b.y+b.h>a.y
            ){

                a.alive=false;
                bullets.splice(bi,1);

                explosionSound.currentTime=0;
                explosionSound.play();

                score+=10;
            }

        });

    });

}

// dibujar jugador
function drawPlayer(){
    ctx.drawImage(playerImg,player.x,player.y,player.w,player.h);
}

// dibujar aliens
function drawAliens(){

    aliens.forEach(a=>{
        if(!a.alive) return;
        ctx.drawImage(alienImg,a.x,a.y,a.w,a.h);
    });

}

// dibujar balas
function drawBullets(){

    ctx.fillStyle="red";

    bullets.forEach(b=>{
        ctx.fillRect(b.x,b.y,b.w,b.h);
    });

}

// HUD
function updateHUD(){

    scoreText.innerText="Puntos: "+score;
    livesText.innerText="Vidas: "+lives;

    energyBar.style.width=(energy/maxEnergy*100)+"%";
}

// victoria
function checkWin(){

    let alive=aliens.filter(a=>a.alive);

    if(alive.length===0){

        message.style.display="block";
        message.innerText="VICTORIA";

        winSound.play();

        return true;
    }

    return false;
}

// perder vida
function loseLife(){

    if(gamePaused) return;

    gamePaused=true;

    lives--;
    updateHUD();

    message.style.display="block";
    message.innerText="¡Has perdido una vida!";

    if(lives<=0){

        message.innerText="GAME OVER";

        gameOverSound.play();

        return;
    }

    setTimeout(resetPositions,3000);
}

// reiniciar ronda
function resetPositions(){

    message.style.display="none";

    player.x=canvas.width/2-player.w/2;

    bullets=[];

    direction=1;

    createAliens();

    gamePaused=false;
}

// loop
function gameLoop(){

    if(gamePaused){
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);

    movePlayer();
    moveBullets();
    moveAliens();

    collisions();

    drawPlayer();
    drawAliens();
    drawBullets();

    updateHUD();

    if(!checkWin()){
        requestAnimationFrame(gameLoop);
    }

}

gameLoop();