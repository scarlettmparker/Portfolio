import prisma from '../../prismaclient';
import { parse } from 'cookie';

export async function verifyUser(req: any, res: any, permissions: string[] = []) {
    // get the token from the request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        res.status(401).json({ error: 'Unauthorized! Please try logging in again.' });
        return null;
    }

    // get the user from the token
    const user = await prisma.user.findFirst({
        where: { auth: token },
    });

    if (!user) {
        res.status(401).json({ error: 'Unauthorized! User not found.' });
        return null;
    }

    // ensure the user is a superuser
    const superUser = await prisma.superUser.findFirst({
        where: {
            discordId: user.discordId,
        },
    });

    if (!superUser && !permissions.every((perm: string) => user.permissions.includes(perm))) {
        res.status(403).json({ error: 'Unauthorized! User does not have required permissions!' });
        return null;
    }

    return user;
}