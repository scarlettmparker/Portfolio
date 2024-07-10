import React from 'react';

const helper: React.FC = () => {
    return null;
};

export default helper;

// GLOBAL VARIABLES
let whispers: HTMLAudioElement;
let background: HTMLAudioElement;
let currentBackgroundTime: number = 0;
let whispersIntervalId: NodeJS.Timeout | undefined;
let globalVolume: number = 0.2;

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

if (typeof window !== 'undefined') {
    whispers = new Audio('/assets/minecraft/sound/the secrets.mp3');
}

// stop the whisper sound effect with a convolver node (reverb effect)
export function stopWhispers() {
    if (!audioContext) return;

    // create gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    const whispersSourceUrl = whispers.src;
    const whispersCurrentTime = whispers.currentTime;

    Promise.all([
        // fetch impulse response for the reverb sound effect
        fetch('/assets/minecraft/sound/impulse.wav').then(response => response.arrayBuffer()),
        fetch(whispersSourceUrl).then(response => response.arrayBuffer())
    ]).then(([impulseBuffer, whispersBuffer]) => {
        audioContext.decodeAudioData(impulseBuffer, (decodedImpulseData) => {
            audioContext.decodeAudioData(whispersBuffer, (decodedWhispersData) => {
                const whispersSource = audioContext.createBufferSource();
                whispersSource.buffer = decodedWhispersData;

                // create convolver node for impulse response
                const convolver = audioContext.createConvolver();
                convolver.buffer = decodedImpulseData;

                // connect nodes to play the audio
                whispersSource.connect(gainNode);
                gainNode.connect(convolver);
                convolver.connect(audioContext.destination);
                whispersSource.start(audioContext.currentTime, whispersCurrentTime);

                // pause whispers audio and resume background music
                fadeAudio(whispers, false).then(() => {
                    clearInterval(whispersIntervalId);
                    whispersSource.stop(audioContext.currentTime + 1);
                    background.currentTime = currentBackgroundTime;
                    fadeAudio(background, true);
                });

            }, (error) => console.error("Error decoding whispers data:", error));
        }, (error) => console.error("Error decoding impulse data:", error));
    }).catch(error => console.error("Failed to load files:", error));
}

// fade out the audio
export function fadeAudio(audio: HTMLAudioElement, fadein: boolean): Promise<void> {
    return new Promise((resolve) => {
        const fadeDuration = 0.5; // duration for fade in/out in seconds
        const initialVolume = audio.volume;
        const maxVolume = globalVolume; // target volume for fade in

        if (fadein) {
            // reset volume to 0 for fade in
            audio.volume = 0;
            audio.play().catch(error => console.error("Audio play failed:", error));
            const fadeIn = setInterval(() => {
                if (audio.volume < maxVolume - 0.01) {
                    let newVolume = audio.volume + maxVolume / (fadeDuration * 10);
                    audio.volume = newVolume > maxVolume ? maxVolume : newVolume;
                } else {
                    audio.volume = maxVolume;
                    clearInterval(fadeIn);
                    resolve();
                }
            }, 50); // fade in audio
        } else {
            const fadeOut = setInterval(() => {
                currentBackgroundTime = background.currentTime;
                if (audio.volume > 0.01) {
                    let newVolume = audio.volume - initialVolume / (fadeDuration * 10);
                    audio.volume = newVolume < 0 ? 0 : newVolume;
                } else {
                    audio.volume = 0;
                    audio.pause();
                    audio.currentTime = 0;
                    clearInterval(fadeOut);
                    resolve();
                }
            }, 50); // fade out audio
        }
    });
}

// manage the whisper sound effect
export function manageWhispers() {
    whispers.volume = globalVolume * 1.5;
    playWhispers();
    clearInterval(whispersIntervalId);
    whispersIntervalId = setInterval(playWhispers, 39000);
}

// play the whispering audio
export function playWhispers(attempt = 1) {
    fadeAudio(background, false).then(() => {
        whispers.play().catch(error => {
            console.error("Audio play failed:", error);
            if (attempt < 5) {
                setTimeout(() => playWhispers(attempt + 1), 1000); // retry after 1 second
            }
        });
    });
}

// play background music
export function playBackground() {
    background = new Audio('/assets/minecraft/sound/background.flac');
    background.volume = globalVolume * 0.85;
    background.loop = true;
    background.play();
}