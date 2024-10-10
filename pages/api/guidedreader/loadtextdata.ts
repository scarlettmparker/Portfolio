import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const textId = req.body.textId;

    try {
        // fetch the text data from the database, filter annotations from restricted and banned users
        const textObject = await prisma.textObject.findFirst({
            where: { id: textId },
            include: {
                text: {
                    include: {
                        annotations: {
                            where: {
                                user: {
                                    NOT: {
                                        discordId: {
                                            in: await prisma.user.findMany({
                                                where: {
                                                    OR: [
                                                        { RestrictedUser: { isNot: null } },
                                                        { BannedUser: { isNot: null } }
                                                    ]
                                                },
                                                select: { discordId: true }
                                            }).then(users => users.map(user => user.discordId))
                                        }
                                    }
                                }
                            },
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (textObject) {
            res.status(200).json(textObject);
        } else {
            res.status(404).json({ error: 'Text not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default rateLimitMiddleware(handler);
