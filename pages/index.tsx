import * as THREE from 'three';
import { useEffect } from 'react';
import { mouseMaterial } from './shaders/MouseParticles.js';
import { titleMaterial, portfolioMaterial } from './shaders/TextMeshes.js';
import styles from './styles/index.module.css';
import './styles/global.css';

let isMouseDown = false;
let lastResetTimes: number[] = [];
let mouseParticles = [];

export default function Home() {
    const init = async () => {
        // TEXTURE LOADER
        const loader = new THREE.TextureLoader();
        const scene = new THREE.Scene();

        const particlesMesh = createParticles(loader, 9500, -1, 0); // particles behind the images
        const particlesMeshTop = createParticles(loader, 1500, 1, 2); // particles in front of the images
        const [titleMesh, portfolioMesh] = createTextMeshes(loader); // title and other images

        scene.add(titleMesh, portfolioMesh, particlesMesh, particlesMeshTop);

        // LIGHT
        const pointLight = new THREE.PointLight(0xffffff, 0.1);
        pointLight.position.set(2, 3, 4);
        scene.add(pointLight);

        // get screen size, TODO: change display depending on screen size
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // currently does not much
        window.addEventListener('resize', () => {
            updateSizes(camera, renderer, sizes);
        });

        // CAMERA
        const camera = createCamera(sizes);
        scene.add(camera);

        // RENDERER
        const renderer = createRenderer(sizes);
        const clock = new THREE.Clock();

        // MOUSE
        const mouse = new THREE.Vector2();
        let mousePosition = new THREE.Vector3();

        window.addEventListener('mousemove', (event) => {
            // get the mouse position in normalized device coordinates
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // update the mouse position, this is garbage
            mousePosition.set(mouse.x, mouse.y, 0.8); 
            mousePosition.unproject(camera);
        });

        window.addEventListener('mousedown', (event) => {
            // holding down left mouse button
            if (event.button === 0) {
                isMouseDown = true;
                // if scene has not added particle syet
                if (!scene.getObjectByName('mouseParticles')) {
                    scene.add(mouseParticles);
                    mouseParticles.name = 'mouseParticles';
                }
            }
        });

        // release left mouse button
        window.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                isMouseDown = false;
            }
        });

        const mouseParticles = createMouseParticles(mousePosition);

        // RENDER LOOP
        const tick = () => {
            const elapsedTime = clock.getElapsedTime();
            renderer.clearStencil();
        
            // update background mesh so it moves
            particlesMesh.rotation.y = -0.05 * elapsedTime;
            particlesMeshTop.rotation.y = 0.05 * elapsedTime;

            if (scene.getObjectByName('mouseParticles')) {
                updateMouseParticles(mouseParticles, mousePosition);
            }
        
            renderer.render(scene, camera);
        
            // render objects beneath the mouse cursor with inverted colors
            renderer.state.buffers.stencil.setFunc(THREE.EqualStencilFunc, 1, 0xFF);
            renderer.state.buffers.stencil.setOp(THREE.ReplaceStencilOp, THREE.ReplaceStencilOp, THREE.ReplaceStencilOp);
            renderer.render(scene, camera);
        
            // reset the stencil buffer
            renderer.state.buffers.stencil.setFunc(THREE.AlwaysStencilFunc, 0, 0xFF);
            renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp);
        
            window.requestAnimationFrame(tick);
        };

        tick();

        // append the canvas to the particleWrapper div
        const particleWrapper = document.getElementById('particleWrapper');
        particleWrapper?.appendChild(renderer.domElement);
    };

    useEffect(() => {
        init();
    }, []);

    // boring html stuff
    return (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
            <div className={styles.pageWrapper}>
                <div className={styles.titleWrapper}></div>
                <div id="particleWrapper" className={styles.particleWrapper}></div>
            </div>
        </>
    );
}

// SET PARTICLE POSITION
function setParticlePosition(particle: THREE.Vector3, mousePosition: THREE.Vector2Like, currentTime: number, i: number) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 0.4;
    const x = mousePosition.x + Math.cos(angle) * distance;
    const y = mousePosition.y + Math.sin(angle) * distance;

    // set position & reset timer if a particle is reset
    particle.set(x, y, 1);
    lastResetTimes[i] = currentTime;
}

