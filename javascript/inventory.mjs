import * as config from './config.mjs';
import { hero, monsterArray, isInvenoryOpen, setIsInvenoryOpen } from "./characters.mjs";
import { inventoryImage } from "./images.mjs";

export let updateRequest = false;
export let inventoryFrames = [];                                                                // Define global inventoryFrames array (can be shared between other files)
const gameArea = document.querySelector('.game-area');                                          // Get html class and set it to gameArea global variable
const canvasBorderX = (window.innerWidth - config.CANVAS_WIDTH) / 2;                            // Calculate gap between screen and canvas
const canvasBorderY = (window.innerHeight - config.CANVAS_HEIGHT) / 2;                          // Calculate gap between screen and canvas
const invenotryPositionX = Math.round((config.CANVAS_WIDTH - inventoryImage.width) / 2);
const invenotryPositionY = Math.round((config.CANVAS_HEIGHT - inventoryImage.height) / 2);
let itemsArray = [];                                                                            // Define global itemsArray array
let pickedItem = null;                                                                          // Define global pickedItem variable
let pickedItemID = null;                                                                        // Define global pickedItemID variable
let onHoverFrame = null;                                                                        // Define global onHoverFrame variable with null value
const inventoryFramesCords = {                                                                  // inventoryFramesCords object with coordinates of each invenotry frame
    'weapon': [invenotryPositionX + 78, invenotryPositionY + 138],
    'helmet': [invenotryPositionX + 156, invenotryPositionY + 96],
    'chestplate': [invenotryPositionX + 156, invenotryPositionY + 174],
    'shoes': [invenotryPositionX + 156, invenotryPositionY + 252],
    'shield': [invenotryPositionX + 234, invenotryPositionY + 138],
    'frame5': [invenotryPositionX + 54, invenotryPositionY + 384],
    'frame6': [invenotryPositionX + 156, invenotryPositionY + 384],
    'frame7': [invenotryPositionX + 258, invenotryPositionY + 384],
    'frame8': [invenotryPositionX + 54, invenotryPositionY + 462],
    'frame9': [invenotryPositionX + 156, invenotryPositionY + 462],
    'frame10': [invenotryPositionX + 258, invenotryPositionY + 462],
    'frame11': [invenotryPositionX + 54, invenotryPositionY + 540],
    'frame12': [invenotryPositionX + 156, invenotryPositionY + 540],
    'frame13': [invenotryPositionX + 258, invenotryPositionY + 540],
}

export class InventoryFrame { 
    constructor(number, x, y, item=null) {
        // Creating new div element
        this.frame = document.createElement('div');
        this.frame.setAttribute('class', 'itemFrame');
        this.frame.id = 'frame' + number;
        this.frame.style.top = y + 'px';
        this.frame.style.left = x + 'px';
        this.frame.addEventListener('mouseover', this.mouseOverEffect.bind(this));
        this.frame.addEventListener('mouseout', this.mouseOutEffect.bind(this));
        this.frame.addEventListener('mousedown', this.chooseItem.bind(this));
        gameArea.appendChild(this.frame);
        // Set parameters
        this.isFrameEmpty = true;
        this.item = item;
        this.setParameters();
    }

    setParameters() {                                                                   // Set parameters
        if (this.item != null) {
            this.isFrameEmpty = false;                                                  // Set frame to not empty
        }
    }

    getFrameID() {
        return this.frame.id;                                                           // Get div element id
    }

    getLeftOffset() {                                                                   // Get left offset of frame
        return this.frame.offsetLeft;
    }

    getTopOffset() {                                                                    // Get top offset of frame
        return this.frame.offsetTop;
    }

