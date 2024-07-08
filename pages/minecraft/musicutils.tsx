const helper: React.FC = () => {
    return null;
};
  
export default helper;

// GLOBAL VARIABLES
let whispers: HTMLAudioElement;
let background: HTMLAudioElement;
let currentBackgroundTime: number = 0;
let whispersIntervalId: string | number | NodeJS.Timeout | undefined;
let globalVolume: number = 0.4;

if (typeof window !== 'undefined') {
    whispers = new Audio('/assets/minecraft/sound/the secrets.mp3');
}

// stop the whisper sound effect with a convolver node (reverb effect)
export function stopWhispers() {
    // create audio context and source
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const whispersSourceUrl = whispers.src;
    const whispersCurrentTime = whispers.currentTime;

    // create gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

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

                // pause whispers audio
                fadeAudio();
                clearInterval(whispersIntervalId);
                whispersSource.stop(audioContext.currentTime + 1);

                // resume the audio from where it stopped
                background.currentTime = currentBackgroundTime;
                fadeAudio(background, true);
            }, (error) => console.error("Error decoding whispers data:", error));
        }, (error) => console.error("Error decoding impulse data:", error));
    }).catch(error => console.error("Failed to load files:", error));
}

// fade out the audio
export function fadeAudio(audio: HTMLAudioElement = whispers, fadein = false) {
    const fadeDuration = 0.5; // duration for fade in/out in seconds
    const initialVolume = audio.volume;
    const maxVolume = globalVolume; // target volume for fade in

    if (fadein) {
        // reset volume to 0 for fade in
        audio.volume = 0;
        audio.play();

        const fadeIn = setInterval(() => {
            if (audio.volume < maxVolume - 0.01) {
                let newVolume = audio.volume + maxVolume / (fadeDuration * 10);
                if (newVolume > maxVolume) {
                    audio.volume = maxVolume;
                } else {
                    audio.volume = newVolume;
                }
            } else {
                // once target volume reached, clear the interval
                audio.volume = maxVolume;
                clearInterval(fadeIn);
            }
        }, 500); // slowly fade audio in
    } else {
        const fadeOut = setInterval(() => {
            currentBackgroundTime = background.currentTime;
            if (audio.volume > 0.01) {
                let newVolume = audio.volume - initialVolume / (fadeDuration * 10);
                if (newVolume < 0) {
                    audio.volume = 0;
                } else {
                    audio.volume = newVolume;
                }
            } else {
                // stop the audio and clear the interval
                audio.volume = 0;
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fadeOut);
            }
        }, 500); // slowly fade audio out
    }
}

// manage the whisper sound effect
export function manageWhispers() {
    // lower the volume
    whispers.volume = globalVolume * 1.25;
    playWhispers();
    // play whispers every 39 seconds
    clearInterval(whispersIntervalId);
    whispersIntervalId = setInterval(() => {
        playWhispers();
    }, 39000); 
}

// play the whispering audio
export function playWhispers(attempt = 1) {
    fadeAudio(background);
    whispers.play().catch(error => {
        console.error("Audio play failed:", error);
        if (attempt < 5) {
            setTimeout(() => playWhispers(attempt + 1), 1000); // retry after 1 second
        }
    });
}

// play background music
export function playBackground() {
    background = new Audio('/assets/minecraft/sound/background.flac');
    background.volume = globalVolume * 0.85;
    background.loop = true;
    background.play();
}