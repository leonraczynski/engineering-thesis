import * as config from "./config.mjs";
import * as image from "./images.mjs";
import { Obstacles } from "./collisions.mjs";
import { charactersMap } from "./charactersMap.mjs";
import { monstersMap } from "./monstersMap.mjs";
import { sleep, random } from './utilities.mjs';

export let updateRequest = false;
export let isInvenoryOpen = false;
export let heroDirection = 'down';

export let hero = null;
export const monsterArray = [];
export const npcArray = [];


class Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx) {
        this.name = name;
        this.image = image;
        // Szerokość i wysokość danego obrazka z ruchem bohatera
        this.frameWidth = width;
        this.frameHeight = height;
        this.width = this.frameWidth;
        this.height = this.frameHeight;
        // Pozycja startowa bohatera
        // this.positionX = Math.round((config.CANVAS_WIDTH - this.frameWidth) / 2 + x);
        // this.positionY = Math.round((config.CANVAS_HEIGHT - this.frameHeight) / 2 + y);
        this.positionX = x;
        this.positionY = y;
        // Wybór rzędu i kolumny z danym ruchem bohatera
        this.frameX = 0;
        this.frameY = 0;
        this.health = 100;
        this.defense = 100;
        this.damage = 0;
        this.stepLength = step_length;
        this.canAttack = can_attack;
        this.damageTaken = 0;
        this.ctx = ctx;
    }

    drawCharacter(element) {
        element.drawImage(this.image, this.frameX * this.frameWidth, this.frameY * this.frameHeight, this.frameWidth,
            this.frameHeight, this.positionX, this.positionY, this.width, this.height);
        if (this.canAttack) {
            this.drawHealthBar();
        }
        this.writeName();
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
        const fontSize = 20;
        const fontFamily = 'Medieval Sharp';
        // const fontFamily = 'Almendra';
        const textWidth = this.ctx.measureText(name).width;
    
        const x = this.positionX + (this.frameWidth - textWidth) / 2;
        const y = this.positionY - 10;
    
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = '#d4cebe';
        this.ctx.fillText(name, x, y);
    }
}

export class Monster extends Basic {
    constructor(name, image, width, height, x, y, step_length, can_attack, ctx, health) {
        super(name, image, width, height, x, y, step_length, can_attack, ctx);
        this.canChase = false;
        this.health = health;
        this.flag = false;
        this.move();
        this.noticeHero();
        this.chase();
    }
    async move() {
        // Metoda zmieniająca obrazek z ruchem potwora
        while (true) {
            if (this.canChase && !isInvenoryOpen) {
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
            if (this.flag || isInvenoryOpen) {
                return;
            }

            if (this.canChase == true) {
                if (((this.positionX + this.frameWidth / 2) < (hero.positionX + hero.frameWidth / 2)) &&
                    ((this.positionY + this.frameHeight / 2) > (hero.positionY + hero.frameHeight / 2))) {
                    this.positionX += this.stepLength;
                    this.positionY -= this.stepLength;
                }

                else if (((this.positionX + this.frameWidth / 2) > (hero.positionX + hero.frameWidth / 2)) &&
                        ((this.positionY + this.frameHeight / 2) > (hero.positionY + hero.frameHeight / 2))) {
                    this.positionX -= this.stepLength;
                    this.positionY -= this.stepLength;
                }

                else if (((this.positionX + this.frameWidth / 2) > (hero.positionX + hero.frameWidth / 2)) &&
                        ((this.positionY + this.frameHeight / 2) < (hero.positionY + hero.frameHeight / 2))) {
                    this.positionX -= this.stepLength;
                    this.positionY += this.stepLength;
                }

                else if (((this.positionX + this.frameWidth / 2) < (hero.positionX + hero.frameWidth / 2)) &&
                        ((this.positionY + this.frameHeight / 2) < (hero.positionY + hero.frameHeight / 2))) {
                    this.positionX += this.stepLength;
                    this.positionY += this.stepLength;
                }
                updateCanvasRequest();
            }
            await sleep(80);
        }
    }

    async calculateHitpoints(damage) {
        if (this.health - this.damageTaken <= damage) {
            this.damageTaken = this.health;
            this.flag = true;
            await this.die();
            const index = monsterArray.indexOf(this);
            monsterArray.splice(index, 1);
            // numberOfMonsters--;
        }

        else {
            this.damageTaken += damage;
        }
    }

    async die() {
        this.frameY = 2;
        for (let i = 0; i < config.GOLEM_FRAMES_COUNT - 1; i++) {
            this.frameX = i;
            updateCanvasRequest();
            await sleep(180);
        }
    }
}

export class Hero extends Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx);
        this.money = 100;
        this.isMoving = false;
        this.isAttacking = false;
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
            if (this.isAttacking || this.isMoving || isInvenoryOpen) {
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
        if (this.isAttacking || this.isMoving) {
            return;
        }
        
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
                if (i == 2 && canDealDamage(nearestMonster())) {
                    nearestMonster().calculateHitpoints(10);
                }
                this.frameX = i;
                updateCanvasRequest();
                await sleep(125);
            }
            this.isAttacking = false;
            this.breathing();
        }
    }
}

