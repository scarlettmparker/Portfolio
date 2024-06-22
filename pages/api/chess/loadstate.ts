import prisma from './prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const gameId = JSON.parse(req.body);
    const game = await prisma.game.findUnique({
        where: {
            id: gameId,
        },
    });

    if (game) {
        res.json({ state: game.state });
    } else {
        res.json({ exists: false });
    }
};