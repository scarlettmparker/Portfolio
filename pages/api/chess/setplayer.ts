import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const { id, player, modifier } = JSON.parse(req.body);
    
    if (!id || !player || modifier === undefined) {
        res.status(400).send('Missing required fields');
        return;
    }

    const updateData: { player0?: boolean; player1?: boolean } = {};
    if (player === "player0") {
        updateData.player0 = modifier;
    } else if (player === "player1") {
        updateData.player1 = modifier;
    } else {
        res.status(400).send('Invalid player specified');
        return;
    }

    const updatedGame = await prisma.game.update({
        where: {
            id: id,
        },
        data: updateData,
    });

    if (updatedGame) {
        res.status(200).json(updatedGame);
    } else {
        res.status(404).send('Game not found');
    }
};