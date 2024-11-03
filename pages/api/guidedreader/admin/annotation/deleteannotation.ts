import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// because permissions change etc
function getRequiredPermissions(annotationCount: number, totalAnnotations: number): string[] {
    if (annotationCount === totalAnnotations) {
        return PERMISSIONS_ALL;
    } else if (annotationCount > 1) {
        return PERMISSIONS_BULK;
    }
    return PERMISSIONS;
}

// permissions needed to access this path
const PERMISSIONS = ["user.deleteAnnotation"];
const PERMISSIONS_BULK = ["user.deleteAnnotation.bulk", "user.deleteAnnotation.*"];
const PERMISSIONS_ALL = ["user.deleteAnnotation.all", "user.deleteAnnotation.*"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotations } = req.body;

    if (!Array.isArray(annotations)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const textId = annotations[0][1];
    const annotationCount = annotations.length;

    // count number of annotations for text
    const totalAnnotations = await prisma.annotation.count({
        where: { textId: textId }
    });

    let requiredPermissions = getRequiredPermissions(annotationCount, totalAnnotations);

    // verify user is a superuser
    const user = await verifyUser(req, res, requiredPermissions);
    if (!user) {
        return;
    }

    try {
        for (const [annotationId, textId] of annotations) {
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

            // delete the annotation
            await prisma.annotation.delete({
                where: {
                    id: annotationId,
                    textId: textId
                }
            });
        }
        return res.status(200).json({ message: 'Annotations deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to delete annotations' });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });