import getSupabaseClient, { isSupabaseConfigured } from '../../../../lib/supabase';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
// NOTE: we intentionally don't import Supabase client at module top-level to avoid
// creating a client during build time when env vars may be missing. We'll require
// it lazily in runtime handlers below.

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        // lazy import to avoid creating a supabase client during build-time
        const supabaseModule = await import('@/lib/supabase');
        const { isSupabaseConfigured, default: getSupabaseClient } = supabaseModule as any;
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured; cannot send magic link');
          return;
        }
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: url,
          },
        });

        if (error) {
          console.error('Error sending magic link:', error);
          return;
        }

        console.log('Magic link sent to:', email);
      },
    }),
  ],
  // Not using a database adapter here. If you want to persist sessions/users in Supabase,
  // add an adapter at runtime (but avoid importing the adapter at module-eval time to
  // prevent build-time URL validation errors).
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
});

export { handler as GET, handler as POST };

