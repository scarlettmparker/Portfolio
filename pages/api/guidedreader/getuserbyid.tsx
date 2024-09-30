import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    console.log(userId);
    if (!userId) {
        res.status(400).json({ error: 'Invalid userID' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { username: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error });
    }
}