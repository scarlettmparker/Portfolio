import roles from '../data/roles.json';
import { IncomingMessage } from 'http';
import { TextObject } from '../types/types';
import { NextApiRequest } from 'next';

const helper: React.FC = () => {
    return null;
};

export default helper;

export const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK;

// helper function to clear cookies
export const clearCookies = () => {
    const userCookies = ['token'];
    userCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
    });
};

// get user details using auth token
export async function getUserDetails(auth: string, req: IncomingMessage) {
    const nextApiReq = req as NextApiRequest;

    // construct the base URL using the request object
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${nextApiReq.headers.host}`;
    const url = `${baseUrl}/api/guidedreader/auth/getuser`;

    // uses absolute url due to ?textId stuff and other query params
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
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