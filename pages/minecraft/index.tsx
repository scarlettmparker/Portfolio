import styles from './styles/index.module.css';
import infostyles from './styles/info.module.css';
import ReactDOM from 'react-dom';
import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { getUUID, checkUUIDExists, getSkin, getGalleryCount } from "./utils";
import { manageWhispers, stopWhispers, playBackground } from './musicutils';
import { drawSkin } from './skinutils';
import { createCamera, createRenderer } from '../index/SceneUtils';
import { startAnimationLoop } from '../index/SceneCleanup';
import { vertexShader, fragmentShader } from './shaders/bookshader';
import { ArrowButton } from './arrowbutton';
import * as THREE from 'three';
import './styles/global.css';
import React from 'react';

// GLOBAL VARIABLES
let fadeInterrupt = false;
let enchantmentGraphics: string[] = [];
let lastResetTimes: number[] = [];
let currentlyOnBook: boolean = false;
let mouseParticles: THREE.Group<THREE.Object3DEventMap>;
let extraMouseParticles: THREE.Group<THREE.Object3DEventMap>;
let shinyMaterial: THREE.ShaderMaterial;
let bookPosition: THREE.Vector3 = new THREE.Vector3();
let tanFOV: number, windowHeight: number;
let renderer: THREE.WebGLRenderer;
let bookX = 0.25, bookY = 0;

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

// for multiple image sizes
interface NextImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    srcSet?: string;
    sizes?: string;
}

const NextImage: React.FC<NextImageProps> = ({ src, alt, width, height, srcSet, sizes, ...rest }) => {
    return <img src={src} alt={alt} width={width} height={height} srcSet={srcSet} sizes={sizes} {...rest} />;
};

// template for the info section divs
const InfoSection = ({ infoText, buttonText, infoType, isExpanded, setExpanded }: {
    infoText: string; buttonText: string,
    infoType: number, isExpanded: boolean, setExpanded: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const infoSectionRef = useRef<HTMLDivElement>(null);
    const [numberImages, setNumberImages] = useState(0);
    const [currentButtonText, setCurrentButtonText] = useState(buttonText);
    const [selectedID, setSelectedID] = useState("1");
    const [currentImage, setCurrentImage] = useState(0);

    const handleSelect = (id: string) => {
        setSelectedID(id);
    };

    // get gallery image count from the api
    useEffect(() => {
        const fetchGalleryCount = async () => {
            const count = await getGalleryCount();
            setNumberImages(count);
        };

        fetchGalleryCount();
    }, []);

    const expandInfoWrapper = (ref: React.RefObject<HTMLDivElement>, infoType: number) => {
        let parent = ref.current;
        if (parent) {
            // toggle css, ensure the div expands
            showExpandedInformation(setCurrentButtonText, buttonText, parent, setExpanded);
        }
    };

    return (
        <div ref={infoSectionRef} className={`${styles.infoWrapper} ${isExpanded ? styles.moreTextWrapper : ''}`}>
            <div className={styles.infoTextWrapper}>
                {infoText.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                        <span className={styles.infoText}>{line}</span>
                        <br />
                    </React.Fragment>
                ))}
            </div>
            {isExpanded && (
                <ExtraPluginInfoSection selectedID={selectedID} handleSelect={handleSelect}
                    currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
            )}
            <div className={styles.readMoreButton} onClick={() => expandInfoWrapper(infoSectionRef, infoType)}>
                <span className={styles.readMoreText}>{currentButtonText}</span>
            </div>
        </div>
    );
};

// extra info section for plugin section
const ExtraPluginInfoSection = ({ selectedID, handleSelect, currentImage, setCurrentImage, numberImages }:
    { selectedID: string, handleSelect: (arg0: string) => void, currentImage: number, setCurrentImage: (arg0: number) => void, numberImages: number }) => {
    return (
        <div className={infostyles.extraInfoWrapper}>
            <span className={infostyles.extraNavBar}>
                <span className={`${infostyles.navItem} ${selectedID === "1" ? infostyles.selectedNavItem : ''}`}
                    id={"1"} onClick={() => handleSelect("1")}>Plugin</span> |
                <span className={`${infostyles.navItem} ${selectedID === "2" ? infostyles.selectedNavItem : ''}`}
                    id={"2"} onClick={() => handleSelect("2")}>Gallery</span> |
                <span className={`${infostyles.navItem} ${selectedID === "3" ? infostyles.selectedNavItem : ''}`}
                    id={"3"} onClick={() => handleSelect("3")}>Tasks</span> |
                <span className={`${infostyles.navItem} ${selectedID === "4" ? infostyles.selectedNavItem : ''}`}
                    id={"4"} onClick={() => handleSelect("4")}>Stats</span>
            </span>
            {selectedID == "1" && <PluginSection />}
            {selectedID == "2" && <GallerySection currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />}
        </div>
    );
};


