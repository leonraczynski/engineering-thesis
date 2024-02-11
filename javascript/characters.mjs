import { initialScreenDisplayed } from "./skrypt.mjs";
import * as config from "./config.mjs";
import { isInvenoryOpen, isSettingsWindowOpen } from "./skrypt.mjs";
import * as sound from "./sounds.mjs";
import * as image from "./images.mjs";
import * as progress from "./progress.mjs";
import { Obstacles, checkObstacleCollision } from "./collisions.mjs";
import { charactersMap } from "./charactersMap.mjs";
import { monstersMap } from "./monstersMap.mjs";
import { sleep, random, displayText } from './utilities.mjs';
import dialogues from './dialogues.json' assert { type: "json" };

export let updateRequest = false;
export let heroDirection = 'down';

export let hero = null;
export const monsterArray = [];
export const npcArray = [];


class Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx, textCtx) {
        this.name = name;
        this.image = image;
        // Szerokość i wysokość danego obrazka z ruchem bohatera
        this.frameWidth = width;
        this.frameHeight = height;
        this.width = this.frameWidth;
        this.height = this.frameHeight;
        this.positionX = x;
        this.positionY = y;
        // Wybór rzędu i kolumny z danym ruchem bohatera
        this.frameX = 0;
        this.frameY = 0;
        this.health = 100;
        this.defense = 10;
        this.damage = 0;
        this.stepLength = step_length;
        this.canAttack = can_attack;
        this.isAttacking = false;
        this.damageTaken = 0;
        this.ctx = ctx;
        this.textCtx = textCtx;
    }

    drawCharacter(element) {
        element.drawImage(this.image, this.frameX * this.frameWidth, this.frameY * this.frameHeight, this.frameWidth,
            this.frameHeight, this.positionX, this.positionY, this.width, this.height);
        if (this.canAttack) {
            this.drawHealthBar();
        }

        if (!isInvenoryOpen && !isSettingsWindowOpen) {
            this.writeName();
        }
        // ctx.strokeRect((this.positionX + this.frameWidth / 4), (this.positionY + this.frameHeight / 6), this.width / 2, this.height / 1.5);
    }

    drawHealthBar() {
        const healthPoints = config.GOLEM_HEALTH;
        this.ctx.beginPath();
        // Punkt A (początek linii)     
        this.ctx.moveTo((this.positionX + ((this.width - this.health) / 2)), this.positionY - 5);
        // Punkt B (koniec linii)    
        this.ctx.lineTo((this.positionX + ((this.width - this.health) / 2)) + (this.health - this.damageTaken), this.positionY - 5);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#d90909';
        this.ctx.stroke();
    }

    writeName() {
        const name = this.name;
        // const fontFamily = 'Almendra';
        const textWidth = this.textCtx.measureText(name).width;
    
        const x = this.positionX + (this.frameWidth - textWidth) / 2;
        const y = this.positionY - 10;
    
        displayText(name, 20, 'Medieval Sharp', x, y, '#d4cebe', this.textCtx);
    }
}

export class Monster extends Basic {
    constructor(name, image, width, height, x, y, step_length, can_attack, ctx, textCtx, health) {
        super(name, image, width, height, x, y, step_length, can_attack, ctx, textCtx);
        this.canChase = false;
        this.chasing = false;
        this.health = health;
        this.flag = false;
        this.move();
        this.noticeHero();
        this.chase();
        this.attack();
    }
    async move() {
        // Metoda zmieniająca obrazek z ruchem potwora
        while (true) {
            if (this.canChase && !isInvenoryOpen && !initialScreenDisplayed) {
                if (this.frameX < config.GOLEM_FRAMES_COUNT - 1) {
                    this.frameX++;
                }
                else {
                    this.frameX = 0;
                }
                updateCanvasRequest(); 
            }

            else {
                this.frameX = 0;
            }
            await sleep(180);        
        }
    }

