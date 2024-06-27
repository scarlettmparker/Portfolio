import NextImage from 'next/image';
import styles from './styles/index.module.css';
import { useState, useRef, useEffect } from 'react';
import { getUUID, checkUUIDExists, getSkin } from "./utils";
import './styles/global.css';

// interface for player skin data
interface PlayerSkin {
    url: string;
    type: string;
}

// debounce function to limit the number of times a function is called
function debounce(func: (event: React.ChangeEvent<HTMLInputElement>) => void, delay: number) {
    let debounceTimer: NodeJS.Timeout;
    return function(event: React.ChangeEvent<HTMLInputElement>) {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            func(event);
        }, delay);
    };
}

// function to handle the search input, used to update skin display
const handleSearchUpdate = (setPlayerSkin: React.Dispatch<React.SetStateAction<PlayerSkin>>) => debounce(async function(event: React.ChangeEvent<HTMLInputElement>) {
    let username = event.target.value;
    let check = await checkUUIDExists(username);
    let uuid;

    // if player doesn't already exist (stored for a day in database to prevent mojang rate limits)
    if (check.exists) {
        console.log("Player exists!");
        uuid = check.uuid
    } else {
        console.log("Player doesn't exist!")
        uuid = await getUUID(username);
        if (uuid.exists == false) {
            setPlayerSkin({ url: '/assets/minecraft/images/steve.png', type: 'normal' });
            return;
        }
        uuid = uuid.uuid;
        // add player to database along with uuid
    }

    // fetch player skin
    let playerData = await getSkin(uuid);
    let skinData = decodeBase64(playerData.skin[0].value);
    let skinUrl = skinData.textures.SKIN.url;
    let skinType = skinData.textures.SKIN.metadata && skinData.textures.SKIN.metadata.model === "slim" ? "slim" : "normal";

    // set player skin URL and type
    setPlayerSkin({ url: skinUrl, type: skinType });
}, 1500); // 1.5 second debounce

// decode base 64 data from skin
function decodeBase64(data: string) {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
}

// template for the info section divs
const InfoSection = ({ infoText, buttonText }: { infoText: string; buttonText: string }) => (
    <div className={styles.infoWrapper}>
        <div className={styles.infoTextWrapper}>
            <span className={styles.infoText}>{infoText}</span>
        </div>
        <div className={styles.readMoreButton}>
            <span className={styles.readMoreText}>{buttonText}</span>
        </div>
    </div>
);

