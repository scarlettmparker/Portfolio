import * as THREE from 'three';
import { updateSizes } from './SceneUtils';
import { titleMaterial, portfolioMaterial, vinylMaterial } from './shaders/TextMeshes';
import { eventListeners } from '../index';

let vinylPlaying = true;
let vinylMesh: THREE.Object3D<THREE.Object3DEventMap>;
let audioMusic: THREE.Audio;
let audioBackground: THREE.Audio;
let camera: THREE.PerspectiveCamera;
let pausedRotation = 0;
let lastElapsedTime = 0;

let volumeMusic: number;
let volumeBackground: number;

const helper: React.FC = () => {
    return null;
};

export default helper;

export const setVolumeMusic = (value: number) => {
    volumeMusic = value;

    // dymamically update the audio
    if (audioMusic) {
        audioMusic.setVolume(volumeMusic / 100);
    }
};

export const setVolumeBackground = (value: number) => {
    volumeBackground = value;

    if (audioBackground) {
        audioBackground.setVolume(volumeBackground / 50);
    }
};

// SCENE RENDERER
export function renderScene(loader: THREE.TextureLoader, scene: THREE.Scene, sizes: { width: any; height: any; }, perspectiveCamera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    const [titleMesh, portfolioMesh, vinyl] = createTextMeshes(loader); // title and other images
    vinylMesh = vinyl;
    scene.add(titleMesh, portfolioMesh, vinylMesh);

    // BACKGROUND
    loader.load('/assets/index/images/musicscene/background.png', function (texture) {
        scene.background = texture;
    });

    // LIGHT
    const pointLight = new THREE.PointLight(0xffffff, 0.1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // CAMERA
    camera = perspectiveCamera;
    scene.add(camera);

    // handle resizing event listener
    const handleResize = () => updateSizes(camera, renderer, sizes);
    window.addEventListener('resize', handleResize);
    eventListeners.push({ type: 'resize', listener: handleResize });

    // CLOCK
    const clock = new THREE.Clock();

    audioMusic = playMusic(scene, "coffee shop control.mp3");
    audioBackground = playMusic(scene, "ambience.mp3");

    // set volume to default slider values
    audioMusic.setVolume(volumeMusic / 100);
    audioBackground.setVolume(volumeBackground / 50);

    const handleVinylClick = (event: Event) => {
        const { clientX, clientY } = event as MouseEvent;
        onVinylClick({ clientX, clientY }, sizes);
    };

    window.addEventListener('click', handleVinylClick); // start and stop the vinyl
    eventListeners.push({ type: 'click', listener: handleVinylClick });

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // get previous rotation of vinyl player
        if (vinylPlaying) {
            vinylMesh.rotation.z = pausedRotation - (elapsedTime - lastElapsedTime);
        } else {
            pausedRotation = vinylMesh.rotation.z;
            lastElapsedTime = elapsedTime;
        }

        window.requestAnimationFrame(tick);
        renderer.render(scene, camera);
    };

    tick();
}

// TEXTURE PATHS
const TEXTURE_PATHS = {
    title: '/assets/index/images/musicscene/title.png',
    portfolio: '/assets/index/images/musicscene/personalportfolio.png',
    vinyl: '/assets/index/images/musicscene/vinyl.png',
};

// MESH SIZES
const MESH_SIZES = {
    title: [618, 100],
    portfolio: [669, 26],
    vinyl: [337, 337],
};

// SCALE FACTOR
const SCALE_FACTOR = 600;

// CREATE PLANE GEOMETRY
function createPlaneGeometry(size: number[], scale: number) {
    return new THREE.PlaneGeometry(size[0] / scale, size[1] / scale);
}

