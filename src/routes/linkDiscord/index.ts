import { type RequestHandler } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import { getDB, users } from '~/util/db';
import { getSessionUserId } from '~/util/auth';

export const onGet: RequestHandler = async (requestEvent) => {
  const code = requestEvent.url.searchParams.get('code');
  const userId = getSessionUserId(requestEvent);

  if (!userId) {
    throw requestEvent.redirect(302, '/login?error=auth_required');
  }

  if (!code) {
    throw requestEvent.redirect(
      302,
      `/profile/${userId}?error=discord_no_code`
    );
  }

  const clientId = requestEvent.env.get('DISCORD_CLIENT_ID') || '';
  const clientSecret = requestEvent.env.get('DISCORD_CLIENT_SECRET') || '';
  const redirectUri = requestEvent.env.get('DISCORD_REDIRECT_URI') || '';

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
    const db = getDB(requestEvent);
    await db
      .update(users)
      .set({
        discordAccount: `${discordTag} (${discordId})`,
      })
      .where(eq(users.id, userId));

    throw requestEvent.redirect(
      302,
      `/profile/${userId}?success=discord_linked`
    );
  } catch (err) {
    console.error('Discord OAuth failed', err);
    throw requestEvent.redirect(
      302,
      `/profile/${userId}?error=discord_link_failed`
    );
  }
};
