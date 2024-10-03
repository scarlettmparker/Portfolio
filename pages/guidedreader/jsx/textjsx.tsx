import styles from '../styles/index.module.css';
import React, { useRef } from 'react';
import { TextListProps } from '../types/types';

const helper: React.FC = () => {
    return null;
};

export default helper;

// text list module
export const TextList: React.FC<TextListProps> = ({ textData, levelSeparators, setCurrentText, setCurrentAnnotation, setCurrentLanguage, currentText, textListRef }) => {
    const levelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    return (
        <div className={styles.sideWrapper}>
            <div className={styles.sideTitleWrapper}>
                <span className={styles.sideTitle}>Texts (κείμενα)</span>
            </div>
            <div className={styles.textList} ref={textListRef}>
                <div className={styles.textItemWrapper}>
                    {textData.length !== 0 ? textData.map(({ title, level }, index) => (
                        <React.Fragment key={index}>
                            {levelSeparators.some(separator => separator.index === index) ? (
                                <div
                                    key={"levelSeparator" + index}
                                    data-index={index}
                                    data-level={levelSeparators.find(separator => separator.index === index)?.level}
                                    className={`${styles.levelSeparator} levelSeparator`}
                                    ref={el => { levelRefs.current[level] = el; }}
                                >
                                    {levelSeparators.find(separator => separator.index === index)?.level}
                                </div>
                            ) : null}
                            <div key={"textModule" + index} onClick={() => {
                                let textIndex = textData[index].id - 1;
                                setCurrentLanguage(0);
                                setCurrentAnnotation('');
                                setCurrentText(textIndex);
                            }}>
                                {TitleModule(title, currentText === index)}
                            </div>
                        </React.Fragment>
                    )) : <span className={styles.loadingText}>Loading...</span>}
                </div>
            </div>
        </div>
    );
};

// level navigation module
export const LevelNavigation: React.FC<{ currentLevel: string, scrollToLevel: (level: string) => void }> = ({ currentLevel, scrollToLevel }) => (
    <div className={styles.navWrapper}>
        <div className={styles.navItemWrapper}>
            <span className={`${styles.navItem} ${currentLevel === 'Α1' || currentLevel === 'Α1 (8-12)' ? styles.activeNavItemA1 : ''}`} onClick={() => scrollToLevel('Α1')}>A1</span>
            <span className={`${styles.navItem} ${currentLevel === 'Α2' ? styles.activeNavItemA2 : ''}`} onClick={() => scrollToLevel('Α2')}>A2</span>
            <span className={`${styles.navItem} ${currentLevel === 'Β1' ? styles.activeNavItemB1 : ''}`} onClick={() => scrollToLevel('Β1')}>B1</span>
            <span className={`${styles.navItem} ${currentLevel === 'Β2' ? styles.activeNavItemB2 : ''} ${styles.navItemB2}`} onClick={() => scrollToLevel('Β2')}>B2</span>
            <span className={`${styles.navItem} ${currentLevel === 'Γ1' ? styles.activeNavItemC1 : ''}`} onClick={() => scrollToLevel('Γ1')}>C1</span>
            <span className={`${styles.navItem} ${currentLevel === 'Γ2' ? styles.activeNavItemC2 : ''}`} onClick={() => scrollToLevel('Γ2')}>C2</span>
        </div>
    </div>
);

// text module containing text itself
export const TextModule: React.FC<{ currentText: number, textContentRef: any, textData: any, renderAnnotatedText: any, currentLanguage: number }> =
    ({ currentText, textContentRef, textData, renderAnnotatedText, currentLanguage }) => {
        return (
            <div className={styles.textContentWrapper} id="textContentWrapper" ref={textContentRef}>
                <div className={styles.textContent}>
                    {currentText < textData.length && textData[currentText].text?.length > 0 ? (
                        <div key={"textContent0"} className={styles.textContentItem}>
                            <div dangerouslySetInnerHTML={{
                                __html: renderAnnotatedText(textData[currentText].text[currentLanguage].text,
                                    textData[currentText].text[currentLanguage].annotations)
                            }} />
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

// create text modules from titles
const TitleModule = (title: string, currentText: boolean) => {
    return (
        <div className={`${styles.textItem} ${currentText ? styles.selectedTextItem : ''}`}>
            <span className={styles.textTitle}>{title}</span>
        </div>
    );
}