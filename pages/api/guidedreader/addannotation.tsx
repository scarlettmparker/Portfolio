import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // get annotation info from request link
    const { start, end, description, userId, textId, creationDate } = req.body;

    // create annotation
    let annotation = await prisma.annotation.create({
        data: {
            start: start,
            end: end,
            description: description,
            userId: userId,
            textId: textId,
            creationDate: creationDate
        }
    });

    if (!annotation) {
        return res.status(500).json({ error: 'Failed to create annotation' });
    }

    return res.status(200).json(annotation);
}