    mouseOverEffect() {                                                                 // Do function when mouse is over frame
        if (isInvenoryOpen) {
            this.frame.style.opacity = 0.2;                                             // Set opacity of white square which covers whole frame
            onHoverFrame = this;                                                        // Take this.frame as onHoverFrame 
        }

        if (isInvenoryOpen && !this.isFrameEmpty) {
            const informationFrame = document.querySelector('.itemDetailsFrame');
            const firstTextLine = '<span style="color: #936537;">Nazwa: <span style="color: whitesmoke;">' + this.item.name + '</span> </span>';
            let secondTextLine = '';
            let thirdTextLine = '';
            let fourthTextLine = '';
            let describtionTextLine = '';
            switch (this.item.type) {
                case 'weapon':
                    secondTextLine = '<span style="color: #936537;">Obrażenia: <span style="color: whitesmoke;">' + this.item.damage + '</span> </span>';
                    describtionTextLine = '<span style="font-size: 0.7rem; color: #936537; font-style: italic;"> "Muszę uważać żeby się nie skaleczyć!" </span>';
                    break;

                case 'food':
                    secondTextLine = '<span style="color: #936537;">Punkty życia: <span style="color: whitesmoke;">' + this.item.hitpoints + '</span> </span>';
                    describtionTextLine = '<span style="font-size: 0.7rem; color: #936537; font-style: italic;"> "Pychotaa!" </span>';
                    break;

                default:
                    secondTextLine = '<span style="color: #936537;">Punkty życia: <span style="color: whitesmoke;">' + this.item.hitpoints + '</span> </span>';
                    thirdTextLine = '<span style="color: #936537;">Obrona: <span style="color: whitesmoke;">' + this.item.defense + '</span> </span>'
                    describtionTextLine = '<span style="font-size: 0.7rem; color: #936537; font-style: italic;"> "Dzięki temu czuję się bezpiecznie!" </span>';
                    break;
            }
            
            informationFrame.innerHTML = firstTextLine + secondTextLine + thirdTextLine + describtionTextLine;
            informationFrame.style.display = 'grid';
            gameArea.addEventListener('mousemove', this.moveItem.bind(this));
        }
    }

    mouseOutEffect() {                                                                  // Do function when mouse is out of frame
        const informationFrame = document.querySelector('.itemDetailsFrame');
        informationFrame.style.display = 'none';                                 

        this.frame.style.opacity = 0;                                                   // Set opacity of white square which covers whole frame
        onHoverFrame = null;                                                            // Reset to null onHoverFrame
    }

    chooseItem() {
        if (isInvenoryOpen) {
            if (!this.isFrameEmpty && pickedItem == null) {                             // If clicked frame isn't empty pick up an item
                pickedItem = this.item; 
                this.pickUpItem();                                                      // Take this.item as pickedItem          
                if (this.frame.id == 'frame0' || this.frame.id == 'frame1' || this.frame.id == 'frame2' || this.frame.id == 'frame3' || this.frame.id == 'frame4') {
                    calculateStats(pickedItem, 'takeoff');                              // Calculate stats
                }
                this.isFrameEmpty = true;                                               // Reset this.isFrameEmpty to true
                this.item = null;                                                       // Reset this.item to null
                gameArea.addEventListener('mousemove', this.moveItem.bind(this));       // Add mousemove event to moveItem() function
            }

            else if (this.isFrameEmpty && pickedItem != null && this.checkItemType(pickedItem)) {   // Else if clicked frame is empty and there is a picked item, put this item to the on hover frame
                this.placeItem();                                                       // Place item into the frame
                onHoverFrame.setParameters();                                           // Set isFrameEmpty to false by use setter method setParameters(), otherwise it cannot be changed    
                saveInventory(this.item.name, this.frame.id); 
                pickedItem = null;                                                      // Reset pickedItem parameter to null
            }

            else if (!this.isFrameEmpty && pickedItem != null) {                        // If there is picked item and frame isn't empty
                const inFrameItem = onHoverFrame.item;
                const itemToPlace = pickedItem;

                const itemToPlaceID = document.getElementById(pickedItem.getItemID());  // Get ID of pickedItem
                this.placeItem(itemToPlaceID);                                          // Place item into the frame
                onHoverFrame.item = itemToPlace;                                        // Set onHoverFrame.item to pickedItem
                onHoverFrame.isFrameEmpty = false;                                      // Set isFrameEmpty to false
                pickedItem = inFrameItem;                                               // Take this.item as pickedItem          
                this.pickUpItem();                                                      // Pick up item from the frame

                saveInventory(itemToPlace.name, this.frame.id);
            }
        }
    }

