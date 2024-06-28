import * as THREE from 'three';

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

// UPDATE SIZES
export function updateSizes(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, sizes: { width: any; height: any; }) {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight * 2;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// CAMERA
export function createCamera(sizes: { width: any; height: any; }) {
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 2);
    return camera;
}

// RENDERER
export function createRenderer(sizes: { width: any; height: any; }, backgroundColor: string, transparent: number = 1) {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });

    // set the renderer size and pixel ratio
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(backgroundColor), transparent);

    renderer.state.buffers.stencil.setTest(true);

    return renderer;
}