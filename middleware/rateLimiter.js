const rateLimitMap = new Map();

import { parse } from 'cookie';
import prisma from '../pages/api/prismaclient';

export default function rateLimitMiddleware(handler, options = {}) {
    const { limit = 10, windowMs = 1000, privacy = false } = options;

    return async (req, res) => {
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        
        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, {
                count: 0,
                lastReset: Date.now(),
            });
        }
        
        const ipData = rateLimitMap.get(ip);
        
        if (Date.now() - ipData.lastReset > windowMs) {
            ipData.count = 0;
            ipData.lastReset = Date.now();
        }
        
        if (ipData.count >= limit) {
            return res.status(429).send("Too Many Requests");
        }
        
        ipData.count += 1;
        
        if (!privacy) {
            return handler(req, res);
        }
        
        // get token from request
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
        }

        const user = await prisma.user.findFirst({
            where: { auth: token },
        });

        if (user && !user.acceptedPolicy) {
            return res.status(401).json({ error: 'Please accept the Terms of Service.' });
        }

        return handler(req, res);
    };
}