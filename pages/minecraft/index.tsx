import NextImage from 'next/image';
import styles from './styles/index.module.css';
import { useState, useRef, useEffect } from 'react';
import { getUUID, checkUUIDExists, getSkin } from "./utils";
import { createCamera, createRenderer } from '../index/SceneUtils';
import { startAnimationLoop } from '../index/SceneCleanup';
import * as THREE from 'three';
import './styles/global.css';

// GLOBAL VARIABLES
let whispers: HTMLAudioElement;
let whispersIntervalId: string | number | NodeJS.Timeout | undefined;

if (typeof window !== 'undefined') {
    whispers = new Audio('/assets/minecraft/sound/the secrets.mp3');
}

// interface for player skin data
interface PlayerSkin {
    url: string;
    type: string;
}

// splash screen interface
interface SplashScreenProps {
    onEnter: (event: React.MouseEvent<HTMLButtonElement>) => void;
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

// resizing debounce function
function resizeDebounce(func: (...args: any[]) => void, wait: number | undefined) {
    let timeout: string | number | NodeJS.Timeout | undefined;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
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
}, 500); // half second debounce

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

// stop the whisper sound effect with a convolver node (reverb effect)
function stopWhispers() {
    // create audio context and source
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const whispersSourceUrl = whispers.src;
    const whispersCurrentTime = whispers.currentTime;

    // create gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    Promise.all([
        // fetch impulse response for the reverb sound effect
        fetch('/assets/minecraft/sound/impulse.wav').then(response => response.arrayBuffer()),
        fetch(whispersSourceUrl).then(response => response.arrayBuffer())
    ]).then(([impulseBuffer, whispersBuffer]) => {
        audioContext.decodeAudioData(impulseBuffer, (decodedImpulseData) => {
            audioContext.decodeAudioData(whispersBuffer, (decodedWhispersData) => {
                const whispersSource = audioContext.createBufferSource();
                whispersSource.buffer = decodedWhispersData;

                // create convolver node for impulse response
                const convolver = audioContext.createConvolver();
                convolver.buffer = decodedImpulseData;

                // connect nodes to play the audio
                whispersSource.connect(gainNode);
                gainNode.connect(convolver);
                convolver.connect(audioContext.destination);
                whispersSource.start(audioContext.currentTime, whispersCurrentTime);

                // pause whispers audio
                fadeAudio();
                clearInterval(whispersIntervalId);

                whispersSource.stop(audioContext.currentTime + 1);
            }, (error) => console.error("Error decoding whispers data:", error));
        }, (error) => console.error("Error decoding impulse data:", error));
    }).catch(error => console.error("Failed to load files:", error));
}

// fade out the audio
function fadeAudio() {
    const fadeOutDuration = 1; // duration for fade out in seconds
    const initialVolume = whispers.volume;

    const fadeOut = setInterval(() => {
        if (whispers.volume > 0.01) {
            let newVolume = whispers.volume - initialVolume / (fadeOutDuration * 10);
            if (newVolume < 0) {
                whispers.volume = 0;
            } else {
                whispers.volume = newVolume;
            }
        } else {
            // stop the audio and clear the interval
            whispers.volume = 0;
            whispers.pause();
            whispers.currentTime = 0;
            clearInterval(fadeOut);
        }
    }, 100); // slowly fade audio out
}

// manage the whisper sound effect
function manageWhispers() {
    // lower the volume
    whispers.volume = 0.2;
    playWhispers();

    // play whispers every 39 seconds
    clearInterval(whispersIntervalId);
    whispersIntervalId = setInterval(() => {
        playWhispers();
    }, 39000); 
}

// play the whispering audio
function playWhispers(attempt = 1) {
    whispers.play().catch(error => {
        console.error("Audio play failed:", error);
        if (attempt < 5) {
            setTimeout(() => playWhispers(attempt + 1), 1000); // retry after 1 second
        }
    });
}

// create splash screen so audios can load (user interaction required)
function SplashScreen({ onEnter }: SplashScreenProps) {
    return (
        <div className={styles.splashScreen}>
            <div className={styles.splashText}>Secret Life</div>
            <button className={styles.enterButton} onClick={onEnter}>Click to Enter</button>
        </div>
    );
}

