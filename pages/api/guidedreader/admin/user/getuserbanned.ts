import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.getUserBanned"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    // parse query parameters
    const { discordId } = req.query;
    if (!discordId || typeof discordId !== 'string') {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    try {
        const bannedUser = await prisma.bannedUser.findUnique({
            where: { discordId }
        });

        // return banned status and reason if banned
        if (bannedUser) {
            return res.status(200).json({ banned: true, reason: bannedUser.reason });
        } else {
            return res.status(200).json({ banned: false });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });