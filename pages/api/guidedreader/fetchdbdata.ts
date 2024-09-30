import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const textObjects = await prisma.textObject.findMany({
      include: {
        text: {
          include: {
            annotations: true,
          },
        },
      },
    });
    res.status(200).json(textObjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text objects' });
  }
};