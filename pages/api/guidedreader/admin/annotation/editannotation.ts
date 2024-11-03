import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

const PERMISSIONS = ["user.editAnnotation"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotationId, description } = req.body;

    if (!annotationId || !description) {
        return res.status(400).json({ error: 'Annotation ID and description are required!' });
    }

    // verify user is a superuser
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    try {
        // update the annotation
        await prisma.annotation.update({
            where: { id: annotationId },
            data: { description: description },
        });
        return res.status(200).json({ success: 'Annotation updated successfully!' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default rateLimitMiddleware(handler, { privacy: true });