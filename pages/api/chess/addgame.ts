import prisma from './prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const gameData = JSON.parse(req.body);
    const newGame = await prisma.game.create({
        data: gameData
    })
    res.json(newGame);
}