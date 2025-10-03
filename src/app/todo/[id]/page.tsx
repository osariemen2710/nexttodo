"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { Todo } from '../../../components/types';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import getSupabaseClient from '../../../lib/supabase';

interface PageParams {
  params: { id: string };
}

export default function TodoDetailPage({ params }: PageParams) {
  const { id } = params;
  const { data: session } = useSession();
  const userId = ((session?.user as any)?.id as string) || session?.user?.email || 'anon';
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  const { data: todo, isLoading, isError, error } = useQuery<Todo, Error>({
    queryKey: ['todo', id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('todos').select('*').eq('id', id).eq('user_id', userId).single();
      if (error) throw new Error(error.message);
      return data as Todo;
    },
    enabled: !!id && !!userId,
  });

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDetail(todo.detail || '');
    }
  }, [todo]);

  const mutation = useMutation({
    mutationFn: async (updatedTodo: { title: string; detail: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('todos').update(updatedTodo).eq('id', id).eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo', id] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    mutation.mutate({ title, detail });
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error?.message || 'Failed to fetch todo details from Supabase.'} />;
  if (!todo) return <ErrorMessage message="Todo not found." />;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl mx-auto my-8 border border-gray-200">
      {isEditing ? (
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold text-gray-800 mb-4 w-full border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="text-gray-700 text-lg mb-6 w-full border-2 border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500"
            rows={4}
          />
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{todo.title}</h1>
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${todo.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Status: {todo.completed ? 'Completed' : 'Active'}
            </span>
          </div>
          <p className="text-gray-700 text-lg mb-6">{todo.detail || 'No details provided.'}</p>
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600">
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
