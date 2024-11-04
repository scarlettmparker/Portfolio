import styles from '../../styles/index.module.css';
import React, { useRef, useState, useEffect } from 'react';
import { LevelSeparatorProps, SidebarHeaderProps, TextItemProps, Theme } from '../../types/types';
import { TextListProps } from '../../types/types';
import { sortTextData as sortTextDataUtil, filterTextData, observeLevelSeparators } from '../../utils/textutils';
import { ButtonWithAltText } from './../toolbar/fontsizejsx';
import { parseVTT, VTTEntry } from '../../utils/render/vttutils';
import Playback from './playbackjsx';

const helper: React.FC = () => {
    return null;
};

export default helper;

// CONSTS
const SORT_OPTIONS = ['Level A-C', 'Level C-A'];
const LEVELS = ['Α1', 'Α2', 'Β1', 'Β2', 'Γ1', 'Γ2'];

// sidebar header, has filters etc
const SidebarHeader: React.FC<SidebarHeaderProps> = ({ hiddenSidebar, toggleSidebar, windowWidth, isMounted }) => (
    <div className={styles.sideTitleWrapper}>
        <span className={styles.sideTitle}>Texts (κείμενα)</span>
        {isMounted && (
            <ButtonWithAltText label={windowWidth > 1150 ? ">" : "<"} altText="Hide Sidebar" className={styles.hideButton} onClick={toggleSidebar} />
        )}
    </div>
);

// individual text item
const TextItem: React.FC<TextItemProps> = ({ title, isSelected, onClick }) => (
    <div onClick={onClick} className={`${styles.textItem} ${isSelected ? styles.selectedTextItem : ''}`}>
        {title}
    </div>
);

// level separator
const LevelSeparator: React.FC<LevelSeparatorProps> = ({ level, textIndex, levelRefs }) => (
    <div key={"levelSeparator" + textIndex} data-index={textIndex} data-level={level}
        className={`${styles.levelSeparator} levelSeparator`} ref={el => { if (levelRefs.current) levelRefs.current[level] = el; }} >
        {level}
    </div>
);

