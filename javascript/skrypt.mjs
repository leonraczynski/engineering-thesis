import * as config from './config.mjs';
import * as collisions from './collisions.mjs';
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
    // Hero start position
    const heroX = Math.round((config.CANVAS_WIDTH - config.HERO_FRAME_WIDTH) / 2);
    const heroY = Math.round((config.CANVAS_HEIGHT - config.HERO_FRAME_HEIGHT) / 2);
    // Array of monsters
    let monsterArray = [];
    let npcArray = [];
    // Array of items
    let itemsArray = [];
    let lastHeroDirection = "";

    async function startGame() {
        try {
            const connected = await connectDatabase();
            const itemsLoaded = await loadItems();
            const assetsLoaded = await loadAssets();
            if (connected) {
                if (itemsLoaded) {
                    reciveUpdateCanvasRequest();
                    await drawObjects();
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
        await image.checkAllImagesLoaded();  
        ctx.drawImage(image.backgroundForest, mapX, mapY);
        await collisions.createCollisionObstacles(mapX, mapY, ctx);
        await characters.createCharacters(mapX, mapY, ctx);
        await characters.createMonsters(mapX, mapY, ctx);
        monsterArray = characters.getMonsterArray(); 
        characters.setHeroObject(hero);
        for (let i = 0; i < characters.monsterArray.length; i++) {
            characters.monsterArray[i].drawCharacter(ctx);
        }
        hero.drawCharacter(ctx);
        hero.breathing();  
        drawMinimap();
        configureButtons();
        updateCanvas();    
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

    function updateCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);                                   // Clear entire display
        ctx.drawImage(image.backgroundForest, mapX, mapY);                                  // Draw map
        for (let i = 0; i < collisions.obstacles.length; i++) {
            collisions.obstacles[i].draw(ctx);                                             // Draw [i] monsters
        }
        monsterArray = characters.getMonsterArray();                                        // Get monsters array
        for (let i = 0; i < monsterArray.length; i++) {
            monsterArray[i].drawCharacter(ctx);                                             // Draw [i] monsters
        }
        npcArray = characters.getNPCArray();                                                // Get NPC array
        for (let i = 0; i < npcArray.length; i++) {
            npcArray[i].drawCharacter(ctx);                                                // Draw [i] NPCs
        }
        hero.drawCharacter(ctx);                                                            // Draw hero
        characters.setHeroObject(hero);                                                     // Send hero object to the characters.js file
        drawMinimap();                                                                      // Draw minimap
        if (characters.isInvenoryOpen) {                                                    // Check if inventory is open
            characters.setIsInvenoryOpen(false);                                            // Set inventory to false because drawInventory function will open it again
            inventory.drawInventory(ctx);                                                   // Draw inventory
        }   

        ctx.fillStyle = 'red';
        ctx.fillRect(hero.positionX + hero.width / 2, hero.positionY + hero.height / 1.5, 6, 6);
        ctx.fillStyle = 'blue';
        ctx.fillRect(findNearestObstacle().positionX + findNearestObstacle().width / 2, findNearestObstacle().positionY + findNearestObstacle().height / 2, 6, 6);                                              
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
    const hero = new characters.Hero('Marvin', image.playerImage, config.HERO_FRAME_WIDTH, config.HERO_FRAME_HEIGHT, heroX, heroY, config.HERO_STEP_LENGTH, config.HERO_CAN_ATTACK, ctx);
    characters.setHeroObject(hero);                 // Send hero object to the characters.js file

    
         // Send monster array to the characters.js file

    

    this.document.onkeydown = function(e) {
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
                // console.log(inventory.inventoryFramesCords[1]);
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
            moveObjects(characters.heroDirection);
            updateCanvas();
        }
    }, 30);

    function checkObstacleCollision(direction) {
        const heroCenterX = hero.positionX + hero.width / 2;
        const heroCenterY = hero.positionY + hero.height / 1.5;
        const obstacle = findNearestObstacle();
    
        const obstacleCenterX = obstacle.positionX + obstacle.width / 2;
        const obstacleCenterY = obstacle.positionY + obstacle.height / 2;
    
        const heroRadius = Math.min(hero.width, hero.height) / 2.7;
        // const obstacleRadius = Math.min(obstacle.width, obstacle.height) / 2;
    
        const distanceX = Math.abs(heroCenterX - obstacleCenterX);
        const distanceY = Math.abs(heroCenterY - obstacleCenterY);
    
        if (direction === 'up' && heroCenterY > obstacleCenterY && distanceX <= heroRadius && distanceY <= heroRadius + hero.stepLength) {
            return false; // true
        } 
        else if (direction === 'down' && heroCenterY < obstacleCenterY && distanceX <= heroRadius && distanceY <= heroRadius + hero.stepLength) {
            return false;
        } 
        else if (direction === 'left' && heroCenterX > obstacleCenterX && distanceX <= heroRadius + hero.stepLength && distanceY <= heroRadius) {
            return false;
        } 
        else if (direction === 'right' && heroCenterX < obstacleCenterX && distanceX <= heroRadius + hero.stepLength && distanceY <= heroRadius) {
            return false;
        }
    
        return false;
    }
    
    function moveObjects() {
        const stepLength = hero.stepLength;
    
        function updatePosition(objectArray, axis, sign) {
            for (let i = 0; i < objectArray.length; i++) {
                objectArray[i][axis] += sign * stepLength;
            }
        }
    
        if (keyState["ArrowUp"] && lastHeroDirection === 'up' && !checkObstacleCollision('up')) {
            mapY += stepLength;
            updatePosition(collisions.obstacles, 'positionY', 1);
            updatePosition(monsterArray, 'positionY', 1);
            updatePosition(npcArray, 'positionY', 1);
        } else if (keyState["ArrowDown"] && lastHeroDirection === 'down' && !checkObstacleCollision('down')) {
            mapY -= stepLength;
            updatePosition(collisions.obstacles, 'positionY', -1);
            updatePosition(monsterArray, 'positionY', -1);
            updatePosition(npcArray, 'positionY', -1);
        } else if (keyState["ArrowLeft"] && lastHeroDirection === 'left' && !checkObstacleCollision('left')) {
            mapX += stepLength;
            updatePosition(collisions.obstacles, 'positionX', 1);
            updatePosition(monsterArray, 'positionX', 1);
            updatePosition(npcArray, 'positionX', 1);
        } else if (keyState["ArrowRight"] && lastHeroDirection === 'right' && !checkObstacleCollision('right')) {
            mapX -= stepLength;
            updatePosition(collisions.obstacles, 'positionX', -1);
            updatePosition(monsterArray, 'positionX', -1);
            updatePosition(npcArray, 'positionX', -1);
        }
    }
    

    function findNearestObstacle() {
        const heroCenterPointX = hero.positionX + hero.frameWidth / 2 - 1;
        const heroCenterPointY = hero.positionY + hero.frameHeight / 1.5;
        let nearestObstacle = null;
        let distance = Infinity; 
        for (let i = 0; i < collisions.obstacles.length; i++) {
            const obstacleCenterPointX = collisions.obstacles[i].positionX + collisions.obstacles[i].width / 2;
            const obstacleCenterPointY = collisions.obstacles[i].positionY + collisions.obstacles[i].height / 2;
            const distanceBetween = Math.sqrt(Math.pow(heroCenterPointX - obstacleCenterPointX, 2) + Math.pow(heroCenterPointY - obstacleCenterPointY, 2));
            if (distanceBetween < distance) {
                distance = distanceBetween;
                nearestObstacle = collisions.obstacles[i];
                
            }
        }
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(nearestObstacle.positionX + nearestObstacle.width / 2, nearestObstacle.positionY + nearestObstacle.height / 2, 6, 6);
        return nearestObstacle;
    }

    startGame();
});

