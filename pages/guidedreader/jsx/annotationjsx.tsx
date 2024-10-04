import styles from '../styles/index.module.css';
import React, { useState, useEffect } from "react";
import { hideAnnotationButton, hideAnnotationAnimation, submitAnnotation, fetchAnnotations, handleVote } from "../utils/annotationutils";
import { AnnotationModalProps } from "../types/types";
import { BOT_LINK } from "../utils/helperutils";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

const helper: React.FC = () => {
    return null;
};

export default helper;

// annotation modal
export const AnnotationModal: React.FC<AnnotationModalProps> = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, userDetails, setCorrectingAnnotation, setCorrectingAnnotationData }) => {
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
                            setCorrectingAnnotationData(currentAnnotationData);
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
        <span className={styles.annotationModalText}>
            <Markdown remarkPlugins={[remarkGfm]}>
                {annotation.description}
            </Markdown>
        </span>
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
    const [preview, setPreview] = useState(false);
    return (
        <div id="createAnnotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>{title}</strong></span>
            <span className={styles.annotationModalClose} onClick={onClose}>X</span>
            <div className={styles.annotationWrapper}>
                <span className={styles.annotationModalText}>
                    <b>{selectedText}</b>
                    {preview ? (
                        <div className={styles.markdownOverlay}>
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {annotationText}
                            </Markdown>
                        </div>
                    ) : (
                        <textarea className={styles.annotationTextarea} placeholder="Enter annotation here..." rows={18}
                            cols={60} value={annotationText} onChange={(e) => setAnnotationText(e.target.value)} />
                    )}
                </span>
                <span className={styles.informMarkdown}><a target="_blank" href="https://www.markdownguide.org/basic-syntax/">
                Annotations are formatted with Markdown</a></span>
                <div className={styles.annotationModalButtons}>
                    <button className={styles.submitButton} onClick={onSubmit}>Submit</button>
                    <button className={styles.previewButton} onClick={() => {
                        setPreview(!preview);
                    }}>{preview ? "Edit" : "Preview"}</button>
                </div>
            </div>
        </div>
    );
};

// create annotation modal
export const CreatingAnnotationModal = ({ setSelectedText, selectedText, setCreatingAnnotation, userDetails, currentTextID, charIndex }:
    { setSelectedText: (value: string) => void, selectedText: string, setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, charIndex: number }
) => {
    const [annotationText, setAnnotationText] = useState("");
    const handleSubmit = async () => {
        let result = await submitAnnotation(selectedText, annotationText, userDetails, currentTextID, charIndex);
        // successfully submitted annotation
        if (result == 0) {
            window.location.reload();
        } else if (result == 1) {
            console.log("Annotation too short!");
        } else if (result == 2) {
            console.log("Failed to add annotation (Internal Server Error)");
        }
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
export const CorrectingAnnotationModal = ({ setCreatingAnnotation, userDetails, currentTextID, currentText, correctingAnnotationData }:
    { setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, currentText: any, correctingAnnotationData: any }
) => {
    const [annotationText, setAnnotationText] = useState("");
    const start = correctingAnnotationData.start;
    const end = correctingAnnotationData.end;

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