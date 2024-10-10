import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimitMiddleware from "@/middleware/rateLimiter";
const sizeOf = require('image-size');

// create a dompurify instance with jsdom
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

// helper function to fetch a small part of the image and check dimensions
const fetchImageDimensions = async (imageUrl: string) => {
    try {
        const response = await fetch(imageUrl, { method: 'GET' });
        if (!response.ok) {
            throw new Error('Failed to fetch one of the images!');
        }

        // fetch only the first chunk of data to minimize resource usage
        const buffer = Buffer.from(await response.arrayBuffer());
        const dimensions = sizeOf(buffer);

        // check if the dimensions are valid (max 1:3 or 3:1 ratio)
        const { width, height } = dimensions;
        if (width / height > 3 || height / width > 3) {
            return { isValid: false, message: 'Image dimensions ratio should not exceed 1:4 (w:h) or 4:1 (h:w)!' };
        }

        return { isValid: true };
    } catch (error) {
        return { isValid: false, message: 'Failed to fetch image dimensions!' };
    }
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { start, end, description, userId, textId, creationDate } = req.body;

    // get token from request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
    }

    // sanitize the description
    const sanitizedDescription = domPurify.sanitize(description);

    // count the number of links that lead to an image in the sanitized description
    const imageLinkRegex = /\[.*?\]\((https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|bmp)(?:\?[^\s]*)?)\)/gi;
    const imageLinks = [...sanitizedDescription.matchAll(imageLinkRegex)].map(match => match[1]);
    const imageLinkCount = imageLinks.length;

    for (const imageUrl of imageLinks) {
        try {
            const { isValid, message } = await fetchImageDimensions(imageUrl);

            if (!isValid) {
                return res.status(400).json({ error: message });
            }

        } catch (error) {
            return res.status(400).json({ error: 'Failed to fetch image dimensions!' });
        }
    }

    const strippedDescription = sanitizedDescription.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');

    // check description is valid
    if (imageLinkCount > 3) {
        return res.status(400).json({ error: 'Max 3 images allowed in annotation description!' });
    }
    if (strippedDescription.length > 750) {
        return res.status(400).json({ error: 'Annotation is too long! Maximum annotation length is 750 characters!' });
    } else if (strippedDescription.length < 15) {
        return res.status(400).json({ error: 'Annotation is too short! Minimum annotation length is 15 characters!' });
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

export default rateLimitMiddleware(handler);