// MOUSE PARTICLE MOVEMENT
function updateMouseParticles(mouseParticles: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.ShaderMaterial, THREE.Object3DEventMap>, mousePosition: THREE.Vector2Like) {
    const currentTime = Date.now();

    // loop through all the particles
    for (let i = 0; i < mouseParticles.geometry.attributes.position.count; i++) {
        const particle = new THREE.Vector3(
            // get the x, y, z position of the particle
            mouseParticles.geometry.attributes.position.array[i * 3],
            mouseParticles.geometry.attributes.position.array[i * 3 + 1],
            mouseParticles.geometry.attributes.position.array[i * 3 + 2]
        );

        // particles move towards the mouse, change 0.03 for faster/slower movement
        const direction = new THREE.Vector2(mousePosition.x - particle.x, mousePosition.y - particle.y);
        direction.setLength(0.03);

        particle.add(new THREE.Vector3(direction.x, direction.y, 0));
        const particle2D = new THREE.Vector2(particle.x, particle.y);

        // if the particle is close to the mouse, reset to random position in radius around mouse for continuous movement
        if (particle2D.distanceTo(mousePosition) < 0.025 || currentTime - lastResetTimes[i] > 150) {
            if (isMouseDown) {
                setParticlePosition(particle, mousePosition, currentTime, i);
            } else {
                particle.z = 2;
            }
        }

        // update the position of the particle
        mouseParticles.geometry.attributes.position.array[i * 3] = particle.x;
        mouseParticles.geometry.attributes.position.array[i * 3 + 1] = particle.y;
        mouseParticles.geometry.attributes.position.array[i * 3 + 2] = particle.z;
    }

    mouseParticles.geometry.attributes.position.needsUpdate = true;
}

// MOUSE PARTICLES
function createMouseParticles(mousePosition: THREE.Vector2Like, particleCount = 50, radius = 0.5) {
    const particles = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const currentTime = Date.now();

    // loop through all the particles and create them
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Vector3();
        setParticlePosition(particle, mousePosition, currentTime, i);

        // randomized size with lower bound
        const size = Math.random() * (0.2 - 0.05) + 0.05;
        positions.push(particle.x, particle.y, particle.z);
        sizes.push(size);
    }

    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particles.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // create the particle mesh and add particles
    const particleMesh = new THREE.Points(particles, mouseMaterial);
    mouseParticles.push(particleMesh);

    return particleMesh;
}

// MOVING BACKGROUND PARTICLES
function createParticles(loader: THREE.TextureLoader, particleCount: number, zIndex: number, renderOrder: number) {
    // get hexagon texture and create an array of random positions for the particles
    const hexagon = loader.load('/assets/index/images/hexagon.png');
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * (Math.random() * 10);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // arrays for range of colors for the particles
    const blueParticle = [72 / 255, 126 / 255, 141 / 255];
    const pinkParticle = [154 / 255, 72 / 255, 127 / 255];
    
    const colors = [];

    // create a gradient of colors for the particles
    for (let i = 0; i < particleCount; i++) {
        const t = Math.random();
        const color = blueParticle.map((blue, i) => blue + t * (pinkParticle[i] - blue));
        colors.push(...color);
    }

    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    // points material where texture is mapped and other fun stuff
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.01,
        map: hexagon,
        transparent: true,
        vertexColors: true,
        depthWrite: false, // prevent weird transparency issues
    });

    // create the particle mesh and set the correct position
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    particlesMesh.position.z = zIndex;
    particlesMesh.renderOrder = renderOrder;

    return particlesMesh;
}

// TEXT MESHES
function createTextMeshes(loader: THREE.TextureLoader) {
    // original image dimensions
    const titleSize = [904, 249];
    const portfolioSize = [877, 77];

    const titleGeometry = new THREE.PlaneGeometry(titleSize[0] / 300, titleSize[1] / 300);
    const portfolioGeometry = new THREE.PlaneGeometry(portfolioSize[0] / 320, portfolioSize[1] / 320);
    
    // load the images for the graphics
    titleMaterial.map = loader.load('/assets/index/images/title.png');
    portfolioMaterial.map = loader.load('/assets/index/images/personalportfolio.png');

    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    const portfolioMesh = new THREE.Mesh(portfolioGeometry, portfolioMaterial);

    titleMesh.position.set(0, 0.3, 0);
    portfolioMesh.position.set(0, -0.325, 0); // not overall center because i'm EVIL hahaha

    titleMesh.renderOrder = 0;
    portfolioMesh.renderOrder = 0;

    return [titleMesh, portfolioMesh];
}

// CAMERA
function createCamera(sizes: { width: any; height: any; }) {
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 2);
    return camera;
}

// RENDERER
function createRenderer(sizes: { width: any; height: any; }) {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });

    // set the renderer size and pixel ratio
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color('#090f0f'), 1);

    renderer.state.buffers.stencil.setTest(true);

    return renderer;
}

// UPDATE SIZES
function updateSizes(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, sizes: { width: any; height: any; }) {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}