import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import AnnotationHelper from './utils/annotationhelper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { annotationId, annotationText } = req.body;

    if (!annotationId) {
        return res.status(400).json({ error: 'Annotation ID is required!' });
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