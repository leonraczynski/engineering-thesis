import * as config from './config.mjs';
import * as image from './images.mjs';
import { sleep, random } from './utilities.mjs';
import * as characters from './characters.mjs';
import * as inventory from './inventory.mjs';

window.addEventListener('load', function() {
    // Canvas element
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    // Minimap element
    const minimapCanvas = document.querySelector('#minimap');
    const minimapCtx = minimap.getContext('2d');
    // GUI elements
    const inventoryButton = this.document.querySelector('#inventory-button');
    const settingsButton = this.document.querySelector('#settings-button');
    // Canvas size settings
    canvas.width = config.CANVAS_WIDTH;
    canvas.height = config.CANVAS_HEIGHT;
    // Minimap size settings
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
    
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
        "ArrowLeft": false
    }

    // Map start position
    let mapX = 0;
    let mapY = -200;
    // Array of monsters
    let monsterArray = [];
    let numberOfMonsters = config.GOLEM_COUNT;
    // Array of items
    let itemsArray = [];

    async function startGame() {
        try {
            const connected = await connectDatabase();
            const itemsLoaded = await loadItems();
            const assetsLoaded = await loadAssets();
            if (connected) {
                if (itemsLoaded) {
                    reciveUpdateCanvasRequest();
                    drawObjects();
                    inventory.createInventory(ctx);
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
    }

    async function connectDatabase() {
        try {
            const response = await fetch('/api/connect');
            if (!response.ok) {
                throw new Error('Failed to connect to the database');
            }
            const data = await response.json();
            console.log('Request successful:', data);
            return true;
        } catch (error) {
            console.error('Request failed:', error);
            return false;
        }
    }

    async function loadAssets() {
        try {
            const response = await fetch('/api/load-assets');
            if (!response.ok) {
                throw new Error('Failed to load assets');
            }
            const data = await response.json();
            if (data) {
                document.body.style.cursor = 'url(' + data.assets[0].asset_image + ') 0 0, auto';
                console.log("Assets loaded!");
            } 
            return true;
        } catch (error) {
            console.error('Request failed:', error);
            return false;
        }
    }

    async function loadItems() {
        try {
            const response = await fetch('/api/load-items');
            if (!response.ok) {
                throw new Error('Failed to load items');
            }
            const data = await response.json();

            for (let i = 0; i < data.items.length; i++) {
                if (data.items[i].item_image != null) {
                    const id = data.items[i].id_ite_item;
                    const image = data.items[i].item_image;
                    const type = data.items[i].item_type;
                    const name = data.items[i].item_name;
                    const damage = data.items[i].item_damage;
                    const defense = data.items[i].item_defense;
                    const hitpoints = data.items[i].item_hitpoints;
                    const cost = data.items[i].item_cost;
                    itemsArray.push(new inventory.Item(id, 'url(' + image + ')', type, name, damage, defense, hitpoints, cost));
                }
            }
            inventory.setItemsArray(itemsArray);

            return true;
        } catch (error) {
            console.error('Request failed:', error);
            return false;
        }
    }


    // Draw all game objects (once the game is loaded)
    async function drawObjects() {
        if (await image.checkAllImagesLoaded()) {   
            ctx.drawImage(image.backgroundForest, mapX, mapY);
            characters.getHeroObject(hero);
            for (let i = 0; i < monsterArray.length; i++) {
                monsterArray[i].drawCharacter(ctx);
            }
            hero.drawCharacter(ctx);
            hero.breathing();
            
            drawMinimap();
            configureButtons();
            updateCanvas();
        }
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
        minimapCtx.fillRect(heroMinimapPositionXScaled, heroMiniapPositionYScaled, hero.width * scale, hero.height * scale);
        ctx.drawImage(image.minimapFrame, canvas.width - image.minimapFrame.width, canvas.height - image.minimapFrame.height);
    }

    function configureButtons() {
        // Inventory button
        inventoryButton.style.position = 'fixed';
        inventoryButton.style.top = canvas.height - 252 + 'px';
        inventoryButton.style.left = canvas.width - 208 + 'px';
        inventoryButton.style.backgroundImage = 'url("Graphics/GUI/inventory_button.png")';
        // Settings button
        settingsButton.style.position = 'fixed';
        settingsButton.style.top = canvas.height - 252 + 'px';
        settingsButton.style.left = canvas.width - 104 + 'px';
        settingsButton.style.backgroundImage = 'url("Graphics/GUI/settings_button.png")';
    }  

    function changeMapCordinates(side) {
        // Change map coordinates whenever hero moves
        if (side == 'up') {
            mapY += hero.stepLength;
            // Move all monsters in the opposite direction to the hero
            for (let i = 0; i < monsterArray.length; i++) {
                monsterArray[i].positionY += hero.stepLength;
            }
        }

        else if (side == 'down') {
            mapY -= hero.stepLength;
            for (let i = 0; i < monsterArray.length; i++) {
                monsterArray[i].positionY -= hero.stepLength;
            }
        }

        else if (side == 'left') {
            mapX += hero.stepLength;
            for (let i = 0; i < monsterArray.length; i++) {
                monsterArray[i].positionX += hero.stepLength;
            }
        }

        else if (side == 'right') {
            mapX -= hero.stepLength;
            for (let i = 0; i < monsterArray.length; i++) {
                monsterArray[i].positionX -= hero.stepLength;
            }
        }
    }

    function updateCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);                                   // Clear entire display
        ctx.drawImage(image.backgroundForest, mapX, mapY);                                  // Draw map
        monsterArray = characters.getMonsterArray();                                        // Set monsters array
        for (let i = 0; i < monsterArray.length; i++) {
            monsterArray[i].drawCharacter(ctx);                                             // Draw [i] monsters
        }
        hero.drawCharacter(ctx);                                                            // Draw hero
        characters.getHeroObject(hero);                                                     // Send hero object to the characters.js file
        drawMinimap();                                                                      // Draw minimap
        if (characters.isInvenoryOpen) {                                                    // Check if inventory is open
            characters.setIsInvenoryOpen(false);                                            // Set inventory to false because drawInventory function will open it again
            inventory.drawInventory(ctx);                                                   // Draw inventory
        }                                                                     
    }

    async function reciveUpdateCanvasRequest() {
        // Listen for canvas updates request from the characters.js file
        while (true) {
            if (characters.updateRequest || inventory.updateRequest) {
                updateCanvas();
            }
            await sleep(10);
        }
    }
    
    // Create hero object
    const hero = new characters.Hero('Marvin', image.playerImage, config.HERO_FRAME_WIDTH, config.HERO_FRAME_HEIGHT, 0, 0, config.HERO_STEP_LENGTH, config.HERO_CAN_ATTACK, ctx);
    
    // Send hero object to the characters.js file
    characters.getHeroObject(hero);

    // Create monster objects and push them to the array
    for (let i = 0; i < numberOfMonsters; i++) {
        monsterArray.push(new characters.Golem('Golem', image.golemImage, config.GOLEM_FRAME_WIDTH, config.GOLEM_FRAME_HEIGHT, random(config.GOLEM_DETECTION_DISTANCE, 300), random(config.GOLEM_DETECTION_DISTANCE, 300), config.GOLEM_STEP_LENGTH, config.GOLEM_CAN_ATTACK, config.GOLEM_HEALTH, ctx));   
    }
    
    // Send monster array to the characters.js file
    characters.setMonsterArray(monsterArray);

    this.document.onkeydown = function(e) {
        // characters.Hero movement control
        switch (e.keyCode) {
            case 37:
                // Send hero direction to the character.js file
                characters.setHeroDirection('left');
                keyState["ArrowLeft"] = true;
                break;

            case 38:
                characters.setHeroDirection('up');
                keyState["ArrowUp"] = true;
                break;
            
            case 39:
                characters.setHeroDirection('right');
                keyState["ArrowRight"] = true;
                break;
            
            case 40:
                characters.setHeroDirection('down');
                keyState["ArrowDown"] = true;
                break;
            
            case 32:
                // [SPACE]
                hero.attack(characters.heroDirection);
                break;

            case 73:
                // [I]
                if (e.repeat) {
                    // Prevent from holding [I] key
                    break;
                }
                inventoryButton.style.filter = "contrast(50%)";                 // Apply click effect on inventory button
                inventory.drawInventory(ctx);                                   // Open inventory
                break;

            case 76:
                // [L]
                settingsButton.style.filter = "contrast(50%)";
                break;

            case 77:
                // [M]
                console.log(inventory.inventoryFramesCords[1]);
                break;
        }

        if (arrows[e.keyCode]) {
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

        if (keyState["ArrowDown"] || keyState["ArrowUp"] || keyState["ArrowLeft"] || keyState["ArrowRight"]) {
            hero.move();
            changeMapCordinates(characters.heroDirection);
            updateCanvas();
        }
    }, 30);

    window.onresize = function(event) {
  
    };

    
    startGame();
    // console.log(window.innerWidth);
});