    moveItem(e) {
        if (pickedItem != null) {                                                       // If there is picked item move it following cursor
            let cursorX = e.pageX;                                                      // Get cursor X coordinate
            let cursorY = e.pageY;                                                      // Get cursor Y coordinate
            pickedItemID.style.left = cursorX - canvasBorderX + 'px';                   // Set left offset of pickedItem to cursor X coordinate minus gap between screen and canvas
            pickedItemID.style.top = cursorY - canvasBorderY + 'px';                    // Set top offset of pickedItem to cursor Y coordinate minus gap between screen and canvas
        }

        else if (onHoverFrame != null) {
            const informationFrame = document.querySelector('.itemDetailsFrame');
            informationFrame.style.left = e.pageX - canvasBorderX + 'px';
            informationFrame.style.top = e.pageY - canvasBorderY - informationFrame.offsetHeight + 'px';
            informationFrame.style.zIndex = 9;
        }
    }

    checkItemType(item) {
        const itemType = item.type;                                                     // Get item type
        const frameX = this.frame.offsetLeft;                                           // Get frame X coordinate
        const frameY = this.frame.offsetTop;                                            // Get frame Y coordinate
        let loop = 0;

        for (const frameType in inventoryFramesCords) {                                 // Loop through inventoryFramesCords
            if (loop <= 4) {                                                            // If loop is less than or equal to 4 (because hero has 5 wearable slots)
                if (inventoryFramesCords[frameType][0] == frameX && inventoryFramesCords[frameType][1] == frameY) {     
                    // If frame (ex. helmet) X and Y cords are equal to clicked frame X and Y
                    if (frameType == itemType) {                                        // And if frame type is equal to wearable item type
                        calculateStats(item, 'wear');                                   // Add item stats to hero stats
                        updateRequest = true;                                           // Update canvas for change new statistics
                        return true;                                                    // Return true
                    }

                    else {
                        return false;                                                   // If item type isn't equal return false
                    }
                }
            }

            else {                                                                      // If loop is greater than 4 return true, becasue item must be placed anyway just without adding stats,
                return true;                                                            // This is for inventory frames with are not wearable
            }
            loop++;                                                                     // Incerement loop
        }
    }

    pickUpItem() {
        pickedItemID = document.getElementById(pickedItem.getItemID());                 // Get ID of pickedItem
        pickedItemID.style.left = this.frame.offsetLeft + 10 + 'px';                    // Make pick up visual effect by setting left offset
        pickedItemID.style.top = this.frame.offsetTop + 10 + 'px';                      // Make pick up visual effect by setting top offset
        pickedItemID.style.zIndex = 8;                                                  // Set z-index to 8 for make picked item on top, over the other items in the frames
    }

    placeItem(itemToPlaceID=pickedItemID) {
        itemToPlaceID.style.left = onHoverFrame.getLeftOffset() + 'px';                 // Ceneter picked item to the frame by setting left offset
        itemToPlaceID.style.top = onHoverFrame.getTopOffset() + 'px';                   // Ceneter picked item to the frame by setting top offset
        itemToPlaceID.style.zIndex = 7;                                                 // Lower z-index to default value
        onHoverFrame.item = pickedItem;                                                 // Set onHoverFrame.item to pickedItem
    }
}

export class Item {
    constructor(id, image, type, name, damage, defense, hitpoints, cost) {
        // Creating as a new div element
        this.item = document.createElement('div');                                      // Create div
        this.item.setAttribute('class', 'item');                                        // Apply CSS properties of class 'item' to every new created object
        this.item.id = 'item' + id;                                                     // Set ID
        this.item.style.backgroundImage = image;                                        // Set background image
        gameArea.appendChild(this.item);                                                // Append new object to gameArea element
        // Parameters
        this.type = type;                                                               // Type of item
        this.name = name;                                                               // Name of item
        this.damage = damage;                                                           // Damage of item
        this.defense = defense;                                                         // Defense of item
        this.hitpoints = hitpoints;                                                     // Hitpoints of item
        this.cost = cost;                                                               // Cost of item
    }

