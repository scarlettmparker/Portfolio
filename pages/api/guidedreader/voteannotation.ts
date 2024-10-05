import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotationId, userId, isLike } = req.body;

    // get token from request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let annotation = await prisma.annotation.findUnique({
        where: { id: annotationId },
    });

    if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found' });
    }

    // check if user has already interacted with this annotation
    let interaction = await prisma.userAnnotationInteraction.findUnique({
        where: {
            userId_annotationId: {
                userId: userId,
                annotationId: annotationId,
            },
        },
    });

    if (isLike) {
        if (interaction) {
            if (interaction.type === 'LIKE') {
                // remove like
                await prisma.userAnnotationInteraction.delete({
                    where: { id: interaction.id },
                });
                await prisma.annotation.update({
                    where: { id: annotationId },
                    data: { likes: { decrement: 1 } },
                });
            } else {
                // change dislike to like
                await prisma.userAnnotationInteraction.update({
                    where: { id: interaction.id },
                    data: { type: 'LIKE' },
                });
                // increment likes and decrement dislikes
                await prisma.annotation.update({
                    where: { id: annotationId },
                    data: {
                        likes: { increment: 1 },
                        dislikes: { decrement: 1 },
                    },
                });
            }
        } else {
            // create new like interaction
            await prisma.userAnnotationInteraction.create({
                data: {
                    userId: userId,
                    annotationId: annotationId,
                    type: 'LIKE',
                },
            });
            // increment likes
            await prisma.annotation.update({
                where: { id: annotationId },
                data: { likes: { increment: 1 } },
            });
        }
    } else {
        if (interaction) {
            if (interaction.type === 'DISLIKE') {
                // remove dislike
                await prisma.userAnnotationInteraction.delete({
                    where: { id: interaction.id },
                });
                await prisma.annotation.update({
                    where: { id: annotationId },
                    data: { dislikes: { decrement: 1 } },
                });
            } else {
                // change like to dislike
                await prisma.userAnnotationInteraction.update({
                    where: { id: interaction.id },
                    data: { type: 'DISLIKE' },
                });
                // increment dislikes and decrement likes
                await prisma.annotation.update({
                    where: { id: annotationId },
                    data: {
                        likes: { decrement: 1 },
                        dislikes: { increment: 1 },
                    },
                });
            }
        } else {
            // create new dislike interaction
            await prisma.userAnnotationInteraction.create({
                data: {
                    userId: userId,
                    annotationId: annotationId,
                    type: 'DISLIKE',
                },
            });
            // increment dislikes
            await prisma.annotation.update({
                where: { id: annotationId },
                data: { dislikes: { increment: 1 } },
            });
        }
    }

    return res.status(200).json({ message: 'Success' });
}

export default rateLimitMiddleware(handler);