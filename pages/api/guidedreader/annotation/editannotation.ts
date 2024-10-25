import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import AnnotationHelper from './utils/annotationhelper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(req.body);
    const { annotationId, annotationText } = req.body;
    console.log(annotationId);

    if (!annotationId) {
        return res.status(400).json({ error: 'Annotation ID is required!' });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }

    let annotation = await prisma.annotation.findFirst({
        where: {
            id: annotationId,
        },
    });

    if (!annotation) {
        return res.status(404).json({ error: 'Annotation not found!' });
    }

    const sanitizedDescription = AnnotationHelper.sanitizeDescription(annotationText);
    const imageLinks = AnnotationHelper.getImageLinks(sanitizedDescription);
    const imageLinkCount = imageLinks.length;

    for (const imageUrl of imageLinks) {
        try {
            const { isValid, message } = await AnnotationHelper.fetchImageDimensions(imageUrl);

            if (!isValid) {
                return res.status(400).json({ error: message });
            }

        } catch (error) {
            return res.status(400).json({ error: 'Failed to fetch image dimensions!' });
        }
    }

    const { isValid, message } = AnnotationHelper.isDescriptionValid(sanitizedDescription);
    if (!isValid) {
        return res.status(400).json({ error: message });
    }

    // get maximum image count from annotation helper
    let maxImageCount = AnnotationHelper.MAX_IMAGE_COUNT;
    if (imageLinkCount > maxImageCount) {
        return res.status(400).json({ error: `Max ${maxImageCount} images allowed in annotation description!` });
    }

    try {
        annotation = await prisma.annotation.update({
            where: { id: annotationId },
            data: { description: sanitizedDescription },
        });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to update annotation! Please try again!', details: error.message });
    }

    return res.status(200).json(annotation);
}

export default rateLimitMiddleware(handler);