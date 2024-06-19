import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const gameData = JSON.parse(req.body);
    const newGame = await prisma.game.create({
        data: gameData
    })
    res.json(newGame);
}