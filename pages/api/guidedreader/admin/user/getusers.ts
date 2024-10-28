import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.listUsers"];

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

    // fetch users from the database with pagination
    try {
        const users = await prisma.user.findMany({
            skip: pageIndex * pageLength,
            take: pageLength,
            orderBy: {
                id: 'asc'
            }
        });
        
        // return only the necessary user details
        const userDetails = users.map(user => ({
            discordId: user.discordId,
            username: user.username,
            avatar: user.avatar,
            levels: user.levels,
            nickname: user.nickname,
            accountCreationDate: user.accountCreationDate
        }));
        
        return res.status(200).json(userDetails);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default rateLimitMiddleware(handler);