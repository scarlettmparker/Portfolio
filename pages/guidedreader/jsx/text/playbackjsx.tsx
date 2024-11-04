import { useEffect, useRef } from "react";

interface PlayerProps {
    audioSrc: string;
    className?: string;
    setIsPlaying: (value: boolean) => void;
    onTimeUpdate: (currentTime: number) => void;
}

const Playback: React.FC<PlayerProps> = ({ audioSrc, className, setIsPlaying, onTimeUpdate }) => {
    const playerRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const handleTimeUpdate = () => {
            if (playerRef.current) {
                const currentTime = playerRef.current.currentTime;
                onTimeUpdate(currentTime);
                setIsPlaying(!playerRef.current.paused);
            }
        };

        if (playerRef.current) {
            playerRef.current.addEventListener("timeupdate", handleTimeUpdate);
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.removeEventListener("timeupdate", handleTimeUpdate);
            }
        };
    }, []);

    return <audio controls src={audioSrc} ref={playerRef} className={className} />;
};

export default Playback;