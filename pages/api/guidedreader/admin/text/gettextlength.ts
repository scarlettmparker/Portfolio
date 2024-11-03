import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.listNumTexts"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // verify user is a superuser
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    // extract search query from headers
    const searchQuery = req.query.filter as string;
    console.log(searchQuery);

    // get the number of texts that match the search query
    const textCount = await prisma.textObject.count({
        where: {
            title: {
                contains: searchQuery,
                mode: 'insensitive'
            }
        }
    });

    return res.status(200).json({ textCount });
}

export default rateLimitMiddleware(handler, { privacy: true });