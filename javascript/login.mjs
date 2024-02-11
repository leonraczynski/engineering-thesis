
import * as request from './requests.mjs';
import * as sound from './sounds.mjs';
import { sleep } from './utilities.mjs';

const loginButton = document.querySelector('#login-button');
const registerButton = document.querySelector('#register-button');


// Add an event listener to the login button
loginButton.addEventListener('click', async function() {
    sound.CLICK_SOUND.play();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username.length < 3 || password.length < 3) {
        const message = `Nazwa użytkownika i/lub hasło jest za krótkie`;
        displayErrorMessage(message);
        return;
    }

    if (!await request.loginRequest(username, password)) {
        const message = `Nieprawidłowa nazwa użytkownika lub hasło!`;
        displayErrorMessage(message);
    }
    loadGame();
})

// Add an event listener to the login button
loginButton.addEventListener('mouseover', function() {
    sound.HOVER_SOUND.play();
})

// Add an event listener to the register button
registerButton.addEventListener('click', async function() {
    sound.CLICK_SOUND.play();
    console.log("test");
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username.length < 3 || password.length < 3) {
        const message = `Nazwa użytkownika i/lub hasło jest za krótkie`;
        displayErrorMessage(message);
        return;
    }

    if (!await request.registerRequest(username, password)) {
        const message = `Bohater o podanym imieniu już istnieje!`;
        displayErrorMessage(message);
    }
    if (!await request.createHeroRequest()) {
        const message = `Błąd podczas tworzenia bohatera!`;
        displayErrorMessage(message);
    }
    for (let i = 0; i < 14; i++) {
        const frame = 'frame' + i;
        if (!await request.createInventoryRequest(frame)) {
            const message = `Błąd podczas tworzenia ekwipunku!`;
            displayErrorMessage(message);
        }
    }
    
    loadGame();
})

// Add an event listener to the register button
registerButton.addEventListener('mouseover', function() {
    sound.HOVER_SOUND.play();
})

// Display error message
async function displayErrorMessage(msg) {
    const loginForm = document.querySelector('.login-form-div');
    const errorMessage = document.querySelector('.error-message');
    loginForm.style.display = 'none';
    errorMessage.style.display = 'block';
    errorMessage.innerHTML = msg;
    await sleep(3500);
    errorMessage.style.display = 'none';
    loginForm.style.display = 'flex';
}

// On window load function
window.addEventListener('load', async function() {
    await request.connectDatabase();
    titlePositioning();
})

function titlePositioning() {
    const image = new Image();
    image.src = 'Graphics/GUI/ekran_logowania.png';

    const title = document.querySelector('.game-title');
    const imageHeight = image.height * 0.6; // Ponieważ obraz jest skalowany do 60%
    const topGap = (window.innerHeight - imageHeight) / 2;
    title.style.top = topGap + 'px'; 
}

function loadGame() {
    window.location.assign('http://localhost:3000/game');
}