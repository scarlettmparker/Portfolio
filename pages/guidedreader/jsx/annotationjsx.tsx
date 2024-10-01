import styles from '../styles/index.module.css';
import React, { useState, useEffect } from "react";
import { hideAnnotationButton, hideAnnotationAnimation, submitAnnotation } from "../utils/annotationutils";
import { Author } from '../types/types';
import Image from 'next/image';

const helper: React.FC = () => {
    return null;
};

export default helper;

const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK;

// annotation modal props
interface AnnotationModalProps {
    setCurrentAnnotation: (value: string) => void;
    currentAnnotation: string;
    currentLanguage: number;
    currentText: number;
    userDetails: any;
    textData: any;
}

// get author data from the user id
const fetchAuthorData = async (userId: string, setAuthor: (author: Author | null) => void) => {
    const response = await fetch(`./api/guidedreader/getuserbyid?userId=${userId}`);
    const userData = await response.json();
    setAuthor(userData);
};

// annotation modal component
export const AnnotationModal: React.FC<AnnotationModalProps> = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, textData, userDetails }) => {
    const [author, setAuthor] = useState<Author | null>(null);
    const [likes, setLikes] = useState<number>(0);
    const [dislikes, setDislikes] = useState<number>(0);
    const [currentAnnotationId, setCurrentAnnotationId] = useState<number>(-1);
    const [hasLiked, setHasLiked] = useState<boolean>(false);
    const [hasDisliked, setHasDisliked] = useState<boolean>(false);

    useEffect(() => {
        // get the current annotation data and set it
        const currentAnnotationId = textData[currentText].text[currentLanguage].annotations.findIndex((annotation: { description: string; }) => annotation.description === currentAnnotation);
        const currentAnnotationData = textData[currentText].text[currentLanguage].annotations[currentAnnotationId];
        const currentUserId = currentAnnotationData.userId;

        setLikes(currentAnnotationData.likes);
        setDislikes(currentAnnotationData.dislikes);
        setCurrentAnnotationId(currentAnnotationData.id);

        fetchAuthorData(currentUserId, setAuthor);
    }, [currentAnnotation, currentText, currentLanguage, textData]);

    return (
        <div id="annotationModal" className={styles.annotationModal}>
            <span className={styles.annotationModalTitle}><strong>Annotation</strong></span>
            <span className={styles.annotationModalClose} onClick={() => {
                hideAnnotationAnimation(setCurrentAnnotation, "annotationModal");
            }}>X</span>
            <div className={styles.annotationWrapper}>
                <span className={styles.annotationModalText} dangerouslySetInnerHTML={{ __html: currentAnnotation }}></span>
                <span className={styles.annotationModalAuthorWrapper}>
                    <span className={styles.annotationModalAuthor}>Annotation by: <b>{author ? author.username : 'Loading...'} </b>
                        <span className={styles.annotationModalVotesWrapper}>
                            <Image src="/assets/guidedreader/images/upvote.png" alt="Upvote"
                            width={22} height={22} onClick={() => voteAnnotation(currentAnnotationId, userDetails, true)}></Image>
                            <span className={styles.annotationModalVotes}>{likes - dislikes}</span>
                            <Image src="/assets/guidedreader/images/upvote.png" alt="Upvote" width={22} height={22}
                                style={{ transform: 'rotate(180deg)' }} onClick={() => voteAnnotation(currentAnnotationId, userDetails, false)}></Image>
                            <span className={styles.annotationModalCorrection}>Submit Correction?</span>
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
};

// submit vote for the annotation to database
async function voteAnnotation(currentAnnotationId: number, userDetails: any, like: boolean) {
    // vote data
    const data = {
        annotationId: currentAnnotationId,
        userId: userDetails.user.id,
        isLike: like
    }

    // send the vote to the database with api endpoint
    const response = await fetch('./api/guidedreader/voteannotation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    // get the response data to check for errors
    const responseData = await response.json();
    if (responseData.error) {
        console.error(responseData.error);
    }

    
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
