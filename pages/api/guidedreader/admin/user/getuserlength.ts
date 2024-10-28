import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // get the token from the request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }

    // get the user from the token
    const user = await prisma.user.findFirst({
        where: { auth: token },
    });

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized! User not found.' });
    }

    // ensure the user is a superuser
    let superUser = await prisma.superUser.findFirst({
        where: {
            discordId: user.discordId,
        },
    });

    if (!superUser) {
        return res.status(403).json({ error: 'Unauthorized! User is not a super user.' });
    }

    // get the number of users
    const userCount = await prisma.user.count();
    return res.status(200).json({ userCount });
}

export default rateLimitMiddleware(handler);