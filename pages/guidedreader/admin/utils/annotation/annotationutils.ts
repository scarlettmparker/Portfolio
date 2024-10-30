const helper: React.FC = () => {
    return null;
};

export const PAGE_LENGTH: number = 10;

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

export const fetchAllAnnotations = async (textId: number, setAnnotations: (value: any[]) => void) => {
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

export default helper;