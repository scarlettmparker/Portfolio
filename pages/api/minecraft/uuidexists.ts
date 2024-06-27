import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const username = JSON.parse(req.body);
    const uuidmatch = await prisma.minecraftUsername.findFirst({
        where: {
            username,
        },
        select: {
            minecraftPlayerId: true,
            MinecraftPlayer: { // navigate the relationship to fetch the UUID
                select: {
                    uuid: true,
                }
            }
        }
    });

    if (uuidmatch && uuidmatch.MinecraftPlayer) {
        res.json({ exists: true, uuid: uuidmatch.MinecraftPlayer.uuid });
    } else {
        res.json({ exists: false });
    }
};