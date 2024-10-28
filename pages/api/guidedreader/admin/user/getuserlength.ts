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

}

export default rateLimitMiddleware(handler);