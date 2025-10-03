"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import getSupabaseClient, { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; try { sub.subscription.unsubscribe(); } catch {} };
  }, []);

  const handleSend = async () => {
    if (!email) return toast.error('Enter your email');
    if (!isSupabaseConfigured) return toast.error('Supabase not configured');
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) toast.error('Error sending link: ' + error.message);
      else toast.success('Check your email for the magic link');
    } catch (e: any) {
      toast.error('Unexpected error');
    } finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return toast.error('Supabase not configured');
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Signed out');
  };

  return (
    <header className="bg-gradient-to-r from-green-700 to-green-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-3">
          <div className="w-full sm:w-auto flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold">
              Modern Todo App
            </Link>
            <nav className="sm:hidden">
              <Link href="/" className="text-sm hover:text-green-200 transition-colors">Todos</Link>
            </nav>
          </div>

          <nav className="w-full sm:w-auto">
            <ul className="flex flex-col sm:flex-row sm:space-x-4 items-stretch sm:items-center w-full sm:w-auto">
              <li className="sm:hidden">
                <Link href="/" className="hover:text-green-200 transition-colors block py-1">Todos</Link>
              </li>
              <li className="w-full sm:w-auto">
                {!user ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="p-2 rounded text-black w-full sm:w-auto" />
                    <button onClick={handleSend} className="px-3 py-1 rounded bg-white text-green-700 font-semibold w-full sm:w-auto text-sm" disabled={loading}>{loading ? '...' : 'Sign in'}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-sm truncate max-w-[160px]">{user.email}</span>
                    <button onClick={handleSignOut} className="px-3 py-1 rounded bg-white text-green-700 font-semibold text-sm">Sign out</button>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
