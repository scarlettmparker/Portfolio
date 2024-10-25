import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const sizeOf = require('image-size');

const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

export class AnnotationHelper {
    static readonly MAX_IMAGE_COUNT = 3;

    static readonly MIN_CHARACTERS = 10;
    static readonly MAX_CHARACTERS = 750;
    
    // helper function to fetch a small part of the image and check dimensions
    static async fetchImageDimensions(imageUrl: string) {
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

    static sanitizeDescription(description: string) {
        return domPurify.sanitize(description);
    }

    // get image links from the description
    static getImageLinks(description: string) {
        const imageLinkRegex = /\[.*?\]\((https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|bmp)(?:\?[^\s]*)?)\)/gi;
        return [...description.matchAll(imageLinkRegex)].map(match => match[1]);
    }

    // check if the number of characters in description is within allowed bounds
    static isDescriptionValid(description: string) {
        const strippedDescription = description.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
        let minCharacters = AnnotationHelper.MIN_CHARACTERS;
        let maxCharacters = AnnotationHelper.MAX_CHARACTERS;

        if (strippedDescription.length > maxCharacters) {
            return { isValid: false, message: `Annotation is too long! Maximum annotation length is ${maxCharacters} characters!` };
        } else if (strippedDescription.length < minCharacters) {
            return { isValid: false, message: `Annotation is too short! Minimum annotation length is ${minCharacters} characters!` };
        }
        return { isValid: true };
    }
}

export default AnnotationHelper;