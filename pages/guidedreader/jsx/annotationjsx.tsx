import styles from '../styles/index.module.css';
import React, { useState, useEffect } from "react";
import { hideAnnotationButton, hideAnnotationAnimation, submitAnnotation, fetchAnnotations, handleVote } from "../utils/annotationutils";
import { BOT_LINK } from "../utils/helperutils";
import Image from 'next/image';

const helper: React.FC = () => {
    return null;
};

export default helper;

// annotation modal props
interface AnnotationModalProps {
    setCurrentAnnotation: (value: string) => void;
    currentAnnotation: string;
    currentLanguage: number;
    currentText: any;
    userDetails: any;
    setCorrectingAnnotation: (value: boolean) => void;
    setCurrentStart: (value: number) => void;
    setCurrentEnd: (value: number) => void;
}

// annotation modal
export const AnnotationModal: React.FC<AnnotationModalProps> = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, userDetails, setCorrectingAnnotation, setCurrentStart, setCurrentEnd }) => {
    const [annotations, setAnnotations] = useState<any[]>([]);

    // get the current annotation data
    const currentAnnotationId = currentText.text[currentLanguage].annotations.findIndex(
        (annotation: { description: string }) => annotation.description === currentAnnotation
    );
    const currentAnnotationData = currentText.text[currentLanguage].annotations[currentAnnotationId];

    useEffect(() => {
        // fetch the annotations for the current text
        fetchAnnotations(currentText, currentLanguage.toString(), currentAnnotationData, userDetails, setAnnotations);
    }, [currentText, currentLanguage, userDetails, currentAnnotation]);

    return (
        <div id="annotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>Annotations</strong></span>
            <span
                className={styles.annotationModalClose}
                onClick={() => hideAnnotationAnimation(setCurrentAnnotation, "annotationModal")}
            >
                X
            </span>
            <div className={styles.annotationWrapper}>
                <div className={styles.annotationInnerWrapper}>
                    {annotations.map((annotation, index) => (
                        <AnnotationItem
                            key={annotation.id}
                            annotation={annotation}
                            handleVote={(like: boolean) => handleVote(annotation.id, like, index, annotations, setAnnotations, userDetails)}
                        />
                    ))}
                </div>

                <span className={styles.correctionWrapper}>
                    <span className={styles.correctionText} onClick={() => {
                        if (userDetails) {
                            setCurrentAnnotation('');
                            setCorrectingAnnotation(true);
                            setCurrentStart(currentAnnotationData.start);
                            setCurrentEnd(currentAnnotationData.end);
                        } else {
                            window.location.href = BOT_LINK!;
                        }
                    }}>Think you can provide a better annotation?</span>
                </span>
            </div>
        </div>
    );
};

// annotation item
const AnnotationItem = ({ annotation, handleVote }: { annotation: any; handleVote: (like: boolean) => void }) => (
    <div className={styles.singleAnnotationWrapper}>
        <span className={styles.annotationModalText} dangerouslySetInnerHTML={{ __html: annotation.description }}></span>
        <div className={styles.annotationModalAuthorWrapper}>
            <span className={styles.annotationModalAuthor}>Annotation by:
                <a href={`/guidedreader/profile/${annotation.author.discordId}`} className={styles.annotationModalAuthorLink}>
                    {annotation.author.username}
                </a>
            </span>
            <div className={styles.annotationModalVotesWrapper}>
                <Image
                    src={annotation.hasLiked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"}
                    alt="Upvote" width={22} height={22}
                    onClick={() => handleVote(true)}
                />
                <span className={styles.annotationModalVotes}>{annotation.votes}</span>
                <Image
                    src={annotation.hasDisliked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"}
                    alt="Downvote" width={22} height={22} style={{ transform: 'rotate(180deg)' }}
                    onClick={() => handleVote(false)}
                />
            </div>
        </div>
    </div>
);

// create annotation button
export const CreateAnnotationButton = ({ buttonPosition, isLoggedIn, setCreatingAnnotation, setCurrentAnnotation }:
    { buttonPosition: { x: number, y: number }, isLoggedIn: boolean, setCreatingAnnotation: (value: boolean) => void, setCurrentAnnotation: (value: string) => void }) => {
    return (
        <div
            className={styles.annotationPopup}
            style={{ top: buttonPosition.y, left: buttonPosition.x }}
            onMouseUp={(e) => e.stopPropagation()} // stop propagation to prevent the modal from disappearing
        >
            {isLoggedIn ? (
                <button onClick={() => {
                    setCurrentAnnotation('');
                    hideAnnotationButton(setCreatingAnnotation)
                }}
                    className={styles.annotateButton}>Annotate</button>
            ) : (
                <button onClick={() => { window.location.href = BOT_LINK!; }}
                    className={styles.annotateButton}>Sign in to Annotate</button>
            )}
        </div>
    );
}

// annotation modal for creating and correcting annotations
const WritingAnnotationModal = ({ title, selectedText, annotationText, setAnnotationText, onSubmit, onClose }:
    { title: string, selectedText: string | null, annotationText: string, setAnnotationText: (value: string) => void, onSubmit: () => void, onClose: () => void }
) => {
    return (
        <div id="createAnnotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>{title}</strong></span>
            <span className={styles.annotationModalClose} onClick={onClose}>X</span>
            <div className={styles.annotationWrapper}>
                <span className={styles.annotationModalText}>
                    {selectedText && <span className={styles.annotationModalSelect}>{"- "} <i>{selectedText}</i></span>}
                    <textarea className={styles.annotationTextarea} placeholder="Enter annotation here..." rows={10}
                        cols={50} value={annotationText} onChange={(e) => setAnnotationText(e.target.value)} />
                    <button className={styles.submitButton} onClick={onSubmit}>Submit</button>
                </span>
            </div>
        </div>
    );
};

// create annotation modal
export const CreatingAnnotationModal = ({ setSelectedText, selectedText, setCreatingAnnotation, userDetails, currentTextID, charIndex }:
    { setSelectedText: (value: string) => void, selectedText: string, setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, charIndex: number }
) => {
    const [annotationText, setAnnotationText] = useState("");
    const handleSubmit = () => {
        submitAnnotation(selectedText, annotationText, userDetails, currentTextID, charIndex);
    };
    const handleClose = () => {
        hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation);
    };
    return (
        <WritingAnnotationModal title="Annotate" selectedText={selectedText} annotationText={annotationText}
            setAnnotationText={setAnnotationText} onSubmit={handleSubmit} onClose={handleClose} />
    );
};

// correct annotation modal
export const CorrectingAnnotationModal = ({ setCreatingAnnotation, userDetails, currentTextID, start, end }:
    { setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, start: number, end: number }
) => {
    const [annotationText, setAnnotationText] = useState("");
    const handleSubmit = () => {
        submitAnnotation(null, annotationText, userDetails, currentTextID, null, start, end);
    };
    const handleClose = () => {
        hideAnnotationAnimation(null, "createAnnotationModal", setCreatingAnnotation);
    };
    return (
        <WritingAnnotationModal title="Correct Annotation" selectedText={null} annotationText={annotationText}
            setAnnotationText={setAnnotationText} onSubmit={handleSubmit} onClose={handleClose} />
    );
};