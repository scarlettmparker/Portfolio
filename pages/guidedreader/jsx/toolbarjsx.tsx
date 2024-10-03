import styles from '../styles/index.module.css';
import { Text, ToolbarProps } from '../types/types';
import { handleLanguageChange } from '../utils/toolbarutils';

const helper: React.FC = () => {
    return null;
};

export default helper;

// toolbar component
export const Toolbar: React.FC<ToolbarProps> = ({ textData, setCurrentAnnotation, setCurrentLanguage, currentText, setCurrentTextID}) => {
    return <div className={styles.toolbarWrapper}>
        <div className={styles.languageChangeWrapper}>
            <select className={styles.languageChangeBox} onChange={(e) => {
                handleLanguageChange(e, setCurrentLanguage, setCurrentAnnotation, setCurrentTextID, textData, currentText);
            } }>
                {textData[currentText] && textData[currentText].text?.map((text: Text, index: number) => (
                    <option key={"languageChange" + index} value={index}>
                        {text.language}
                    </option>
                ))}
            </select>
        </div>
    </div>;
}