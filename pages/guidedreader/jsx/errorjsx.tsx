import styles from '../styles/errors.module.css';
import textstyles from '../styles/index.module.css';
import annotationstyles from '../styles/annotation.module.css';
import { useState } from 'react';

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

export const PolicyBox = ({ setAcceptedPolicy, setPopupVisible }: { setAcceptedPolicy: (value: boolean) => void, setPopupVisible: (value: boolean) => void }) => {
    // ensure both checkboxes are checked before enabling accept button
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);

    const isAcceptEnabled = termsChecked && privacyChecked;

    return (
        <div className={styles.errorBox}>
            <div className={`${textstyles.navWrapper} ${styles.errorTitle}`}>
                <span className={`${annotationstyles.annotationModalClose} ${styles.errorClose}`} onClick={() => setPopupVisible(false)}>X</span>
                <span className={styles.errorTitleText}>Warning</span>
                <span className={styles.errorTitleTextShort}>Warning</span>
            </div>
            <div className={styles.errorInnerWrapper}>
                <div className={styles.privacyInnerWrapper}>
                    <span className={styles.privacyText}>You must agree to our Terms of Service and Privacy Policy.</span>
                    <div className={styles.privacySmallWrapper}>
                        <div className={styles.privacySmallText}>
                            <input type="checkbox" id="terms" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
                            <label htmlFor="terms">I have read the <a href="/guidedreader/consent/terms" target="_blank">Terms of Service</a></label>
                        </div>
                        <div className={styles.privacySmallText}>
                            <input type="checkbox" id="privacy" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)} />
                            <label htmlFor="privacy">I have read the <a href="/guidedreader/consent/privacy" target="_blank">Privacy Policy</a></label>
                        </div>
                    </div>
                </div>
                <button className={`${textstyles.errorButton} ${styles.errorButton}`} onClick={() => isAcceptEnabled && setAcceptedPolicy(true)}>Accept</button>
            </div>
        </div>
    )
}