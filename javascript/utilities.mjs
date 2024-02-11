export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function random(min, max) {
    return Math.floor(Math.random() * max) + min;
}

export function displayText(content, size, family, posX, posY, color, ctx) {
    const text = content;
    const fontSize = size;
    const fontFamily = family;

    const x = posX;
    const y = posY;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}