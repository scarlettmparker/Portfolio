import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const fs = require('fs');
    const path = require('path');

    const serverDataDirectory = path.join(process.cwd(), 'public/assets/minecraft/serverdata');
    const items = fs.readdirSync(serverDataDirectory);

    // get all directories in serverdata directory
    const directories = items.filter((item: string) => {
        const itemPath = path.join(serverDataDirectory, item);
        return fs.lstatSync(itemPath).isDirectory();
    });

    const directoryCount = directories.length;
    const playerDataDirectory = `public/assets/minecraft/serverdata/session`;

    let playerDataArray: any[] = [];

    // read all player data files and store their content
    for (let i = 1; i <= directories.length; i++) {
        const playerDataPath: string = path.join(process.cwd(), `${playerDataDirectory}${i}/playerbase.json`);
        if (fs.existsSync(playerDataPath)) {
            const fileContent: string = fs.readFileSync(playerDataPath, 'utf8');
            try {
                const jsonData = JSON.parse(fileContent);
                if (typeof jsonData === 'object') {
                    playerDataArray.push(jsonData);
                }
            } catch (error) {
                console.error(`Error parsing JSON from ${playerDataPath}:`, error);
            }
        }
    }

    let mergedPlayerData: { [key: string]: any } = {};

    if (playerDataArray.length > 0) {
        // initialize mergedPlayerData using the structure from the last JSON object
        const baseData = playerDataArray[playerDataArray.length - 1];
        for (const playerName in baseData) {
            if (baseData.hasOwnProperty(playerName)) {
                mergedPlayerData[playerName] = {
                    ...baseData[playerName],
                    lives: [],
                    tokens: []
                };
            }
        }

        // iterate through each player and accumulate lives and tokens
        playerDataArray.forEach((playerData) => {
            for (const playerName in playerData) {
                if (playerData.hasOwnProperty(playerName)) {
                    if (!mergedPlayerData[playerName]) {
                        mergedPlayerData[playerName] = { ...playerData[playerName], lives: [], tokens: [] };
                    }

                    // accumulate lives and tokens
                    mergedPlayerData[playerName].lives.push(playerData[playerName].lives);
                    mergedPlayerData[playerName].tokens.push(playerData[playerName].tokens);
                }
            }
        });
    }
    return res.status(200).json(mergedPlayerData);
}