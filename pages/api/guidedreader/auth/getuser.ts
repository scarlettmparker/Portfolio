import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = req.headers.authorization;

    // verify the user's token
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findFirst({
        where: {
            auth: token
        }
    });

    // check if the user exists
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ user: user });
}

export default rateLimitMiddleware(handler);