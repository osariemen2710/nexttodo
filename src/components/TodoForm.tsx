"use client";
import React, { useState } from 'react';
import type { FormEvent } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface TodoFormProps {
  onAddTodo: (title: string) => void;
  onClose: () => void;
  isPending: boolean;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo, onClose, isPending }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTodo(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Todo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm"
            placeholder="e.g., Learn React Query"
            required
            autoFocus
            disabled={isPending}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
              disabled={isPending}
            >
              {isPending ? <LoadingSpinner size="sm" /> : 'Add Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm;
