import NextImage from 'next/image';
import styles from './styles/index.module.css';
import { useState, useRef, useEffect } from 'react';
import { getUUID, checkUUIDExists, getSkin } from "./utils";
import { manageWhispers, stopWhispers, playBackground } from './musicutils';
import { drawSkin } from './skinutils';
import { createCamera, createRenderer } from '../index/SceneUtils';
import { startAnimationLoop } from '../index/SceneCleanup';
import * as THREE from 'three';
import './styles/global.css';

// GLOBAL VARIABLES
let enchantmentGraphics: string[] = [];
let lastResetTimes: number[] = [];
let currentlyOnBook: boolean = false;
let mouseParticles: THREE.Group<THREE.Object3DEventMap>;
let extraMouseParticles: THREE.Group<THREE.Object3DEventMap>;
let bookX = 0.26, bookY = 0;
const bookPosition: THREE.Vector3 = new THREE.Vector3();

// interface for player skin data
interface PlayerSkin {
    url: string;
    type: string;
}

// splash screen interface
interface SplashScreenProps {
    onEnter: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// load image for the enchantment graphics
function splitEnchantmentImage() {
    let img = new Image();
    img.src = '/assets/minecraft/images/font-map.png';
    img.onload = () => {
        let canvas = document.createElement('canvas');

        // get image width and height to iterate over
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');

        if (ctx) {
            // split image into smaller parts
            ctx.drawImage(img, 0, 0);
            let width = 110;
            let height = 120;

            // crop each part of the image
            let croppedWidth = width - 20;
            let croppedHeight = height - 20;
            let i = 0;
            for (let y = 0; y < img.height; y += height) {
                for (let x = 0; x < img.width; x += width) {
                    // only get first 27 entries
                    if (i > 27) break;
                    let startX = x + 10;
                    let startY = y + 10;

                    // ensure cropped area doesn't exceed boundaries
                    startX = Math.max(0, Math.min(startX, img.width - croppedWidth));
                    startY = Math.max(0, Math.min(startY, img.height - croppedHeight));
                    let data = ctx.getImageData(startX, startY, croppedWidth, croppedHeight);

                    // create canvas for each cropped image
                    let canvas = document.createElement('canvas');
                    canvas.width = croppedWidth;
                    canvas.height = croppedHeight;
                    let ctx2 = canvas.getContext('2d');

                    if (ctx2) {
                        ctx2.putImageData(data, 0, 0);
                        enchantmentGraphics.push(canvas.toDataURL());
                        i++;
                    }
                }
            }
        }
    };
}

// debounce function to limit the number of times a function is called
function debounce(func: (event: React.ChangeEvent<HTMLInputElement>) => void, delay: number) {
    let debounceTimer: NodeJS.Timeout;
    return function (event: React.ChangeEvent<HTMLInputElement>) {
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
const handleSearchUpdate = (setPlayerSkin: React.Dispatch<React.SetStateAction<PlayerSkin>>) => debounce(async function (event: React.ChangeEvent<HTMLInputElement>) {
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
            playBackground();
            splitEnchantmentImage();
        }
    }, [showSplash]);

    // draw skin when player skin changes
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
                <>
                <div className={styles.threeJsWrapper}>
                    <div id="sceneWrapper" className={styles.sceneWrapper}></div>
                </div>
                <div className={styles.zoomContainer}>
                    <div className={styles.htmlWrapper}>
                        <div className={styles.playerWrapper}>
                            <div className={styles.book} id="book">
                                <NextImage src="/assets/minecraft/images/book.png" alt="book" width={82} height={82} draggable={false} />
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
                </>
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
    const shinyBook = createShinyBookMesh(loader, playerWrapper, camera);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let mouseOnBook = false;
    const mousePosition = new THREE.Vector3();

    // handle mouse movement
    const handleMouseMove: EventListener = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1;
        mousePosition.set(mouse.x, mouse.y, 0.8);
        mousePosition.unproject(camera);
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // EVENT LISTENERS
    function onMouseMove(event: { clientX: number; clientY: number; }) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener('mousemove', onMouseMove, false);

    let windowHeight = window.innerHeight;
    let tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
    window.addEventListener('resize', () => updateSizes(camera, renderer, tanFOV, windowHeight));

    // SCENE
    scene.add(camera);
    scene.add(bookMesh);

    // CLOCK
    const clock = new THREE.Clock();
    let hasRemoved = false;

    // ANIMATION LOOP
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);
        currentlyOnBook = false;

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === bookMesh && mouse.x != 0 && mouse.y != 0) {
                currentlyOnBook = true;
                // mouse is on the book for first time
                if (!mouseOnBook) {
                    // remove mouse particles just in case
                    scene.remove(mouseParticles);
                    scene.remove(extraMouseParticles);
                    scene.remove(shinyBook);

                    // create particles around the mouse
                    mouseParticles = createMouseParticles(mousePosition);
                    extraMouseParticles = createMouseParticles(mousePosition, 150, false);

                    // add particles to scene
                    scene.add(mouseParticles);
                    scene.add(extraMouseParticles);
                    scene.add(shinyBook);

                    mouseParticles.name = 'mouseParticles';
                    extraMouseParticles.name = 'mouseParticles';

                    // play whispers audio
                    manageWhispers();
                    mouseOnBook = true;
                }
                break;
            }
        }

        if (scene.getObjectByName('mouseParticles') && mousePosition.x != 0 && mousePosition.y != 0 && currentlyOnBook) {
            updateMouseParticles(mouseParticles, bookPosition);
            updateMouseParticles(extraMouseParticles, bookPosition);
        } else if (!currentlyOnBook && scene.getObjectByName('mouseParticles')) {
            updateMouseParticles(mouseParticles, mousePosition);
            updateMouseParticles(extraMouseParticles, mousePosition);
        }

        // mouse just left the book
        if (!currentlyOnBook && mouseOnBook) {
            stopWhispers();
            mouseOnBook = false;
            scene.remove(shinyBook);
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

// MOUSE PARTICLE MOVEMENT
function updateMouseParticles(mouseParticles: THREE.Group<THREE.Object3DEventMap>, mousePosition: THREE.Vector2Like) {
    const currentTime = Date.now();
    const movementSpeed = 0.0075;
    const rotationSpeed = 0.02;

    // loop through all the particles
    mouseParticles.children.forEach((child, index) => {
        if (child instanceof THREE.Points) {
            const positionAttr = child.geometry.attributes.position as THREE.BufferAttribute;
            const initialPositionAttr = child.geometry.attributes.initialPosition as THREE.BufferAttribute;

            // get the position of the particle
            const particleVec = new THREE.Vector3(
                positionAttr.getX(0),
                positionAttr.getY(0),
                positionAttr.getZ(0)
            );

            // get the initial position of the particle
            const initialVec = new THREE.Vector3(
                initialPositionAttr.getX(0),
                initialPositionAttr.getY(0),
                initialPositionAttr.getZ(0)
            );

            // calculate the direction towards the mouse position
            const direction = new THREE.Vector2(mousePosition.x - particleVec.x, mousePosition.y - particleVec.y);
            direction.setLength(movementSpeed);

            particleVec.add(new THREE.Vector3(direction.x, direction.y, 0));
            const particle2D = new THREE.Vector2(particleVec.x, particleVec.y);

            // if the particle is close to the mouse, reset to random position in radius around mouse for continuous movement
            if (particle2D.distanceTo(mousePosition) < 0.06 || currentTime - lastResetTimes[index] > 700) {
                if (currentlyOnBook) {
                    setParticlePosition(particleVec, mousePosition, currentTime, index);
                } else {
                    particleVec.z = 2;
                }
            }

            // calculate the angle of rotation and rotate clockwise for even index counterclockwise for odd index
            const angle = rotationSpeed * (index % 2 === 0 ? 1 : -1);

            // Translate particle to origin (relative to its initial position), rotate, and translate back
            const offsetX = particleVec.x - initialVec.x;
            const offsetY = particleVec.y - initialVec.y;
            const rotatedX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
            const rotatedY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);

            particleVec.x = initialVec.x + rotatedX;
            particleVec.y = initialVec.y + rotatedY;

            // update the position of the particle
            positionAttr.setXYZ(0, particleVec.x, particleVec.y, particleVec.z);
            positionAttr.needsUpdate = true;
        }
    });
}

