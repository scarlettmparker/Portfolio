import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler (req: NextApiRequest, res: NextApiResponse) {
    const textID = req.body.textID;
    try {
        const text = await prisma.text.findUnique({
            where: {
                id: textID,
            },
        });
        res.status(200).json(text);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch text', details: error });
    }
}

export default rateLimitMiddleware(handler);