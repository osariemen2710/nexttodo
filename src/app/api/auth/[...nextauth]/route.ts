import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextResponse } from 'next/server';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Demo',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Demo: accept any username/password and return a simple user object.
        if (!credentials) return null;
        const { username } = credentials as { username: string };
        if (!username) return null;
        return { id: username, name: username };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
});

export { handler as GET, handler as POST };
