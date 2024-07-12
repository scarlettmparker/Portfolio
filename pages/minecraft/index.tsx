import styles from './styles/index.module.css';
import infostyles from './styles/info.module.css';
import ReactDOM from 'react-dom';
import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { renderScene } from './threescene';
import { getUUID, checkUUIDExists, getSkin, getGalleryCount, getTaskData } from "./utils";
import { playBackground } from './musicutils';
import { drawSkin } from './skinutils';
import { GalleryButton, TaskButton } from './arrowbutton';
import * as THREE from 'three';
import './styles/global.css';
import React from 'react';

// GLOBAL VARIABLES
let enchantmentGraphics: string[] = [];
let renderer: THREE.WebGLRenderer;

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

                    if (ctx2 && data) {
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
            {(isExpanded && infoType == 0) && (
                <ExtraPluginInfoSection selectedID={selectedID} handleSelect={handleSelect}
                    currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
            )}
            {(isExpanded && infoType == 1) && (
                <div className={infostyles.temporaryWrapper}>
                    { /* Under construction. */}
                </div>
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
            {selectedID == "3" && <TaskSection />}
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

function returnTaskData(session: number) {
    const taskData = getTaskData(session);
    return taskData;
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
                    <GalleryButton direction="left" rotation={90} currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
                    <GalleryButton direction="right" rotation={270} currentImage={currentImage} setCurrentImage={setCurrentImage} numberImages={numberImages} />
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

// task type based on the json data
interface Task {
    name: string;
    completed: boolean;
    playerDescription: string;
    receiver: string;
    excluded: boolean;
    difficulty: number;
    description: string;
    reward?: number;
    priority?: number;
}

const TaskSection = () => {
    const [taskData, setTaskData] = useState<Task[] | null>(null);
    const [currentTask, setCurrentTask] = useState(0);

    const difficultyMap: {[key: number]: string} = {
        0: "Normal",
        1: "Hard",
        2: "Red",
        3: "Shiny"
    };

    const rewardMap: {[key: number]: string} = {
        0: "6",
        1: "17",
        2: "3",
        3: "9"
    };

    const difficultyColorMapping: {[key: number]: string} = {
        0: '#28C878',
        1: '#e0a526',
        2: '#C82843',
        3: '#2861c9',
    };

    // fetch task data from the API
    useEffect(() => {
        const fetchTaskData = async () => {
            const data: { [key: string]: Task } = await returnTaskData(6);
            const taskArray: Task[] = Object.values(data);
            setTaskData(taskArray);
            setCurrentTask(0);
        };
        fetchTaskData();
    }, []);

    return (
        <div className={infostyles.taskWrapper}>
            {taskData ? (
                <>
                    <div className={infostyles.taskLeftWrapper}>
                        <TaskButton
                            direction="left"
                            rotation={90}
                            currentTask={currentTask}
                            setCurrentTask={setCurrentTask}
                            numberTasks={taskData.length}
                        />
                    </div>
                    <div className={infostyles.taskRightWrapper}>
                        <TaskButton
                            direction="right"
                            rotation={270}
                            currentTask={currentTask}
                            setCurrentTask={setCurrentTask}
                            numberTasks={taskData.length}
                        />
                    </div>
                    <span className={infostyles.taskDescription}>
                        Task Name: {taskData[currentTask].name}<br />
                        Task Difficulty: <span style={{color: difficultyColorMapping[taskData[currentTask].difficulty]}}>
                            {difficultyMap[taskData[currentTask].difficulty]}</span><br /><br />
                        Task Description: {taskData[currentTask].description}<br /><br />
                        Reward: <span style={{color: "#e0a526"}}>
                            {taskData[currentTask].reward !== undefined 
                                ? taskData[currentTask].reward + " tokens" 
                                : rewardMap[taskData[currentTask].difficulty] + " tokens"}
                        </span><br />
                    </span>
                </>
            ) : (
                <span className={infostyles.taskDescription}>Loading...</span>
            )}
        </div>
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
                                        infoText="Across the sessions, player data was gathered through the plugin. Once the server ends, this data will be processed. This data will be found below once processed."
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