import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["text.deleteText"];
const PERMISSIONS_BULK = ["text.deleteText.bulk", "text.deleteText.*"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { textId } = req.body;

    if (!textId) {
        return res.status(400).json({ error: 'Text ID is required!' });
    }

    const bulkDelete = Array.isArray(textId);

    // verify user permissions
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    // verify user permissions for bulk delete
    if (bulkDelete) {
        const bulkUser = await verifyUser(req, res, PERMISSIONS_BULK);
        if (!bulkUser) {
            return res.status(403).json({ error: 'Insufficient permissions for bulk delete!' });
        }
    }

    try {
        if (bulkDelete) {
            for (const id of textId) {
                await deleteTextAndAnnotations(id);
            }
        } else {
            await deleteTextAndAnnotations(textId);
        }

        return res.status(200).json({ success: 'Text(s) deleted successfully!' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function deleteTextAndAnnotations(textId: number) {
    // delete annotations related to the text
    await prisma.annotation.deleteMany({
        where: { textId: textId },
    });

    const deletedText = await prisma.text.delete({
        where: { id: textId },
    });

    // check if there are any other texts in the textObject
    const remainingTexts = await prisma.text.findMany({
        where: { textObjectId: deletedText.textObjectId },
    });

    // if no other texts, delete the textobject
    if (remainingTexts.length === 0) {
        await prisma.textObject.delete({
            where: { id: deletedText.textObjectId },
        });
    }
}

export default rateLimitMiddleware(handler, { privacy: true });