    async noticeHero() {
        // Metoda sprawdzająca, czy bohater jest w poblizu
        while (true) {
            if ((this.positionX + config.GOLEM_DETECTION_DISTANCE) > (hero.positionX + hero.frameWidth / 2) && (hero.positionX + hero.frameWidth / 2) > (this.positionX - config.GOLEM_DETECTION_DISTANCE) && 
                (this.positionY + config.GOLEM_DETECTION_DISTANCE) > (hero.positionY + hero.frameHeight / 2) && (hero.positionY + hero.frameHeight / 2) > (this.positionY - config.GOLEM_DETECTION_DISTANCE)) {
                    this.canChase = true;                  
            }
            
            else {
                this.canChase = false;
            }
            
            await sleep(10);
        } 
    }

    async chase() {
        // Metoda odpowiadająca za pościg za bohaterem
        while (true) {
            if (this.canChase && !initialScreenDisplayed && !isInvenoryOpen && !this.flag) {
                this.chasing = true;
                let newX = this.positionX;
                let newY = this.positionY;
    
                if ((this.positionX + this.frameWidth / 2) < (hero.positionX + hero.frameWidth / 2)) {
                    // Monster is left of the hero, try to move right
                    if (!checkObstacleCollision(this, 'right')) {
                        newX += this.stepLength;
                    }
                } else {
                    // Monster is right of the hero, try to move left
                    if (!checkObstacleCollision(this, 'left')) {
                        newX -= this.stepLength;
                    }
                }
    
                if ((this.positionY + this.frameHeight / 2) < (hero.positionY + hero.frameHeight / 2)) {
                    // Monster is above the hero, try to move down
                    if (!checkObstacleCollision(this, 'down')) {
                        newY += this.stepLength;
                    }
                } else {
                    // Monster is below the hero, try to move up
                    if (!checkObstacleCollision(this, 'up')) {
                        newY -= this.stepLength;
                    }
                }
    
                // Update monster position
                this.positionX = newX;
                this.positionY = newY;
            
            } else {
                this.chasing = false;
            }
            await sleep(config.MONSTER_CHASING_SPEED);
        }
    }

    async attack() {
        while (true) {
            if (canDealDamage(this, hero) && !isInvenoryOpen && !this.flag && !initialScreenDisplayed) {
                this.frameY = 1;
                hero.receiveDamage(config.GOLEM_ATTACK);
            } else if (!canDealDamage(this, hero)){
                this.frameY = 0;
            }
            await sleep(800);
        }
    }

    async calculateHitpoints(damage) {
        if (this.health - this.damageTaken <= damage) {
            sound.MONSTER_DEATH.play();
            this.damageTaken = this.health;
            this.flag = true;
            await this.die();
            const index = monsterArray.indexOf(this);
            monsterArray.splice(index, 1);
        }

        else {
            sound.MONSTER_DAMAGE.play();
            this.damageTaken += damage;
        }
    }

    async die() {
        hero.statistics.killedMonsters++;
        this.frameY = 2;
        for (let i = 0; i < config.GOLEM_FRAMES_COUNT - 1; i++) {
            this.frameX = i;
            updateCanvasRequest();
            await sleep(180);
        }
    }
}

