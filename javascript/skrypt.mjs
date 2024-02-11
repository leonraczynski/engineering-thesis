import * as config from './config.mjs';
import * as sound from './sounds.mjs';
import * as collisions from './collisions.mjs';
import * as image from './images.mjs';
import { sleep } from './utilities.mjs';
import * as characters from './characters.mjs';
import * as inventory from './inventory.mjs';
import * as progress from './progress.mjs';
import * as request from './requests.mjs';

// GUI elements
const buttons = document.querySelectorAll('button');
const initialScreen = document.querySelector('.start-game-overlay');
const initialText = document.querySelector('.start-game-text');
const inventoryButton = document.querySelector('#inventory-button');
const settingsButton = document.querySelector('#settings-button');
const loadButton = document.querySelector('#load-button');
const logoutButton = document.querySelector('#logout-button');

const arrows = {
    38: 'up',
    39: 'right',
    40: 'down',
    37: 'left',
}

let keyState = {
    "ArrowUp": false,
    "ArrowRight": false,
    "ArrowDown": false,
    "ArrowLeft": false,
    "KeyT": false,
    "Space": false,
    "Enter": false,
}

export let initialScreenDisplayed = true;
// Map start position
export let heroMapX = null;
export let heroMapY = null;
export let mapX = null;
export let mapY = null;
// Array of monsters
let monsterArray = [];
let npcArray = [];
let lastHeroDirection = "";
let hero = null;
export let isInvenoryOpen = false;
export let isSettingsWindowOpen = false;