export default function Home() {
    const [playerSkin, setPlayerSkin] = useState({ url: '/assets/minecraft/images/steve.png', type: 'normal' });
    const canvasRef = useRef(null);

    useEffect(() => {
        if (playerSkin.url) {
            drawSkin(playerSkin.url, canvasRef.current);
        } else {
            drawSkin('/assets/minecraft/images/steve.png', canvasRef.current);
        }
    }, [playerSkin]);

    return (
        <>
            <div className={styles.pageWrapper}>
                <div className={styles.htmlWrapper}>
                    <div className={styles.playerWrapper}>
                        <div className={styles.book}>
                            <NextImage src="/assets/minecraft/images/book.png" alt="book" width={82} height={71} draggable={false}/>
                        </div>
                        <div className={styles.player}>
                            <canvas ref={canvasRef} width={161} height={323} style={{ imageRendering: 'pixelated' }} />
                        </div>
                        <div className={styles.stand}></div>
                        <div className={styles.searchWrapper}>  
                            <input type="text"
                            placeholder="enter username..."
                            className={styles.searchBox}
                            onChange={handleSearchUpdate(setPlayerSkin)}
                            />
                        </div>
                    </div>
                    <div className={styles.titleWrapper}>
                        <span className={styles.title}>Secret Life</span>
                        <span className={styles.date}>Tue 4 Jun - Tue 9 Jul</span>
                    </div>
                    <div className={styles.expandedInfoWrapper}>
                        <div className={styles.pluginInfoWrapper}>
                            <InfoSection 
                                infoText="Secret Life was a 6 week long Minecraft event hosted for University of Exeter students 
                                running once a week with 30 active players per session."
                                buttonText="Read More"
                            />
                        </div>
                        <div className={styles.dataInfoWrapper}>
                            <InfoSection 
                                infoText="Across the sessions, player data was gathered and these statistics can be found below."
                                buttonText="Read More"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// map the 2D skin to the html page
async function drawSkin(url: string, canvas: HTMLCanvasElement | null) {
    const ctx = canvas?.getContext('2d');
    const img = new Image();

    // allow cross origin images to be used
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = function() {
        if (canvas && ctx) {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // makes it so skins remain pixelated
            ctx.imageSmoothingEnabled = false;

            //dimensions of each part of the player in the final canvas, scaled up
            const partWidth = width / 4;
            const partHeight = height / 8;

            // skin map with the source and destination coordinates for each part
            const skinMap: { [key: string]: { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number; layer?: boolean; mirror?: boolean } } = {
                head: { sx: 8, sy: 8, sw: 8, sh: 8, dx: partWidth, dy: 0, dw: partWidth * 2, dh: partHeight * 2 },
                body: { sx: 20, sy: 20, sw: 8, sh: 12, dx: partWidth, dy: partHeight * 2, dw: partWidth * 2, dh: partHeight * 3 },
                armLeft: { sx: 44, sy: 20, sw: 4, sh: 12, dx: 0, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3 },
                armRight: { sx: 44, sy: 20, sw: 4, sh: 12, dx: partWidth * 3, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3, mirror: true },
                legLeft: { sx: 4, sy: 20, sw: 4, sh: 12, dx: partWidth, dy: partHeight * 5, dw: partWidth + 0.25, dh: partHeight * 3 },
                legRight: { sx: 4, sy: 20, sw: 4, sh: 12, dx: partWidth * 2 - 0.25, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, mirror: true },
                headAccessory: { sx: 40, sy: 8, sw: 8, sh: 8, dx: partWidth, dy: 0, dw: partWidth * 2, dh: partHeight * 2, layer: true },
                bodyAccessory: { sx: 20, sy: 36, sw: 8, sh: 12, dx: partWidth, dy: partHeight * 2, dw: partWidth * 2, dh: partHeight * 3, layer: true },
                armLeftAccessory: { sx: 44, sy: 36, sw: 4, sh: 12, dx: 0, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3, layer: true },
                armRightAccessory: { sx: 44, sy: 52, sw: 4, sh: 12, dx: partWidth * 8, dy: partHeight * 2, dw: partWidth, dh: partHeight * 3, mirror: true },
                legLeftAccessory: { sx: 4, sy: 36, sw: 4, sh: 12, dx: partWidth - 2, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, layer: true },
                legRightAccessory: { sx: 4, sy: 52, sw: 4, sh: 12, dx: partWidth * 2 - 4, dy: partHeight * 5, dw: partWidth, dh: partHeight * 3, layer: true }
            };

            // draw parts
            const drawPart = (part: { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number; layer?: boolean; mirror?: boolean }) => {
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
                ctx.drawImage(img, part.sx, part.sy, part.sw, part.sh, part.dx, part.dy + 16, part.dw, part.dh);
                ctx.restore();
            };

            // draw body parts first
            const bodyParts = ['body', 'armLeft', 'armRight', 'legLeft', 'legRight', 'bodyAccessory',
                'armLeftAccessory', 'armRightAccessory', 'legLeftAccessory', 'legRightAccessory'];
            bodyParts.forEach(partName => {
                drawPart(skinMap[partName]);
            });

            // then draw head and head accessories on top
            const headParts = ['head', 'headAccessory'];
            headParts.forEach(partName => {
                drawPart(skinMap[partName]);
            });
        }
    };
}