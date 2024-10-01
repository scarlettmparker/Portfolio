import styles from '../styles/index.module.css';
import React, { useState, useEffect } from "react";
import { hideAnnotationButton, hideAnnotationAnimation, submitAnnotation } from "../utils/annotationutils";
import { Author } from '../types/types';

const helper: React.FC = () => {
    return null;
};

export default helper;

const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK;

// annotation modal component
export const AnnotationModal = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, textData }:
    { setCurrentAnnotation: (value: string) => void, currentAnnotation: string, currentLanguage: number, currentText: number, textData: any }) => {
    const [author, setAuthor] = useState<Author | null>(null);

    // fetch the author of the annotation
    useEffect(() => {
        // this is really ugly i can't lie
        const currentAnnotationId = textData[currentText].text[currentLanguage].annotations.findIndex((annotation: { description: string; }) => annotation.description === currentAnnotation);
        const currentUserId = textData[currentText].text[currentLanguage].annotations[currentAnnotationId].userId;

        // get the user data from api endpoint
        const fetchUser = async () => {
            const response = await fetch(`./api/guidedreader/getuserbyid?userId=${currentUserId}`);
            const userData = await response.json();
            setAuthor(userData);
        };

        fetchUser();
    }, [currentAnnotation, currentText, currentLanguage, textData]);

    return (
        <div id="annotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>Annotation</strong></span>
            <span className={styles.annotationModalClose} onClick={() => {
                hideAnnotationAnimation(setCurrentAnnotation, "annotationModal");
            }}>X</span>
            <div className={styles.annotationWrapper}>
                <span className={styles.annotationModalText} dangerouslySetInnerHTML={{ __html: currentAnnotation }}></span>
                <span className={styles.annotationModalAuthor}>Author: <b>{author ? author.username : 'Loading...'}</b></span>
            </div>
        </div>
    );
}

// create annotation button
export const CreateAnnotationButton = ({ buttonPosition, isLoggedIn, setCreatingAnnotation }:
    { buttonPosition: { x: number, y: number }, isLoggedIn: boolean, setCreatingAnnotation: (value: boolean) => void }) => {
    return (
        <div
            className={styles.annotationPopup}
            style={{ top: buttonPosition.y, left: buttonPosition.x }}
            onMouseUp={(e) => e.stopPropagation()} // stop propagation to prevent the modal from disappearing
        >
            {isLoggedIn ? (
                <button onClick={() => { hideAnnotationButton(setCreatingAnnotation) }}
                    className={styles.annotateButton}>Annotate</button>
            ) : (
                <button onClick={() => { window.location.href = BOT_LINK!; }}
                    className={styles.annotateButton}>Sign in to Annotate</button>
            )}
        </div>
    );
}

// modal for in-creation of annotations
export const CreatingAnnotationModal = ({ setSelectedText, selectedText, setCreatingAnnotation, userDetails, currentTextID, charIndex }:
    { setSelectedText: (value: string) => void, selectedText: string, setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, charIndex: number }) => {
    const [annotationText, setAnnotationText] = useState("");
    return (
        <div id="createAnnotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>Annotate</strong></span>
            <span className={styles.annotationModalClose} onClick={() => {
                hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation)
            }}>X</span>
            <div className={styles.annotationWrapper}>
                <span className={styles.annotationModalText}>
                    <span className={styles.annotationModalSelect}>{"- "} <i>{selectedText}</i></span>
                    <textarea
                        className={styles.annotationTextarea}
                        placeholder="Enter annotation here..."
                        rows={10}
                        cols={50}
                        value={annotationText}
                        onChange={(e) => setAnnotationText(e.target.value)}
                    />
                    <button
                        className={styles.submitButton}
                        onClick={() => {
                            submitAnnotation(selectedText, annotationText, userDetails, currentTextID, charIndex);
                            //hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation);
                        }}
                    >
                        Submit
                    </button>
                </span>
            </div>
        </div>
    );
};