window.addEventListener('load', function() {
    // Main canvas element
    const canvas = document.querySelector('#main-canvas');
    const ctx = canvas.getContext('2d');
    // Text canvas element
    const textCanvas = document.querySelector('#text-canvas');
    const textCtx = textCanvas.getContext('2d');
    // Minimap element
    const minimapCanvas = document.querySelector('#minimap');
    const minimapCtx = minimap.getContext('2d');
    // Canvas size settings
    canvas.width = config.CANVAS_WIDTH;
    canvas.height = config.CANVAS_HEIGHT;
    // Text canvas size settings
    const ratio = window.devicePixelRatio || 1;
    textCanvas.width = parseInt(getComputedStyle(textCanvas).width) * ratio;
    textCanvas.height = parseInt(getComputedStyle(textCanvas).height) * ratio;
    textCtx.scale(ratio, ratio);
    // Minimap size settings
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;

    async function startGame() {
        try {
            const logged = await request.loggedUser();
            if (!logged) {
                window.location.assign('http://localhost:3000/login');
            }
            const connected = await request.connectDatabase();
            const itemsLoaded = await request.loadItems();
            if (connected) {
                if (itemsLoaded) {
                    reciveUpdateCanvasRequest();
                    await drawCanvasElements();
                    await inventory.createInventory(ctx);
                    await inventory.loadInventory();
                } else {
                    console.error('Failed to load items.');
                }
            } else {
                console.error('Failed to connect to the database.');
            }
        } catch (error) {
            console.error('Error requesting from the server:', error);
        }
        initialText.style.animationPlayState = 'running';
    }

    // Draw all game objects (once the game is loaded)
    async function drawCanvasElements() {
        await image.checkAllImagesLoaded();
        hero = characters.createHero(ctx, textCtx);
        const loadGame = await request.loadGame();
        ctx.drawImage(image.backgroundForest, mapX, mapY);
        createInteractionObjects();
        hero.drawCharacter(ctx, textCtx);
        hero.breathing();  
        drawMinimap();
        configureButtons();   
    }

    async function createInteractionObjects() {
        await collisions.createCollisionObstacles(mapX, mapY);
        await characters.createCharacters(mapX, mapY, ctx, textCtx);
        await characters.createMonsters(mapX, mapY, ctx, textCtx);
        await progress.createNewLocationAreas(mapX, mapY);
    }

    function drawMinimap() {
         // Calculate minimap scale
        const scale = minimapCanvas.width / image.backgroundForest.width;

        // Scale hero position on minimap (red point)
        let heroMinimapPositionXScaled = -mapX * scale + hero.positionX * scale;
        let heroMiniapPositionYScaled = -mapY * scale + hero.positionY * scale;
        
        // Drawing and positioning minimap elements
        ctx.rect(canvas.width - minimapCanvas.width - 8, canvas.height - minimapCanvas.height - 8, minimapCanvas.width, minimapCanvas.height);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.drawImage(minimapCanvas, canvas.width - minimapCanvas.width - 8, canvas.height - minimapCanvas.height - 8);
        minimapCtx.drawImage(image.backgroundForest, 0, 0, image.backgroundForest.width, image.backgroundForest.height, 0, 0, image.backgroundForest.width * scale, image.backgroundForest.height * scale);
        minimapCtx.fillStyle = "red";
        minimapCtx.fillRect(heroMinimapPositionXScaled, heroMiniapPositionYScaled, hero.width * scale + 2, hero.height * scale + 2);
        ctx.drawImage(image.minimapFrame, canvas.width - image.minimapFrame.width, canvas.height - image.minimapFrame.height);
    }

    function configureButtons() {
        // Inventory button
        inventoryButton.style.top = canvas.height - 252 + 'px';
        inventoryButton.style.left = canvas.width - 208 + 'px';
        // Settings button
        settingsButton.style.top = canvas.height - 252 + 'px';
        settingsButton.style.left = canvas.width - 104 + 'px';
    }  

    function updateCanvas() {
        if (hero.isDead) {
            gameOver(true);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);                                   // Clear entire display
        textCtx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image.backgroundForest, mapX, mapY);                                  // Draw map
        for (let i = 0; i < collisions.obstacles.length; i++) {
            collisions.obstacles[i].draw(ctx);                                              // Draw [i] monsters
        }
        monsterArray = characters.getMonsterArray();                                        // Get monsters array
        for (let i = 0; i < monsterArray.length; i++) {
            characters.monsterArray[i].drawCharacter(ctx, textCtx);                         // Draw [i] monsters
        }
        npcArray = characters.getNPCArray();                                                // Get NPC array
        for (let i = 0; i < npcArray.length; i++) {
            npcArray[i].drawCharacter(ctx, textCtx);                                        // Draw [i] NPCs
        }
        for (let i = 0; i < progress.locations.length; i++) {
            progress.locations[i].draw(ctx);                                                // Draw [i] locations
        }
        hero.drawCharacter(ctx, textCtx);                                                   // Draw hero
        characters.setHeroObject(hero);                                                     // Send hero object to the characters.js file
        battleMusic();
        progress.displayQuestFrame(ctx, textCtx, minimapCanvas);
        drawMinimap();                                                                      // Draw minimap
        characters.displayInteractionText(textCtx);
        characters.NPCInteraction(ctx, textCtx);
        progress.discoverLocation();
        progress.nextStage();

        if (progress.flags['locationText']) {
            progress.displayLocationText(textCtx);
        } 
        
        if (progress.flags['questCompleteText']) {
            progress.questCompleteText('Misja Zakończona', 70, textCtx);
        } 
        
        if (progress.flags['prologueCompleteText']) {
            progress.questCompleteText('Prolog Zakończony', 90, textCtx);
        }
    }

    async function reciveUpdateCanvasRequest() {
        // Listen for canvas updates request from the characters.js file
        while (true) {
            if ((characters.updateRequest || inventory.updateRequest) && !initialScreenDisplayed) {
                updateCanvas();
            }
            await sleep(config.GAME_UPDATE_SPEED); // Adjust the sleep time as needed (or as low as possible for best performance)
        }
    }

    this.document.onkeydown = async function(e) {
        // characters.Hero movement control
        switch (e.keyCode) {
            case 37:
                // Send hero direction to the character.js file
                characters.setHeroDirection('left');
                lastHeroDirection = 'left';
                keyState["ArrowLeft"] = true;
                break;

            case 38:
                characters.setHeroDirection('up');
                lastHeroDirection = 'up';
                keyState["ArrowUp"] = true;
                break;
            
            case 39:
                characters.setHeroDirection('right');
                lastHeroDirection = 'right';
                keyState["ArrowRight"] = true;
                break;
            
            case 40:
                characters.setHeroDirection('down');
                lastHeroDirection = 'down';
                keyState["ArrowDown"] = true;
                break;
            
            case 32:
                // [SPACE]
                if (e.repeat) {
                    // Prevent from holding [SPACE] key
                    break;
                }
                hero.attack(characters.heroDirection);
                if (hero.conversation.isTalking && hero.conversation.role == 'ask') {
                    hero.conversation.role = 'answer';
                    hero.conversation.dialogue++;
                }
                else if (hero.conversation.isTalking && hero.conversation.role == 'answer') {
                    hero.conversation.role = 'ask';
                }
                keyState["Space"] = true;
                break;

            case 73:
                // [I]
                if (e.repeat) {
                    // Prevent from holding [I] key
                    break;
                }
                inventoryButton.style.filter = "contrast(50%)";                 // Apply click effect on inventory button
                drawInventory();
                break;

            case 76:
                // [L]
                if (e.repeat) {
                    // Prevent from holding [L] key
                    break;
                }
                settingsButton.style.filter = "contrast(50%)";
                drawSettings();
                break;

            case 84:
                // [T]
                keyState["KeyT"] = true;
                if (characters.displayInteractionText(textCtx) && !hero.conversation.isTalking) {
                    hero.conversation.isTalking = true;
                }
                else if (!characters.displayInteractionText(textCtx) || hero.conversation.isTalking) {
                    hero.conversation.isTalking = false;
                    hero.conversation.role = 'answer';
                    hero.conversation.dialogue = 0;
                }     
                break;

            case 13:
                // [ENTER]
                keyState["Enter"] = true;
                if (initialScreenDisplayed) {
                    initialScreen.style.animationPlayState = 'running';
                    sound.SOUNDTRACK.play();
                    initialScreenDisplayed = false;
                    updateCanvas();
                }
                if (hero.isDead) {
                    // close dead screen and change current position of character
                    hero.isDying = false;
                    hero.isDead = false;
                    gameOver(false);
                    window.location.assign('http://localhost:3000/game');
                }
                break;
        }

        if (arrows[e.keyCode] && !isInvenoryOpen) {
            // If any key from arrows object is pressed, move hero
            hero.isMoving = true;
        }
    }

    this.document.onkeyup = function(e) {
        switch (e.keyCode) {
            case 37:
                // left arrow
                // Change hero animation starting frame to breathing in particular direction
                hero.frameY = 2;
                // Reset key pressed state
                keyState["ArrowLeft"] = false;
                break;

            case 38:
                // up arrow
                hero.frameY = 1;
                keyState["ArrowUp"] = false;
                break;
            
            case 39:
                // right arrow
                hero.frameY = 3;
                keyState["ArrowRight"] = false;
                break;
            
            case 40:
                // down arrow
                hero.frameY = 0;
                keyState["ArrowDown"] = false;
                break;

            case 73:
                // [I]
                inventoryButton.style.filter = "contrast(100%)";
                break;

            case 76:
                // [L]
                settingsButton.style.filter = "contrast(100%)";
                break;

            case 84:
                // [T]
                keyState["KeyT"] = false;
                break;

            case 32:
                // [SPACE]
                keyState["Space"] = false;
                break;

            case 13:
                // [ENTER]
                keyState["Enter"] = false;
                break;
        }

        if (arrows[e.keyCode]) {
            updateCanvas();
            hero.isMoving = false;
            hero.breathing();
        }
    }

    setInterval(function() {
        // Function prevents from irregular movement caused by key pressed and a little pause before next move
        if (keyState["ArrowDown"]) {
            hero.frameY = 4;
        }

        else if (keyState["ArrowUp"]) {
            hero.frameY = 5;
        }

        else if (keyState["ArrowLeft"]) {
            hero.frameY = 6;
        }

        else if (keyState["ArrowRight"]) {
            hero.frameY = 7;
        }

        if ((keyState["ArrowDown"] || keyState["ArrowUp"] || keyState["ArrowLeft"] || keyState["ArrowRight"]) && !isInvenoryOpen) {
            hero.move();
            moveObjects(characters.heroDirection);
            updateCanvas();
        }
    }, 30);
    
    function moveObjects() {
        const stepLength = hero.stepLength;
        
        if (initialScreenDisplayed) {
            return;
        }
        function updatePosition(objectArray, axis, sign) {
            for (let i = 0; i < objectArray.length; i++) {
                objectArray[i][axis] += sign * stepLength;
            }
        }
    
        if (keyState["ArrowUp"] && lastHeroDirection === 'up' && !collisions.checkObstacleCollision(hero, 'up')) {
            mapY += stepLength;
            updatePosition(collisions.obstacles, 'positionY', 1);
            updatePosition(monsterArray, 'positionY', 1);
            updatePosition(npcArray, 'positionY', 1);
            updatePosition(progress.locations, 'positionY', 1);
        } else if (keyState["ArrowDown"] && lastHeroDirection === 'down' && !collisions.checkObstacleCollision(hero, 'down')) {
            mapY -= stepLength;
            updatePosition(collisions.obstacles, 'positionY', -1);
            updatePosition(monsterArray, 'positionY', -1);
            updatePosition(npcArray, 'positionY', -1);
            updatePosition(progress.locations, 'positionY', -1);
        } else if (keyState["ArrowLeft"] && lastHeroDirection === 'left' && !collisions.checkObstacleCollision(hero, 'left')) {
            mapX += stepLength;
            updatePosition(collisions.obstacles, 'positionX', 1);
            updatePosition(monsterArray, 'positionX', 1);
            updatePosition(npcArray, 'positionX', 1);
            updatePosition(progress.locations, 'positionX', 1);
        } else if (keyState["ArrowRight"] && lastHeroDirection === 'right' && !collisions.checkObstacleCollision(hero, 'right')) {
            mapX -= stepLength;
            updatePosition(collisions.obstacles, 'positionX', -1);
            updatePosition(monsterArray, 'positionX', -1);
            updatePosition(npcArray, 'positionX', -1);
            updatePosition(progress.locations, 'positionX', -1);
        }
    }

    function gameOver(reset) {
        const overlay = document.querySelector('.game-over-overlay');
        sound.SOUNDTRACK.pause();
        if (!reset) {
            hero.health = 100;
            overlay.style.display = 'none';
            return;
        }
        sound.BATTLE_MUSIC.pause();
        sound.DEAD_SOUND.play();
        overlay.style.display = 'block';
        overlay.style.animationPlayState = 'running';
    }

    function drawInventory() {
        const inventoryWindow = document.querySelector('.inventory');
        if (isInvenoryOpen) {
            isInvenoryOpen = false;
            inventory.drawItems();
            inventoryWindow.style.display = 'none';
        } else if (!isInvenoryOpen) {
            isInvenoryOpen = true;
            inventory.writeHeroStats();
            inventory.writeHeroMoney();
            inventory.drawItems();
            inventoryWindow.style.display = 'block';
        }
    }

    function drawSettings() {
        const settingsWindow = document.querySelector('.menu-buttons');
        if (isSettingsWindowOpen) {
            isSettingsWindowOpen = false;
            settingsWindow.style.display = 'none';
        } else if (!isSettingsWindowOpen) {
            isSettingsWindowOpen = true;
            settingsWindow.style.display = 'flex';
        }
    }

    function battleMusic() {
        let chasingMonsters = 0;
        for (let i = 0; i < monsterArray.length; i++) {
            if (monsterArray[i].chasing) {
                chasingMonsters++;
                break;
            } 
        }

        if (chasingMonsters > 0) {
            sound.SOUNDTRACK.pause();
            sound.BATTLE_MUSIC.play();
        } else {
            sound.BATTLE_MUSIC.pause();
            sound.BATTLE_MUSIC.currentTime = 0;
            sound.SOUNDTRACK.play();
        }
    }

    buttons.forEach(function(button) {
        button.addEventListener('mouseover', function() {
            sound.HOVER_SOUND.play();
        })
    })

    loadButton.addEventListener('click', async function() {
        sound.CLICK_SOUND.play();
        window.location.assign('http://localhost:3000/game');
    })
    
    logoutButton.addEventListener('click', async function() {
        sound.CLICK_SOUND.play();
        const logout = await request.logoutRequest();
    })

    startGame();
});

sound.SOUNDTRACK.addEventListener('ended', () => {
    sound.SOUNDTRACK.currentTime = 0;
    sound.SOUNDTRACK.play();
  });

export function setMapCordinates(x, y) {
    mapX = x;
    mapY = y;
}
