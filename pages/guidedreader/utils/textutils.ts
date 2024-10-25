import { Text, TextObject } from '../types/types';

const helper: React.FC = () => {
    return null;
};

export default helper;

export const LEVELS_ORDER = ['Α1', 'Α1 (8-12)', 'Α2', 'Β1', 'Β2', 'Γ1', 'Γ2'];
const LEVELS_ORDER_REVERSED = [...LEVELS_ORDER].reverse();
const LEVEL_GROUPS = { 'Α1': ['Α1', 'Α1 (8-12)'], 'Α2': ['Α2'], 'Β1': ['Β1'], 'Β2': ['Β2'], 'Γ1': ['Γ1'], 'Γ2': ['Γ2'] };

// get database data for the default texts
export const fetchData = async () => {
    let data = await getTextDataFromDB();
    // if the database is empty, fetch the text data from the api
    if (data.length == 0) {
        let fetchedTexts = await fetchTextTitles();
        fetchedTexts = await fetchTextData(fetchedTexts);

        // add the fetched texts to the database
        const responses = await addTextsToDB(fetchedTexts.results);
        const allSuccess = responses.every(response => response.message === 'Text object created/updated successfully');

        if (!allSuccess) {
            console.error("Some texts could not be added to the database", responses);
        }
    }
    return data;
};

export const fetchText = async (textId: number) => {
    let response = await fetch('./api/guidedreader/loadtextdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textId }),
    });
    return response.json();
};

// fetch the text data for the current text
export const fetchCurrentTextData = async (textData: TextObject[], currentText: number, setTextData: { (value: any): void; }, setCurrentTextID: { (value: number): void;}) => {
    if (textData[currentText] && !textData[currentText].text) {
        const textID = textData[currentText].id;
        const currentTextData = await fetchText(textID);

        // update the text data with the fetched text data
        setTextData((prevTextData: any) => {
            const updatedTextData = [...prevTextData];
            updatedTextData[currentText] = {
                ...updatedTextData[currentText],
                text: currentTextData.text
            };
            return updatedTextData;
        });

        setCurrentTextID(textID);
    }
};

// filter text data based on selected levels and search term
export const filterTextData = (textData: any[], selectedLevels: any[], searchTerm: string) => {
    const filteredTextData = textData.filter(({ title, level }) => {
        const inSelectedLevels = selectedLevels.some(selectedLevel => LEVEL_GROUPS[selectedLevel as keyof typeof LEVEL_GROUPS].includes(level));
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
        return inSelectedLevels && matchesSearch;
    });

    return { filteredTextData };
};

// observer for level separators
export const observeLevelSeparators = (textListRef: React.RefObject<HTMLDivElement>, setCurrentLevel: { (level: string): void; }) => {
    const observer = new IntersectionObserver((entries) => {
        let intersectingLevels = new Set<string>();

        // find the level separator that is intersecting
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const level = entry.target.getAttribute('data-level') || '';
                intersectingLevels.add(level);
            }
        });

        if (intersectingLevels.size > 1) {
            setCurrentLevel("none");
        } else if (intersectingLevels.size === 1) {
            setCurrentLevel(Array.from(intersectingLevels)[0]);
        }
    }, { threshold: 0.5 });

    const elements = textListRef.current?.querySelectorAll('.levelSeparator');
    elements?.forEach(el => observer.observe(el));

    return () => {
        elements?.forEach(el => observer.unobserve(el));
    };
};

// sort the text data based on the selected sort option
export const sortTextData = (textData: any, levelSeparators: any, sortOption: string) => {
    const levelOrder = sortOption === 'Level A-C' ? LEVELS_ORDER : LEVELS_ORDER_REVERSED;

    const sortedTextData = [...textData].sort((a, b) => {
        return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    });

    const sortedLevelSeparators = [...levelSeparators].map(separator => {
        const sortedIndex = sortedTextData.findIndex(text => text.level === separator.level);
        return { ...separator, index: sortedIndex };
    });

    return { sortedTextData, sortedLevelSeparators };
};

// fetch text titles from the api
async function fetchTextTitles() {
    const response = await fetch('./api/guidedreader/fetchtitles', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    return data;
}

// fetch text data from the api using each title
async function fetchTextData(texts: Text[]) {
    const response = await fetch('./api/guidedreader/fetchdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts)
    });
    const data = await response.json();
    return data;
}

// add texts to the database
async function addTextsToDB(texts: TextObject[]) {
    // type check the texts
    if (!Array.isArray(texts)) {
        throw new Error("Expected texts to be an array");
    }

    const responses = [];

    // go through each text and add it to the database
    for (const textObject of texts) {
        const response = await fetch('./api/guidedreader/addtext', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: textObject.title,
                level: textObject.level,
                text: textObject.text,
                language: 'GR',
            }),
        });
        responses.push(await response.json());
    }

    return responses;
}

// get text data from the database
async function getTextDataFromDB() {
    const response = await fetch('./api/guidedreader/fetchdbdata');
    return response.json();
}