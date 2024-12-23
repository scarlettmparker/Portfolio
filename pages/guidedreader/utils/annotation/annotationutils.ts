import styles from '../../styles/index.module.css';
const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK;

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

    if (!userDetails) {
        window.location.href = BOT_LINK!
        return;
    }

    // vote data
    const data = {
        annotationId: currentAnnotationId,
        userId: userDetails.user.id,
        isLike: like
    }

    // send the vote to the database with api endpoint
    const response = await fetch('./api/guidedreader/annotation/voteannotation', {
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

    // calculate the new votes based on the current state
    let voteChange = 0;
    if (hasLiked) {
        voteChange -= like ? 1 : 2;
    } else if (hasDisliked) {
        voteChange += like ? 2 : 1;
    } else {
        voteChange += like ? 1 : -1;
    }

    // update the like/dislike state visually
    setVotes(votes + voteChange);
    setHasLiked(like ? !hasLiked : hasLiked && false);
    setHasDisliked(!like ? !hasDisliked : hasDisliked && false);
}

export const fetchAnnotations = async (currentText: any, currentLanguage: string, currentAnnotationData: any, userDetails: any, setAnnotations: React.Dispatch<React.SetStateAction<any[]>>) => {
    const fetchedAnnotations = currentText.text[currentLanguage].annotations;

    // get the author and votes data for each annotation and filter based on the start and end
    const annotationsWithDetails = await Promise.all(
        fetchedAnnotations
            .filter((annotation: any) => annotation.start === currentAnnotationData.start && annotation.end === currentAnnotationData.end)
            .map(async (annotation: any) => {
                // get the author and votes data
                const author = await fetchAuthorData(annotation.userId);
                let votesData;
                if (userDetails?.user) {
                    votesData = await checkLikeStatus(annotation.id, userDetails?.user?.id);
                }

                return {
                    ...annotation,
                    author,
                    hasLiked: votesData ? votesData.interactionType === 'LIKE' : false,
                    hasDisliked: votesData ? votesData.interactionType === 'DISLIKE' : false,
                    votes: annotation.likes - annotation.dislikes,
                };
            })
    );

    // sort the annotations based on votes
    const sortedAnnotations = annotationsWithDetails.sort((a: any, b: any) => b.votes - a.votes);
    setAnnotations(sortedAnnotations);
};

// handle the voting for the annotation
export const handleVote = async (annotationId: number, like: boolean, index: number, annotations: any[], setAnnotations: React.Dispatch<React.SetStateAction<any[]>>, userDetails: any) => {
    const annotation = annotations[index];
    const newVotes = { ...annotation };

    // update the votes
    await voteAnnotation(annotationId, userDetails, like, annotation.hasLiked, (value: boolean) => (newVotes.hasLiked = value), annotation.hasDisliked,
        (value: boolean) => (newVotes.hasDisliked = value), annotation.votes, (value: number) => (newVotes.votes = value));

    const updatedAnnotations = [...annotations];
    updatedAnnotations[index] = newVotes;
    setAnnotations(updatedAnnotations);
};

// do the annotation animation for the modal
export function hideAnnotationAnimation(setCurrentAnnotation: ((value: string) => void) | null, elementToHide: string, setCreatingAnnotation?: (value: boolean) => void) {
    let annotationModal = document.getElementById(elementToHide);
    if (annotationModal) {
        // apply initial styles for the transition
        annotationModal.style.transition = 'transform 1s';
        annotationModal.style.transform = 'translateX(120%)';
    }

    // wait for the modal to be hidden before resetting the annotation
    setTimeout(() => {
        if (setCurrentAnnotation) {
            setCurrentAnnotation('');
        }
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

// get author data from the user id
const fetchAuthorData = async (userId: string) => {
    const response = await fetch(`./api/guidedreader/getuserbyid?userId=${userId}`);
    const userData = await response.json();
    return userData.user;
};

// get votes for the annotation
const checkLikeStatus = async (annotationId: number, userId: string) => {
    const response = await fetch('./api/guidedreader/annotation/getannotationvotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            annotationId: annotationId,
            userId: userId,
        }),
    });
    return await response.json();
};

export function findAnnotationIndexes(selectedText: string, rawText: string, charIndex: number) {
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