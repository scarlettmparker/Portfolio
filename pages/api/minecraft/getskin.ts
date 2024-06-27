import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const uuid = JSON.parse(req.body);

    // use mojang api to get the uuid of the player
    const skin = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
        .then((response) => response.json())
        .then((data) => data.properties);
        
    res.status(200).json({ skin });
};