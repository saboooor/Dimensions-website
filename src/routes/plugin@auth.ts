import { QwikAuth$ } from '@auth/qwik';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Discord from '@auth/qwik/providers/discord';
import { getDB } from '~/util/db';

import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// This is a temporary secret, in case the env variable is not set
const tempsecret = Math.random().toString(36).slice(2);

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  (event: any) => {
    let secret = event?.platform?.env?.AUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      console.error('AUTH_SECRET is not set, using a temporary secret');
      secret = tempsecret;
    }
    const db = getDB();

    return {
      providers: [
        Discord({
          profile(profile: Record<string, any>) {
            let imageUrl: string;
            if (!profile.avatar) {
              const defaultAvatarNumber =
                profile.discriminator === '0'
                  ? Number(BigInt(String(profile.id)) >> BigInt(22)) % 6
                  : parseInt(String(profile.discriminator || '0'), 10) % 5;
              imageUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
            } else {
              const format = String(profile.avatar).startsWith('a_')
                ? 'gif'
                : 'png';
              imageUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
            }
            return {
              id: String(profile.id),
              name: String(profile.global_name ?? profile.username ?? ''),
              username: String(profile.username ?? ''),
              email: String(profile.email ?? ''),
              image: imageUrl,
            };
          },
        }),
      ],
      adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
        authenticatorsTable: undefined,
      }),
      trustHost: true,
      secret,
      callbacks: {
        async signIn({ user, account, profile }) {
          if (account?.provider === 'discord' && profile) {
            try {
              const p = profile as Record<string, any>;
              if (p.avatar && user.id) {
                const avatarHash = String(p.avatar);
                const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
                const newImageUrl = `https://cdn.discordapp.com/avatars/${p.id}/${avatarHash}.${format}`;
                user.image = newImageUrl;

                await db
                  .update(users)
                  .set({ image: newImageUrl })
                  .where(eq(users.id, user.id));
              }
            } catch (error) {
              console.error(
                'Failed to refresh Discord profile picture on sign in:',
                error
              );
            }
          }
          return true;
        },
        session({ session }) {
          const { id, name, email, image } = session.user;

          return {
            expires: session.expires,
            user: {
              id,
              name,
              email,
              image,
            },
          };
        },
      },
    };
  }
);
