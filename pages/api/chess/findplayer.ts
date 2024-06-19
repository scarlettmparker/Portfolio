import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const { id, player } = JSON.parse(req.body);
    const game = await prisma.game.findUnique({
        where: {
            id: id,
        },
    });

    if (game) {
        if (player == "player0") {
            res.json({player: game.player0 != false});
        } else if (player == "player1") {
            res.json({player: game.player1 != false});
        }
    }
};