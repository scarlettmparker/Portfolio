import styles from '../styles/index.module.css';
import React, { useState, useEffect } from "react";
import { hideAnnotationButton, hideAnnotationAnimation, submitAnnotation, voteAnnotation } from "../utils/annotationutils";
import { BOT_LINK } from "../utils/helperutils";
import { Author } from '../types/types';
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
}

// get author data from the user id
const fetchAuthorData = async (userId: string, setAuthor: (author: Author | null) => void) => {
    const response = await fetch(`./api/guidedreader/getuserbyid?userId=${userId}`);
    const userData = await response.json();
    setAuthor(userData.user);
};

const checkLikeStatus = async (currentAnnotationData: any, userId: string, setHasLiked: (value: boolean) => void, setHasDisliked: (value: boolean) => void) => {
    // get the interaction data from the database
    const response = await fetch('./api/guidedreader/getannotationvotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            annotationId: currentAnnotationData.id,
            userId: userId
        })
    });

    // get the response data to check for interaction type
    const responseData = await response.json();
    if (responseData.interactionType === 'LIKE') {
        setHasLiked(true);
    } else if (responseData.interactionType === 'DISLIKE') {
        setHasDisliked(true);
    }
}

// annotation modal component
export const AnnotationModal: React.FC<AnnotationModalProps> = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, userDetails }) => {
    const [author, setAuthor] = useState<Author | null>(null);
    const [currentAnnotationId, setCurrentAnnotationId] = useState<number>(-1);
    const [hasLiked, setHasLiked] = useState<boolean>(false);
    const [hasDisliked, setHasDisliked] = useState<boolean>(false);
    const [votes, setVotes] = useState<number>(0);

    useEffect(() => {
        // get the current annotation data and set it
        const currentAnnotationId = currentText.text[currentLanguage].annotations.findIndex((annotation: { description: string; }) => annotation.description === currentAnnotation);
        const currentAnnotationData = currentText.text[currentLanguage].annotations[currentAnnotationId];
        const currentUserId = currentAnnotationData.userId;
        const likes = currentAnnotationData.likes;
        const dislikes = currentAnnotationData.dislikes;

        // check if the user has liked or disliked the annotation
        if (userDetails?.user) {
            checkLikeStatus(currentAnnotationData, userDetails.user.id, setHasLiked, setHasDisliked);
        }
        setCurrentAnnotationId(currentAnnotationData.id);
        setVotes(likes - dislikes);

        fetchAuthorData(currentUserId, setAuthor);
    }, [currentAnnotation, currentText, currentLanguage]);

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
                            <Image 
                                src={hasLiked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"} 
                                alt="Upvote" width={22} height={22} onClick={() => voteAnnotation(currentAnnotationId,
                                    userDetails, true, hasLiked, setHasLiked, hasDisliked, setHasDisliked, votes, setVotes)} 
                            />
                            <span className={styles.annotationVoteBackground}></span>
                            <span className={styles.annotationModalVotes}>{votes}</span>
                            <Image 
                                src={hasDisliked ? "/assets/guidedreader/images/upvote.png" : "/assets/guidedreader/images/unvote.png"} 
                                alt="Downvote" width={22} height={22} style={{ transform: 'rotate(180deg)' }} onClick={() =>
                                    voteAnnotation(currentAnnotationId, userDetails, false, hasLiked, setHasLiked, hasDisliked, setHasDisliked, votes, setVotes)} 
                            />
                            <span className={styles.annotationModalCorrection}>Submit Correction?</span>
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
};

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
