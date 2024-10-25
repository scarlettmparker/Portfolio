import { findAnnotationIndexes } from "./annotationutils";

const helper: React.FC = () => {
    return null;
};

export default helper;

// submit annotation to the database
export async function submitAnnotation(selectedText: string | null = null, annotationText: string, userDetails: any,
    currentTextID: number, charIndex: number | null = null, start: number | null = null, end: number | null = null): Promise<{ valid: boolean, error?: any }> {
    // get the current unix time
    const currentTime = Math.floor(Date.now() / 1000);
    let response = null;

    // send request to get raw text if start and end are not provided
    if (start === null && end === null && selectedText !== null && charIndex !== null) {
        response = await fetch('./api/guidedreader/getrawtext', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                textID: currentTextID
            })
        });

        let rawText = await response.json();
        const indexes = findAnnotationIndexes(selectedText, rawText.text, charIndex);
        start = indexes.start;
        end = indexes.end;
    }

    // structure the annotation
    const annotation = {
        start: start,
        end: end,
        description: annotationText,
        userId: userDetails.user.id,
        textId: currentTextID,
        creationDate: currentTime,
    };

    // send the annotation to the database
    response = await fetch('./api/guidedreader/annotation/submitannotation', {
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
        return { valid: false, error: data.error };
    } else {
        return { valid: true };
    }
}

// edit the annotation
export async function editAnnotation(annotationId: number, annotationText: string, userDetails: any): Promise<{ valid: boolean, error?: any }> {
    const annotation = {
        annotationId: annotationId,
        annotationText: annotationText,
    };

    // send the edited annotation to the database
    const response = await fetch('./api/guidedreader/annotation/editannotation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.user.auth}`
        },
        body: JSON.stringify(annotation)
    });

    const data = await response.json();
    if (data.error) {
        return { valid: false, error: data.error };
    } else {
        return { valid: true };
    }
}

export function deleteTimer(isDeleteConfirmationActive: boolean, setDeleteConfirmationActive: (value: boolean) => void) {
    let timer: NodeJS.Timeout;
    if (isDeleteConfirmationActive) {
        timer = setTimeout(() => {
            setDeleteConfirmationActive(false);
        }, 3000);
    }
    return () => clearTimeout(timer);
}

// delete the annotation
export async function deleteAnnotation(annotationId: number, userDetails: any) {
    const response = await fetch('./api/guidedreader/annotation/deleteannotation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.user.auth}`
        },
        body: JSON.stringify({ annotationId: annotationId })
    });

    const data = await response.json();
    if (data.error) {
        return { valid: false, error: data.error };
    } else {
        return { valid: true };
    }
}