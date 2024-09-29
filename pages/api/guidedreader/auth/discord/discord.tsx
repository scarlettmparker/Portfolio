import { NextApiRequest, NextApiResponse } from 'next';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const GREEK_LEARNING_GUILD_ID = '350234668680871946';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // Exchange the code for an access token
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

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    const { access_token, token_type } = tokenData;

    const guildsResponse = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    const guilds = await guildsResponse.json();
    if (!guildsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch user guilds' });
    }

    const isInGreekLearningGuild = guilds.some((guild: any) => guild.id === GREEK_LEARNING_GUILD_ID);

    if (isInGreekLearningGuild) {
      return res.status(200).json({ message: 'Authenticated successfully. You are in the Greek Learning Guild!' });
    } else {
      return res.status(403).json({ error: 'You are not a member of the Greek Learning Guild' });
    }
    
  } catch (error) {
    console.error('Error during Discord OAuth:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
