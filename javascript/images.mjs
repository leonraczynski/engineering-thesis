import * as config from './config.mjs';

export const backgroundForest = new Image();
export const minimapFrame = new Image();
export const playerImage = new Image();
export const golemImage = new Image();
export const inventoryImage = new Image();

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
}