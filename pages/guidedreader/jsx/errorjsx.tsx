import styles from '../styles/errors.module.css';
import textstyles from '../styles/index.module.css';
import annotationstyles from '../styles/annotation.module.css';

const helper: React.FC = () => {
    return null;
};

export default helper;

// error box modal
export const ErrorBox = ({ error, setError }: { error: string, setError: (value: boolean) => void }) => {
    return (
        <div className={styles.errorBox}>
            <div className={`${textstyles.navWrapper} ${styles.errorTitle}`}>
                <span className={`${annotationstyles.annotationModalClose} ${styles.errorClose}`} onClick={() => setError(false)}>X</span>
                <span className={styles.errorTitleText}>Error Submitting Annotation</span>
                <span className={styles.errorTitleTextShort}>Error</span>
            </div>
            <div className={styles.errorInnerWrapper}>
                <span className={styles.errorText}>{error}</span>
                <button className={`${textstyles.errorButton} ${styles.errorButton}`} onClick={() => setError(false)}>Close</button>
            </div>
        </div>
    );
};