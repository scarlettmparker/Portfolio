    import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // get token from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }

    const user = await prisma.user.findFirst({
        where: { auth: token },
    });

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized! User not found.' });
    }

    if (user.acceptedPolicy) {
        return res.status(400).json({ error: 'Policy already accepted!' });
    }

    // set user to accept privacy policy
    await prisma.user.update({
        where: { id: user.id },
        data: { acceptedPolicy: true },
    });

    return res.status(200).json({ message: 'Policy accepted successfully.' });
}

export default rateLimitMiddleware(handler);