// TEXT MESHES
function createTextMeshes(loader: THREE.TextureLoader) {
    // create geometries
    const titleGeometry = createPlaneGeometry(MESH_SIZES.title, SCALE_FACTOR);
    const portfolioGeometry = createPlaneGeometry(MESH_SIZES.portfolio, SCALE_FACTOR);
    const vinylGeometry = createPlaneGeometry(MESH_SIZES.vinyl, SCALE_FACTOR);

    // load texture files for the text meshes
    titleMaterial.map = loader.load(TEXTURE_PATHS.title);
    portfolioMaterial.map = loader.load(TEXTURE_PATHS.portfolio);
    vinylMaterial.map = loader.load(TEXTURE_PATHS.vinyl);

    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    const portfolioMesh = new THREE.Mesh(portfolioGeometry, portfolioMaterial);
    const vinylMesh = new THREE.Mesh(vinylGeometry, vinylMaterial);

    // update position and scale
    function updateMeshPositionsAndScales() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const shiftFactor = (1 - aspectRatio) * 7 / 9;

        // position update based on aspect ratio
        if (aspectRatio > 1) {
            titleMesh.position.set(shiftFactor, 1.325, 0);
            portfolioMesh.position.set(shiftFactor, 1.175, 0);
            vinylMesh.position.set(-shiftFactor, 0.4, 0);
        } else {
            titleMesh.position.set(0, 1.325, 0);
            portfolioMesh.position.set(0, 1.175, 0);
            vinylMesh.position.set(0, 0.4, 0);
        }

        // scale update based on aspect ratio
        if (aspectRatio > 0.727) {
            titleMesh.scale.set(1, 1, 1);
            portfolioMesh.scale.set(1, 1, 1);
        } else if (aspectRatio > 0.587) {
            titleMesh.scale.set(0.8, 0.8, 0.8);
            portfolioMesh.scale.set(0.8, 0.8, 0.8);
            portfolioMesh.position.set(0, 1.215, 0);
            vinylMesh.position.set(0, 0.7, 0);
        } else {
            titleMesh.scale.set(0.6, 0.6, 0.6);
            titleMesh.position.set(0, 1.125, 0);
            portfolioMesh.scale.set(0, 0, 0);
            vinylMesh.position.set(0, 0.7, 0);
        }
    }

    // initial update and event listener setup
    updateMeshPositionsAndScales();
    window.addEventListener('resize', updateMeshPositionsAndScales);
    eventListeners.push({ type: 'resize', listener: updateMeshPositionsAndScales });

    // set render order
    titleMesh.renderOrder = 1;
    portfolioMesh.renderOrder = 1;
    vinylMesh.renderOrder = 1;

    return [titleMesh, portfolioMesh, vinylMesh];
}

// BACKGROUND MUSIC PLAYER
function playMusic(scene: THREE.Scene, audioFile: string) {
    let stream = `/assets/index/audio/${audioFile}`;

    // create an audio listener for the song
    let audioLoader = new THREE.AudioLoader();
    let listener = new THREE.AudioListener();
    let audio = new THREE.Audio(listener);

    audioLoader.load(stream, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });

    // add the audio to the scene
    scene.add(audio);

    // return an object with the audio and a method to set its volume
    return audio;
}

// HANDLE VINYL CLICK
function onVinylClick(event: { clientX: number; clientY: number; }, sizes: { width: any; height: any; }) {
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    // calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -((event.clientY / sizes.height) * 2 - 1);

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(vinylMesh);
    if (intersects.length > 0) {
        toggleVinyl();
    }
}

// TOGGLE VINYL STATE
function toggleVinyl() {
    const audioLoader = new THREE.AudioLoader();
    const scratchSound = new THREE.Audio(new THREE.AudioListener());

    audioLoader.load('/assets/index/audio/recordscratch.mp3', function (buffer) {
        scratchSound.setBuffer(buffer);
        scratchSound.setVolume(0.075);
        if (!vinylPlaying) {
            scratchSound.play();
        }
    });

    if (vinylPlaying) {
        vinylPlaying = false;
        audioMusic.pause();
        audioBackground.pause();
    } else {
        vinylPlaying = true;
        audioMusic.play();
        audioBackground.play();
    }
}