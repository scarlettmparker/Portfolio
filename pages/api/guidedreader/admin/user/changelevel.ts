import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';

// permissions needed to access this path
const PERMISSIONS = ["user.changeLevel"];
const OVERRIDE_PERMISSIONS = ["user.changeLevel.override"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    // validate query parameters
    let { discordId, currentLevel, level, override } = req.body;

    console.log(discordId, currentLevel, level, override);
    let bypassLevel = null;

    if (!discordId || typeof discordId !== 'string' || !level || typeof level !== 'string') {
        return res.status(400).json({ error: "Invalid query parameters" });
    }

    // ensure user has correct override permissions
    const override_perms = override ? PERMISSIONS.concat(OVERRIDE_PERMISSIONS) : PERMISSIONS;
    const user = await verifyUser(req, res, override_perms);
    if (!user) {
        return;
    }

    // if override, add the override prefix to the level
    if (override) {
        bypassLevel = `L-BYPASS-${level}`;
    }

    try {
        // fetch the user from the database
        const updateUser = await prisma.user.findUnique({
            where: { discordId }
        });

        if (!updateUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // remove "L-BYPASS-" prefix from user's levels if present
        const cleanedLevels = updateUser.levels.map(level =>
            level.startsWith("L-BYPASS-") ? level.replace("L-BYPASS-", "") : level
        );

        // find and replace currentLevel with new level
        const levelIndex = cleanedLevels.indexOf(currentLevel);
        if (levelIndex === -1) {
            return res.status(400).json({ error: "Current level not found" });
        }
        cleanedLevels[levelIndex] = bypassLevel || level;

        // update the user's levels in the database
        await prisma.user.update({
            where: { discordId },
            data: { levels: cleanedLevels }
        });

        return res.status(200).json({ success: true, level });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export default rateLimitMiddleware(handler, { privacy: true });