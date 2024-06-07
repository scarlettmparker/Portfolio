import * as THREE from 'three';
import Image  from 'next/image';
import { useEffect, useState } from 'react';
import { renderScene as renderSpiderScene } from './index/SpiderScene';
import { renderScene as renderMusicScene } from './index/MusicScene';
import { createCamera, createRenderer } from './index/SceneUtils';
import { setVolumeMusic, setVolumeBackground } from './index/MusicScene';
import { ArrowButton } from './index/ArrowButton';
import { cleanUpScene } from './index/SceneCleanup';
import styles from './index/styles/index.module.css';
import musicStyles from './index/styles/music.module.css';
import './styles/global.css';

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let currentScene: number;
let scenes: { [key: number]: string } = {
    1: "#090f0f",
    2: "#ffffff"
};

const eventListeners: { type: string; listener: EventListenerOrEventListenerObject; }[] = [];

export default function Home() {
    let defaultScene = 1;

    const [sceneID, setSceneID] = useState<number>(defaultScene);
    const [isHovered, setIsHovered] = useState(false);

    const [topSliderValue, setTopSliderValue] = useState("50");
    const [sideSliderValue, setSideSliderValue] = useState("50");
    
    const init = async () => {
        createScene(defaultScene, setSceneID);
    };

    useEffect(() => {
        init();
        loadPage();
    }, []);

    // change volume when sliders are moved
    useEffect(() => {
        setVolumeMusic(parseInt(topSliderValue));
        setVolumeBackground(parseInt(sideSliderValue));
    }, [topSliderValue, sideSliderValue]);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = (event: React.MouseEvent) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
            setIsHovered(false);
        }
    };

    // boring html stuff
    return (
        <>
            <div className={styles.htmlWrapper}>
                <ArrowButton wrapperStyle={styles.buttonWrapperDown} buttonStyle={styles.downButton}
                        onClick={() => movePage('down')} altText="Down Arrow" rotation={0} />
                <ArrowButton wrapperStyle={styles.buttonWrapperUp} buttonStyle={styles.upButton}
                        onClick={() => movePage('up')} altText="Up Arrow" rotation={180} />
                <ArrowButton wrapperStyle={styles.buttonWrapperRight} buttonStyle={styles.rightButton}
                        onClick={() => changeScene(currentScene + 1, setSceneID)} altText="Right Arrow" rotation={270} />
                <ArrowButton wrapperStyle={styles.buttonWrapperLeft} buttonStyle={styles.leftButton}
                        onClick={() => changeScene(currentScene - 1, setSceneID)} altText="Left Arrow" rotation={90} />
                <div className={styles.contentWrapper}>
                    {sceneID === 2 && (
                        <div className={musicStyles.volumeWrapper}
                                onMouseEnter={handleMouseEnter} 
                                onMouseLeave={handleMouseLeave}>
                            <button className={musicStyles.volumeButton} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Image src="/assets/index/images/musicscene/volume.png" width={30} height={30} alt="Volume"></Image>
                            </button>
                            <div className={isHovered ? musicStyles.volumeSliderTopWrapperActive : musicStyles.volumeSliderTopWrapper}>
                            <input type="range" min="0" max="100" value={topSliderValue} 
                                    onChange={(e) => setTopSliderValue(e.target.value)} 
                                    className={isHovered ? musicStyles.volumeSliderTopActive : musicStyles.volumeSliderTop} />
                            </div>
                            <div className={isHovered ? musicStyles.volumeSliderSideWrapperActive : musicStyles.volumeSliderSideWrapper}>
                            <input type="range" min="0" max="100" value={sideSliderValue} 
                                    onChange={(e) => setSideSliderValue(e.target.value)} 
                                    className={isHovered ? musicStyles.volumeSliderSideActive : musicStyles.volumeSliderSide} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.threeJsWrapper}>
                <div id="sceneWrapper" className={styles.sceneWrapper}></div>
            </div>
        </>
    );
}

function createScene(sceneID: number, setSceneID: React.Dispatch<React.SetStateAction<number>>) {
    setSceneID(sceneID);
    currentScene = sceneID;

    // create new scene
    const loader = new THREE.TextureLoader();
    scene = new THREE.Scene();

    // WINDOW SIZES
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight * 2,
    };

    // RENDERER
    renderer = createRenderer(sizes, scenes[sceneID]);
    const camera = createCamera(sizes);

    switch (sceneID) {
        case 1:
            renderSpiderScene(loader, scene, sizes, camera, renderer);
            break;
        case 2:
            renderMusicScene(loader, scene, sizes, camera, renderer);
            break;
        default:
            console.log("Invalid sceneID");
            console.log(sceneID);
    }

    // Append renderer to the DOM
    const wrapper = document.getElementById('sceneWrapper');
    if (wrapper && wrapper.firstChild) {
        wrapper.removeChild(wrapper.firstChild);
    }
    wrapper?.appendChild(renderer.domElement);
}

async function changeScene(sceneID: number, setSceneID: React.Dispatch<React.SetStateAction<number>>) {
    setSceneID(sceneID);
    currentScene = sceneID;

    // cleanup current scene before changing to the new scene
    cleanUpScene(scene, renderer, eventListeners);
    // load new scene
    createScene(sceneID, setSceneID);
    manageButtons(sceneID);
}

// MANAGE BUTTONS
function manageButtons(sceneID: number) {
    function toggleButtonDisplay(buttonClass: string, display: string) {
        const button = document.getElementsByClassName(buttonClass)[0] as HTMLElement;
        button.style.display = display;
    }

    const sceneKeys = Object.keys(scenes).map(Number);
    if (sceneID == sceneKeys[0]) {
        // hide the left button and show the right button
        toggleButtonDisplay(styles.leftButton, 'none');
        toggleButtonDisplay(styles.rightButton, 'block');
    } else if (sceneID == sceneKeys[sceneKeys.length - 1]) {
        // hide the right button and show the left button
        toggleButtonDisplay(styles.rightButton, 'none');
        toggleButtonDisplay(styles.leftButton, 'block');
    }
}

// SCROLLING FUNCTION
function movePage(direction: 'up' | 'down') {
    const isMovingUp = direction === 'up';
    const scrollPosition = isMovingUp ? 0 : window.innerHeight;

    // determine which button to hide and which to show
    const buttonToHide = isMovingUp ? styles.upButton : styles.downButton;
    const buttonToShow = isMovingUp ? styles.downButton : styles.upButton;

    window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
    });

    // hide the button that was clicked and show the other one after 250ms
    setTimeout(() => {
        const buttonHide = document.getElementsByClassName(buttonToHide)[0] as HTMLElement;
        buttonHide.style.display = 'none';

        const buttonShow = document.getElementsByClassName(buttonToShow)[0] as HTMLElement;
        buttonShow.style.display = 'block';
    }, 250);
}

// HANDLE PAGE LOADING
function loadPage() {
    const handleLoad = () => {
        window.scrollTo({
            top: 0,
        });

        // hide the up button
        const upButton = document.getElementsByClassName(styles.upButton)[0] as HTMLElement;
        upButton.style.display = 'none';
    };

    // if document is already loaded, call the function directly
    if (document.readyState === 'complete') {
        handleLoad();
    } else {
        window.onload = handleLoad;
    }
}