import styles from '../../styles/index.module.css';
import annotationStyles from '../../styles/annotation.module.css';
import React, { useState, useEffect } from "react";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { AnnotationModalProps } from "../../types/types";
import { BOT_LINK } from "../../utils/helperutils";
import { hideAnnotationButton, hideAnnotationAnimation, fetchAnnotations, handleVote } from "../../utils/annotation/annotationutils";
import { handleDeleteAnnotation, handleEditAnnotation, handleSubmitAnnotation } from '../../utils/annotation/changehandler';
import { deleteTimer } from '../../utils/annotation/changeannotation';

const helper: React.FC = () => {
    return null;
};

export default helper;

// helper function
function SetEditingAnnotation(setCurrentAnnotation: (value: string) => void, setCorrectingAnnotation: (value: boolean) => void, setCorrectingAnnotationData: (value: any) => void, currentAnnotationData: any) {
    setCurrentAnnotation('');
    setCorrectingAnnotation(true);
    setCorrectingAnnotationData(currentAnnotationData);
}

// annotation modal
export const AnnotationModal: React.FC<AnnotationModalProps> = ({
    setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, userDetails,
    setCorrectingAnnotation, setCorrectingAnnotationData, setError, setErrorMessage
}) => {
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
        <div id="annotationModal" className={annotationStyles.annotationModal}>
            <span className={annotationStyles.annotationModalTitle}><strong>Annotations</strong></span>
            <span
                className={annotationStyles.annotationModalClose}
                onClick={() => hideAnnotationAnimation(setCurrentAnnotation, "annotationModal")}
            >
                X
            </span>
            <div className={annotationStyles.annotationWrapper}>
                <div className={annotationStyles.annotationInnerWrapper}>
                    {annotations.map((annotation, index) => (
                        <AnnotationItem
                            key={annotation.id} annotation={annotation} handleVote={(like: boolean) => handleVote(annotation.id, like, index, annotations, setAnnotations, userDetails)}
                            userDetails={userDetails} setCurrentAnnotation={setCurrentAnnotation} setCorrectingAnnotation={setCorrectingAnnotation}
                            setCorrectingAnnotationData={setCorrectingAnnotationData} setError={setError} setErrorMessage={setErrorMessage}
                        />
                    ))}
                </div>

                <span className={styles.correctionWrapper}>
                    <span className={styles.correctionText} onClick={() => {
                        if (userDetails) {
                            SetEditingAnnotation(setCurrentAnnotation, setCorrectingAnnotation, setCorrectingAnnotationData, currentAnnotationData);
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
const AnnotationItem = ({ annotation, handleVote, userDetails, setCurrentAnnotation, setCorrectingAnnotation, setCorrectingAnnotationData, setError, setErrorMessage }: {
    annotation: any; handleVote: (like: boolean) => void, userDetails: any, setCurrentAnnotation: (value: string) => void,
    setCorrectingAnnotation: (value: boolean) => void, setCorrectingAnnotationData: (value: any) => void, setError: (value: boolean) => void, setErrorMessage: (value: string) => void
}) => {
    // delete confirmation prevents users from accidental deletion
    const [isDeleteConfirmationActive, setDeleteConfirmationActive] = useState(false);

    // 3 second timer to delete the confirmation
    useEffect(() => {
        deleteTimer(isDeleteConfirmationActive, setDeleteConfirmationActive);
    }, [isDeleteConfirmationActive]);

    return (
        <div className={annotationStyles.singleAnnotationWrapper}>
            <span className={annotationStyles.annotationModalText}>
                <Markdown remarkPlugins={[remarkGfm]}>
                    {annotation.description}
                </Markdown>
            </span>
            <div className={annotationStyles.annotationModalAuthorWrapper}>
                <span className={annotationStyles.annotationModalAuthor}>Annotation by:
                    <a href={`/guidedreader/profile/${annotation.author.discordId}`} className={annotationStyles.annotationModalAuthorLink}>
                        {annotation.author.username}
                    </a>
                </span>
                <div className={annotationStyles.annotationModalVotesWrapper}>
                    <Image
                        src={annotation.hasLiked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"}
                        alt="Upvote" width={22} height={22}
                        onClick={() => handleVote(true)}
                    />
                    <span className={annotationStyles.annotationModalVotes}>{annotation.votes}</span>
                    <Image
                        src={annotation.hasDisliked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"}
                        alt="Downvote" width={22} height={22} style={{ transform: 'rotate(180deg)' }}
                        onClick={() => handleVote(false)}
                    />
                    {userDetails && userDetails.user.discordId === annotation.author.discordId && (
                        <div className={annotationStyles.annotationChangeWrapper}>
                            <span className={annotationStyles.annotationEditButton} onClick={() => {
                                annotation.editing = true;
                                SetEditingAnnotation(setCurrentAnnotation, setCorrectingAnnotation, setCorrectingAnnotationData, annotation);
                            }}>Edit</span>
                            {isDeleteConfirmationActive ? (
                                <span className={annotationStyles.annotationEditButton} onClick={() => {
                                    handleDeleteAnnotation(annotation.id, setError, setErrorMessage);
                                }}>Are you sure?</span>
                            ) : (
                                <span className={annotationStyles.annotationEditButton} onClick={() => {
                                    setDeleteConfirmationActive(true);
                                }}>Delete</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// create annotation button
export const CreateAnnotationButton = ({ buttonPosition, isLoggedIn, setCreatingAnnotation, setCurrentAnnotation }:
    { buttonPosition: { x: number, y: number }, isLoggedIn: boolean, setCreatingAnnotation: (value: boolean) => void, setCurrentAnnotation: (value: string) => void }) => {
    return (
        <div
            className={annotationStyles.annotationPopup}
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
export const WritingAnnotationModal = ({ title, selectedText, annotationText, setAnnotationText, onSubmit, onClose }:
    { title: string, selectedText: string | null, annotationText: string, setAnnotationText: (value: string) => void, onSubmit: () => void, onClose: () => void }
) => {
    const [preview, setPreview] = useState(false);
    return (
        <div id="createAnnotationModal" className={annotationStyles.annotationModal}>
            <span className={annotationStyles.annotationModalTitle}><strong>{title}</strong></span>
            <span className={annotationStyles.annotationModalClose} onClick={onClose}>X</span>
            <div className={annotationStyles.annotationWrapper}>
                <span className={annotationStyles.annotationModalText}>
                    <b>{selectedText}</b>
                    {preview ? (
                        <div className={styles.markdownOverlay}>
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {annotationText}
                            </Markdown>
                        </div>
                    ) : (
                        <textarea className={annotationStyles.annotationTextarea} placeholder="Enter annotation here..." rows={18}
                            cols={60} value={annotationText} onChange={(e) => setAnnotationText(e.target.value)} />
                    )}
                </span>
                <span className={styles.informMarkdown}><a target="_blank" href="https://www.markdownguide.org/basic-syntax/">
                    Annotations are formatted with Markdown</a></span>
                <div className={annotationStyles.annotationModalButtons}>
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
export const CreatingAnnotationModal = ({ setSelectedText, selectedText, setCreatingAnnotation, setError, setErrorMessage, userDetails, currentTextID, charIndex }:
    {
        setSelectedText: (value: string) => void, selectedText: string, setCreatingAnnotation: (value: boolean) => void,
        setError: (value: boolean) => void, setErrorMessage: (value: string) => void, userDetails: any, currentTextID: number, charIndex: number
    }
) => {
    const [annotationText, setAnnotationText] = useState("");

    const handleSubmit = () => {
        handleSubmitAnnotation(selectedText, annotationText, setError, setErrorMessage, userDetails, currentTextID, charIndex);
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
export const CorrectingAnnotationModal = ({ setCreatingAnnotation, setError, setErrorMessage, userDetails, currentTextID, correctingAnnotationData }:
    {
        setCreatingAnnotation: (value: boolean) => void, setError: (value: boolean) => void,
        setErrorMessage: (value: string) => void, userDetails: any, currentTextID: number, correctingAnnotationData: any
    }
) => {
    const title = correctingAnnotationData.editing ? "Edit Annotation" : "Correct Annotation";
    const [annotationText, setAnnotationText] = useState("");
    const { start, end } = correctingAnnotationData;

    useEffect(() => {
        if (correctingAnnotationData.editing) {
            setAnnotationText(correctingAnnotationData.description);
        }
    }, [correctingAnnotationData.editing, correctingAnnotationData.description]);

    const handleSubmit = () => {
        // if the annotation is being edited & the text has changed
        if (correctingAnnotationData.editing) {
            if (annotationText == correctingAnnotationData.description) { return; }
            handleEditAnnotation(correctingAnnotationData.id, annotationText, setError, setErrorMessage);
        } else {
            handleSubmitAnnotation(null, annotationText, setError, setErrorMessage, userDetails, currentTextID, null, start, end);
        }
    };

    const handleClose = () => {
        hideAnnotationAnimation(null, "createAnnotationModal", setCreatingAnnotation);
    };

    return (
        <WritingAnnotationModal title={title} selectedText={null} annotationText={annotationText}
            setAnnotationText={setAnnotationText} onSubmit={handleSubmit} onClose={handleClose} />
    );
};