// shows all the texts, main component
export const TextList: React.FC<TextListProps> = ({ textData, levelSeparators, setCurrentText, setCurrentAnnotation, setCurrentLanguage, currentText, textListRef, setCurrentLevel, hasURLData }) => {
    const [sortedData, setSortedData] = useState({ sortedTextData: textData, sortedLevelSeparators: levelSeparators });
    const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState(LEVELS);
    const [hiddenSidebar, setHiddenSidebar] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    const levelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const { filteredTextData } = filterTextData(sortedData.sortedTextData, selectedLevels, searchTerm);

    const toggleSidebar = () => setHiddenSidebar(!hiddenSidebar);

    // individual text item handling
    const textItemClick = (index: number) => {
        if (windowWidth < 1150) toggleSidebar();
        setCurrentLanguage(0);
        setCurrentAnnotation('');
        setCurrentText(index);
    }

    useEffect(() => {
        // sort the text data based on the selected sort option
        const { sortedTextData, sortedLevelSeparators } = sortTextDataUtil(textData, levelSeparators, sortOption);
        setSortedData({ sortedTextData, sortedLevelSeparators });
    }, [sortOption, textData, levelSeparators, selectedLevels]);

    useEffect(() => {
        return observeLevelSeparators(textListRef, setCurrentLevel);
    }, [filteredTextData, textListRef, setCurrentLevel]);

    useEffect(() => {
        setIsMounted(true);
        setWindowWidth(window.innerWidth);

        // get window width for responsive design
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // if the user loads on a specific text and may be on mobile
        if (hasURLData && window.innerWidth < 1150) {
            setHiddenSidebar(true);
        }
    }, [hasURLData]);

    useEffect(() => {
        // change the margin of the main wrapper based on the sidebar visibility
        // this is for if someone suddenly decides to change the screen size
        if (hiddenSidebar && windowWidth > 1560) {
            document.getElementById('mainWrapper')?.setAttribute('style', 'margin-right: 0');
        } else if (!hiddenSidebar && windowWidth > 1560) {
            document.getElementById('mainWrapper')?.setAttribute('style', 'margin-right: 100px');
        } else if (!hiddenSidebar && windowWidth < 1560) {
            document.getElementById('mainWrapper')?.setAttribute('style', 'margin-right: 0');
        }
    }, [hiddenSidebar, windowWidth]);

    return (
        <>
            {!hiddenSidebar ? (
                <div className={styles.sideWrapper}>
                    <SidebarHeader hiddenSidebar={hiddenSidebar} toggleSidebar={toggleSidebar} windowWidth={windowWidth} isMounted={isMounted} />
                    <div className={styles.textList} ref={textListRef}>
                        <TextFilter sortOptions={SORT_OPTIONS} onSortChange={setSortOption} searchTerm={searchTerm}
                            onSearchChange={setSearchTerm} selectedLevels={selectedLevels} onLevelChange={setSelectedLevels} />
                        <div className={styles.textItemWrapper}>
                            {filteredTextData.map(({ title, level }, index) => {
                                // get the index of the text in the original data
                                const originalIndex = sortedData.sortedTextData.findIndex(text => text.title === title && text.level === level);
                                const textIndex = sortedData.sortedTextData[originalIndex].id - 1;

                                // get the level of the previous text to determine if a level separator should be shown
                                const previousTextLevel = index > 0 ? filteredTextData[index - 1].level : null;
                                const shouldShowLevelSeparator = previousTextLevel !== level;

                                return (
                                    <React.Fragment key={index}>
                                        {shouldShowLevelSeparator && (
                                            <LevelSeparator level={level} textIndex={textIndex} levelRefs={levelRefs} />
                                        )}
                                        <TextItem title={title} isSelected={currentText === textIndex}
                                            onClick={() => textItemClick(textIndex)} />
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <ButtonWithAltText label={windowWidth > 1150 ? "<" : ">"} altText="Show Sidebar" className={styles.showButton} onClick={toggleSidebar} />
            )}
        </>
    );
};

// text filter component
const TextFilter: React.FC<{
    sortOptions: string[], onSortChange: (sortOption: string) => void, searchTerm: string,
    onSearchChange: (term: string) => void, selectedLevels: string[], onLevelChange: (levels: string[]) => void
}> = ({ searchTerm, onSearchChange, selectedLevels, onLevelChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // handle search input change to filter texts
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value);
    };

    // handle level checkbox change to filter texts
    const handleLevelChange = (level: string) => {
        if (selectedLevels.includes(level)) {
            if (selectedLevels.length > 1) {
                onLevelChange(selectedLevels.filter(l => l !== level));
            }
        } else {
            onLevelChange([...selectedLevels, level]);
        }
    };

    // handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.textFilterWrapper}>
            <div className={styles.levelFilterWrapper} ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={styles.dropdownButton}>☰</button>
                {isDropdownOpen && (
                    <div className={styles.levelCheckboxes}>
                        {LEVELS.map((level) => (
                            <label key={level} className={styles.levelCheckboxLabel}>
                                <input type="checkbox" value={level} checked={selectedLevels.includes(level)}
                                    onChange={() => handleLevelChange(level)} className={styles.levelCheckbox} />
                                {level}
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className={styles.searchInputWrapper}>
                <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search texts..." className={styles.searchInput} />
            </div>
        </div>
    );
};

// level navigation component
export const LevelNavigation: React.FC<{ currentLevel: string, currentTheme: Theme | null, scrollToLevel: (level: string) => void }> = ({ currentLevel, currentTheme, scrollToLevel }) => {
    return (
        <div className={styles.navWrapper}>
            <div className={styles.navItemWrapper}>
                <span className={`${styles.navItem} ${currentLevel === 'Α1' || currentLevel === 'Α1 (8-12)' ? styles.activeNavItemA1 : ''}`} onClick={() => scrollToLevel('Α1')}>Α1</span>
                <span className={`${styles.navItem} ${currentLevel === 'Α2' ? styles.activeNavItemA2 : ''}`} onClick={() => scrollToLevel('Α2')}>Α2</span>
                <span className={`${styles.navItem} ${currentLevel === 'Β1' ? styles.activeNavItemB1 : ''}`} onClick={() => scrollToLevel('Β1')}>Β1</span>
                <span className={`${styles.navItem} ${currentLevel === 'Β2' ? styles.activeNavItemB2 : ''}`} onClick={() => scrollToLevel('Β2')}>Β2</span>
                <span className={`${styles.navItem} ${currentLevel === 'Γ1' ? styles.activeNavItemC1 : ''}`} onClick={() => scrollToLevel('Γ1')}>Γ1</span>
                <span className={`${styles.navItem} ${currentLevel === 'Γ2' ? styles.activeNavItemC2 : ''}`} onClick={() => scrollToLevel('Γ2')}>Γ2</span>
            </div>
        </div>
    );
};

// text module component
export const TextModule: React.FC<{
    currentText: number, textContentRef: any, textData: any, renderAnnotatedText: any,
    currentLanguage: number
}> = ({ currentText, textContentRef, textData, renderAnnotatedText, currentLanguage }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [vttEntries, setVttEntries] = useState<VTTEntry[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const loadVTT = async () => {
            const entries = await parseVTT('/assets/guidedreader/audios/vtt/157.vtt');
            setVttEntries(entries);
        };
        loadVTT();
    }, []);

    return (
        <>
            <div className={styles.textContentWrapper} id="textContentWrapper" ref={textContentRef}>
                <div className={styles.textContent} id="textContent">
                    {currentText < textData.length && textData[currentText].text?.length > 0 ? (
                        <div key={"textContent0"} className={styles.textContentItem}>
                            <div dangerouslySetInnerHTML={{
                                __html: renderAnnotatedText(textData[currentText].text[currentLanguage].text,
                                    textData[currentText].text[currentLanguage].annotations, currentTime, vttEntries, isPlaying)
                            }} />
                        </div>
                    ) : null}
                </div>
            </div>
            {/*
            <div className={styles.playbackWrapper}>
                <Playback audioSrc={"/assets/guidedreader/audios/raw/157.mp3"} onTimeUpdate={setCurrentTime} setIsPlaying={setIsPlaying} />
            </div>
            */}
        </>
    );
}