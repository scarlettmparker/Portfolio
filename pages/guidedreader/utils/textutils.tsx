import { Text, TextObject } from '../types/types';

const helper: React.FC = () => {
    return null;
};

export default helper;

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