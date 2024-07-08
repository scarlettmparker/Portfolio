import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const galleryDirectory = path.join(process.cwd(), 'public/assets/minecraft/images/gallery');
    const files = fs.readdirSync(galleryDirectory);

    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
    const pngCount = pngFiles.length;

    res.status(200).json({ pngCount });
}