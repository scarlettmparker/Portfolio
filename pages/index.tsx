import styles from './styles/index.module.css';
import cstyles from './styles/content.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import './styles/global.css';
import Head from 'next/head';

// constants
const EXTENSION_LINK = "https://github.com/scarlettmparker/Accessibility-Toolbar";
const GUIDED_READER_LINK = "https://scarlettparker.co.uk/guidedreader";

const TitleModal = ({ windowWidth }: { windowWidth: number }) => {
    const [titleWidth, setTitleWidth] = useState(396);
    const [titleHeight, setTitleHeight] = useState(279);

    useEffect(() => {
        // set title size based on window width
        const sizes = [
            { min: 750, width: 396, height: 279 },
            { min: 541, width: 360, height: 253 },
            { min: 361, width: 300, height: 211 },
            { min: 306, width: 240, height: 169 },
            { min: 0, width: 180, height: 127 }
        ];

        const size = sizes.find(s => windowWidth >= s.min);
        if (size) {
            setTitleWidth(size.width);
            setTitleHeight(size.height);
        }
    }, [windowWidth]);

    return (
        <div className={styles.titleWrapper}>
            <Image className={styles.title} draggable={false} src="/assets/portfolio/images/scarlett_parker_logo.png" alt="scarlett parker" width={titleWidth} height={titleHeight} quality={100} />
            <div className={styles.styledWrapper}>
                <Image className={`${styles.titleImages} ${styles.backgroundImages}`} draggable={false} src="/assets/portfolio/images/design.png" alt="design" width={1440} height={810} quality={100} />
                <Image className={`${styles.titleImages} ${styles.backgroundImages}`} draggable={false} src="/assets/portfolio/images/light_screen.png" alt="light_screen" width={883} height={525} quality={100} />
            </div>
            <Image className={`${styles.backgroundImages} ${styles.darkness}`} draggable={false} src="/assets/portfolio/images/darkness_luminosity.png" alt="darkness" width={1920} height={731} quality={100} />
        </div>
    );
};

const ProfessionModal = (
    { developerMenu, setDeveloperMenu, mobileDesign }: { developerMenu: boolean, setDeveloperMenu: (value: boolean) => void, mobileDesign: boolean }
) => {
    // auto set developer menu to true if mobile design
    useEffect(() => {
        if (mobileDesign == true) {
            setDeveloperMenu(true);
        }
    }, [mobileDesign]);

    return (
        <div className={`${cstyles.contentWrapper} ${cstyles.professionWrapper}`}>
            <span className={`${cstyles.developer} ${cstyles.text}`}>FULL-STACK DEVELOPER</span>
            <span className={`${cstyles.artist} ${cstyles.text}`}>ARTIST & DESIGNER</span>
            {!mobileDesign && (
                <span className={cstyles.expandArrow} onClick={() => setDeveloperMenu(!developerMenu)}>{developerMenu ? <>▲</> : <>▼</>}</span>
            )}
            {developerMenu && (
                <div className={cstyles.developerMenu}>
                    <span className={cstyles.developerText}>
                        <span className={cstyles.boldText}>Hi, I'm <span className={cstyles.scarlett}>Scarlett</span>, a 21-year-old full-stack developer based in the United Kingdom.</span>
                        <br /><br />Though my focus is on web applications, I've built a variety of projects, ranging from
                        an <a href={EXTENSION_LINK} className={cstyles.accessibilityLink} target="_blank">accessibility tool</a> extension with image
                        classification to a <a href={GUIDED_READER_LINK} className={cstyles.developerLink} target="_blank"> Genius-style guided reader</a> for Greek learners with user-submitted annotations.
                    </span>
                </div>
            )}
        </div>
    );
};

const PortfolioModal = (
    { portfolioMenu, setPortfolioMenu, mobileDesign }: { portfolioMenu: boolean, setPortfolioMenu: (value: boolean) => void, mobileDesign: boolean }
) => {
    // auto set portfolio menu to true if mobile design
    useEffect(() => {
        if (mobileDesign == true) {
            setPortfolioMenu(true);
        }
    }, [mobileDesign]);

    return (
        <div className={`${cstyles.contentWrapper} ${cstyles.projectWrapper}`}>
            <span className={`${cstyles.developer} ${cstyles.text}`}>PERSONAL PROJECT</span>
            <span className={`${cstyles.portfolio} ${cstyles.text}`}>PORTFOLIO</span>
            {!mobileDesign && (
                <span className={cstyles.expandArrow} onClick={() => setPortfolioMenu(!portfolioMenu)}>{portfolioMenu ? <>▲</> : <>▼</>}</span>
            )}
            {portfolioMenu && (
                <div className={cstyles.portfolioMenu}>
                    <span className={cstyles.portfolioText}>
                    </span>
                </div>
            )}
        </div>
    );
};

const Home = () => {
    // states to show menus
    const [developerMenu, setDeveloperMenu] = useState(false);
    const [portfolioMenu, setPortfolioMenu] = useState(false);
    const [mobileDesign, setMobileDesign] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                setMobileDesign(window.innerWidth <= 1220);
                setWindowWidth(window.innerWidth);
            };

            // get initial page size (mobile design or not)
            handleResize();
            window.addEventListener('resize', handleResize);

            // cleanup event listener on component unmount
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, []);

    return (
        <>
            <Head>
                <title>Scarlett Parker</title>
                <meta name="description" content="Scarlett Parker portfolio" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.pageWrapper}>
                <TitleModal windowWidth={windowWidth} />
                <div className={cstyles.modalWrapper}>
                    <ProfessionModal developerMenu={developerMenu} setDeveloperMenu={setDeveloperMenu} mobileDesign={mobileDesign} />
                    <PortfolioModal portfolioMenu={portfolioMenu} setPortfolioMenu={setPortfolioMenu} mobileDesign={mobileDesign} />
                </div>
            </div>
            <div className={styles.background} />
        </>
    );
};

export default Home;