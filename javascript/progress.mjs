import * as main from './skrypt.mjs';
import * as sound from './sounds.mjs';
import * as characters from './characters.mjs';
import * as config from './config.mjs';
import * as image from './images.mjs';
import { giveQuestItems } from './inventory.mjs';
import * as request from './requests.mjs';
import { locationsMap } from './locationsMap.mjs';
import quest from './quests.json' assert { type: "json" };

const quests = [];
export const locations = [];
export const flags = {
    'locationText': false,
    'questCompleteText': false,
    'prologueCompleteText': false
}

export function nextStage() {
    const npcArray = characters.getNPCArray();
    let governor = null;
    let seller = null;
    let commander = null;
    let grandfather = null;

    if (flags['questCompleteText']) {
        setFlag('questCompleteText', false);
    } else if (flags['prologueCompleteText']) {
        setFlag('prologueCompleteText', false);
    }

    for (let i = 0; i < npcArray.length; i++) {
        switch (npcArray[i].id) {
            case 'governor':
                governor = npcArray[i];
                break;
            case 'seller':
                seller = npcArray[i];
                break;
            case 'commander':
                commander = npcArray[i];
                break;
            case 'grandfather':
                grandfather = npcArray[i];
                break;
        }
    }

    switch (characters.hero.statistics.stage) {
        case 1:
            if (grandfather.talked) {
                quest[1][1]['done'] = true;
            } 
            if (governor.talked) {
                quest[1][2]['done'] = true;
            }
            if (seller.talked) {
                quest[1][3]['done'] = true;
            }
            break;
        case 2:
            if (governor.talked) {
                quest[2][1]['done'] = true;
            }
            if (characters.hero.statistics.discoveredPlaces.includes('Strażnica Królewska')) {
                quest[2][2]['done'] = true;
            }
            if (characters.hero.statistics.killedMonsters > 0) {
                quest[2][3]['done'] = true;
            }
            break;
        case 3:
            if (governor.talked) {
                quest[3][1]['done'] = true;
            }
            if (commander.talked) {
                quest[3][2]['done'] = true;
            }
            if (characters.hero.statistics.discoveredPlaces.includes('Opuszczona Kopalnia')) {
                quest[3][3]['done'] = true;
            }
            break;
    }

    if (governor.talked && seller.talked && grandfather.talked && characters.hero.statistics.stage == 1) {
        characters.hero.statistics.stage = 2;
        governor.talked = false;
        seller.talked = false;
        grandfather.talked = false;
        giveQuestItems();
        setFlag('questCompleteText', true);
    } else if (governor.talked && characters.hero.statistics.discoveredPlaces.includes('Strażnica Królewska') &&
                characters.hero.statistics.killedMonsters > 0 &&
                characters.hero.statistics.stage == 2) {
        characters.hero.statistics.stage = 3;
        governor.talked = false;
        setFlag('questCompleteText', true);
    } else if (governor.talked && commander.talked && characters.hero.statistics.discoveredPlaces.includes('Opuszczona Kopalnia')) {
        governor.talked = false;
        commander.talked = false;
        setFlag('prologueCompleteText', true);
    }
}

export function questCompleteText(content, size, ctx) {
    const text = content;
    const fontSize = size;

    ctx.font = `bold ${fontSize}px ${config.FONT_FAMILY}`;
    ctx.fillStyle = '#d4cebe';

    const textWidth = ctx.measureText(text).width;

    const x = Math.round((config.CANVAS_WIDTH - textWidth) / 2);
    const y = Math.round(config.CANVAS_HEIGHT / 3);

    ctx.fillText(text, x, y);
}

class Locations {
    static width = config.SQUARE_WIDTH;     // Width of the 1 square of the map (16px when zoom is 100%, here is 300%)
    static height = config.SQUARE_HEIGHT;   // Height of the 1 square of the map (16px when zoom is 100%, here is 300%)
    constructor(name, x, y) {               // Position arg is an object with x and y properties
        this.name = name;
        this.width = Locations.width;            // Object width
        this.height = Locations.height;          // Object height
        this.positionX = x;
        this.positionY = y;
        this.discovered = false;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 200, 255, 0.1)';
        ctx.fillRect(this.positionX, this.positionY, this.width, this.height);
    }
}
   
export async function createNewLocationAreas(mapOffsetX, mapOffsetY) {
    const locationsMapParts = [];
    for (let i = 0; i < locationsMap.length; i += config.MAP_DIMENSION) {
        locationsMapParts.push(locationsMap.slice(i, config.MAP_DIMENSION + i));   
    }

    locationsMapParts.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 12696) {
                locations.push(new Locations('Górne Miasto', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));  
            } else if (symbol === 12698) {
                locations.push(new Locations('Miasto', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));
            } else if (symbol === 12701) {
                locations.push(new Locations('Kopalnia Srebra', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));
            } else if (symbol === 12700) {
                locations.push(new Locations('Strażnica Królewska', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));
            } else if (symbol === 12695) {
                locations.push(new Locations('Opuszczona Kopalnia', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));
            } else if (symbol === 12702) {
                locations.push(new Locations('Wzgórze', j * Locations.width + mapOffsetX, i * Locations.height + mapOffsetY));
            }
        })
    });
}

