import * as config from './config.mjs';

export const backgroundForest = new Image();
export const questFrame = new Image();
export const dialogueFrame = new Image();
export const dialogueArrow = new Image();
export const minimapFrame = new Image();
export const playerImage = new Image();
export const golemImage = new Image();
export const inventoryImage = new Image();
export const settingsImage = new Image();
// NPCs
export const governorImage = new Image();
export const commanderImage = new Image();
export const guardImage = new Image();
export const doctorImage = new Image();
export const sellerImage = new Image();
export const minerImage = new Image();
export const grandfatherImage = new Image();

const loadedImages = [];
const totalImages = config.TOTAL_IMAGES;

loadImages();
export async function checkAllImagesLoaded() {
    await loadImages();
    if (loadedImages.length == totalImages) {
        return true;
    }
    
    else {
        console.log('Error in function checkAllImagesLoaded()');
        return false;
    }
}

async function loadImages() {
    backgroundForest.src = '/Graphics/Maps/forest.png';
    backgroundForest.onload = function() {
        loadedImages.push(backgroundForest);      
    };

    questFrame.src = '/Graphics/GUI/quest_frame.png';
    questFrame.onload = function() {
        loadedImages.push(questFrame);      
    };

    dialogueFrame.src = '/Graphics/GUI/dialogue_frame.png';
    dialogueFrame.onload = function() {
        loadedImages.push(dialogueFrame);      
    };

    dialogueArrow.src = '/Graphics/GUI/dialogue_arrow.png';
    dialogueArrow.onload = function() {
        loadedImages.push(dialogueArrow);      
    }

    minimapFrame.src = '/Graphics/GUI/gui_frame.png';
    minimapFrame.onload = function() {
        loadedImages.push(minimapFrame);
    };

    inventoryImage.src = '/Graphics/GUI/inventory.png';
    inventoryImage.onload = function() {
        loadedImages.push(inventoryImage);
    };

    settingsImage.src = '/Graphics/GUI/settings.png';
    settingsImage.onload = function() {
        loadedImages.push(settingsImage);
    }

    playerImage.src = '/Graphics/Heroes/hero_animations.png';
    playerImage.onload = function() {
        loadedImages.push(playerImage);
    };

    golemImage.src = '/Graphics/Monsters/golem_animations.png';
    golemImage.onload = function() {
        loadedImages.push(golemImage);
    };

    governorImage.src = '/Graphics/NPCs/governor.png';
    governorImage.onload = function() {
        loadedImages.push(governorImage);
    }

    doctorImage.src = '/Graphics/NPCs/doctor.png';
    doctorImage.onload = function() {
        loadedImages.push(doctorImage);
    }

    commanderImage.src = '/Graphics/NPCs/commander.png';
    commanderImage.onload = function() {
        loadedImages.push(commanderImage);
    }

    guardImage.src = '/Graphics/NPCs/guard.png';
    guardImage.onload = function() {
        loadedImages.push(guardImage);
    }

    minerImage.src = '/Graphics/NPCs/miner.png';
    minerImage.onload = function() {
        loadedImages.push(minerImage);
    }

    sellerImage.src = '/Graphics/NPCs/seller.png';
    sellerImage.onload = function() {
        loadedImages.push(sellerImage);
    }

    grandfatherImage.src = '/Graphics/NPCs/grandfather.png';
    grandfatherImage.onload = function() {
        loadedImages.push(grandfatherImage);
    }
}