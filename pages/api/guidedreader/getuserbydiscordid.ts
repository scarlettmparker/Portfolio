import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    // check if the userID is valid
    if (!userId) {
        res.status(400).json({ error: 'Invalid userID' });
        return;
    }

    try {
        // get the user by ID along with annotations
        const user = await prisma.user.findUnique({
            where: { discordId: userId as string },
            select: {
                avatar: true,
                nickname: true,
                username: true,
                levels: true,
                annotations: {
                    select: {
                        likes: true,
                        dislikes: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // calculate the number of annotations and total votes
        const numAnnotations = user.annotations.length;

        console.log(user.annotations);
        const totalVotes = user.annotations.reduce((acc, annotation) => acc + (annotation.likes - annotation.dislikes), 0);
        console.log(totalVotes);

        res.status(200).json({
            user: {
                avatar: user.avatar,
                nickname: user.nickname,
                username: user.username,
                levels: user.levels,
                numAnnotations: numAnnotations,
                totalVotes: totalVotes,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error });
    }
}

export default rateLimitMiddleware(handler);