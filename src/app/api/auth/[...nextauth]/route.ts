// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password", placeholder: "password" }
      },
      async authorize(credentials, req) {
        // IMPORTANT: THIS IS NOT SECURE FOR PRODUCTION.
        // Replace this with actual user validation against a database.
        // Passwords should be hashed and compared securely.
        if (credentials?.username === 'admin' && credentials?.password === 'password') {
          // Any object returned will be saved in `user` property of the JWT
          return { id: '1', name: 'Admin User', email: 'admin@example.com' }; // Add more user info if needed
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', // Redirect users to our custom login page
    // error: '/auth/error', // Custom error page (optional)
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and name to the token right after signin
      if (user) {
        token.id = user.id;
        // token.name = user.name; // Already handled by default
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        session.user.id = token.id as string;
        // session.user.name = token.name; // Already handled by default
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
