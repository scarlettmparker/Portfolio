import * as THREE from 'three';

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

export const mouseMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
    attribute float size;
    void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
    `,
    fragmentShader: `
        void main() {
            vec2 coords = 2.0 * gl_PointCoord - 1.0;
            float len = length(coords);
            if (len > 1.0) {
                discard;
            }
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 * (1.0 - len));
        }
    `,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneMinusDstColorFactor, // invert the colours
    blendDst: THREE.ZeroFactor,
});