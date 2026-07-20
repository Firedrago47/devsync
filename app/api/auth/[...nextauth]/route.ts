import NextAuth, { type NextAuthOptions, type Account } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 12,
  },

  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }): Promise<JWT> {
      if (user) {
        token.userId = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Capture provider id_token when available (Google returns id_token JWT)
      if (account?.id_token) {
        token.idToken = account.id_token as unknown as string;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        session.user.id = token.userId as string;
      }

      const authToken = await encode({
        token,
        secret: process.env.NEXTAUTH_SECRET!,
      });

      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        authToken: authToken as string | undefined,
        // Expose provider id_token (if present) for client consumption — this is a standard JWT
        idToken: token.idToken as string | undefined,
      };
    },
  },
  pages: {
    signIn: "/auth",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
