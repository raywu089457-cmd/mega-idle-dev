import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { UserRepository } from "@/lib/repositories/UserRepository";

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
    async session({ session, token }: any) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
        return token;
      }
      // Session restoration — only invalidate token if user was explicitly soft-deleted.
      // Do NOT return null if user doesn't exist yet (allows Discord OAuth first-time flow).
      if (token.sub) {
        await connectDB();
        const user = await UserRepository.findById(token.sub);
        // Only destroy token if user exists AND is soft-deleted
        if (user && user.deletedAt) return null;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};
