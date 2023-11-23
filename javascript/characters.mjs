// import { round } from './math';
import * as config from "./config.mjs";
import { sleep } from './utilities.mjs';

export let updateRequest = false;
export let isInvenoryOpen = false;
export let heroDirection = 'down';

export let hero = null;
export let monsterArray = [];

class Parameters {
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx) {
        this.name = name;
        this.image = image;
        // Szerokość i wysokość danego obrazka z ruchem bohatera
        this.frameWidth = width;
        this.frameHeight = height;
        this.width = this.frameWidth;
        this.height = this.frameHeight;
        // Pozycja startowa bohatera
        this.positionX = Math.round((config.CANVAS_WIDTH - this.frameWidth) / 2 + x);
        this.positionY = Math.round((config.CANVAS_HEIGHT - this.frameHeight) / 2 + y);
        // Wybór rzędu i kolumny z danym ruchem bohatera
        this.frameX = 0;
        this.frameY = 0;
        // Długość kroku bohatera
        this.health = 100;
        this.defense = 100;
        this.damage = 0;
        this.stepLength = step_length;
        this.canAttack = can_attack;
        this.damageTaken = 0;
        this.ctx = ctx;
    }

    drawCharacter(element) {
        // (this.positionX + ((this.width - this.health) / 2))
        element.drawImage(this.image, this.frameX * this.frameWidth, this.frameY * this.frameHeight, this.frameWidth,
            this.frameHeight, this.positionX, this.positionY, this.width, this.height);
        this.drawHealthBar();
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

export class Hero extends Parameters{
    constructor(name, image , width, height, x, y, step_length, can_attack, ctx) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx);
        this.money = 100;
        this.isMoving = false;
        this.isAttacking = false;
        this.stepInterval = 0;
        console.log(this.positionX, this.positionY);
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

export class Golem extends Parameters {
    constructor(name, image , width, height, x, y, step_length, can_attack, health, ctx) {
        super(name, image , width, height, x, y, step_length, can_attack, ctx)
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

export function getHeroObject(object) {
    hero = object;
}

export function setMonsterArray(array) {
    monsterArray = array;
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

async function updateCanvasRequest() {
    updateRequest = true;
    await sleep(10);
    updateRequest = false; 
}