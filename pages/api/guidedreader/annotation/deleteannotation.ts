import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotationId } = req.body;

    if (!annotationId) {
        return res.status(400).json({ error: 'Annotation ID is required!' });
    }

    // actually properly get the token (whoopsie)
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

    // find the matching annotation
    let annotation = await prisma.annotation.findUnique({
        where: {
            id: annotationId,
        },
    });
    
    if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found!' });
    }

    // ensure the user is the owner of the annotation
    if (annotation.userId !== user.id) {
        return res.status(401).json({ error: 'Unauthorized! User ID does not match.' });
    }

    try {
        // check if there are any user interactions
        const interactions = await prisma.userAnnotationInteraction.findMany({
            where: { annotationId: annotationId },
        });

        // delete user interactions if they exist
        if (interactions.length > 0) {
            await prisma.userAnnotationInteraction.deleteMany({
                where: { annotationId: annotationId },
            });
        }

        await prisma.annotation.delete({
            where: { id: annotationId },
        });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to delete annotation! Please try again!', details: error.message });
    }

    return res.status(200).json({ message: 'Annotation deleted successfully!' });
}

export default rateLimitMiddleware(handler);