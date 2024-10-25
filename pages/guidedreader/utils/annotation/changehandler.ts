import { deleteAnnotation, editAnnotation, submitAnnotation } from "./changeannotation";

const helper: React.FC = () => {
    return null;
};

export default helper;

export const handleSubmitAnnotation = async (selectedText: string | null, annotationText: string, setError: (value: boolean) => void, setErrorMessage: (value: string) => void,
    userDetails: any, currentTextID: number, charIndex: number | null = null, start: number | null = null, end: number | null = null) => {
    let result = await submitAnnotation(selectedText, annotationText, userDetails, currentTextID, charIndex, start, end);

    // successfully submitted annotation
    if (result.valid) {
        window.location.reload();
    } else {
        setError(true);
        setErrorMessage(result.error);
    }
};

export const handleEditAnnotation = async (annotationID: number, annotationText: string, setError: (value: boolean) => void, setErrorMessage: (value: string) => void, userDetails: any, currentTextID: number) => {
    let result = await editAnnotation(annotationID, annotationText, userDetails);

    // successfully submitted annotation
    if (result.valid) {
        window.location.reload();
    } else {
        setError(true);
        setErrorMessage(result.error);
    }
}

export const handleDeleteAnnotation = async (annotationID: number, userDetails: any, setError: (value: boolean) => void, setErrorMessage: (value: string) => void) => {
    let result = await deleteAnnotation(annotationID, userDetails);

    // successfully deleted annotation
    if (result.valid) {
        window.location.reload();
    } else {
        setError(true);
        setErrorMessage(result.error);
    }
}