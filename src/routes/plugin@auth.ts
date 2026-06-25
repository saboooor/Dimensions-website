import { QwikAuth$ } from "@auth/qwik";
import Discord from "@auth/qwik/providers/discord";
import { eq } from "drizzle-orm";
import { getDB, users } from "~/lib/db";

// Extend Session type to include user ID
declare module "@auth/qwik" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const tempSecret = Math.random().toString(36).slice(2);

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$((event) => {
  let secret = event.env.get("AUTH_SECRET");
  if (!secret) {
    console.warn("AUTH_SECRET is not set, using a temporary secret");
    secret = tempSecret;
  }

  return {
    providers: [
      Discord({
        clientId: event.env.get("DISCORD_CLIENT_ID") || "",
        clientSecret: event.env.get("DISCORD_CLIENT_SECRET") || "",
        profile(profile) {
          if (profile.avatar === null) {
            const defaultAvatarNumber =
              profile.discriminator === "0"
                ? Number(BigInt(profile.id) >> BigInt(22)) % 6
                : parseInt(profile.discriminator) % 5;
            profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
          } else {
            const format = profile.avatar.startsWith("a_") ? "gif" : "png";
            profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
          }
          return {
            id: profile.id,
            name: profile.global_name ?? profile.username,
            username: profile.username,
            email: profile.email,
            image: profile.image_url,
          };
        },
      }),
    ],
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
    },
    trustHost: true,
    secret,
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "discord" && profile && user.email) {
          const db = getDB(event);
          const discordTag = `${(profile as any).username}#${(profile as any).discriminator || "0"}`;
          const discordId = (profile as any).id;
          const discordAccountStr = `${discordTag} (${discordId})`;
          const avatarUrl = user.image || "";

          try {
            // Check if user exists in local database by email
            const existingUser = await db.query.users.findFirst({
              where: eq(users.email, user.email),
            });

            if (existingUser) {
              // Update Discord linkage and profile picture if changed
              await db
                .update(users)
                .set({
                  discordAccount: discordAccountStr,
                  profileImage: avatarUrl || existingUser.profileImage,
                  name: user.name ?? existingUser.name,
                  image: avatarUrl || existingUser.image,
                })
                .where(eq(users.id, existingUser.id))
                .run();

              // Use existing local user UUID as the Auth.js user ID
              user.id = existingUser.id;
            } else {
              // Automatically register a new user using Discord details
              let username = (profile as any).username || "discord_user";

              // Ensure username is unique in database
              let isUnique = false;
              let suffix = "";
              let attempts = 0;
              while (!isUnique && attempts < 10) {
                const candidate = username + suffix;
                const check = await db.query.users.findFirst({
                  where: eq(users.username, candidate),
                });
                if (!check) {
                  username = candidate;
                  isUnique = true;
                } else {
                  attempts++;
                  suffix = Math.floor(Math.random() * 1000).toString();
                }
              }

              const newId = crypto.randomUUID();

              await db
                .insert(users)
                .values({
                  id: newId,
                  name: user.name,
                  email: user.email,
                  image: avatarUrl,
                  username,
                  rank: "",
                  badges: "[]",
                  points: 0,
                  enabledAds: 1,
                  disabledAds: 0,
                  lastAdClaim: "0000-00-00",
                  ingameCosmetics:
                    '{"postIgnitePortal":"NOTHING","postUsePortal":"NOTHING","postDestroyPortal":"NOTHING","onPortalTick":"NOTHING"}',
                  discordAccount: discordAccountStr,
                  minecraftAccount: "",
                  verifiedPaypal: "",
                  profileImage: avatarUrl,
                })
                .run();

              user.id = newId;
            }
          } catch (err) {
            console.error("Error in Discord signIn callback:", err);
            return false; // Reject login if registration fails
          }
        }
        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.id) {
          session.user.id = token.id as string;
        }
        return session;
      },
    },
  };
});