export class NPC extends Basic {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx, startBreathingTime) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx);
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

function canDealDamage(monster) {
    const heroCenterPointX = hero.positionX + hero.frameWidth / 2;
    const heroCenterPointY = hero.positionY + hero.frameHeight / 2;
    const monsterCenterPointX = monster.positionX + monster.frameWidth / 2;
    const monsterCenterPointY = monster.positionY + monster.frameHeight / 2;
    // Równanie matematyczne obliczające odległość między dwoma punktami
    const distanceBetween = Math.sqrt(Math.pow(heroCenterPointX - monsterCenterPointX, 2) + Math.pow(heroCenterPointY - monsterCenterPointY, 2));

    if (distanceBetween <= ((hero.frameWidth / 2) + (monster.frameWidth / 2) - 15)) {   
        return true;
    }

    else {
        return false;
    }
}

export function setHeroObject(object) {
    hero = object;
}

export function setMonsterArray(array) {
    monsterArray = array;
}

export function setNPCArray(array) {
    npcArray = array;
}

export function setHeroDirection(direction) {
    heroDirection = direction;
}

export function setIsInvenoryOpen(state) {
    isInvenoryOpen = state;
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

export async function createCharacters(mapOffsetX, mapOffsetY, ctx) {
    const charactersMapParts = [];
    for (let i = 0; i < charactersMap.length; i += 200) {
        charactersMapParts.push(charactersMap.slice(i, 200 + i));   
    }

    charactersMapParts.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 12695) {
                npcArray.push(new NPC('Gubernator', image.governorImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }

            else if (symbol === 12697) {
                npcArray.push(new NPC('Handlarz', image.sellerImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }

            else if (symbol === 12698) {
                npcArray.push(new NPC('Komendant', image.commanderImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }

            else if (symbol === 12696) {
                npcArray.push(new NPC('Znachor', image.doctorImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }

            else if (symbol === 12699) {
                npcArray.push(new NPC('Strażnik Bramy', image.guardImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }

            else if (symbol === 12700) {
                npcArray.push(new NPC('Górnik', image.minerImage, config.NPC_FRAME_WIDTH, config.NPC_FRAME_HEIGHT, j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY, config.NPC_STEP_LENGTH, config.NPC_CAN_ATTACK, ctx, random(1, 3000)));
            }
        })
    });
}

export async function createMonsters(mapOffsetX, mapOffsetY, ctx) { // Create monsters function
    const monstersMapParts = [];                                    // Set empty array for parts of map with monsters spawn positions
    const spawnPositions = [];                                      // Set empty array for spawn positions
    for (let i = 0; i < monstersMap.length; i += 200) {
        monstersMapParts.push(monstersMap.slice(i, 200 + i));       // Slice map into parts and push into array
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
        monsterArray.push(new Monster('Golem', image.golemImage, config.GOLEM_FRAME_WIDTH, config.GOLEM_FRAME_HEIGHT, position.x, position.y, config.GOLEM_STEP_LENGTH, config.GOLEM_CAN_ATTACK, ctx, config.GOLEM_HEALTH));
    }
}