"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import getSupabaseClient, { isSupabaseConfigured } from '../lib/supabase';
import type { Todo } from './types';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';

import ConfirmationModal from './ConfirmationModal';
import EditTodoModal from './EditTodoModal';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

type SupabaseTodo = {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  detail?: string | null;
  inserted_at?: string;
};
const TodoList: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [todoToDeleteId, setTodoToDeleteId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');

  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const userId = user?.id || user?.email || 'anon';

  const { data: todos = [], isPending, isError, error } = useQuery<Todo[], Error>({
    queryKey: ['todos', userId],
    enabled: !!user,
      queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('todos').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []).map((t) => ({ id: t.id, userId: 0, title: t.title, completed: t.completed, detail: (t as any).detail ?? '' }));
    },
    staleTime: 5 * 60 * 1000,
  });

  

  const updateTodoMutation = useMutation<Todo, Error, Todo>({
    mutationFn: async (updatedTodo) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('todos').update({ title: updatedTodo.title, completed: updatedTodo.completed, detail: (updatedTodo as any).detail ?? '' }).eq('id', updatedTodo.id).select().single();
      if (error) throw error;
      return { id: data.id, userId: 0, title: data.title, completed: data.completed } as Todo;
    },
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData<Todo[]>(['todos', userId], (oldTodos) =>
        oldTodos?.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
      );
      toast.success('Todo updated successfully!');
      setIsEditModalOpen(false);
      setTodoToEdit(null);
    },
    onError: (err) => {
      toast.error(`Error updating todo: ${err.message}`);
    },
  });

  const addTodoMutation = useMutation<Todo, Error, { title: string }>({
    mutationFn: async ({ title }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('todos').insert([{ title, completed: false, user_id: userId }]).select().single();
      if (error) throw error;
      return { id: data.id, userId: 0, title: data.title, completed: data.completed } as Todo;
    },
    onSuccess: (newTodo) => {
      queryClient.setQueryData<Todo[]>(['todos', userId], (old = []) => [newTodo, ...old]);
      toast.success('Todo added');
    },
    onError: (err) => toast.error(`Error adding todo: ${err.message}`),
  });

  const deleteTodoMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Todo[]>(['todos', userId], (oldTodos) => oldTodos?.filter((todo) => todo.id !== id));
      toast.success('Todo deleted successfully!');
      setIsConfirmModalOpen(false);
      setTodoToDeleteId(null);
    },
    onError: (err) => {
      toast.error(`Error deleting todo: ${err.message}`);
    },
  });

  

  const handleToggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      updateTodoMutation.mutate({ ...todo, completed: !todo.completed });
    }
  };

  const handleAddTodo = (title: string) => {
    if (!user) return toast.error('Please sign in first');
    if (!title.trim()) return;
    addTodoMutation.mutate({ title });
  };

  const signIn = async () => {
    if (!email) return setMessage('Please enter your email');
    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setMessage('Supabase is not configured.');
        setAuthLoading(false);
        return;
      }
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setMessage('Error sending link: ' + error.message);
      else setMessage('Check your email for the magic link.');
    } catch (e: any) {
      setMessage('Error: ' + (e?.message || String(e)));
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleDeleteClick = (id: number) => {
    setTodoToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (todoToDeleteId !== null) deleteTodoMutation.mutate(todoToDeleteId);
  };

  const handleEditClick = (todo: Todo) => {
    setTodoToEdit(todo);
    setIsEditModalOpen(true);
  };

  const handleUpdateTodo = (id: number, title: string, completed: boolean) => {
    if (todoToEdit) updateTodoMutation.mutate({ ...todoToEdit, title, completed });
  };

  const filteredAndSearchedTodos = useMemo(() => {
    let filtered = todos;
    if (filterStatus === 'completed') filtered = filtered.filter((t) => t.completed);
    else if (filterStatus === 'active') filtered = filtered.filter((t) => !t.completed);
    if (searchTerm) filtered = filtered.filter((todo) => todo.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [todos, searchTerm, filterStatus]);

  useEffect(() => setCurrentPage(1), [searchTerm, filterStatus]);

  // Supabase auth: get session and subscribe to changes
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.warn('Error reading supabase session', e);
      }

      if (isSupabaseConfigured) {
        const sup = getSupabaseClient();
        const { data: sub } = sup.auth.onAuthStateChange((_event: any, session: any) => {
          setUser(session?.user ?? null);
        });

        return () => {
          mounted = false;
          try { sub.subscription.unsubscribe(); } catch (e) { /* noop */ }
        };
      }
      return () => { mounted = false; };
    }

    const cleanupPromise = init();
    return () => { mounted = false; cleanupPromise.then((cleanup: any) => { if (typeof cleanup === 'function') cleanup(); }).catch(() => {}); };
  }, []);

  // Realtime subscription: listen to changes in todos for this user and update cache
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    const chan = supabase
      .channel(`public:todos:user=${userId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const ev = (payload as any).eventType || (payload as any).type || '';
          const recordNew = (payload as any).new as SupabaseTodo | null;
          const recordOld = (payload as any).old as SupabaseTodo | null;
        const record = recordNew || recordOld;
        queryClient.setQueryData<Todo[]>(['todos', userId], (old = []) => {
          if (!record) return old;
          if (ev === 'INSERT') {
              const newTodo: Todo = { id: record.id, userId: 0, title: record.title, completed: record.completed, detail: record.detail ?? '' };
            return [newTodo, ...old.filter((t) => t.id !== newTodo.id)];
          }
          if (ev === 'UPDATE') {
              return old.map((t) => (t.id === record.id ? { id: record.id, userId: 0, title: record.title, completed: record.completed, detail: record.detail ?? '' } : t));
          }
          if (ev === 'DELETE') {
            return old.filter((t) => t.id !== record.id);
          }
          return old;
        });
      })
      .subscribe();

    return () => {
      try { chan?.unsubscribe(); } catch (e) { /* noop */ }
    };
  }, [user, userId, queryClient]);

  const totalPages = Math.ceil(filteredAndSearchedTodos.length / ITEMS_PER_PAGE);
  const paginatedTodos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSearchedTodos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSearchedTodos, currentPage]);

  if (isPending) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error?.message || 'Failed to fetch todos from Supabase.'} />;

  return (
    <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 sm:p-6 rounded-xl shadow-lg min-h-[50vh]">
      {!user ? (
        <div className="auth-box mb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Sign in</h2>
          <p className="muted text-sm">Enter your email to receive a magic link (demo).</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full p-3 border rounded-lg mb-3 mt-2" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button onClick={signIn} className="btn btn-primary w-full sm:w-auto" disabled={authLoading}>{authLoading ? 'Sending...' : 'Send link'}</button>
            <p className="muted text-sm">{message}</p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Your Todos</h1>
        <Link href="/todo/new" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 sm:px-5 rounded-lg shadow-md transition-colors duration-200 w-full sm:w-auto text-center">
          Add New Todo
        </Link>
      </div>

      {isFormOpen && <TodoForm onAddTodo={handleAddTodo} onClose={() => setIsFormOpen(false)} isPending={addTodoMutation.isPending} />}

      

      <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <input type="text" placeholder="Search todos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm" aria-label="Search todos" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'active')} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm w-full sm:w-auto" aria-label="Filter todos by status">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {paginatedTodos.length === 0 ? <p className="text-center text-gray-600 text-base py-8">No todos found matching your criteria.</p> : paginatedTodos.map((todo) => <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteClick} onEdit={handleEditClick} />)}
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Delete Todo" message="Are you sure you want to delete this todo? This action cannot be undone." isPending={deleteTodoMutation.isPending} />

  {todoToEdit && <EditTodoModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setTodoToEdit(null); }} todo={todoToEdit} onSave={(id, title, completed, detail) => { if (todoToEdit) updateTodoMutation.mutate({ ...todoToEdit, title, completed, detail }); }} isPending={updateTodoMutation.isPending} />}
    </div>
  );
};

export default TodoList;