export class Hero extends Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx, textCtx) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx, textCtx);
        this.money = 100;
        this.isMoving = false;
        this.isDying = false;
        this.isDead = false;
        this.conversation = {
            'isTalking': false,
            'role': 'answer',
            'dialogue': 0,
        };
        this.statistics = {
            'stage': null,
            'killedMonsters': null,
            'discoveredPlaces': [],
        };
        this.stepInterval = 0;
    }

    async move() {
        // Metoda zmieniająca obrazek z ruchem bohatera
        this.stepInterval++;
        while (this.stepInterval == 2) {
            if (this.frameX < 3) {
                this.frameX++;
            }
            else {
                this.frameX = 0;
            }
            this.stepInterval = 0; 
        }
    }

    async breathing() {
        while (true) {
            if (this.isAttacking || this.isMoving || this.isDying || isInvenoryOpen) {
                return;
            }
            
            switch (heroDirection) {
                case 'up':
                    this.frameY = 1;
                    break;
    
                case 'down':
                    this.frameY = 0;
                    break;
                
                case 'left':
                    this.frameY = 2;
                    break;
                
                case 'right':
                    this.frameY = 3;
                    break;
            }

            this.move();
            updateCanvasRequest();
            await sleep(450);  
        }
    }

    async attack(direction) {
        // Metoda obsługująca atakowanie
        if (this.isAttacking || this.isMoving || this.conversation.isTalking) {
            return;
        }
        
        sound.ATTACK_SOUND.play();

        if (this.canAttack == true) {
            this.isAttacking = true;
            switch (direction) {
                case 'up':
                    this.frameY = 11;
                    break;
                
                case 'down':
                    this.frameY = 8;
                    break;

                case 'left':
                    this.frameY = 10;
                    break;

                case 'right':
                    this.frameY = 9;
                    break;
            }
            
            for (let i = 0; i < config.HERO_FRAMES_COUNT; i++) {
                const monster = nearestMonster();
                if (i == 2 && canDealDamage(this, monster)) {
                    monster.calculateHitpoints(10);
                }
                this.frameX = i;
                updateCanvasRequest();
                await sleep(125);
            }
            sound.ATTACK_SOUND.pause();
            sound.ATTACK_SOUND.currentTime = 0;
            this.isAttacking = false;
            this.breathing();
        }
    }

    async receiveDamage(damage) {
        if (this.isDying) {
            return;
        }
        const armorFactor = this.defense / 100;
        const trueDamage = damage * (1 - armorFactor);
        if (this.health - trueDamage <= 0) {
            await this.die();
            return;
        }
        this.health -= trueDamage;
    }

    async die() {
        this.isDying = true;
        this.frameY = 12;
        for (let i = 0; i < config.HERO_FRAMES_COUNT; i++) {
            this.frameX = i;
            updateCanvasRequest();
            await sleep(150);
        }
        this.isDead = true;
    }

    setStatistics(statistics) {
        this.statistics = statistics;
    }
}

export class NPC extends Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx, textCtx, startBreathingTime, id) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx, textCtx);
        this.id = id;
        this.talked = false;
        this.breathing(startBreathingTime);
    }

    async breathing(time) {
        await sleep(time);
        while(true) {
            if (this.frameX >= config.NPC_FRAMES_COUNT - 1) {
                this.frameX = 0;
            }
            this.frameX++;
            updateCanvasRequest();
            await sleep(450);   
        }
    }
}

// Funkcja obliczająca i zwracająca najbliższego przeciwnika
function nearestMonster() {
    let nearestMonster = null;
    let distance = Infinity;
    const heroCenterPointX = hero.positionX + hero.frameWidth / 2;
    const heroCenterPointY = hero.positionY + hero.frameHeight / 2;
    for (let i = 0; i < monsterArray.length; i++) {
        let monsterCenterPointX = monsterArray[i].positionX + monsterArray[i].frameWidth / 2;
        let monsterCenterPointY = monsterArray[i].positionY + monsterArray[i].frameHeight / 2;
        let distanceBetween = Math.sqrt(Math.pow(heroCenterPointX - monsterCenterPointX, 2) + Math.pow(heroCenterPointY - monsterCenterPointY, 2));

        if (distanceBetween < distance) {
            distance = distanceBetween;
            nearestMonster = monsterArray[i];
        }
    }
    
    return nearestMonster;
}

function canDealDamage(attacker, taker) {
    const attackerCenterPointX = attacker.positionX + attacker.frameWidth / 2;
    const attackerCenterPointY = attacker.positionY + attacker.frameHeight / 2;
    const monsterCenterPointX = taker.positionX + taker.frameWidth / 2;
    const monsterCenterPointY = taker.positionY + taker.frameHeight / 2;
    let distanceBetween = 0;
    
    if (attacker == hero) {
        distanceBetween = Math.sqrt(Math.pow(attackerCenterPointX - monsterCenterPointX, 2) + Math.pow(attackerCenterPointY - monsterCenterPointY, 2));
    } else {
        distanceBetween = Math.sqrt(Math.pow(attackerCenterPointX - monsterCenterPointX, 2) + Math.pow(attackerCenterPointY - monsterCenterPointY, 2) - 15);
    }

    if (distanceBetween <= ((attacker.frameWidth / 2) + (taker.frameWidth / 2) - 15)) {   
        return true;
    }

    return false;
}

export function setHeroObject(object) {
    hero = object;
}

export function setHeroDirection(direction) {
    heroDirection = direction;
}

