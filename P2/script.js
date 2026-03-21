// --- VARIABLES DE ESTADO ---
let claveSecreta = [];
let intentosRestantes = 7;
let segundos = 0;
let intervaloCrono = null;
let juegoTerminado = false;
let aciertos = 0;

// --- ELEMENTOS DEL DOM ---
const displayReloj = document.getElementById('timer');
const displayIntentos = document.getElementById('attempts-left');
const areaMensajes = document.getElementById('message-area');
const botonesNumeros = document.querySelectorAll('.num-btn');
const dígitosClave = document.querySelectorAll('.digit');

// --- LÓGICA DEL CRONÓMETRO ---
function actualizarCrono() {
    segundos++;
    let h = Math.floor(segundos / 3600);
    let m = Math.floor((segundos % 3600) / 60);
    let s = segundos % 60;
    displayReloj.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startCrono() {
    if (!intervaloCrono && !juegoTerminado) {
        intervaloCrono = setInterval(actualizarCrono, 1000);
    }
}

function stopCrono() {  
    clearInterval(intervaloCrono);
    intervaloCrono = null;
}

// --- LÓGICA DEL JUEGO ---

// Genera 4 dígitos distintos (Requisito Mínimo)
function generarClave() {
    const digitos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return digitos.sort(() => Math.random() - 0.5).slice(0, 4);
}

function inicializarJuego() {
    stopCrono();
    segundos = 0;
    intentosRestantes = 7;
    aciertos = 0;
    juegoTerminado = false;
    claveSecreta = generarClave();

    // Reset UI
    displayReloj.textContent = "0:00:00";
    displayIntentos.textContent = `Intentos restantes: ${intentosRestantes}`;
    areaMensajes.textContent = "Nueva partida. ¡Adivina la clave!";
    areaMensajes.style.color = "inherit";

    dígitosClave.forEach(d => {
        d.textContent = "*";
        d.classList.remove('active');
    });

    botonesNumeros.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('used');
    });
}

function procesarIntento(boton) {
    if (juegoTerminado) return;

    // Iniciar crono al primer toque si no estaba activo
    startCrono();

    const valor = parseInt(boton.value);
    boton.disabled = true;
    boton.classList.add('used');
    
    intentosRestantes--;
    displayIntentos.textContent = `Intentos restantes: ${intentosRestantes}`;

    let esAcierto = false;
    claveSecreta.forEach((num, index) => {
        if (num === valor) {
            dígitosClave[index].textContent = num;
            dígitosClave[index].classList.add('active');
            aciertos++;
            esAcierto = true;
        }
    });

    // Comprobar Finalización
    if (aciertos === 4) {
        finalizarJuego(true);
    } else if (intentosRestantes === 0) {
        finalizarJuego(false);
    }
}

function finalizarJuego(victoria) {
    juegoTerminado = true;
    stopCrono();
    
    botonesNumeros.forEach(btn => btn.disabled = true);

    if (victoria) {
        areaMensajes.innerHTML = `<strong>¡VICTORIA!</strong><br>Tiempo: ${displayReloj.textContent}<br>Gastados: ${7 - intentosRestantes} | Restantes: ${intentosRestantes}`;
        areaMensajes.style.color = "#00ff00";
    } else {
        areaMensajes.innerHTML = `<strong>GAME OVER</strong><br>La clave era: ${claveSecreta.join('')}<br>Pulsa Reset para reintentar.`;
        areaMensajes.style.color = "#ff4444";
        // Revelar lo que faltaba
        dígitosClave.forEach((d, i) => d.textContent = claveSecreta[i]);
    }
}

// --- EVENT LISTENERS ---
document.getElementById('btn-start').addEventListener('click', startCrono);
document.getElementById('btn-stop').addEventListener('click', stopCrono);
document.getElementById('btn-reset').addEventListener('click', inicializarJuego);

botonesNumeros.forEach(btn => {
    btn.addEventListener('click', () => procesarIntento(btn));
});

// Arrancar por primera vez al cargar
window.onload = inicializarJuego;