import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt'; // Import bcrypt for hashing
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

    // check if the user exists
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // return only necessary user information
    const { username, discordId, avatar, nickname, levels } = user;
    return res.status(200).json({ user: { username, discordId, avatar, nickname, levels } });
}

export default rateLimitMiddleware(handler);