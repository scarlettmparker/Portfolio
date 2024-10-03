import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const textId = req.body.textId;

    try {
        // fetch the text data from the database
        const textObject = await prisma.textObject.findFirst({
            where: { id: textId },
            include: {
                text: {
                    include: {
                        annotations: true,
                    },
                },
            },
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