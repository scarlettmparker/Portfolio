import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'nookies';
import roles from '../../../guidedreader/data/roles.json';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import prisma from '../../prismaclient';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URL = process.env.NEXT_DISCORD_REDIRECT_URL;
const GREEK_LEARNING_GUILD_ID = '350234668680871946';
const DISCORD_USER_INFO_URL = 'https://discord.com/api/users/@me';

// discord oauth endpoints
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const GREEK_LEARNING_ROLES = `https://discord.com/api/users/@me/guilds/${GREEK_LEARNING_GUILD_ID}/member`;

// role type
type Role = {
  name: string;
  id: string;
  hex: string;
};

// list of roles in greek learning
const ROLES: Role[] = roles;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // exchange the code for an access token
    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code: code.toString(),
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URL!,
      }),
    });

    // if the token request fails, return an error
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    const { access_token, token_type } = tokenData;

    // Fetch user information to get the Discord user ID
    const userInfoResponse = await fetch(DISCORD_USER_INFO_URL, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    // if the user info request fails, return an error
    if (!userInfoResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch user information' });
    }

    const userInfo = await userInfoResponse.json();
    const discordUserId = userInfo.id;

    // fetch the user's guilds
    const guildsResponse = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    // if the guilds request fails, return an error
    if (!guildsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch user guilds' });
    }

    const guilds = await guildsResponse.json();

    // check if the user is in the Greek Learning Guild and return their roles
    const isInGreekLearningGuild = guilds.some((guild: any) => guild.id === GREEK_LEARNING_GUILD_ID);

    let bypassUser = await prisma.bypassUser.findFirst({
      where: {
        discordId: discordUserId
      },
    });

    if (bypassUser && !isInGreekLearningGuild) {
      // create a template user for bypassed users
      const createUser = await fetch('http://localhost:3000/api/guidedreader/auth/adduser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          username: userInfo.username,
          auth: access_token,
          avatar: userInfo.avatar,
          nickname: userInfo.username,
          levels: ['352001527780474881'],
          discordId: userInfo.id,
        }),
      });

      // if the user creation fails, return an error
      if (!createUser.ok) {
        const createUserError = await createUser.json();
        return res.status(500).json({ error: createUserError.error });
      }

      // if the user is created successfully, set the session token and redirect to /guidedreader
      const userData = await createUser.json();
      const sessionToken = userData.user.auth;

      setCookie({ res }, 'token', sessionToken, {
        maxAge: 3 * 24 * 60 * 60, // 3 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // no client side access to the cookie
        path: '/',
      });

      // redirect to /guidedreader after successful login
      return res.redirect(302, '/guidedreader');
    }

    if (isInGreekLearningGuild) {
      const rolesResponse = await fetch(GREEK_LEARNING_ROLES, {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      });

      if (!rolesResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch user roles' });
      }

      // if the roles request fails, return an error
      const roles = await rolesResponse.json();
      let userRoles: Role[] = [];
      roles.roles.forEach((role: any) => {
        // check if the user has any of the required roles to contribute to texts
        const roleData = ROLES.find(r => r.id == role);
        if (roleData) {
          userRoles.push(roleData);
        }
      });

      if (userRoles.length > 0) {
        const createUser = await fetch('http://localhost:3000/api/guidedreader/auth/adduser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            username: roles.user.username,
            auth: access_token,
            avatar: roles.user.avatar,
            nickname: roles.nick,
            levels: userRoles.map(role => role.id.toString()),
            discordId: roles.user.id,
          }),
        });

        // if the user creation fails, return an error
        if (!createUser.ok) {
          const createUserError = await createUser.json();
          return res.status(500).json({ error: createUserError.error });
        }

        // if the user is created successfully, set the session token and redirect to /guidedreader
        const userData = await createUser.json();
        const sessionToken = userData.user.auth;

        setCookie({ res }, 'token', sessionToken, {
          maxAge: 3 * 24 * 60 * 60, // 3 days
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true, // no client side access to the cookie
          path: '/',
        });

        // redirect to /guidedreader after successful login
        return res.redirect(302, '/guidedreader');
      } else {
        return res.status(403).json({ error: 'You do not have the required roles to contribute to texts' });
      }
    } else {
      return res.status(403).json({ error: 'You are not a member of the Greek Learning Guild' });
    }
  } catch (error) {
    // handle any errors that occur during oauth
    console.error('Error during Discord OAuth:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default rateLimitMiddleware(handler);