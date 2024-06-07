import * as THREE from 'three';
import { updateSizes } from './SceneUtils';
import { startAnimationLoop } from './SceneCleanup';
import { mouseMaterial } from './shaders/MouseParticles';
import { titleMaterial, portfolioMaterial } from './shaders/TextMeshes';
import { eventListeners } from '../index';

let isMouseDown = false;
let lastResetTimes: number[] = [];
let mouseParticles: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>,
THREE.ShaderMaterial, THREE.Object3DEventMap>;

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

// SCENE RENDERER
export function renderScene(loader: THREE.TextureLoader, scene: THREE.Scene, sizes: { width: any; height: any; }, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    const particlesMesh = createParticles(loader, 9500, -1, 0); // particles behind the images
    const particlesMeshTop = createParticles(loader, 1500, 1, 2); // particles in front of the images
    const [titleMesh, portfolioMesh] = createTextMeshes(loader); // title and other images

    scene.add(titleMesh, portfolioMesh, particlesMesh, particlesMeshTop);

    // LIGHT
    const pointLight = new THREE.PointLight(0xffffff, 0.1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // CLOCK
    const clock = new THREE.Clock();

    // handle resizing event listener
    const handleResize = () => updateSizes(camera, renderer, sizes);
    window.addEventListener('resize', handleResize);
    eventListeners.push({ type: 'resize', listener: handleResize });
    
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
    eventListeners.push({ type: 'mousemove', listener: handleMouseMove });

    // handle touch movement
    const handleTouchMove: EventListener = (event: Event) => {
        const touchEvent = event as TouchEvent;
        const touch = touchEvent.touches[0];
        isMouseDown = true;
        if (touch) {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            mousePosition.set(mouse.x, mouse.y, 0.8);
            mousePosition.unproject(camera);
        }
    };

    // add the event listener with options to ensure it's not passive
    window.addEventListener('touchmove', handleTouchMove);
    eventListeners.push({ type: 'touchmove', listener: handleTouchMove });

    const handleTouchEnd = () => {
        isMouseDown = false;
    };
    
    // add the event listener for touch end
    window.addEventListener('touchend', handleTouchEnd);
    eventListeners.push({ type: 'touchend', listener: handleTouchEnd });

    // handle mouse click
    const handleMouseDown: EventListener = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        // if holding left click down
        if (mouseEvent.button === 0) {
            isMouseDown = true;
            if (!scene.getObjectByName('mouseParticles')) {
                mouseParticles = createMouseParticles(mousePosition);
                scene.add(mouseParticles);
                mouseParticles.name = 'mouseParticles';
            }
        }
    };

    window.addEventListener('mousedown', handleMouseDown);
    eventListeners.push({ type: 'mousedown', listener: handleMouseDown });

    // handle left click mouse release
    const handleMouseUp: EventListener = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        if (mouseEvent.button === 0) {
            isMouseDown = false;
        }
    };

    window.addEventListener('mouseup', handleMouseUp);
    eventListeners.push({ type: 'mouseup', listener: handleMouseUp });

    // RENDER LOOP
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        renderer.clearStencil();

        particlesMesh.rotation.y = -0.05 * elapsedTime;
        particlesMeshTop.rotation.y = 0.05 * elapsedTime;

        // ensure mouse particles exist before attempting to update them
        if (scene.getObjectByName('mouseParticles')) {
            updateMouseParticles(mouseParticles, mousePosition);
        }

        renderer.render(scene, camera);

        renderer.state.buffers.stencil.setFunc(THREE.EqualStencilFunc, 1, 0xFF);
        renderer.state.buffers.stencil.setOp(THREE.ReplaceStencilOp, THREE.ReplaceStencilOp, THREE.ReplaceStencilOp);
        renderer.render(scene, camera);

        renderer.state.buffers.stencil.setFunc(THREE.AlwaysStencilFunc, 0, 0xFF);
        renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp);

        startAnimationLoop(tick);
    };

    startAnimationLoop(tick);
}


// SET PARTICLE POSITION
function setParticlePosition(particle: THREE.Vector3, mousePosition: THREE.Vector2Like,
    currentTime: number, i: number, radius = 0.15) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    // set x and y pos based on circle and mouse pos
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
    const movementSpeed = 0.015;

    // loop through all the particles
    for (let i = 0; i < mouseParticles.geometry.attributes.position.count; i++) {
        const particle = new THREE.Vector3(
            // get the x, y, z position of the particle
            mouseParticles.geometry.attributes.position.array[i * 3],
            mouseParticles.geometry.attributes.position.array[i * 3 + 1],
            mouseParticles.geometry.attributes.position.array[i * 3 + 2]
        );

        // particles move towards the mouse, change movementSpeed for faster/slower movement
        const direction = new THREE.Vector2(mousePosition.x - particle.x, mousePosition.y - particle.y);
        direction.setLength(movementSpeed);

        particle.add(new THREE.Vector3(direction.x, direction.y, 0));
        const particle2D = new THREE.Vector2(particle.x, particle.y);

        // if the particle is close to the mouse, reset to random position in radius around mouse for continuous movement
        if (particle2D.distanceTo(mousePosition) < 0.0125 || currentTime - lastResetTimes[i] > 150) {
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
function createMouseParticles(mousePosition: THREE.Vector2Like, particleCount = 50) {
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
    return particleMesh;
}

// MOVING BACKGROUND PARTICLES
function createParticles(loader: THREE.TextureLoader, particleCount: number, zIndex: number, renderOrder: number) {
    // get hexagon texture and create an array of random positions for the particles
    const hexagon = loader.load('/assets/index/images/spiderscene/hexagon.png');
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

    const titleGeometry = new THREE.PlaneGeometry(titleSize[0] / 600, titleSize[1] / 600);
    const portfolioGeometry = new THREE.PlaneGeometry(portfolioSize[0] / 620, portfolioSize[1] / 620);

    // load the images for the graphics
    titleMaterial.map = loader.load('/assets/index/images/spiderscene/title.png');
    portfolioMaterial.map = loader.load('/assets/index/images/spiderscene/personalportfolio.png');

    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    const portfolioMesh = new THREE.Mesh(portfolioGeometry, portfolioMaterial);

    function updateMeshScales() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        if (aspectRatio > 1.02) {
            titleMesh.scale.set(1, 1, 1);
            portfolioMesh.scale.set(1, 1, 1);
            titleMesh.position.set(0, 0.95, 0);
            portfolioMesh.position.set(0, 0.625, 0); // not centered because i'm EVIL hahaha
        } else if (aspectRatio > 0.79) {
            titleMesh.scale.set(0.8, 0.8, 0.8);
            portfolioMesh.scale.set(0.8, 0.8, 0.8);
            titleMesh.position.set(0, 0.9, 0);
            portfolioMesh.position.set(0, 0.675, 0);
        } else if (aspectRatio > 0.6) {
            titleMesh.scale.set(0.6, 0.6, 0.6);
            portfolioMesh.scale.set(0.6, 0.6, 0.6);
            titleMesh.position.set(0, 1.25, 0);
            portfolioMesh.position.set(0, 1.075, 0);
        } else {
            titleMesh.scale.set(0.45, 0.45, 0.45);
            portfolioMesh.scale.set(0.45, 0.45, 0.45);
            portfolioMesh.position.set(0, 1.115, 0);
        }
    }

    updateMeshScales();
    window.addEventListener('resize', updateMeshScales);

    titleMesh.renderOrder = 0;
    portfolioMesh.renderOrder = 0;

    return [titleMesh, portfolioMesh];
}