import roles from '../data/roles.json';
import { TextObject } from '../types/types';

const helper: React.FC = () => {
    return null;
};

export default helper;


// helper function to clear cookies
export const clearCookies = () => {
    const userCookies = ['token'];
    userCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
    });
};

// get user details using auth token
export async function getUserDetails(auth: string) {
    return fetch('./api/guidedreader/auth/getuser', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
    });
}

// helper function
export const getRoleByLevel = (level: string) => {
    return roles.find(role => role.id === level);
};

// section off text data by level
export function findLevelSeparators(textData: TextObject[]) {
    const levelSeparators: { index: number, level: string }[] = [];
    let currentLevel = textData[0].level;
    levelSeparators.push({ index: 0, level: currentLevel });

    // find all level separators
    for (let i = 1; i < textData.length; i++) {
        if (textData[i].level !== currentLevel) {
            // add the level separator if it isn't equal to the previous one
            currentLevel = textData[i].level;
            levelSeparators.push({ index: i, level: currentLevel });
        }
    }

    return levelSeparators;
}