// CREATE MOUSE PARTICLES
function createMouseParticles(position: THREE.Vector3, particleCount: number = 30, customMaterial: boolean = true): THREE.Group<THREE.Object3DEventMap> {
    const particles = new THREE.Group<THREE.Object3DEventMap>();

    for (let i = 0; i < particleCount; i++) {
        // create geometry for the particle
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(3);
        const initialPositions = new Float32Array(3);

        const angle = Math.random() * 2 * Math.PI;
        const distance = 0;

        // set initial position of the particle
        vertices[0] = initialPositions[0] = position.x + distance * Math.cos(angle);
        vertices[1] = initialPositions[1] = position.y + distance * Math.sin(angle);
        vertices[2] = initialPositions[2] = position.z;

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));

        // create material for the particle
        let material: THREE.PointsMaterial;
        material = customMaterial ? createMouseMaterial(i) : new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.005
        });

        const particle = new THREE.Points(geometry, material);
        particles.add(particle);
    }

    return particles;
}

// SET PARTICLE POSITION
function setParticlePosition(particle: THREE.Vector3, mousePosition: THREE.Vector2Like,
    currentTime: number, i: number, radius = 0.25) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius + 0.06;

    // set x and y pos based on circle and mouse pos
    const x = mousePosition.x + Math.cos(angle) * distance;
    const y = mousePosition.y + Math.sin(angle) * distance;

    // set position & reset timer if a particle is reset
    particle.set(x, y, 1);
    lastResetTimes[i] = currentTime;
}

