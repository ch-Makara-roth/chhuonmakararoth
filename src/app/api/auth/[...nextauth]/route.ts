
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma'; // Prisma client import
import bcrypt from 'bcryptjs';

// Log immediately after import to check prisma's status at module load time
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
      async authorize(credentials, req) {
        console.log('[NextAuth Authorize] Entered authorize function.');

        if (typeof prisma === 'undefined') {
          console.error('[NextAuth Authorize] CRITICAL: Prisma client is UNDEFINED at the start of authorize function!');
          // Returning null will lead to an auth error, but the root cause is Prisma initialization failure.
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
          // Return user object that NextAuth expects
          return { id: user.id, name: user.name, email: user.email }; // Ensure name is included
        } catch (error: any) {
          console.error('[NextAuth Authorize] Error during authorization process:', error.message, error.stack);
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
    async jwt({ token, user }) {
      // Persist the user id, name, and email to the token right after signin
      if (user) {
        token.id = user.id;
        token.name = user.name; // Ensure name is passed to token
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like user id, name, and email.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null | undefined; // Ensure name is correctly typed
        session.user.email = token.email as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
