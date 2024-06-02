import styles from './styles/stem.module.css';
import { useState, useEffect } from 'react';

export default function Index() {
    const [, setFreezeframe] = useState<any>(null);
    const [hoveredSong, setHoveredSong] = useState<string | null>(null);
    const [songDirectories, setSongDirectories] = useState<string[]>([]);

    // use effect to fetch song directories to create different menus
    useEffect(() => {
        fetch('/api/songs')
          .then(response => response.json())
          .then(data => {
            setSongDirectories(data);
          });
    }, []);

    // i think this is something to do with gif loading i forgot
    useEffect(() => {
        import('freezeframe').then((module) => {
            setFreezeframe(new module.default());
        });
    }, []);

    return (
        <div className={styles.experienceWrapper}>
            <div className={styles.playWrapper} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridGap: '10px' }}>
                {songDirectories.map((song) => (
                    <div className={`${styles[`song${song.charAt(0).toUpperCase() + song.slice(1)}Wrapper`]} ${styles.songWrapper}`}
                        style={{ backgroundImage: `url(${"/assets/stemplayer/" + song + "/images/banner.png"})`,
                            backgroundSize: 'cover', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={() => setHoveredSong(song)}
                        onMouseLeave={() => setHoveredSong(null)}
                    >
                        {hoveredSong === song && (
                            <div className={styles.freezeFrame} style={{
                                backgroundImage: `url(${"/assets/stemplayer/" + song + "/images/banner.gif"})`,
                            }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}