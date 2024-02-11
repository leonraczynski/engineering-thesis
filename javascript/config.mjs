// Canvas settings
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;
// export const CANVAS_WIDTH = 1280;
// export const CANVAS_HEIGHT = 720;
export const TOTAL_IMAGES = 16;

// Map parameters
export const FONT_FAMILY = 'Medieval Sharp';
export const SQUARE_WIDTH = 48;
export const SQUARE_HEIGHT = 48;
export const MAP_DIMENSION = 236;

// Game speed (ms)
export const GAME_UPDATE_SPEED = 1;
export const MONSTER_CHASING_SPEED = 80 + (80 / GAME_UPDATE_SPEED);

// Hero parameters
export const HERO_FRAME_WIDTH = 126;
export const HERO_FRAME_HEIGHT = 120;
export const HERO_HEALTH = 100;
export const HERO_FRAMES_COUNT = 4;
export const HERO_STEP_LENGTH = 40;      // 6
export const HERO_CAN_ATTACK = true;

// Golem parameters
export const GOLEM_COUNT = 20;
export const GOLEM_FRAME_WIDTH = 72;
export const GOLEM_FRAME_HEIGHT = 72;
export const GOLEM_FRAMES_COUNT = 4;
export const GOLEM_HEALTH = 70;
export const GOLEM_STEP_LENGTH = 3;
export const GOLEM_CAN_ATTACK = true;
export const GOLEM_DETECTION_DISTANCE = 500;
export const GOLEM_ATTACK = 15;

// NPCs parameters
export const NPC_COUNT = 6;
export const NPC_FRAME_WIDTH = 64;
export const NPC_FRAME_HEIGHT = 80;
export const NPC_FRAMES_COUNT = 4;
export const NPC_STEP_LENGTH = 0;
export const NPC_CAN_ATTACK = false;