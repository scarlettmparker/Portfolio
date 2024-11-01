import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.listTextAnnotations"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // verify user is a superuser
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    const textId = parseInt(req.query.textId as string, 10);
    if (!textId) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    // get all annotation data for a text
    try {
        const annotations = await prisma.annotation.findMany({
            where: {
                textId: textId
            },
            select: {
                id: true,
                textId: true,
                userId: true,
                description: true,
                creationDate: true
            }
        });
        return res.status(200).json(annotations);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });