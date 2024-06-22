import prisma from './prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const {id, state} = JSON.parse(req.body);

    const updatedData = {state: state};
    const updatedGame = await prisma.game.update({
        where: {
            id: id,
        },
        data: updatedData
    });

    if (updatedGame) {
        res.status(200).json(updatedGame);
    } else {
        res.status(404).send('Game not found');
    }
}