const helper: React.FC = () => {
    return null;
};

export default helper;

export const PAGE_LENGTH: number = 10;

export const fetchAllTexts = async (setNumTexts: (value: number) => void, filter: string) => {
    try {
        // fetch number of texts available
        const response = await fetch(`/api/guidedreader/admin/text/gettextlength?filter=${filter}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update count
        const data = await response.json();
        setNumTexts(data.textCount);
    } catch (error) {
        console.error('Error fetching text data:', error);
    }
}

export const fetchTextData = async (pageIndex: number, setTexts: (value: any[]) => void, filter: string) => {
    try {
        // fetch text data
        const response = await fetch(`/api/guidedreader/admin/text/gettexts?pageIndex=${pageIndex}&pageLength=${PAGE_LENGTH}&filter=${filter}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update texts
        const data = await response.json();
        setTexts(data);
    } catch (error) {
        console.error('Error fetching text data:', error);
    }
}