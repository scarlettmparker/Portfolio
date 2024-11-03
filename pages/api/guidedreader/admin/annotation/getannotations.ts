import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["annotation.listAnnotations"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // verify user is a superuser
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    // parse query parameters
    const pageIndex = parseInt(req.query.pageIndex as string, 10);
    const pageLength = parseInt(req.query.pageLength as string, 10);

    if (isNaN(pageIndex) || isNaN(pageLength) || pageIndex < 0 || pageLength <= 0) {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    try {
        // fetch annotations from the database with pagination
        const annotations = await prisma.annotation.findMany({
            skip: pageIndex,
            take: pageLength,
            orderBy: {
                id: 'asc'
            }
        });

        return res.status(200).json(annotations);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });