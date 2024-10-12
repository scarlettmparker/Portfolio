import styles from './styles/index.module.css';
import cstyles from './styles/content.module.css';
import Image from 'next/image';
import './styles/global.css';

const Home = () => {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.titleWrapper}>
                <Image className={styles.title} draggable={false} src="/assets/portfolio/images/scarlett_parker_logo.png" alt="scarlett parker" width={396} height={279} quality={100} />
                <div className={styles.styledWrapper}>
                    <Image className={`${styles.titleImages} ${styles.backgroundImages}`} draggable={false} src="/assets/portfolio/images/design.png" alt="design" width={1440} height={810} quality={100} />
                    <Image className={`${styles.titleImages} ${styles.backgroundImages}`} draggable={false} src="/assets/portfolio/images/light_screen.png" alt="light_screen" width={883} height={525} quality={100} />
                    <Image className={`${styles.backgroundImages} ${styles.darkness}`} draggable={false} src="/assets/portfolio/images/darkness_luminosity.png" alt="darkness" width={1920} height={731} quality={100} />
                </div>
            </div>
            <div className={`${cstyles.contentWrapper} ${cstyles.professionWrapper}`}>
                <span className={`${cstyles.developer} ${cstyles.text}`}>FULL STACK DEVELOPER</span>
                <span className={`${cstyles.artist} ${cstyles.text}`}>ARTIST & DESIGNER</span>
                <span className={cstyles.expandArrow}>▼</span>
            </div>
            <div className={`${cstyles.contentWrapper} ${cstyles.projectWrapper}`}>
                <span className={`${cstyles.developer} ${cstyles.text}`}>PERSONAL PROJECT</span>
                <span className={`${cstyles.portfolio} ${cstyles.text}`}>PORTFOLIO</span>
                <span className={cstyles.expandArrow}>▼</span>
            </div>
            <div className={styles.background}>
            </div>
        </div>
    );
};

export default Home;