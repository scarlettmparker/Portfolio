import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { getToken } from 'next-auth/jwt';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    let discordId = req.body;

    // get token from request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }
    
    let user = await prisma.superUser.findFirst({
        where: {
            discordId: discordId,
        },
    });

    if (!user) {
        return res.status(404).json({ error: 'Super User not found' });
    } else {
        return res.status(200).json({ user });
    }
}

export default rateLimitMiddleware(handler);
