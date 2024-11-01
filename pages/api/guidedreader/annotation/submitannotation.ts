import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import AnnotationHelper from './utils/annotationhelper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { start, end, description, userId, textId, creationDate } = req.body;

    // get token from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }

    const user = await prisma.user.findFirst({
        where: { auth: token },
    });

    // check if the user exists
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized! User not found.' });
    } else {
        // check if the user is restricted (can't post annotations)
        let restrictedUser = await prisma.restrictedUser.findFirst({
            where: {
                discordId: user.discordId,
            },
        });

        if (restrictedUser) {
            return res.status(403).json({ error: 'User is restricted. Reason: ' + restrictedUser.reason });
        }
    }

    if (user.id !== userId) {
        return res.status(401).json({ error: 'Unauthorized! User ID does not match.' });
    }

    // check if the user has already submitted an annotation for the text
    let existingAnnotation = await prisma.annotation.findFirst({
        where: {
            userId: userId,
            textId: textId,
            start: start,
            end: end,
        },
    });

    if (existingAnnotation) {
        return res.status(409).json({ error: 'You have already submitted an annotation for this section!' });
    }

    // sanitize the description
    const sanitizedDescription = AnnotationHelper.sanitizeDescription(description);

    // count the number of links that lead to an image in the sanitized description
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

    let annotation;
    try {
        annotation = await prisma.annotation.create({
            data: {
                start: start,
                end: end,
                description: sanitizedDescription,
                userId: userId,
                textId: textId,
                creationDate: creationDate,
            }
        });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create annotation! Please try again!', details: error.message });
    }

    return res.status(200).json(annotation);
}

export default rateLimitMiddleware(handler, { privacy: true });