export function discoverLocation() {
    const location = findNearestLocation();
    const flag = 'locationText';
    if (flags['locationText']) {
        setFlag(flag, false);
    }

    if (characters.hero.statistics.discoveredPlaces.includes(location.name) || flags['locationText']) {
        return;
    }
    const heroCenterPointX = characters.hero.positionX + characters.hero.frameWidth / 2;
    const heroCenterPointY = characters.hero.positionY + characters.hero.frameHeight / 1.5;
    
    const locationCenterPointX = location.positionX + location.width / 2;
    const locationCenterPointY = location.positionY + location.height / 2;
    if (heroCenterPointX >= locationCenterPointX - config.SQUARE_WIDTH / 2 &&
        heroCenterPointX <= locationCenterPointX + config.SQUARE_WIDTH / 2 &&
        heroCenterPointY >= locationCenterPointY - config.SQUARE_HEIGHT / 2 &&
        heroCenterPointY <= locationCenterPointY + config.SQUARE_HEIGHT / 2) {
            characters.hero.statistics.discoveredPlaces.push(location.name);
            setFlag(flag, true);
    }
}

function findNearestLocation() {
    const heroCenterPointX = characters.hero.positionX + characters.hero.frameWidth / 2;
    const heroCenterPointY = characters.hero.positionY + characters.hero.frameHeight / 1.5;
    let nearestLocation = null;
    let distance = Infinity; 
    for (let i = 0; i < locations.length; i++) {
        const locationAreaCenterPointX = locations[i].positionX + locations[i].width / 2;
        const locationAreaCenterPointY = locations[i].positionY + locations[i].height / 2;
        const distanceBetween = Math.sqrt(Math.pow(heroCenterPointX - locationAreaCenterPointX, 2) + Math.pow(heroCenterPointY - locationAreaCenterPointY, 2));
        if (distanceBetween < distance) {
            distance = distanceBetween;
            nearestLocation = locations[i];
        }
    }
    return nearestLocation;
}

export function displayLocationText(ctx) {
    bottomText();
    topText();

    function topText() {
        const text = 'nowa lokacja';
        const fontSize = 35;

        ctx.font = `bold ${fontSize}px ${config.FONT_FAMILY}`;
        ctx.fillStyle = '#d4cebe';

        const textWidth = ctx.measureText(text).width;

        const x = Math.round((config.CANVAS_WIDTH - textWidth) / 2);
        const y = Math.round(config.CANVAS_HEIGHT / 4 - 80);

        ctx.fillText(text, x, y);
    }
    function bottomText() {
        const location = findNearestLocation();
        const text = location.name;
        const fontSize = 90;

        ctx.font = `bold ${fontSize}px ${config.FONT_FAMILY}`;
        ctx.fillStyle = '#d4cebe';

        const textWidth = ctx.measureText(text).width;

        const x = Math.round((config.CANVAS_WIDTH - textWidth) / 2);
        const y = Math.round(config.CANVAS_HEIGHT / 4);

        ctx.fillText(text, x, y);
    }
}

function setFlag(flag, status) {
    switch (flag) {
        case 'locationText':
            if (status) {
                sound.DISCOVER_SOUND.play();
                flags['locationText'] = true;
            } else if (!status) {
                setTimeout(() => flags['locationText'] = false, 3000);
            }
            break;
            
        case 'questCompleteText':
            if (status) {
                saveGame();
                flags['questCompleteText'] = true;
            } else if (!status) {
                setTimeout(() => flags['questCompleteText'] = false, 2500);
            }
            break;

        case 'prologueCompleteText':
            if (status) {
                flags['prologueCompleteText'] = true;
            } else if (!status) {
                setTimeout(() => flags['prologueCompleteText'] = false, 5000);
            }
            break;
    }
    
}

export function displayQuestFrame(ctx, textCtx, minimap) {
    // Draw quest frame
    const minimapDimension = minimap.width;
    const posX = Math.round(config.CANVAS_WIDTH - minimapDimension - image.questFrame.width - 15);
    const posY = Math.round(config.CANVAS_HEIGHT - image.questFrame.height);
    ctx.drawImage(image.questFrame, posX, posY);

    const textPosX = posX + 20;
    let textPosY = 0;
    const currentStage = characters.hero.statistics.stage;
    const questsCount = Object.keys(quest[currentStage]).length;

    for (let i = 0; i < questsCount; i++) {
        const text = quest[currentStage][i + 1]['quest'];
        textPosY = Math.round(posY + 23 * (i + 2.5));
        if (quest[currentStage][i + 1]['done']) {
            textCtx.font = `20px ${config.FONT_FAMILY}`;
            const textWidth = textCtx.measureText(text).width;
            crossOutText(textPosX, textPosY, textWidth)
        }
        writeQuestText('- ' + text, 17, textPosX, textPosY);
    }

    writeQuestText('Zadanie ' + characters.hero.statistics.stage, 20, textPosX, posY + 35, 'bold');

    function writeQuestText(content, size, x, y, bold = '') {
        const text = content;
        const fontSize = size;

        textCtx.font = `${bold} ${fontSize}px ${config.FONT_FAMILY}`;
        textCtx.fillStyle = 'black';
        textCtx.fillText(text, x, y);
    }

    function crossOutText(ax, ay, width) {
        textCtx.strokeStyle = "black";
        textCtx.beginPath();
        textCtx.moveTo(ax + 15, ay - 5);
        textCtx.lineTo(ax + width - 10, ay - 5);
        textCtx.stroke();
    }
}

function saveGame() {
    const heroPositionX = main.mapX;
    const heroPositionY = main.mapY;
    const currentStage = characters.hero.statistics.stage;
    const killedMonsters = characters.hero.statistics.killedMonsters;
    const discoveredPlaces = String(characters.hero.statistics.discoveredPlaces);
    request.saveGame(heroPositionX, heroPositionY, currentStage, killedMonsters, discoveredPlaces);
}