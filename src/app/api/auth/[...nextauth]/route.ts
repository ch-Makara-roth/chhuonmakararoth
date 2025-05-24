
import NextAuth, { type NextAuthOptions, type User as NextAuthUser, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma'; 
import bcrypt from 'bcryptjs';


if (typeof prisma === 'undefined') {
  console.error('[NextAuthRoute] CRITICAL: Prisma client imported as UNDEFINED at module level.');
} else {
  console.log('[NextAuthRoute] Prisma client imported successfully at module level.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<string, string> | undefined): Promise<NextAuthUser | null> {
        console.log('[NextAuth Authorize] Entered authorize function.');

        if (typeof prisma === 'undefined') {
          console.error('[NextAuth Authorize] CRITICAL: Prisma client is UNDEFINED at the start of authorize function!');
          return null;
        }
        console.log('[NextAuth Authorize] Prisma client appears to be defined.');

        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth Authorize] Missing credentials.');
          return null;
        }
        console.log('[NextAuth Authorize] Credentials received for email:', credentials.email);

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log('[NextAuth Authorize] User not found for email:', credentials.email);
            return null;
          }
          console.log('[NextAuth Authorize] User found:', {id: user.id, email: user.email, name: user.name });

          if (!user.hashedPassword) {
            console.log('[NextAuth Authorize] User found but has no hashed password:', user.email);
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isValidPassword) {
            console.log('[NextAuth Authorize] Invalid password for user:', credentials.email);
            return null;
          }

          console.log('[NextAuth Authorize] Login successful for user:', credentials.email);
          
          return { id: user.id, name: user.name, email: user.email };
        } catch (e: unknown) {
          let errorMessage = 'Error during authorization process';
          if (e instanceof Error) {
            errorMessage = `${errorMessage}: ${e.message}`;
          }
          console.error(errorMessage, e);
          return null; 
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser | undefined }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.name = user.name; 
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null | undefined; 
        session.user.email = token.email as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', 
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
