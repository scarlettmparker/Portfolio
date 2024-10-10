import prisma from '../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcrypt';
import rateLimitMiddleware from "@/middleware/rateLimiter";

const SALT_ROUNDS = 10;
const DISCORD_USER_URL = 'https://discord.com/api/users/@me';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { username, auth, avatar, nickname, levels, discordId } = req.body;
    const currentTime = Math.floor(Date.now() / 1000);

    // ensure request body is valid and sanitize inputs
    if (!username || !auth || !levels || !discordId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedAvatar = avatar ? avatar.trim() : null;
    const sanitizedNickname = nickname ? nickname.trim() : null;
    const sanitizedLevels = Array.isArray(levels) ? levels.map(level => level.trim()) : [];

    // hash the auth token
    const hashedAuth = await bcrypt.hash(auth, SALT_ROUNDS);

    // verify the user's token with discord
    try {
        const response = await fetch(DISCORD_USER_URL, {
            headers: {
                Authorization: `Bearer ${auth}`,
            },
        });

        // if verification fails return an unauthorized response
        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid access token' });
        }

        // check if the user is banned
        let bannedUser = await prisma.bannedUser.findFirst({
            where: {
                discordId: discordId,
            },
        });

        if (bannedUser) {
            return res.status(403).json({ error: 'User is banned. Reason: ' + bannedUser.reason });
        }

        // proceed with user creation or update
        let user = await prisma.user.findUnique({
            where: {
                discordId: discordId,
            },
        });

        if (!user) {
            // user doesn't exist, create the user
            user = await prisma.user.create({
                data: {
                    username: sanitizedUsername,
                    levels: sanitizedLevels,
                    auth: hashedAuth,
                    avatar: sanitizedAvatar,
                    nickname: sanitizedNickname,
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
                    username: sanitizedUsername,
                    levels: sanitizedLevels,
                    auth: hashedAuth,
                    avatar: sanitizedAvatar,
                    nickname: sanitizedNickname,
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
    } catch (error) {
        console.error('Error during Discord user verification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default rateLimitMiddleware(handler);
