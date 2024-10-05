import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcrypt';
import rateLimitMiddleware from "@/middleware/rateLimiter";

const SALT_ROUNDS = 10;

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { username, auth, avatar, nickname, levels, discordId } = req.body;
    const currentTime = Math.floor(Date.now() / 1000);

    console.log('Received body:', req.body);
    console.log('Auth token:', auth);

    // ensure request body is valid
    if (!username || !auth || !levels || !discordId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // hash the uath token
    const hashedAuth = await bcrypt.hash(auth, SALT_ROUNDS);

    // check if the user already exists
    let user = await prisma.user.findUnique({
        where: {
            discordId: discordId,
        },
    });

    if (!user) {
        // user doesn't exist, create the user
        user = await prisma.user.create({
            data: {
                username: username,
                levels: levels,
                auth: hashedAuth,
                avatar: avatar,
                nickname: nickname,
                discordId: discordId,
                accountCreationDate: currentTime,
            }
        });
        if (!user) {
            return res.status(500).json({ error: 'Failed to create user' });
        }
    } else {
        // user exists, update the user
        user = await prisma.user.update({
            where: {
                discordId: discordId,
            },
            data: {
                username: username,
                levels: levels,
                auth: hashedAuth,
                avatar: avatar,
                nickname: nickname,
            }
        });
        if (!user) {
            return res.status(500).json({ error: 'Failed to update user' });
        }
    }

    // verify the user's token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ message: 'User logged in successfully', user: user });
}

export default rateLimitMiddleware(handler);