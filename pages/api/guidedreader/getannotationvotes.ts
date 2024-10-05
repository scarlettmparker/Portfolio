import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotationId, userId } = req.body;

    // get the interaction data from the database
    const interaction = await prisma.userAnnotationInteraction.findUnique({
        where: {
            userId_annotationId: {
                userId: userId,
                annotationId: annotationId
            }
        }
    });

    if (interaction) {
        // returns LIKE or DISLIKE
        res.status(200).json({ interactionType: interaction.type });
    } else {
        res.status(200).json({ interactionType: 'NONE' });
    }
}

export default rateLimitMiddleware(handler);