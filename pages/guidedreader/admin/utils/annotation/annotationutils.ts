import { PAGE_LENGTH } from "../consts";

const helper: React.FC = () => {
    return null;
};

export default helper;
export const fetchNumAnnotations = async (setNumAnnotations: (value: number) => void) => {
    try {
        // fetch number of annotations available
        const response = await fetch('/api/guidedreader/admin/annotation/getannotationlength', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update count
        const data = await response.json();
        setNumAnnotations(data.annotationCount);
    } catch (error) { 
        console.error('Error fetching annotation data:', error);
    }
}

export const fetchAllAnnotations = async (pageIndex: number, setAnnotations: (value: any[]) => void) => {
    try {
        // fetch annotation data
        const response = await fetch(`/api/guidedreader/admin/annotation/getannotations?pageIndex=${pageIndex}&pageLength=${PAGE_LENGTH}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // get response and update annotations
        const data = await response.json();
        setAnnotations(data);
    } catch (error) {
        console.error('Error fetching annotation data:', error);
    }
}

export const fetchTextAnnotations = async (textId: number, setAnnotations: (value: any[]) => void) => {
    try {
        // fetch annotation data
        const response = await fetch(`/api/guidedreader/admin/annotation/gettextannotations?textId=${textId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // get response and update annotations
        const data = await response.json();
        setAnnotations(data);
    } catch (error) {
        console.error('Error fetching annotation data:', error);
    }
}

// numbers: [annotation id, text id]
export const handleDeleteAnnotationAdmin = async (annotations: Set<[number, number]>) => {
    try {
        // delete selected annotations
        await fetch('/api/guidedreader/admin/annotation/deleteannotation', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ annotations: Array.from(annotations) }),
        });
    } catch (error) {
        console.error('Error deleting annotation:', error);
    }
}

export const editAnnotation = async (annotationId: number, description: string) => {
    try {
        // edit annotation
        await fetch('/api/guidedreader/admin/annotation/editannotation', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ annotationId, description }),
        });
    } catch (error) {
        console.error('Error editing annotation:', error);
    }
}