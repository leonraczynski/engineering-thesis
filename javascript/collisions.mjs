import { collisionsMap } from './collisionsMap.mjs';
import { hero } from './characters.mjs';
import * as config from './config.mjs';

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

export async function createCollisionObstacles(mapOffsetX, mapOffsetY) {
    const collisionsMapParts = [];
    for (let i = 0; i < collisionsMap.length; i += config.MAP_DIMENSION) {
        collisionsMapParts.push(collisionsMap.slice(i, config.MAP_DIMENSION + i));   
    }

    collisionsMapParts.forEach((row, i) => {
        row.forEach((symbol, j) => {
            if (symbol === 12694) {
                obstacles.push(new Obstacles(j * Obstacles.width + mapOffsetX, i * Obstacles.height + mapOffsetY));  
            }
        })
    });
}

function findNearestObstacle(object) {
    const objectCenterPointX = object.positionX + object.frameWidth / 2 - 1;
    const objectCenterPointY = object.positionY + object.frameHeight / 1.5;
    let nearestObstacle = null;
    let distance = Infinity; 
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleCenterPointX = obstacles[i].positionX + obstacles[i].width / 2;
        const obstacleCenterPointY = obstacles[i].positionY + obstacles[i].height / 2;
        const distanceBetween = Math.sqrt(Math.pow(objectCenterPointX - obstacleCenterPointX, 2) + Math.pow(objectCenterPointY - obstacleCenterPointY, 2));
        if (distanceBetween < distance) {
            distance = distanceBetween;
            nearestObstacle = obstacles[i];
            
        }
    }
    return nearestObstacle;
}

export function checkObstacleCollision(object, direction) {
    const objectCenterX = object.positionX + object.width / 2;
    const objectCenterY = object.positionY + object.height / 1.5;
    const obstacle = findNearestObstacle(object);

    const obstacleCenterX = obstacle.positionX + obstacle.width / 2;
    const obstacleCenterY = obstacle.positionY + obstacle.height / 2;

    const heroRadius = Math.min(object.width, object.height) / 2.7;
    // const obstacleRadius = Math.min(obstacle.width, obstacle.height) / 2;

    const distanceX = Math.abs(objectCenterX - obstacleCenterX);
    const distanceY = Math.abs(objectCenterY - obstacleCenterY);

    if (direction === 'up' && objectCenterY > obstacleCenterY && distanceX <= heroRadius && distanceY <= heroRadius + object.stepLength) {
        return false; // true
    } 
    else if (direction === 'down' && objectCenterY < obstacleCenterY && distanceX <= heroRadius && distanceY <= heroRadius + object.stepLength) {
        return false;
    } 
    else if (direction === 'left' && objectCenterX > obstacleCenterX && distanceX <= heroRadius + object.stepLength && distanceY <= heroRadius) {
        return false;
    } 
    else if (direction === 'right' && objectCenterX < obstacleCenterX && distanceX <= heroRadius + object.stepLength && distanceY <= heroRadius) {
        return false;
    }

    return false;
}