import styles from '../styles/toolbar.module.css';
import React, { useState } from 'react';
import { Text, ToolbarProps } from '../types/types';
import { handleLanguageChange } from '../utils/toolbarutils';
import WordReference from './toolbar/wordreferencejsx';
import FontSize from './toolbar/fontsizejsx';

const helper: React.FC = () => {
    return null;
};

export default helper;

// toolbar component
export const Toolbar: React.FC<ToolbarProps> = ({ textData, setCurrentAnnotation, setCurrentLanguage, currentText, setCurrentTextID }) => {
    // use state for tracking the currently active menu
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const handleMenuClick = (menuName: string) => {
        setActiveMenu(activeMenu === menuName ? null : menuName);
    };

    return (
        <div className={styles.toolbarWrapper}>
            <div className={styles.toolbarItems}>
                <FontSize 
                    fontSizeMenuVisible={activeMenu === 'fontSize'} 
                    setFontSizeMenuVisible={() => handleMenuClick('fontSize')} 
                />
                <WordReference 
                    wordReferenceMenuVisible={activeMenu === 'wordReference'} 
                    setWordReferenceMenuVisible={() => handleMenuClick('wordReference')} 
                />
                <div className={styles.languageChangeWrapper}>
                    <select className={styles.languageChangeBox} onChange={(e) => {
                        handleLanguageChange(e, setCurrentLanguage, setCurrentAnnotation, setCurrentTextID, textData, currentText);
                    }}>
                        {textData[currentText] && textData[currentText].text?.map((text: Text, index: number) => (
                            <option key={"languageChange" + index} value={index}>
                                {text.language}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}