    getItemID() {                                                                       // Get div element id
        return this.item.id;
    }

    getLeftOffset() {                                                                   // Get left offset
        return this.item.offsetLeft;
    }

    getTopOffset() {                                                                    // Get top offset
        return this.item.offsetTop;
    }

    showItems() {                                                                       // Show item (display: 'block')
        const itemID = document.getElementById(this.item.id);   
        itemID.style.display = 'block';
    }

    hideItems() {                                                                       // Hide item (display: 'none')
        const itemID = document.getElementById(this.item.id);
        itemID.style.display = 'none';
    }
}

export function setItemsArray(array) {                                                  // Set array from skrypt.mjs file to itemsArray in this file
    itemsArray = array;
}

export function createInventory() {
    const inventoryFramesArray = Object.values(inventoryFramesCords);                   // Create array of inventoryFramesCords elements
    console.log(inventoryFramesArray[0][0]);
    for (let j = 0; j < inventoryFramesArray.length; j++) {
        inventoryFrames.push(new InventoryFrame(j, inventoryFramesArray[j][0], inventoryFramesArray[j][1]));    // Push new objects to inventoryFrames array
    }
    createCoin();                                                                       // Create spinning coin image in inventory
}

export function drawInventory(ctx) {                                                    // Draw inventory on the screen
    if (!isInvenoryOpen) {                                                              // If invenotry is closed
        setIsInvenoryOpen(true);                                                        // Set isInventoryOpen to true
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        // ctx.fillRect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT);
        ctx.drawImage(inventoryImage, Math.round((config.CANVAS_WIDTH - inventoryImage.width) / 2), Math.round((config.CANVAS_HEIGHT - inventoryImage.height) / 2), inventoryImage.width, inventoryImage.height);
        for (let i = 0; i < itemsArray.length; i++) {
            itemsArray[i].showItems();                                                  // Display every item in inventory
        }
        writeHeroStats(ctx);                                                            // Write hero stats
        displayMoney(true);                                                             // Display coin image
        writeHeroMoney(ctx);                                                            // Write hero money
    }

    else {                                                                              // If invenotry is open
        setIsInvenoryOpen(false);                                                       // Set isInventoryOpen to false
        displayMoney(false);                                                            // Hide coin image
        for (let i = 0; i < itemsArray.length; i++) {
            itemsArray[i].hideItems();                                                  // Hide every item in inventory
        }
        hero.breathing();                                                               // Start breathing again
        for (let i = 0; i < monsterArray.length; i++) {
            monsterArray[i].chase();                                                    // Allow monsters to chase hero again
        }
    }
}

export async function loadInventory() {
    let n = null, j = null;                                                             // Define variables for loops
    let item = null;
    let frame = null;
    let frameX = null;
    let frameY = null;
    try {
        const response = await fetch('/api/load-inventory');                            // Make a request to server
        if (!response.ok) {                                                             // If response is not ok
            throw new Error('Failed to fetch inventory data');                          // Create new error
        }
        const data = await response.json();                                             // Get data from response
        for (let i = 0; i < data.inventory.length; i++) {                               // Loop through ivnentory array length from database
            if (data.inventory[i].frame != null) {                                      // Check if frame is not null
                for (n = 0; n < inventoryFrames.length; n++) {                          // Loop through inventoryFrames array length
                    if (inventoryFrames[n].getFrameID() == data.inventory[i].frame) {   // Check if id of database frame object is equal to inventoryFrames[n].getFrameID()
                        frame = inventoryFrames[n];                                     // Set 'frame' variable as inventoryFrames[n] object
                        frameX = frame.getLeftOffset();                                 // Use offsetLeft to get frame position on X axis
                        frameY = frame.getTopOffset();                                  // Use offsetTop to get frame position on Y axis
                        break;
                    }
                }

                for (j = 0; j < itemsArray.length; j++) {
                    if (itemsArray[j].name == data.inventory[i].item_name) {            // Check if name of database item object is equal to itemsArray[j].name
                        item = document.getElementById(itemsArray[j].getItemID());      // Get ID of item object in itemsArray
                        item.style.left = frameX + 'px';                                // Set CSS left offset of item object
                        item.style.top = frameY + 'px';                                 // Set CSS top offset of item object
                        frame.isFrameEmpty = false;                                     // Set isFrameEmpty to false
                        frame.item = itemsArray[j];                                     // Set frame.item to itemsArray[j]
                        break;
                    }
                }

                const inventoryFrameID = inventoryFrames[n].getFrameID();               // Get frame id every loop
                const garmentItem = itemsArray[j];                                      // Get wearable item as itemsArray item every loop
                if (inventoryFrameID == 'frame0' || inventoryFrameID == 'frame1' || inventoryFrameID == 'frame2' ||
                    inventoryFrameID == 'frame3' || inventoryFrameID == 'frame4') {     // If item is in wearable slot
                    calculateStats(garmentItem, 'wear');                                // Calculate stats for this item
                }
            }
        }
        return true;                                                                    // Return true
    } catch (error) {                                                                   // If there is an error in exception
        console.error('Request failed:', error);                                        // Log error
        return false;                                                                   // Return false
    }
}

