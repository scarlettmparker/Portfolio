import styles from '../styles/index.module.css';

const helper: React.FC = () => {
    return null;
};

export default helper;

// create text modules from titles
export const TextModule = (title: string, level: string, currentText: boolean) => {
    return (
        <div className={`${styles.textItem} ${currentText ? styles.selectedTextItem : ''}`}>
            <span className={styles.textTitle}>{title}</span>
        </div>
    );
}