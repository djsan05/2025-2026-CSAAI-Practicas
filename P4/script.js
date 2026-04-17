const grid = document.getElementById("grid");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const levelSelect = document.getElementById("levelSelect");
const pairSelect = document.getElementById("pairSelect");
const levelDisplay = document.getElementById("levelDisplay");
const timeDisplay = document.getElementById("timeDisplay");
const statusDisplay = document.getElementById("statusDisplay");
const mainWord = document.getElementById("mainWord");
const music = document.getElementById("music");
const musicToggle = document.getElementById("musicToggle");

let gameRunning = false;
let timer = 0;
let timerInterval;

const parejas = {
    "cama,casa": {
        palabra1: "CAMA",
        palabra2: "CASA",
        icono1: "🛏️",
        icono2: "🏠"
    },
    "gato,pato": {
        palabra1: "GATO",
        palabra2: "PATO",
        icono1: "🐱",
        icono2: "🦆"
    },
    "sol,sal": {
        palabra1: "SOL",
        palabra2: "SAL",
        icono1: "☀️",
        icono2: "🧂"
    }
};

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getPattern(level){
    switch(level){
        case 1: return [1,1,1,1,2,2,2,2];
        case 2: return [1,2,1,2,1,2,1,2];
        case 3: return [1,1,2,2,1,1,2,2];
        case 4: return [2,1,2,1,2,1,2,1];
        case 5: return [1,2,2,1,2,1,1,2];
    }
}

function createGrid(level){
    const seleccion = parejas[pairSelect.value];
    const pattern = getPattern(level);

    grid.innerHTML = "";

    pattern.forEach(num => {
        const div = document.createElement("div");
        div.classList.add("card");

        if(num === 1){
            div.innerHTML = `
                <div>${seleccion.icono1}</div>
                <small>${seleccion.palabra1}</small>
            `;
        }else{
            div.innerHTML = `
                <div>${seleccion.icono2}</div>
                <small>${seleccion.palabra2}</small>
            `;
        }

        grid.appendChild(div);
    });
}

async function playGame(){
    gameRunning = true;
    timer = 0;

    startBtn.disabled = true;
    levelSelect.disabled = true;
    pairSelect.disabled = true;

    timerInterval = setInterval(()=>{
        timer++;
        timeDisplay.textContent = timer;
    },1000);

    if(musicToggle.checked){
        music.volume = 0.25;

        music.play().catch(error => {
        console.log("Audio bloqueado:", error);
});
    }

    let startLevel = parseInt(levelSelect.value);

    for(let level=startLevel; level<=5; level++){

        if(!gameRunning) return;

        levelDisplay.textContent = level;
        statusDisplay.textContent = "Preparando...";
        mainWord.textContent = "Prepárate...";
        createGrid(level);

        await sleep(1500);

        let speed = 900 - (level * 130);
        let cards = document.querySelectorAll(".card");

        statusDisplay.textContent = "Jugando";

        for(let i=0;i<8;i++){

            if(!gameRunning) return;

            cards.forEach(c => c.classList.remove("active"));
            cards[i].classList.add("active");

            mainWord.textContent = cards[i].innerText.trim();

            await sleep(speed);
        }
    }

    finishGame();
}

function finishGame(){
    gameRunning = false;
    clearInterval(timerInterval);
    music.pause();
    music.currentTime = 0;

    statusDisplay.textContent = "Finalizado";
    mainWord.textContent = "🎉 ¡Has ganado!";
    startBtn.disabled = false;
    levelSelect.disabled = false;
    pairSelect.disabled = false;
}

function stopGame(){
    gameRunning = false;
    clearInterval(timerInterval);
    music.pause();
    music.currentTime = 0;

    statusDisplay.textContent = "Detenido";
    mainWord.textContent = "Juego detenido";

    startBtn.disabled = false;
    levelSelect.disabled = false;
    pairSelect.disabled = false;
}

startBtn.addEventListener("click", playGame);
stopBtn.addEventListener("click", stopGame);