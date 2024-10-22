import styles from '../../styles/toolbar.module.css';
import indexstyles from '../../styles/index.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonWithAltTextProps } from '../../types/types';

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 30;

const FontSize = ({ fontSizeMenuVisible, setFontSizeMenuVisible }: { fontSizeMenuVisible: boolean, setFontSizeMenuVisible: (value: boolean) => void }) => {
    const [isIncreaseDisabled, setIsIncreaseDisabled] = useState(false);
    const [isDecreaseDisabled, setIsDecreaseDisabled] = useState(false);

    // refs for font size menu for defocusing
    const fontSizeMenuRef = useRef<HTMLDivElement>(null);
    const fontSizeButtonRef = useRef<HTMLButtonElement>(null);

    const toggleFontSizeMenu = () => {
        setFontSizeMenuVisible(!fontSizeMenuVisible);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target as Node)
            && fontSizeButtonRef.current && !fontSizeButtonRef.current.contains(event.target as Node)) {
            // close the menu only if visible
            if (fontSizeMenuVisible) {
                setFontSizeMenuVisible(false);
            }
        }
    }, [fontSizeMenuVisible, setFontSizeMenuVisible]);

    useEffect(() => {
        // event listener for detecting clicks outside
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // clean up component unmount
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div className={styles.fontSizeWrapper}>
            <ButtonWithAltText label="T" altText="Font Size" onClick={toggleFontSizeMenu} className={indexstyles.fontSizeButton} buttonRef={fontSizeButtonRef} />
            {fontSizeMenuVisible && (
                <div className={indexstyles.fontSizeMenu} ref={fontSizeMenuRef}>
                    <button className={indexstyles.fontButton} onClick={() => changeFontSize('-', setIsIncreaseDisabled, setIsDecreaseDisabled)} disabled={isDecreaseDisabled}>-</button>
                    <button className={indexstyles.fontButton} onClick={() => changeFontSize('+', setIsIncreaseDisabled, setIsDecreaseDisabled)} disabled={isIncreaseDisabled}>+</button>
                </div>
            )}
        </div>
    );
}

// change font size of text content
const changeFontSize = (operation: string, setIsIncreaseDisabled: (value: boolean) => void, setIsDecreaseDisabled: (value: boolean) => void) => {
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
                    <div className={indexstyles.altText} ref={altRef} onMouseEnter={() => setShowAltText(false)}>
                        {altText}
                    </div>
                )}
            </button>
        </>
    );
};

export default FontSize;