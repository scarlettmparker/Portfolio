import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // get annotation info from request link
    const { start, end, description, userId, textId, creationDate } = req.body;

    // get token from request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

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