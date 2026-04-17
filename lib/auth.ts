import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DefaultSession } from "next-auth";

// Track Discord userIds whose accounts have been deleted.
// This Set is in-process only (resets on server restart) — acceptable since
// deleted accounts are meant to re-register anyway.
const deletedUserIds = new Set<string>();

export function markUserDeleted(discordUserId: string) {
  deletedUserIds.add(discordUserId);
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
        return token;
      }
      // Session restoration from cookie — check if this Discord user was deleted.
      // If so, return null to force re-auth and prevent silent account recreation.
      if (token.sub && deletedUserIds.has(token.sub)) {
        return null;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};
