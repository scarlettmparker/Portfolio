import { PAGE_LENGTH } from "../consts";

const helper: React.FC = () => {
    return null;
};

export default helper;

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

export const changeTextLevel = async (textId: number[], level: number) => {
    try {
        // update text level
        await fetch(`/api/guidedreader/admin/text/changetextlevel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ textId, level })
        });
    } catch (error) {
        console.error('Error changing text level:', error);
    }
}

export const handleDeleteText = async (textId: number[]) => {
    try {
        // delete text
        await fetch(`/api/guidedreader/admin/text/deletetext`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ textId })
        });
    } catch (error) {
        console.error('Error deleting text:', error);
    }
}

// add VTT to text
export const addVTTtoText = async (textId: number, audioFile: File, vttFile: File) => {
    try {
        const formData = new FormData();

        // add each file to form data
        formData.append('textId', textId.toString());
        formData.append('author', 'Learning Greek Server'); // temporary will add a field for this
        formData.append('link', 'https://discord.gg/greek'); // temporary will add a field for this
        formData.append('audio', audioFile);
        formData.append('vtt', vttFile);

        await fetch(`/api/guidedreader/admin/text/addvtt`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Error adding VTT to text:', error);
    }
}

export const getTextGroups = async (setGroups: (value: any[]) => void) => {
    try {
        // fetch text groups
        const response = await fetch(`/api/guidedreader/admin/text/gettextgroups`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update groups
        const data = await response.json();
        setGroups(data);
    } catch (error) {
        console.error('Error fetching text groups:', error);
    }
}

export const changeTextGroup = async (textId: number[], groupId: number) => {
    try {
        // update text group
        await fetch(`/api/guidedreader/admin/text/changetextgroup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ textId, groupId })
        });
    } catch (error) {
        console.error('Error changing text group:', error);
    }
}