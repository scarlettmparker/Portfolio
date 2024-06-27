import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const data = JSON.parse(req.body);
    let username = data.username;
    let uuid = data.uuid;
}