// CREATE TEXTURE FROM BASE64
function createTextureFromBase64(base64Image: string): THREE.Texture {
    const image = new Image();
    image.src = base64Image;
    const texture = new THREE.Texture(image);
    image.onload = () => {
        texture.needsUpdate = true;
    };
    return texture;
}

// CREATE MOUSE MATERIAL
function createMouseMaterial(index: number): THREE.PointsMaterial {
    const selectedImage = enchantmentGraphics[index % enchantmentGraphics.length];
    const texture = createTextureFromBase64(selectedImage);

    return new THREE.PointsMaterial({
        map: texture,
        size: 0.075,
        transparent: true,
        depthWrite: false
    });
}

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

    // auto update mesh position with a debounce to avoid incorrect resizes
    updateMeshPosition(container, camera, bookMesh, bookX, bookY);
    window.addEventListener('resize', resizeDebounce(() => updateMeshPosition(container, camera, bookMesh, bookX, bookY), 50));

    return bookMesh;
}

// SHINY BOOK MESH
function createShinyBookMesh(loader: THREE.TextureLoader, container: HTMLElement, camera: THREE.PerspectiveCamera) {
    const bookTexture = loader.load('/assets/minecraft/images/book.png');
    const bookGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // make book material transparent so effects can be applied later
    const bookMaterial = new THREE.MeshBasicMaterial({
        map: bookTexture,
        transparent: true,
        opacity: 0.5
    });

    const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);

    // auto update mesh position with a debounce to avoid incorrect resizes
    updateMeshPosition(container, camera, bookMesh, bookX, bookY);
    window.addEventListener('resize', resizeDebounce(() => updateMeshPosition(container, camera, bookMesh, bookX, bookY), 50));

    return bookMesh;
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

// DYNAMIC POSITION UPDATING
function updateMeshPosition(container: HTMLElement, camera: THREE.PerspectiveCamera, mesh: THREE.Mesh, offsetX: number, offsetY: number) {
    if (!container) return;

    let windowWidth = visibleWidthAtZDepth(0, camera) / 4.45;
    let windowHeight = visibleHeightAtZDepth(0, camera) / 23;

    let bookPosX = windowWidth - offsetX;
    let bookPosY = -(windowHeight - offsetY);

    let scale = 0.25;

    mesh.position.set(bookPosX, bookPosY, 0)
    mesh.scale.set(scale, scale, scale);
    bookPosition.set(mesh.position.x / 2, mesh.position.y / 2,1);
}

// UPDATE SIZES
function updateSizes(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, tanFOV: number, windowHeight: number) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
}