"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TodoList from '../components/TodoList';
import getSupabaseClient, { isSupabaseConfigured } from '../lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If Supabase is configured and the user isn't signed in, redirect to /signin
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!user) router.push('/signin');
    })();
  }, [router]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto">
        <TodoList />
      </div>
    </div>
  );
}
