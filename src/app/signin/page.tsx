"use client";
import { useState } from 'react';
import getSupabaseClient, { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) return toast.error('Please enter your email');
    if (!isSupabaseConfigured) return toast.error('Supabase not configured');
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) toast.error('Error sending link: ' + error.message);
      else toast.success('Check your email for the magic link');
    } catch (e: any) {
      toast.error('Unexpected error: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <p className="muted mb-4">Enter your email to receive a magic link.</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg mb-3" type="email" placeholder="you@example.com" />
      <div className="flex gap-2">
        <button onClick={handleSend} className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send link'}</button>
      </div>
    </div>
  );
}
