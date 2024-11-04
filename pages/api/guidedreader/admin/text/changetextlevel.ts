import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.changeTextLevel"];
const PERMISSIONS_BULK = ["user.changeTextLevel.bulk", "user.changeTextLevel.*"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { textId, level } = req.body;

    if (!textId || !level) {
        return res.status(400).json({ error: 'Text ID and level are required!' });
    }

    const bulkChange = Array.isArray(textId) && textId.length > 1;

    // Verify user permissions
    const user = await verifyUser(req, res, PERMISSIONS);
    if (!user) {
        return;
    }

    if (bulkChange) {
        const bulkUser = await verifyUser(req, res, PERMISSIONS_BULK);
        if (!bulkUser) {
            return res.status(403).json({ error: 'Insufficient permissions for bulk change!' });
        }
    }

    try {
        if (bulkChange) {
            for (const id of textId) {
                await updateTextLevel(id, level);
            }
        } else {
            await updateTextLevel(textId[0], level);
        }

        return res.status(200).json({ success: 'Text level(s) updated successfully!' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function updateTextLevel(textId: number, level: string) {
    // Update the textObject level
    await prisma.textObject.updateMany({
        where: { text: { some: { id: textId } } },
        data: { level: level },
    });
}

export default rateLimitMiddleware(handler, { privacy: true });