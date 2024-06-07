import * as THREE from 'three';

let animationId: number;

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

export function stopAnimationLoop() {
    cancelAnimationFrame(animationId);
}

export function startAnimationLoop(tick: () => void) {
    animationId = requestAnimationFrame(tick);
}

export function cleanUpScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, eventListeners: { type: string, listener: EventListenerOrEventListenerObject }[]) {
    stopAnimationLoop();

    if (renderer) {
        renderer.dispose();
    }

    // dispose of all the objects in the scene
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
                object.material.forEach((material) => {
                    // dispose of textures
                    if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial) {
                        material.map?.dispose();
                        material.lightMap?.dispose();
                        material.aoMap?.dispose();
                        material.alphaMap?.dispose();
                        material.envMap?.dispose();
                    }
                    material.dispose();
                });
            } else {
                object.material.dispose();
            }
        } else if (object instanceof THREE.Audio) {
            object.stop();
            object.disconnect();
        }
    });

    // remove any event listeners
    eventListeners.forEach(({ type, listener }) => {
        window.removeEventListener(type, listener);
    });

    // remove renderer's dom element or whatever its called
    const sceneWrapper = document.getElementById('sceneWrapper');
    if (sceneWrapper && sceneWrapper.firstChild) {
        sceneWrapper.removeChild(sceneWrapper.firstChild);
    }
}