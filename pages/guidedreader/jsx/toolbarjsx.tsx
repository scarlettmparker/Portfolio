import styles from '../styles/index.module.css';
import React, { useState, useEffect, useRef } from 'react';
import { Text, ToolbarProps, ButtonWithAltTextProps } from '../types/types';
import { handleLanguageChange } from '../utils/toolbarutils';

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 30;

const helper: React.FC = () => {
    return null;
};

export default helper;

// toolbar component
export const Toolbar: React.FC<ToolbarProps> = ({ textData, setCurrentAnnotation, setCurrentLanguage, currentText, setCurrentTextID }) => {
    // use state for font size menu visibility
    const [fontSizeMenuVisible, setFontSizeMenuVisible] = useState(false);
    const [isIncreaseDisabled, setIsIncreaseDisabled] = useState(false);
    const [isDecreaseDisabled, setIsDecreaseDisabled] = useState(false);

    // refs for font size menu for defocusing
    const fontSizeMenuRef = useRef<HTMLDivElement>(null);
    const fontSizeButtonRef = useRef<HTMLButtonElement>(null);

    const toggleFontSizeMenu = () => {
        setFontSizeMenuVisible(!fontSizeMenuVisible);
    };

    // change font size of text content
    const changeFontSize = (operation: string) => {
        const textElement = document.getElementById('textContent');
        if (textElement) {
            // get current font size and calculate new size
            const currentFontSize = parseFloat(window.getComputedStyle(textElement).fontSize);
            let newSize = operation === '+' ? currentFontSize + 1 : currentFontSize - 1;

            // check if new size is within bounds
            if (newSize >= MIN_FONT_SIZE && newSize <= MAX_FONT_SIZE) {
                textElement.style.fontSize = `${newSize}px`;
                setIsIncreaseDisabled(newSize >= MAX_FONT_SIZE);
                setIsDecreaseDisabled(newSize <= MIN_FONT_SIZE);
            }
        }
    };

    useEffect(() => {
        // close font size menu if clicked outside
        const handleClickOutside = (event: MouseEvent) => {
            if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target as Node) && fontSizeButtonRef.current && !fontSizeButtonRef.current.contains(event.target as Node)) {
                // clicked outside
                setFontSizeMenuVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.toolbarWrapper}>
            <div className={styles.toolbarItems}>
                <div className={styles.fontSizeWrapper}>
                    <ButtonWithAltText label="T" altText="Font Size" onClick={toggleFontSizeMenu} className={styles.fontSizeButton} buttonRef={fontSizeButtonRef} />
                    {fontSizeMenuVisible && (
                        <div className={styles.fontSizeMenu} ref={fontSizeMenuRef}>
                            <button className={styles.fontButton} onClick={() => changeFontSize('+')} disabled={isIncreaseDisabled}>+</button>
                            <button className={styles.fontButton} onClick={() => changeFontSize('-')} disabled={isDecreaseDisabled}>-</button>
                        </div>
                    )}
                </div>
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

// button with alt text for the toolbar
export const ButtonWithAltText: React.FC<ButtonWithAltTextProps> = ({ label, altText, onClick, disabled, className, buttonRef }) => {
    const [showAltText, setShowAltText] = useState(false);
    const altRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showAltText && altRef.current) {
            const altTextWidth = altRef.current.offsetWidth;
            altRef.current.style.marginLeft = `-${altTextWidth / 2 - 4}px`;
        }
    }, [showAltText]);

    return (
        <>
            <button className={className} onClick={onClick} disabled={disabled} onMouseEnter={() => setShowAltText(true)} onMouseLeave={() => setShowAltText(false)} ref={buttonRef} >
                {label}
                {showAltText && (
                    <div className={styles.altText} ref={altRef} onMouseEnter={() => setShowAltText(false)}>
                        {altText}
                    </div>
                )}
            </button>
        </>
    );
};