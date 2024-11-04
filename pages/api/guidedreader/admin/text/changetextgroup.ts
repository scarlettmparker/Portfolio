import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.changeTextGroup"];
const PERMISSIONS_BULK = ["user.changeTextGroup.bulk", "user.changeTextGroup.*"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { textId, groupId } = req.body;

    const bulkChange = Array.isArray(textId) && textId.length > 1;

    // verify user permissions
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
                await updateTextGroup(id, groupId);
            }
        } else {
            await updateTextGroup(textId[0], groupId);
        }

        return res.status(200).json({ success: 'Text group(s) updated successfully!' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function updateTextGroup(textId: number, group: number) {
    // update the text group
    await prisma.text.updateMany({
        where: { id: textId },
        data: { textGroupId: group },
    });
}

export default rateLimitMiddleware(handler, { privacy: true });