// animate the life text in the plugin section
function manageLifeAnimation() {
    const lifeTextElement = document.getElementById('lifeText');
    if (!lifeTextElement) return;

    let isMouseOver = false;

    // mouse enter, add class
    const handleMouseEnter = () => {
        isMouseOver = true;
        lifeTextElement.classList.add(infostyles.colorSwitch);
    };

    // mouse leave, set mouse over to false
    const handleMouseLeave = () => {
        isMouseOver = false;
    };

    // animation iteration, remove class if mouse is not over
    const handleAnimationIteration = () => {
        if (!isMouseOver) {
            lifeTextElement.classList.remove(infostyles.colorSwitch);
        }
    };

    // add event listeners to the life text element
    lifeTextElement.addEventListener('mouseenter', handleMouseEnter);
    lifeTextElement.addEventListener('mouseleave', handleMouseLeave);
    lifeTextElement.addEventListener('animationiteration', handleAnimationIteration);

    // cleanup event listeners on component unmount
    return () => {
        lifeTextElement.removeEventListener('mouseenter', handleMouseEnter);
        lifeTextElement.removeEventListener('mouseleave', handleMouseLeave);
        lifeTextElement.removeEventListener('animationiteration', handleAnimationIteration);
    };
}

// plugin information section
const PluginSection: React.FC = () => {
    // animate the life text in the plugin section
    useEffect(() => {
        manageLifeAnimation();
    }, []);

    let gitLink = "https://github.com/scarlettmparker/Life-Server-Plugin";

    return (
        <div className={infostyles.pluginWrapper}>
            <span className={infostyles.pluginDescription}>
                Secret Life was made possible through a custom<br />Minecraft plugin that was developed for the event.<br /><br />
                The Secret Life plugin was used to manage <span id="lifeText" className={infostyles.lifeText}>lives</span>, distribute tasks, 
                gather player data and house a variety of other custom features that can be found on the <a href={gitLink} target="_blank"><span className={infostyles.gitLink}>GitHub repository</span></a>.<br /><br />
                Developed in Java over the course of a few weeks, this plugin can be used on any 1.20+ Minecraft server that supports Spigot plugins.<br /><br />
                Support will <span className={infostyles.redText}>not be provided</span> for other Minecraft versions.
            </span>
        </div>
    );
};

