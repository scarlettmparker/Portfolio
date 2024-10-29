import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.getUserRestricted"];

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
        const restrictedUser = await prisma.restrictedUser.findUnique({
            where: { discordId }
        });

        // return banned status and reason if restricted
        if (restrictedUser) {
            return res.status(200).json({ restricted: true, reason: restrictedUser.reason });
        } else {
            return res.status(200).json({ restricted: false });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default rateLimitMiddleware(handler);