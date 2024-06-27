import Image from 'next/image';
import styles from './styles/index.module.css';
import './styles/global.css';

export default function Home() {

    const InfoSection = ({ infoText, buttonText }: { infoText: string; buttonText: string }) => (
        <div className={styles.infoWrapper}>
            <div className={styles.infoTextWrapper}>
                <span className={styles.infoText}>{infoText}</span>
            </div>
            <div className={styles.readMoreButton}>
                <span className={styles.readMoreText}>{buttonText}</span>
            </div>
        </div>
    );
    return (
        <>
            <div className={styles.pageWrapper}>
                <div className={styles.htmlWrapper}>
                    <div className={styles.playerWrapper}>
                        <div className={styles.book}>
                            <Image src="/assets/minecraft/images/book.png" alt="book" width={82} height={71} />
                        </div>
                        <div className={styles.player}>
                            <Image src="/assets/minecraft/images/steve.png" alt="player" width={161} height={323} />
                        </div>
                        <div className={styles.stand}></div>
                    </div>
                    <div className={styles.titleWrapper}>
                        <span className={styles.title}>Secret Life</span>
                        <span className={styles.date}>Tue 4 Jun - Tue 9 Jul</span>
                    </div>
                    <div className={styles.expandedInfoWrapper}>
                        <div className={styles.pluginInfoWrapper}>
                            <InfoSection 
                                infoText="Secret Life was a 6 week long Minecraft event running once a week with 30 active players per session."
                                buttonText="Read More"
                            />
                        </div>
                        <div className={styles.dataInfoWrapper}>
                            <InfoSection 
                                infoText="Across the sessions, player data was gathered and these statistics can be found below."
                                buttonText="Read More"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}