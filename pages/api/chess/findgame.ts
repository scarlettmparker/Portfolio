import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const gameId = JSON.parse(req.body);
    const game = await prisma.game.findUnique({
        where: {
            id: gameId,
        },
    });

    if (game) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
};