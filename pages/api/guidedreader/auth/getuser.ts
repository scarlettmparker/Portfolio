import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers.authorization;

    // ensure auth header is present
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // verify the user's token in the database
    const user = await prisma.user.findFirst({
        where: {
            auth: token
        }
    });

    if (user) {
        // check if the user is banned
        let bannedUser = await prisma.bannedUser.findUnique({
            where: {
                discordId: user.discordId,
            },
        });
        if (bannedUser) {
            return res.status(403).json({ error: 'User is banned. Reason: ' + bannedUser.reason });
        }
    }

    // check if the user exists
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // return only necessary user information
    const { id, username, discordId, avatar, nickname, levels } = user;
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`);
    return res.status(200).json({ user: { id, username, discordId, avatar, nickname, levels } });
}

export default rateLimitMiddleware(handler);