import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["text.getTextGroups"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // verify user permissions
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    try {
        // fetch all text groups
        const textGroups = await prisma.textGroup.findMany();

        return res.status(200).json(textGroups);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });