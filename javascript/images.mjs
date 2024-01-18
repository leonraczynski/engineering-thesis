import * as config from './config.mjs';

export const backgroundForest = new Image();
export const minimapFrame = new Image();
export const playerImage = new Image();
export const golemImage = new Image();
export const inventoryImage = new Image();
// NPCs
export const governorImage = new Image();
export const commanderImage = new Image();
export const guardImage = new Image();
export const doctorImage = new Image();
export const sellerImage = new Image();
export const minerImage = new Image();

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
    }

    minimapFrame.src = '/Graphics/GUI/gui_frame.png';
    minimapFrame.onload = function() {
        loadedImages.push(minimapFrame);
    };

    inventoryImage.src = '/Graphics/GUI/inventory.png';
    inventoryImage.onload = function() {
        loadedImages.push(inventoryImage);
    };

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
}