import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Track userIds whose accounts have been deleted.
// Keyed by auth type so we can invalidate the right JWT sessions.
// Discord: numeric snowflake. Email: email_<ts>_<random>.
const deletedDiscordUserIds = new Set<string>();
const deletedEmailUserIds = new Set<string>();

export function markUserDeleted(userId: string, authProvider: "discord" | "email") {
  if (authProvider === "discord") {
    deletedDiscordUserIds.add(userId);
  } else {
    deletedEmailUserIds.add(userId);
  }
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
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "電子郵件", type: "email" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await (User as any).findByEmail(credentials.email);
        if (!user || !user.passwordHash) return null;
        const valid = await user.verifyPassword(credentials.password);
        if (!valid) return null;
        return {
          id: user.userId,
          name: user.username,
          email: user.email,
        };
      },
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
      // Session restoration from cookie — check if this user was deleted.
      // If so, return null to force re-auth and prevent silent account recreation.
      if (token.sub) {
        const isDeleted =
          deletedDiscordUserIds.has(token.sub) ||
          deletedEmailUserIds.has(token.sub);
        if (isDeleted) return null;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};
