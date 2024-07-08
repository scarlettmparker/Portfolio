const helper: React.FC = () => {
    return null;
};
  
export default helper;

// canvas context for skin drawing
function initializeCanvasContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
    return canvas?.getContext('2d') || null;
}

// load image and handle cross origin request
async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => resolve(img);
    });
}

// skin map for coordinates of each part
function getSkinMap(partWidth: number, partHeight: number) {
    return {
        head: { sx: 8, sy: 8, sw: 8, sh: 8, dx: partWidth, dy: 0, dw: partWidth * 2, dh: partHeight * 2 },
        body: { sx: 20, sy: 20, sw: 8, sh: 12, dx: partWidth, dy: partHeight * 2, dw: partWidth * 2, dh: partHeight * 3 },
        armLeft: { sx: 44, sy: 20, sw: 4, sh: 12, dx: 0, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3 },
        armRight: { sx: 44, sy: 20, sw: 4, sh: 12, dx: partWidth * 3, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3, mirror: true },
        legLeft: { sx: 4, sy: 20, sw: 4, sh: 12, dx: partWidth, dy: partHeight * 5, dw: partWidth + 0.25, dh: partHeight * 3 },
        legRight: { sx: 4, sy: 20, sw: 4, sh: 12, dx: partWidth * 2 - 0.25, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, mirror: true },
        headAccessory: { sx: 40, sy: 8, sw: 8, sh: 8, dx: partWidth, dy: 0, dw: partWidth * 2, dh: partHeight * 2, layer: true },
        bodyAccessory: { sx: 20, sy: 36, sw: 8, sh: 12, dx: partWidth, dy: partHeight * 2, dw: partWidth * 2, dh: partHeight * 3, layer: true },
        armLeftAccessory: { sx: 60, sy: 52, sw: 4, sh: 12, dx: -4, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3 },
        armRightAccessory: { sx: 52, sy: 52, sw: 4, sh: 12, dx: partWidth * 3, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3 },
        legLeftAccessory: { sx: 4, sy: 36, sw: 4, sh: 12, dx: partWidth - 2, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, layer: true },
        legRightAccessory: { sx: 4, sy: 52, sw: 4, sh: 12, dx: partWidth * 2 - 4, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, layer: true }
    };
}


// draw each individual part
function drawPart(ctx: CanvasRenderingContext2D, img: HTMLImageElement, part: { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number; layer?: boolean; mirror?: boolean }) {
    ctx.save();
    if (part.mirror) {
        // flip horizontally
        ctx.scale(-1, 1);
        part.dx = -part.dx - part.dw;
    }
    if (part.layer) {
        // scale to give a sense of depth
        ctx.scale(1.1, 1.1);
        ctx.translate(-part.dw / 9, -part.dh / 10);
    }
    ctx.drawImage(img, part.sx, part.sy, part.sw, part.sh, part.dx + 2, part.dy + 16, part.dw, part.dh);
    ctx.restore();
}

// function to check if over x% of the background pixels are black
function detectBlackBackground(ctx: CanvasRenderingContext2D, mainParts: { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number; }[], width: number, height: number) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let totalPixels = 0;
    let blackPixels = 0;
    let excludedPixels = new Set();

    // pixels covered by main parts get excluded
    for (const part of mainParts) {
        const { dx, dy, dw, dh } = part;
        for (let y = dy; y < dy + dh; y++) {
            for (let x = dx; x < dx + dw; x++) {
                excludedPixels.add(y * width + x);
            }
        }
    }

    // only go through pixels in exclusion set
    for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
        const x = (pixelIndex / 4) % width;
        const y = Math.floor((pixelIndex / 4) / width);

        // go through each background pixel
        if (!excludedPixels.has(y * width + x) && y < 64 && x < 64) {
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            const a = pixels[pixelIndex + 3];

            if (r == 0 && g == 0 && b == 0 && a == 0) {
                continue;
            }

            totalPixels++;

            // check if pixel is black
            if (r < 20 && g < 20 && b < 20 && a > 235) {
                blackPixels++;
            }
        }
    }

    let ratio = 1 - (blackPixels / totalPixels);
    return ratio > 0.8 && ratio != 1;
}

// draw all skin parts
function drawAllParts(ctx: CanvasRenderingContext2D, img: HTMLImageElement, skinMap: { [key: string]: { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number; layer?: boolean; mirror?: boolean } }, drawAccessories: boolean) {
    const bodyParts = ['body', 'armLeft', 'armRight', 'legLeft', 'legRight'];
    const accessoryParts = ['bodyAccessory', 'armLeftAccessory', 'armRightAccessory', 'legLeftAccessory', 'legRightAccessory'];

    bodyParts.forEach(partName => {
        drawPart(ctx, img, skinMap[partName]);
    });

    // draw head parts separately so they render on top
    const headParts = ['head'];
    if (drawAccessories) {
        headParts.push('headAccessory');
        accessoryParts.forEach(partName => {
            drawPart(ctx, img, skinMap[partName]);
        });
    }

    headParts.forEach(partName => {
        drawPart(ctx, img, skinMap[partName]);
    });
}

// main skin drawing function
export async function drawSkin(url: string, canvas: HTMLCanvasElement | null) {
    const ctx = initializeCanvasContext(canvas);
    if (!ctx) return;

    const img = await loadImage(url);
    const width = canvas!.width;
    const height = canvas!.height;

    ctx.clearRect(0, 0, width, height);

    // makes it so skins remain pixelated
    ctx.imageSmoothingEnabled = false;

    // dimensions of each part of the player in the final canvas, scaled up
    const partWidth = width / 4;
    const partHeight = height / 8;
    const skinMap = getSkinMap(partWidth, partHeight);

    // draw main parts
    const mainParts = [
        skinMap.head, skinMap.body, skinMap.armLeft, skinMap.armRight, skinMap.legLeft, skinMap.legRight
    ];

    mainParts.forEach(part => {
        drawPart(ctx, img, part);
    });

    // draw all parts, conditionally drawing accessories
    const drawAccessories = !detectBlackBackground(ctx, mainParts, width, height);
    drawAllParts(ctx, img, skinMap, drawAccessories);
}