import { createCamera, createRenderer } from '../index/SceneUtils';
import { startAnimationLoop } from '../index/SceneCleanup';
import { vertexShader, fragmentShader } from './shaders/bookshader';
import { manageWhispers, stopWhispers} from './musicutils';
import * as THREE from 'three';

let fadeInterrupt = false;
let enchantmentGraphics: string[] = [];
let lastResetTimes: number[] = [];
let currentlyOnBook: boolean = false;
let mouseParticles: THREE.Group<THREE.Object3DEventMap>;
let extraMouseParticles: THREE.Group<THREE.Object3DEventMap>;
let shinyMaterial: THREE.ShaderMaterial;
let bookPosition: THREE.Vector3 = new THREE.Vector3();
let tanFOV: number, windowHeight: number;
let bookX = 0.25, bookY = 0;

const helper: React.FC = () => {
    return null;
};
  
export default helper;

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

// RENDER SCENE
export function renderScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    // WINDOW SIZES
    const sizes = {
        width: window.innerWidth,
        height: 950,
    };

    // RENDERER
    renderer = createRenderer(sizes, "#000000", 0);
    splitEnchantmentImage();

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
        if (mouse.x && mouse.y) {
            mousePosition.set(mouse.x, mouse.y, 0.8);
            mousePosition.unproject(camera);
        }
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
        if (mousePosition.x && mousePosition.y && mouse.x && mouse.y) {
            intersects = raycaster.intersectObjects(scene.children);
        }

        const hdImageWrapper = document.getElementById('hdImageWrapper') as HTMLElement;
        currentlyOnBook = false;
        fadeInterrupt = false;

        if (intersects) {
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object === bookMesh && mouse.x && mouse.y) {
                    // ensure effects don't happen while images are full screened
                    if (hdImageWrapper && hdImageWrapper.style.display == 'block'
                        || !mousePosition.x || !mousePosition.y) {
                        break;
                    }
                    currentlyOnBook = true;
                    // mouse is on the book for first time
                    if (!mouseOnBook) {
                        // remove mouse particles just in case
                        scene.remove(mouseParticles);
                        scene.remove(extraMouseParticles);

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
        if (scene.getObjectByName('mouseParticles') && mousePosition.x != 0
            && mousePosition.y != 0 && currentlyOnBook && mouseOnBook) {
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