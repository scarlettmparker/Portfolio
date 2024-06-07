import * as THREE from 'three';

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

export const titleMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
});

export const portfolioMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
});

export const vinylMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
});