export function getMonsterArray() {
    return monsterArray;
}

export function getNPCArray() {
    return npcArray;
}

async function updateCanvasRequest() {
    updateRequest = true;
    await sleep(10);
    updateRequest = false; 
}

export async function createCharacters(mapOffsetX, mapOffsetY, ctx, textCtx) {
    const charactersMapParts = [];
    for (let i = 0; i < charactersMap.length; i += config.MAP_DIMENSION) {
        charactersMapParts.push(charactersMap.slice(i, config.MAP_DIMENSION + i));   
    }

    charactersMapParts.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 12695) {
                npcArray.push(new NPC('Gubernator', image.governorImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'governor'));
            }

            else if (symbol === 12697) {
                npcArray.push(new NPC('Handlarz', image.sellerImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'seller'));
            }

            else if (symbol === 12698) {
                npcArray.push(new NPC('Komendant', image.commanderImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'commander'));
            }

            else if (symbol === 12696) {
                npcArray.push(new NPC('Znachor', image.doctorImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'doctor'));
            }

            else if (symbol === 12699) {
                npcArray.push(new NPC('Strażnik Bramy', image.guardImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'gatekeeper1'));
            }

            else if (symbol === 12700) {
                npcArray.push(new NPC('Dziadek', image.grandfatherImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'grandfather'));
            }

            else if (symbol === 12701) {
                npcArray.push(new NPC('Górnik', image.minerImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, textCtx, random(1, 3000), 'miner'));
            }
        })
    });
}

export async function createMonsters(mapOffsetX, mapOffsetY, ctx, textCtx) { // Create monsters function
    const monstersMapParts = [];                                    // Set empty array for parts of map with monsters spawn positions
    const spawnPositions = [];                                      // Set empty array for spawn positions
    for (let i = 0; i < monstersMap.length; i += config.MAP_DIMENSION) {
        monstersMapParts.push(monstersMap.slice(i, config.MAP_DIMENSION + i));       // Slice map into parts and push into array
    }

    monstersMapParts.forEach((row, i) => {                          // Iterate through parts of map (row - part, i - index of part)
        row.forEach((symbol, j) => {                                // Iterate through part of map (symbol - symbol in part, j - index of symbol)
            if (symbol === 12698) {                                 // If symbol is 12698 (Golem spawn position)
                const position = {                                  // Create position object
                    x: j * Obstacles.width + mapOffsetX,            // x - horizontal position
                    y: i * Obstacles.height + mapOffsetY            // y - vertical position
                }
                spawnPositions.push(position);                      // Push position into array
            }
        })
    });

    for (let i = 0; i < config.GOLEM_COUNT; i++) {                  // Create golems as many as defined in config
        const randomPosition = random(0, spawnPositions.length);    // Draw random position for monster
        const position = spawnPositions[randomPosition];            // Create random position object
        monsterArray.push(new Monster('Golem', image.golemImage, config.GOLEM_FRAME_WIDTH, config.GOLEM_FRAME_HEIGHT, position.x, position.y, config.GOLEM_STEP_LENGTH, config.GOLEM_CAN_ATTACK, ctx, textCtx, config.GOLEM_HEALTH));
    }
}

export function createHero(ctx, textCtx) {
    const heroStartingPosition = {
        x: Math.round((config.CANVAS_WIDTH - config.HERO_FRAME_WIDTH) / 2),
        y: Math.round((config.CANVAS_HEIGHT - config.HERO_FRAME_HEIGHT) / 2)
    };
    hero = new Hero('Marvin', image.playerImage, config.HERO_FRAME_WIDTH, config.HERO_FRAME_HEIGHT, heroStartingPosition.x, heroStartingPosition.y, config.HERO_STEP_LENGTH, config.HERO_CAN_ATTACK, ctx, textCtx);
    return hero;
}