function writeHeroStats(ctx) {                                                          // Write hero stats
    const hitpoints = 'HP:    ' + hero.health;                                          // Create variable with hero stats
    const defense = 'DEF:   ' + hero.defense;                                           // Create variable with hero stats
    const damage = 'DMG:   ' + hero.damage;                                             // Create variable with hero stats
    const fontSize = 13;                                                                // Set font size for text
    const fontFamily = 'Medieval Sharp';                                                // Set font family
    // const fontFamily = 'Almendra';
    const x = invenotryPositionX + 51;                                                                      // Set X position for writing text
    const y = invenotryPositionY + 249;                                                                      // Set Y position for writing text

    ctx.font = `${fontSize}px ${fontFamily}`;                                           // Apply font properties
    ctx.fillStyle = '#d4cebe';                                                          // Set text color
    ctx.fillText(hitpoints, x, y);                                                      // Write text
    ctx.fillText(defense, x, y + 15);                                                   // Write text
    ctx.fillText(damage, x, y + 30);                                                    // Write text
}

function createCoin() {
    // Create div element
    const coin = document.createElement('div');
    coin.setAttribute('class', 'coin');
    coin.id = 'inventory-coin';
    coin.style.left = invenotryPositionX + 235 + 'px';
    coin.style.top = invenotryPositionY + 253 + 'px';
    coin.style.backgroundImage = 'url(Graphics/GUI/coin.gif)';
    coin.style.display = 'none';
    gameArea.appendChild(coin);
}

function writeHeroMoney(ctx) {
    const money = hero.money;
    const fontSize = 17;
    const fontFamily = 'Medieval Sharp';
    // const fontFamily = 'Almendra';
    const x = invenotryPositionX + 264;
    const y = invenotryPositionY + 272;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#d4cebe';
    ctx.fillText(money, x, y);
}

function displayMoney(state) {
    const coin = document.getElementById('inventory-coin');
    if (state) {
        coin.style.display = 'block';
    } else {
        coin.style.display = 'none';
    }
}

async function saveInventory(name, frame) {
    const data = {
        name: name,
        frame: frame
    };

    try {
        const response = await fetch('/api/save-inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set the content type to JSON
            },
            body: JSON.stringify(data) // Convert data to a JSON string
        });

        if (!response.ok) {
            throw new Error('Failed to save inventory');
        }

        const responseData = await response.json();
        console.log('Request successful:', responseData);
        return true;
    }
    
    catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}


function calculateStats(item, action) {
    const itemDamage = item.damage;
    const itemDefense = item.defense;
    const itemHitpoints = item.hitpoints;
    switch (action) {
        case 'wear':
            hero.damage += itemDamage;
            hero.defense += itemDefense;
            hero.health += itemHitpoints;
            break;

        case 'takeoff':
            hero.damage -= itemDamage;
            hero.defense -= itemDefense;
            hero.health -= itemHitpoints;
            break;
    }
}
