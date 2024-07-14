import styles from './styles/index.module.css';
import infostyles from './styles/info.module.css';
import ReactDOM from 'react-dom';
import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { renderScene } from './threescene';
import { getUUID, checkUUIDExists, getSkin, getGalleryCount, getTaskData, getPlayerData } from "./utils";
import { playBackground } from './musicutils';
import { drawSkin } from './skinutils';
import { GalleryButton, TaskButton, PlayerButton } from './arrowbutton';
import * as THREE from 'three';
import './styles/global.css';
import React from 'react';

// GLOBAL VARIABLES
let renderer: THREE.WebGLRenderer;
let fetchedTaskData: Task[] = [];
let fetchedPlayerData: Player[] = [];

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
            {selectedID == "4" && <PlayerSection />}
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
                Secret Life was made possible through a custom Minecraft plugin that was developed for the event.<br /><br />
                The Secret Life plugin was used to manage <span id="lifeText" className={infostyles.lifeText}>lives</span>, distribute tasks,
                gather player data and house a variety of other custom features that can be found on the <a href={gitLink} target="_blank"><span className={infostyles.gitLink}>GitHub repository</span></a>.<br /><br />
                Developed in Java over the course of a few weeks, this plugin can be used on any 1.20+ Minecraft server that supports Spigot plugins.<br /><br />
                <span className={infostyles.supportText}>Support will <span className={infostyles.redText}>not be provided</span> for other Minecraft versions.</span>
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
                    <div className={infostyles.backgroundCover}>h</div>
                </>,
                document.body // renders on top of everything else
            ) : (
                <div className={infostyles.galleryWrapper}>
                    <GalleryButton
                        direction="left"
                        rotation={90}
                        current={currentImage}
                        setCurrent={setCurrentImage}
                        number={numberImages}
                    />
                    <GalleryButton
                        direction="right"
                        rotation={270}
                        current={currentImage}
                        setCurrent={setCurrentImage}
                        number={numberImages}
                    />
                    <div className={infostyles.galleryImageWrapper} onClick={toggleHDImage}>
                        <img
                            src={`/assets/minecraft/images/gallery/small/${currentImage}.png`}
                            alt="Gallery Image"
                            width={540}
                            height={300}
                            className={infostyles.galleryImage}
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

const difficultyColorMapping: { [key: number]: string } = {
    0: '#28c878',
    1: '#e0a526',
    2: '#c82843',
    3: '#2861c9',
};

// task section in the plugin info
const TaskSection = () => {
    const [taskData, setTaskData] = useState<Task[] | null>(null);
    const [currentTask, setCurrentTask] = useState(0);

    // map difficulty number to string
    const difficultyMap: { [key: number]: string } = {
        0: "Normal",
        1: "Hard",
        2: "Red",
        3: "Shiny"
    };

    const rewardMap: { [key: number]: string } = {
        0: "6",
        1: "17",
        2: "3",
        3: "9"
    };

    // fetch task data from the API
    useEffect(() => {
        const fetchTaskData = async () => {
            const data: { [key: string]: Task } = await getTaskData(6);
            const taskArray: Task[] = Object.values(data);
            fetchedTaskData = taskArray;
            setTaskData(taskArray);
            setCurrentTask(0);
        };
        if (fetchedTaskData.length == 0) {
            fetchTaskData();
        } else {
            setTaskData(fetchedTaskData);
        }
    }, []);

    return (
        <div className={infostyles.taskWrapper}>
            {taskData ? (
                <>
                    <div className={infostyles.taskLeftWrapper}>
                        <TaskButton
                            direction="left"
                            rotation={90}
                            current={currentTask}
                            setCurrent={setCurrentTask}
                            number={taskData.length}
                        />
                    </div>
                    <div className={infostyles.taskRightWrapper}>
                        <TaskButton
                            direction="right"
                            rotation={270}
                            current={currentTask}
                            setCurrent={setCurrentTask}
                            number={taskData.length}
                        />
                    </div>
                    <span className={infostyles.taskDescription}>
                        Task Name: {taskData[currentTask].name}<br />
                        Task Difficulty: <span style={{ color: difficultyColorMapping[taskData[currentTask].difficulty] }}>
                            {difficultyMap[taskData[currentTask].difficulty]}</span><br /><br />
                        Task Description: {taskData[currentTask].description}<br /><br />
                        Reward: <span style={{ color: "#e0a526" }}>
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

interface Death {
    time: number;
    deathMessage: string;
}

interface Player {
    name: string;
    lives: number[];
    deaths: Death[];
    tasks: Task[];
    tokens: number[];
};

function unixToDate(unix: number) {
    return new Date(unix * 1000).toLocaleString();
}

const PlayerSection = () => {
    const [playerData, setPlayerData] = useState<Player[] | null>(null);
    const [taskData, setTaskData] = useState<Task[] | null>(null);

    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [currentDeathIndex, setCurrentDeathIndex] = useState(0);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    // get player data from the api
    useEffect(() => {
        const fetchPlayerData = async () => {
            const data: { [key: string]: Player } = await getPlayerData();
            const playerArray: Player[] = Object.values(data);
            setPlayerData(playerArray);
            setCurrentPlayer(0);
        };

        const fetchTaskData = async () => {
            const data: { [key: string]: Task } = await getTaskData(6);
            const taskArray: Task[] = Object.values(data);
            setTaskData(taskArray);
        };

        // if task/player data is already locally stored, use that instead of fetching
        fetchedTaskData.length === 0 ? fetchTaskData() : setTaskData(fetchedTaskData);
        fetchedPlayerData.length === 0 ? fetchPlayerData() : setPlayerData(fetchedPlayerData);
    }, []);

    let deaths: string | any[] = [];
    let tasks: string | any[] = [];

    // set deaths and tasks from player data
    if (playerData && playerData[currentPlayer]) {
        deaths = playerData[currentPlayer].deaths || [];
        tasks = playerData[currentPlayer].tasks || [];
    }

    // get current task and difficulty, use that to set colour
    const currentTask = taskData?.find(task => task.name === tasks[currentTaskIndex]);
    const taskText = currentTask ? tasks[currentTaskIndex] : "No task information available";
    const difficulty = currentTask ? currentTask.difficulty : undefined;
    const taskColor = difficulty !== undefined ? difficultyColorMapping[difficulty] : 'defaultColor';

    // handle change in task or death with the buttons
    const handleChange = (type: "death" | "task", direction: "prev" | "next") => {
        const index = type === "death" ? currentDeathIndex : currentTaskIndex;
        const length = type === "death" ? deaths.length : tasks.length;
    
        // change index based on direction
        const newIndex = direction === "prev" ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < length) {
            type === "death" ? setCurrentDeathIndex(newIndex) : setCurrentTaskIndex(newIndex);
        }
    };
    
    return (
        <div className={infostyles.playerDataWrapper}>
            {playerData ? (
                <>
                    <div className={infostyles.taskLeftWrapper}>
                        <PlayerButton
                            direction="left"
                            rotation={90}
                            current={currentPlayer}
                            setCurrent={setCurrentPlayer}
                            number={playerData.length}
                            onClick={() => {
                                setCurrentDeathIndex(0);
                                setCurrentTaskIndex(0);
                            }}
                        />
                    </div>
                    <div className={infostyles.taskRightWrapper}>
                        <PlayerButton
                            direction="right"
                            rotation={270}
                            current={currentPlayer}
                            setCurrent={setCurrentPlayer}
                            number={playerData.length}
                            onClick={() => {
                                setCurrentDeathIndex(0);
                                setCurrentTaskIndex(0);
                            }}
                        />
                    </div>
                    <span className={infostyles.playerDataDescription}>
                        <div style={{ display: 'flex', alignItems: 'center', width: "100%" }}>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <strong>{playerData[currentPlayer].name}</strong>
                            </div>
                        </div>
                        {deaths.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-start', width: "100%", marginTop: '10px' }}>
                                    <button onClick={() => handleChange("death", "prev")} disabled={currentDeathIndex === 0} style={{ marginRight: '10px' }}>
                                        {"<"}
                                    </button>
                                    <div style={{ flex: 1, textAlign: 'center', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                                        <div style={{ minHeight: '1.2em', textAlign: 'center' }}>
                                            {deaths[currentDeathIndex].deathMessage || "No death information available"}
                                        </div>
                                    </div>
                                    <button onClick={() => handleChange("death", "next")} disabled={currentDeathIndex === deaths.length - 1} style={{ marginLeft: '10px' }}>
                                        {">"}
                                    </button>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    {unixToDate(deaths[currentDeathIndex].time)}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', width: "100%", marginTop: '10px' }}>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    No deaths recorded
                                </div>
                            </div>
                        )}
                        <br />
                        Life History: {playerData[currentPlayer].lives.join("  -  ")}<br />
                        Token History: {playerData[currentPlayer].tokens.join("  -  ")}<br /><br />
    
                        {/* Tasks Section */}
                        {tasks.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-start', width: "100%" }}>
                                    <button onClick={() => handleChange("task", "prev")} disabled={currentTaskIndex === 0} style={{ marginRight: '10px' }}>
                                        {"<"}
                                    </button>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <strong>Task: </strong>
                                        <span style={{ color: taskColor }}>
                                            {taskText}
                                        </span>
                                        <div className={infostyles.playerTaskDescriptionWrapper} style={{
                                        }}>
                                            {currentTask?.description || "No description available"}
                                        </div>
                                    </div>
                                    <button onClick={() => handleChange("task", "next")} disabled={currentTaskIndex === tasks.length - 1} style={{ marginLeft: '10px' }}>
                                        {">"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div>No tasks recorded</div>
                        )}
                    </span>
                </>
            ) : (
                <span className={infostyles.playerDataDescription}>Loading...</span>
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

    // fake resize event dispatch because spaghetti code
    let resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
}