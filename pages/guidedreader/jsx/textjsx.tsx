import styles from '../styles/index.module.css';
import React, { useRef, useState, useEffect } from 'react';
import { TextListProps } from '../types/types';
import { sortTextData as sortTextDataUtil, filterTextData, observeLevelSeparators } from '../utils/textutils';

const helper: React.FC = () => {
    return null;
};

export default helper;

// CONSTS
const SORT_OPTIONS = ['Level A-C', 'Level C-A'];
const LEVELS = ['Α1', 'Α2', 'Β1', 'Β2', 'Γ1', 'Γ2'];

// text list component (left bar)
export const TextList: React.FC<TextListProps> = ({ textData, levelSeparators, setCurrentText, setCurrentAnnotation, setCurrentLanguage, currentText, textListRef, setCurrentLevel }) => {
    const [sortedData, setSortedData] = useState({ sortedTextData: textData, sortedLevelSeparators: levelSeparators });
    const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState(LEVELS);

    const levelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const { filteredTextData } = filterTextData(sortedData.sortedTextData, selectedLevels, searchTerm);

    useEffect(() => {
        // sort the text data based on the selected sort option
        const { sortedTextData, sortedLevelSeparators } = sortTextDataUtil(textData, levelSeparators, sortOption);
        setSortedData({ sortedTextData, sortedLevelSeparators });
    }, [sortOption, textData, levelSeparators, selectedLevels]);

    useEffect(() => {
        return observeLevelSeparators(textListRef, setCurrentLevel);
    }, [filteredTextData, textListRef, setCurrentLevel]);

    return (
        <div className={styles.sideWrapper}>
            <div className={styles.sideTitleWrapper}>
                <span className={styles.sideTitle}>Texts (κείμενα)</span>
            </div>
            <div className={styles.textList} ref={textListRef}>
                <TextFilter sortOptions={SORT_OPTIONS} onSortChange={(newSortOption) => setSortOption(newSortOption)} searchTerm={searchTerm}
                    onSearchChange={setSearchTerm} selectedLevels={selectedLevels} onLevelChange={setSelectedLevels} />
                <div className={styles.textItemWrapper}>
                    {filteredTextData.map(({ title, level }, index) => {
                        const originalIndex = sortedData.sortedTextData.findIndex(text => text.title === title && text.level === level);

                        const previousTextLevel = index > 0 ? filteredTextData[index - 1].level : null;
                        const shouldShowLevelSeparator = previousTextLevel !== level;

                        return (
                            <React.Fragment key={index}>
                                {shouldShowLevelSeparator ? (
                                    <div key={"levelSeparator" + originalIndex} data-index={originalIndex} data-level={level}
                                        className={`${styles.levelSeparator} levelSeparator`} ref={el => { levelRefs.current[level] = el; }} >
                                        {level}
                                    </div>
                                ) : null}
                                <div key={"textModule" + originalIndex} onClick={() => {
                                    let textIndex = sortedData.sortedTextData[originalIndex].id - 1;
                                    setCurrentLanguage(0);
                                    setCurrentAnnotation('');
                                    setCurrentText(textIndex);
                                }}>
                                    {TitleModule(title, currentText === originalIndex)}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// text filter component
const TextFilter: React.FC<{
    sortOptions: string[], onSortChange: (sortOption: string) => void, searchTerm: string, onSearchChange: (term: string) => void,
    selectedLevels: string[], onLevelChange: (levels: string[]) => void
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
                                <input
                                    type="checkbox"
                                    value={level}
                                    checked={selectedLevels.includes(level)}
                                    onChange={() => handleLevelChange(level)}
                                    className={styles.levelCheckbox}
                                />
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
export const LevelNavigation: React.FC<{ currentLevel: string, scrollToLevel: (level: string) => void }> = ({ currentLevel, scrollToLevel }) => (
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

// text module component
export const TextModule: React.FC<{
    currentText: number, textContentRef: any, textData: any, renderAnnotatedText: any,
    currentLanguage: number
}> = ({ currentText, textContentRef, textData, renderAnnotatedText, currentLanguage }) => {
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

// title module component
const TitleModule = (title: string, currentText: boolean) => {
    return (
        <div className={`${styles.textItem} ${currentText ? styles.selectedTextItem : ''}`}>
            <span className={styles.textTitle}>{title}</span>
        </div>
    );
}