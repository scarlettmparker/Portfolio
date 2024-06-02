import * as THREE from 'three';
import { updateSizes } from './SceneUtils';

let audio;

// SCENE RENDERER
export function renderScene(loader: THREE.TextureLoader, scene: THREE.Scene, sizes: { width: any; height: any; },
        camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    const pointLight = new THREE.PointLight(0xffffff, 0.1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // currently does not do much
    window.addEventListener('resize', () => {
        updateSizes(camera, renderer, sizes);
    });

    scene.add(camera);
    const clock = new THREE.Clock();

    playMusic(scene);

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        window.requestAnimationFrame(tick);
        renderer.render(scene, camera);
    };
    tick();
}

// BACKGROUND MUSIC PLAYER
function playMusic(scene: THREE.Scene) {
    let stream = "/assets/index/audio/coffee shop control.mp3";

    // create an audio listener for the song
    let audioLoader = new THREE.AudioLoader();
    let listener = new THREE.AudioListener();
    let audio = new THREE.Audio(listener);
    
    audioLoader.load(stream, function(buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.setVolume(0.5);
        audio.play();
    });

    // add the audio to the scene
    scene.add(audio);
    return audio;
}