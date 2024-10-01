import { SetStateAction } from 'react';
import styles from '../styles/index.module.css';

const helper: React.FC = () => {
    return null;
};

export default helper;

export function hideAnnotationButton(setCreatingAnnotation: (value: boolean) => void) {
    setCreatingAnnotation(true);
};

// submit vote for the annotation to database
export async function voteAnnotation(currentAnnotationId: number, userDetails: any, like: boolean, hasLiked: boolean,
    setHasLiked: (value: boolean) => void, hasDisliked: boolean, setHasDisliked: (value: boolean) => void, votes: number, setVotes: (value: number) => void) {

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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.user.auth}`
        },
        body: JSON.stringify(data)
    });

    // get the response data to check for errors
    const responseData = await response.json();
    if (responseData.error) {
        console.error(responseData.error);
        return;
    }

    // update the like/dislike state visually
    setHasLiked(like ? !hasLiked : hasLiked && false);
    setHasDisliked(!like ? !hasDisliked : hasDisliked && false);

    // adjust the vote count based on the response message
    let newVotes = votes;
    const voteChanges: { [key: string]: number } = {
        liked: hasDisliked ? 2 : 1,
        disliked: hasLiked ? -2 : -1,
        unliked: -1,
        undisliked: 1
    };
    
    // get the message from the response data
    const message: keyof typeof voteChanges = responseData.message;
    if (voteChanges[message] !== undefined) {
        newVotes += voteChanges[message];
    }

    // update the votes state
    setVotes(newVotes);
}

// submit annotation to the database
export async function submitAnnotation(selectedText: string, annotationText: string, userDetails: any, currentTextID: number, charIndex: number) {
    // get the current unix time
    const currentTime = Math.floor(Date.now() / 1000);

    // send request to get raw text
    let response = await fetch('./api/guidedreader/getrawtext', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            textID: currentTextID
        })
    });

    let rawText = await response.json();
    const { start, end } = findAnnotationIndexes(selectedText, rawText.text, charIndex);

    // structure the annotation
    const annotation = {
        start: start,
        end: end,
        description: annotationText,
        userId: userDetails.user.id,
        textId: currentTextID,
        creationDate: currentTime
    };

    // send the annotation to the database
    response = await fetch('./api/guidedreader/addannotation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.user.auth}`
        },
        body: JSON.stringify(annotation)
    });

    // get the response from the server
    const data = await response.json();
    if (data.error) {
        console.error("Failed to add annotation", data);
    } else {
        console.log("Annotation added successfully", data);
        window.location.reload();
    }
}

// do the annotation animation for the modal
export function hideAnnotationAnimation(setCurrentAnnotation: (value: string) => void, elementToHide: string, setCreatingAnnotation?: (value: boolean) => void) {
    let annotationModal = document.getElementById(elementToHide);
    annotationModal?.classList.add(styles.annotationModalHidden);

    // wait for the modal to be hidden before setting resetting the annotation
    setTimeout(() => {
        setCurrentAnnotation('');
        if (elementToHide == "createAnnotationModal" && setCreatingAnnotation) {
            setCreatingAnnotation(false);
        }
    }, 500);
}


// deal with annotation clicks since injecting html is awkward
export const handleAnnotationClick = (event: Event, currentAnnotation: string, setCurrentAnnotation: (value: string) => void) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains(styles.annotatedText)) {
        // get the description from the attribute
        const description = target.getAttribute('data-description');
        if (description) {
            displayAnnotatedText(decodeURIComponent(description), currentAnnotation, setCurrentAnnotation);
        }
    }
};

function findAnnotationIndexes(selectedText: string, rawText: string, charIndex: number) {
    // find the start index in the stripped text
    const start = charIndex;
    const cleanedSelectedText = selectedText.replace(/\n/g, '');
    let end = start + cleanedSelectedText.length;

    if (start === -1 || end > rawText.length) {
        throw new Error("Selected text not found in stripped text.");
    }

    return { start: start, end: end };
}

// show the annotation animation for the modal
function showAnnotationAnimation(description: string, setCurrentAnnotation: (value: string) => void) {
    let annotationModal = document.getElementById('annotationModal');
    annotationModal?.classList.remove(styles.annotationModalHidden);
    setCurrentAnnotation(description);
}

// display the annotation text in the modal, and display the modal
function displayAnnotatedText(description: string, currentAnnotation: string, setCurrentAnnotation: (value: string) => void) {
    if (currentAnnotation == description) {
        hideAnnotationAnimation(setCurrentAnnotation, 'annotationModal');
        return;
    }
    showAnnotationAnimation(description, setCurrentAnnotation);
}