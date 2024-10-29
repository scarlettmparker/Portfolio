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

    const { discordId, restricted, reason } = req.body;
    const restrictReason = reason || "No reason provided.";

    // validate query parameters
    if (!discordId || typeof discordId !== 'string' || typeof restricted !== 'boolean') {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    if (!restricted && discordId === user.discordId) {
        return res.status(400).json({ error: "You cannot restrict yourself" });
    }

    try {
        if (restricted) {
            await prisma.restrictedUser.delete({
                where: { discordId }
            });
        } else {
            await prisma.restrictedUser.create({
                data: {
                    discordId,
                    reason: restrictReason
                }
            });
        }

        return res.status(200).json({ success: true, restricted, restrictReason });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export default rateLimitMiddleware(handler);