import styles from '../styles/index.module.css';
import { getRoleByLevel } from '../utils/helperutils';

const helper: React.FC = () => {
    return null;
};

export default helper;

// create text modules from titles
export function TextModule(title: string, level: string, currentText: boolean) {
	return (
		<div className={`${styles.textItem} ${currentText ? styles.selectedTextItem : ''}`}>
			<span className={styles.textTitle}>{title}</span>
		</div>
	);
}

// level display component
export const LevelDisplay = ({ level }: { level: string }) => {
    const role = getRoleByLevel(level);
    const color = role ? role.hex : '#000';

    return (
        <div className={styles.levelDisplay}>
            <span className={styles.levelDisplayTitle}>Level: </span>
            <span className={styles.levelDisplayText} style={{ color: color }}>{role?.name}</span>
        </div>
    );
};