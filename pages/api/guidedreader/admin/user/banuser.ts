import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.banUser"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    const {discordId, banned, reason} = req.body;
    const banReason = reason || "No reason provided.";

    // validate query parameters
    if (!discordId || typeof discordId !== 'string' || typeof banned !== 'boolean') {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    if (!banned && discordId === user.discordId) {
        return res.status(400).json({ error: "You cannot ban yourself" });
    }

    try {
        if (banned) {
            await prisma.bannedUser.delete({
                where: { discordId }
            });
        } else {
            await prisma.bannedUser.create({
                data: {
                    discordId,
                    reason: banReason
                }
            });
        }

        return res.status(200).json({ success: true, banned, banReason });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default rateLimitMiddleware(handler);