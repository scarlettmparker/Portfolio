import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    // check if the userID is valid
    if (!userId) {
        res.status(400).json({ error: 'Invalid userID' });
        return;
    }

    try {
        // get the user by ID
        const user = await prisma.user.findUnique({
            where: { discordId: userId as string },
            select: {
                avatar: true,
                nickname: true,
                username: true,
                levels: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ user: user });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error });
    }
}