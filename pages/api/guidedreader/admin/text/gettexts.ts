import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.listTexts"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // verify user is a superuser
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    // parse query parameters
    const pageIndex = parseInt(req.query.pageIndex as string, 10);
    const pageLength = parseInt(req.query.pageLength as string, 10);
    const searchQuery = req.query.filter as string;

    if (isNaN(pageIndex) || isNaN(pageLength) || pageIndex < 0 || pageLength <= 0) {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    // fetch texts from the database with pagination
    try {
        const textObjects = await prisma.textObject.findMany({
            skip: pageIndex,
            take: pageLength,
            orderBy: {
                id: 'asc'
            },
            where: {
                title: {
                    contains: searchQuery,
                    mode: 'insensitive'
                }
            },
            include: {
                text: {
                    select: {
                        id: true,
                        audio: true,
                        language: true
                    }
                }
            }
        });

        const texts = textObjects.flatMap(textObject => 
            textObject.text.map(text => ({
                ...textObject,
                ...text,
                textObjectId: textObject.id
            }))
        );

        return res.status(200).json(texts);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });