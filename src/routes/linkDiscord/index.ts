import { type RequestHandler } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import { getDB, users } from '~/util/db';
import { Session } from '@auth/qwik';

export const onGet: RequestHandler = async (requestEvent) => {
  const { url, redirect, env, sharedMap } = requestEvent;
  const code = url.searchParams.get('code');
  const session = sharedMap.get('session') as Session;
  const userId = session?.user?.id;

  if (!userId) {
    throw redirect(302, '/login?error=auth_required');
  }

  if (!code) {
    throw redirect(302, '/profile?error=discord_no_code');
  }

  const clientId = env.get('AUTH_DISCORD_ID') || '';
  const clientSecret = env.get('AUTH_DISCORD_SECRET') || '';
  const redirectUri = env.get('DISCORD_REDIRECT_URI') || '';

  try {
    // 1. Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord token exchange failed', errorData);
      throw new Error('Failed to exchange Discord code');
    }

    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Discord user profile');
    }

    const discordUser = (await userResponse.json()) as any;
    const discordTag = `${discordUser.username}#${discordUser.discriminator || '0'}`;
    const discordId = discordUser.id;

    // 3. Update user's discord account in database
    const db = getDB();
    await db
      .update(users)
      .set({
        discordAccount: `${discordTag} (${discordId})`,
      })
      .where(eq(users.id, userId));

    throw redirect(302, '/profile?success=discord_linked');
  } catch (err) {
    console.error('Discord OAuth failed', err);
    throw redirect(302, '/profile?error=discord_link_failed');
  }
};
