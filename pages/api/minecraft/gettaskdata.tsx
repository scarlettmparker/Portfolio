import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const data = JSON.parse(req.body);
    let session = data.session;

    const taskDirectory = `public/assets/minecraft/serverdata/session${session}/taskbase.json`;

    fs.readFile(taskDirectory, 'utf8', (err, fileContent) => {
        if (err) {
            res.status(500).json({ error: 'Failed to read the file' });
            return;
        }

        try {
            const taskData = JSON.parse(fileContent);
            res.status(200).json(taskData);
        } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse JSON' });
        }
    });
}