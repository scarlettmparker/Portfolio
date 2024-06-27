import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const username = JSON.parse(req.body);

    // use mojang api to get the uuid of the player
    const uuid = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        .then((response) => response.json())
        .then((data) => data.id);
        
    res.status(200).json({ uuid });
};