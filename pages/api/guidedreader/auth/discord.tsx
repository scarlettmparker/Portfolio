import { NextApiRequest, NextApiResponse } from 'next';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const GREEK_LEARNING_GUILD_ID = '350234668680871946';

// discord oauth endpoints
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const GREEK_LEARNING_ROLES = `https://discord.com/api/users/@me/guilds/${GREEK_LEARNING_GUILD_ID}/member`;

// role type
type Role = {
  name: string;
  id: number;
  hex: string;
};

// list of roles in greek learning
const ROLES: Role[] = [
  { name: 'GR | Native', id: 350483752490631181, hex: '#2535e6' },
  { name: 'Non Learner', id: 352001527780474881, hex: '#fcdf68' },
  { name: 'A1 | Beginner', id: 351117824300679169, hex: '#54de8e' },
  { name: 'A2 | Elementary', id: 351117954974482435, hex: '#29ccb6' },
  { name: 'B1 | Intermediate', id: 350485376109903882, hex: '#f5a640' },
  { name: 'B2 | Upper Intermediate', id: 351118486426091521, hex: '#ff776b' },
  { name: 'C1 | Advanced', id: 350485279238258689, hex: '#f25289' },
  { name: 'C2 | Fluent', id: 350483489461895168, hex: '#7ea5d6' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        redirect_uri: 'http://localhost:3000/api/guidedreader/auth/discord',
      }),
    });

    // if the token request fails, return an error
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    const { access_token, token_type } = tokenData;

    // fetch the user's guilds
    const guildsResponse = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    // if the guilds request fails, return an error
    const guilds = await guildsResponse.json();
    if (!guildsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch user guilds' });
    }

    // check if the user is in the Greek Learning Guild and return their roles
    const isInGreekLearningGuild = guilds.some((guild: any) => guild.id === GREEK_LEARNING_GUILD_ID);
    if (isInGreekLearningGuild) {
      const rolesResponse = await fetch(GREEK_LEARNING_ROLES, {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      });

      // if the roles request fails, return an error
      const roles = await rolesResponse.json();
      if (!rolesResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch user roles' });
      } else {
        roles.roles.forEach((role: any) => {
          // check if the user has any of the required roles to contribute to texts
          const roleData = ROLES.find(r => r.id == role);
          if (roleData) {
            return res.status(200).json({ message: `Role: ${roleData.name}, ID: ${roleData.id}, Hex: ${roleData.hex}` });
          } else {
            return res.status(403).json({ error: 'You have none of the required roles to contribute to texts.' });
          }
        });
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