// gallery section in plugin info
const GallerySection = ({ currentImage, setCurrentImage, numberImages }:
    { currentImage: number, setCurrentImage: (arg0: number) => void, numberImages: number }) => {
    const [showHDImage, setShowHDImage] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const handleImageLoaded = () => setIsImageLoaded(true);

    const toggleHDImage = () => {
        setShowHDImage(!showHDImage);
        setIsImageLoaded(false);

        // disable overflow when image is expanded
        const currentOverflow = document.body.style.overflowY;
        document.body.style.overflowY = currentOverflow === 'auto' || !currentOverflow ? 'hidden' : 'auto';
    };

    return (
        <>
            {showHDImage ? ReactDOM.createPortal(
                <>
                    <div
                        style={{ display: isImageLoaded ? 'block' : 'none' }}
                        id="hdImageWrapper"
                        className={infostyles.hdImageWrapper}
                        onClick={toggleHDImage}
                    >
                        <img
                            src={`/assets/minecraft/images/gallery/large/${currentImage}.png`}
                            alt="HD Gallery Image"
                            width={1842}
                            height={1024}
                            onLoad={handleImageLoaded} // ensure div is shown only when image has loaded
                        />
                    </div>
                    <div className={infostyles.backgroundCover}></div>
                </>,
                document.body // renders on top of everything else
            ) : (
                <div className={infostyles.galleryWrapper}>
                    <ArrowButton direction="left" rotation={90} currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
                    <ArrowButton direction="right" rotation={270} currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
                    <div className={infostyles.galleryImageWrapper} onClick={toggleHDImage}>
                        <img
                            src={`/assets/minecraft/images/gallery/small/${currentImage}.png`}
                            alt="Gallery Image"
                            width={540}
                            height={300}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

// show more information when divs are expanded
function showExpandedInformation(setCurrentButtonText: { (value: React.SetStateAction<string>): void; (arg0: string): void; },
    buttonText: string, parent: HTMLDivElement, setExpanded: React.Dispatch<React.SetStateAction<boolean>>) {
    // toggle css class for expanding div
    if (parent.classList.contains(styles.moreTextWrapper)) {
        parent.classList.remove(styles.moreTextWrapper);
        setCurrentButtonText(buttonText);
        setExpanded(false);
    } else {
        parent.classList.add(styles.moreTextWrapper);
        setCurrentButtonText("Read Less");
        setExpanded(true);
    }
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
    const [isPluginExpanded, setIsPluginExpanded] = useState(false);
    const [isDataExpanded, setIsDataExpanded] = useState(false);

    const handleEnter = () => {
        setShowSplash(false);
    };

    let scene;

    // state for player skin
    let steve = '/assets/minecraft/images/steve.png';
    const [playerSkin, setPlayerSkin] = useState({ url: steve, type: 'normal' });

    scene = new THREE.Scene();
    const canvasRef = useRef(null);

    // initialise page and draw skin on page load
    useEffect(() => {
        if (!showSplash && canvasRef.current) {
            setupAfterSplash(steve, canvasRef, scene);
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
                <div className={styles.pageContainer}>
                    <div className={styles.threeJsWrapper}>
                        <div id="sceneWrapper" className={styles.sceneWrapper}></div>
                    </div>
                    <div className={styles.mainContent}>
                        <div className={styles.zoomContainer}>
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
                                <span className={styles.date}>Tue 4 Jun - Tue 16 Jul</span>
                            </div>
                            <div className={styles.expandedInfoWrapper}>
                                <div className={styles.pluginInfoWrapper}>
                                    <InfoSection
                                        infoText={`Secret Life was a 7 week long Minecraft event hosted for students at the University of Exeter, running once a week with 30 active players a session.
                            
                                                In Secret Life, players are assigned a task at the start of every session that they complete as discretely as possible.
                            
                                                Across the 7 sessions, over 250 tasks were written and distributed. Tasks usually involve doing something social, which helps bring players together.`}
                                        buttonText="Read More"
                                        infoType={0}
                                        isExpanded={isPluginExpanded}
                                        setExpanded={setIsPluginExpanded}
                                    />
                                </div>
                                <div className={styles.dataInfoWrapper}>
                                    <InfoSection
                                        infoText="Across the sessions, player data was gathered through the plugin. Once the server ended, this data was processed. This data can be found below."
                                        buttonText="Read More"
                                        infoType={1}
                                        isExpanded={isDataExpanded}
                                        setExpanded={setIsDataExpanded}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.backgroundCover}></div>
                </div>
            )}
        </>
    );
}

// setup the page after the splash screen
function setupAfterSplash(steve: string, canvasRef: MutableRefObject<null>, scene: THREE.Scene) {
    drawSkin(steve, canvasRef.current);
    renderScene(renderer, scene);
    playBackground();
    splitEnchantmentImage();

    // fake resize event dispatch because spaghetti code
    let resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
}

// RENDER SCENE
function renderScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    // WINDOW SIZES
    const sizes = {
        width: window.innerWidth,
        height: 950,
    };

    // RENDERER
    renderer = createRenderer(sizes, "#000000", 0);

    // TEXTURE LOADER
    const loader = new THREE.TextureLoader();

    // CAMERA
    const camera = createCamera(sizes);
    const bookMesh = createBookMesh(loader, camera);
    const shinyBook = createShinyBookMesh(loader, camera);

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

    windowHeight = 950;
    tanFOV = Math.tan(((Math.PI / 180) * camera.fov / 2));
    window.addEventListener('resize', () => updateSizes(camera, renderer, tanFOV, windowHeight));

    // SCENE
    scene.add(camera);
    scene.add(bookMesh);

    // ANIMATION LOOP
    const tick = () => {
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        let intersects;
        if (mouse.x != 0 && mouse.y != 0) {
            intersects = raycaster.intersectObjects(scene.children);
        }

        const hdImageWrapper = document.getElementById('hdImageWrapper') as HTMLElement;
        currentlyOnBook = false;
        fadeInterrupt = false;

        if (intersects) {
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object === bookMesh && mouse.x && mouse.y) {
                    // ensure effects don't happen while images are full screened
                    if (hdImageWrapper && hdImageWrapper.style.display == 'block') {
                        break;
                    }
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

                        fadeInterrupt = true;
                        shinyMaterial.uniforms.opacity.value = 1.0;

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
        }

        // update mouse particles depending on mouse position
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
            if (shinyMaterial.uniforms.opacity.value == 1) {
                fadeOutObject(scene, shinyBook, 2000);
            }

        }

        renderer.clearStencil();
        renderer.render(scene, camera);

        // animate the enchantment effect
        const time = performance.now() * 0.001;
        shinyBook.material.uniforms.time.value = time;

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


// FADE OUT AN OBJECT
function fadeOutObject(scene: THREE.Scene, object: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial, THREE.Object3DEventMap>, duration: number) {
    // set up fade out animation
    var startOpacity = 1.0;
    var targetOpacity = 0.0;
    var startTime = performance.now();

    function animate() {
        var currentTime = performance.now();
        var deltaTime = currentTime - startTime;
        var progress = deltaTime / duration;

        // update opacity uniform for fade out
        shinyMaterial.uniforms.opacity.value = startOpacity * (1 - progress) + targetOpacity * progress;
        if (progress < 1) {
            if (!fadeInterrupt) {
                requestAnimationFrame(animate);
            } else {
                // user has hovered over the book again
                shinyMaterial.uniforms.opacity.value = 1.0;
            }
        } else {
            scene.remove(object);
        }
    }

    animate();
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
function createBookMesh(loader: THREE.TextureLoader, camera: THREE.PerspectiveCamera) {
    const bookTexture = loader.load('/assets/minecraft/images/book.png');
    const bookGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // make book material transparent so effects can be applied later
    const bookMaterial = new THREE.MeshBasicMaterial({
        map: bookTexture,
        transparent: true,
        opacity: 0.0
    });

    const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);

    // auto update mesh position with a debounce to avoid incorrect resizes
    updateMeshPosition(camera, bookMesh, bookX, bookY);
    window.addEventListener('resize', resizeDebounce(() => updateMeshPosition(camera, bookMesh, bookX, bookY), 50));

    return bookMesh;
}

// SHINY BOOK MESH
function createShinyBookMesh(loader: THREE.TextureLoader, camera: THREE.PerspectiveCamera) {
    const bookTexture = loader.load('/assets/minecraft/images/book.png');
    const bookGeometry = new THREE.PlaneGeometry(1, 1);

    // enchantment effect
    shinyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: bookTexture },
            time: { value: 0.0 },
            opacity: { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
    });

    shinyMaterial.needsUpdate = true;

    const bookMesh = new THREE.Mesh(bookGeometry, shinyMaterial);
    updateMeshPosition(camera, bookMesh, bookX, bookY);
    window.addEventListener('resize', resizeDebounce(() => updateMeshPosition(camera, bookMesh, bookX, bookY), 50));

    return bookMesh;
}

const visibleHeightAtZDepth = (depth: number, camera: { position: { z: any; }; fov: number; }) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
};

const visibleWidthAtZDepth = (depth: number, camera: { aspect: number; position: { z: any; }; fov: number; }) => {
    const height = visibleHeightAtZDepth(depth, camera);
    return height * camera.aspect;
};

// DYNAMIC POSITION UPDATING
function updateMeshPosition(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh, offsetX: number, offsetY: number) {
    // get window width and height in 3d space
    let windowWidth = visibleWidthAtZDepth(0, camera) / 4.45;
    let windowHeight = visibleHeightAtZDepth(0, camera) / 23;

    let bookPosX = windowWidth - offsetX;
    let bookPosY = -(windowHeight - offsetY);

    let scale = 0.25;

    // starting at fixed 950px to avoid scaling and positioning issues
    mesh.position.set(bookPosX, bookPosY, 0)

    mesh.scale.set(scale, scale, scale);
    bookPosition.set(mesh.position.x / 2, mesh.position.y / 2, 1);
}

// UPDATE SIZES
function updateSizes(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, tanFOV: number, windowHeight: number) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
}