// main page component
export default function Home() {
    // disable splash screen and show page when needed
    const [showSplash, setShowSplash] = useState(true);
    const handleEnter = () => {
        setShowSplash(false);
    };

    let renderer: THREE.WebGLRenderer, scene;

    // state for player skin
    let steve = '/assets/minecraft/images/steve.png';
    const [playerSkin, setPlayerSkin] = useState({ url: steve, type: 'normal' });

    scene = new THREE.Scene();
    const canvasRef = useRef(null);

    // initialise page and draw skin on page load
    useEffect(() => {
        if (!showSplash && canvasRef.current) {
            drawSkin(steve, canvasRef.current);
            renderScene(renderer, scene);
        }
    }, [showSplash]);

    useEffect(() => {
        if (playerSkin.url) {
            drawSkin(playerSkin.url, canvasRef.current);
        } else {
            drawSkin(steve, canvasRef.current);
        }
    }, [playerSkin]);

    return (
        <>
            {showSplash && <SplashScreen onEnter={handleEnter} />}
            {!showSplash && (
                <div className={styles.pageWrapper}>
                    <div className={styles.threeJsWrapper}>
                        <div id="sceneWrapper" className={styles.sceneWrapper}></div>
                    </div>
                    <div className={styles.htmlWrapper}>
                        <div className={styles.playerWrapper}>
                            <div className={styles.book} id="book">
                                <NextImage src="/assets/minecraft/images/book.png" alt="book" width={82} height={82} draggable={false}/>
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
                                    infoText="Secret Life was a 6 week long Minecraft event hosted for University of Exeter students, 
                                    running once a week with 30 active players a session."
                                    buttonText="Read More"
                                />
                            </div>
                            <div className={styles.dataInfoWrapper}>
                                <InfoSection 
                                    infoText="Across the sessions, player data was gathered and processed. These statistics can be found below."
                                    buttonText="Read More"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function renderScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    // WINDOW SIZES
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    };

    // RENDERER
    renderer = createRenderer(sizes, "#000000", 0);

    // TEXTURE LOADER
    const loader = new THREE.TextureLoader();
    const playerWrapper = document.getElementById('book') as HTMLElement;

    // CAMERA
    const camera = createCamera(sizes);
    const bookMesh = createBookMesh(loader, playerWrapper, camera);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let mouseOnBook = false;

    // EVENT LISTENERS
    function onMouseMove(event: { clientX: number; clientY: number; }) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', () => updateSizes(camera, renderer, sizes));

    // SCENE
    scene.add(camera);
    scene.add(bookMesh);

    // CLOCK
    const clock = new THREE.Clock();

    // ANIMATION LOOP
    const tick = () => {
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        let currentlyOnBook = false;
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === bookMesh && mouse.x != 0 && mouse.y != 0) {
                currentlyOnBook = true;
                // mouse is on the book for first time
                if (!mouseOnBook) {
                    manageWhispers();
                    mouseOnBook = true;
                }
                break;
            }
        }

        // mouse just left the book
        if (!currentlyOnBook && mouseOnBook) { 
            stopWhispers();
            mouseOnBook = false;
        }

        renderer.clearStencil();
        renderer.render(scene, camera);

        startAnimationLoop(tick);
    };

    startAnimationLoop(tick);

    // add renderer to dom
    const wrapper = document.getElementById('sceneWrapper');
    if (wrapper && wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild);
    }

    wrapper?.appendChild(renderer.domElement);
}

const visibleHeightAtZDepth = ( depth: number, camera: { position: { z: any; }; fov: number; } ) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if ( depth < cameraOffset ) depth -= cameraOffset;
    else depth += cameraOffset;
  
    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180; 
  
    // Math.abs to ensure the result is always positive
    return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
  };
  
const visibleWidthAtZDepth = ( depth: number, camera: { aspect: number; position: { z: any; }; fov: number; } ) => {
    const height = visibleHeightAtZDepth( depth, camera );
    return height * camera.aspect;
};

// BOOK MESH
function createBookMesh(loader: THREE.TextureLoader, container: HTMLElement, camera: THREE.PerspectiveCamera) {
    const bookTexture = loader.load('/assets/minecraft/images/book.png');
    const bookGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // make book material transparent so effects can be applied later
    const bookMaterial = new THREE.MeshBasicMaterial({
        map: bookTexture,
        transparent: true,
        opacity: 0
    });

    const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);
    bookMesh.scale.set(0.25, 0.25, 0.25);

    // update mesh position dynamically
    function updateMeshPosition() {
        if (!container) return;
        const { left, top, width, height } = container.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;

        // get the true window width and height
        let windowWidth = visibleWidthAtZDepth(0, camera) / 2;
        let windowHeight = visibleHeightAtZDepth(0, camera) / 2;

        bookMesh.position.set(windowWidth - 1.95, windowHeight - 1.65, 0);
    }

    // auto update mesh position with a debounce to avoid incorrect resizes
    updateMeshPosition();
    window.addEventListener('resize', resizeDebounce(() => updateMeshPosition(), 50));

    return bookMesh;
}

function updateSizes(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, sizes: { width: any; height: any; }) {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

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
async function drawSkin(url: string, canvas: HTMLCanvasElement | null) {
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