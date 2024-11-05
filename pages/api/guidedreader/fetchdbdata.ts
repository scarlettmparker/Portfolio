import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const textObjects = await prisma.textObject.findMany({
      select: {
        id: true,
        title: true,
        level: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const textObjectsWithAudio = await Promise.all(
      textObjects.map(async textObject => {
        const textCount = await prisma.text.count({
          where: {
            textObjectId: textObject.id,
            audio: {
              isNot: null,
            },
          },
        });
        return {
          ...textObject,
          audio: textCount > 0,
        };
      })
    );

    res.status(200).json(textObjectsWithAudio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text objects' });
  }
};

export default rateLimitMiddleware(handler);