function findNearestNPC() {
    const heroCenterPointX = hero.positionX + hero.frameWidth / 2 - 1;
    const heroCenterPointY = hero.positionY + hero.frameHeight / 1.5;
    let nearestNPC = null;
    let distance = Infinity; 
    for (let i = 0; i < npcArray.length; i++) {
        const npcCenterPointX = npcArray[i].positionX + npcArray[i].width / 2;
        const npcenterPointY = npcArray[i].positionY + npcArray[i].height / 2;
        const distanceBetween = Math.sqrt(Math.pow(heroCenterPointX - npcCenterPointX, 2) + Math.pow(heroCenterPointY - npcenterPointY, 2));
        if (distanceBetween < distance) {
            distance = distanceBetween;
            nearestNPC = npcArray[i];
        }
    }

    if (distance < 100) {
        return nearestNPC;
    }
    return null;
}

export function displayInteractionText(textCtx) {
    if (findNearestNPC() != null) {
        const text = 'Interakcja [T]';
        const fontSize = 20;

        textCtx.font = `${fontSize}px ${config.FONT_FAMILY}`;
        textCtx.fillStyle = '#d4cebe';

        const textWidth = textCtx.measureText(text).width;

        const x = Math.round(hero.positionX + (hero.frameWidth - textWidth) / 2);
        const y = Math.round(hero.positionY + hero.frameHeight + 25);

        textCtx.fillText(text, x, y);
        return true;
    }
    else {
        return false;
    }
}

export function NPCInteraction(ctx, textCtx) {
    if (displayInteractionText(textCtx) && hero.conversation.isTalking) {
        const nearestNPC = findNearestNPC();
        const numberOfDialogues = dialogues[nearestNPC.id][hero.statistics.stage][hero.conversation.role].length;
        
        if (nearestNPC.id == 'doctor') {
            hero.health = 100;
        }

        if (numberOfDialogues == hero.conversation.dialogue) {           // If end of dialogue is reached quit the conversation
            nearestNPC.talked = true;
            hero.conversation.isTalking = false;
            hero.conversation.dialogue = 0;
            progress.nextStage();
            return;
        }
        // Frame settings
        const framePositionX = Math.round(hero.positionX + (hero.frameWidth - image.dialogueFrame.width) / 2);
        const framePositionY = Math.round(window.innerHeight / 25);
        ctx.drawImage(image.dialogueFrame, framePositionX, framePositionY);

        // Skip information
        const information = 'Naciśnij [SPACJA], aby pominąć';
        textCtx.font = `16px ${config.FONT_FAMILY}`;
        const informationWidth = textCtx.measureText(information).width;
        const informationX = Math.round(framePositionX + (image.dialogueFrame.width - informationWidth) / 2);
        const informationY = framePositionY + image.dialogueFrame.height + 10;
        textCtx.fillText(information, informationX, informationY);

        // Current talking character settings
        let talkingCharacter = "";
        if (hero.conversation.role == 'ask') {
            talkingCharacter = hero;
        } else {
            talkingCharacter = nearestNPC;
        }
        const characterNameWidth = textCtx.measureText(talkingCharacter.name).width;
        const characterNameFontSize = 22;
        textCtx.font = `bold ${characterNameFontSize}px ${config.FONT_FAMILY}`;
        textCtx.fillStyle = 'black';
        const titlePositionX = Math.round(framePositionX + (image.dialogueFrame.width - characterNameWidth) / 2);
        textCtx.fillText(talkingCharacter.name, titlePositionX, framePositionY + 35);

        const text = dialogues[nearestNPC.id][hero.statistics.stage][hero.conversation.role][hero.conversation.dialogue];
        const fontSize = 18; 
        textCtx.fillStyle = 'black';
        let textY = framePositionY + 55;

        const maxLineWidth = 79;                                        // Maximum number of characters in a line
        for (let i = 0, start = 0; start < text.length; start += i) {
            i = maxLineWidth;
            if (start + i < text.length) {                              // If not at end of text
                while (text.charAt(start + i) !== ' ' && i > 0) {       // While not a space after last character in line
                    i--;                                                // Reduce number of characters in line to move whole word to next line
                }
                if (i === 0) {                                          
                    i = maxLineWidth;
                }
            }
            const line = text.slice(start, start + i).trim();           // Trim to remove beginning and ending spaces
            displayText(line, fontSize, 'Medieval Sharp', framePositionX + 20, textY, 'black', textCtx);
            textY += fontSize + 3;                                      // Change position of next line
        }
    }
    else {
        hero.conversation.isTalking = false;
    }
}