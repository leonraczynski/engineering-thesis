import { collisionsMap } from './collisionsMap.mjs';

const collisionsArray = [];
export const obstacles = [];

export class Obstacles {
    static width = 48;                  // Width of the 1 square of the map (16px when zoom is 100%, here is 300%)
    static height = 48;                 // Height of the 1 square of the map (16px when zoom is 100%, here is 300%)
    constructor(x, y) {             // Position arg is an object with x and y properties
        this.width = Obstacles.width;    // Object width
        this.height = Obstacles.height;  // Object height
        this.positionX = x;
        this.positionY = y;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.0)';
        ctx.fillRect(this.positionX, this.positionY, this.width, this.height);
    }
}

async function sliceMapToParts() {
    for (let i = 0; i < collisionsMap.length; i += 200) {
        collisionsArray.push(collisionsMap.slice(i, 200 + i));   
    }
}

async function createCollisionObjects(mapOffsetX, mapOffsetY) {
    collisionsArray.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 12694) {
                obstacles.push(new Obstacles(j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY));  
            }
        })
    });
}
      
export async function createCollisionObstacles(mapX, mapY, ctx) {
    sliceMapToParts();
    createCollisionObjects(mapX, mapY);
}