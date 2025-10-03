"use client";
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import getSupabaseClient, { isSupabaseConfigured } from '../../../lib/supabase';
import type { Todo } from '../../../components/types';
import TodoForm from '../../../components/TodoForm';
import { useRouter } from 'next/navigation';

const NewTodoPage: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; try { sub.subscription.unsubscribe(); } catch {} };
  }, []);

  const userId = user?.id || user?.email || 'anon';

  const addTodoMutation = useMutation<Todo, Error, { title: string; detail?: string }>({
    mutationFn: async ({ title, detail }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('todos').insert([{ title, detail: detail ?? '', completed: false, user_id: userId }]).select().single();
      if (error) throw error;
      return { id: data.id, userId: 0, title: data.title, completed: data.completed } as Todo;
    },
    onSuccess: (newTodo) => {
      queryClient.setQueryData<Todo[]>(['todos', userId], (oldTodos) => {
        if (!oldTodos) return [newTodo];
        return [newTodo, ...oldTodos];
      });
      toast.success('Todo added successfully!');
      router.push('/');
    },
    onError: (err) => {
      toast.error(`Error adding todo: ${err.message}`);
    },
  });

  const handleAddTodo = (title: string, detail?: string) => {
    addTodoMutation.mutate({ title, detail });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Add New Todo</h1>
      <TodoForm onAddTodo={handleAddTodo} onClose={() => router.push('/')} isPending={addTodoMutation.isPending} />
    </div>
  );
};

export default NewTodoPage;
